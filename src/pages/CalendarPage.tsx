import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Video, ExternalLink } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type RecordedMeeting = {
  id: string;
  title: string;
  createdAt: string;
  meetingDate: string | null;
};

type AgendaEvent = {
  id: string;
  title: string;
  startISO: string;
  endISO?: string;
  htmlLink?: string;
  attendees?: string[];
  provider: 'google' | 'microsoft';
};

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59); }
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function fetchAgendaForRange(start: Date, end: Date): Promise<{ events: AgendaEvent[]; hasIntegration: boolean }> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return { events: [], hasIntegration: false };

  const { data: integrations } = await (supabase as any)
    .from('CalendarIntegration')
    .select('provider, accessToken, expiresAt')
    .eq('userId', user.id);

  if (!integrations || integrations.length === 0) {
    return { events: [], hasIntegration: false };
  }

  const now = new Date();
  const out: AgendaEvent[] = [];

  for (const integ of integrations) {
    const expired = integ.expiresAt && new Date(integ.expiresAt) < now;
    if (expired) continue;

    if (integ.provider === 'google') {
      const params = new URLSearchParams({
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '250',
      });
      try {
        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
          { headers: { Authorization: `Bearer ${integ.accessToken}` } }
        );
        if (res.ok) {
          const json = await res.json();
          for (const e of json.items || []) {
            const startISO = e.start?.dateTime || e.start?.date;
            if (!startISO) continue;
            out.push({
              id: e.id,
              title: e.summary || '(Sem título)',
              startISO,
              endISO: e.end?.dateTime || e.end?.date,
              htmlLink: e.htmlLink,
              attendees: (e.attendees || []).map((a: any) => a.displayName || a.email).filter(Boolean),
              provider: 'google',
            });
          }
        }
      } catch { /* ignore */ }
    }

    if (integ.provider === 'microsoft') {
      const params = new URLSearchParams({
        startDateTime: start.toISOString(),
        endDateTime: end.toISOString(),
        '$top': '250',
        '$orderby': 'start/dateTime',
      });
      try {
        const res = await fetch(
          `https://graph.microsoft.com/v1.0/me/calendarView?${params}`,
          { headers: { Authorization: `Bearer ${integ.accessToken}` } }
        );
        if (res.ok) {
          const json = await res.json();
          for (const e of json.value || []) {
            const startISO = e.start?.dateTime;
            if (!startISO) continue;
            out.push({
              id: e.id,
              title: e.subject || '(Sem título)',
              startISO,
              endISO: e.end?.dateTime,
              htmlLink: e.webLink,
              attendees: (e.attendees || []).map((a: any) => a.emailAddress?.name || a.emailAddress?.address).filter(Boolean),
              provider: 'microsoft',
            });
          }
        }
      } catch { /* ignore */ }
    }
  }

  return { events: out, hasIntegration: true };
}

