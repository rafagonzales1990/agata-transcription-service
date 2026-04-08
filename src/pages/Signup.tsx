import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sparkles, Eye, EyeOff, CheckCircle, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { conversionSignup, trackSignup, trialStartedFromDemo } from '@/lib/gtag';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get('leadId');
  const inviteToken = searchParams.get('invite');
  const inviteEmail = searchParams.get('email');
  const inviteTeamId = searchParams.get('team');

  useEffect(() => {
    if (inviteEmail) {
      setEmail(inviteEmail);
    }
  }, [inviteEmail]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      // Send welcome email
      try {
        await supabase.functions.invoke('send-email', {
          body: { type: 'welcome', to: email, data: { name: name || 'Usuário' } }
        });
      } catch (emailErr) {
        console.error('Failed to send welcome email:', emailErr);
      }

      // Accept team invite if present
      if (inviteToken) {
        try {
          const { error: inviteErr } = await supabase.functions.invoke('accept-team-invite', {
            body: { token: inviteToken }
          });
          if (inviteErr) {
            console.error('Accept invite error:', inviteErr);
          } else {
            toast.success('Convite aceito! Você foi adicionado ao time.');
          }
        } catch (e) {
          console.error('Accept invite error:', e);
        }
      }

      // Lead attribution: link lead to new user
      if (leadId) {
        try {
          const { data: { session: s } } = await supabase.auth.getSession();
          const newUser = s?.user;
          if (newUser) {
            await supabase.from('Lead' as any).update({
              userId: newUser.id,
              status: 'trial_started',
              lastStep: 'signup_completed',
              trialStartedAt: new Date().toISOString(),
            } as any).eq('id', leadId);
            trialStartedFromDemo({ leadId });
          }
        } catch (e) {
          console.error('Lead attribution error:', e);
        }
      } else {
        // Try to match by email
        try {
          const { data: { session: s } } = await supabase.auth.getSession();
          const newUser = s?.user;
          if (newUser) {
            await supabase.from('Lead' as any).update({
              userId: newUser.id,
              status: 'trial_started',
              lastStep: 'signup_completed',
              trialStartedAt: new Date().toISOString(),
            } as any).eq('email', email).is('userId', null);
          }
        } catch (e) {
          console.error('Lead email match error:', e);
        }
      }

      conversionSignup();
      trackSignup();
      toast.success('Conta criada! Verifique seu email para confirmar.');
      navigate('/auth/login');
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">Ágata</span>
          </Link>
        </div>

        {inviteToken && (
          <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
            <Mail className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-800">
                ✉️ Você foi convidado para um time no Ágata
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                Crie sua conta para aceitar o convite.
              </p>
            </div>
          </div>
        )}

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Criar Conta Grátis</CardTitle>
            <CardDescription>30 dias grátis, sem cartão de crédito</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Nome</label>
                <Input placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  readOnly={!!inviteToken}
                  className={inviteToken ? 'bg-muted cursor-not-allowed' : ''}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Senha</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-emerald-600 text-primary-foreground" disabled={loading}>
                {loading ? 'Criando...' : inviteToken ? 'Criar Conta e Aceitar Convite' : 'Criar Conta'}
              </Button>
            </form>

            <div className="mt-4 space-y-2">
              {['30 dias grátis', '5 transcrições incluídas', 'Sem cartão de crédito'].map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="h-3 w-3 text-primary" />
                  {item}
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Já tem conta?{' '}
              <Link to="/auth/login" className="text-primary hover:underline font-medium">Entrar</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
