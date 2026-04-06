import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function TrialAds() {
  const { profile } = useAuth();
  const adRef = useRef<HTMLModElement>(null);

  const plan = profile?.plan_id;
  const showAds = !plan || plan === 'basic' || plan === 'trial';

  useEffect(() => {
    if (!showAds) return;

    if (!document.querySelector('script[src*="adsbygoogle"]')) {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5098455114804419';
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        try {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        } catch (e) {}
      };
      document.head.appendChild(script);
    } else {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (e) {}
    }

    // Fallback after 10s if ad didn't load
    const timer = setTimeout(() => {
      if (adRef.current && !adRef.current.innerHTML.trim()) {
        adRef.current.innerHTML =
          '<a href="/plans" style="display:block;text-align:center;padding:24px;background:linear-gradient(135deg,#059669,#0d9488);color:white;border-radius:12px;font-weight:600;text-decoration:none;">🚀 Upgrade Pro — R$29/mês</a>';
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [showAds]);

  if (!profile || !showAds) return null;

  return (
    <div className="w-full border-t border-border bg-muted/50 px-4 py-3 text-center">
      <p className="text-[10px] text-muted-foreground mb-1.5">Patrocinado</p>
      <ins
        ref={adRef}
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