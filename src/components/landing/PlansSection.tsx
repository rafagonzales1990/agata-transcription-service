import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Shield, Lock } from 'lucide-react';

const plans = [
  {
    name: 'Gratuito',
    price: 'R$ 0',
    period: '/30 dias',
    description: 'Experimente sem compromisso',
    features: ['5 transcrições no período', 'Até 15min por áudio', 'Resumo com IA', 'ATA em PDF'],
    cta: 'Começar Grátis',
    popular: false,
    badge: 'SEM CARTÃO',
    note: 'Ideal para testar',
  },
  {
    name: 'Inteligente',
    price: 'R$ 49',
    originalPrice: 'R$ 61',
    period: '/mês',
    description: 'Para profissionais',
    features: ['15 transcrições/mês', 'Até 45min por áudio', 'Resumo avançado com IA', 'ATA em PDF profissional', 'Sem marca d\'água'],
    cta: 'Assinar Agora',
    popular: true,
    badge: 'MAIS POPULAR',
    note: 'Melhor para começar',
  },
  {
    name: 'Automação',
    price: 'R$ 149',
    originalPrice: 'R$ 186',
    period: '/mês',
    description: 'Para equipes com volume',
    features: ['30 transcrições/mês', 'Até 1h por áudio', 'Todos os recursos', 'Templates customizados', 'Suporte prioritário'],
    cta: 'Assinar Agora',
    popular: false,
    badge: undefined,
    note: 'Para times maiores',
  },
  {
    name: 'Enterprise',
    price: 'Sob consulta',
    period: '',
    description: 'Para grandes operações',
    features: ['100+ transcrições/mês', 'Até 2h por áudio', 'Grupos de trabalho', 'Gestão de usuários', 'Suporte dedicado', 'SLA personalizado'],
    cta: 'Falar com Vendas',
    popular: false,
    badge: undefined,
    note: 'Sob medida',
  },
];

export function PlansSection() {
  return (
    <section id="precos" className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary mb-2 tracking-wide uppercase">Planos</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Planos simples e transparentes
          </h2>
          <p className="text-muted-foreground">
            Comece grátis. Faça upgrade quando precisar. Preço anual com 20% de desconto.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
            >
              <Card className={`h-full relative ${plan.popular ? 'border-primary shadow-lg ring-2 ring-primary/20' : 'border-border'}`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className={`text-[10px] ${plan.popular ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                <CardContent className="p-6 pt-8 flex flex-col h-full">
                  <div>
                    <h3 className="font-semibold text-foreground">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>
                    <div className="mb-1">
                      {plan.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through mr-2">{plan.originalPrice}</span>
                      )}
                      <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                      {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
                    </div>
                    {plan.originalPrice && (
                      <p className="text-[10px] text-primary font-medium mb-4">Preço anual — economia de 20%</p>
                    )}
                    {!plan.originalPrice && <div className="mb-4" />}
                  </div>
                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/auth/signup">
                    <Button
                      className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Shield className="h-4 w-4" /> Garantia de 7 dias</span>
          <span className="flex items-center gap-1"><Lock className="h-4 w-4" /> Pagamento seguro via Stripe</span>
          <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Cancele a qualquer momento</span>
        </div>
      </div>
    </section>
  );
}
