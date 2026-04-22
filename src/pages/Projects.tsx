import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FolderOpen, Plus, MoreHorizontal, Pencil, Trash2, FolderInput } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useProjects, type Project } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const COLOR_PRESETS = [
  '#059669', '#0D1F2D', '#3B82F6', '#8B5CF6',
  '#F59E0B', '#EF4444', '#EC4899', '#6B7280',
];

interface MeetingRow {
  id: string;
  title: string;
  createdAt: string;
  fileDuration: number | null;
  projectId: string | null;
}

export default function ProjectsPage() {
  const { profile } = useAuth();
  const { projects, loading, limits, uncategorizedCount, createProject, updateProject, deleteProject, refetch } = useProjects();
  const isEnterprise = profile?.plan_id === 'enterprise';

  // Create/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formColor, setFormColor] = useState(COLOR_PRESETS[0]);
  const [formShareTeam, setFormShareTeam] = useState(false);
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Bulk categorize modal
  const [bulkProject, setBulkProject] = useState<Project | null>(null);
  const [bulkUncategorized, setBulkUncategorized] = useState(false); // true = "Sem Projeto" card
  const [bulkMeetings, setBulkMeetings] = useState<MeetingRow[]>([]);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [bulkShowAll, setBulkShowAll] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);

  const openCreateModal = () => {
    setEditingProject(null);
    setFormName('');
    setFormDesc('');
    setFormColor(COLOR_PRESETS[0]);
    setFormShareTeam(false);
    setModalOpen(true);
  };

  const openEditModal = (p: Project) => {
    setEditingProject(p);
    setFormName(p.name);
    setFormDesc(p.description || '');
    setFormColor(p.color);
    setFormShareTeam(!!p.teamId);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    if (editingProject) {
      const ok = await updateProject(editingProject.id, {
        name: formName.trim(),
        description: formDesc.trim() || undefined,
        color: formColor,
      });
      if (ok) toast.success('Projeto atualizado!');
    } else {
      await createProject(formName.trim(), formColor, formDesc.trim(), formShareTeam);
    }
    setSaving(false);
    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteProject(deleteId);
    setDeleteId(null);
  };

  // Bulk categorize
  const openBulkModal = async (project: Project | null, isUncategorized: boolean) => {
    setBulkProject(project);
    setBulkUncategorized(isUncategorized);
    setBulkSelected(new Set());
    setBulkShowAll(false);
    setBulkLoading(true);
    setBulkSaving(false);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data } = await supabase
      .from('Meeting')
      .select('id, title, createdAt, fileDuration, projectId')
      .eq('userId', session.user.id)
      .order('createdAt', { ascending: false });

    setBulkMeetings((data || []) as MeetingRow[]);
    setBulkLoading(false);
  };

  const closeBulkModal = () => {
    setBulkProject(null);
    setBulkUncategorized(false);
  };

  const filteredBulkMeetings = bulkShowAll
    ? bulkMeetings
    : bulkMeetings.filter(m => !m.projectId);

  const toggleBulkSelect = (id: string) => {
    setBulkSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkSave = async () => {
    if (bulkSelected.size === 0) return;
    setBulkSaving(true);
    const targetProjectId = bulkUncategorized ? null : bulkProject?.id || null;

    // For "Sem Projeto" card, we need a target project — but this is the "categorizar em lote" on the "Sem Projeto" card
    // User should pick a project in this case. For simplicity, if bulkUncategorized && no project, skip.
    // Actually the spec says clicking "Categorizar em lote" on "Sem Projeto" card opens the modal too.
    // But there's no target project. Let's handle this: if bulkUncategorized, we need the user to have clicked on a specific project.
    // Re-reading spec: "Categorizar reuniões" on a project card = move to that project
    // "Categorizar em lote" on "Sem Projeto" card = also opens modal, presumably to assign to some project
    // For now, if it's the uncategorized card, we'll just let them pick - but the spec is unclear. Let's just assign to the target project.

    const ids = Array.from(bulkSelected);
    const targetId = bulkUncategorized ? bulkProject?.id || null : bulkProject?.id || null;
    if (bulkUncategorized && !targetId) {
      toast.error('Selecione um projeto de destino');
      setBulkSaving(false);
      return;
    }
    const { error } = await supabase
      .from('Meeting')
      .update({ projectId: targetId, updatedAt: new Date().toISOString() })
      .in('id', ids);

    if (error) {
      toast.error('Erro ao mover reuniões');
    } else {
      toast.success(`${ids.length} reunião(ões) movida(s)!`);
      await refetch();
    }
    setBulkSaving(false);
    closeBulkModal();
  };

  const bulkModalOpen = bulkProject !== null || bulkUncategorized;
  const bulkTargetName = bulkProject?.name || 'Sem Projeto';

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Meus Projetos</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {limits.isUnlimited
                ? 'Projetos ilimitados'
                : `${limits.used} de ${limits.maxProjects} projetos utilizados`}
            </p>
          </div>
          <Button onClick={openCreateModal} disabled={limits.isAtLimit} title={limits.isAtLimit ? 'Limite de projetos atingido — faça upgrade' : undefined} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-1" />
            Novo Projeto
          </Button>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i}><CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-20" />
              </CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {/* "Sem Projeto" card */}
            <Card className="border-l-4" style={{ borderLeftColor: '#6B7280' }}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-gray-400 shrink-0" />
                    <h3 className="font-semibold text-foreground">Sem Projeto</h3>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                  Reuniões não categorizadas
                </p>
                <div className="flex items-center justify-between mt-3">
                  <Badge variant="secondary" className="text-xs">
                    {uncategorizedCount} reunião{uncategorizedCount !== 1 ? 'ões' : ''}
                  </Badge>
                  {uncategorizedCount > 0 && projects.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => openBulkModal(null, true)}
                    >
                      <FolderInput className="h-3 w-3 mr-1" />
                      Categorizar em lote
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Project cards */}
            {projects.map(p => (
              <Card key={p.id} className="border-l-4" style={{ borderLeftColor: p.color }}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                      <h3 className="font-semibold text-foreground truncate">{p.name}</h3>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded hover:bg-muted text-muted-foreground shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditModal(p)}>
                          <Pencil className="h-4 w-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openBulkModal(p, false)}>
                          <FolderInput className="h-4 w-4 mr-2" /> Categorizar reuniões
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(p.id)}>
                          <Trash2 className="h-4 w-4 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {p.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{p.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <Badge variant="secondary" className="text-xs">
                      {p.meetingCount ?? 0} reunião{(p.meetingCount ?? 0) !== 1 ? 'ões' : ''}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Criado em {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  {p.teamId && (
                    <Badge variant="outline" className="text-xs mt-2">
                      Compartilhado com o time
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Empty state */}
            {projects.length === 0 && (
              <Card className="sm:col-span-2">
                <CardContent className="py-16 text-center">
                  <FolderOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <h3 className="font-medium text-foreground mb-1">Nenhum projeto criado ainda</h3>
                  <p className="text-sm text-muted-foreground mb-4">Organize suas reuniões em projetos</p>
                  <Button onClick={openCreateModal} variant="outline">
                    Criar primeiro projeto
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProject ? 'Editar Projeto' : 'Novo Projeto'}</DialogTitle>
            <DialogDescription>
              {editingProject ? 'Atualize os dados do projeto' : 'Crie um projeto para organizar suas reuniões'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Nome *</label>
              <Input
                value={formName}
                onChange={e => setFormName(e.target.value.slice(0, 50))}
                placeholder="Ex: Cliente Maitreya"
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground mt-1">{formName.length}/50</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Descrição</label>
              <Textarea
                value={formDesc}
                onChange={e => setFormDesc(e.target.value.slice(0, 200))}
                placeholder="Descrição opcional do projeto"
                rows={2}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground mt-1">{formDesc.length}/200</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Cor</label>
              <div className="flex gap-2">
                {COLOR_PRESETS.map(c => (
                  <button
                    key={c}
                    onClick={() => setFormColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${formColor === c ? 'border-foreground scale-110 ring-2 ring-primary/30' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            {isEnterprise && !editingProject && (
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Compartilhar com o time</p>
                  <p className="text-xs text-muted-foreground">Membros do time poderão ver este projeto</p>
                </div>
                <Switch checked={formShareTeam} onCheckedChange={setFormShareTeam} />
              </div>
            )}
            {!editingProject && limits.isAtLimit && (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-3 text-sm text-amber-800 dark:text-amber-300">
                Você atingiu o limite de {limits.maxProjects} projetos do seu plano. Faça upgrade para criar mais projetos.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleSave}
              disabled={!formName.trim() || saving || (!editingProject && limits.isAtLimit)}
              className="bg-primary text-primary-foreground"
            >
              {saving ? 'Salvando...' : editingProject ? 'Salvar' : 'Criar Projeto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              As reuniões deste projeto não serão excluídas, apenas ficarão sem projeto vinculado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Categorize Modal */}
      <Dialog open={bulkModalOpen} onOpenChange={open => { if (!open) closeBulkModal(); }}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Categorizar Reuniões — {bulkTargetName}</DialogTitle>
            <DialogDescription>
              Selecione as reuniões para mover para este projeto
            </DialogDescription>
          </DialogHeader>

          {/* Project selector when opened from "Sem Projeto" */}
          {bulkUncategorized && (
            <div className="mb-2">
              <label className="text-sm font-medium text-foreground mb-1 block">Mover para o projeto:</label>
              <Select value={bulkProject?.id || ''} onValueChange={(v) => {
                const p = projects.find(pr => pr.id === v) || null;
                setBulkProject(p);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent>
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

          <div className="flex items-center gap-2 mb-2">
            <Checkbox
              id="show-all"
              checked={bulkShowAll}
              onCheckedChange={(c) => setBulkShowAll(!!c)}
            />
            <label htmlFor="show-all" className="text-sm text-muted-foreground cursor-pointer">
              Mostrar todas as reuniões
            </label>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
            {bulkLoading ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : filteredBulkMeetings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma reunião disponível
              </p>
            ) : (
              filteredBulkMeetings.map(m => {
                const project = projects.find(p => p.id === m.projectId);
                return (
                  <label
                    key={m.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={bulkSelected.has(m.id)}
                      onCheckedChange={() => toggleBulkSelect(m.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{new Date(m.createdAt).toLocaleDateString('pt-BR')}</span>
                        {m.fileDuration && m.fileDuration > 0 && (
                          <span>{Math.ceil(m.fileDuration / 60)}min</span>
                        )}
                        {project && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1">
                            <span className="w-1.5 h-1.5 rounded-full mr-1 inline-block" style={{ backgroundColor: project.color }} />
                            {project.name}
                          </Badge>
                        )}
                        {!m.projectId && (
                          <span className="text-muted-foreground/60">Sem projeto</span>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })
            )}
          </div>

          <DialogFooter className="border-t border-border pt-3">
            <p className="text-sm text-muted-foreground mr-auto">
              {bulkSelected.size} reunião(ões) selecionada(s)
            </p>
            <Button variant="outline" onClick={closeBulkModal}>Cancelar</Button>
            <Button
              disabled={bulkSelected.size === 0 || bulkSaving}
              onClick={handleBulkSave}
              className="bg-primary text-primary-foreground"
            >
              {bulkSaving ? 'Movendo...' : `Mover para ${bulkTargetName}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
