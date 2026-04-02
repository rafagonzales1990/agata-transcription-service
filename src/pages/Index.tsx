import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, FileText, Sparkles, Clock, Shield, Zap, CheckCircle, ArrowRight,
  Play, Upload, Brain, ChevronDown, ChevronUp, Menu, X, Star, Users,
  Timer, TrendingUp, Gift, BadgeCheck, Lock,
} from 'lucide-react';
import { LogoIcon } from '@/components/LogoIcon';

const features = [
  { icon: <Mic className="h-6 w-6" />, title: 'Transcrição Automática', description: 'Envie áudios em MP3, WAV, M4A, AAC, CAF e mais. Nossa IA transcreve em segundos.' },
  { icon: <Brain className="h-6 w-6" />, title: 'Resumos Inteligentes', description: 'Receba resumos estruturados com decisões, ações e próximos passos.' },
  { icon: <FileText className="h-6 w-6" />, title: 'ATA em PDF', description: 'Gere atas profissionais em PDF com um clique, prontas para compartilhar.' },
  { icon: <Clock className="h-6 w-6" />, title: 'Economize Tempo', description: 'Transforme horas de anotações em minutos. Foque no que importa.' },
  { icon: <Shield className="h-6 w-6" />, title: 'LGPD Compliant', description: 'Seus dados são protegidos. Exclusão automática em 24h.' },
  { icon: <Zap className="h-6 w-6" />, title: '100% Português BR', description: 'Otimizado para o português brasileiro. Resultados precisos.' },
];

const steps = [
  { number: '01', title: 'Faça Upload', description: 'Envie seu arquivo de áudio ou vídeo da reunião.', icon: <Upload className="h-8 w-8" /> },
  { number: '02', title: 'IA Transcreve', description: 'Nossa IA processa e transcreve automaticamente.', icon: <Brain className="h-8 w-8" /> },
  { number: '03', title: 'Receba Resultados', description: 'Obtenha transcrição, resumo e ATA em PDF.', icon: <FileText className="h-8 w-8" /> },
];

const plans = [
  { name: 'Teste Grátis', price: 'R$ 0', period: '/30 dias', description: 'Experimente sem compromisso', features: ['5 transcrições no período', 'Até 15min por áudio', '✓ Resumo com IA', '✓ ATA em PDF'], cta: 'Começar Teste Grátis', popular: false, badge: 'SEM CARTÃO' },
  { name: 'Inteligente', price: 'R$ 49', originalPrice: 'R$ 61', period: '/mês', description: 'Para profissionais', features: ['15 transcrições/mês', 'Até 45min por áudio', '✓ Resumo avançado com IA', '✓ ATA em PDF profissional', '✓ Sem marca d\'água'], cta: 'Assinar Agora', popular: true, badge: 'MAIS POPULAR' },
  { name: 'Automação', price: 'R$ 149', originalPrice: 'R$ 186', period: '/mês', description: 'Para equipes', features: ['30 transcrições/mês', 'Até 1h por áudio', '✓ Todos os recursos', '✓ Templates customizados', '✓ Suporte prioritário'], cta: 'Assinar Agora', popular: false, badge: undefined },
  { name: 'Enterprise', price: 'R$ 499', originalPrice: 'R$ 623', period: '/mês', description: 'Para grandes equipes', features: ['100 transcrições/mês', 'Até 2h por áudio', '✓ Grupos de trabalho', '✓ Gestão de usuários', '✓ Suporte dedicado'], cta: 'Falar com Vendas', popular: false, badge: undefined },
];

const metrics = [
  { number: '95%+', label: 'Precisão em PT-BR', icon: <BadgeCheck className="h-5 w-5" /> },
  { number: '2min', label: 'Tempo médio p/ 1h de áudio', icon: <Timer className="h-5 w-5" /> },
  { number: '10h', label: 'Economizadas por semana', icon: <TrendingUp className="h-5 w-5" /> },
  { number: '24h', label: 'Exclusão automática de dados', icon: <Lock className="h-5 w-5" /> },
];

const testimonials = [
  { name: 'Mariana Costa', role: 'Gerente de Projetos', company: 'Tech Solutions', text: 'A Ágata transformou nosso processo de documentação. Antes gastávamos 2h por reunião fazendo atas, agora leva 5 minutos. O resumo com IA é incrível.', stars: 5 },
  { name: 'Ricardo Almeida', role: 'Diretor de Operações', company: 'Consultoria Nova Era', text: 'Testei várias ferramentas de transcrição e nenhuma chegava perto em português. A Ágata acerta até gírias e termos técnicos. Recomendo demais.', stars: 5 },
  { name: 'Fernanda Oliveira', role: 'Advogada', company: 'Oliveira & Associados', text: 'Uso para transcrever audiências e reuniões com clientes. A geração de ATA em PDF é profissional e me poupa horas toda semana. O compliance com LGPD foi decisivo.', stars: 5 },
];

