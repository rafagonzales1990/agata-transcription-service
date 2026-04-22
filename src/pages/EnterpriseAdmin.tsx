import { useEffect, useState, useCallback, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users, FileText, Clock, Loader2, Trash2, Send, Building2, Settings, BarChart3,
  FolderKanban, UserMinus, AlertTriangle, LogOut as LogOutIcon, Plus, Pencil,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// ─── Types ───
interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  planId: string | null;
  teamId: string | null;
  createdAt: string;
}

interface MemberUsage {
  userId: string;
  transcriptionsUsed: number;
  totalMinutesTranscribed: number;
  currentMonth: string;
}

interface PendingInvite {
  id: string;
  email: string;
  createdAt: string;
  expiresAt: string;
  status: string;
}

interface TeamMeeting {
  id: string;
  title: string;
  userId: string;
  projectId: string | null;
  createdAt: string;
  fileDuration: number | null;
  status: string;
}

interface TeamProject {
  id: string;
  name: string;
  color: string;
  userId: string;
  teamId: string | null;
  createdAt: string;
  description?: string | null;
}

interface AdminUser {
  role: string;
  isTeamOwner: boolean;
  teamId: string | null;
}

// ─── Helpers ───
const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');
const formatDuration = (secs: number | null) => {
  if (!secs) return '—';
  const m = Math.round(secs / 60);
  return `${m} min`;
};

const STATUS_LABELS: Record<string, string> = {
  completed: 'Concluída',
  failed: 'Erro',
  processing: 'Processando',
  pending: 'Pendente',
  transcribing: 'Transcrevendo',
};
const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  processing: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  pending: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  transcribing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

