import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, Bell, Shield, Palette, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const settingsCards = [
  { title: 'Notificações', description: 'Gerencie alertas e emails', icon: Bell, href: '/settings/notifications' },
  { title: 'Segurança', description: 'Senha e autenticação', icon: Shield, href: '/settings/security' },
  { title: 'Personalização', description: 'Logo e marca na ATA', icon: Palette, href: '/settings/branding' },
  { title: 'Grupos', description: 'Organize reuniões por grupo', icon: Users, href: '/settings/groups' },
];

export default function SettingsPage() {
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
                  <div>
                    <h3 className="font-medium text-foreground">{card.title}</h3>
                    <p className="text-sm text-muted-foreground">{card.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
