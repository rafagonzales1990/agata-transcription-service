import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, FileText, Brain } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="pt-28 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge className="mb-5 bg-secondary text-secondary-foreground hover:bg-secondary border-0 text-xs font-medium px-3 py-1">
              🇧🇷 Feito para o mercado brasileiro
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-bold text-foreground leading-[1.1] mb-6 tracking-tight">
              Transcreva reuniões em PT-BR com IA,{' '}
              <span className="text-primary">gere resumos e ATAs em minutos</span>
            </h1>

            <p className="text-lg text-muted-foreground mb-4 max-w-xl leading-relaxed">
              Ágata Transcription transforma reuniões em transcrição, resumo executivo e ATA em PDF/Word. 
              Feito para empresas que trabalham em português.
            </p>
            <p className="text-sm text-muted-foreground mb-8 max-w-xl">
              Ideal para jurídico, RH, marketing, engenharia e financeiro.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Link to="/auth/signup">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-base px-8 h-12 shadow-lg shadow-primary/20">
                  Começar Grátis <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <a href="#comparativo">
                <Button size="lg" variant="outline" className="text-base h-12">
                  Ver comparação com concorrentes
                </Button>
              </a>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-primary" /> PT-BR nativo</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-primary" /> ATA pronta em PDF e Word</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-primary" /> Rotinas e consolidação</span>
            </div>
          </motion.div>

          {/* Hero visual - product mockup */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <div className="bg-card rounded-2xl shadow-2xl border border-border p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground border-b border-border pb-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-primary/60" />
                </div>
                <span>agatatranscription.com</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-secondary rounded-lg border border-primary/10">
                  <div>
                    <p className="font-medium text-sm text-foreground">Reunião de Produto — Q2</p>
                    <p className="text-xs text-muted-foreground">45 min • Transcrição completa</p>
                  </div>
                  <Badge className="bg-primary text-primary-foreground text-[10px]">Concluído</Badge>
                </div>

                <div className="p-4 bg-secondary rounded-lg border border-primary/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">Resumo Executivo</p>
                  </div>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p className="flex items-start gap-1.5"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /><span><strong className="text-foreground">Decisão:</strong> Lançar MVP em 2 semanas</span></p>
                    <p className="flex items-start gap-1.5"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /><span><strong className="text-foreground">Ação:</strong> João revisar wireframes até sexta</span></p>
                    <p className="flex items-start gap-1.5"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /><span><strong className="text-foreground">Próximo:</strong> Review com stakeholders</span></p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 p-3 bg-muted rounded-lg text-center">
                    <FileText className="h-5 w-5 text-primary mx-auto mb-1" />
                    <p className="text-[11px] font-medium text-foreground">ATA em PDF</p>
                  </div>
                  <div className="flex-1 p-3 bg-muted rounded-lg text-center">
                    <FileText className="h-5 w-5 text-primary mx-auto mb-1" />
                    <p className="text-[11px] font-medium text-foreground">ATA em Word</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