export default function CalendarPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [meetings, setMeetings] = useState<RecordedMeeting[]>([]);
  const [agenda, setAgenda] = useState<AgendaEvent[]>([]);
  const [hasIntegration, setHasIntegration] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);

  // Build 6-week grid covering month
  const gridDays = useMemo(() => {
    const first = new Date(monthStart);
    first.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(first);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [monthStart]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data: meetingData } = await supabase
        .from('Meeting')
        .select('id, title, createdAt, meetingDate')
        .eq('userId', user.id)
        .order('meetingDate', { ascending: false });

      const agendaResult = await fetchAgendaForRange(monthStart, monthEnd);

      if (cancelled) return;
      setMeetings((meetingData as any) || []);
      setAgenda(agendaResult.events);
      setHasIntegration(agendaResult.hasIntegration);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user, cursor.getTime()]);

  // Group by date
  const byDay = useMemo(() => {
    const map = new Map<string, { recorded: RecordedMeeting[]; agenda: AgendaEvent[] }>();
    for (const m of meetings) {
      const dStr = m.meetingDate || m.createdAt;
      if (!dStr) continue;
      const d = new Date(dStr);
      const k = dateKey(d);
      if (!map.has(k)) map.set(k, { recorded: [], agenda: [] });
      map.get(k)!.recorded.push(m);
    }
    for (const e of agenda) {
      const d = new Date(e.startISO);
      const k = dateKey(d);
      if (!map.has(k)) map.set(k, { recorded: [], agenda: [] });
      map.get(k)!.agenda.push(e);
    }
    return map;
  }, [meetings, agenda]);

  // Match agenda events to recorded (same day + within 60min start window)
  function isMatched(ev: AgendaEvent, recorded: RecordedMeeting[]): boolean {
    const evStart = new Date(ev.startISO).getTime();
    return recorded.some(r => {
      const rd = new Date(r.meetingDate || r.createdAt).getTime();
      return Math.abs(rd - evStart) < 60 * 60 * 1000;
    });
  }

  const today = new Date();
  const selectedKey = selectedDay ? dateKey(selectedDay) : null;
  const selectedData = selectedKey ? byDay.get(selectedKey) : null;

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 text-primary" />
              Calendário
            </h1>
            <p className="text-sm text-muted-foreground">Suas reuniões gravadas e agendadas em um só lugar</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[180px] text-center font-medium text-foreground">
              {MONTH_NAMES[cursor.getMonth()]} {cursor.getFullYear()}
            </div>
            <Button variant="outline" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="secondary" onClick={() => { setCursor(startOfMonth(new Date())); setSelectedDay(new Date()); }}>
              Hoje
            </Button>
          </div>
        </div>

        {!hasIntegration && (
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground flex items-center justify-between gap-3">
            <span>Conecte seu Google ou Outlook Calendar para ver todas suas reuniões agendadas.</span>
            <Link to="/settings" className="text-primary hover:underline inline-flex items-center gap-1 shrink-0">
              Conectar <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_320px] gap-4">
          <Card className="overflow-hidden">
            <div className="grid grid-cols-7 border-b border-border bg-muted/40">
              {WEEK_DAYS.map(d => (
                <div key={d} className="px-2 py-2 text-xs font-medium text-muted-foreground text-center">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 grid-rows-6">
              {gridDays.map((day, i) => {
                const inMonth = day.getMonth() === cursor.getMonth();
                const isToday = sameDay(day, today);
                const isSelected = selectedDay && sameDay(day, selectedDay);
                const k = dateKey(day);
                const data = byDay.get(k);
                const recorded = data?.recorded || [];
                const agendaItems = (data?.agenda || []).filter(e => !isMatched(e, recorded));
                const items = [
                  ...recorded.map(r => ({ kind: 'recorded' as const, id: r.id, title: r.title, hasMatch: (data?.agenda || []).some(e => isMatched(e, [r])) })),
                  ...agendaItems.map(a => ({ kind: 'agenda' as const, id: a.id, title: a.title })),
                ];
                const visible = items.slice(0, 3);
                const extra = items.length - visible.length;

                return (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      "min-h-[110px] border-b border-r border-border p-1.5 text-left transition-colors hover:bg-muted/40 flex flex-col gap-1",
                      !inMonth && "bg-muted/20 text-muted-foreground/50",
                      isSelected && "ring-2 ring-primary ring-inset"
                    )}
                  >
                    <div className={cn(
                      "text-xs font-medium",
                      isToday && "inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground"
                    )}>
                      {day.getDate()}
                    </div>
                    <div className="flex flex-col gap-1 overflow-hidden">
                      {visible.map(it => it.kind === 'recorded' ? (
                        <div
                          key={`r-${it.id}`}
                          onClick={(e) => { e.stopPropagation(); navigate(`/meetings/${it.id}`); }}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 truncate"
                          title={it.title}
                        >
                          <span className="text-emerald-500">●</span>
                          <span className="truncate">{it.title}</span>
                          {it.hasMatch && <Badge variant="secondary" className="ml-auto text-[9px] px-1 py-0">Gravada</Badge>}
                        </div>
                      ) : (
                        <div
                          key={`a-${it.id}`}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] bg-muted text-muted-foreground truncate"
                          title={it.title}
                        >
                          <span>○</span>
                          <span className="truncate">{it.title}</span>
                        </div>
                      ))}
                      {extra > 0 && (
                        <div className="text-[10px] text-muted-foreground px-1">+{extra} mais</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="p-4 h-fit">
            {selectedDay ? (
              <>
                <div className="mb-3">
                  <div className="text-sm text-muted-foreground">
                    {WEEK_DAYS[selectedDay.getDay()]}, {selectedDay.getDate()} de {MONTH_NAMES[selectedDay.getMonth()]}
                  </div>
                </div>
                {(() => {
                  const recorded = selectedData?.recorded || [];
                  const agendaItems = (selectedData?.agenda || []);
                  if (recorded.length === 0 && agendaItems.length === 0) {
                    return <p className="text-sm text-muted-foreground">Sem eventos neste dia.</p>;
                  }
                  return (
                    <div className="space-y-3">
                      {recorded.map(r => {
                        const d = new Date(r.meetingDate || r.createdAt);
                        return (
                          <div key={r.id} className="rounded-md border border-border p-3">
                            <div className="flex items-start gap-2">
                              <span className="text-emerald-500 mt-0.5">●</span>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm text-foreground truncate">{r.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  {d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="mt-2 h-7"
                                  onClick={() => navigate(`/meetings/${r.id}`)}
                                >
                                  <Video className="h-3 w-3 mr-1" /> Ver transcrição
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {agendaItems.filter(e => !isMatched(e, recorded)).map(e => {
                        const d = new Date(e.startISO);
                        return (
                          <div key={e.id} className="rounded-md border border-border p-3">
                            <div className="flex items-start gap-2">
                              <span className="text-muted-foreground mt-0.5">○</span>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm text-foreground truncate">{e.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  {d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  {e.endISO && ` – ${new Date(e.endISO).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                                </div>
                                {e.attendees && e.attendees.length > 0 && (
                                  <div className="text-xs text-muted-foreground mt-1 truncate">
                                    {e.attendees.slice(0, 3).join(', ')}{e.attendees.length > 3 && ` +${e.attendees.length - 3}`}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </>
            ) : (
              <div className="text-center py-6">
                <CalendarIcon className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">Selecione um dia para ver os detalhes</p>
              </div>
            )}
          </Card>
        </div>

        {!loading && meetings.length === 0 && agenda.length === 0 && (
          <div className="text-center py-10">
            <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Nenhuma reunião neste mês</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
