import { useEffect, useRef, useId } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function TrialUpgradeBanners() {
  const { profile } = useAuth();
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const uid = useId();

  const plan = profile?.plan_id;
  const showAds = !plan || plan === 'basic' || plan === 'trial';

  useEffect(() => {
    if (!showAds || pushed.current) return;
    const el = adRef.current;
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
    <div className="hidden xl:flex fixed top-20 right-4 z-30 w-[160px] flex-col items-center">
      <ins
        key={`ad-side-${uid}`}
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'inline-block', width: 160, height: 600 }}
        data-ad-client="ca-pub-5098455114804419"
        data-ad-slot="9446467602"
      />
    </div>
  );
}
