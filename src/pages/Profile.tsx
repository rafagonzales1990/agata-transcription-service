import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const planLabels: Record<string, string> = {
  basic: 'Teste Grátis',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setPhone(profile.phone ?? '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ name, phone })
      .eq('user_id', profile.user_id);

    setSaving(false);
    if (error) {
      toast.error('Erro ao salvar alterações');
    } else {
      toast.success('Perfil atualizado!');
      await refreshProfile();
    }
  };

  const planLabel = planLabels[profile?.plan_id ?? 'basic'] ?? profile?.plan_id ?? 'Teste Grátis';

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
                <p className="font-medium text-foreground">{profile?.name || 'Usuário'}</p>
                <p className="text-sm text-muted-foreground">Plano: {planLabel}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Nome</label>
              <Input placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
              <Input type="email" value={profile?.email ?? ''} disabled />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Telefone</label>
              <Input placeholder="Seu telefone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <Button className="bg-primary hover:bg-emerald-600 text-primary-foreground" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
