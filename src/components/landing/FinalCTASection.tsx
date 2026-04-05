import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle } from 'lucide-react';

export function FinalCTASection() {
  return (
    <section className="py-24 px-4 bg-primary">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
          Comece grátis agora
        </h2>
        <p className="text-primary-foreground/80 text-lg mb-6">
          Teste com suas reuniões reais. Veja a diferença em minutos.
        </p>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-primary-foreground/80 mb-8">
          <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> Sem configuração complexa</span>
          <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> Sem dependência de equipe técnica</span>
          <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> Pronto para usar</span>
        </div>

        <Link to="/auth/signup">
          <Button size="lg" className="bg-background text-foreground hover:bg-muted text-base px-10 h-12 shadow-lg">
            Começar Meu Teste Grátis <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
        <p className="text-xs text-primary-foreground/60 mt-4">Sem cartão de crédito · Leva menos de 30 segundos</p>
      </div>
    </section>
  );
}
