import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Upload, Mic, ClipboardPaste, CheckCircle, Loader2, AlertTriangle, Headphones, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { LimitReachedDialog } from '@/components/LimitReachedDialog';
import { UsageBanner } from '@/components/UsageBanner';
import { useUsage } from '@/hooks/useUsage';
import { useAtaTemplates } from '@/hooks/useAtaTemplates';
import { useRecorder } from '@/hooks/useRecorder';
import { useProjects } from '@/hooks/useProjects';
import { eventFirstTranscription, trackUploadStarted, trackFirstTranscription } from '@/lib/gtag';
import { MEETING_TEMPLATES, MEETING_TEMPLATE_GROUPS } from '@/lib/meetingTemplates';

const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);

    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const duration = audio.duration;
      if (!isFinite(duration) || isNaN(duration) || duration <= 0) {
        resolve(0); // unknown duration, skip limit check
      } else {
        resolve(Math.ceil(duration / 60));
      }
    };

    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };

    // Timeout fallback — some files never fire onloadedmetadata
    setTimeout(() => {
      URL.revokeObjectURL(url);
      resolve(0);
    }, 3000);

    audio.src = url;
  });
};

const tabs = [
  { id: 'upload' as const, label: 'Upload', icon: Upload },
  { id: 'record' as const, label: 'Gravar', icon: Mic },
  { id: 'paste' as const, label: 'Colar Texto', icon: ClipboardPaste },
];

