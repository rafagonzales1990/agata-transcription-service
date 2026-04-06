import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Users, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function TrialUpgradeBanners() {
  const { profile } = useAuth();

  if (!profile) return null;

  const plan = profile.plan_id;
  const isTrial = !plan || plan === 'basic' || plan === 'trial';

  useEffect(() => {
    if (!isTrial) return;
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {}
  }, [isTrial]);

  if (!isTrial) return null;

  return (
    <>
      {/* Banner fixo inferior direito (300x250) */}
      <div className="fixed bottom-4 right-4 z-50 w-[300px] rounded-xl border border-border bg-card shadow-2xl p-5 hidden lg:block">
        <div className="flex items-center gap-2 text-xs font-medium text-primary mb-2">
          <Zap className="h-3.5 w-3.5" />
          Trial ativo
        </div>
        <p className="text-sm font-bold text-foreground mb-3">Desbloqueie Ágata Pro</p>
        <ul className="space-y-1.5 mb-4 text-xs text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-primary" /> Transcrições ilimitadas
          </li>
          <li className="flex items-center gap-1.5">
            <Users className="h-3 w-3 text-primary" /> Equipes multi-usuário
          </li>
          <li className="flex items-center gap-1.5">
            <FileText className="h-3 w-3 text-primary" /> Export PDF/Word
          </li>
        </ul>
        <Link
          to="/plans"
          className="block w-full text-center text-xs font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Começar Pro — R$49/mês
        </Link>
      </div>

      {/* Sidebar AdSense (160x600) */}
      <div className="hidden xl:flex fixed top-20 right-4 z-30 w-[160px] flex-col items-center">
        <ins
          className="adsbygoogle hidden lg:block w-[160px] h-[600px] sticky top-24"
          style={{ display: 'inline-block', width: 160, height: 600 }}
          data-ad-client="ca-pub-5098455114804419"
          data-ad-slot="9446467602"
        />
      </div>
    </>
  );
}
