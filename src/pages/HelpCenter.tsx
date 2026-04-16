import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Upload, CreditCard, Brain, Monitor, ShieldCheck, Mail, HelpCircle, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { LogoIcon } from '@/components/LogoIcon';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/AppLayout';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqSection {
  title: string;
  icon: React.ReactNode;
  items: FaqItem[];
}

const faqSections: FaqSection[] = [
  {
    title: 'Primeiros Passos',
    icon: <Upload className="h-5 w-5" />,
    items: [
      {
        question: 'Como faço minha primeira transcrição?',
        answer: 'Passo a passo: 1) Clique em "Nova Transcrição" no menu lateral, 2) Faça upload do arquivo de áudio/vídeo (MP3, MP4, WAV, M4A), 3) Aguarde o processamento (2-5 minutos), 4) Acesse a transcrição e o resumo gerado automaticamente pela IA.',
      },
      {
        question: 'Quais formatos de arquivo são aceitos?',
        answer: 'Aceitamos MP3, MP4, WAV, M4A, WEBM e OGG. O tamanho máximo é de 500MB por arquivo. Para melhores resultados, recomendamos áudios com boa qualidade e pouco ruído de fundo.',
      },
      {
        question: 'Quanto tempo demora a transcrição?',
        answer: 'Em média 2 a 5 minutos para cada hora de áudio. Arquivos mais curtos são processados em segundos. O tempo pode variar de acordo com a qualidade do áudio e a demanda do servidor.',
      },
    ],
  },
  {
    title: 'Planos e Cobrança',
    icon: <CreditCard className="h-5 w-5" />,
    items: [
      {
        question: 'Qual a diferença entre os planos?',
        answer: 'Gratuito (14 dias de trial, 5 transcrições, até 15min por áudio), Essencial (R$37/mês no anual, 15 transcrições, até 45min), Pro (R$137/mês no anual, 30 transcrições, até 1h, todos os recursos), Enterprise (sob consulta, ilimitado, suporte dedicado).',
      },
      {
        question: 'Posso cancelar quando quiser?',
        answer: 'Sim, sem fidelidade. Acesse Configurações → Plano → Cancelar assinatura. Você mantém acesso até o fim do período pago. Não há multa ou taxa de cancelamento.',
      },
      {
        question: 'Como funciona o trial de 14 dias?',
        answer: 'Você tem acesso completo ao plano Essencial por 14 dias sem precisar de cartão de crédito. Ao final do período, você escolhe um plano pago ou migra automaticamente para o plano gratuito, mantendo todas as suas transcrições anteriores.',
      },
    ],
  },
  {
    title: 'Transcrição e IA',
    icon: <Brain className="h-5 w-5" />,
    items: [
      {
        question: 'O Ágata funciona com reuniões do Teams, Zoom e Google Meet?',
        answer: 'Sim! Use a Extensão Chrome para gravar diretamente do navegador durante reuniões no Google Meet, Zoom ou Teams. Você também pode usar o App Desktop para gravar o áudio do sistema. Depois, faça upload do arquivo para transcrição.',
      },
      {
        question: 'Em quais idiomas o Ágata transcreve?',
        answer: 'Principalmente português brasileiro, com alta precisão (95%+). Também reconhece inglês e espanhol, mas com menor precisão. Estamos constantemente melhorando o suporte a outros idiomas.',
      },
      {
        question: 'O que é o Resumo Inteligente?',
        answer: 'Após a transcrição, nossa IA gera automaticamente: Resumo Executivo (visão geral da reunião), Decisões Tomadas (o que foi acordado), Itens de Ação com responsáveis (quem faz o quê), e Próximos Passos (follow-up necessário).',
      },
    ],
  },
  {
    title: 'App Desktop e Extensão Chrome',
    icon: <Monitor className="h-5 w-5" />,
    items: [
      {
        question: 'Como instalo o App Desktop?',
        answer: 'Baixe o instalador na seção Downloads do menu lateral (Windows 10/11). É um arquivo portátil — sem instalação necessária, basta executar. O app permite gravar áudio do sistema e enviar diretamente para transcrição.',
      },
      {
        question: 'Como funciona a Extensão Chrome?',
        answer: 'Instale pela Chrome Web Store (link na seção Downloads), entre com sua conta Ágata, e grave qualquer reunião diretamente do navegador com um clique. A extensão captura o áudio da aba e envia automaticamente para processamento.',
      },
    ],
  },
  {
    title: 'Privacidade e Segurança',
    icon: <ShieldCheck className="h-5 w-5" />,
    items: [
      {
        question: 'Meus áudios ficam armazenados?',
        answer: 'Os arquivos de áudio são armazenados por 24 horas após o processamento e depois deletados automaticamente dos nossos servidores. A transcrição em texto e o resumo gerado ficam salvos indefinidamente na sua conta, até que você decida excluí-los.',
      },
      {
        question: 'O Ágata é seguro para dados confidenciais?',
        answer: 'Sim. Usamos criptografia em trânsito (HTTPS/TLS) e em repouso. Seguimos a LGPD (Lei Geral de Proteção de Dados). Seus dados nunca são usados para treinar modelos de IA. Oferecemos controle granular de acesso e logs de auditoria para planos Enterprise.',
      },
    ],
  },
];

