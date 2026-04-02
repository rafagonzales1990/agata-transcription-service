import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  RefreshCw, Plus, Pencil, Trash2, ShieldCheck, ShieldOff, X,
  DollarSign, Users, Clock, Zap, TrendingUp, BarChart3, FileAudio, Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { LogoIcon } from '@/components/LogoIcon';

const PLAN_COLORS: Record<string, string> = {
  basic: 'bg-gray-100 text-gray-700',
  inteligente: 'bg-emerald-100 text-emerald-700',
  automacao: 'bg-blue-100 text-blue-700',
  enterprise: 'bg-purple-100 text-purple-700',
};

const PLAN_LABELS: Record<string, string> = {
  basic: 'Gratuito',
  inteligente: 'Inteligente',
  automacao: 'Automação',
  enterprise: 'Enterprise',
};

const COLOR_PRESETS = ['#10B981', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6', '#06B6D4', '#EC4899', '#64748B'];

interface AdminUser {
  id: string; name: string | null; email: string; planId: string | null;
  billingCycle: string | null; isAdmin: boolean; createdAt: string;
  trialEndsAt: string | null; stripeCustomerId: string | null;
  stripeSubscriptionId: string | null; stripePriceId: string | null;
  adminGroupId: string | null; meetingCount: number;
  usage: { transcriptionsUsed: number; totalMinutesTranscribed: number } | null;
  group: { id: string; name: string; color: string } | null;
}

interface AdminGroup {
  id: string; name: string; description: string | null; color: string;
  createdAt: string; memberCount: number;
}

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
  const [showEditUser, setShowEditUser] = useState<AdminUser | null>(null);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState<AdminGroup | null>(null);
  const [costsData, setCostsData] = useState<any>(null);
  const [costsLoading, setCostsLoading] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPlan, setFormPlan] = useState('basic');
  const [formCycle, setFormCycle] = useState('monthly');
  const [formAdmin, setFormAdmin] = useState(false);
  const [formGroupId, setFormGroupId] = useState('');

  // Group form
  const [gName, setGName] = useState('');
  const [gDesc, setGDesc] = useState('');
  const [gColor, setGColor] = useState('#10B981');

  // Bulk
  const [bulkPlan, setBulkPlan] = useState('');
  const [bulkGroup, setBulkGroup] = useState('');

  useEffect(() => {
    checkAdmin();
  }, [user]);

  const checkAdmin = async () => {
    if (!user) return;
    const { data } = await supabase.from('User').select('isAdmin').eq('id', user.id).single();
    if (!data?.isAdmin) {
      navigate('/dashboard');
      return;
    }
    setIsAdmin(true);
    fetchData();
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-users', { method: 'GET' });
      if (error) throw error;
      setUsers(data.users || []);
      setGroups(data.groups?.map((g: any) => ({ ...g, memberCount: 0 })) || []);
    } catch (e: any) {
      toast.error(e.message);
    }
    setLoading(false);
  }, []);

  const fetchGroups = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('admin-groups', { method: 'GET' });
    if (!error && data) setGroups(data.groups || []);
  }, []);

  const fetchCosts = useCallback(async () => {
    setCostsLoading(true);
    const { data, error } = await supabase.functions.invoke('admin-costs', { method: 'GET' });
    if (!error && data) setCostsData(data);
    setCostsLoading(false);
  }, []);

  const createUser = async () => {
    try {
      const { error } = await supabase.functions.invoke('admin-users', {
        method: 'POST',
        body: { name: formName, email: formEmail, password: formPassword, planId: formPlan, billingCycle: formCycle, isAdmin: formAdmin },
      });
      if (error) throw error;
      toast.success('Usuário criado!');
      setShowNewUser(false);
      resetForm();
      fetchData();
    } catch (e: any) { toast.error(e.message); }
  };

  const updateUser = async () => {
    if (!showEditUser) return;
    try {
      const { error } = await supabase.functions.invoke('admin-users', {
        method: 'PATCH',
        body: { userId: showEditUser.id, name: formName, planId: formPlan, billingCycle: formCycle, isAdmin: formAdmin, adminGroupId: formGroupId || null },
      });
      if (error) throw error;
      toast.success('Usuário atualizado!');
      setShowEditUser(null);
      fetchData();
    } catch (e: any) { toast.error(e.message); }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      const { error } = await supabase.functions.invoke('admin-users', {
        method: 'DELETE', body: { userId },
      });
      if (error) throw error;
      toast.success('Usuário excluído');
      fetchData();
    } catch (e: any) { toast.error(e.message); }
  };

  const bulkAction = async (action: string) => {
    const ids = Array.from(selected);
    for (const id of ids) {
      try {
        if (action === 'delete') {
          await supabase.functions.invoke('admin-users', { method: 'DELETE', body: { userId: id } });
        } else {
          const body: any = { userId: id };
          if (action === 'plan' && bulkPlan) body.planId = bulkPlan;
          if (action === 'group' && bulkGroup) body.adminGroupId = bulkGroup;
          if (action === 'addAdmin') body.isAdmin = true;
          if (action === 'removeAdmin') body.isAdmin = false;
          await supabase.functions.invoke('admin-users', { method: 'PATCH', body });
        }
      } catch (_) {}
    }
    toast.success('Ação aplicada');
    setSelected(new Set());
    fetchData();
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

  const resetForm = () => {
    setFormName(''); setFormEmail(''); setFormPassword('');
    setFormPlan('basic'); setFormCycle('monthly'); setFormAdmin(false); setFormGroupId('');
  };

  const openEditUser = (u: AdminUser) => {
    setFormName(u.name || '');
    setFormEmail(u.email);
    setFormPlan(u.planId || 'basic');
    setFormCycle(u.billingCycle || 'monthly');
    setFormAdmin(u.isAdmin);
    setFormGroupId(u.adminGroupId || '');
    setShowEditUser(u);
  };

  const openEditGroup = (g: AdminGroup) => {
    setGName(g.name); setGDesc(g.description || ''); setGColor(g.color);
    setShowEditGroup(g);
  };

  if (isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const now = new Date();
  const filteredUsers = users.filter(u => {
    const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (statusFilter === 'all') return true;
    const trialActive = u.planId === 'basic' && u.trialEndsAt && new Date(u.trialEndsAt) > now;
    const trialExpired = u.planId === 'basic' && u.trialEndsAt && new Date(u.trialEndsAt) <= now;
    const paid = !!u.stripeSubscriptionId;
    if (statusFilter === 'trial') return trialActive;
    if (statusFilter === 'expired') return trialExpired;
    if (statusFilter === 'paid') return paid;
    if (statusFilter === 'free') return u.planId === 'basic' && !trialActive;
    return true;
  });

  const totalUsers = users.length;
  const activeSubscriptions = users.filter(u => u.stripeSubscriptionId).length;
  const trialUsers = users.filter(u => u.planId === 'basic' && u.trialEndsAt && new Date(u.trialEndsAt) > now).length;
  const freeUsers = users.filter(u => u.planId === 'basic' && (!u.trialEndsAt || new Date(u.trialEndsAt) <= now)).length;
  const newLast7 = users.filter(u => (now.getTime() - new Date(u.createdAt).getTime()) < 7 * 86400000).length;
  const newLast30 = users.filter(u => (now.getTime() - new Date(u.createdAt).getTime()) < 30 * 86400000).length;
  const totalMeetings = users.reduce((s, u) => s + u.meetingCount, 0);
  const totalMinutesAll = users.reduce((s, u) => s + (u.usage?.totalMinutesTranscribed || 0), 0);

  const planDistribution = Object.entries(PLAN_LABELS).map(([id, label]) => {
    const count = users.filter(u => (u.planId || 'basic') === id).length;
    return { id, label, count, pct: totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0 };
  });

  const dotColors: Record<string, string> = { basic: 'bg-gray-400', inteligente: 'bg-emerald-500', automacao: 'bg-blue-500', enterprise: 'bg-purple-500' };

  const getUserStatus = (u: AdminUser) => {
    if (u.stripeSubscriptionId) return { label: 'Ativo', cls: 'bg-green-100 text-green-700' };
    const trialActive = u.planId === 'basic' && u.trialEndsAt && new Date(u.trialEndsAt) > now;
    if (trialActive) {
      const days = Math.ceil((new Date(u.trialEndsAt!).getTime() - now.getTime()) / 86400000);
      return { label: `Trial ${days}d`, cls: 'bg-amber-100 text-amber-700' };
    }
    const trialExpired = u.trialEndsAt && new Date(u.trialEndsAt) <= now;
    if (trialExpired) return { label: 'Trial expirado', cls: 'bg-red-100 text-red-700' };
    return { label: 'Gratuito', cls: 'bg-gray-100 text-gray-700' };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LogoIcon size={32} />
          <div>
            <h1 className="text-lg font-bold text-foreground">Admin Console v2.0</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { fetchData(); fetchGroups(); }}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { resetForm(); setShowNewUser(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Novo Usuário
          </Button>
        </div>
      </div>

      <div className="p-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users">Usuários ({totalUsers})</TabsTrigger>
            <TabsTrigger value="groups" onClick={fetchGroups}>Grupos ({groups.length})</TabsTrigger>
            <TabsTrigger value="costs" onClick={fetchCosts}>Custos</TabsTrigger>
          </TabsList>

          {/* TAB: Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'MRR', value: 'R$ 0', sub: 'ARR: R$ 0', color: 'border-l-emerald-500', icon: DollarSign },
                { label: 'Assinaturas Ativas', value: String(activeSubscriptions), sub: `${totalUsers > 0 ? Math.round((activeSubscriptions / totalUsers) * 100) : 0}% conversão`, color: 'border-l-blue-500', icon: TrendingUp },
                { label: 'Em Trial', value: String(trialUsers), sub: `${freeUsers} expirados`, color: 'border-l-amber-500', icon: Clock },
                { label: 'Churn Rate', value: '0%', sub: `${freeUsers} usuários free`, color: 'border-l-red-500', icon: BarChart3 },
              ].map((c, i) => (
                <Card key={i} className={`border-l-4 ${c.color} bg-white`}>
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
                { label: 'Total Usuários', value: String(totalUsers), sub: `${newLast7} novos (7d)`, color: 'border-l-indigo-500', icon: Users },
                { label: 'Novos (30d)', value: String(newLast30), sub: '', color: 'border-l-violet-500', icon: Zap },
                { label: 'Reuniões', value: String(totalMeetings), sub: '', color: 'border-l-cyan-500', icon: FileAudio },
                { label: 'Min Transcritos', value: String(totalMinutesAll), sub: `~${Math.round(totalMinutesAll / 60)}h`, color: 'border-l-pink-500', icon: Clock },
              ].map((c, i) => (
                <Card key={i} className={`border-l-4 ${c.color} bg-white`}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">{c.label}</p>
                      <c.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold font-mono text-foreground">{c.value}</p>
                    {c.sub && <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-white">
              <CardHeader><CardTitle className="text-base">Distribuição por Plano</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {planDistribution.map(p => (
                    <div key={p.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full">
                      <span className={`w-2.5 h-2.5 rounded-full ${dotColors[p.id]}`} />
                      <span className="text-sm font-medium">{p.label}</span>
                      <span className="text-xs text-muted-foreground font-mono">{p.count} ({p.pct}%)</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Usuários */}
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
                  <SelectContent>
                    {Object.entries(PLAN_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => bulkAction('plan')} disabled={!bulkPlan}>Aplicar</Button>
                <Select value={bulkGroup} onValueChange={setBulkGroup}>
                  <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Grupo" /></SelectTrigger>
                  <SelectContent>
                    {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => bulkAction('group')} disabled={!bulkGroup}>Aplicar</Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => bulkAction('addAdmin')}><ShieldCheck className="h-3 w-3 mr-1" />+Admin</Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => bulkAction('removeAdmin')}><ShieldOff className="h-3 w-3 mr-1" />-Admin</Button>
                <Button size="sm" variant="destructive" className="h-8 text-xs" onClick={() => bulkAction('delete')}><Trash2 className="h-3 w-3 mr-1" />Excluir</Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs ml-auto" onClick={() => setSelected(new Set())}><X className="h-3 w-3" /></Button>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <Card className="bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={selected.size === filteredUsers.length && filteredUsers.length > 0}
                          onCheckedChange={(c) => setSelected(c ? new Set(filteredUsers.map(u => u.id)) : new Set())}
                        />
                      </TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Grupo</TableHead>
                      <TableHead className="text-center">Reuniões</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="w-20">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map(u => {
                      const status = getUserStatus(u);
                      return (
                        <TableRow key={u.id}>
                          <TableCell>
                            <Checkbox
                              checked={selected.has(u.id)}
                              onCheckedChange={(c) => {
                                const next = new Set(selected);
                                c ? next.add(u.id) : next.delete(u.id);
                                setSelected(next);
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{u.name || '—'} {u.isAdmin && <Badge variant="destructive" className="text-[9px] ml-1">ADMIN</Badge>}</p>
                              <p className="text-xs text-muted-foreground font-mono">{u.email}</p>
                            </div>
                          </TableCell>
                          <TableCell><Badge className={`${PLAN_COLORS[u.planId || 'basic']} text-[10px]`}>{PLAN_LABELS[u.planId || 'basic']}</Badge></TableCell>
                          <TableCell><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${status.cls}`}>{status.label}</span></TableCell>
                          <TableCell>
                            {u.group ? (
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: u.group.color }} />
                                <span className="text-xs">{u.group.name}</span>
                              </div>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-center font-mono text-sm">{u.meetingCount}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditUser(u)}><Pencil className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteUser(u.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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

          {/* TAB: Grupos */}
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

          {/* TAB: Custos */}
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
                          <Badge className={provider.includes('openai') ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}>{provider}</Badge>
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
                              <Badge className={log.provider?.includes('openai') ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}>{log.provider}</Badge>
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

      {/* New User Dialog */}
      <Dialog open={showNewUser} onOpenChange={setShowNewUser}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Usuário</DialogTitle></DialogHeader>
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
            <div><Label>Ciclo</Label>
              <Select value={formCycle} onValueChange={setFormCycle}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2"><Switch checked={formAdmin} onCheckedChange={setFormAdmin} /><Label>Admin</Label></div>
          </div>
          <DialogFooter><Button onClick={createUser}>Criar Usuário</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!showEditUser} onOpenChange={() => setShowEditUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Usuário</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={formName} onChange={e => setFormName(e.target.value)} /></div>
            <div><Label>Email</Label><Input value={formEmail} disabled className="bg-muted" /></div>
            <div><Label>Plano</Label>
              <Select value={formPlan} onValueChange={setFormPlan}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(PLAN_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Ciclo</Label>
              <Select value={formCycle} onValueChange={setFormCycle}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Grupo</Label>
              <Select value={formGroupId} onValueChange={setFormGroupId}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {showEditUser?.stripeSubscriptionId && (
              <div className="border rounded-lg p-3 bg-muted/50 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Stripe Info</p>
                <p className="text-xs font-mono">Customer: {showEditUser.stripeCustomerId}</p>
                <p className="text-xs font-mono">Subscription: {showEditUser.stripeSubscriptionId}</p>
                <p className="text-xs font-mono">Price: {showEditUser.stripePriceId}</p>
              </div>
            )}
            <div className="flex items-center gap-2"><Switch checked={formAdmin} onCheckedChange={setFormAdmin} /><Label>Admin</Label></div>
          </div>
          <DialogFooter><Button onClick={updateUser}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Group Dialog */}
      <Dialog open={showNewGroup} onOpenChange={setShowNewGroup}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Grupo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={gName} onChange={e => setGName(e.target.value)} /></div>
            <div><Label>Descrição</Label><Input value={gDesc} onChange={e => setGDesc(e.target.value)} /></div>
            <div>
              <Label>Cor</Label>
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

      {/* Edit Group Dialog */}
      <Dialog open={!!showEditGroup} onOpenChange={() => setShowEditGroup(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Grupo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={gName} onChange={e => setGName(e.target.value)} /></div>
            <div><Label>Descrição</Label><Input value={gDesc} onChange={e => setGDesc(e.target.value)} /></div>
            <div>
              <Label>Cor</Label>
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
  );
}
