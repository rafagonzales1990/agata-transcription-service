import { useState, lazy, Suspense, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

import {
  ChevronDown, ChevronUp, Star, CheckCircle,
  BadgeCheck, Timer, TrendingUp, Lock, Shield, Globe,
} from 'lucide-react';

import { LandingHeader } from '@/components/landing/LandingHeader';
import { HeroSection } from '@/components/landing/HeroSection';

const lazyRetry = (componentImport: () => Promise<any>) =>
  new Promise<any>((resolve, reject) => {
    const hasRefreshed = JSON.parse(
      sessionStorage.getItem('retry-lazy-refreshed') || 'false'
    );
    componentImport().then(resolve).catch((error) => {
      if (!hasRefreshed) {
        sessionStorage.setItem('retry-lazy-refreshed', 'true');
        window.location.reload();
      } else {
        sessionStorage.removeItem('retry-lazy-refreshed');
        reject(error);
      }
    });
  });

const FeaturesSection = lazy(() => lazyRetry(() => import('@/components/landing/FeaturesSection').then(m => ({ default: m.FeaturesSection }))));
const DifferentiationSection = lazy(() => lazyRetry(() => import('@/components/landing/DifferentiationSection').then(m => ({ default: m.DifferentiationSection }))));
const ComparisonSection = lazy(() => lazyRetry(() => import('@/components/landing/ComparisonSection').then(m => ({ default: m.ComparisonSection }))));
const ChromeExtensionSection = lazy(() => lazyRetry(() => import('@/components/landing/ChromeExtensionSection').then(m => ({ default: m.ChromeExtensionSection }))));
const DesktopAppSection = lazy(() => lazyRetry(() => import('@/components/landing/DesktopAppSection').then(m => ({ default: m.DesktopAppSection }))));
const PlansSection = lazy(() => lazyRetry(() => import('@/components/landing/PlansSection').then(m => ({ default: m.PlansSection }))));
const UseCasesSection = lazy(() => lazyRetry(() => import('@/components/landing/UseCasesSection').then(m => ({ default: m.UseCasesSection }))));
const FinalCTASection = lazy(() => lazyRetry(() => import('@/components/landing/FinalCTASection').then(m => ({ default: m.FinalCTASection }))));
const LandingFooter = lazy(() => lazyRetry(() => import('@/components/landing/LandingFooter').then(m => ({ default: m.LandingFooter }))));

const metrics = [
  { number: '95%+', label: 'Precisão em PT-BR, EN e ES', icon: <BadgeCheck className="h-5 w-5" /> },
  { number: '2min', label: 'Tempo médio p/ 1h de áudio', icon: <Timer className="h-5 w-5" /> },
  { number: '10h', label: 'Economizadas por semana', icon: <TrendingUp className="h-5 w-5" /> },
  { number: '24h', label: 'Exclusão automática de dados', icon: <Lock className="h-5 w-5" /> },
];

const testimonials = [
  { name: 'Mariana Costa', role: 'Gerente de Projetos', company: 'Tech Solutions', text: 'A Ágata transformou nosso processo de documentação. Antes gastávamos 2h por reunião fazendo atas, agora leva 5 minutos.', stars: 5 },
  { name: 'Ricardo Almeida', role: 'Diretor de Operações', company: 'Consultoria Nova Era', text: 'Testei várias ferramentas de transcrição e nenhuma chegava perto em português. A Ágata acerta até gírias e termos técnicos.', stars: 5 },
  { name: 'Fernanda Oliveira', role: 'Advogada', company: 'Oliveira & Associados', text: 'Uso para transcrever audiências e reuniões com clientes. A geração de Ata em PDF é profissional e me poupa horas toda semana.', stars: 5 },
];

const faqs = [
  { question: 'Quais formatos de áudio são suportados?', answer: 'Suportamos MP3, WAV, M4A, AAC, CAF, OGG, WebM e MP4. Isso inclui gravações de Samsung, iPhone e a maioria dos dispositivos.' },
  { question: 'Quanto tempo leva para transcrever?', answer: 'A transcrição é feita em tempo real. Um áudio de 30 minutos geralmente é processado em 1-2 minutos.' },
  { question: 'Meus dados estão seguros?', answer: 'Sim! Somos LGPD compliant. Arquivos são excluídos automaticamente após 24 horas e usamos criptografia em todo o processo.' },
  { question: 'Posso cancelar a qualquer momento?', answer: 'Sim, sem fidelidade ou multas. Cancele sua assinatura a qualquer momento.' },
  { question: 'A transcrição funciona bem em português?', answer: 'Sim! Nossa IA é otimizada para português brasileiro com excelente precisão, mesmo com sotaques regionais.' },
  { question: 'Preciso de cartão de crédito para testar?', answer: 'Não! O teste grátis não exige cartão de crédito. Crie sua conta e comece a transcrever imediatamente.' },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    sessionStorage.removeItem('retry-lazy-refreshed');
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      <HeroSection />

      {/* Social Proof Bar */}
      <section className="py-5 border-y border-border bg-muted/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-6 flex-wrap text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-primary" /> Jurídico</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-primary" /> RH</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-primary" /> Marketing</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-primary" /> Engenharia</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-primary" /> Financeiro</span>
            <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-primary" /> LGPD Compliant</span>
            <span className="flex items-center gap-1.5"><Globe className="h-4 w-4 text-primary" /> PT-BR · EN · ES</span>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="text-center p-6 rounded-xl bg-card border border-border"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-secondary text-primary mb-3">
                {metric.icon}
              </div>
              <p className="text-2xl font-bold text-foreground">{metric.number}</p>
              <p className="text-xs text-muted-foreground">{metric.label}</p>
            </div>
          ))}
        </div>
      </section>

      <Suspense fallback={null}>
        <FeaturesSection />
        <ChromeExtensionSection />
        <DesktopAppSection />
        <DifferentiationSection />
        <ComparisonSection />
        <PlansSection />
        <UseCasesSection />
      </Suspense>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-primary mb-2 tracking-wide uppercase">Depoimentos</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">O que nossos clientes dizem</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, index) => (
              <Card key={index} className="h-full border-border">
                <CardContent className="p-6">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 italic">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-primary">
                      {t.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role} · {t.company}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-primary mb-2 tracking-wide uppercase">FAQ</p>
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
                {openFaq === index && (
                  <div className="overflow-hidden">
                    <p className="px-4 pb-4 text-sm text-muted-foreground">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <FinalCTASection />
        <LandingFooter />
      </Suspense>
      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 left-0 w-full z-50 md:hidden">
        <Link
          to="/auth/signup"
          className="block w-full bg-primary text-primary-foreground text-center text-sm font-semibold py-3 px-4"
        >
          Começar Grátis — 14 dias sem custo
        </Link>
      </div>
    </div>
  );
}
