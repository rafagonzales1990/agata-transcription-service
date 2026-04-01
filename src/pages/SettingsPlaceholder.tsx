import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, Construction } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const titles: Record<string, string> = {
  '/settings/notifications': 'Notificações',
  '/settings/groups': 'Grupos',
};

export default function SettingsPlaceholder() {
  const location = useLocation();
  const title = titles[location.pathname] || 'Configuração';

  return (
    <AppLayout>
      <div className="max-w-lg space-y-6">
        <div>
          <Link to="/settings" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ChevronLeft className="h-4 w-4" /> Voltar para Configurações
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        </div>
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <Construction className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <h3 className="font-medium text-foreground mb-1">Em breve</h3>
              <p className="text-sm text-muted-foreground">Esta funcionalidade está em desenvolvimento.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
