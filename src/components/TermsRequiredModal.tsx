import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LogoIcon } from '@/components/LogoIcon';
import { Loader2, X } from 'lucide-react';

interface TermsRequiredModalProps {
  userId: string;
  onSaved: () => void;
  onDismiss?: () => void;
}

export function TermsRequiredModal({ userId, onSaved, onDismiss }: TermsRequiredModalProps) {
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async () => {
    if (!accepted) {
      setError('Você precisa aceitar os termos para continuar.');
      return;
    }

    setSaving(true);
    setError('');

    const { error: err } = await supabase
      .from('User')
      .update({
        termsAcceptedAt: new Date().toISOString(),
        termsVersion: '1.0.0',
      } as any)
      .eq('id', userId);

    setSaving(false);
    if (err) {
      setError('Erro ao salvar. Tente novamente.');
      return;
    }
    onSaved();
  }, [accepted, userId, onSaved]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-[440px] mx-4 p-8 flex flex-col items-center gap-5 relative">
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Aceite dos Termos</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Para continuar usando a plataforma, você precisa aceitar nossos termos.
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer w-full">
          <input
            type="checkbox"
            checked={accepted}
            onChange={e => { setAccepted(e.target.checked); setError(''); }}
            className="mt-0.5 h-4 w-4 accent-emerald-600 shrink-0"
          />
          <span className="text-sm text-gray-600 dark:text-gray-300 leading-snug">
            Li e concordo com os{' '}
            <a href="/termos" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Termos de Uso</a>,{' '}
            a <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Política de Privacidade</a>{' '}
            e o <a href="/eula" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Contrato de Licença (EULA)</a>{' '}
            da Ágata Transcription.
          </span>
        </label>

        {error && <p className="text-sm text-red-600 dark:text-red-400 w-full">{error}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || !accepted}
          className="w-full h-11 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {saving ? 'Salvando...' : 'Aceitar e Continuar'}
        </button>

        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">Seus dados são protegidos pela LGPD.</p>
      </div>
    </div>
  );
}
