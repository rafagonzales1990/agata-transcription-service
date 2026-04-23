import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, Eye, EyeOff, CheckCircle, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { conversionSignup, trackSignup, trackBeginSignup, trialStartedFromDemo } from '@/lib/gtag';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signupPending, setSignupPending] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
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

  const handleResendConfirmation = async () => {
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: signupEmail,
      });
      if (error) throw error;
      setResendSent(true);
    } catch (err: any) {
      toast.error('Erro ao reenviar e-mail. Tente novamente.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres');
      return;
    }
    setLoading(true);
    trackBeginSignup();
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

      // Lead attribution
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
      setSignupEmail(email);
      setSignupPending(true);
    }
  };

  if (signupPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl">✉️</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Verifique seu e-mail</h1>
            <p className="text-muted-foreground mt-2">Enviamos um link de confirmação para</p>
            <p className="font-medium text-foreground mt-1">{signupEmail}</p>
          </div>
          <div className="bg-muted/40 rounded-xl p-5 text-left space-y-3">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
              <p className="text-sm text-foreground">Abra seu e-mail em <strong>{signupEmail}</strong></p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
              <p className="text-sm text-foreground">Clique no link <strong>"Confirmar e-mail"</strong> que enviamos</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
              <p className="text-sm text-foreground">Pronto! Você será redirecionado automaticamente para o Ágata</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Não encontrou o e-mail? Verifique a pasta de <strong>spam</strong> ou <strong>lixo eletrônico</strong>.
          </p>
          <div>
            {!resendSent ? (
              <button
                onClick={handleResendConfirmation}
                disabled={resendLoading}
                className="text-sm text-primary hover:underline disabled:opacity-50"
              >
                {resendLoading ? 'Reenviando...' : 'Reenviar e-mail de confirmação'}
              </button>
            ) : (
              <p className="text-sm text-emerald-600 font-medium">✅ E-mail reenviado! Verifique sua caixa de entrada.</p>
            )}
          </div>
          <Link to="/auth/login" className="text-xs text-muted-foreground hover:text-foreground">
            ← Voltar para o login
          </Link>
        </div>
      </div>
    );
  }

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
              <p className="text-sm font-medium text-emerald-800">✉️ Você foi convidado para um time no Ágata</p>
              <p className="text-xs text-emerald-600 mt-1">Crie sua conta para aceitar o convite.</p>
            </div>
          </div>
        )}

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Criar Conta Grátis</CardTitle>
            <CardDescription>14 dias grátis, sem cartão de crédito</CardDescription>
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
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground leading-snug cursor-pointer">
                  Li e concordo com os{' '}
                  <a href="/termos" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Termos de Uso</a>,{' '}
                  a <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Política de Privacidade</a>{' '}
                  e o <a href="/eula" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Contrato de Licença (EULA)</a>{' '}
                  da Ágata Transcription.
                </label>
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-emerald-600 text-primary-foreground" disabled={loading || !termsAccepted}>
                {loading ? 'Criando...' : inviteToken ? 'Criar Conta e Aceitar Convite' : 'Criar Conta'}
              </Button>
            </form>

            <div className="mt-4 space-y-2">
              {['14 dias grátis', '5 transcrições incluídas', 'Sem cartão de crédito'].map((item) => (
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