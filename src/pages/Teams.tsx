import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Building2, Users, FolderOpen, Plus, Trash2, Crown, Search, Palette, Mail, Clock, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const COLOR_PRESETS = ['#10B981', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6', '#06B6D4', '#EC4899'];

interface TeamData {
  id: string;
  name: string;
  companyName: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  logoUrl: string | null;
}

interface MemberData {
  id: string;
  name: string | null;
  email: string;
  isTeamOwner: boolean;
}

interface WorkGroupData {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
}

interface InviteData {
  id: string;
  email: string;
  status: string;
  createdAt: string;
  expiresAt: string;
}

export default function Teams() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<{ teamId: string | null; isTeamOwner: boolean; planId: string | null } | null>(null);
  const [team, setTeam] = useState<TeamData | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [workGroups, setWorkGroups] = useState<WorkGroupData[]>([]);
  const [invites, setInvites] = useState<InviteData[]>([]);

  // Create team
  const [newCompanyName, setNewCompanyName] = useState('');
  // Edit team
  const [editOpen, setEditOpen] = useState(false);
  const [editCompany, setEditCompany] = useState('');
  const [editPrimary, setEditPrimary] = useState('#10B981');
  const [editSecondary, setEditSecondary] = useState('#3B82F6');
  // Invite member
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  // Create group
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [groupColor, setGroupColor] = useState('#10B981');
  // Delete group
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
  // Remove member
  const [removeMember, setRemoveMember] = useState<MemberData | null>(null);

  const fetchData = async () => {
    if (!user) return;
    const { data: ud } = await supabase.from('User').select('teamId, isTeamOwner, planId').eq('id', user.id).maybeSingle();
    setUserData(ud);
    if (ud?.planId !== 'enterprise') { navigate('/plans'); return; }
    if (ud?.teamId) {
      const { data: t } = await supabase.from('Team').select('id, name, companyName, primaryColor, secondaryColor, logoUrl').eq('id', ud.teamId).maybeSingle();
      setTeam(t);
      const { data: m } = await supabase.from('User').select('id, name, email, isTeamOwner').eq('teamId', ud.teamId);
      setMembers(m || []);
      const { data: wg } = await supabase.from('WorkGroup').select('id, name, description, color').eq('teamId', ud.teamId);
      setWorkGroups(wg || []);
      // Fetch pending/recent invites
      const { data: inv } = await supabase
        .from('TeamInvite')
        .select('id, email, status, createdAt, expiresAt')
        .eq('teamId', ud.teamId)
        .in('status', ['pending', 'accepted', 'expired', 'cancelled'])
        .order('createdAt', { ascending: false })
        .limit(50);
      setInvites(inv || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleCreateTeam = async () => {
    if (!newCompanyName.trim() || !user) return;
    const { error } = await supabase.from('Team').insert({ name: newCompanyName.trim(), companyName: newCompanyName.trim(), ownerId: user.id });
    if (error) { toast.error('Erro ao criar equipe'); return; }
    const { data: t } = await supabase.from('Team').select('id').eq('ownerId', user.id).maybeSingle();
    if (t) {
      await supabase.from('User').update({ teamId: t.id, isTeamOwner: true } as any).eq('id', user.id);
    }
    toast.success('Equipe criada!');
    fetchData();
  };

  const handleEditTeam = async () => {
    if (!team) return;
    await supabase.from('Team').update({ companyName: editCompany, primaryColor: editPrimary, secondaryColor: editSecondary }).eq('id', team.id);
    toast.success('Equipe atualizada!');
    setEditOpen(false);
    fetchData();
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim() || !team) return;
    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-team-member', {
        body: { email: inviteEmail.trim(), teamId: team.id }
      });
      if (error) {
        toast.error('Erro ao enviar convite');
      } else if (data?.error) {
        toast.error(data.error);
      } else if (data?.type === 'existing_user_added') {
        toast.success('✅ Membro adicionado! Ele já pode acessar o time.');
      } else {
        toast.success('✉️ Convite enviado! Ele tem 7 dias para aceitar.');
      }
      setInviteEmail('');
      setInviteOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Erro ao enviar convite');
    }
    setInviting(false);
  };

  const handleRemoveMember = async () => {
    if (!removeMember) return;
    await supabase.from('User').update({ teamId: null, planId: 'basic' } as any).eq('id', removeMember.id);
    toast.success('Membro removido');
    setRemoveMember(null);
    fetchData();
  };

  const handleCancelInvite = async (inviteId: string) => {
    await supabase.from('TeamInvite').update({ status: 'cancelled' } as any).eq('id', inviteId);
    toast.success('Convite cancelado');
    fetchData();
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !team) return;
    await supabase.from('WorkGroup').insert({ teamId: team.id, name: groupName.trim(), description: groupDesc || null, color: groupColor });
    toast.success('Grupo criado!');
    setGroupName(''); setGroupDesc(''); setGroupColor('#10B981'); setCreateGroupOpen(false);
    fetchData();
  };

  const handleDeleteGroup = async () => {
    if (!deleteGroupId) return;
    await supabase.from('WorkGroup').delete().eq('id', deleteGroupId);
    toast.success('Grupo excluído');
    setDeleteGroupId(null);
    fetchData();
  };

  const filteredMembers = members.filter(m =>
    !memberSearch || m.name?.toLowerCase().includes(memberSearch.toLowerCase()) || m.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const pendingInvites = invites.filter(i => i.status === 'pending');

  if (loading) return <AppLayout><div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Carregando...</p></div></AppLayout>;

  // No team yet — create
  if (!team) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto space-y-6 pt-8">
          <h1 className="text-2xl font-bold text-foreground">Criar Equipe</h1>
          <Card>
            <CardContent className="p-6 space-y-4">
              <Input placeholder="Nome da empresa" value={newCompanyName} onChange={e => setNewCompanyName(e.target.value)} />
              <Button onClick={handleCreateTeam} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                <Plus className="h-4 w-4 mr-2" /> Criar Equipe
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Equipe</h1>

        <Tabs defaultValue="empresa">
          <TabsList>
            <TabsTrigger value="empresa"><Building2 className="h-4 w-4 mr-1.5" />Empresa</TabsTrigger>
            <TabsTrigger value="membros"><Users className="h-4 w-4 mr-1.5" />Membros</TabsTrigger>
            <TabsTrigger value="grupos"><FolderOpen className="h-4 w-4 mr-1.5" />Grupos</TabsTrigger>
          </TabsList>

          {/* Tab Empresa */}
          <TabsContent value="empresa">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <h2 className="text-xl font-semibold">{team.companyName || team.name}</h2>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: team.primaryColor || '#10B981' }} />
                        <span className="text-sm text-muted-foreground">Primária</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: team.secondaryColor || '#3B82F6' }} />
                        <span className="text-sm text-muted-foreground">Secundária</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{members.length} membro(s)</p>
                  </div>
                  {userData?.isTeamOwner && (
                    <Button variant="outline" onClick={() => {
                      setEditCompany(team.companyName || team.name);
                      setEditPrimary(team.primaryColor || '#10B981');
                      setEditSecondary(team.secondaryColor || '#3B82F6');
                      setEditOpen(true);
                    }}>
                      <Palette className="h-4 w-4 mr-2" /> Editar Empresa
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Membros */}
          <TabsContent value="membros">
            <div className="space-y-6">
              {/* Members list */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground font-medium">{members.length} membro(s)</p>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Buscar..." value={memberSearch} onChange={e => setMemberSearch(e.target.value)} className="pl-9 w-48" />
                    </div>
                    {userData?.isTeamOwner && (
                      <Button size="sm" onClick={() => setInviteOpen(true)} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                        <Mail className="h-4 w-4 mr-1" /> Convidar Membro
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid gap-3">
                  {filteredMembers.map(m => (
                    <Card key={m.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold">
                            {m.name?.charAt(0)?.toUpperCase() || m.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">{m.name || m.email}</span>
                              {m.isTeamOwner && (
                                <Badge className="bg-amber-100 text-amber-700 text-[10px]"><Crown className="h-3 w-3 mr-0.5" />Admin</Badge>
                              )}
                            </div>
                            <span className="text-sm text-muted-foreground">{m.email}</span>
                          </div>
                        </div>
                        {userData?.isTeamOwner && !m.isTeamOwner && m.id !== user?.id && (
                          <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => setRemoveMember(m)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Pending invites */}
              {userData?.isTeamOwner && pendingInvites.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Convites Pendentes ({pendingInvites.length})
                  </h3>
                  <div className="grid gap-2">
                    {pendingInvites.map(inv => (
                      <Card key={inv.id} className="border-dashed">
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <span className="text-sm font-medium text-foreground">{inv.email}</span>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Enviado em {new Date(inv.createdAt).toLocaleDateString('pt-BR')}</span>
                                <span>·</span>
                                <span>Expira em {new Date(inv.expiresAt).toLocaleDateString('pt-BR')}</span>
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600" onClick={() => handleCancelInvite(inv.id)}>
                            <XCircle className="h-4 w-4 mr-1" /> Cancelar
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab Grupos */}
          <TabsContent value="grupos">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground font-medium">{workGroups.length} grupo(s)</p>
                {userData?.isTeamOwner && (
                  <Button size="sm" onClick={() => setCreateGroupOpen(true)} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                    <Plus className="h-4 w-4 mr-1" /> Novo Grupo
                  </Button>
                )}
              </div>
              {workGroups.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center">
                    <FolderOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-muted-foreground">Nenhum grupo criado ainda</p>
                    {userData?.isTeamOwner && (
                      <Button variant="outline" size="sm" className="mt-3" onClick={() => setCreateGroupOpen(true)}>
                        Criar Primeiro Grupo
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {workGroups.map(g => (
                    <Card key={g.id}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: g.color || '#10B981' }}>
                              {g.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-medium text-foreground">{g.name}</h3>
                              {g.description && <p className="text-sm text-muted-foreground line-clamp-1">{g.description}</p>}
                            </div>
                          </div>
                          {userData?.isTeamOwner && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteGroupId(g.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Team Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
            <DialogDescription>Atualize as informações da sua equipe</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Nome da empresa" value={editCompany} onChange={e => setEditCompany(e.target.value)} />
            <div>
              <label className="text-sm font-medium mb-2 block">Cor Primária</label>
              <div className="flex gap-2">
                {COLOR_PRESETS.map(c => (
                  <button key={c} className={`w-8 h-8 rounded-full border-2 transition-all ${editPrimary === c ? 'border-foreground scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} onClick={() => setEditPrimary(c)} />
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Cor Secundária</label>
              <div className="flex gap-2">
                {COLOR_PRESETS.map(c => (
                  <button key={c} className={`w-8 h-8 rounded-full border-2 transition-all ${editSecondary === c ? 'border-foreground scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} onClick={() => setEditSecondary(c)} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEditTeam} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar para o time</DialogTitle>
            <DialogDescription>
              Envie um convite por email. Usuários existentes são adicionados automaticamente.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="email@empresa.com"
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleInviteMember()}
          />
          <DialogFooter>
            <Button onClick={handleInviteMember} disabled={inviting || !inviteEmail.trim()} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              {inviting ? 'Enviando...' : 'Enviar convite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!removeMember} onOpenChange={open => !open && setRemoveMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {removeMember?.name || removeMember?.email} do time?</AlertDialogTitle>
            <AlertDialogDescription>
              Ele perderá acesso às funcionalidades Enterprise e voltará ao plano Gratuito.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} className="bg-red-600 hover:bg-red-700 text-white">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Group Dialog */}
      <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Grupo</DialogTitle>
            <DialogDescription>Crie um grupo de trabalho para organizar reuniões</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Nome do grupo" value={groupName} onChange={e => setGroupName(e.target.value)} />
            <Input placeholder="Descrição (opcional)" value={groupDesc} onChange={e => setGroupDesc(e.target.value)} />
            <div>
              <label className="text-sm font-medium mb-2 block">Cor</label>
              <div className="flex gap-2">
                {COLOR_PRESETS.map(c => (
                  <button key={c} className={`w-8 h-8 rounded-full border-2 transition-all ${groupColor === c ? 'border-foreground scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} onClick={() => setGroupColor(c)} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateGroup} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">Criar Grupo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Group Confirm */}
      <AlertDialog open={!!deleteGroupId} onOpenChange={open => !open && setDeleteGroupId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir grupo?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita. Reuniões do grupo não serão excluídas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup} className="bg-red-600 hover:bg-red-700 text-white">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
