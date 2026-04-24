import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Shield, Loader2, Monitor, Smartphone, Laptop } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getDeviceId } from '@/lib/deviceId';
import { toast } from 'sonner';

interface UserSession {
  id: string;
  deviceId: string;
  deviceName: string;
  userAgent: string | null;
  lastSeen: string;
  isActive: boolean;
}

function formatLastSeen(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Agora';
  if (mins < 60) return `${mins} min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

function deviceIcon(ua: string | null) {
  if (!ua) return <Monitor className="h-5 w-5" />;
  if (/iPhone|Android|iPad/.test(ua)) return <Smartphone className="h-5 w-5" />;
  if (/Mac/.test(ua)) return <Laptop className="h-5 w-5" />;
  return <Monitor className="h-5 w-5" />;
}

export default function SettingsSecurity() {
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [terminatingId, setTerminatingId] = useState<string | null>(null);
  const currentDeviceId = getDeviceId();

  const fetchSessions = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await (supabase as any)
      .from('UserSession')
      .select('id, deviceId, deviceName, userAgent, lastSeen, isActive')
      .eq('userId', user.id)
      .eq('isActive', true)
      .order('lastSeen', { ascending: false });
    setSessions(data || []);
    setSessionsLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleSave = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else {
      toast.success('Senha atualizada com sucesso!');
      setNewPassword('');
      setConfirmPassword('');
    }
    setSaving(false);
  };

  const terminateSession = async (session: UserSession) => {
    setTerminatingId(session.id);
    await (supabase as any)
      .from('UserSession')
      .update({ isActive: false })
      .eq('id', session.id);
    toast.success(`Sessão em ${session.deviceName} encerrada`);
    await fetchSessions();
    setTerminatingId(null);
  };

  const terminateAllOthers = async () => {
    if (!user?.id) return;
    await (supabase as any)
      .from('UserSession')
      .update({ isActive: false })
      .eq('userId', user.id)
      .neq('deviceId', currentDeviceId);
    toast.success('Todas as outras sessões foram encerradas');
    await fetchSessions();
  };

  const otherSessions = sessions.filter(s => s.deviceId !== currentDeviceId);

  return (
    <AppLayout>
      <div className="max-w-lg space-y-6">
        <div>
          <Link to="/settings" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ChevronLeft className="h-4 w-4" /> Voltar para Configurações
          </Link>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" /> Segurança
          </h1>
          <p className="text-muted-foreground">Senha e sessões ativas</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alterar Senha</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Nova Senha</label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Confirmar Senha</label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repita a nova senha" />
            </div>
            <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Salvar
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sessões ativas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessionsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma sessão ativa encontrada.</p>
            ) : (
              <>
                {sessions.map(session => {
                  const isCurrent = session.deviceId === currentDeviceId;
                  return (
                    <div key={session.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                      <div className="text-muted-foreground shrink-0">
                        {deviceIcon(session.userAgent)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground truncate">{session.deviceName}</span>
                          {isCurrent && (
                            <Badge variant="secondary" className="text-[10px] shrink-0">Este dispositivo</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{formatLastSeen(session.lastSeen)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isCurrent || terminatingId === session.id}
                        onClick={() => terminateSession(session)}
                        className="text-destructive hover:text-destructive shrink-0"
                      >
                        {terminatingId === session.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Encerrar'}
                      </Button>
                    </div>
                  );
                })}

                {otherSessions.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={terminateAllOthers}
                    className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 mt-2"
                  >
                    Encerrar todas as outras sessões
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
