import { useEffect, useState, useCallback } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  RefreshCw, Plus, Pencil, Trash2, Shield, X, Copy, ChevronDown,
  DollarSign, Users, Clock, Zap, TrendingUp, BarChart3, FileAudio, Loader2, FolderOpen, Gift, Database,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { LogoIcon } from '@/components/LogoIcon';
import { VersionBadge } from '@/components/VersionBadge';
import { appVersion } from '@/config/appVersion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// ── Constants ──────────────────────────────────────────────
const PLAN_COLORS: Record<string, string> = {
  basic: 'bg-gray-100 text-gray-700',
  inteligente: 'bg-emerald-100 text-emerald-700',
  automacao: 'bg-blue-100 text-blue-700',
  enterprise: 'bg-purple-100 text-purple-700',
};
const PLAN_LABELS: Record<string, string> = {
  basic: 'Gratuito', inteligente: 'Inteligente', automacao: 'Automação', enterprise: 'Enterprise',
};
const COLOR_PRESETS = ['#10B981', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6', '#06B6D4', '#EC4899', '#64748B'];

// ── Helpers ────────────────────────────────────────────────
function formatCPF(cpf: string | null): string {
  if (!cpf) return '—';
  const c = cpf.replace(/\D/g, '');
  if (c.length !== 11) return cpf;
  return `${c.slice(0,3)}.${c.slice(3,6)}.${c.slice(6,9)}-${c.slice(9)}`;
}
function formatPhone(phone: string | null): string {
  if (!phone) return '—';
  const c = phone.replace(/\D/g, '');
  if (c.length === 11) return `(${c.slice(0,2)}) ${c.slice(2,7)}-${c.slice(7)}`;
  if (c.length === 10) return `(${c.slice(0,2)}) ${c.slice(2,6)}-${c.slice(6)}`;
  return phone;
}
function getDaysRemaining(trialEndsAt: string | null): number {
  if (!trialEndsAt) return 0;
  return Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000));
}

// ── Types ──────────────────────────────────────────────────
interface AdminUser {
  id: string; name: string | null; email: string; cpf: string | null; phone: string | null;
  planId: string | null; billingCycle: string | null; isAdmin: boolean; createdAt: string;
  trialEndsAt: string | null; stripeCustomerId: string | null;
  stripeSubscriptionId: string | null; stripePriceId: string | null;
  adminGroupId: string | null; meetingCount: number;
  usageTranscriptions: number; usageMinutes: number;
  giftPlanId: string | null; giftEndsAt: string | null;
}
interface AdminGroup {
  id: string; name: string; description: string | null; color: string;
  createdAt: string; memberCount: number;
}

