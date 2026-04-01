import { useState, useCallback } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileAudio, Mic, ClipboardPaste, CheckCircle, Calendar, Clock, MapPin, User, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const tabs = [
  { id: 'upload' as const, label: 'Upload', icon: Upload },
  { id: 'record' as const, label: 'Gravar', icon: Mic },
  { id: 'paste' as const, label: 'Colar Texto', icon: ClipboardPaste },
];

export default function UploadPage() {
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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleSubmit = () => {
    toast.info('Funcionalidade de transcrição requer backend conectado. Configure o Lovable Cloud para habilitar.');
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nova Transcrição</h1>
          <p className="text-muted-foreground">Envie um áudio, grave ou cole o texto da reunião</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setFile(null); }}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Upload Area */}
            {activeTab === 'upload' && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
                  isDragging ? 'border-primary bg-emerald-50' : 'border-border hover:border-primary/50',
                  file && 'border-primary bg-emerald-50'
                )}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept="audio/*,video/*,.mp3,.wav,.m4a,.aac,.caf,.ogg,.webm,.mp4"
                  className="hidden"
                  onChange={handleFileChange}
                />
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
                <p className="text-sm text-muted-foreground mb-4">Clique para iniciar a gravação diretamente do navegador</p>
                <Button className="bg-primary hover:bg-emerald-600 text-primary-foreground" onClick={() => toast.info('Gravação requer backend conectado')}>
                  <Mic className="h-4 w-4 mr-2" /> Iniciar Gravação
                </Button>
              </div>
            )}

            {activeTab === 'paste' && (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Cole a transcrição ou texto da reunião</label>
                <Textarea
                  placeholder="Cole aqui o texto da reunião..."
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  rows={8}
                />
              </div>
            )}

            {/* Meeting Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground text-sm">Detalhes da Reunião (Opcional)</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Título</label>
                  <Input placeholder="Ex: Sprint Planning" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Data</label>
                  <Input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Horário</label>
                  <Input type="time" value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Local</label>
                  <Input placeholder="Ex: Sala 3" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Responsável</label>
                  <Input placeholder="Nome" value={responsible} onChange={(e) => setResponsible(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Participantes</label>
                  <Input placeholder="Separar por vírgula" value={participants} onChange={(e) => setParticipants(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Descrição</label>
                <Textarea placeholder="Pauta ou observações..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
            </div>

            <Button
              className="w-full bg-primary hover:bg-emerald-600 text-primary-foreground"
              size="lg"
              onClick={handleSubmit}
              disabled={activeTab === 'upload' && !file}
            >
              Transcrever Reunião
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
