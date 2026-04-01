import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const plans = [
  { name: 'Teste Grátis', price: 'R$ 0', period: '/30 dias', features: ['5 transcrições', 'Até 15min/áudio', 'Resumo com IA', 'ATA em PDF'], current: true },
  { name: 'Inteligente', price: 'R$ 49', period: '/mês', features: ['15 transcrições/mês', 'Até 45min/áudio', 'Resumo avançado', 'Sem marca d\'água'], popular: true },
  { name: 'Automação', price: 'R$ 149', period: '/mês', features: ['30 transcrições/mês', 'Até 1h/áudio', 'Templates customizados', 'Suporte prioritário'] },
  { name: 'Enterprise', price: 'R$ 499', period: '/mês', features: ['100 transcrições/mês', 'Até 2h/áudio', 'Gestão de usuários', 'Suporte dedicado'] },
];

export default function PlansPage() {
  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Link to="/" className="text-primary hover:underline text-sm mb-4 inline-block">← Voltar</Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">Escolha seu plano</h1>
          <p className="text-muted-foreground">Upgrade a qualquer momento. Cancele quando quiser.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, i) => (
            <Card key={i} className={`relative ${plan.popular ? 'border-primary ring-2 ring-primary/20' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground text-[10px]">MAIS POPULAR</Badge>
                </div>
              )}
              <CardContent className="p-6 pt-8">
                <h3 className="font-semibold text-foreground">{plan.name}</h3>
                <div className="my-4">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="text-sm text-muted-foreground flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${plan.popular ? 'bg-primary hover:bg-emerald-600 text-primary-foreground' : ''}`}
                  variant={plan.popular ? 'default' : 'outline'}
                  disabled={plan.current}
                >
                  {plan.current ? 'Plano Atual' : 'Assinar'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