// ── EditUserDialog ─────────────────────────────────────────
function EditUserDialog({ open, onOpenChange, user, groups, onSubmit }: {
  open: boolean; onOpenChange: (o: boolean) => void; user: AdminUser | null;
  groups: AdminGroup[]; onSubmit: (userId: string, data: any) => Promise<void>;
}) {
  const [form, setForm] = useState({ name: '', email: '', planId: 'basic', billingCycle: 'monthly', adminGroupId: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      setForm({
        name: user.name || '', email: user.email || '',
        planId: user.planId || 'basic', billingCycle: user.billingCycle || 'monthly',
        adminGroupId: user.adminGroupId || '',
      });
    }
  }, [open, user]);

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try { await onSubmit(user.id, form); onOpenChange(false); } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-mono">Editar Usuário</DialogTitle>
          <DialogDescription className="font-mono text-xs">
            ID: {user?.id} | Stripe: {user?.stripeCustomerId || 'N/A'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Nome</Label>
              <Input className="h-9 text-sm mt-1" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label className="text-xs">Email</Label>
              <Input className="h-9 text-sm mt-1 font-mono" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label className="text-xs">Plano</Label>
              <Select value={form.planId} onValueChange={v => setForm({ ...form, planId: v })}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PLAN_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Ciclo</Label>
              <Select value={form.billingCycle} onValueChange={v => setForm({ ...form, billingCycle: v })}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Grupo</Label>
              <Select value={form.adminGroupId || 'none'} onValueChange={v => setForm({ ...form, adminGroupId: v === 'none' ? '' : v })}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {user?.stripeSubscriptionId && (
            <div className="p-3 bg-gray-50 rounded border text-xs font-mono space-y-1">
              <p><span className="text-gray-500">Stripe Customer:</span> {user.stripeCustomerId}</p>
              <p><span className="text-gray-500">Subscription:</span> {user.stripeSubscriptionId}</p>
              <p><span className="text-gray-500">Price ID:</span> {user.stripePriceId || 'N/A'}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button size="sm" onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── GiftPlanDialog ─────────────────────────────────────────
function GiftPlanDialog({ open, onOpenChange, user, onConfirm }: {
  open: boolean; onOpenChange: (o: boolean) => void; user: AdminUser | null;
  onConfirm: (userId: string, planId: string, expiryDate: Date) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('enterprise');
  const [duration, setDuration] = useState(30);
  const [durationUnit, setDurationUnit] = useState<'days' | 'weeks' | 'months'>('days');

  useEffect(() => {
    if (open) { setSelectedPlan('enterprise'); setDuration(30); setDurationUnit('days'); }
  }, [open]);

  const expiryDate = (() => {
    const d = new Date();
    if (durationUnit === 'days') d.setDate(d.getDate() + duration);
    else if (durationUnit === 'weeks') d.setDate(d.getDate() + duration * 7);
    else d.setMonth(d.getMonth() + duration);
    return d;
  })();

  const planLabel = PLAN_LABELS[selectedPlan] || selectedPlan;
  const dateStr = expiryDate.toLocaleDateString('pt-BR');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm flex items-center gap-2">
            <Gift className="h-4 w-4 text-amber-500" />Presentear Plano
          </DialogTitle>
          <DialogDescription className="text-xs">
            Para: <span className="font-mono font-medium">{user?.email}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs">Plano</Label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="inteligente">Inteligente</SelectItem>
                <SelectItem value="automacao">Automação</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Duração</Label>
              <Input type="number" min={1} className="h-9 text-sm mt-1" value={duration}
                onChange={e => setDuration(Math.max(1, parseInt(e.target.value) || 1))} />
            </div>
            <div>
              <Label className="text-xs">Unidade</Label>
              <Select value={durationUnit} onValueChange={v => setDurationUnit(v as any)}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">Dias</SelectItem>
                  <SelectItem value="weeks">Semanas</SelectItem>
                  <SelectItem value="months">Meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            O usuário terá acesso ao plano <strong>{planLabel}</strong> até <strong>{dateStr}</strong>.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" disabled={loading}
            onClick={async () => {
              if (!user) return;
              setLoading(true);
              try { await onConfirm(user.id, selectedPlan, expiryDate); onOpenChange(false); } finally { setLoading(false); }
            }}>
            {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Confirmar Gift
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── AssignGroupDialog ──────────────────────────────────────
function AssignGroupDialog({ open, onOpenChange, user, groups, onSubmit }: {
  open: boolean; onOpenChange: (o: boolean) => void; user: AdminUser | null;
  groups: AdminGroup[]; onSubmit: (userId: string, groupId: string | null) => Promise<void>;
}) {
  const [groupId, setGroupId] = useState('none');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) setGroupId(user.adminGroupId || 'none');
  }, [open, user]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Atribuir Grupo</DialogTitle>
          <DialogDescription className="text-xs">{user?.name || user?.email}</DialogDescription>
        </DialogHeader>
        <Select value={groupId} onValueChange={setGroupId}>
          <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum</SelectItem>
            {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button size="sm" disabled={loading} onClick={async () => {
            if (!user) return;
            setLoading(true);
            try { await onSubmit(user.id, groupId === 'none' ? null : groupId); onOpenChange(false); } finally { setLoading(false); }
          }}>
            {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main AdminPanel ────────────────────────────────────────
export default function AdminPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showNewUser, setShowNewUser] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState<AdminGroup | null>(null);
  const [costsData, setCostsData] = useState<any>(null);
  const [costsLoading, setCostsLoading] = useState(false);

  // Dialog states
  const [editOpen, setEditOpen] = useState(false);
  const [assignGroupOpen, setAssignGroupOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // New user form
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPlan, setFormPlan] = useState('basic');
  

  // Group form
  const [gName, setGName] = useState('');
  const [gDesc, setGDesc] = useState('');
  const [gColor, setGColor] = useState('#10B981');

  // Bulk
  const [bulkPlan, setBulkPlan] = useState('');

  useEffect(() => { checkAdmin(); }, [user]);

  const checkAdmin = async () => {
    if (!user) return;
    const { data } = await supabase.from('User').select('isAdmin').eq('id', user.id).maybeSingle();
    if (!data?.isAdmin) { navigate('/dashboard'); return; }
    setIsAdmin(true);
    refreshUsers();
  };

  const refreshUsers = useCallback(async () => {
    setLoading(true);
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: usersData, error } = await supabase
        .from('User')
        .select('id, name, email, cpf, phone, planId, isAdmin, billingCycle, trialEndsAt, stripeCustomerId, stripeSubscriptionId, stripePriceId, adminGroupId, createdAt, giftPlanId, giftEndsAt')
        .order('createdAt', { ascending: false });
      if (error) throw error;

      const [meetingsRes, groupsRes, usageRes] = await Promise.all([
        supabase.from('Meeting').select('userId'),
        supabase.from('AdminGroup').select('*'),
        supabase.from('Usage').select('userId, transcriptionsUsed, totalMinutesTranscribed, currentMonth'),
      ]);

      const countMap: Record<string, number> = {};
      meetingsRes.data?.forEach(m => { countMap[m.userId] = (countMap[m.userId] || 0) + 1; });

      const usageMap: Record<string, { t: number; m: number }> = {};
      usageRes.data?.forEach(u => {
        if (u.currentMonth === currentMonth) {
          usageMap[u.userId] = { t: u.transcriptionsUsed || 0, m: u.totalMinutesTranscribed || 0 };
        }
      });

      setUsers((usersData || []).map(u => ({
        ...u, meetingCount: countMap[u.id] || 0,
        usageTranscriptions: usageMap[u.id]?.t || 0,
        usageMinutes: usageMap[u.id]?.m || 0,
      })));
      setGroups((groupsRes.data || []).map(g => ({
        ...g, memberCount: (usersData || []).filter(u => u.adminGroupId === g.id).length,
      })));
    } catch (e: any) { toast.error('Erro: ' + e.message); }
    setLoading(false);
  }, []);

  const fetchGroups = useCallback(async () => {
    const { data } = await supabase.from('AdminGroup').select('*');
    if (data) setGroups(data.map(g => ({ ...g, memberCount: users.filter(u => u.adminGroupId === g.id).length })));
  }, [users]);

  const fetchCosts = useCallback(async () => {
    setCostsLoading(true);
    const { data, error } = await supabase.functions.invoke('admin-costs', { method: 'GET' });
    if (!error && data) setCostsData(data);
    setCostsLoading(false);
  }, []);

  // ── Handlers ──────────────────────────────────────────────
  const handleEditSubmit = async (userId: string, data: any) => {
    const { error } = await supabase.from('User').update({
      name: data.name, email: data.email, planId: data.planId,
      billingCycle: data.billingCycle,
      adminGroupId: data.adminGroupId || null, updatedAt: new Date().toISOString(),
    }).eq('id', userId);
    if (error) { toast.error('Erro ao salvar alterações'); throw error; }
    toast.success('Usuário atualizado!');
    refreshUsers();
  };

  const handleGiftPlan = async (userId: string, planId: string, expiryDate: Date) => {
    const user = users.find(u => u.id === userId);
    const iso = expiryDate.toISOString();
    const [userRes, profileRes] = await Promise.all([
      supabase.from('User').update({
        planId, giftPlanId: planId, giftEndsAt: iso, updatedAt: new Date().toISOString(),
      }).eq('id', userId),
      supabase.from('profiles').update({
        plan_id: planId, gift_plan_id: planId, gift_ends_at: iso, updated_at: new Date().toISOString(),
      }).eq('user_id', userId),
    ]);
    if (userRes.error || profileRes.error) { toast.error('Erro ao aplicar gift'); return; }
    const dateStr = expiryDate.toLocaleDateString('pt-BR');
    toast.success(`Gift aplicado! ${user?.email} terá ${PLAN_LABELS[planId]} até ${dateStr}`);
    refreshUsers();
  };


  const handleAssignGroup = async (userId: string, groupId: string | null) => {
    const { error } = await supabase.from('User').update({ adminGroupId: groupId, updatedAt: new Date().toISOString() }).eq('id', userId);
    if (error) { toast.error('Erro ao atribuir grupo'); throw error; }
    toast.success('Grupo atribuído!');
    refreshUsers();
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    const { error } = await supabase.from('User').delete().eq('id', userId);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Usuário excluído');
    refreshUsers();
  };

  const createUser = async () => {
    try {
      const { error } = await supabase.functions.invoke('admin-users', {
        method: 'POST',
        body: { name: formName, email: formEmail, password: formPassword, planId: formPlan, isAdmin: false },
      });
      if (error) throw error;
      toast.success('Usuário criado!');
      setShowNewUser(false);
      setFormName(''); setFormEmail(''); setFormPassword(''); setFormPlan('basic');
      refreshUsers();
    } catch (e: any) { toast.error(e.message); }
  };

  const bulkAction = async (action: string) => {
    for (const id of Array.from(selected)) {
      try {
        if (action === 'delete') await supabase.from('User').delete().eq('id', id);
        else if (action === 'plan' && bulkPlan) await supabase.from('User').update({ planId: bulkPlan }).eq('id', id);
      } catch (_) {}
    }
    toast.success('Ação aplicada');
    setSelected(new Set());
    refreshUsers();
  };

  const createGroup = async () => {
    try {
      const { error } = await supabase.functions.invoke('admin-groups', {
        method: 'POST', body: { name: gName, description: gDesc, color: gColor },
      });
      if (error) throw error;
      toast.success('Grupo criado!');
      setShowNewGroup(false);
      setGName(''); setGDesc(''); setGColor('#10B981');
      fetchGroups();
    } catch (e: any) { toast.error(e.message); }
  };

  const updateGroup = async () => {
    if (!showEditGroup) return;
    try {
      const { error } = await supabase.functions.invoke('admin-groups', {
        method: 'PATCH', body: { groupId: showEditGroup.id, name: gName, description: gDesc, color: gColor },
      });
      if (error) throw error;
      toast.success('Grupo atualizado!');
      setShowEditGroup(null);
      fetchGroups();
    } catch (e: any) { toast.error(e.message); }
  };

  const deleteGroup = async (groupId: string) => {
    if (!confirm('Excluir grupo?')) return;
    try {
      const { error } = await supabase.functions.invoke('admin-groups', {
        method: 'DELETE', body: { groupId },
      });
      if (error) throw error;
      toast.success('Grupo excluído');
      fetchGroups();
    } catch (e: any) { toast.error(e.message); }
  };

  const openEditGroup = (g: AdminGroup) => {
    setGName(g.name); setGDesc(g.description || ''); setGColor(g.color);
    setShowEditGroup(g);
  };

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); toast.success('Copiado!'); };

  // ── Loading ───────────────────────────────────────────────
  if (isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  // ── Derived data ──────────────────────────────────────────
  const now = new Date();
  const filteredUsers = users.filter(u => {
    const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (statusFilter === 'all') return true;
    const trialActive = u.trialEndsAt && new Date(u.trialEndsAt) > now;
    const trialExpired = u.trialEndsAt && new Date(u.trialEndsAt) <= now;
    if (statusFilter === 'trial') return trialActive;
    if (statusFilter === 'expired') return trialExpired;
    if (statusFilter === 'paid') return !!u.stripeSubscriptionId;
    if (statusFilter === 'free') return (u.planId || 'basic') === 'basic' && !trialActive;
    return true;
  });

  const totalUsers = users.length;
  const activeSubscriptions = users.filter(u => u.stripeSubscriptionId).length;
  const trialUsers = users.filter(u => u.trialEndsAt && new Date(u.trialEndsAt) > now).length;
  const freeUsers = users.filter(u => (u.planId || 'basic') === 'basic' && (!u.trialEndsAt || new Date(u.trialEndsAt) <= now)).length;
  const newLast7 = users.filter(u => (now.getTime() - new Date(u.createdAt).getTime()) < 7 * 86400000).length;
  const newLast30 = users.filter(u => (now.getTime() - new Date(u.createdAt).getTime()) < 30 * 86400000).length;
  const totalMeetings = users.reduce((s, u) => s + u.meetingCount, 0);

  const planDistribution = Object.entries(PLAN_LABELS).map(([id, label]) => {
    const count = users.filter(u => (u.planId || 'basic') === id).length;
    return { id, label, count, pct: totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0 };
  });
  const dotColors: Record<string, string> = { basic: 'bg-gray-400', inteligente: 'bg-emerald-500', automacao: 'bg-blue-500', enterprise: 'bg-purple-500' };

  const getUserStatus = (u: AdminUser) => {
    // 1. Active gift takes priority
    if (u.giftPlanId && u.giftEndsAt && new Date(u.giftEndsAt) > now) {
      const d = new Date(u.giftEndsAt);
      return { label: `🎁 Gift até ${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`, cls: 'bg-amber-100 text-amber-700' };
    }
    // 2. Active trial
    if (u.trialEndsAt && new Date(u.trialEndsAt) > now) {
      return { label: `Trial ${getDaysRemaining(u.trialEndsAt)}d`, cls: 'bg-amber-100 text-amber-700' };
    }
    // 3. Paid plan (not basic)
    if (u.planId && u.planId !== 'basic') {
      return { label: `Pago (${PLAN_LABELS[u.planId] || u.planId})`, cls: 'bg-green-100 text-green-700' };
    }
    // 4. Free
    return { label: 'Gratuito', cls: 'bg-gray-100 text-gray-700' };
  };

  return (
    <AppLayout>
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LogoIcon size={32} />
          <h1 className="text-lg font-bold text-foreground">Admin Console</h1>
          <VersionBadge showChangelog={false} className="ml-2" />
        </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/leads')}>
              Leads Demo
            </Button>
            <Button variant="outline" size="sm" onClick={() => refreshUsers()}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setFormName(''); setFormEmail(''); setFormPassword(''); setFormPlan('basic'); setShowNewUser(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Novo Usuário
            </Button>
          </div>
      </div>

      <div className="p-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users">Usuários ({totalUsers})</TabsTrigger>
            <TabsTrigger value="groups" onClick={fetchGroups}>Grupos ({groups.length})</TabsTrigger>
            <TabsTrigger value="costs" onClick={fetchCosts}>Custos</TabsTrigger>
          </TabsList>

          {/* ── Dashboard Tab ──────────────────────────────── */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'MRR', value: 'R$ 0', sub: 'ARR: R$ 0', icon: DollarSign },
                { label: 'Assinaturas Ativas', value: String(activeSubscriptions), sub: `${totalUsers > 0 ? Math.round((activeSubscriptions / totalUsers) * 100) : 0}% conversão`, icon: TrendingUp },
                { label: 'Em Trial', value: String(trialUsers), sub: `${freeUsers} expirados`, icon: Clock },
                { label: 'Churn Rate', value: '0%', sub: `${freeUsers} usuários free`, icon: BarChart3 },
              ].map((c, i) => (
                <Card key={i} className="bg-card border-border">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">{c.label}</p>
                      <c.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold font-mono text-foreground">{c.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Usuários', value: String(totalUsers), sub: `${newLast7} novos (7d)`, icon: Users },
                { label: 'Novos (30d)', value: String(newLast30), icon: Zap },
                { label: 'Reuniões', value: String(totalMeetings), icon: FileAudio },
                { label: 'Grupos', value: String(groups.length), icon: Clock },
              ].map((c, i) => (
                <Card key={i} className="bg-card border-border">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">{c.label}</p>
                      <c.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold font-mono text-foreground">{c.value}</p>
                    {'sub' in c && c.sub && <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="text-base">Distribuição por Plano</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {planDistribution.map(p => (
                    <div key={p.id} className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
                      <span className={`w-2.5 h-2.5 rounded-full ${dotColors[p.id]}`} />
                      <span className="text-sm font-medium">{p.label}</span>
                      <span className="text-xs text-muted-foreground font-mono">{p.count} ({p.pct}%)</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Collapsible>
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CollapsibleTrigger className="flex items-center justify-between w-full">
                    <CardTitle className="text-base">Versão Atual</CardTitle>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </CollapsibleTrigger>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground font-mono mt-1">
                    <span>{appVersion.version}</span>
                    <span className="opacity-40">•</span>
                    <span>{appVersion.releaseDate}</span>
                    <span className="opacity-40">•</span>
                    <span>{appVersion.environmentLabel}</span>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="pt-2 space-y-3">
                    <ul className="text-sm space-y-1 list-disc pl-5 text-muted-foreground">
                      {appVersion.changelog.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        const info = `Ágata ${appVersion.version}\nRelease: ${appVersion.releaseDate}\nEnv: ${appVersion.environmentLabel}\n\nChangelog:\n${appVersion.changelog.map(c => `- ${c}`).join('\n')}`;
                        navigator.clipboard.writeText(info);
                        toast.success('Informações de versão copiadas!');
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copiar informações
                    </Button>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-base">Ações</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={async () => {
                    toast.info('Iniciando backup...');
                    const { data, error } = await supabase.functions.invoke('backup-database');
                    if (error) {
                      toast.error('Erro ao fazer backup');
                    } else {
                      toast.success(`Backup criado: ${data.file} (${data.stats.length} tabelas)`);
                    }
                  }}
                >
                  <Database className="h-4 w-4" />
                  Backup Manual
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Users Tab ──────────────────────────────────── */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input placeholder="Buscar por nome ou email..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="trial">Trial Ativo</SelectItem>
                  <SelectItem value="expired">Trial Expirado</SelectItem>
                  <SelectItem value="paid">Pagos</SelectItem>
                  <SelectItem value="free">Gratuitos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selected.size > 0 && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex-wrap">
                <span className="text-sm font-medium text-blue-800">{selected.size} selecionado(s)</span>
                <Select value={bulkPlan} onValueChange={setBulkPlan}>
                  <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Plano" /></SelectTrigger>
                  <SelectContent>{Object.entries(PLAN_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => bulkAction('plan')} disabled={!bulkPlan}>Aplicar</Button>
                <Button size="sm" variant="destructive" className="h-8 text-xs" onClick={() => bulkAction('delete')}><Trash2 className="h-3 w-3 mr-1" />Excluir</Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs ml-auto" onClick={() => setSelected(new Set())}><X className="h-3 w-3" /></Button>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <Card className="bg-white overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox checked={selected.size === filteredUsers.length && filteredUsers.length > 0}
                          onCheckedChange={(c) => setSelected(c ? new Set(filteredUsers.map(u => u.id)) : new Set())} />
                      </TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Reuniões</TableHead>
                      <TableHead className="text-center">Uso Mês</TableHead>
                      <TableHead className="text-center">Min Mês</TableHead>
                      <TableHead className="text-center">% Limite</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead className="w-44">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map(u => {
                      const status = getUserStatus(u);
                      const d = new Date(u.createdAt);
                      const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`;
                      return (
                        <TableRow key={u.id}>
                          <TableCell>
                            <Checkbox checked={selected.has(u.id)}
                              onCheckedChange={(c) => { const n = new Set(selected); c ? n.add(u.id) : n.delete(u.id); setSelected(n); }} />
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-bold">{u.name || '—'} {u.isAdmin && <Badge variant="destructive" className="text-[9px] ml-1">ADMIN</Badge>}</p>
                            <p className="text-xs text-gray-500 font-mono">{u.email}</p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-mono truncate max-w-[140px]">{u.email}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(u.email)}><Copy className="h-3 w-3" /></Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-mono">{formatCPF(u.cpf)}</TableCell>
                          <TableCell className="text-xs">{formatPhone(u.phone)}</TableCell>
                          <TableCell>
                            <Badge className={`${PLAN_COLORS[u.planId || 'basic']} text-[10px]`}>{PLAN_LABELS[u.planId || 'basic']}</Badge>
                            {u.giftPlanId && u.giftEndsAt && new Date(u.giftEndsAt) > now && (
                              <Badge className="bg-amber-100 text-amber-700 text-[9px] ml-1">
                                🎁 gift até {new Date(u.giftEndsAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${status.cls}`}>{status.label}</span></TableCell>
                          <TableCell className="text-center font-mono text-sm">{u.meetingCount}</TableCell>
                          <TableCell className="text-center font-mono text-xs">{u.usageTranscriptions}</TableCell>
                          <TableCell className="text-center font-mono text-xs">{u.usageMinutes}</TableCell>
                          <TableCell className="text-center">
                            {(() => {
                              const limits: Record<string, number> = { basic: 3, inteligente: 20, automacao: 60, enterprise: 999999 };
                              const max = limits[u.planId || 'basic'] || 3;
                              const pct = max > 0 ? Math.min(100, Math.round((u.usageTranscriptions / max) * 100)) : 0;
                              const color = pct >= 100 ? 'text-red-600 font-bold' : pct >= 80 ? 'text-amber-600 font-medium' : 'text-muted-foreground';
                              return <span className={`text-xs font-mono ${color}`}>{u.planId === 'enterprise' ? '—' : `${pct}%`}</span>;
                            })()}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{dateStr}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar usuário"
                                onClick={() => { setSelectedUser(u); setEditOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="Atribuir grupo"
                                onClick={() => { setSelectedUser(u); setAssignGroupOpen(true); }}><FolderOpen className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className={`h-7 w-7 ${u.planId === 'enterprise' ? 'text-purple-500 hover:text-purple-700 hover:bg-purple-50' : 'text-gray-300 hover:text-purple-500 hover:bg-purple-50'}`} title="Conceder Enterprise gratuito"
                                onClick={() => { setSelectedUser(u); setGiftOpen(true); }}><Gift className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50" title="Excluir usuário"
                                onClick={() => handleDeleteUser(u.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          {/* ── Groups Tab ─────────────────────────────────── */}
          <TabsContent value="groups" className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setGName(''); setGDesc(''); setGColor('#10B981'); setShowNewGroup(true); }}>
                <Plus className="h-4 w-4 mr-1" /> Novo Grupo
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map(g => (
                <Card key={g.id} className="bg-white">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <span className="w-4 h-4 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: g.color }} />
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{g.name}</h3>
                        {g.description && <p className="text-xs text-muted-foreground mt-1">{g.description}</p>}
                        <p className="text-xs text-muted-foreground mt-2">{g.memberCount} membros</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditGroup(g)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteGroup(g.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {groups.length === 0 && <p className="text-sm text-muted-foreground col-span-3 text-center py-8">Nenhum grupo criado</p>}
            </div>
          </TabsContent>

          {/* ── Costs Tab ──────────────────────────────────── */}
          <TabsContent value="costs" className="space-y-6">
            {costsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : costsData ? (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Transcrições', value: String(costsData.totalTranscriptions), color: 'border-l-emerald-500' },
                    { label: 'Minutos Transcritos', value: String(costsData.totalMinutes), sub: `~${Math.round(costsData.totalMinutes / 60)}h`, color: 'border-l-blue-500' },
                    { label: 'Custo Total', value: `R$ ${(costsData.totalCostCents / 100).toFixed(2)}`, color: 'border-l-orange-500' },
                    { label: 'Economia Gemini', value: 'Free Tier', sub: 'Gemini 2.5 Flash', color: 'border-l-green-500' },
                  ].map((c, i) => (
                    <Card key={i} className={`border-l-4 ${c.color} bg-white`}>
                      <CardContent className="p-5">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">{c.label}</p>
                        <p className="text-2xl font-bold font-mono text-foreground mt-1">{c.value}</p>
                        {c.sub && <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Card className="bg-white">
                  <CardHeader><CardTitle className="text-base">Uso por Provedor — Mês Atual</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {Object.entries(costsData.currentMonthProviders || {}).map(([provider, stats]: [string, any]) => (
                        <div key={provider} className="border rounded-lg p-4">
                          <Badge className={['groq', 'gemini'].includes(provider) ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}>
                            {provider === 'gemini' || provider === 'groq' ? 'Gemini (Free Tier)' : provider}
                          </Badge>
                          <div className="mt-3 space-y-1">
                            <p className="text-sm"><span className="text-muted-foreground">Minutos:</span> <span className="font-mono font-medium">{stats.minutes}</span></p>
                            <p className="text-sm"><span className="text-muted-foreground">Custo:</span> <span className="font-mono font-medium">R$ {(stats.cost / 100).toFixed(2)}</span></p>
                            <p className="text-sm"><span className="text-muted-foreground">Transcrições:</span> <span className="font-mono font-medium">{stats.count}</span></p>
                          </div>
                        </div>
                      ))}
                      {Object.keys(costsData.currentMonthProviders || {}).length === 0 && (
                        <p className="text-sm text-muted-foreground col-span-2 text-center py-4">Sem dados este mês</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white">
                  <CardHeader><CardTitle className="text-base">Logs Recentes</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Provedor</TableHead>
                          <TableHead>Duração</TableHead>
                          <TableHead>Chunks</TableHead>
                          <TableHead>Custo</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(costsData.recentLogs || []).map((log: any) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-xs font-mono">{new Date(log.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>
                              <Badge className={['groq', 'gemini'].includes(log.provider) ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}>
                                {log.provider === 'gemini' || log.provider === 'groq' ? 'Gemini (Free Tier)' : log.provider}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{Math.round(log.durationSecs / 60)}min</TableCell>
                            <TableCell className="font-mono text-sm">{log.chunks}</TableCell>
                            <TableCell className="font-mono text-sm">R$ {(log.costCents / 100).toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge className={log.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                                {log.success ? 'OK' : 'FALHA'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            ) : (
              <p className="text-center text-muted-foreground py-8">Clique na aba para carregar os dados de custos</p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Dialogs ──────────────────────────────────────── */}
      <Dialog open={showNewUser} onOpenChange={setShowNewUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
            <DialogDescription>Crie um novo usuário na plataforma.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={formName} onChange={e => setFormName(e.target.value)} /></div>
            <div><Label>Email *</Label><Input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} /></div>
            <div><Label>Senha *</Label><Input type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)} /></div>
            <div><Label>Plano</Label>
              <Select value={formPlan} onValueChange={setFormPlan}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(PLAN_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            
          </div>
          <DialogFooter><Button onClick={createUser}>Criar Usuário</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <EditUserDialog open={editOpen} onOpenChange={setEditOpen} user={selectedUser} groups={groups} onSubmit={handleEditSubmit} />
      <AssignGroupDialog open={assignGroupOpen} onOpenChange={setAssignGroupOpen} user={selectedUser} groups={groups} onSubmit={handleAssignGroup} />
      <GiftPlanDialog open={giftOpen} onOpenChange={setGiftOpen} user={selectedUser} onConfirm={handleGiftPlan} />

      <Dialog open={showNewGroup} onOpenChange={setShowNewGroup}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Grupo</DialogTitle><DialogDescription>Crie um grupo para organizar usuários.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={gName} onChange={e => setGName(e.target.value)} /></div>
            <div><Label>Descrição</Label><Input value={gDesc} onChange={e => setGDesc(e.target.value)} /></div>
            <div><Label>Cor</Label>
              <div className="flex gap-2 mt-2">
                {COLOR_PRESETS.map(c => (
                  <button key={c} className={`w-8 h-8 rounded-full border-2 ${gColor === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }} onClick={() => setGColor(c)} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter><Button onClick={createGroup}>Criar Grupo</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showEditGroup} onOpenChange={() => setShowEditGroup(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Grupo</DialogTitle><DialogDescription>Atualize as informações do grupo.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={gName} onChange={e => setGName(e.target.value)} /></div>
            <div><Label>Descrição</Label><Input value={gDesc} onChange={e => setGDesc(e.target.value)} /></div>
            <div><Label>Cor</Label>
              <div className="flex gap-2 mt-2">
                {COLOR_PRESETS.map(c => (
                  <button key={c} className={`w-8 h-8 rounded-full border-2 ${gColor === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }} onClick={() => setGColor(c)} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter><Button onClick={updateGroup}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </AppLayout>
  );
}
