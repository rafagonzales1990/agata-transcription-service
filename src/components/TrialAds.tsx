import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function TrialAds() {
  const { profile } = useAuth();
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  const plan = profile?.plan_id;
  const showAds = !plan || plan === 'basic' || plan === 'trial';

  useEffect(() => {
    if (!showAds || pushed.current) return;
    pushed.current = true;
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {}
  }, [showAds]);

  if (!profile || !showAds) return null;

  return (
    <div className="w-full border-t border-border bg-muted/50 px-4 py-3 text-center">
      <p className="text-[10px] text-muted-foreground mb-1.5">Patrocinado</p>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-5098455114804419"
        data-ad-slot="9769901238"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
