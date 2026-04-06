import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function TrialUpgradeBanners() {
  const { profile } = useAuth();
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
    <div className="hidden xl:flex fixed top-20 right-4 z-30 w-[160px] flex-col items-center">
      <ins
        className="adsbygoogle"
        style={{ display: 'inline-block', width: 160, height: 600 }}
        data-ad-client="ca-pub-5098455114804419"
        data-ad-slot="9446467602"
      />
    </div>
  );
}
