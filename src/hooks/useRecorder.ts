import { useState, useRef, useCallback, useEffect } from 'react';

export type RecordingSource = 'mic' | 'mic+tab';
export type RecorderState = 'idle' | 'recording' | 'stopped';

export interface DeviceMismatchInfo {
  mismatch: boolean;
  defaultLabel?: string;
  commsLabel?: string;
}

export function useRecorder() {
  const [state, setState] = useState<RecorderState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [resultFile, setResultFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deviceMismatch, setDeviceMismatch] = useState<DeviceMismatchInfo | null>(null);
  const [silenceWarning, setSilenceWarning] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamsRef = useRef<MediaStream[]>([]);

  const isMobile = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;

  const cleanup = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    streamsRef.current.forEach(s => s.getTracks().forEach(t => t.stop()));
    streamsRef.current = [];
    recorderRef.current = null;
  }, []);

  // Warn before leaving while recording
  useEffect(() => {
    if (state !== 'recording') return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [state]);

  const getAudioDevices = useCallback(async (): Promise<MediaDeviceInfo[]> => {
    try {
      // Must request permission first to get device labels
      await navigator.mediaDevices.getUserMedia({ audio: true })
        .then(s => s.getTracks().forEach(t => t.stop()));
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(d => d.kind === 'audioinput');
    } catch {
      return [];
    }
  }, []);

  const checkDeviceMismatch = useCallback(async (): Promise<DeviceMismatchInfo> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const outputs = devices.filter(d => d.kind === 'audiooutput');
      const defaultDevice = outputs.find(d => d.deviceId === 'default');
      const commsDevice = outputs.find(d => d.deviceId === 'communications');

      if (!defaultDevice || !commsDevice || !defaultDevice.label || !commsDevice.label) {
        setDeviceMismatch(null);
        return { mismatch: false };
      }

      const normalize = (label: string) =>
        label.replace(/^(Default|Communications)\s*-\s*/i, '').trim().toLowerCase();

      const mismatch = normalize(defaultDevice.label) !== normalize(commsDevice.label);
      const result: DeviceMismatchInfo = {
        mismatch,
        defaultLabel: defaultDevice.label.replace(/^(Default|Communications)\s*-\s*/i, '').trim(),
        commsLabel: commsDevice.label.replace(/^(Default|Communications)\s*-\s*/i, '').trim(),
      };
      setDeviceMismatch(result);
      return result;
    } catch {
      setDeviceMismatch(null);
      return { mismatch: false };
    }
  }, []);

  const start = useCallback(async (source: RecordingSource, deviceId?: string) => {
    setError(null);
    setResultFile(null);
    setSilenceWarning(false);
    chunksRef.current = [];
    setElapsed(0);

    try {
      // Check MediaRecorder support
      if (typeof MediaRecorder === 'undefined') {
        setError('Seu navegador não suporta gravação. Use o Chrome ou baixe o arquivo de áudio manualmente.');
        return;
      }

      let micStream: MediaStream;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: deviceId ? { deviceId: { exact: deviceId } } : true,
        });
      } catch {
        setError('Permita o acesso ao microfone nas configurações do navegador');
        return;
      }
      streamsRef.current.push(micStream);

      let finalStream: MediaStream;

      if (source === 'mic+tab') {
        try {
          const displayStream = await navigator.mediaDevices.getDisplayMedia({
            audio: true,
            video: {
              width: 1,
              height: 1,
              frameRate: 1,
            },
          });
          // Stop video track immediately — we only want audio
          displayStream.getVideoTracks().forEach(t => t.stop());
          streamsRef.current.push(displayStream);

          if (displayStream.getAudioTracks().length === 0) {
            // No audio track — fall back to mic only silently
            displayStream.getTracks().forEach(t => t.stop());
            const ctx = new AudioContext();
            await ctx.resume();
            const dest = ctx.createMediaStreamDestination();
            ctx.createMediaStreamSource(micStream).connect(dest);
            finalStream = dest.stream;
            streamsRef.current.push(finalStream);
          } else {
            // Mix both audio streams
            const ctx = new AudioContext();
            await ctx.resume();
            const dest = ctx.createMediaStreamDestination();
            ctx.createMediaStreamSource(micStream).connect(dest);
            const displaySource = ctx.createMediaStreamSource(displayStream);
            displaySource.connect(dest);
            finalStream = dest.stream;
            streamsRef.current.push(finalStream);

            // Monitor apenas o áudio da tela/sistema (não o mic) nos
            // primeiros segundos, para detectar silêncio (indício de
            // divergência entre dispositivo padrão e de comunicações)
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 512;
            displaySource.connect(analyser);
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            let maxLevel = 0;
            const silenceCheckStart = Date.now();
            const checkInterval = setInterval(() => {
              analyser.getByteTimeDomainData(dataArray);
              const peak = Math.max(...Array.from(dataArray).map(v => Math.abs(v - 128)));
              maxLevel = Math.max(maxLevel, peak);
              if (Date.now() - silenceCheckStart > 4000) {
                clearInterval(checkInterval);
                if (maxLevel < 2) {
                  setSilenceWarning(true);
                }
              }
            }, 250);

            // If user stops screen share, stop recording
            displayStream.getAudioTracks()[0]?.addEventListener('ended', () => {
              stop();
            });
          }
        } catch {
          // User cancelled display media — fall back to mic only via AudioContext
          const ctx = new AudioContext();
          await ctx.resume();
          const dest = ctx.createMediaStreamDestination();
          ctx.createMediaStreamSource(micStream).connect(dest);
          finalStream = dest.stream;
          streamsRef.current.push(finalStream);
        }
      } else {
        // Mic-only: wrap in AudioContext to ensure active stream
        const ctx = new AudioContext();
        await ctx.resume();
        const dest = ctx.createMediaStreamDestination();
        ctx.createMediaStreamSource(micStream).connect(dest);
        finalStream = dest.stream;
        streamsRef.current.push(finalStream);
      }

      // Pick best supported mime type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/webm';

      const recorder = new MediaRecorder(finalStream, { mimeType });
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const file = new File([blob], `gravacao-reuniao.${ext}`, { type: mimeType });

        // Auto-save backup to disk
        const backupUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = backupUrl;
        a.download = `agata-backup-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.${ext}`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(backupUrl), 1000);

        setResultFile(file);
        setState('stopped');
        cleanup();
      };

      recorder.start(1000); // collect chunks every second
      setState('recording');

      // Start timer
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 500);

    } catch (err: any) {
      setError(err.message || 'Erro ao iniciar gravação');
      cleanup();
    }
  }, [cleanup]);

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
  }, []);

  const cancel = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    chunksRef.current = [];
    setResultFile(null);
    setState('idle');
    setElapsed(0);
    cleanup();
  }, [cleanup]);

  const reset = useCallback(() => {
    setResultFile(null);
    setState('idle');
    setElapsed(0);
    setError(null);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return {
    state,
    elapsed,
    formattedTime: formatTime(elapsed),
    resultFile,
    error,
    isMobile,
    deviceMismatch,
    silenceWarning,
    start,
    stop,
    cancel,
    reset,
    getAudioDevices,
    checkDeviceMismatch,
  };
}
