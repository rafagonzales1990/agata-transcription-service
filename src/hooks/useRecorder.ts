import { useState, useRef, useCallback, useEffect } from 'react';

export type RecordingSource = 'mic' | 'mic+tab';
export type RecorderState = 'idle' | 'recording' | 'stopped';

export function useRecorder() {
  const [state, setState] = useState<RecorderState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [resultFile, setResultFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const start = useCallback(async (source: RecordingSource) => {
    setError(null);
    setResultFile(null);
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
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        setError('Permita o acesso ao microfone nas configurações do navegador');
        return;
      }
      streamsRef.current.push(micStream);

      let finalStream = micStream;

      if (source === 'mic+tab') {
        try {
          const displayStream = await navigator.mediaDevices.getDisplayMedia({
            audio: true,
            video: false,
          });
          streamsRef.current.push(displayStream);

          // Mix both audio streams
          const ctx = new AudioContext();
          const dest = ctx.createMediaStreamDestination();
          ctx.createMediaStreamSource(micStream).connect(dest);
          ctx.createMediaStreamSource(displayStream).connect(dest);
          finalStream = dest.stream;
          streamsRef.current.push(finalStream);

          // If user stops screen share, stop recording
          displayStream.getAudioTracks()[0]?.addEventListener('ended', () => {
            stop();
          });
        } catch {
          // User cancelled display media — fall back to mic only silently
        }
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
    start,
    stop,
    cancel,
    reset,
  };
}
