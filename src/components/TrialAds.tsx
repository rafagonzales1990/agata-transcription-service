import { useEffect, useRef, useId } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function TrialAds() {
  const { profile } = useAuth();
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const uid = useId();

  const plan = profile?.plan_id;
  const showAds = !plan || plan === 'basic' || plan === 'trial';

  useEffect(() => {
    if (!showAds || pushed.current) return;
    const el = adRef.current;
    // Skip if this <ins> already has an ad rendered into it
    if (el && el.getAttribute('data-adsbygoogle-status')) {
      pushed.current = true;
      return;
    }
    pushed.current = true;
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
      console.warn('AdSense push error:', e);
    }
  }, [showAds]);

  if (!profile || !showAds) return null;

  return (
    <div className="w-full border-t border-border bg-muted/50 px-4 py-3 text-center">
      <p className="text-[10px] text-muted-foreground mb-1.5">Patrocinado</p>
      <ins
        key={`ad-bottom-${uid}`}
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
