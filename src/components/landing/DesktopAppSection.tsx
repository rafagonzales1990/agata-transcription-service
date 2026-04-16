import { motion } from 'framer-motion';
import { Monitor, Mic, CloudUpload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function DesktopAppSection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-border bg-card p-10 text-center"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-secondary text-primary mb-5">
            <Monitor className="h-7 w-7" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Grave direto do seu desktop
          </h2>
          <p className="text-muted-foreground mb-6">
            Funciona com Teams, Zoom, Meet e qualquer app Windows
          </p>

          <div className="flex items-center justify-center gap-3 mb-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-primary">
              <Mic className="h-3.5 w-3.5" /> Mic + Sistema
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-primary">
              <CloudUpload className="h-3.5 w-3.5" /> Backup automático
            </span>
          </div>

          <Button asChild size="lg" className="text-base px-8">
            <a href="https://github.com/rafagonzales1990/agata-desktop/releases/latest/download/Agata-Transcription-1.0.4-Windows.exe" target="_blank" rel="noopener noreferrer">
              ⬇ Baixar para Windows — Grátis
            </a>
          </Button>

          <p className="text-xs text-muted-foreground mt-3 mb-4">
            v1.0.4 · Windows 10/11 · Sem instalação necessária
          </p>

          <Badge variant="secondary" className="text-xs">
            🍎 Mac — em breve
          </Badge>
        </motion.div>
      </div>
    </section>
  );
}
