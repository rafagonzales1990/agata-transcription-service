import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Send,
  Sparkles,
  MessageCircle,
  FileText,
  Calendar,
  Lock,
  Loader2,
  CheckCircle2,
  Globe,
  Repeat,
  X,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LogoIcon } from '@/components/LogoIcon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

interface MeetingOption {
  id: string;
  title: string;
}

interface RoutineOption {
  id: string;
  name: string;
}

type ScopeType = 'all' | 'meeting' | 'routine';

interface Scope {
  type: ScopeType;
  id?: string;
  label?: string;
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasMeetings, setHasMeetings] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scope selector
  const [scope, setScope] = useState<Scope>({ type: 'all' });
  const [meetings, setMeetings] = useState<MeetingOption[]>([]);
  const [routines, setRoutines] = useState<RoutineOption[]>([]);
  const [scopeMode, setScopeMode] = useState<'root' | 'meetings' | 'routines'>('root');
  const [scopeOpen, setScopeOpen] = useState(false);

  // Embeddings backfill state
  const [backfill, setBackfill] = useState<{
    status: 'idle' | 'running' | 'done';
    total: number;
    current: number;
  }>({ status: 'idle', total: 0, current: 0 });
  const backfillStartedRef = useRef(false);

  const planId = profile?.plan_id || 'basic';
  const isPaid = ['inteligente', 'automacao', 'enterprise'].includes(planId);
  const hasMessages = messages.length > 0;

  // Load meetings + routines for the scope picker
  useEffect(() => {
    if (!user || !isPaid) return;
    (async () => {
      const [{ data: ms, count }, { data: rs }] = await Promise.all([
        supabase
          .from('Meeting')
          .select('id, title', { count: 'exact' })
          .eq('userId', user.id)
          .eq('status', 'completed')
          .order('createdAt', { ascending: false })
          .limit(50),
        supabase
          .from('Routine')
          .select('id, name')
          .eq('userId', user.id)
          .order('createdAt', { ascending: false }),
      ]);
      setMeetings((ms || []) as MeetingOption[]);
      setRoutines((rs || []) as RoutineOption[]);
      setHasMeetings((count || 0) > 0);
    })();
  }, [user, isPaid]);

  // Pre-select scope from ?meetingId= or ?routineId=
  useEffect(() => {
    const mid = searchParams.get('meetingId');
    const rid = searchParams.get('routineId');
    if (mid && meetings.length > 0) {
      const m = meetings.find((x) => x.id === mid);
      if (m) setScope({ type: 'meeting', id: m.id, label: m.title });
    } else if (rid && routines.length > 0) {
      const r = routines.find((x) => x.id === rid);
      if (r) setScope({ type: 'routine', id: r.id, label: r.name });
    }
  }, [searchParams, meetings, routines]);

  // Auto-backfill embeddings on mount for completed meetings missing them
  useEffect(() => {
    if (!user || !isPaid || backfillStartedRef.current) return;
    backfillStartedRef.current = true;

    let cancelled = false;

    (async () => {
      try {
        const { data: meetingsList, error: mErr } = await supabase
          .from('Meeting')
          .select('id')
          .eq('userId', user.id)
          .eq('status', 'completed')
          .not('transcription', 'is', null);
        if (mErr || !meetingsList || meetingsList.length === 0) return;

        const { data: embedded, error: eErr } = await supabase
          .from('MeetingEmbedding')
          .select('meetingId')
          .eq('userId', user.id);
        if (eErr) return;

        const embeddedIds = new Set((embedded || []).map((r: { meetingId: string }) => r.meetingId));
        const missing = meetingsList.filter((m: { id: string }) => !embeddedIds.has(m.id));
        if (missing.length === 0 || cancelled) return;

        setBackfill({ status: 'running', total: missing.length, current: 0 });

        for (let i = 0; i < missing.length; i++) {
          if (cancelled) return;
          try {
            await supabase.functions.invoke('generate-embeddings', {
              body: { meetingId: missing[i].id, userId: user.id },
            });
          } catch (e) {
            console.error('backfill error', missing[i].id, e);
          }
          if (cancelled) return;
          setBackfill((b) => ({ ...b, current: i + 1 }));
        }

        if (cancelled) return;
        setBackfill({ status: 'done', total: missing.length, current: missing.length });
        setTimeout(() => {
          if (!cancelled) setBackfill({ status: 'idle', total: 0, current: 0 });
        }, 3000);
      } catch (e) {
        console.error('backfill fatal', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, isPaid]);

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
      const payload: Record<string, unknown> = {
        question: question.trim(),
        userId: user.id,
      };
      if (scope.type === 'meeting' && scope.id) payload.meetingId = scope.id;
      if (scope.type === 'routine' && scope.id) payload.routineId = scope.id;

      const { data, error } = await supabase.functions.invoke('ask-meeting', { body: payload });
      if (error) throw error;

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data?.answer || 'Não foi possível gerar uma resposta.',
        sources: Array.isArray(data?.sources) ? data.sources : [],
      };
      setMessages((m) => [...m, assistantMsg]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('ask-meeting error:', err);
      toast({
        title: 'Erro ao perguntar',
        description: msg,
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

  const resetConversation = () => {
    setMessages([]);
    setInput('');
  };

  const clearScope = () => {
    setScope({ type: 'all' });
    if (searchParams.get('meetingId') || searchParams.get('routineId')) {
      const next = new URLSearchParams(searchParams);
      next.delete('meetingId');
      next.delete('routineId');
      setSearchParams(next, { replace: true });
    }
  };

  const ScopeIcon = useMemo(() => {
    if (scope.type === 'meeting') return FileText;
    if (scope.type === 'routine') return Repeat;
    return Globe;
  }, [scope.type]);

  // Plan gate: free users see upgrade prompt
  if (!isPaid) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto">
          <Card className="p-8 text-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800 mt-8">
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

  // ── Scope dropdown content (shared empty/chat) ──
  const ScopeDropdown = (
    <DropdownMenu
      open={scopeOpen}
      onOpenChange={(o) => {
        setScopeOpen(o);
        if (!o) setScopeMode('root');
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 rounded-full text-xs gap-1.5 border-border bg-background"
        >
          <ScopeIcon className="h-3.5 w-3.5 text-emerald-600" />
          <span className="max-w-[180px] truncate">
            {scope.type === 'all' ? 'Todas as reuniões' : scope.label}
          </span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 max-h-[60vh] overflow-y-auto">
        {scopeMode === 'root' && (
          <>
            <DropdownMenuLabel className="text-xs">Buscar em</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                clearScope();
                setScopeOpen(false);
              }}
            >
              <Globe className="h-4 w-4 mr-2 text-emerald-600" />
              Todas as reuniões
              {scope.type === 'all' && <CheckCircle2 className="h-3.5 w-3.5 ml-auto text-emerald-600" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setScopeMode('meetings');
              }}
            >
              <FileText className="h-4 w-4 mr-2 text-emerald-600" />
              Reunião específica
              <ChevronDown className="h-3 w-3 ml-auto -rotate-90 opacity-60" />
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setScopeMode('routines');
              }}
            >
              <Repeat className="h-4 w-4 mr-2 text-emerald-600" />
              Rotina específica
              <ChevronDown className="h-3 w-3 ml-auto -rotate-90 opacity-60" />
            </DropdownMenuItem>
          </>
        )}

        {scopeMode === 'meetings' && (
          <>
            <DropdownMenuLabel className="flex items-center justify-between text-xs">
              <span>Reuniões</span>
              <button
                onClick={() => setScopeMode('root')}
                className="text-emerald-600 hover:underline text-[11px]"
              >
                ← voltar
              </button>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {meetings.length === 0 ? (
              <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                Nenhuma reunião encontrada.
              </div>
            ) : (
              meetings.map((m) => (
                <DropdownMenuItem
                  key={m.id}
                  onClick={() => {
                    setScope({ type: 'meeting', id: m.id, label: m.title });
                    setScopeOpen(false);
                  }}
                >
                  <FileText className="h-3.5 w-3.5 mr-2 text-emerald-600 shrink-0" />
                  <span className="truncate">{m.title}</span>
                </DropdownMenuItem>
              ))
            )}
          </>
        )}

        {scopeMode === 'routines' && (
          <>
            <DropdownMenuLabel className="flex items-center justify-between text-xs">
              <span>Rotinas</span>
              <button
                onClick={() => setScopeMode('root')}
                className="text-emerald-600 hover:underline text-[11px]"
              >
                ← voltar
              </button>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {routines.length === 0 ? (
              <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                Nenhuma rotina encontrada.
              </div>
            ) : (
              routines.map((r) => (
                <DropdownMenuItem
                  key={r.id}
                  onClick={() => {
                    setScope({ type: 'routine', id: r.id, label: r.name });
                    setScopeOpen(false);
                  }}
                >
                  <Repeat className="h-3.5 w-3.5 mr-2 text-emerald-600 shrink-0" />
                  <span className="truncate">{r.name}</span>
                </DropdownMenuItem>
              ))
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const ScopeChip = scope.type !== 'all' && (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
      <ScopeIcon className="h-3 w-3" />
      <span className="font-medium truncate max-w-[200px]">{scope.label}</span>
      <button
        type="button"
        onClick={clearScope}
        className="hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-full p-0.5"
        aria-label="Remover filtro"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );

  // ── Backfill banner (shared) ──
  const BackfillBanner = backfill.status !== 'idle' && (
    <div
      className={cn(
        'mb-3 px-3 py-2 rounded-lg border text-xs flex items-center gap-2',
        backfill.status === 'running'
          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
          : 'bg-emerald-100 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
      )}
      role="status"
      aria-live="polite"
    >
      {backfill.status === 'running' ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
          <span>
            Indexando {backfill.total} {backfill.total === 1 ? 'reunião' : 'reuniões'}
            {backfill.current > 0 && ` (${backfill.current}/${backfill.total})`}... (não feche esta página)
          </span>
        </>
      ) : (
        <>
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          <span>
            {backfill.total} {backfill.total === 1 ? 'reunião indexada' : 'reuniões indexadas'} com sucesso!
          </span>
        </>
      )}
    </div>
  );

  // ── EMPTY STATE: centered, Claude-style ──
  if (!hasMessages) {
    return (
      <AppLayout>
        <div className="flex flex-col h-[calc(100vh-9rem)] max-w-3xl mx-auto w-full">
          {BackfillBanner}

          <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
            <LogoIcon size={56} />
            <h1 className="mt-6 text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Perguntar às Reuniões
            </h1>
            <p className="mt-2 text-muted-foreground">
              Faça perguntas sobre suas reuniões transcritas
            </p>

            {hasMeetings === false ? (
              <div className="mt-8 max-w-sm">
                <p className="text-sm text-muted-foreground mb-4">
                  Você ainda não tem reuniões transcritas. Faça sua primeira para começar.
                </p>
                <Button asChild variant="outline">
                  <Link to="/upload">Nova Transcrição</Link>
                </Button>
              </div>
            ) : (
              <div className="mt-8 w-full max-w-xl space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3 flex items-center justify-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-emerald-600" />
                  Experimente perguntar
                </p>
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => submitQuestion(q)}
                    disabled={loading}
                    className="w-full text-left px-4 py-3 rounded-xl bg-card hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-border hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors text-sm text-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Centered input at bottom */}
          <div className="px-4 pb-4">
            <div className="mb-2 flex items-center gap-2 flex-wrap">
              {ScopeDropdown}
              {ScopeChip}
            </div>
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 p-2 rounded-2xl border border-border bg-card shadow-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Faça uma pergunta sobre suas reuniões..."
                disabled={loading}
                className="flex-1 px-3 py-2 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!input.trim() || loading}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl h-9 w-9 p-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── CHAT STATE ──
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto w-full flex flex-col h-[calc(100vh-9rem)]">
        <header className="flex-shrink-0 flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-emerald-600" />
            Perguntar às Reuniões
          </h1>
          <Button variant="ghost" size="sm" onClick={resetConversation} className="text-xs gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Nova conversa
          </Button>
        </header>

        {BackfillBanner}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.role === 'user' ? (
                <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-emerald-600 text-white">
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
                              <span className="font-medium truncate max-w-[180px]">{src.title}</span>
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

        {/* Scope + Input fixed at bottom */}
        <div className="flex-shrink-0 pt-3 border-t border-border bg-background">
          <div className="mb-2 flex items-center gap-2 flex-wrap">
            {ScopeDropdown}
            {ScopeChip}
          </div>
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 p-2 rounded-2xl border border-border bg-card shadow-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Faça uma pergunta sobre suas reuniões..."
              disabled={loading}
              className="flex-1 px-3 py-2 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || loading}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl h-9 w-9 p-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
