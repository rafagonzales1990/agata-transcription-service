import { Link } from 'react-router-dom';
import { CreditCard, Zap, Users, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function TrialUpgradeBanners() {
  const { profile } = useAuth();

  if (!profile) return null;

  const plan = profile.plan_id;
  const isTrial = !plan || plan === 'basic' || plan === 'trial';

  if (!isTrial) return null;

  return (
    <>
      {/* Banner fixo inferior direito (300x250) */}
      <div className="fixed bottom-4 right-4 z-50 w-[300px] rounded-xl border border-border bg-card shadow-2xl p-5 hidden lg:block">
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 mb-2">
          <Zap className="h-3.5 w-3.5" />
          Trial ativo
        </div>
        <p className="text-sm font-bold text-foreground mb-3">Desbloqueie Ágata Pro</p>
        <ul className="space-y-1.5 mb-4 text-xs text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-emerald-500" /> Transcrições ilimitadas
          </li>
          <li className="flex items-center gap-1.5">
            <Users className="h-3 w-3 text-emerald-500" /> Equipes multi-usuário
          </li>
          <li className="flex items-center gap-1.5">
            <FileText className="h-3 w-3 text-emerald-500" /> Export PDF/Word
          </li>
        </ul>
        <Link
          to="/plans"
          className="block w-full text-center text-xs font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:opacity-90 transition-opacity"
        >
          Começar Pro — R$49/mês
        </Link>
      </div>

      {/* Sidebar direita dashboard (160x600) */}
      <div className="hidden xl:flex fixed top-20 right-4 z-30 w-[160px] flex-col items-center rounded-xl border border-border bg-card shadow-lg p-4">
        <p className="text-xs font-bold text-foreground mb-3 text-center">Upgrade agora</p>
        <div className="flex flex-col items-center gap-2 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">Pro</p>
            <p className="text-[10px] text-muted-foreground">R$49/mês</p>
          </div>
        </div>
        <Link
          to="/plans"
          className="w-full text-center text-[10px] font-semibold px-3 py-1.5 rounded-md bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:opacity-90 transition-opacity"
        >
          Escolher Pro
        </Link>
      </div>
    </>
  );
}