export default function UploadPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const routineId = searchParams.get('routineId');
  const prefillTitle = searchParams.get('title');
  const usage = useUsage();
  const { templates: ataTemplates, defaultTemplate } = useAtaTemplates();
  const { projects } = useProjects();
  const recorder = useRecorder();
  const [activeTab, setActiveTab] = useState<'upload' | 'record' | 'paste'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [location, setLocation] = useState('');
  const [responsible, setResponsible] = useState('');
  const [participants, setParticipants] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedAtaTemplateId, setSelectedAtaTemplateId] = useState('__default__');
  const [meetingType, setMeetingType] = useState('geral');
  const [selectedProjectId, setSelectedProjectId] = useState('__none__');
  const [durationModalOpen, setDurationModalOpen] = useState(false);
  const [detectedDuration, setDetectedDuration] = useState(0);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  const limitReached = usage.isAtLimit;
  const remainingMinutes = Math.max(0, usage.limits.maxTotalMinutesMonth - usage.totalMinutesTranscribed);

  // When recording finishes, feed file into upload flow
  useEffect(() => {
    if (prefillTitle && !title) setTitle(prefillTitle);
  }, [prefillTitle, title]);

  useEffect(() => {
    if (recorder.resultFile) {
      setFile(recorder.resultFile);
      setActiveTab('upload');
      toast.success('Gravação finalizada! Iniciando transcrição...');
      recorder.reset();
    }
  }, [recorder.resultFile]);

  // Show recorder errors
  useEffect(() => {
    if (recorder.error) toast.error(recorder.error);
  }, [recorder.error]);

  // Load audio devices when record tab is active
  useEffect(() => {
    if (activeTab === 'record') {
      recorder.getAudioDevices().then(devices => {
        setAudioDevices(devices);
        if (devices.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(devices[0].deviceId);
        }
      });
    }
  }, [activeTab]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback(() => setIsDragging(false), []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  }, []);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (limitReached) return;
    trackUploadStarted();

    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) { toast.error('Você precisa estar logado'); return; }

    if (activeTab === 'paste') {
      if (!pastedText.trim()) { toast.error('Cole algum texto'); return; }
      setUploading(true);
      setStatusMessage('Salvando transcrição...');
      try {
        const defaultTitle = title || 'Transcrição colada';
        const participantsList = participants ? participants.split(',').map(p => p.trim()).filter(Boolean) : [];
      const { error } = await supabase.from('Meeting').insert({
          userId: user.id, title: defaultTitle, fileName: 'texto-colado.txt',
          fileSize: new Blob([pastedText]).size, cloudStoragePath: '', status: 'completed',
          transcription: pastedText, visibility: 'private', description: description || null,
          meetingDate: meetingDate ? new Date(meetingDate).toISOString() : null,
          meetingTime: meetingTime || null, location: location || null,
           responsible: responsible || null, participants: participantsList, routineId: routineId || null,
           ataTemplate: meetingType,
           projectId: selectedProjectId !== '__none__' ? selectedProjectId : null,
         });
        if (error) throw error;
        toast.success('Transcrição salva!');
        navigate('/meetings');
      } catch (err: any) {
        toast.error(err.message || 'Erro ao salvar');
      } finally { setUploading(false); }
      return;
    }

    if (activeTab === 'upload' && !file) return;
    if (file && file.size > 500 * 1024 * 1024) { toast.error('Arquivo muito grande. O limite é 500MB.'); setUploading(false); return; }

    // Pre-upload duration check against plan limits
    if (file && usage.limits.maxTotalMinutesMonth < 999999) {
      const durationMin = await getAudioDuration(file);
      if (durationMin > 0 && durationMin > remainingMinutes) {
        setDetectedDuration(durationMin);
        setDurationModalOpen(true);
        return;
      }
    }

    if (file && file.size > 100 * 1024 * 1024) toast.info('Arquivo grande (acima de 100MB). A transcrição pode levar alguns minutos.');

    setUploading(true); setUploadProgress(0); setStatusMessage('Enviando arquivo...');

    try {
      const storagePath = `${user.id}/${Date.now()}-${file!.name}`;
      setUploadProgress(5);

      // For large files, simulate progress (SDK doesn't expose real progress)
      let progressInterval: ReturnType<typeof setInterval> | null = null;
      if (file!.size > 50 * 1024 * 1024) {
        const estimatedSeconds = Math.max(10, file!.size / (500 * 1024));
        const startTime = Date.now();
        progressInterval = setInterval(() => {
          const elapsed = (Date.now() - startTime) / 1000;
          const percent = Math.min(45, Math.round((elapsed / estimatedSeconds) * 45) + 5);
          setUploadProgress(percent);
          const uploaded = (file!.size * percent / 100 / 1024 / 1024).toFixed(0);
          const total = (file!.size / 1024 / 1024).toFixed(0);
          setStatusMessage(`Enviando ${uploaded}MB de ${total}MB...`);
        }, 500);
      }

      try {
        const { error: uploadError } = await supabase.storage.from('meetings').upload(storagePath, file!, { cacheControl: '3600', upsert: false });
        if (progressInterval) clearInterval(progressInterval);
        if (uploadError) throw new Error(`Erro no upload: ${uploadError.message}`);
      } catch (err) {
        if (progressInterval) clearInterval(progressInterval);
        throw err;
      }

      setUploadProgress(50); setStatusMessage('Criando registro...');

      const meetingId = crypto.randomUUID();
      const now = new Date().toISOString();
      const defaultTitle = title || file!.name.replace(/\.[^/.]+$/, '');
      const participantsList = participants ? participants.split(',').map(p => p.trim()).filter(Boolean) : [];

      const { error: insertError } = await supabase.from('Meeting').insert({
        id: meetingId, userId: user.id, title: defaultTitle, fileName: file!.name,
        fileSize: file!.size, fileDuration: 0, cloudStoragePath: storagePath,
        status: 'processing', visibility: 'private', description: description || null,
        meetingDate: meetingDate ? new Date(meetingDate).toISOString() : null,
        meetingTime: meetingTime || null, location: location || null,
        responsible: responsible || null, participants: participantsList,
        routineId: routineId || null, createdAt: now, updatedAt: now,
        fileExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        ataTemplateId: selectedAtaTemplateId !== '__default__' && selectedAtaTemplateId !== '__customize__' ? selectedAtaTemplateId : null,
        ataTemplate: meetingType,
        projectId: selectedProjectId !== '__none__' ? selectedProjectId : null,
      });
      if (insertError) throw new Error(`Erro ao criar reunião: ${insertError.message}`);
      setUploadProgress(70); setStatusMessage('Processando transcrição...');

      const { data: fnData, error: fnError } = await supabase.functions.invoke('transcribe', { body: { meetingId, storagePath } });
      // Treat 202 (accepted for async processing) as success
      const isAsync = fnData && !fnError;
      if (fnError && !(fnError as any)?.status?.toString().startsWith('2')) {
        await supabase.from('Meeting').update({ status: 'failed', errorMessage: fnError.message, updatedAt: new Date().toISOString() }).eq('id', meetingId);
        if (fnError.message?.includes('429') || (fnError as any).status === 429) {
          toast.error('Limite de transcrições por hora atingido. Aguarde 1 hora.');
        } else {
          toast.error(`Transcrição falhou: ${fnError.message}`);
        }
        navigate('/meetings');
        return;
      }

      setUploadProgress(100); setStatusMessage('Transcrição enviada!');
      eventFirstTranscription();
      trackFirstTranscription();
      toast.success('Transcrição iniciada! Acompanhe o progresso na lista de reuniões.');
      setTimeout(() => navigate('/meetings'), 1000);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Erro inesperado');
    } finally { setUploading(false); }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nova Transcrição</h1>
          <p className="text-muted-foreground">Envie um áudio, grave ou cole o texto da reunião</p>
          {routineId && <p className="text-sm text-primary mt-1">📌 Vinculada a uma rotina</p>}
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
          <span className="text-lg leading-none mt-0.5">🧩</span>
          <div className="text-sm text-emerald-900">
            Sabia que você pode gravar reuniões diretamente do Chrome?{' '}
            Instale a extensão Ágata e transcreva sem sair da reunião.{' '}
            <a href="https://chromewebstore.google.com/detail/hhefgnokghkmeekjjpaipjmfhnhbnpjb" target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 hover:underline">
              Instalar extensão →
            </a>
          </div>
        </div>

        <UsageBanner isNearLimit={usage.isNearLimit} isAtLimit={usage.isAtLimit} planId={usage.limits.planId} />

        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setFile(null); }} disabled={uploading || recorder.state === 'recording'}
              className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors',
                activeTab === tab.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            {activeTab === 'upload' && (
              <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                className={cn('border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
                  isDragging ? 'border-primary bg-emerald-50' : 'border-border hover:border-primary/50', file && 'border-primary bg-emerald-50')}
                onClick={() => !uploading && document.getElementById('file-input')?.click()}>
                <input id="file-input" type="file" accept="audio/*,video/*,.mp3,.wav,.m4a,.mp4,.aac,.ogg,.webm,.mov" className="hidden" onChange={handleFileChange} disabled={uploading} />
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle className="h-10 w-10 text-primary" />
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <p className="font-medium text-foreground">Arraste o arquivo aqui ou clique para selecionar</p>
                    <p className="text-xs text-muted-foreground">MP3, WAV, M4A, AAC, OGG, WebM, MP4, MOV — até 500MB</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Para reuniões longas, prefira MP3 ou M4A (menor tamanho que MP4).</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'record' && (
              <div className="py-8">
                {recorder.state === 'idle' && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <p className="font-medium text-foreground mb-1">Selecione a fonte de áudio</p>
                      <p className="text-sm text-muted-foreground">Escolha como deseja capturar o áudio da reunião</p>
                    </div>

                    {audioDevices.length > 1 && (
                      <div className="max-w-sm mx-auto">
                        <label className="text-xs text-muted-foreground mb-1 block">Microfone</label>
                        <select
                          value={selectedDeviceId}
                          onChange={(e) => setSelectedDeviceId(e.target.value)}
                          className="w-full px-3 py-2 rounded-md border border-border bg-card text-foreground text-sm"
                        >
                          {audioDevices.map((d) => (
                            <option key={d.deviceId} value={d.deviceId}>
                              {d.label || `Microfone ${d.deviceId.slice(0, 8)}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className={cn('grid gap-4', recorder.isMobile ? 'grid-cols-1 max-w-xs mx-auto' : 'grid-cols-2')}>
                      {/* Option A: Mic only */}
                      <button
                        onClick={() => recorder.start('mic', selectedDeviceId || undefined)}
                        disabled={uploading}
                        className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-accent transition-colors"
                      >
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                          <Mic className="h-7 w-7 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">Microfone</span>
                        <span className="text-xs text-muted-foreground text-center">Reuniões presenciais ou pelo celular</span>
                      </button>
                      {/* Option B: Mic + Tab audio (desktop only) */}
                      {!recorder.isMobile && (
                        <button
                          onClick={() => recorder.start('mic+tab', selectedDeviceId || undefined)}
                          disabled={uploading}
                          className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-accent transition-colors"
                        >
                          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                            <Headphones className="h-7 w-7 text-primary" />
                          </div>
                          <span className="font-medium text-foreground">Microfone + Áudio da reunião</span>
                          <span className="text-xs text-muted-foreground text-center">Reuniões online no Chrome ou Edge</span>
                          <span className="text-[10px] text-muted-foreground/70 text-center">Seu navegador pedirá para selecionar a aba da reunião</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {recorder.state === 'recording' && (
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center animate-pulse">
                        <div className="w-4 h-4 rounded-full bg-destructive" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-mono font-bold text-foreground">{recorder.formattedTime}</p>
                      <p className="text-sm text-muted-foreground mt-1">Gravando...</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="destructive"
                        size="lg"
                        onClick={recorder.stop}
                      >
                        <Square className="h-4 w-4 mr-2 fill-current" />
                        Parar e Transcrever
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={recorder.cancel}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'paste' && (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Cole a transcrição ou texto da reunião</label>
                <Textarea placeholder="Cole aqui o texto da reunião..." value={pastedText} onChange={e => setPastedText(e.target.value)} rows={8} disabled={uploading} />
              </div>
            )}

            {uploading && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm font-medium text-foreground">{statusMessage}</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-muted-foreground text-right">{uploadProgress}%</p>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground text-sm">Detalhes da Reunião (Opcional)</h3>

              <div>
                <label className="text-sm font-medium text-foreground">Tipo de Reunião</label>
                <p className="text-xs text-muted-foreground mb-1">Melhora a qualidade da ATA gerada pela IA</p>
                <Select value={meetingType} onValueChange={setMeetingType} disabled={uploading}>
                  <SelectTrigger><SelectValue placeholder="Selecione o tipo de reunião" /></SelectTrigger>
                  <SelectContent>
                    {MEETING_TEMPLATE_GROUPS.map(group => (
                      <SelectGroup key={group}>
                        <SelectLabel>{group}</SelectLabel>
                        {MEETING_TEMPLATES.filter(t => t.group === group).map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {projects.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-foreground">Projeto</label>
                  <p className="text-xs text-muted-foreground mb-1">Organize reuniões por projeto ou cliente</p>
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId} disabled={uploading}>
                    <SelectTrigger><SelectValue placeholder="Selecione um projeto" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhum</SelectItem>
                      {projects.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.color }} />
                            {p.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="text-xs text-muted-foreground mb-1 block">Título</label>
                  <Input placeholder="Ex: Sprint Planning" value={title} onChange={e => setTitle(e.target.value)} disabled={uploading} /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Data</label>
                  <Input type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} disabled={uploading} /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Horário</label>
                  <Input type="time" value={meetingTime} onChange={e => setMeetingTime(e.target.value)} disabled={uploading} /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Local</label>
                  <Input placeholder="Ex: Sala 3" value={location} onChange={e => setLocation(e.target.value)} disabled={uploading} /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Responsável</label>
                  <Input placeholder="Nome" value={responsible} onChange={e => setResponsible(e.target.value)} disabled={uploading} /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Participantes</label>
                  <Input placeholder="Separar por vírgula" value={participants} onChange={e => setParticipants(e.target.value)} disabled={uploading} /></div>
              </div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Descrição</label>
                <Textarea placeholder="Pauta ou observações..." value={description} onChange={e => setDescription(e.target.value)} rows={3} disabled={uploading} /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Modelo de ATA</label>
                <Select value={selectedAtaTemplateId} onValueChange={(v) => {
                  if (v === '__customize__') { window.open('/settings/ata-templates', '_blank'); return; }
                  setSelectedAtaTemplateId(v);
                }}>
                  <SelectTrigger><SelectValue placeholder="Selecione um modelo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__default__">Padrão (Ágata)</SelectItem>
                    {ataTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name} {t.isDefault ? '⭐' : ''}</SelectItem>
                    ))}
                    <SelectItem value="__customize__">Personalizar agora →</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button className="w-full bg-primary hover:bg-emerald-600 text-primary-foreground" size="lg" onClick={handleSubmit}
              disabled={uploading || limitReached || (activeTab === 'upload' && !file) || (activeTab === 'paste' && !pastedText.trim())}>
              {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{statusMessage}</> : activeTab === 'paste' ? 'Salvar Transcrição' : 'Transcrever Reunião'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <LimitReachedDialog
        open={limitReached}
        onClose={() => navigate('/dashboard')}
        planName={usage.limits.planName}
        used={usage.transcriptionsUsed}
        max={usage.limits.maxTranscriptions}
      />

      <Dialog open={durationModalOpen} onOpenChange={setDurationModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Reunião muito longa para seu plano
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <p>
                Duração detectada: <strong>{detectedDuration} min</strong><br />
                Limite mensal do plano ({usage.limits.planName}): <strong>{usage.limits.maxTotalMinutesMonth} min/mês</strong><br />
                Minutos restantes: <strong>{remainingMinutes} min</strong>
              </p>
              <p>
                Você pode dividir a gravação em{' '}
                <strong>{Math.ceil(detectedDuration / Math.max(1, remainingMinutes))} partes</strong>{' '}
                de até <strong>{remainingMinutes} min</strong> e transcrever cada uma separadamente.
              </p>
              <p className="text-xs text-muted-foreground">
                Dica: use um editor de áudio gratuito como Audacity ou o recurso de corte do VLC para dividir o arquivo.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDurationModalOpen(false)}>
              Entendi, vou dividir
            </Button>
            <Button onClick={() => navigate('/plans')}>
              Ver planos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
