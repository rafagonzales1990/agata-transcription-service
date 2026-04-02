import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface GroupMembership {
  role: string;
  workGroup: {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
  } | null;
}

export default function SettingsGroups() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [memberships, setMemberships] = useState<GroupMembership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile && profile.plan_id !== 'enterprise') {
      navigate('/settings');
      return;
    }
    async function fetch() {
      if (!user) return;
      const { data } = await supabase
        .from('WorkGroupMember')
        .select('role, workGroup:WorkGroup(id, name, description, color)')
        .eq('userId', user.id);
      setMemberships((data as any) || []);
      setLoading(false);
    }
    fetch();
  }, [user, profile]);

  return (
    <AppLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <Link to="/settings" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ChevronLeft className="h-4 w-4" /> Voltar para Configurações
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Meus Grupos</h1>
          <p className="text-muted-foreground">Grupos de trabalho aos quais você pertence</p>
        </div>

        {loading ? (
          <p className="text-muted-foreground py-8 text-center">Carregando...</p>
        ) : memberships.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <h3 className="font-medium text-foreground mb-1">Nenhum grupo</h3>
              <p className="text-sm text-muted-foreground">Você não pertence a nenhum grupo ainda.</p>
              <p className="text-xs text-muted-foreground mt-1">Peça ao administrador da equipe para te adicionar.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {memberships.map((m, i) => m.workGroup && (
              <Card key={m.workGroup.id || i}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: m.workGroup.color || '#10B981' }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground">{m.workGroup.name}</h3>
                        <Badge variant={m.role === 'leader' ? 'default' : 'secondary'} className={`text-[10px] ${m.role === 'leader' ? 'bg-emerald-100 text-emerald-700' : ''}`}>
                          {m.role === 'leader' ? 'Líder' : 'Membro'}
                        </Badge>
                      </div>
                      {m.workGroup.description && (
                        <p className="text-sm text-muted-foreground mt-1">{m.workGroup.description}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
