import { useAuth } from '@/contexts/AuthContext';

export function TrialAds() {
  const { profile } = useAuth();

  if (!profile) return null;

  const plan = profile.plan_id;
  const showAds = !plan || plan === 'basic' || plan === 'trial';

  if (!showAds) return null;

  return (
    <div className="w-full border-t border-border bg-muted/50 px-4 py-3 text-center">
      <p className="text-[10px] text-muted-foreground mb-1.5">Patrocinado</p>
      <div className="max-w-md mx-auto rounded-lg border border-border bg-background p-3 shadow-sm">
        {/* Ad slot — replace with real ad content or script */}
        <p className="text-xs text-muted-foreground">Espaço reservado para anúncio</p>
      </div>
    </div>
  );
}
