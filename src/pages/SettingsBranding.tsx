import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Palette, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const COLOR_PRESETS = [
  { name: 'Roxo', primary: '#7c3aed', secondary: '#a78bfa' },
  { name: 'Azul', primary: '#2563eb', secondary: '#60a5fa' },
  { name: 'Verde', primary: '#059669', secondary: '#34d399' },
  { name: 'Vermelho', primary: '#dc2626', secondary: '#f87171' },
  { name: 'Laranja', primary: '#ea580c', secondary: '#fb923c' },
  { name: 'Rosa', primary: '#db2777', secondary: '#f472b6' },
];

export default function SettingsBranding() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#059669');
  const [secondaryColor, setSecondaryColor] = useState('#34d399');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile && profile.plan_id !== 'enterprise') {
      navigate('/settings');
    }
  }, [profile, navigate]);

  useEffect(() => {
    async function loadTeam() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('Team')
        .select('companyName, primaryColor, secondaryColor')
        .eq('ownerId', user.id)
        .maybeSingle();
      if (data) {
        setCompanyName(data.companyName || '');
        setPrimaryColor(data.primaryColor || '#059669');
        setSecondaryColor(data.secondaryColor || '#34d399');
      }
    }
    loadTeam();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existing } = await supabase.from('Team').select('id').eq('ownerId', user.id).maybeSingle();

    if (existing) {
      await supabase.from('Team').update({
        companyName, primaryColor, secondaryColor, updatedAt: new Date().toISOString(),
      }).eq('id', existing.id);
    } else {
      await supabase.from('Team').insert({
        ownerId: user.id, name: companyName || 'Minha Empresa', companyName, primaryColor, secondaryColor,
      });
    }

    toast.success('Personalização salva!');
    setSaving(false);
  };

  const selectPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
  };

  if (profile?.plan_id !== 'enterprise') return null;

  return (
    <AppLayout>
      <div className="max-w-lg space-y-6">
        <div>
          <Link to="/settings" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ChevronLeft className="h-4 w-4" /> Voltar para Configurações
          </Link>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Palette className="h-6 w-6 text-primary" /> Personalização
          </h1>
          <p className="text-muted-foreground">Customize a marca da sua ATA</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados da Empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Nome da Empresa</label>
              <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Nome da empresa" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tema de Cores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => selectPreset(preset)}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    primaryColor === preset.primary ? 'border-foreground shadow-md' : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <div className="h-8 rounded-md mb-1.5" style={{ background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})` }} />
                  <span className="text-xs font-medium text-foreground">{preset.name}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Cor Primária</label>
                <div className="flex gap-2">
                  <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                  <Input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="flex-1" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Cor Secundária</label>
                <div className="flex gap-2">
                  <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                  <Input value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="flex-1" />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Pré-visualização</label>
              <div className="rounded-lg p-6 text-center" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
                <p className="text-white font-bold text-lg">{companyName || 'Sua Empresa'}</p>
                <p className="text-white/70 text-sm">ATA de Reunião</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted text-sm text-muted-foreground">
              📸 Upload de logo — em breve
            </div>

            <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground w-full">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Salvar Personalização
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
