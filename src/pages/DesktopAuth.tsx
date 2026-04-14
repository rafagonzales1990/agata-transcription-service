import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles } from 'lucide-react';

export default function DesktopAuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        redirectToApp(session.access_token, session.refresh_token!);
      } else {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  function redirectToApp(accessToken: string, refreshToken: string) {
    window.location.href = `agata://auth?token=${accessToken}&refresh_token=${refreshToken}`;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('E-mail ou senha incorretos');
      setLoading(false);
      return;
    }
    if (data.session) {
      redirectToApp(data.session.access_token, data.session.refresh_token!);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-white/60 text-sm">Conectando ao app desktop...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Ágata</span>
          </div>
          <h1 className="text-xl font-semibold text-white mt-4">Entrar no App Desktop</h1>
          <p className="text-white/50 text-sm mt-1">
            Após autenticar, você será redirecionado ao app
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-white/70 mb-1 block">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-white/70 mb-1 block">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar e abrir o app'}
          </button>
        </form>

        <p className="text-center text-white/30 text-xs mt-6">
          Esta página é exclusiva para autenticação do app desktop
        </p>
      </div>
    </div>
  );
}
