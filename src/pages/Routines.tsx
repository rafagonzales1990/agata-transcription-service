import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Repeat, Plus, Loader2, Trash2, Pencil, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const COLOR_PRESETS = ['#10B981', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6', '#06B6D4', '#EC4899'];
const ICON_OPTIONS = [
  { value: 'repeat', label: '🔄 Recorrente' },
  { value: 'calendar', label: '📅 Calendário' },
  { value: 'users', label: '👥 Equipe' },
  { value: 'briefcase', label: '💼 Negócios' },
  { value: 'zap', label: '⚡ Rápida' },
];

interface Routine {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  createdAt: string;
  meetingCount?: number;
  consolidatedSummary?: string | null;
}

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRoutine, setEditRoutine] = useState<Routine | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', color: '#10B981', icon: 'repeat' });
  const [saving, setSaving] = useState(false);

  const fetchRoutines = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('Routine')
      .select('id, name, description, color, icon, createdAt, consolidatedSummary')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false });

    if (!error && data) {
      // Get meeting counts
      const routineIds = data.map(r => r.id);
      const counts: Record<string, number> = {};
      if (routineIds.length > 0) {
        const { data: meetings } = await supabase
          .from('Meeting')
          .select('routineId')
          .in('routineId', routineIds);
        meetings?.forEach(m => {
          if (m.routineId) counts[m.routineId] = (counts[m.routineId] || 0) + 1;
        });
      }
      setRoutines(data.map(r => ({ ...r, meetingCount: counts[r.id] || 0 })) as Routine[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRoutines(); }, []);

  const openCreate = () => {
    setEditRoutine(null);
    setForm({ name: '', description: '', color: '#10B981', icon: 'repeat' });
    setModalOpen(true);
  };

  const openEdit = (r: Routine) => {
    setEditRoutine(r);
    setForm({ name: r.name, description: r.description || '', color: r.color, icon: r.icon || 'repeat' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nome é obrigatório'); return; }
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editRoutine) {
      const { error } = await supabase.from('Routine').update({
        name: form.name, description: form.description || null, color: form.color, icon: form.icon,
        updatedAt: new Date().toISOString(),
      }).eq('id', editRoutine.id);
      if (error) toast.error('Erro ao atualizar rotina');
      else toast.success('Rotina atualizada');
    } else {
      const { error } = await supabase.from('Routine').insert({
        userId: user.id, name: form.name, description: form.description || null, color: form.color, icon: form.icon,
      });
      if (error) toast.error('Erro ao criar rotina');
      else toast.success('Rotina criada');
    }

    setSaving(false);
    setModalOpen(false);
    await fetchRoutines();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('Routine').delete().eq('id', deleteId);
    if (error) toast.error('Erro ao deletar rotina');
    else { toast.success('Rotina deletada'); setRoutines(prev => prev.filter(r => r.id !== deleteId)); }
    setDeleteId(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Rotinas</h1>
            <p className="text-muted-foreground">Organize reuniões recorrentes</p>
          </div>
          <Button className="bg-primary hover:bg-emerald-600 text-primary-foreground" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> Nova Rotina
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : routines.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <Repeat className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <h3 className="font-medium text-foreground mb-1">Nenhuma rotina configurada</h3>
                <p className="text-sm text-muted-foreground">Crie rotinas para reuniões recorrentes</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {routines.map((routine) => (
              <Card key={routine.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = `/routines/${routine.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: routine.color }} />
                      <h3 className="font-semibold text-foreground">{routine.name}</h3>
                    </div>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(routine)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(routine.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {routine.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{routine.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" /> {routine.meetingCount} reuniões
                    </span>
                    <span>{new Date(routine.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {routine.consolidatedSummary && (
                    <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      ✓ Resumo disponível
                    </span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editRoutine ? 'Editar Rotina' : 'Nova Rotina'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Nome *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Daily Standup" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Descrição</label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição da rotina..." rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Cor</label>
              <div className="flex gap-2">
                {COLOR_PRESETS.map(c => (
                  <button
                    key={c}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setForm(f => ({ ...f, color: c }))}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Ícone</label>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${form.icon === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
                    onClick={() => setForm(f => ({ ...f, icon: opt.value }))}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : editRoutine ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar rotina?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