const COLOR_PRESETS = ['#059669', '#0D1F2D', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#6B7280'];
const MEMBER_COLORS = ['#059669', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#F97316'];

export default function EnterpriseAdmin() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [usages, setUsages] = useState<MemberUsage[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [meetings, setMeetings] = useState<TeamMeeting[]>([]);
  const [projects, setProjects] = useState<TeamProject[]>([]);
  const [team, setTeam] = useState<{ id: string; name: string; companyName: string | null } | null>(null);

  // UI state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<TeamMember | null>(null);

  // Settings state
  const [teamName, setTeamName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [dissolveConfirm, setDissolveConfirm] = useState(false);
  const [dissolveText, setDissolveText] = useState('');
  const [dissolving, setDissolving] = useState(false);
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Meetings filters
  const [filterMember, setFilterMember] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Project modal
  const [projectModal, setProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<TeamProject | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectColor, setProjectColor] = useState('#059669');
  const [savingProject, setSavingProject] = useState(false);

  const activeTab = searchParams.get('tab') || 'dashboard';
  const setActiveTab = (t: string) => setSearchParams({ tab: t });

  // ─── Access check & data fetch ───
  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: userData } = await supabase
      .from('User')
      .select('role, isTeamOwner, teamId')
      .eq('id', user.id)
      .maybeSingle();

    if (!userData || (userData.role !== 'enterprise_admin' && !userData.isTeamOwner)) {
      navigate('/dashboard');
      return;
    }

    setAdminUser(userData as AdminUser);
    const tid = userData.teamId;
    setTeamId(tid);

    if (!tid) { setLoading(false); return; }

    // Parallel fetches
    const [membersRes, invitesRes, meetingsRes, projectsRes, teamRes] = await Promise.all([
      supabase.from('User').select('id, name, email, planId, teamId, createdAt').eq('teamId', tid),
      supabase.from('TeamInvite').select('id, email, createdAt, expiresAt, status').eq('teamId', tid).eq('status', 'pending').order('createdAt', { ascending: false }),
      supabase.from('Meeting').select('id, title, userId, projectId, createdAt, fileDuration, status').in('userId', []),
      supabase.from('Project').select('id, name, color, userId, teamId, createdAt').eq('teamId', tid),
      supabase.from('Team').select('id, name, companyName').eq('id', tid).maybeSingle(),
    ]);

    const teamMembers = (membersRes.data || []) as TeamMember[];
    setMembers(teamMembers);
    setInvites((invitesRes.data || []) as PendingInvite[]);
    setProjects((projectsRes.data || []) as TeamProject[]);
    if (teamRes.data) {
      setTeam(teamRes.data as any);
      setTeamName(teamRes.data.name || '');
      setCompanyName((teamRes.data as any).companyName || '');
    }

    // Fetch meetings & usage for members
    const memberIds = teamMembers.map(m => m.id);
    if (memberIds.length > 0) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const [meetRes, usageRes] = await Promise.all([
        supabase.from('Meeting').select('id, title, userId, projectId, createdAt, fileDuration, status').in('userId', memberIds).order('createdAt', { ascending: false }),
        supabase.from('Usage').select('userId, transcriptionsUsed, totalMinutesTranscribed, currentMonth').in('userId', memberIds).eq('currentMonth', currentMonth),
      ]);
      setMeetings((meetRes.data || []) as TeamMeeting[]);
      setUsages((usageRes.data || []) as MemberUsage[]);
    }

    setLoading(false);
  }, [user, navigate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── Computed ───
  const getUsage = (userId: string) => usages.find(u => u.userId === userId);
  const getMemberName = (userId: string) => members.find(m => m.id === userId)?.name || members.find(m => m.id === userId)?.email || '—';

  const currentMonthStart = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }, []);

  const meetingsThisMonth = meetings.filter(m => new Date(m.createdAt) >= currentMonthStart).length;
  const totalMinutes = usages.reduce((s, u) => s + u.totalMinutesTranscribed, 0);
  const pendingInvitesCount = invites.length;

  // Chart data — meetings per member, last 4 weeks
  const chartData = useMemo(() => {
    const now = new Date();
    const weeks = Array.from({ length: 4 }, (_, i) => {
      const end = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { label: `Semana ${4 - i}`, start, end };
    });

    return weeks.map(w => {
      const row: Record<string, any> = { name: w.label };
      members.forEach(m => {
        row[m.name || m.email] = meetings.filter(mt =>
          mt.userId === m.id && new Date(mt.createdAt) >= w.start && new Date(mt.createdAt) < w.end
        ).length;
      });
      return row;
    });
  }, [members, meetings]);

  // Filtered meetings
  const filteredMeetings = useMemo(() => {
    let list = meetings;
    if (filterMember !== 'all') list = list.filter(m => m.userId === filterMember);
    if (filterStatus !== 'all') list = list.filter(m => m.status === filterStatus);
    return list;
  }, [meetings, filterMember, filterStatus]);

  // ─── Actions ───
  const handleInvite = async () => {
    if (!inviteEmail.trim() || !teamId) return;
    setInviting(true);
    try {
      const { error } = await supabase.functions.invoke('invite-team-member', {
        body: { email: inviteEmail.trim(), teamId },
      });
      if (error) throw error;
      toast.success('Convite enviado!');
      setInviteEmail('');
      fetchAll();
    } catch {
      toast.error('Erro ao enviar convite');
    }
    setInviting(false);
  };

  const handleCancelInvite = async (id: string) => {
    setCancellingId(id);
    const { error } = await supabase.from('TeamInvite').delete().eq('id', id);
    if (error) toast.error('Erro ao cancelar convite');
    else { setInvites(prev => prev.filter(i => i.id !== id)); toast.success('Convite cancelado'); }
    setCancellingId(null);
  };

  const handleRemoveMember = async () => {
    if (!confirmRemove) return;
    setRemovingId(confirmRemove.id);
    const { error } = await supabase
      .from('User')
      .update({ teamId: null, updatedAt: new Date().toISOString() } as any)
      .eq('id', confirmRemove.id);
    if (error) toast.error('Erro ao remover membro');
    else { setMembers(prev => prev.filter(m => m.id !== confirmRemove.id)); toast.success('Membro removido do time'); }
    setRemovingId(null);
    setConfirmRemove(null);
  };

  const handleSaveSettings = async () => {
    if (!teamId) return;
    setSavingSettings(true);
    const { error } = await supabase
      .from('Team')
      .update({ name: teamName, companyName } as any)
      .eq('id', teamId);
    if (error) toast.error('Erro ao salvar');
    else toast.success('Configurações salvas!');
    setSavingSettings(false);
  };

  const handleDissolve = async () => {
    if (!teamId || dissolveText !== 'DISSOLVER') return;
    setDissolving(true);
    // Remove all members
    await supabase.from('User').update({ teamId: null, updatedAt: new Date().toISOString() } as any).eq('teamId', teamId);
    // Delete team
    await supabase.from('Team').delete().eq('id', teamId);
    toast.success('Time dissolvido');
    setDissolving(false);
    navigate('/dashboard');
  };

  const handleLeave = async () => {
    if (!user) return;
    setLeaving(true);
    await supabase.from('User').update({ teamId: null, updatedAt: new Date().toISOString() } as any).eq('id', user.id);
    toast.success('Você saiu do time');
    setLeaving(false);
    navigate('/dashboard');
  };

  // Project CRUD
  const handleSaveProject = async () => {
    if (!projectName.trim() || !teamId || !user) return;
    setSavingProject(true);
    if (editingProject) {
      const { error } = await supabase.from('Project').update({
        name: projectName, color: projectColor,
      } as any).eq('id', editingProject.id);
      if (error) toast.error('Erro ao atualizar projeto');
      else { toast.success('Projeto atualizado'); fetchAll(); }
    } else {
      const { error } = await supabase.from('Project').insert({
        name: projectName, color: projectColor, userId: user.id, teamId,
      } as any);
      if (error) toast.error('Erro ao criar projeto');
      else { toast.success('Projeto criado'); fetchAll(); }
    }
    setSavingProject(false);
    setProjectModal(false);
    setEditingProject(null);
    setProjectName('');
    setProjectDesc('');
    setProjectColor('#059669');
  };

  const getProjectMeetingCount = (projectId: string) => meetings.filter(m => m.projectId === projectId).length;

  // ─── Render ───
  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Painel do Time</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="dashboard"><BarChart3 className="h-4 w-4 mr-1.5" />Dashboard</TabsTrigger>
            <TabsTrigger value="members"><Users className="h-4 w-4 mr-1.5" />Membros</TabsTrigger>
            <TabsTrigger value="meetings"><FileText className="h-4 w-4 mr-1.5" />Reuniões</TabsTrigger>
            <TabsTrigger value="projects"><FolderKanban className="h-4 w-4 mr-1.5" />Projetos</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-1.5" />Configurações</TabsTrigger>
          </TabsList>

          {/* ══════════ TAB: Dashboard ══════════ */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Membros Ativos</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{members.length}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Reuniões Este Mês</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{meetingsThisMonth}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Minutos Consumidos</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{totalMinutes}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Convites Pendentes</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{pendingInvitesCount}</p></CardContent></Card>
            </div>

            {/* Chart */}
            <Card>
              <CardHeader><CardTitle className="text-base">Reuniões por membro — últimas 4 semanas</CardTitle></CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum membro no time</p>
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis allowDecimals={false} className="text-xs" />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                        <Legend />
                        {members.map((m, i) => (
                          <Bar key={m.id} dataKey={m.name || m.email} fill={MEMBER_COLORS[i % MEMBER_COLORS.length]} radius={[4, 4, 0, 0]} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══════════ TAB: Membros ══════════ */}
          <TabsContent value="members" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Convidar Membro</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input placeholder="email@empresa.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleInvite()} className="max-w-sm" />
                  <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
                    {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}Convidar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Membros do Time ({members.length})</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome / Email</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead className="text-right">Reuniões</TableHead>
                      <TableHead className="text-right">Minutos</TableHead>
                      <TableHead>Membro desde</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map(m => {
                      const usage = getUsage(m.id);
                      const isSelf = m.id === user?.id;
                      return (
                        <TableRow key={m.id}>
                          <TableCell>
                            <p className="font-medium">{m.name || '—'}</p>
                            <p className="text-xs text-muted-foreground">{m.email}</p>
                          </TableCell>
                          <TableCell><Badge variant="secondary" className="text-xs">Enterprise</Badge></TableCell>
                          <TableCell className="text-right">{usage?.transcriptionsUsed ?? 0}</TableCell>
                          <TableCell className="text-right">{usage?.totalMinutesTranscribed ?? 0}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{formatDate(m.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            {!isSelf && (
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmRemove(m)}>
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {members.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8"><Users className="h-8 w-8 mx-auto mb-2 opacity-40" />Nenhum membro no time ainda.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Pending invites */}
            {invites.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Convites Pendentes ({invites.length})</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Enviado em</TableHead>
                        <TableHead>Expira em</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invites.map(inv => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-medium">{inv.email}</TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(inv.createdAt)}</TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(inv.expiresAt)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleCancelInvite(inv.id)} disabled={cancellingId === inv.id}>
                              {cancellingId === inv.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                              <span className="ml-1.5 hidden sm:inline">Cancelar</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ══════════ TAB: Reuniões do Time ══════════ */}
          <TabsContent value="meetings" className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Select value={filterMember} onValueChange={setFilterMember}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Por membro" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os membros</SelectItem>
                  {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name || m.email}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-44"><SelectValue placeholder="Por status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="failed">Erro</SelectItem>
                  <SelectItem value="processing">Processando</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardContent className="overflow-x-auto pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Membro</TableHead>
                      <TableHead>Projeto</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Duração</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMeetings.map(m => {
                      const proj = projects.find(p => p.id === m.projectId);
                      return (
                        <TableRow key={m.id} className="cursor-pointer" onClick={() => navigate(`/meetings/${m.id}`)}>
                          <TableCell className="font-medium max-w-[200px] truncate">{m.title}</TableCell>
                          <TableCell className="text-muted-foreground">{getMemberName(m.userId)}</TableCell>
                          <TableCell>
                            {proj ? (
                              <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: proj.color }} />
                                <span className="text-sm">{proj.name}</span>
                              </span>
                            ) : <span className="text-muted-foreground text-sm">—</span>}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(m.createdAt)}</TableCell>
                          <TableCell className="text-muted-foreground">{formatDuration(m.fileDuration)}</TableCell>
                          <TableCell>
                            <Badge className={`text-xs ${STATUS_COLORS[m.status] || ''}`} variant="secondary">
                              {STATUS_LABELS[m.status] || m.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredMeetings.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8"><FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />Nenhuma reunião encontrada.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══════════ TAB: Projetos do Time ══════════ */}
          <TabsContent value="projects" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-foreground">Projetos Compartilhados</h2>
              <Button onClick={() => { setEditingProject(null); setProjectName(''); setProjectDesc(''); setProjectColor('#059669'); setProjectModal(true); }}>
                <Plus className="h-4 w-4 mr-2" />Novo Projeto
              </Button>
            </div>

            {projects.length === 0 ? (
              <Card><CardContent className="py-12 text-center"><FolderKanban className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" /><p className="text-muted-foreground">Nenhum projeto compartilhado ainda.</p><Button className="mt-4" variant="outline" onClick={() => { setProjectModal(true); }}>Criar primeiro projeto</Button></CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map(p => (
                  <Card key={p.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: p.color }} />
                          <span className="font-semibold text-foreground">{p.name}</span>
                        </div>
                        {(adminUser?.isTeamOwner || p.userId === user?.id) && (
                          <Button variant="ghost" size="sm" onClick={() => { setEditingProject(p); setProjectName(p.name); setProjectDesc(p.description || ''); setProjectColor(p.color); setProjectModal(true); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">{getProjectMeetingCount(p.id)} reuniões</Badge>
                        <span>Criado por {getMemberName(p.userId)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Criado em {formatDate(p.createdAt)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ══════════ TAB: Configurações ══════════ */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Dados do Time</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Nome do time</label>
                  <Input value={teamName} onChange={e => setTeamName(e.target.value)} className="mt-1 max-w-md" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Nome da empresa</label>
                  <Input value={companyName} onChange={e => setCompanyName(e.target.value)} className="mt-1 max-w-md" />
                </div>
                <Button onClick={handleSaveSettings} disabled={savingSettings}>
                  {savingSettings ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Salvar
                </Button>
              </CardContent>
            </Card>

            {/* Danger zone */}
            <Card className="border-destructive/30">
              <CardHeader><CardTitle className="text-base text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Zona de Perigo</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {adminUser?.isTeamOwner ? (
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">Esta ação é irreversível. Todos os membros perderão acesso ao time.</p>
                    <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setDissolveConfirm(true)}>
                      Dissolver time
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">Você deixará de ter acesso ao time e seus projetos compartilhados.</p>
                    <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setLeaveConfirm(true)}>
                      <LogOutIcon className="h-4 w-4 mr-2" />Sair do time
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Dialogs ── */}

      {/* Remove member confirm */}
      <Dialog open={!!confirmRemove} onOpenChange={() => setConfirmRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover membro</DialogTitle>
            <DialogDescription>Tem certeza que deseja remover <strong>{confirmRemove?.name || confirmRemove?.email}</strong> do time?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRemove(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRemoveMember} disabled={!!removingId}>
              {removingId ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dissolve team confirm */}
      <Dialog open={dissolveConfirm} onOpenChange={setDissolveConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Dissolver Time</DialogTitle>
            <DialogDescription>Esta ação é irreversível. Todos os membros perderão acesso ao time. Digite <strong>DISSOLVER</strong> para confirmar.</DialogDescription>
          </DialogHeader>
          <Input value={dissolveText} onChange={e => setDissolveText(e.target.value)} placeholder="Digite DISSOLVER" />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDissolveConfirm(false); setDissolveText(''); }}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDissolve} disabled={dissolveText !== 'DISSOLVER' || dissolving}>
              {dissolving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave team confirm */}
      <Dialog open={leaveConfirm} onOpenChange={setLeaveConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sair do Time</DialogTitle>
            <DialogDescription>Você deixará de ter acesso ao time e seus projetos compartilhados. Deseja continuar?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveConfirm(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleLeave} disabled={leaving}>
              {leaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Sair do Time
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project create/edit modal */}
      <Dialog open={projectModal} onOpenChange={setProjectModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingProject ? 'Editar Projeto' : 'Novo Projeto Compartilhado'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome *</label>
              <Input value={projectName} onChange={e => setProjectName(e.target.value.slice(0, 50))} placeholder="Ex: Projeto ERP" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Cor</label>
              <div className="flex gap-2 mt-2">
                {COLOR_PRESETS.map(c => (
                  <button key={c} className={`w-7 h-7 rounded-full border-2 transition-all ${projectColor === c ? 'border-primary scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} onClick={() => setProjectColor(c)} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectModal(false)}>Cancelar</Button>
            <Button onClick={handleSaveProject} disabled={!projectName.trim() || savingProject}>
              {savingProject ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}{editingProject ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
