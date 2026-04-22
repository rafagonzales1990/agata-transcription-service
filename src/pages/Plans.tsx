import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { CheckCircle, Loader2, ExternalLink, Lightbulb } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { conversionBeginCheckout, conversionPurchase, trackBeginCheckout, trackPurchase } from '@/lib/gtag';

interface Plan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  maxTranscriptions: number;
  maxDurationMinutes: number;
  features: string[];
  popular: boolean;
}

const ANNUAL_SAVINGS: Record<string, { monthlyTotal: number; annualTotal: number; savings: number }> = {
  inteligente: { monthlyTotal: 636_00, annualTotal: 444_00, savings: 192_00 },
  automacao:   { monthlyTotal: 2352_00, annualTotal: 1644_00, savings: 708_00 },
  enterprise:  { monthlyTotal: 7800_00, annualTotal: 5880_00, savings: 1920_00 },
};


function formatBRL(centavos: number) {
  return `R$\u00a0${(centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function PlansPage() {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearly, setYearly] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  
  const [portalLoading, setPortalLoading] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [showSuccessTip, setShowSuccessTip] = useState(false);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Plano atualizado com sucesso!');
      const planName = searchParams.get('plan') || 'unknown';
      const planValue = parseFloat(searchParams.get('value') || '0');
      conversionPurchase(planName, planValue);
      trackPurchase(planName, planValue);
      setShowSuccessTip(true);
    }
    if (searchParams.get('canceled') === 'true') toast.error('Pagamento cancelado');
  }, [searchParams]);

  useEffect(() => {
    async function fetchPlans() {
      const [plansRes, userRes] = await Promise.all([
        supabase.from('Plan').select('*').order('priceMonthly'),
        profile?.email
          ? supabase.from('User').select('stripeSubscriptionId').eq('email', profile.email).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      if (plansRes.data) setPlans(plansRes.data as Plan[]);
      if (userRes.data?.stripeSubscriptionId) setHasSubscription(true);
      setLoading(false);
    }
    fetchPlans();
  }, [profile]);

  const handleSubscribe = async (planId: string) => {
    if (planId === 'basic') return;
    setCheckoutLoading(planId);
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      const price = yearly ? plan.priceYearly : plan.priceMonthly;
      conversionBeginCheckout(plan.name, price / 100);
      trackBeginCheckout(plan.name, price / 100);
    }
    try {
      const cycle = yearly ? 'yearly' : 'monthly';
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planId, billingCycle: cycle },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data.type === 'checkout' && data.url) {
        window.location.href = data.url;
      } else if (data.type === 'upgrade') {
        conversionPurchase(data.planId, data.value);
        trackPurchase(data.planId, data.value);
        toast.success('Plano atualizado com sucesso!');
        window.location.reload();
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao iniciar checkout');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleUpfrontSubscribe = async (planId: string) => {
    if (checkoutLoading) return;
    setCheckoutLoading(planId + '_upfront');
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planId, billingCycle: 'annual_upfront' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || 'Erro ao iniciar checkout');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-portal');
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || 'Erro ao abrir portal');
    } finally {
      setPortalLoading(false);
    }
  };

  const currentPlanId = profile?.plan_id || 'basic';
  const isPaid = currentPlanId !== 'basic';

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Escolha seu plano</h1>
          <p className="text-muted-foreground">Upgrade a qualquer momento. Cancele quando quiser.</p>
        </div>

        {/* Post-checkout success tip */}
        {showSuccessTip && (
          <div className="mx-auto max-w-xl bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Dica:</span> Na renovação, você pode trocar para pagamento antecipado anual e economizar 31%. Fale com nosso suporte.
            </p>
          </div>
        )}

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3">
          <span className={`text-sm ${!yearly ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>Mensal</span>
          <Switch checked={yearly} onCheckedChange={setYearly} />
          <span className={`text-sm flex items-center gap-1.5 ${yearly ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
            Anual
            <Badge variant="secondary" className="text-[10px]">Mais popular</Badge>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">30% de desconto</Badge>
          </span>
        </div>

        {hasSubscription && (
          <div className="text-center">
            <Button variant="outline" onClick={handlePortal} disabled={portalLoading}>
              {portalLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ExternalLink className="h-4 w-4 mr-2" />}
              Gerenciar Assinatura
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan) => {
                const price = yearly ? plan.priceYearly : plan.priceMonthly;
                const displayPrice = (price / 100).toFixed(0);
                const isCurrent = plan.id === currentPlanId;
                const savings = yearly ? ANNUAL_SAVINGS[plan.id] : null;

                return (
                  <Card key={plan.id} className={`relative ${plan.popular ? 'border-primary ring-2 ring-primary/20' : ''}`}>
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground text-[10px]">MAIS POPULAR</Badge>
                      </div>
                    )}
                    <CardContent className="p-6 pt-8">
                      <h3 className="font-semibold text-foreground">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
                      <div className="my-4">
                        <span className="text-3xl font-bold text-foreground">R$ {displayPrice}</span>
                        <span className="text-sm text-muted-foreground">/mês</span>
                      </div>
                      {savings && (
                        <p className="text-xs text-primary -mt-2 mb-4">
                          {formatBRL(savings.annualTotal)}/ano • economize {formatBRL(savings.savings)}
                        </p>
                      )}
                      <ul className="space-y-2 mb-6">
                        {plan.features.map((f, j) => (
                          <li key={j} className="text-sm text-muted-foreground flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-primary shrink-0" /> {f}
                          </li>
                        ))}
                      </ul>
                      <Button
                        className={`w-full ${plan.popular && !isCurrent ? 'bg-primary hover:bg-emerald-600 text-primary-foreground' : ''}`}
                        variant={plan.popular && !isCurrent ? 'default' : 'outline'}
                        disabled={isCurrent || plan.id === 'basic' || !!checkoutLoading}
                        onClick={() => handleSubscribe(plan.id)}
                      >
                        {checkoutLoading === plan.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isCurrent ? 'Plano Atual' : plan.id === 'basic' ? 'Gratuito' : 'Assinar'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Annual Upfront Savings Card */}
            <Card className="border-l-4 border-l-primary bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-6 sm:p-8">
                <div className="text-center mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    💰 Pague uma vez, use por 12 meses — economize até 35%
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Cobrado uma única vez no cartão. Sem renovação automática.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                  {[
                    {
                      id: 'inteligente',
                      name: 'Essencial',
                      annualLabel: 'R$ 408',
                      monthlyEq: 'R$ 34',
                      savingsLabel: 'Você economiza R$ 228',
                    },
                    {
                      id: 'automacao',
                      name: 'Pro',
                      annualLabel: 'R$ 1.524',
                      monthlyEq: 'R$ 127',
                      savingsLabel: 'Você economiza R$ 828',
                    },
                  ].map((item) => {
                    const isCurrent = currentPlanId === item.id;
                    const loadingThis = checkoutLoading === item.id + '_upfront';
                    return (
                      <div
                        key={item.id}
                        className="rounded-lg border border-border bg-card p-5 flex flex-col"
                      >
                        <p className="text-sm font-semibold text-foreground uppercase tracking-wide">
                          {item.name}
                        </p>
                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-primary">{item.annualLabel}</span>
                          <span className="text-sm text-muted-foreground">/ano</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          = {item.monthlyEq}/mês
                        </p>
                        <Badge className="mt-3 self-start bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
                          {item.savingsLabel}
                        </Badge>
                        <Button
                          className="mt-4 w-full bg-primary hover:bg-emerald-600 text-primary-foreground"
                          onClick={() => handleUpfrontSubscribe(item.id)}
                          disabled={!!checkoutLoading || isCurrent}
                        >
                          {loadingThis ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isCurrent ? (
                            'Plano Atual'
                          ) : (
                            <>Assinar {item.name} Anual →</>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-5 border-t border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    'Cobrado uma única vez',
                    'Acesso garantido por 12 meses',
                    'Suporte prioritário incluído',
                    'Cancele e receba reembolso proporcional',
                  ].map((badge) => (
                    <div key={badge} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                      <span>{badge}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
