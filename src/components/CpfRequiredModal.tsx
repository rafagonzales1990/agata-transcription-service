import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LogoIcon } from '@/components/LogoIcon';
import { Loader2, X } from 'lucide-react';

function validateCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let rem = (sum * 10) % 11;
  if (rem >= 10) rem = 0;
  if (rem !== parseInt(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  rem = (sum * 10) % 11;
  if (rem >= 10) rem = 0;
  if (rem !== parseInt(digits[10])) return false;

  return true;
}

function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

interface CpfRequiredModalProps {
  userId: string;
  isAdmin?: boolean;
  onSaved: () => void;
  onDismiss?: () => void;
}

export function CpfRequiredModal({ userId, isAdmin, onSaved, onDismiss }: CpfRequiredModalProps) {
  const [cpf, setCpf] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(maskCpf(e.target.value));
    setError('');
  };

  const handleClose = useCallback(async () => {
    if (isAdmin) {
      onDismiss?.();
    } else {
      await supabase.auth.signOut();
      navigate('/login');
    }
  }, [isAdmin, onDismiss, navigate]);

  const handleSubmit = useCallback(async () => {
    const clean = cpf.replace(/\D/g, '');
    if (!validateCpf(clean)) {
      setError('CPF inválido. Verifique os números digitados.');
      return;
    }

    setSaving(true);
    setError('');

    const { error: err1 } = await supabase.from('User').update({ cpf: clean }).eq('id', userId);
    if (err1) {
      setSaving(false);
      if (err1.message?.includes('User_cpf_key') || err1.code === '23505') {
        setError('Este CPF já está vinculado a outra conta. Se você acredita que é um erro, entre em contato: suporte@agatatranscription.com');
      } else {
        setError('Erro ao salvar. Tente novamente.');
      }
      return;
    }

    await supabase.from('profiles').update({ cpf: clean }).eq('user_id', userId);
    setSaving(false);
    onSaved();
  }, [cpf, userId, onSaved]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-[420px] mx-4 p-8 flex flex-col items-center gap-5 relative">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          title="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        <LogoIcon size={48} />
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Complete seu cadastro</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Para garantir a segurança da plataforma e evitar uso indevido do período trial, precisamos confirmar sua identidade.
          </p>
        </div>

        <div className="w-full space-y-2">
          <label htmlFor="cpf-input" className="text-sm font-medium text-gray-700 dark:text-gray-200">CPF</label>
          <input
            id="cpf-input"
            type="text"
            inputMode="numeric"
            autoFocus
            placeholder="000.000.000-00"
            value={cpf}
            onChange={handleChange}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="w-full h-11 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
          />
          {error && <p className="text-sm text-red-600 dark:text-red-400 leading-snug">{error}</p>}
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving || cpf.replace(/\D/g, '').length < 11}
          className="w-full h-11 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {saving ? 'Salvando...' : 'Confirmar CPF'}
        </button>

        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">Seus dados são protegidos pela LGPD.</p>
      </div>
    </div>
  );
}
