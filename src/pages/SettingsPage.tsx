import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Calendar, CheckCircle, Shield, Palette, Users, LayoutTemplate } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { VersionBadge } from '@/components/VersionBadge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const settingsCards = [
  { title: 'Notificações', description: 'Gerencie alertas e emails', icon: Bell, href: '/settings/notifications', badge: 'em breve' },
  { title: 'Segurança', description: 'Senha e autenticação', icon: Shield, href: '/settings/security' },
  { title: 'Personalização', description: 'Logo e marca na ATA', icon: Palette, href: '/settings/branding', enterpriseOnly: true },
  { title: 'Grupos', description: 'Organize reuniões por grupo', icon: Users, href: '/settings/groups', badge: 'em breve' },
  { title: 'Modelos de ATA', description: 'Personalize seções e instruções', icon: LayoutTemplate, href: '/settings/ata-templates' },
];

export default function SettingsPage() {
  const { profile, user } = useAuth();
  const [searchParams] = useSearchParams();
  const [googleConnected, setGoogleConnected] = useState(false);
  const isEnterprise = profile?.plan_id === 'enterprise';

  useEffect(() => {
    async function syncGoogleToken() {
      if (!user?.id) return;
      const { data: { session } } = await supabase.auth.getSession();
      const googleToken = session?.provider_token;

      if (googleToken && searchParams.get('tab') === 'integrations') {
        const { error } = await supabase
          .from('User')
          .update({ googleCalendarToken: googleToken } as any)
          .eq('id', user.id);
        if (error) toast.error('Erro ao salvar conexão com Google Calendar');
        else toast.success('Google Calendar conectado');
      }

      const { data } = await supabase
        .from('User')
        .select('googleCalendarToken')
        .eq('id', user.id)
        .maybeSingle();
      setGoogleConnected(!!(data as any)?.googleCalendarToken || !!googleToken);
    }

    syncGoogleToken();
  }, [searchParams, user?.id]);

  const connectGoogleCalendar = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/calendar.readonly',
        redirectTo: `${window.location.origin}/settings?tab=integrations`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (error) toast.error('Erro ao conectar Google Calendar');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Gerencie suas preferências</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* TODO: Google Calendar integration needs refactor to use
              Google Identity Services token model instead of signInWithOAuth
              See: https://developers.google.com/identity/oauth2/web/guides/use-token-model
          <Card className="hover:shadow-md transition-shadow h-full border-l-4 border-l-primary">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground">Google Calendar</h3>
                    {googleConnected && <Badge variant="secondary" className="text-[10px]"><CheckCircle className="h-3 w-3" /> conectado</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">Veja suas próximas reuniões e grave com um clique</p>
                </div>
                <Button onClick={connectGoogleCalendar} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {googleConnected ? 'Reconectar' : 'Conectar'}
                </Button>
              </div>
            </CardContent>
          </Card>
          */}
          {settingsCards.map((card) => (
            <Link key={card.href} to={card.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-primary flex items-center justify-center shrink-0">
                    <card.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground">{card.title}</h3>
                      {card.badge && <Badge variant="secondary" className="text-[10px]">{card.badge}</Badge>}
                      {card.enterpriseOnly && !isEnterprise && (
                        <Badge variant="outline" className="text-[10px]">Enterprise</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{card.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        <div className="pt-4 border-t border-border">
          <VersionBadge />
        </div>
      </div>
    </AppLayout>
  );
}
