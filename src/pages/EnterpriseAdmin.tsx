import { useEffect, useState, useCallback } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Users, FileText, Clock, CreditCard, Loader2, Trash2, Send, Building2, Palette, ExternalLink,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  planId: string | null;
  teamId: string | null;
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
  status: string;
}

const PLAN_LABELS: Record<string, string> = {
  basic: 'Gratuito',
  inteligente: 'Inteligente',
  automacao: 'Automação',
  enterprise: 'Enterprise',
};

export default function EnterpriseAdmin() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [usages, setUsages] = useState<MemberUsage[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const checkAccess = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) { navigate('/dashboard'); return; }

    const { data } = await supabase
      .from('User')
      .select('isAdmin, teamId, planId, isTeamOwner')
      .eq('id', user.id)
      .maybeSingle();

    const hasAccess = data?.isAdmin || data?.planId === 'enterprise';
    if (!hasAccess) { navigate('/dashboard'); return; }

    setIsAdmin(data?.isAdmin || false);
    setTeamId(data?.teamId || null);
    return data;
  }, [navigate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const accessData = await checkAccess();
    if (!accessData?.teamId) { setLoading(false); return; }

    const tid = accessData.teamId;

    // Fetch team members
    const { data: memberData } = await supabase
      .from('User')
      .select('id, name, email, planId, teamId')
      .eq('teamId', tid);

    const teamMembers = (memberData || []) as TeamMember[];
    setMembers(teamMembers);

    // Fetch usage for members
    const memberIds = teamMembers.map(m => m.id);
    if (memberIds.length > 0) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: usageData } = await supabase
        .from('Usage')
        .select('userId, transcriptionsUsed, totalMinutesTranscribed, currentMonth')
        .in('userId', memberIds)
        .eq('currentMonth', currentMonth);
      setUsages((usageData || []) as MemberUsage[]);
    }

    // Fetch pending invites
    const { data: inviteData } = await supabase
      .from('TeamInvite')
      .select('id, email, createdAt, status')
      .eq('teamId', tid)
      .eq('status', 'pending')
      .order('createdAt', { ascending: false });
    setInvites((inviteData || []) as PendingInvite[]);

    setLoading(false);
  }, [checkAccess]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getUsage = (userId: string) => usages.find(u => u.userId === userId);

  const totalMeetings = usages.reduce((sum, u) => sum + u.transcriptionsUsed, 0);
  const totalMinutes = usages.reduce((sum, u) => sum + u.totalMinutesTranscribed, 0);

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
      fetchData();
    } catch {
      toast.error('Erro ao enviar convite');
    }
    setInviting(false);
  };

  const handleCancelInvite = async (id: string) => {
    setCancellingId(id);
    const { error } = await supabase.from('TeamInvite').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao cancelar convite');
    } else {
      setInvites(prev => prev.filter(i => i.id !== id));
      toast.success('Convite cancelado');
    }
    setCancellingId(null);
  };

  const handleRemoveMember = async (userId: string) => {
    setRemovingId(userId);
    const { error } = await supabase
      .from('User')
      .update({ teamId: null, updatedAt: new Date().toISOString() })
      .eq('id', userId);
    if (error) {
      toast.error('Erro ao remover membro');
    } else {
      setMembers(prev => prev.filter(m => m.id !== userId));
      toast.success('Membro removido do time');
    }
    setRemovingId(null);
  };

  const handleStripePortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-portal');
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch {
      toast.error('Erro ao abrir portal de assinatura');
    }
    setPortalLoading(false);
  };

  const planLabel = PLAN_LABELS[profile?.plan_id || 'basic'] || profile?.plan_id || 'Gratuito';
  const billingLabel = profile?.billing_cycle === 'yearly' ? 'Anual' : 'Mensal';

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
          <Building2 className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Painel Admin</h1>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="members">Membros</TabsTrigger>
            <TabsTrigger value="subscription">Assinatura</TabsTrigger>
          </TabsList>

          {/* ── TAB 1: Dashboard ── */}
          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Membros</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{members.length}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Reuniões este mês</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{totalMeetings}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Minutos este mês</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{totalMinutes}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Plano</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{planLabel}</p>
                  <p className="text-xs text-muted-foreground">{billingLabel}</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-wrap gap-3 text-white">
              <Button variant="outline" className="text-white bg-card hover:bg-card" onClick={() => navigate('/settings/branding')}>
                <Palette className="h-4 w-4 mr-2 text-white" />
                Personalização da Empresa
              </Button>
              <Button variant="outline" className="text-white" onClick={handleStripePortal} disabled={portalLoading}>
                {portalLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin text-white" /> : <CreditCard className="h-4 w-4 mr-2 text-white" />}
                Gerenciar Assinatura
              </Button>
            </div>
          </TabsContent>

          {/* ── TAB 2: Membros ── */}
          <TabsContent value="members" className="space-y-4">
            {/* Invite section */}
            <Card>
              <CardHeader><CardTitle className="text-base">Convidar Membro</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="email@empresa.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleInvite()}
                    className="max-w-sm"
                  />
                  <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
                    {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    Convidar
                  </Button>
                </div>

                {invites.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Convites pendentes</p>
                    {invites.map(inv => (
                      <div key={inv.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                        <span>{inv.email}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleCancelInvite(inv.id)}
                          disabled={cancellingId === inv.id}
                        >
                          {cancellingId === inv.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Members table */}
            <Card>
              <CardHeader><CardTitle className="text-base">Membros do Time ({members.length})</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead className="text-right">Reuniões</TableHead>
                      <TableHead className="text-right">Minutos</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map(m => {
                      const usage = getUsage(m.id);
                      return (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium">{m.name || '—'}</TableCell>
                          <TableCell className="text-muted-foreground">{m.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {PLAN_LABELS[m.planId || 'basic'] || m.planId}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{usage?.transcriptionsUsed ?? 0}</TableCell>
                          <TableCell className="text-right">{usage?.totalMinutesTranscribed ?? 0}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRemoveMember(m.id)}
                              disabled={removingId === m.id}
                              title="Remover do time"
                            >
                              {removingId === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {members.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Nenhum membro no time ainda.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── TAB 3: Assinatura ── */}
          <TabsContent value="subscription" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Detalhes da Assinatura</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Plano</p>
                    <p className="text-lg font-semibold">{planLabel}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ciclo</p>
                    <p className="text-lg font-semibold">{billingLabel}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Membros</p>
                    <p className="text-lg font-semibold">{members.length}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button onClick={handleStripePortal} disabled={portalLoading}>
                    {portalLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
                    Gerenciar Assinatura
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/plans')}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver Planos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