function HelpCenterContent() {
  const [search, setSearch] = useState('');

  const filteredSections = useMemo(() => {
    if (!search.trim()) return faqSections;
    const term = search.toLowerCase();
    return faqSections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.question.toLowerCase().includes(term) ||
            item.answer.toLowerCase().includes(term)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [search]);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <HelpCircle className="h-4 w-4" />
          Central de Ajuda
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          Central de Ajuda
        </h1>
        <p className="text-muted-foreground text-lg">
          Encontre respostas rápidas sobre o Ágata Transcription
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-10">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar pergunta..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {/* FAQ Sections */}
      {filteredSections.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">Nenhum resultado encontrado para "{search}"</p>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredSections.map((section) => (
            <div key={section.title}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-primary">{section.icon}</span>
                <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
              </div>
              <Accordion type="single" collapsible className="border border-border rounded-lg bg-card">
                {section.items.map((item, idx) => (
                  <AccordionItem key={idx} value={`${section.title}-${idx}`} className="last:border-b-0 border-border">
                    <AccordionTrigger className="px-4 text-left text-foreground hover:no-underline hover:text-primary">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 text-muted-foreground leading-relaxed">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      )}

      {/* Contact CTA */}
      <div className="mt-12 p-8 rounded-2xl bg-card border border-border text-center">
        <Mail className="h-8 w-8 text-primary mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Não encontrou sua resposta?
        </h3>
        <p className="text-muted-foreground mb-4">
          Entre em contato com nosso suporte e responderemos em até 24 horas.
        </p>
        <a href="mailto:suporte@agatatranscription.com">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Mail className="h-4 w-4 mr-2" />
            suporte@agatatranscription.com
          </Button>
        </a>
      </div>
    </div>
  );
}

// Public version with its own header/footer
function PublicHelpCenter() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <LogoIcon size={36} />
              <div className="flex flex-col">
                <span className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent leading-tight">Ágata</span>
                <span className="text-[10px] text-muted-foreground -mt-0.5 tracking-wide">Transcription</span>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/auth/login">
                <Button variant="ghost" size="sm">Entrar</Button>
              </Link>
              <Link to="/auth/signup">
                <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
                  Teste Grátis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <HelpCenterContent />
      </main>

      <footer className="py-8 bg-gray-900 text-gray-400">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <LogoIcon size={32} />
              <span className="font-bold text-white text-lg">Ágata <span className="font-normal text-gray-400">Transcription</span></span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
              <Link to="/ajuda" className="hover:text-white transition-colors">Ajuda</Link>
              <Link to="/legal/terms" className="hover:text-white transition-colors">Termos</Link>
              <Link to="/legal/lgpd" className="hover:text-white transition-colors">Privacidade</Link>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-6 pt-6 text-center text-sm">
            <p>© 2026 Ágata Transcription. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Logged-in version wrapped in AppLayout
function LoggedInHelpCenter() {
  return (
    <AppLayout>
      <HelpCenterContent />
    </AppLayout>
  );
}

export default function HelpCenter() {
  const { session } = useAuth();
  return session ? <LoggedInHelpCenter /> : <PublicHelpCenter />;
}
