import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function TrialAds() {
  const { profile } = useAuth();

  const plan = profile?.plan_id;
  const showAds = !plan || plan === 'basic' || plan === 'trial';

  useEffect(() => {
    if (!showAds) return;

    if (!document.querySelector('script[src*="adsbygoogle"]')) {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5098455114804419';
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }

    // Push ads after script loads
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {}
  }, [showAds]);

  if (!profile || !showAds) return null;

  return (
    <div className="w-full border-t border-border bg-muted/50 px-4 py-3 text-center">
      <p className="text-[10px] text-muted-foreground mb-1.5">Patrocinado</p>
      {/* Banner Trial Footer */}
      <ins
        className="adsbygoogle w-full h-[250px] md:h-[300px] rounded-xl"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-5098455114804419"
        data-ad-slot="9769901238"
        data-ad-format="rectangle"
        data-full-width-responsive="true"
      />
    </div>
  );
}
