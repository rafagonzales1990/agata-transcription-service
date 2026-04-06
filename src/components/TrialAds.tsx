import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function TrialAds() {
  const { profile } = useAuth();

  const plan = profile?.plan_id;
  const showAds = !plan || plan === 'basic' || plan === 'trial';

  useEffect(() => {
    if (!showAds) return;

    // Load AdSense script only once for trial users
    if (!document.querySelector('script[src*="adsbygoogle"]')) {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5098455114804419';
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }
  }, [showAds]);

  if (!profile || !showAds) return null;

  return (
    <div className="w-full border-t border-border bg-muted/50 px-4 py-3 text-center">
      <p className="text-[10px] text-muted-foreground mb-1.5">Patrocinado</p>
      <div className="max-w-md mx-auto rounded-lg border border-border bg-background p-3 shadow-sm">
        {/* AdSense ad unit — replace data-ad-slot with your real slot ID */}
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-5098455114804419"
          data-ad-slot=""
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
