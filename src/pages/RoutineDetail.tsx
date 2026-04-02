import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChevronLeft, Plus, Loader2, FileText, CheckCircle, Clock, AlertCircle,
  X, Search, Sparkles, Download, RefreshCw, Hourglass,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface RoutineData {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
  consolidatedSummary: string | null;
}

interface MeetingRow {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  meetingDate: string | null;
  fileDuration: number | null;
  summary: string | null;
  transcription: string | null;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle }> = {
  completed: { label: 'Concluída', variant: 'default', icon: CheckCircle },
  processing: { label: 'Processando', variant: 'secondary', icon: Clock },
  pending: { label: 'Pendente', variant: 'outline', icon: Clock },
  failed: { label: 'Falhou', variant: 'destructive', icon: AlertCircle },
};

function convertMarkdownToHtml(md: string): string {
  return md
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^\- (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n{2,}/g, '<br/><br/>')
    .replace(/\|(.+)\|/g, (match) => {
      const cells = match.split('|').filter(Boolean).map(c => c.trim());
      return '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
    });
}

export default function RoutineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [routine, setRoutine] = useState<RoutineData | null>(null);
  const [routineMeetings, setRoutineMeetings] = useState<MeetingRow[]>([]);
  const [availableMeetings, setAvailableMeetings] = useState<MeetingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [consolidationType, setConsolidationType] = useState<'executivo' | 'progresso'>('executivo');
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('meetings');
  const [searchAvailable, setSearchAvailable] = useState('');

  const fetchData = useCallback(async () => {
    if (!user || !id) return;
    const userId = user.id;

    const [routineRes, meetingsRes, availableRes] = await Promise.all([
      supabase.from('Routine').select('*').eq('id', id).maybeSingle(),
      supabase.from('Meeting').select('id, title, status, createdAt, meetingDate, fileDuration, summary, transcription')
        .eq('routineId', id).eq('userId', userId).order('meetingDate', { ascending: false }),
      supabase.from('Meeting').select('id, title, status, createdAt, meetingDate, fileDuration, summary, transcription')
        .eq('userId', userId).is('routineId', null).eq('status', 'completed').order('createdAt', { ascending: false }).limit(20),
    ]);

    if (routineRes.data) setRoutine(routineRes.data as unknown as RoutineData);
    if (meetingsRes.data) setRoutineMeetings(meetingsRes.data as MeetingRow[]);
    if (availableRes.data) setAvailableMeetings(availableRes.data as MeetingRow[]);
    setLoading(false);
  }, [user, id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleSelect = (meetingId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(meetingId) ? next.delete(meetingId) : next.add(meetingId);
      return next;
    });
  };

  const selectAll = () => {
    const completed = routineMeetings.filter(m => m.status === 'completed');
    if (selectedIds.size === completed.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(completed.map(m => m.id)));
    }
  };

  const addMeeting = async (meetingId: string) => {
    const { error } = await supabase.from('Meeting').update({ routineId: id }).eq('id', meetingId);
    if (error) { toast.error('Erro ao adicionar reunião'); return; }
    toast.success('Reunião adicionada à rotina');
    fetchData();
  };

  const removeMeeting = async (meetingId: string) => {
    const { error } = await supabase.from('Meeting').update({ routineId: null }).eq('id', meetingId);
    if (error) { toast.error('Erro ao remover reunião'); return; }
    toast.success('Reunião removida da rotina');
    selectedIds.delete(meetingId);
    setSelectedIds(new Set(selectedIds));
    fetchData();
  };

  const handleConsolidate = async () => {
    if (!routine) return;
    const meetingIds = selectedIds.size > 0
      ? Array.from(selectedIds)
      : routineMeetings.filter(m => m.status === 'completed').map(m => m.id);

    if (meetingIds.length === 0) {
      toast.error('Nenhuma reunião concluída para consolidar');
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('consolidate-routine', {
        body: { routineId: routine.id, meetingIds, type: consolidationType },
      });
      if (error) throw error;
      if (data?.summary) {
        setRoutine(prev => prev ? { ...prev, consolidatedSummary: data.summary } : prev);
        setActiveTab('summary');
        toast.success('Consolidação gerada com sucesso!');
      }
    } catch {
      toast.error('Erro ao gerar consolidação');
    } finally {
      setGenerating(false);
    }
  };

  const downloadPDF = () => {
    if (!routine?.consolidatedSummary) return;
    const summary = routine.consolidatedSummary;
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Consolidação — ${routine.name}</title>
<style>@page{margin:2cm}body{font-family:'Segoe UI',Arial,sans-serif;font-size:10pt;line-height:1.5;color:#333}
h1,h2{color:#065F46;border-bottom:2px solid #10B981;padding-bottom:4px}h3{color:#065F46}
table{width:100%;border-collapse:collapse;margin:10px 0}th{background:#D1FAE5;color:#065F46;padding:6px 8px;border:1px solid #10B981}
td{padding:6px 8px;border:1px solid #10B981}tr:nth-child(even) td{background:#F0FDF4}
.header{border-bottom:3px solid #10B981;padding-bottom:12px;margin-bottom:20px}
.brand{font-size:18pt;font-weight:bold;color:#065F46}
.footer{margin-top:30px;border-top:1px solid #ccc;text-align:center;color:#888;font-size:8pt}</style></head>
<body><div class="header"><div class="brand">Ágata Transcription</div>
<h1>Consolidação de Rotina: ${routine.name}</h1>
<p>Gerado em: ${new Date().toLocaleDateString('pt-BR')}</p></div>
${convertMarkdownToHtml(summary)}
<div class="footer">Documento gerado por Ágata Transcription | agatatranscription.com</div></body></html>`;
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); win.onload = () => setTimeout(() => win.print(), 500); }
  };

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
  const formatDuration = (s: number | null) => s ? `${Math.floor(s / 60)}min` : '';
  const completedCount = routineMeetings.filter(m => m.status === 'completed').length;
  const selectedCount = selectedIds.size || completedCount;
  const filteredAvailable = availableMeetings.filter(m =>
    m.title.toLowerCase().includes(searchAvailable.toLowerCase())
  );

  if (loading) return (
    <AppLayout>
      <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    </AppLayout>
  );

  if (!routine) return (
    <AppLayout>
      <div className="text-center py-16">
        <p className="text-muted-foreground">Rotina não encontrada</p>
        <Link to="/routines"><Button variant="outline" className="mt-4">Voltar</Button></Link>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link to="/routines" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-3">
            <ChevronLeft className="h-4 w-4 mr-1" /> Rotinas
          </Link>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: routine.color }} />
              <div>
                <h1 className="text-2xl font-bold text-foreground">{routine.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {routineMeetings.length} reuniões · atualizada em {formatDate(routine.updatedAt)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to={`/upload?routineId=${routine.id}`}>
                <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" /> Adicionar reunião</Button>
              </Link>
              <Button size="sm" className="bg-primary text-primary-foreground" onClick={handleConsolidate} disabled={generating}>
                {generating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                Consolidar rotina
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card><CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <div><p className="text-2xl font-bold">{routineMeetings.length}</p><p className="text-xs text-muted-foreground">Reuniões na rotina</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">{routine.consolidatedSummary ? formatDate(routine.updatedAt) : 'Nunca'}</p>
              <p className="text-xs text-muted-foreground">Último resumo consolidado</p>
            </div>
          </CardContent></Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="meetings">Reuniões</TabsTrigger>
            <TabsTrigger value="summary">Resumo consolidado</TabsTrigger>
            <TabsTrigger value="progress">Progresso</TabsTrigger>
          </TabsList>

          {/* Tab 1: Meetings */}
          <TabsContent value="meetings" className="space-y-6">
            {/* Routine meetings */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Reuniões desta rotina</h3>
                  {completedCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs">
                      {selectedIds.size === completedCount ? 'Desmarcar todas' : 'Selecionar todas'}
                    </Button>
                  )}
                </div>
                {routineMeetings.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhuma reunião nesta rotina ainda</p>
                ) : (
                  <div className="space-y-2">
                    {routineMeetings.map(m => {
                      const sc = statusConfig[m.status] || statusConfig.pending;
                      const Icon = sc.icon;
                      return (
                        <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                          {m.status === 'completed' && (
                            <Checkbox checked={selectedIds.has(m.id)} onCheckedChange={() => toggleSelect(m.id)} />
                          )}
                          <div className="flex-1 min-w-0">
                            <Link to={`/meetings/${m.id}`} className="font-medium text-sm text-foreground hover:underline truncate block">{m.title}</Link>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(m.meetingDate || m.createdAt)} {formatDuration(m.fileDuration) && `· ${formatDuration(m.fileDuration)}`}
                            </p>
                          </div>
                          <Badge variant={sc.variant} className="text-xs shrink-0"><Icon className="h-3 w-3 mr-1" />{sc.label}</Badge>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeMeeting(m.id)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available meetings */}
            <Card className="border-dashed">
              <CardContent className="p-5">
                <h3 className="font-semibold text-foreground mb-3">Adicionar reuniões existentes</h3>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar reuniões..." value={searchAvailable} onChange={e => setSearchAvailable(e.target.value)} className="pl-9" />
                </div>
                {filteredAvailable.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma reunião disponível</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredAvailable.map(m => (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{m.title}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(m.meetingDate || m.createdAt)}</p>
                        </div>
                        <Button variant="outline" size="sm" className="text-xs shrink-0" onClick={() => addMeeting(m.id)}>Adicionar</Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Consolidation panel */}
            {completedCount > 0 && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-foreground">Consolidar rotina com IA</h3>
                      <p className="text-sm text-muted-foreground">
                        Gera um resumo integrado das {selectedCount} reuniões{selectedIds.size > 0 ? ' selecionadas' : ''}, mostrando evolução, decisões acumuladas e pendências em aberto.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mb-4">
                    <Button variant={consolidationType === 'executivo' ? 'default' : 'outline'} size="sm"
                      onClick={() => setConsolidationType('executivo')}>Resumo executivo</Button>
                    <Button variant={consolidationType === 'progresso' ? 'default' : 'outline'} size="sm"
                      onClick={() => setConsolidationType('progresso')}>Análise de progresso</Button>
                  </div>
                  <Button className="bg-primary text-primary-foreground w-full" onClick={handleConsolidate} disabled={generating}>
                    {generating ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Analisando {selectedCount} reuniões...</>
                    ) : (
                      <><Sparkles className="h-4 w-4 mr-2" /> Gerar consolidação das {selectedCount} selecionadas</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab 2: Summary */}
          <TabsContent value="summary">
            {routine.consolidatedSummary ? (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">Gerado em: {formatDate(routine.updatedAt)}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={downloadPDF}><Download className="h-4 w-4 mr-1" /> Baixar PDF</Button>
                      <Button variant="outline" size="sm" onClick={handleConsolidate} disabled={generating}>
                        <RefreshCw className={`h-4 w-4 mr-1 ${generating ? 'animate-spin' : ''}`} /> Regenerar
                      </Button>
                    </div>
                  </div>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{routine.consolidatedSummary}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-8 text-center">
                  <Sparkles className="h-10 w-10 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground mb-1">Nenhuma consolidação gerada</h3>
                  <p className="text-sm text-muted-foreground mb-4">Selecione reuniões na aba "Reuniões" e gere uma consolidação com IA.</p>
                  <Button onClick={() => setActiveTab('meetings')}>Ir para Reuniões</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab 3: Progress */}
          <TabsContent value="progress">
            <Card>
              <CardContent className="p-8 text-center">
                <Hourglass className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                <h3 className="font-medium text-foreground mb-1">Em breve</h3>
                <p className="text-sm text-muted-foreground">Acompanhe o progresso visual da rotina ao longo do tempo.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
