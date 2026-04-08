import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Shield, Palette, Users, LayoutTemplate } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { VersionBadge } from '@/components/VersionBadge';

const settingsCards = [
  { title: 'Notificações', description: 'Gerencie alertas e emails', icon: Bell, href: '/settings/notifications', badge: 'em breve' },
  { title: 'Segurança', description: 'Senha e autenticação', icon: Shield, href: '/settings/security' },
  { title: 'Personalização', description: 'Logo e marca na ATA', icon: Palette, href: '/settings/branding', enterpriseOnly: true },
  { title: 'Grupos', description: 'Organize reuniões por grupo', icon: Users, href: '/settings/groups', badge: 'em breve' },
];

export default function SettingsPage() {
  const { profile } = useAuth();
  const isEnterprise = profile?.plan_id === 'enterprise';

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Gerencie suas preferências</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
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
