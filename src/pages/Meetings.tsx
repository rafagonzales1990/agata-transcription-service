import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FileText, FolderOpen, Loader2, CheckCircle, AlertCircle, Clock, Search, Trash2, Pencil, XCircle, Plus, MoreHorizontal, FolderKanban } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useProjects, type Project } from '@/hooks/useProjects';
import { useMeetings, type MeetingListItem } from '@/hooks/useMeetings';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

type Meeting = MeetingListItem;

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle }> = {
  completed: { label: 'Concluída', variant: 'default', icon: CheckCircle },
  processing: { label: 'Processando', variant: 'secondary', icon: Clock },
  pending: { label: 'Pendente', variant: 'outline', icon: Clock },
  failed: { label: 'Falhou', variant: 'destructive', icon: AlertCircle },
};

const PROJECT_COLORS = ['#059669', '#2563eb', '#7c3aed', '#dc2626', '#ea580c', '#db2777'];

type SortOption = 'newest' | 'oldest' | 'title_asc';
type DateRange = 'all' | '7' | '30' | '90';

export default function MeetingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: meetings = [], isLoading: loading } = useMeetings(user?.id);

  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editMeeting, setEditMeeting] = useState<Meeting | null>(null);
  const [editForm, setEditForm] = useState({ title: '', meetingDate: '', meetingTime: '', location: '', responsible: '', participants: '' });

  // Project state
  const { projects, createProject, renameProject, deleteProject } = useProjects();
  const selectedProjectId = searchParams.get('project') || 'all';
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState(PROJECT_COLORS[0]);
  const [renameDialogProject, setRenameDialogProject] = useState<Project | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [assignMenuMeetingId, setAssignMenuMeetingId] = useState<string | null>(null);

  const invalidateMeetings = () => queryClient.invalidateQueries({ queryKey: ['meetings', user?.id] });

  const setProjectFilter = (id: string) => {
    if (id === 'all') {
      searchParams.delete('project');
    } else {
      searchParams.set('project', id);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('Meeting').delete().eq('id', deleteId);
    if (error) toast.error('Erro ao deletar reunião');
    else {
      toast.success('Reunião deletada');
      invalidateMeetings();
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
      await invalidateMeetings();
    }
    setEditMeeting(null);
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    const p = await createProject(newProjectName.trim(), newProjectColor);
    if (p) {
      toast.success('Projeto criado');
      setNewProjectName('');
      setNewProjectColor(PROJECT_COLORS[0]);
      setShowNewProject(false);
    }
  };

  const handleRenameProject = async () => {
    if (!renameDialogProject || !renameValue.trim()) return;
    const ok = await renameProject(renameDialogProject.id, renameValue.trim());
    if (ok) toast.success('Projeto renomeado');
    setRenameDialogProject(null);
  };

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id);
    if (selectedProjectId === id) setProjectFilter('all');
  };

  const handleAssignProject = async (meetingId: string, projectId: string | null) => {
    const { error } = await supabase.from('Meeting').update({
      projectId,
      updatedAt: new Date().toISOString(),
    }).eq('id', meetingId);

    if (error) {
      toast.error('Erro ao mover reunião');
    } else {
      invalidateMeetings();
      toast.success(projectId ? 'Reunião movida para projeto' : 'Reunião removida do projeto');
    }
    setAssignMenuMeetingId(null);
  };

  const hasActiveFilters = search || statusFilter !== 'all' || dateRange !== 'all' || sortBy !== 'newest' || selectedProjectId !== 'all';

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setDateRange('all');
    setSortBy('newest');
    setProjectFilter('all');
  };

  const filtered = useMemo(() => {
    const now = Date.now();
    const q = search.toLowerCase();

    let result = meetings.filter(m => {
      if (selectedProjectId !== 'all' && m.projectId !== selectedProjectId) return false;
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;

      if (dateRange !== 'all') {
        const days = Number(dateRange);
        const created = new Date(m.createdAt).getTime();
        if (now - created > days * 86400000) return false;
      }

      if (q) {
        const titleMatch = m.title.toLowerCase().includes(q);
        const summaryMatch = m.summary?.toLowerCase().includes(q);
        const participantMatch = m.participants.some(p => p.toLowerCase().includes(q));
        if (!titleMatch && !summaryMatch && !participantMatch) return false;
      }

      return true;
    });

    result.sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'title_asc') return a.title.localeCompare(b.title, 'pt-BR');
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [meetings, search, statusFilter, dateRange, sortBy, selectedProjectId]);

  const getProjectForMeeting = (projectId: string | null) => projects.find(p => p.id === projectId);

  return (
    <AppLayout>
      <div className="space-y-6 text-card-foreground">
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

        {/* Project chips */}
        <div className="flex flex-wrap items-center gap-2">
          <FolderKanban className="h-4 w-4 text-muted-foreground shrink-0" />
          <button
            onClick={() => setProjectFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedProjectId === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Todos
          </button>
          {projects.map(p => (
            <div key={p.id} className="flex items-center gap-0.5">
              <button
                onClick={() => setProjectFilter(p.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  selectedProjectId === p.id
                    ? 'text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                style={selectedProjectId === p.id ? { backgroundColor: p.color } : undefined}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                {p.name}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-0.5 rounded hover:bg-muted/80 text-muted-foreground">
                    <MoreHorizontal className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => { setRenameDialogProject(p); setRenameValue(p.name); }}>
                    Renomear
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteProject(p.id)}>
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}

          {showNewProject ? (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {PROJECT_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewProjectColor(c)}
                    className={`w-5 h-5 rounded-full border-2 transition-all ${newProjectColor === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <Input
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                placeholder="Nome do projeto"
                className="h-7 text-xs w-36"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleCreateProject(); if (e.key === 'Escape') setShowNewProject(false); }}
              />
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleCreateProject}>Criar</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowNewProject(false)}>
                <XCircle className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewProject(true)}
              className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> Novo Projeto
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, resumo ou participante..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="processing">Processando</SelectItem>
              <SelectItem value="failed">Falhou</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mais recente</SelectItem>
              <SelectItem value="oldest">Mais antigo</SelectItem>
              <SelectItem value="title_asc">Título A-Z</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground self-center">
              <XCircle className="h-4 w-4 mr-1" /> Limpar
            </Button>
          )}
        </div>

        {/* Count */}
        {!loading && (
          <p className="text-sm text-muted-foreground">
            {filtered.length} reunião{filtered.length !== 1 ? 'ões' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <FolderOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <h3 className="font-medium text-foreground mb-1">
                  {hasActiveFilters ? 'Nenhuma reunião encontrada para esses filtros.' : 'Nenhuma reunião encontrada'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {hasActiveFilters ? 'Tente ajustar ou limpar os filtros acima.' : 'Suas transcrições aparecerão aqui após o primeiro upload'}
                </p>
                {hasActiveFilters ? (
                  <Button variant="outline" onClick={clearFilters}>Limpar filtros</Button>
                ) : (
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
              const project = getProjectForMeeting(meeting.projectId);

              return (
                <Card key={meeting.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4 flex items-center gap-4">
                    <Link to={`/meetings/${meeting.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground truncate">{meeting.title}</p>
                          {project && (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-white shrink-0"
                              style={{ backgroundColor: project.color }}
                            >
                              {project.name}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{date} · {meeting.fileName}</p>
                      </div>
                    </Link>
                    <Badge variant={cfg.variant} className="shrink-0 flex items-center gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {cfg.label}
                    </Badge>

                    {/* Assign to project */}
                    <Popover open={assignMenuMeetingId === meeting.id} onOpenChange={(open) => setAssignMenuMeetingId(open ? meeting.id : null)}>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Mover para projeto">
                          <FolderKanban className="h-3.5 w-3.5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-1" align="end">
                        <button
                          onClick={() => handleAssignProject(meeting.id, null)}
                          className={`w-full text-left px-3 py-1.5 rounded text-xs hover:bg-muted transition-colors ${!meeting.projectId ? 'font-semibold' : ''}`}
                        >
                          Sem projeto
                        </button>
                        {projects.map(p => (
                          <button
                            key={p.id}
                            onClick={() => handleAssignProject(meeting.id, p.id)}
                            className={`w-full text-left px-3 py-1.5 rounded text-xs hover:bg-muted transition-colors flex items-center gap-2 ${meeting.projectId === p.id ? 'font-semibold' : ''}`}
                          >
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                            {p.name}
                          </button>
                        ))}
                      </PopoverContent>
                    </Popover>

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

      {/* Rename Project Dialog */}
      <Dialog open={!!renameDialogProject} onOpenChange={() => setRenameDialogProject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear Projeto</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            placeholder="Novo nome"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handleRenameProject(); }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogProject(null)}>Cancelar</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleRenameProject}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
