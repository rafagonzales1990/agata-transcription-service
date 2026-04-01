import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Perfil</h1>
          <p className="text-muted-foreground">Gerencie seus dados pessoais</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Usuário</p>
                <p className="text-sm text-muted-foreground">Plano: Teste Grátis</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Nome</label>
              <Input placeholder="Seu nome" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
              <Input type="email" placeholder="seu@email.com" disabled />
            </div>
            <Button className="bg-primary hover:bg-emerald-600 text-primary-foreground" onClick={() => toast.info('Requer backend conectado')}>
              Salvar Alterações
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
