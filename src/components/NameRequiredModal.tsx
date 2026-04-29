import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LogoIcon } from '@/components/LogoIcon';
import { Loader2, X } from 'lucide-react';

function validateName(name: string): boolean {
  const trimmed = name.trim();
  if (/\d/.test(trimmed)) return false;
  const words = trimmed.split(/\s+/).filter(Boolean);
  return words.length >= 2;
}

interface NameRequiredModalProps {
  userId: string;
  onSaved: () => void;
  onDismiss?: () => void;
}

export function NameRequiredModal({ userId, onSaved, onDismiss }: NameRequiredModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!validateName(name)) {
      setError('Por favor, informe seu nome completo');
      return;
    }

    setSaving(true);
    setError('');

    const trimmed = name.trim();
    const { error: err } = await supabase
      .from('User')
      .update({ name: trimmed } as any)
      .eq('id', userId);

    if (err) {
      setSaving(false);
      setError('Erro ao salvar. Tente novamente.');
      return;
    }

    await supabase.from('profiles').update({ name: trimmed } as any).eq('user_id', userId);
    setSaving(false);
    onSaved();
  }, [name, userId, onSaved]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-[420px] mx-4 p-8 flex flex-col items-center gap-5 relative">
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          title="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        <LogoIcon size={48} />
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Complete seu cadastro</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Precisamos do seu nome completo para personalizar sua experiência na plataforma.
          </p>
        </div>

        <div className="w-full space-y-2">
          <label htmlFor="name-input" className="text-sm font-medium text-gray-700 dark:text-gray-200">Nome completo</label>
          <input
            id="name-input"
            type="text"
            autoFocus
            placeholder="Ex: Rafael Gonzales"
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="w-full h-11 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
          />
          {error && <p className="text-sm text-red-600 dark:text-red-400 leading-snug">{error}</p>}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || name.trim().length < 3}
          className="w-full h-11 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {saving ? 'Salvando...' : 'Confirmar Nome'}
        </button>

        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">Seus dados são protegidos pela LGPD.</p>
      </div>
    </div>
  );
}
