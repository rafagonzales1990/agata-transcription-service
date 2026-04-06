import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function TrialAds() {
  const { profile } = useAuth();
  const adRef = useRef<HTMLModElement>(null);

  const plan = profile?.plan_id;
  const showAds = !plan || plan === 'basic' || plan === 'trial';

  // Push ad once (script already in index.html <head>)
  useEffect(() => {
    if (!showAds) return;
    try {
      (window as any).adsbygoogle = (window as any).adsbygoogle || [];
      (window as any).adsbygoogle.push({});
    } catch (e) {}
  }, []); // runs 1x
  // Fallback 10s
  useEffect(() => {
    if (!showAds) return;
    const timer = setTimeout(() => {
      document.querySelectorAll('.adsbygoogle').forEach((slot) => {
        if (!slot.innerHTML.trim() || slot.innerHTML.includes('Upgrade')) return;
      });
      if (adRef.current && !adRef.current.innerHTML.trim()) {
        adRef.current.innerHTML =
          '<a href="/plans" class="block text-center p-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold no-underline">🚀 Upgrade Pro — R$29/mês</a>';
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
