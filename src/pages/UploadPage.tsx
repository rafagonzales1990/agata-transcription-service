import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Upload, Mic, ClipboardPaste, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { LimitReachedDialog } from '@/components/LimitReachedDialog';
import { UsageBanner } from '@/components/UsageBanner';
import { useUsage } from '@/hooks/useUsage';
import { useAtaTemplates } from '@/hooks/useAtaTemplates';
import { eventFirstTranscription, trackUploadStarted, trackFirstTranscription } from '@/lib/gtag';

const tabs = [
  { id: 'upload' as const, label: 'Upload', icon: Upload },
  { id: 'record' as const, label: 'Gravar', icon: Mic },
  { id: 'paste' as const, label: 'Colar Texto', icon: ClipboardPaste },
];

export default function UploadPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const routineId = searchParams.get('routineId');
  const usage = useUsage();
  const { templates: ataTemplates, defaultTemplate } = useAtaTemplates();
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

  const limitReached = usage.isAtLimit;

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
      });
      if (insertError) throw new Error(`Erro ao criar reunião: ${insertError.message}`);
      setUploadProgress(70); setStatusMessage('Processando transcrição...');

      const { error: fnError } = await supabase.functions.invoke('transcribe', { body: { meetingId, storagePath } });
      if (fnError) {
        await supabase.from('Meeting').update({ status: 'failed', errorMessage: fnError.message, updatedAt: new Date().toISOString() }).eq('id', meetingId);
        if (fnError.message?.includes('429') || (fnError as any).status === 429) {
          toast.error('Limite de transcrições por hora atingido. Aguarde 1 hora.');
        } else {
          toast.error(`Transcrição falhou: ${fnError.message}`);
        }
        navigate('/meetings');
        return;
      }

      setUploadProgress(100); setStatusMessage('Transcrição concluída!');
      eventFirstTranscription();
      trackFirstTranscription();
      toast.success('Transcrição concluída com sucesso!');
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
            <a href="https://chrome.google.com/webstore/detail/agata-transcription" target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 hover:underline">
              Instalar extensão →
            </a>
          </div>
        </div>

        <UsageBanner isNearLimit={usage.isNearLimit} isAtLimit={usage.isAtLimit} planId={usage.limits.planId} />

        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setFile(null); }} disabled={uploading}
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
                  </div>
                )}
              </div>
            )}

            {activeTab === 'record' && (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <Mic className="h-10 w-10 text-primary" />
                </div>
                <p className="font-medium text-foreground mb-2">Gravação de Áudio</p>
                <p className="text-sm text-muted-foreground mb-4">Clique para iniciar a gravação</p>
                <Button className="bg-primary hover:bg-emerald-600 text-primary-foreground" onClick={() => toast.info('Gravação será implementada em breve')}>
                  <Mic className="h-4 w-4 mr-2" /> Iniciar Gravação
                </Button>
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
    </AppLayout>
  );
}
