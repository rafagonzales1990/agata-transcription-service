import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, AlertTriangle, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function TrialBanner() {
  const { profile } = useAuth();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('trial_banner_dismissed') === 'true'
  );

  if (dismissed || !profile) return null;
  if (profile.plan_id !== 'basic') return null;
  if (!profile.trial_ends_at) return null;

  const trialEnd = new Date(profile.trial_ends_at);
  const now = new Date();
  if (trialEnd <= now) return null;

  const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isWarning = daysLeft <= 7;

  const handleDismiss = () => {
    localStorage.setItem('trial_banner_dismissed', 'true');
    setDismissed(true);
  };

  return (
    <div className={`px-4 py-2.5 text-sm flex items-center justify-between gap-4 ${
      isWarning
        ? 'bg-destructive/10 text-destructive border-b border-destructive/20'
        : 'bg-primary/10 text-primary border-b border-primary/20'
    }`}>
      <div className="flex items-center gap-2">
        {isWarning ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <Clock className="h-4 w-4 shrink-0" />}
        <span>
          Seu trial gratuito termina em <strong>{daysLeft} dia{daysLeft !== 1 ? 's' : ''}</strong>.{' '}
          <Link to="/plans" className="underline font-medium hover:opacity-80">
            Faça upgrade para continuar.
          </Link>
        </span>
      </div>
      <button onClick={handleDismiss} className="shrink-0 hover:opacity-70">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
