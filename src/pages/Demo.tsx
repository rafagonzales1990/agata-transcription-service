import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Mic, FileText, Sparkles, CheckCircle, ArrowRight, Upload, Brain,
  ChevronDown, ChevronUp, Loader2, Play, Briefcase, Scale, Users2,
  Megaphone, Settings2, HelpCircle,
} from 'lucide-react';
import { LogoIcon } from '@/components/LogoIcon';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  demoLandingView, demoLeadCreated, demoStarted,
  demoCompleted, demoSignupClick,
} from '@/lib/gtag';

// ── Persona config ─────────────────────────────────────────
const PERSONA_HEADLINES: Record<string, string> = {
  juridico: 'Gere atas e resumos de reuniões, entrevistas e alinhamentos jurídicos',
  rh: 'Organize entrevistas, feedbacks e reuniões de desenvolvimento',
  marketing: 'Transforme alinhamentos e reuniões de campanha em documentação clara',
  operacoes: 'Documente reuniões operacionais com transcrição e ATA automática',
  consultoria: 'Registre sessões de consultoria com transcrição e resumo inteligente',
};

const PERSONA_OPTIONS = [
  { value: 'juridico', label: 'Jurídico' },
  { value: 'rh', label: 'RH' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'operacoes', label: 'Operações' },
  { value: 'consultoria', label: 'Consultoria' },
  { value: 'outro', label: 'Outro' },
];

const ICP_CHIPS = ['Jurídico', 'RH', 'Marketing', 'Operações', 'Consultorias'];

const BENEFITS = [
  { icon: <Mic className="h-5 w-5" />, text: 'Transcrição em português brasileiro' },
  { icon: <Brain className="h-5 w-5" />, text: 'Resumo executivo com IA' },
  { icon: <FileText className="h-5 w-5" />, text: 'ATA pronta para PDF/Word' },
  { icon: <Users2 className="h-5 w-5" />, text: 'Fluxo rápido para times pequenos e PMEs' },
];

const TESTIMONIALS = [
  'Economizamos horas por semana organizando reuniões internas.',
  'O resumo ficou claro e a ATA saiu muito mais rápido do que no processo manual.',
  'A Ágata ajudou nosso time a registrar decisões sem retrabalho.',
];

const FAQS = [
  { q: 'Funciona com áudio em português?', a: 'Sim, 100% otimizado para português brasileiro com alta precisão.' },
  { q: 'Posso usar para reuniões jurídicas?', a: 'Sim! Profissionais do direito usam para transcrever audiências, reuniões e alinhamentos.' },
  { q: 'Preciso instalar algo?', a: 'Não. Tudo funciona no navegador, sem instalação.' },
  { q: 'Existe teste grátis?', a: 'Sim, 14 dias de teste grátis com 5 transcrições incluídas, sem cartão de crédito.' },
];

// ── Helpers ────────────────────────────────────────────────
function getUtmParams(sp: URLSearchParams) {
  return {
    source: sp.get('utm_source') || sp.get('src') || 'linkedin',
    medium: sp.get('utm_medium') || undefined,
    campaign: sp.get('utm_campaign') || undefined,
    content: sp.get('utm_content') || undefined,
    persona: sp.get('persona') || undefined,
  };
}

