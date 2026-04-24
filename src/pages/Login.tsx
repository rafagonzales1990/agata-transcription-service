import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sparkles, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { VersionBadge } from '@/components/VersionBadge';
import { SSOButtons } from '@/components/auth/SSOButtons';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const navigate = useNavigate();

  const handleResendConfirmation = async () => {
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (error) throw error;
      setResendSent(true);
    } catch {
      toast.error('Erro ao reenviar e-mail. Tente novamente.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const msg = error.message?.toLowerCase() || '';

      if (msg.includes('email not confirmed') || msg.includes('email_not_confirmed')) {
        setEmailNotConfirmed(true);
        setResendSent(false);
        setLoading(false);
        return;
      }

      if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
        toast.error('E-mail ou senha incorretos. Tente novamente.');
      } else if (msg.includes('too many requests')) {
        toast.error('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
      } else {
        toast.error(error.message || 'Erro ao fazer login');
      }
    } else {
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    }

    setLoading(false);
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

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Entrar</CardTitle>
            <CardDescription>Acesse sua conta</CardDescription>
          </CardHeader>
          <CardContent>
            <SSOButtons mode="login" />
            {emailNotConfirmed && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <span className="text-amber-500 text-lg mt-0.5">✉️</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800">
                      Confirme seu e-mail para continuar
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      Enviamos um link de confirmação para <strong>{email}</strong>.
                      Acesse seu e-mail e clique no link para ativar sua conta.
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      Não encontrou? Verifique a pasta de spam ou lixo eletrônico.
                    </p>
                    {!resendSent ? (
                      <button
                        type="button"
                        onClick={handleResendConfirmation}
                        disabled={resendLoading}
                        className="mt-2 text-xs font-medium text-amber-700 hover:text-amber-900 underline disabled:opacity-50"
                      >
                        {resendLoading ? 'Reenviando...' : 'Reenviar e-mail de confirmação →'}
                      </button>
                    ) : (
                      <p className="mt-2 text-xs font-medium text-emerald-600">
                        ✅ E-mail reenviado! Verifique sua caixa de entrada.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
                <Input type="email" placeholder="seu@email.com" value={email} onChange={(e) => { setEmail(e.target.value); setEmailNotConfirmed(false); }} required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Senha</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
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
              <div className="text-right">
                <Link to="/auth/forgot-password" className="text-xs text-primary hover:underline">Esqueceu a senha?</Link>
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-emerald-600 text-primary-foreground" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Não tem conta?{' '}
              <Link to="/auth/signup" className="text-primary hover:underline font-medium">Criar conta grátis</Link>
            </p>
           </CardContent>
         </Card>
         <div className="text-center mt-6">
           <VersionBadge showChangelog={false} />
         </div>
       </div>
     </div>
  );
}
