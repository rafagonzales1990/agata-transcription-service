import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Send, Sparkles, MessageCircle, FileText, Calendar, Lock } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface Source {
  meetingId: string;
  title: string;
  date: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
}

const SUGGESTED_QUESTIONS = [
  'Quais decisões foram tomadas esta semana?',
  'Quem ficou responsável por qual tarefa?',
  'Quais foram os principais pontos discutidos?',
];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function AskMeetings() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasMeetings, setHasMeetings] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const planId = profile?.plan_id || 'basic';
  const isPaid = ['inteligente', 'automacao', 'enterprise'].includes(planId);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('Meeting')
      .select('id', { count: 'exact', head: true })
      .eq('userId', user.id)
      .eq('status', 'completed')
      .then(({ count }) => setHasMeetings((count || 0) > 0));
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const submitQuestion = async (question: string) => {
    if (!question.trim() || loading || !user) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: question.trim(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ask-meeting', {
        body: { question: question.trim(), userId: user.id },
      });

      if (error) throw error;

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data?.answer || 'Não foi possível gerar uma resposta.',
        sources: Array.isArray(data?.sources) ? data.sources : [],
      };
      setMessages((m) => [...m, assistantMsg]);
    } catch (err: any) {
      console.error('ask-meeting error:', err);
      toast({
        title: 'Erro ao perguntar',
        description: err?.message || 'Não foi possível obter resposta. Tente novamente.',
        variant: 'destructive',
      });
      setMessages((m) => [
        ...m,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          content: 'Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitQuestion(input);
  };

  // Plan gate: free users see upgrade prompt
  if (!isPaid) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto">
          <header className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <MessageCircle className="h-7 w-7 text-emerald-600" />
              Perguntar às Reuniões
            </h1>
            <p className="text-muted-foreground mt-1">
              Faça perguntas sobre suas reuniões transcritas
            </p>
          </header>

          <Card className="p-8 text-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Recurso disponível nos planos pagos
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              A busca semântica com IA está disponível nos planos Essencial, Pro e Enterprise.
              Faça upgrade para perguntar qualquer coisa sobre suas reuniões.
            </p>
            <Button
              onClick={() => navigate('/plans')}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
              size="lg"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Ver planos
            </Button>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-9rem)]">
        <header className="mb-4 flex-shrink-0">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <MessageCircle className="h-7 w-7 text-emerald-600" />
            Perguntar às Reuniões
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Faça perguntas sobre suas reuniões transcritas
          </p>
        </header>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1"
        >
          {messages.length === 0 && !loading && (
            <Card className="p-6 bg-muted/30 border-dashed">
              {hasMeetings === false ? (
                <div className="text-center py-4">
                  <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-foreground font-medium mb-1">
                    Você ainda não tem reuniões transcritas
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Faça sua primeira transcrição para começar a fazer perguntas.
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/upload">Nova Transcrição</Link>
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    Experimente perguntar:
                  </p>
                  <div className="space-y-2">
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => submitQuestion(q)}
                        disabled={loading}
                        className="w-full text-left px-4 py-3 rounded-lg bg-background hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-border hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors text-sm text-foreground"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </Card>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {msg.role === 'user' ? (
                <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-foreground text-background">
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
              ) : (
                <div className="max-w-[90%] w-full">
                  <Card className="p-4 bg-card">
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words leading-relaxed">
                      {msg.content}
                    </p>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2 font-medium">
                          Fontes
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {msg.sources.map((src) => (
                            <Link
                              key={src.meetingId}
                              to={`/meetings/${src.meetingId}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition-colors"
                            >
                              <FileText className="h-3 w-3" />
                              <span className="font-medium truncate max-w-[180px]">
                                {src.title}
                              </span>
                              <span className="text-emerald-600/70 dark:text-emerald-400/70 flex items-center gap-0.5">
                                <Calendar className="h-3 w-3" />
                                {formatDate(src.date)}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <Card className="px-4 py-3 bg-card">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="flex-shrink-0 flex items-center gap-2 pt-3 border-t border-border bg-background"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Faça uma pergunta sobre suas reuniões..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
          />
          <Button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