export default function DemoPage() {
  const [searchParams] = useSearchParams();
  const utm = getUtmParams(searchParams);

  // Lead form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [persona, setPersona] = useState(utm.persona || '');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);

  // Demo state
  const [demoTab, setDemoTab] = useState('text');
  const [textInput, setTextInput] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [summaryResult, setSummaryResult] = useState<string | null>(null);

  // FAQ
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Refs
  const demoRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const effectivePersona = persona || utm.persona || '';
  const heroSubheadline = PERSONA_HEADLINES[effectivePersona]
    || 'A Ágata converte áudio e texto em documentação útil para times de jurídico, RH, marketing e operações';

  // Fire landing view event once
  useEffect(() => {
    demoLandingView({ source: utm.source, campaign: utm.campaign, medium: utm.medium, persona: utm.persona });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Lead submit ──────────────────────────────────────────
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Informe seu email'); return; }
    setFormLoading(true);

    try {
      const { data, error } = await supabase.from('Lead' as any).insert({
        name: name || null,
        email,
        company: company || null,
        role: role || null,
        persona: persona || utm.persona || null,
        source: utm.source || 'unknown',
        campaign: utm.campaign || null,
        medium: utm.medium || null,
        content: utm.content || null,
        status: 'interested',
        lastStep: 'form_submitted',
      } as any).select('id').single();

      if (error) throw error;
      setLeadId((data as any).id);
      setFormSubmitted(true);
      demoLeadCreated({ source: utm.source, campaign: utm.campaign, persona: persona || utm.persona, leadId: (data as any).id });
      toast.success('Pronto! Agora teste a Ágata abaixo.');

      setTimeout(() => demoRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);
    } catch (err: any) {
      toast.error('Erro ao enviar. Tente novamente.');
      console.error(err);
    }
    setFormLoading(false);
  };

  // ── Demo: text summary ───────────────────────────────────
  const handleTextDemo = async () => {
    if (!textInput.trim() || textInput.length < 50) {
      toast.error('Cole pelo menos 50 caracteres de texto.');
      return;
    }
    setDemoLoading(true);

    // Update lead status
    if (leadId) {
      await supabase.from('Lead' as any).update({ status: 'demo_started', lastStep: 'demo_started' } as any).eq('id', leadId);
    }
    demoStarted({ source: utm.source, campaign: utm.campaign, persona: persona || utm.persona, leadId: leadId || undefined });

    try {
      const { data, error } = await supabase.functions.invoke('demo-summary', {
        body: {
          text: textInput.slice(0, 5000),
          title: `Demo - ${name || 'Lead'}`,
          leadId,
        },
      });

      if (error) throw error;
      setSummaryResult(data.summary);

      if (leadId) {
        await supabase.from('Lead' as any).update({
          status: 'demo_completed',
          lastStep: 'transcription_completed',
          demoCompletedAt: new Date().toISOString(),
          meetingId: data.meetingId || null,
        } as any).eq('id', leadId);
      }

      demoCompleted({ source: utm.source, campaign: utm.campaign, persona: persona || utm.persona, leadId: leadId || undefined, meetingId: data.meetingId });
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);
    } catch (err: any) {
      toast.error('Erro ao gerar resumo. Tente novamente.');
      console.error(err);
    }
    setDemoLoading(false);
  };

  // ── Demo: audio upload ───────────────────────────────────
  const handleAudioDemo = async () => {
    if (!audioFile) { toast.error('Selecione um arquivo de áudio.'); return; }

    // 5min limit: rough check by file size (5min mono ~5MB)
    if (audioFile.size > 10 * 1024 * 1024) {
      toast.error('Para a demo, o áudio deve ter no máximo ~5 minutos (10MB).');
      return;
    }

    setDemoLoading(true);

    if (leadId) {
      await supabase.from('Lead' as any).update({ status: 'demo_started', lastStep: 'demo_started' } as any).eq('id', leadId);
    }
    demoStarted({ source: utm.source, campaign: utm.campaign, persona: persona || utm.persona, leadId: leadId || undefined });

    try {
      // Upload to temp path in meetings bucket
      const filePath = `demo/${Date.now()}-${audioFile.name}`;
      const { error: uploadError } = await supabase.storage.from('meetings').upload(filePath, audioFile);
      if (uploadError) throw uploadError;

      const { data, error } = await supabase.functions.invoke('demo-summary', {
        body: {
          audioPath: filePath,
          title: `Demo - ${name || 'Lead'}`,
          leadId,
          fileName: audioFile.name,
          fileSize: audioFile.size,
        },
      });

      if (error) throw error;
      setSummaryResult(data.summary);

      if (leadId) {
        await supabase.from('Lead' as any).update({
          status: 'demo_completed',
          lastStep: 'transcription_completed',
          demoCompletedAt: new Date().toISOString(),
          meetingId: data.meetingId || null,
        } as any).eq('id', leadId);
      }

      demoCompleted({ source: utm.source, campaign: utm.campaign, persona: persona || utm.persona, leadId: leadId || undefined, meetingId: data.meetingId });
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);
    } catch (err: any) {
      toast.error('Erro ao processar áudio. Tente novamente.');
      console.error(err);
    }
    setDemoLoading(false);
  };

  const signupUrl = `/auth/signup?${new URLSearchParams({
    ...(utm.source ? { utm_source: utm.source } : {}),
    ...(utm.campaign ? { utm_campaign: utm.campaign } : {}),
    ...(utm.medium ? { utm_medium: utm.medium } : {}),
    ...(leadId ? { leadId } : {}),
  }).toString()}`;

  const handleSignupClick = () => {
    if (leadId) {
      supabase.from('Lead' as any).update({ lastStep: 'signup_clicked' } as any).eq('id', leadId);
    }
    demoSignupClick({ source: utm.source, campaign: utm.campaign, persona: persona || utm.persona, leadId: leadId || undefined });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── NAV ──────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <LogoIcon size={28} />
            <span className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Ágata</span>
          </Link>
          <Link to="/auth/login">
            <Button variant="ghost" size="sm">Entrar</Button>
          </Link>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────── */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-secondary text-secondary-foreground">Demo Interativa</Badge>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight mb-4">
            Transforme reuniões em transcrição, resumo e ATA em minutos
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {heroSubheadline}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Button size="lg" className="bg-primary hover:bg-emerald-600 text-primary-foreground gap-2"
            onClick={() => {
              if (formSubmitted) {
                demoRef.current?.scrollIntoView({ behavior: 'smooth' });
              } else {
                document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}>
              <Play className="h-4 w-4" /> Testar com uma reunião
            </Button>
            {summaryResult && (
              <Button size="lg" variant="outline" onClick={() => resultRef.current?.scrollIntoView({ behavior: 'smooth' })}>
                Ver resultado <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>

          {/* ICP chips */}
          <div className="flex flex-wrap justify-center gap-2">
            {ICP_CHIPS.map(chip => (
              <Badge key={chip} variant="outline" className="text-sm px-3 py-1">{chip}</Badge>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ─────────────────────────────── */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {BENEFITS.map((b, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-5 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-secondary text-primary">{b.icon}</div>
                <p className="text-sm font-medium text-foreground">{b.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── STEPS ────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <h2 className="text-2xl font-bold text-foreground mb-2">Como funciona</h2>
          <p className="text-muted-foreground">Em 3 passos simples</p>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { n: '1', t: 'Envie um áudio ou texto', d: 'Cole a transcrição ou envie um arquivo de áudio curto.', icon: <Upload className="h-6 w-6" /> },
            { n: '2', t: 'A Ágata organiza e resume', d: 'Nossa IA gera um resumo executivo estruturado.', icon: <Brain className="h-6 w-6" /> },
            { n: '3', t: 'Receba a ATA e comece seu trial', d: 'Crie sua conta grátis para salvar e exportar.', icon: <FileText className="h-6 w-6" /> },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">{s.icon}</div>
              <h3 className="font-semibold text-foreground mb-1">{s.t}</h3>
              <p className="text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── LEAD FORM ────────────────────────────── */}
      {!formSubmitted && (
        <section id="lead-form" className="py-16 px-4 bg-muted/30">
          <div className="max-w-lg mx-auto">
            <Card>
              <CardContent className="p-6 md:p-8">
                <h2 className="text-xl font-bold text-foreground mb-1 text-center">Teste a Ágata agora</h2>
                <p className="text-sm text-muted-foreground mb-6 text-center">Preencha para liberar a demonstração</p>
                <form onSubmit={handleLeadSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Nome</label>
                    <Input placeholder="Seu nome" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Email *</label>
                    <Input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Empresa</label>
                      <Input placeholder="Nome da empresa" value={company} onChange={e => setCompany(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Cargo</label>
                      <Input placeholder="Seu cargo" value={role} onChange={e => setRole(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Área de atuação</label>
                    <Select value={persona} onValueChange={setPersona}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        {PERSONA_OPTIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-emerald-600 text-primary-foreground" disabled={formLoading}>
                    {formLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</> : 'Gerar meu resumo agora'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* ── DEMO EXPERIENCE ──────────────────────── */}
      {formSubmitted && (
        <section ref={demoRef} className="py-16 px-4 bg-muted/30">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
              <Sparkles className="inline h-5 w-5 text-primary mr-2" />
              Teste a Ágata com seu conteúdo
            </h2>

            <Card>
              <CardContent className="p-6">
                <Tabs value={demoTab} onValueChange={setDemoTab}>
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="text" className="flex-1 gap-2"><FileText className="h-4 w-4" /> Colar texto</TabsTrigger>
                    <TabsTrigger value="audio" className="flex-1 gap-2"><Mic className="h-4 w-4" /> Upload de áudio</TabsTrigger>
                  </TabsList>

                  <TabsContent value="text" className="space-y-4">
                    <Textarea
                      placeholder="Cole aqui a transcrição ou anotações da sua reunião (mínimo 50 caracteres, máximo 5.000)..."
                      value={textInput}
                      onChange={e => setTextInput(e.target.value.slice(0, 5000))}
                      rows={8}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{textInput.length}/5000</span>
                      <Button onClick={handleTextDemo} disabled={demoLoading} className="bg-primary hover:bg-emerald-600 text-primary-foreground">
                        {demoLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando...</> : <><Brain className="h-4 w-4 mr-2" /> Gerar resumo</>}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="audio" className="space-y-4">
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-3">Arraste um áudio ou clique para selecionar (máx. 5 min / 10MB)</p>
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        id="demo-audio"
                        onChange={e => setAudioFile(e.target.files?.[0] || null)}
                      />
                      <label htmlFor="demo-audio">
                        <Button variant="outline" asChild><span>Selecionar arquivo</span></Button>
                      </label>
                      {audioFile && <p className="text-sm text-foreground mt-3 font-medium">{audioFile.name}</p>}
                    </div>
                    <Button onClick={handleAudioDemo} disabled={demoLoading || !audioFile} className="w-full bg-primary hover:bg-emerald-600 text-primary-foreground">
                      {demoLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processando áudio...</> : <><Mic className="h-4 w-4 mr-2" /> Transcrever e resumir</>}
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* ── RESULT ────────────────────────────────── */}
      {summaryResult && (
        <section ref={resultRef} className="py-16 px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="border-primary/20 shadow-lg">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-lg text-foreground">Resumo gerado com sucesso!</h3>
                </div>
                <div className="prose prose-sm max-w-none mb-8 bg-muted/30 p-4 rounded-lg whitespace-pre-wrap text-sm text-foreground">
                  {summaryResult}
                </div>

                {/* CTA box */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 text-center border border-primary/10">
                  <h3 className="text-xl font-bold text-foreground mb-3">Sua reunião já está organizada</h3>
                  <ul className="text-sm text-muted-foreground space-y-2 mb-6 inline-block text-left">
                    {['Salve reuniões', 'Gere resumos completos', 'Exporte ATA em PDF/Word', 'Acompanhe rotinas e histórico'].map(b => (
                      <li key={b} className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> {b}</li>
                    ))}
                  </ul>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link to={signupUrl} onClick={handleSignupClick}>
                      <Button size="lg" className="bg-primary hover:bg-emerald-600 text-primary-foreground gap-2 w-full sm:w-auto">
                        <Sparkles className="h-4 w-4" /> Começar teste grátis
                      </Button>
                    </Link>
                    <Link to="/plans">
                      <Button size="lg" variant="outline" className="w-full sm:w-auto">Ver planos</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* ── SOCIAL PROOF ─────────────────────────── */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-foreground text-center mb-8">O que nossos clientes dizem</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground italic mb-3">"{t}"</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                      {['MC', 'RA', 'FO'][i]}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">{['Mariana C.', 'Ricardo A.', 'Fernanda O.'][i]}</p>
                      <p className="text-xs text-muted-foreground">{['Gestão de Projetos', 'Operações', 'Jurídico'][i]}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-foreground text-center mb-8">Perguntas frequentes</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-border rounded-lg">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="text-sm font-medium text-foreground">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-muted-foreground">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────── */}
      <footer className="py-8 px-4 border-t border-border text-center">
        <p className="text-xs text-muted-foreground">
          © 2026 Ágata Transcription ·{' '}
          <Link to="/legal/terms" className="text-primary hover:underline">Termos</Link> ·{' '}
          <Link to="/legal/lgpd" className="text-primary hover:underline">Privacidade</Link>
        </p>
      </footer>

      {/* ── STICKY CTA (mobile only) ─────────────── */}
      {!summaryResult && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur border-t border-border z-50">
          <Button
            className="w-full bg-primary hover:bg-emerald-600 text-primary-foreground"
            onClick={() => {
              const target = formSubmitted ? demoRef.current : document.getElementById('lead-form');
              target?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <Play className="h-4 w-4 mr-2" /> Testar com uma reunião
          </Button>
        </div>
      )}
    </div>
  );
}
