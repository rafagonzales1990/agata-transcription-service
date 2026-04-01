import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { FileText, FolderOpen, Loader2, CheckCircle, AlertCircle, Clock, Search, Trash2, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Meeting {
  id: string;
  title: string;
  fileName: string;
  status: string;
  createdAt: string;
  summary: string | null;
  participants: string[];
  meetingDate: string | null;
  meetingTime: string | null;
  location: string | null;
  responsible: string | null;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle }> = {
  completed: { label: 'Concluída', variant: 'default', icon: CheckCircle },
  processing: { label: 'Processando', variant: 'secondary', icon: Clock },
  pending: { label: 'Pendente', variant: 'outline', icon: Clock },
  failed: { label: 'Falhou', variant: 'destructive', icon: AlertCircle },
};

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editMeeting, setEditMeeting] = useState<Meeting | null>(null);
  const [editForm, setEditForm] = useState({ title: '', meetingDate: '', meetingTime: '', location: '', responsible: '', participants: '' });

  const fetchMeetings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('Meeting')
      .select('id, title, fileName, status, createdAt, summary, participants, meetingDate, meetingTime, location, responsible')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false });

    if (error) console.error('Error fetching meetings:', error);
    else setMeetings((data as Meeting[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchMeetings(); }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('Meeting').delete().eq('id', deleteId);
    if (error) toast.error('Erro ao deletar reunião');
    else {
      toast.success('Reunião deletada');
      setMeetings(prev => prev.filter(m => m.id !== deleteId));
    }
    setDeleteId(null);
  };

  const openEdit = (m: Meeting) => {
    setEditMeeting(m);
    setEditForm({
      title: m.title,
      meetingDate: m.meetingDate ? m.meetingDate.split('T')[0] : '',
      meetingTime: m.meetingTime || '',
      location: m.location || '',
      responsible: m.responsible || '',
      participants: m.participants.join(', '),
    });
  };

  const handleEditSave = async () => {
    if (!editMeeting) return;
    const participantsList = editForm.participants.split(',').map(p => p.trim()).filter(Boolean);
    const { error } = await supabase.from('Meeting').update({
      title: editForm.title,
      meetingDate: editForm.meetingDate ? new Date(editForm.meetingDate).toISOString() : null,
      meetingTime: editForm.meetingTime || null,
      location: editForm.location || null,
      responsible: editForm.responsible || null,
      participants: participantsList,
      updatedAt: new Date().toISOString(),
    }).eq('id', editMeeting.id);

    if (error) toast.error('Erro ao atualizar reunião');
    else {
      toast.success('Reunião atualizada');
      await fetchMeetings();
    }
    setEditMeeting(null);
  };

  const filtered = meetings.filter(m => {
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reuniões</h1>
            <p className="text-muted-foreground">Gerencie suas transcrições</p>
          </div>
          <Link to="/upload">
            <Button className="bg-primary hover:bg-emerald-600 text-primary-foreground">
              Nova Transcrição
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="completed">Concluída</SelectItem>
              <SelectItem value="processing">Processando</SelectItem>
              <SelectItem value="failed">Falhou</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <FolderOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <h3 className="font-medium text-foreground mb-1">Nenhuma reunião encontrada</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {search || statusFilter !== 'all' ? 'Tente ajustar os filtros' : 'Suas transcrições aparecerão aqui após o primeiro upload'}
                </p>
                {!search && statusFilter === 'all' && (
                  <Link to="/upload"><Button variant="outline">Fazer Upload</Button></Link>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((meeting) => {
              const cfg = statusConfig[meeting.status] || statusConfig.pending;
              const StatusIcon = cfg.icon;
              const date = meeting.meetingDate
                ? new Date(meeting.meetingDate).toLocaleDateString('pt-BR')
                : new Date(meeting.createdAt).toLocaleDateString('pt-BR');

              return (
                <Card key={meeting.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4 flex items-center gap-4">
                    <Link to={`/meetings/${meeting.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{meeting.title}</p>
                        <p className="text-xs text-muted-foreground">{date} · {meeting.fileName}</p>
                      </div>
                    </Link>
                    <Badge variant={cfg.variant} className="shrink-0 flex items-center gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {cfg.label}
                    </Badge>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(meeting)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(meeting.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar reunião?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A reunião e sua transcrição serão removidas permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={!!editMeeting} onOpenChange={() => setEditMeeting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Reunião</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Título</label>
              <Input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Data</label>
                <Input type="date" value={editForm.meetingDate} onChange={e => setEditForm(f => ({ ...f, meetingDate: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Horário</label>
                <Input type="time" value={editForm.meetingTime} onChange={e => setEditForm(f => ({ ...f, meetingTime: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Local</label>
              <Input value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Responsável</label>
              <Input value={editForm.responsible} onChange={e => setEditForm(f => ({ ...f, responsible: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Participantes (vírgula)</label>
              <Input value={editForm.participants} onChange={e => setEditForm(f => ({ ...f, participants: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMeeting(null)}>Cancelar</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleEditSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
