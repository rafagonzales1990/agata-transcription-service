import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, AlertTriangle, Clock, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function TrialBanner() {
  const { profile } = useAuth();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('trial_banner_dismissed_v2') === 'true'
  );

  if (dismissed || !profile) return null;
  if (profile.plan_id !== 'basic') return null;

  const handleDismiss = () => {
    localStorage.setItem('trial_banner_dismissed_v2', 'true');
    setDismissed(true);
  };

  const trialEnd = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const now = new Date();

  // State 1: Active trial
  if (trialEnd && trialEnd > now) {
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    let bgClass = 'bg-emerald-50 text-emerald-800 border-b border-emerald-200';
    let Icon = Clock;
    if (daysLeft <= 3) {
      bgClass = 'bg-red-50 text-red-800 border-b border-red-200';
      Icon = AlertTriangle;
    } else if (daysLeft <= 7) {
      bgClass = 'bg-amber-50 text-amber-800 border-b border-amber-200';
      Icon = AlertTriangle;
    }

    return (
      <div className={`px-4 py-2.5 text-sm flex items-center justify-between gap-4 ${bgClass}`}>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 shrink-0" />
          <span>
            Você está no período de teste grátis. <strong>{daysLeft} dia{daysLeft !== 1 ? 's' : ''} restante{daysLeft !== 1 ? 's' : ''}</strong>.{' '}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/plans" className="text-xs font-semibold px-3 py-1 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity whitespace-nowrap">
            Fazer Upgrade
          </Link>
          <button onClick={handleDismiss} className="shrink-0 hover:opacity-70">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // State 2: Free restricted (trial expired or no trial)
  return (
    <div className="px-4 py-2.5 text-sm flex items-center justify-between gap-4 bg-gray-100 text-gray-700 border-b border-gray-200">
      <div className="flex items-center gap-2">
        <Lock className="h-4 w-4 shrink-0" />
        <span>
          Você está no <strong>Plano Gratuito</strong> (2 transcrições/mês, 5min/áudio, sem resumo IA).
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Link to="/plans" className="text-xs font-semibold px-3 py-1 rounded-md bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-white hover:opacity-90 transition-opacity whitespace-nowrap">
          Desbloquear Tudo
        </Link>
        <button onClick={handleDismiss} className="shrink-0 hover:opacity-70">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
