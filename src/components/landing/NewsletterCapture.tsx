import { useState, FormEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface NewsletterCaptureProps {
  source?: 'lp' | 'blog';
}

export function NewsletterCapture({ source = 'lp' }: NewsletterCaptureProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    setErrorMsg('');

    const { error } = await supabase.from('leads').insert({ email: email.trim().toLowerCase(), source });

    if (error) {
      if ((error as any).code === '23505') {
        setStatus('success');
        return;
      }
      setStatus('error');
      setErrorMsg('Algo deu errado. Tente novamente.');
      return;
    }
    setStatus('success');
  };

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-[480px] mx-auto rounded-xl border border-border bg-card p-8 shadow-sm text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Fique por dentro das novidades
        </h2>
        <p className="text-muted-foreground mb-6">
          Conteúdo sobre produtividade, reuniões e IA para equipes brasileiras.
        </p>

        {status === 'success' ? (
          <p className="text-green-600 dark:text-green-400 font-medium text-base">
            ✓ Você está na lista!
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="email"
              required
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'loading'}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</>
              ) : (
                'Quero receber'
              )}
            </Button>
            {status === 'error' && (
              <p className="text-sm text-destructive text-left">{errorMsg}</p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
