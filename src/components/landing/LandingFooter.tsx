import { Link } from 'react-router-dom';
import { LogoIcon } from '@/components/LogoIcon';
import { VersionBadge } from '@/components/VersionBadge';

export function LandingFooter() {
  return (
    <footer className="py-12 px-4 border-t border-border">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <LogoIcon size={24} />
          <span className="font-semibold text-foreground text-sm">Ágata Transcription</span>
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link to="/legal/terms" className="hover:text-foreground transition-colors">Termos de Uso</Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">Política de Privacidade</Link>
          <Link to="/legal/lgpd" className="hover:text-foreground transition-colors">Política LGPD</Link>
          <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
          <Link to="/ajuda" className="hover:text-foreground transition-colors">Ajuda</Link>
        </div>
        <div className="flex flex-col items-center md:items-end gap-1">
          <p className="text-xs text-muted-foreground">© 2025 Ágata Transcription. Todos os direitos reservados.</p>
          <VersionBadge showChangelog={false} />
        </div>
      </div>
    </footer>
  );
}
