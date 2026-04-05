import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { LogoIcon } from '@/components/LogoIcon';

export function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <LogoIcon size={32} />
            <div className="flex flex-col">
              <span className="text-base font-bold text-primary leading-tight">Ágata</span>
              <span className="text-[10px] text-muted-foreground -mt-0.5">Transcription</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#recursos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
            <a href="#diferencial" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Diferenciais</a>
            <a href="#comparativo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Comparativo</a>
            <a href="#precos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Preços</a>
            <a href="#casos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Casos de Uso</a>
            <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/auth/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/auth/signup">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Começar Grátis
              </Button>
            </Link>
          </div>

          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-background"
          >
            <div className="px-4 py-4 space-y-3">
              <a href="#recursos" className="block text-sm text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>Recursos</a>
              <a href="#diferencial" className="block text-sm text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>Diferenciais</a>
              <a href="#comparativo" className="block text-sm text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>Comparativo</a>
              <a href="#precos" className="block text-sm text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>Preços</a>
              <a href="#casos" className="block text-sm text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>Casos de Uso</a>
              <Link to="/blog" className="block text-sm text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
              <div className="pt-3 border-t border-border flex gap-2">
                <Link to="/auth/login" className="flex-1"><Button variant="outline" className="w-full" size="sm">Entrar</Button></Link>
                <Link to="/auth/signup" className="flex-1"><Button className="w-full bg-primary text-primary-foreground" size="sm">Começar Grátis</Button></Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