const faqs = [
  { question: 'Quais formatos de áudio são suportados?', answer: 'Suportamos MP3, WAV, M4A, AAC, CAF, OGG, WebM e MP4. Isso inclui gravações de Samsung, iPhone/Apple e a maioria dos dispositivos.' },
  { question: 'Quanto tempo leva para transcrever?', answer: 'A transcrição é feita em tempo real. Um áudio de 30 minutos geralmente é processado em 1-2 minutos.' },
  { question: 'Meus dados estão seguros?', answer: 'Sim! Somos LGPD compliant. Os arquivos são excluídos automaticamente após 24 horas e usamos criptografia em todo o processo.' },
  { question: 'Posso cancelar a qualquer momento?', answer: 'Sim, você pode cancelar sua assinatura a qualquer momento. Não há fidelidade ou multas.' },
  { question: 'A transcrição funciona bem em português?', answer: 'Sim! Nossa IA é otimizada especificamente para português brasileiro, com excelente precisão mesmo com sotaques regionais.' },
  { question: 'Preciso de cartão de crédito para testar?', answer: 'Não! O teste grátis de 30 dias não exige cartão de crédito. Basta criar sua conta e começar a transcrever imediatamente.' },
  { question: 'Existe garantia de satisfação?', answer: 'Sim! Oferecemos garantia de 7 dias nos planos pagos. Se não ficar satisfeito, devolvemos 100% do valor. Sem perguntas.' },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowStickyBar(window.scrollY > 600);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <LogoIcon size={32} />
              <div className="flex flex-col">
                <span className="text-base font-bold text-emerald-600 leading-tight">Ágata</span>
                <span className="text-[10px] text-muted-foreground -mt-0.5">Transcription</span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <a href="#recursos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
              <a href="#como-funciona" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Como Funciona</a>
              <a href="#precos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Preços</a>
              <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <Link to="/auth/login">
                <Button variant="ghost" size="sm">Entrar</Button>
              </Link>
              <Link to="/auth/signup">
                <Button size="sm" className="bg-primary hover:bg-emerald-600 text-primary-foreground">
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
                <a href="#como-funciona" className="block text-sm text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>Como Funciona</a>
                <a href="#precos" className="block text-sm text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>Preços</a>
                <a href="#faq" className="block text-sm text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
                <div className="pt-3 border-t border-border flex gap-2">
                  <Link to="/auth/login" className="flex-1"><Button variant="outline" className="w-full" size="sm">Entrar</Button></Link>
                  <Link to="/auth/signup" className="flex-1"><Button className="w-full bg-primary text-primary-foreground" size="sm">Começar Grátis</Button></Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Sticky CTA Bar */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="fixed top-16 left-0 right-0 z-40 bg-primary text-primary-foreground py-2"
          >
            <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
              <p className="text-sm font-medium">🎉 Oferta de Lançamento: 30 dias grátis — sem cartão de crédito</p>
              <Link to="/auth/signup">
                <Button size="sm" variant="secondary" className="bg-background text-foreground hover:bg-muted">Testar Grátis</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge className="mb-4 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
                <Gift className="h-3 w-3 mr-1" /> Oferta de Lançamento — 30 dias grátis
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
                Transforme reuniões em{' '}
                <span className="text-primary">ações</span>
              </h1>

              <p className="text-lg text-muted-foreground mb-6 max-w-lg">
                Transcrição automática com IA, resumos inteligentes e atas profissionais. Economize horas de trabalho em cada reunião.
              </p>

              {/* Trust indicators */}
              <div className="flex flex-wrap gap-3 mb-8">
                <Badge variant="outline" className="text-xs"><BadgeCheck className="h-3 w-3 mr-1 text-primary" />+95% precisão em PT-BR</Badge>
                <Badge variant="outline" className="text-xs"><Shield className="h-3 w-3 mr-1 text-primary" />LGPD Compliant</Badge>
                <Badge variant="outline" className="text-xs"><Star className="h-3 w-3 mr-1 text-yellow-500" />Avaliação 5.0</Badge>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <Link to="/auth/signup">
                  <Button size="lg" className="bg-primary hover:bg-emerald-600 text-primary-foreground text-base px-8">
                    Começar Grátis — 30 Dias <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <a href="#como-funciona">
                  <Button size="lg" variant="outline" className="text-base">
                    <Play className="h-4 w-4 mr-2" /> Ver Como Funciona
                  </Button>
                </a>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>✓ Sem cartão de crédito</span>
                <span>✓ 5 transcrições grátis</span>
                <span>✓ Cancele quando quiser</span>
                <span>✓ Setup em 30 segundos</span>
              </div>
            </motion.div>

            {/* Hero Demo */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
              <div className="bg-card rounded-2xl shadow-2xl border border-border p-6 space-y-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground border-b border-border pb-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <span>agatatranscription.com/dashboard</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div>
                      <p className="font-medium text-sm text-foreground">Reunião de Produto</p>
                      <p className="text-xs text-muted-foreground">45 min • Concluído</p>
                    </div>
                    <Badge className="bg-primary text-primary-foreground text-[10px]">Novo</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium text-sm text-foreground">Sprint Planning</p>
                      <p className="text-xs text-muted-foreground">30 min • Concluído</p>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-sm font-semibold text-foreground mb-2">Resumo Inteligente</p>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <p className="flex items-start gap-1"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> <span><strong>Decisão:</strong> Lançar MVP em 2 semanas</span></p>
                      <p className="flex items-start gap-1"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> <span><strong>Ação:</strong> João revisar wireframes</span></p>
                      <p className="flex items-start gap-1"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> <span><strong>Ação:</strong> Maria preparar roadmap</span></p>
                      <p className="flex items-start gap-1"><CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" /> <span><strong>Próximo:</strong> Review sexta-feira</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-6 border-y border-border bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-center gap-6">
          <p className="text-sm text-muted-foreground font-medium">Profissionais confiam na Ágata</p>
          <div className="flex -space-x-2">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="w-8 h-8 rounded-full bg-emerald-200 border-2 border-background flex items-center justify-center text-[10px] font-bold text-emerald-700">
                {String.fromCharCode(64 + i)}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
            <span className="text-sm font-medium ml-1">5.0 de satisfação</span>
          </div>
          <Badge variant="outline" className="text-xs"><Shield className="h-3 w-3 mr-1" />Garantia de 7 dias</Badge>
        </div>
      </section>

      {/* Metrics */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center p-6 rounded-xl bg-card border border-border"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-primary mb-3">
                {metric.icon}
              </div>
              <p className="text-2xl font-bold text-foreground">{metric.number}</p>
              <p className="text-xs text-muted-foreground">{metric.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="recursos" className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-emerald-100 text-emerald-700 border-0">Recursos</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Tudo que você precisa para reuniões produtivas</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Ferramentas poderosas de IA para transformar suas reuniões em documentação profissional.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow border-border">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-emerald-100 text-primary flex items-center justify-center mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="como-funciona" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-emerald-100 text-emerald-700 border-0">Como Funciona</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Simples como 1, 2, 3</h2>
            <p className="text-muted-foreground">Em poucos minutos, transforme qualquer reunião em documentação profissional.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-primary flex items-center justify-center mx-auto mb-4">
                  {step.icon}
                </div>
                <span className="text-xs font-bold text-primary">{step.number}</span>
                <h3 className="text-lg font-semibold text-foreground mt-1 mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/auth/signup">
              <Button size="lg" className="bg-primary hover:bg-emerald-600 text-primary-foreground">
                Experimentar Grátis Agora <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground mt-2">Leva menos de 30 segundos para criar sua conta</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precos" className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-emerald-100 text-emerald-700 border-0">Preços</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Planos simples e transparentes</h2>
            <p className="text-muted-foreground">Comece grátis. Faça upgrade quando precisar. Economize 20% no plano anual.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`h-full relative ${plan.popular ? 'border-primary shadow-lg ring-2 ring-primary/20' : 'border-border'}`}>
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className={`text-[10px] ${plan.popular ? 'bg-primary text-primary-foreground' : 'bg-emerald-100 text-emerald-700'}`}>
                        {plan.badge}
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-6 pt-8">
                    <h3 className="font-semibold text-foreground">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>
                    <div className="mb-4">
                      {plan.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through mr-2">{plan.originalPrice}</span>
                      )}
                      <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                    </div>
                    {plan.originalPrice && (
                      <p className="text-[10px] text-primary font-medium mb-4">Preço anual — economia de 20%</p>
                    )}
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Link to="/auth/signup">
                      <Button className={`w-full ${plan.popular ? 'bg-primary hover:bg-emerald-600 text-primary-foreground' : ''}`} variant={plan.popular ? 'default' : 'outline'}>
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

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-emerald-100 text-emerald-700 border-0">Depoimentos</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">O que nossos clientes dizem</h2>
            <p className="text-muted-foreground">Profissionais de diversas áreas já transformaram suas reuniões com a Ágata.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-border">
                  <CardContent className="p-6">
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: t.stars }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 italic">"{t.text}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-primary">
                        {t.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role} · {t.company}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-emerald-100 text-emerald-700 border-0">FAQ</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Perguntas Frequentes</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-card rounded-lg border border-border overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-medium text-sm text-foreground">{faq.question}</span>
                  {openFaq === index ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="px-4 pb-4 text-sm text-muted-foreground">{faq.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-primary">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
            Pronto para economizar horas em cada reunião?
          </h2>
          <p className="text-primary-foreground/80 mb-6">
            Junte-se a profissionais que já transformaram sua produtividade com a Ágata.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-primary-foreground/80 mb-6">
            <span>✓ 30 dias grátis</span>
            <span>✓ Sem cartão de crédito</span>
            <span>✓ Garantia de 7 dias</span>
          </div>
          <Link to="/auth/signup">
            <Button size="lg" className="bg-background text-foreground hover:bg-muted text-base px-8">
              Começar Meu Teste Grátis <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <p className="text-xs text-primary-foreground/60 mt-3">Leva menos de 30 segundos</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Ágata Transcription</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/legal/terms" className="hover:text-foreground transition-colors">Termos de Uso</Link>
            <Link to="/legal/lgpd" className="hover:text-foreground transition-colors">Política LGPD</Link>
          </div>
          <p className="text-xs text-muted-foreground">© 2025 Ágata Transcription. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
