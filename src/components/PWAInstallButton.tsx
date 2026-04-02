import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallButton() {
  const [installable, setInstallable] = useState(false);
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      promptRef.current = e as BeforeInstallPromptEvent;
      setInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!promptRef.current) return;
    promptRef.current.prompt();
    const { outcome } = await promptRef.current.userChoice;
    if (outcome === 'accepted' || outcome === 'dismissed') {
      promptRef.current = null;
      setInstallable(false);
    }
  };

  if (!installable || isMobile) return null;

  return (
    <Button
      onClick={handleInstall}
      size="sm"
      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
    >
      <Download className="h-4 w-4" />
      Instalar Ágata
    </Button>
  );
}
