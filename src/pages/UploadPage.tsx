import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Upload, Mic, ClipboardPaste, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { LimitReachedDialog } from '@/components/LimitReachedDialog';
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
  const [limitReached, setLimitReached] = useState(false);
  const [usageInfo, setUsageInfo] = useState({ planName: 'Gratuito', used: 0, max: 2 });

  useEffect(() => {
    async function checkUsage() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const currentMonth = new Date().toISOString().slice(0, 7);

      const [usageRes, profileRes] = await Promise.all([
        supabase.from('Usage').select('transcriptionsUsed').eq('userId', user.id).eq('currentMonth', currentMonth).maybeSingle(),
        supabase.from('profiles').select('plan_id').eq('user_id', user.id).single(),
      ]);

      const planId = profileRes.data?.plan_id || 'basic';
      const { data: plan } = await supabase.from('Plan').select('maxTranscriptions, name').eq('id', planId).single();

      const used = usageRes.data?.transcriptionsUsed || 0;
      const max = plan?.maxTranscriptions || 5;

      setUsageInfo({ planName: plan?.name || 'Gratuito', used, max });
      if (used >= max) setLimitReached(true);
    }
    checkUsage();
  }, []);

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

    const { data: { user } } = await supabase.auth.getUser();
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
        await updateUsage(user.id, 0);
        toast.success('Transcrição salva!');
        navigate('/meetings');
      } catch (err: any) {
        toast.error(err.message || 'Erro ao salvar');
      } finally { setUploading(false); }
      return;
    }

    if (activeTab === 'upload' && !file) return;
    if (file && file.size > 50 * 1024 * 1024) toast.info('Arquivo grande. A transcrição pode levar alguns minutos.');

    setUploading(true); setUploadProgress(0); setStatusMessage('Enviando arquivo...');

    try {
      const storagePath = `${user.id}/${Date.now()}-${file!.name}`;
      setUploadProgress(10);
      const { error: uploadError } = await supabase.storage.from('meetings').upload(storagePath, file!, { cacheControl: '3600', upsert: false });
      if (uploadError) throw new Error(`Erro no upload: ${uploadError.message}`);
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

      await updateUsage(user.id, Math.round(file!.size / 1024 / 1024));
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
                <input id="file-input" type="file" accept="audio/*,video/*,.mp3,.wav,.m4a,.aac,.caf,.ogg,.webm,.mp4" className="hidden" onChange={handleFileChange} disabled={uploading} />
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
                    <p className="text-xs text-muted-foreground">MP3, WAV, M4A, AAC, CAF, OGG, WebM, MP4</p>
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
        planName={usageInfo.planName}
        used={usageInfo.used}
        max={usageInfo.max}
      />
    </AppLayout>
  );
}

async function updateUsage(userId: string, durationMinutes: number) {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const { data: existing } = await supabase
    .from('Usage')
    .select('id, transcriptionsUsed, totalMinutesTranscribed, currentMonth')
    .eq('userId', userId)
    .order('createdAt', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing && existing.currentMonth === currentMonth) {
    await supabase.from('Usage').update({
      transcriptionsUsed: (existing.transcriptionsUsed || 0) + 1,
      totalMinutesTranscribed: (existing.totalMinutesTranscribed || 0) + durationMinutes,
      updatedAt: new Date().toISOString(),
    }).eq('id', existing.id);
  } else {
    await supabase.from('Usage').insert({
      userId, currentMonth, transcriptionsUsed: 1, totalMinutesTranscribed: durationMinutes,
    });
  }
}
