import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ChevronLeft, CheckCircle, AlertCircle, Clock, Users, FileText, ListChecks, AlignLeft, Sparkles, Lock, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface MeetingRow {
  id: string;
  title: string;
  fileName: string;
  status: string;
  createdAt: string;
  summary: string | null;
  transcription: string | null;
  participants: string[];
  meetingDate: string | null;
  meetingTime: string | null;
  actionItems: string[];
  responsible: string | null;
  location: string | null;
  description: string | null;
  ataTemplate: string | null;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle }> = {
  completed: { label: 'Concluída', variant: 'default', icon: CheckCircle },
  processing: { label: 'Processando', variant: 'secondary', icon: Clock },
  pending: { label: 'Pendente', variant: 'outline', icon: Clock },
  failed: { label: 'Falhou', variant: 'destructive', icon: AlertCircle },
};

const PAID_PLANS = ['inteligente', 'automacao', 'enterprise'];

const templateLabels: Record<string, string> = {
  geral: 'Ata Geral',
  juridico_audiencia: 'Ata de Audiência',
  juridico_entrevista: 'Ata Jurídica - Entrevista',
  rh_entrevista: 'Ata RH - Entrevista',
  rh_pdi: 'Ata RH - PDI',
  marketing_estrategia: 'Ata Marketing - Estratégia',
  marketing_planejamento: 'Ata Marketing - Planejamento',
  engenharia_projetos: 'Ata Engenharia - Projetos',
  engenharia_obra: 'Ata Engenharia - Obra',
  ti_sprint: 'Ata TI - Sprint',
  financeiro: 'Ata Financeiro',
  comercial: 'Ata Comercial',
};

export default function MeetingDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [meeting, setMeeting] = useState<MeetingRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryContent, setSummaryContent] = useState<string>('');
  const [summaryDepth, setSummaryDepth] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState('geral');
  const [pdfLoading, setPdfLoading] = useState(false);

  const isPaidPlan = PAID_PLANS.includes(profile?.plan_id || 'basic');

  useEffect(() => {
    async function fetchMeeting() {
      if (!id) return;
      const { data, error } = await supabase
        .from('Meeting')
        .select('id, title, fileName, status, createdAt, summary, transcription, participants, meetingDate, meetingTime, actionItems, responsible, location, description, ataTemplate')
        .eq('id', id)
        .single();

      if (error) console.error('Error fetching meeting:', error);
      else {
        const m = data as MeetingRow;
        setMeeting(m);
        if (m.summary) {
          const depthMatch = m.summary.match(/^<!-- depth:(\w+) -->\n/);
          if (depthMatch) {
            setSummaryDepth(depthMatch[1]);
            setSummaryContent(m.summary.slice(depthMatch[0].length));
          } else {
            setSummaryContent(m.summary);
          }
        }
      }
      setLoading(false);
    }
    fetchMeeting();
  }, [id]);

  const generateSummary = useCallback(async (depth: string) => {
    if (!id) return;
    setSummaryLoading(true);
    setSummaryContent('');
    setSummaryDepth(depth);

    try {
      const { data, error } = await supabase.functions.invoke('generate-summary', {
        body: { meetingId: id, depth },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSummaryContent(data.summary);
      toast.success('Resumo gerado com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar resumo');
      setSummaryContent('');
      setSummaryDepth('');
    } finally {
      setSummaryLoading(false);
    }
  }, [id]);

  const generatePDF = useCallback(async () => {
    if (!id || !meeting) return;
    setPdfLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-ata', {
        body: { meetingId: id, template: selectedTemplate },
      });

      if (error) throw error;

      // data is the HTML string
      const htmlContent = typeof data === 'string' ? data : data?.toString();
      if (!htmlContent || htmlContent.startsWith('{')) {
        const parsed = JSON.parse(htmlContent);
        if (parsed.error) throw new Error(parsed.error);
      }

      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      container.style.width = '794px';
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      document.body.appendChild(container);

      const canvas = await html2canvas(container, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      pdf.save(`ATA_${meeting.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      document.body.removeChild(container);
      toast.success('PDF gerado com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar PDF');
    } finally {
      setPdfLoading(false);
    }
  }, [id, meeting, selectedTemplate]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!meeting) {
    return (
      <AppLayout>
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold text-foreground mb-2">Reunião não encontrada</h2>
          <Link to="/meetings"><Button variant="outline">Voltar para Reuniões</Button></Link>
        </div>
      </AppLayout>
    );
  }

  const cfg = statusConfig[meeting.status] || statusConfig.pending;
  const StatusIcon = cfg.icon;
  const date = meeting.meetingDate
    ? new Date(meeting.meetingDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date(meeting.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Back + Header */}
        <div>
          <Link to="/meetings" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ChevronLeft className="h-4 w-4" /> Voltar para Reuniões
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{meeting.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {date}
                {meeting.meetingTime && ` · ${meeting.meetingTime}`}
                {meeting.location && ` · ${meeting.location}`}
              </p>
            </div>
            <Badge variant={cfg.variant} className="shrink-0 flex items-center gap-1">
              <StatusIcon className="h-3 w-3" /> {cfg.label}
            </Badge>
          </div>
          {meeting.description && (
            <p className="text-sm text-muted-foreground mt-2">{meeting.description}</p>
          )}
        </div>

        {/* Participants */}
        {meeting.participants.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Participantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {meeting.participants.map((p, i) => <Badge key={i} variant="secondary">{p}</Badge>)}
              </div>
              {meeting.responsible && (
                <p className="text-sm text-muted-foreground mt-2">Responsável: {meeting.responsible}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* AI Summary Section */}
        {meeting.transcription && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Resumo Inteligente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={summaryDepth === 'executivo' ? 'default' : 'outline'}
                  onClick={() => generateSummary('executivo')}
                  disabled={summaryLoading}
                  className={summaryDepth === 'executivo' ? 'bg-primary text-primary-foreground' : ''}
                >
                  Executivo
                </Button>
                <Button
                  size="sm"
                  variant={summaryDepth === 'detalhado' ? 'default' : 'outline'}
                  onClick={() => isPaidPlan ? generateSummary('detalhado') : toast.error('Disponível apenas para planos pagos')}
                  disabled={summaryLoading}
                  className={summaryDepth === 'detalhado' ? 'bg-primary text-primary-foreground' : ''}
                >
                  {!isPaidPlan && <Lock className="h-3 w-3 mr-1" />}
                  Detalhado
                </Button>
                <Button
                  size="sm"
                  variant={summaryDepth === 'ata_completa' ? 'default' : 'outline'}
                  onClick={() => isPaidPlan ? generateSummary('ata_completa') : toast.error('Disponível apenas para planos pagos')}
                  disabled={summaryLoading}
                  className={summaryDepth === 'ata_completa' ? 'bg-primary text-primary-foreground' : ''}
                >
                  {!isPaidPlan && <Lock className="h-3 w-3 mr-1" />}
                  ATA Completa
                </Button>
              </div>

              {summaryLoading && (
                <div className="flex items-center gap-2 py-8 justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Gerando resumo com IA...</span>
                </div>
              )}

              {summaryContent && !summaryLoading && (
                <div className="markdown-rendered prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <h1 className="md-h1">{children}</h1>,
                      h2: ({ children }) => <h2 className="md-h2">{children}</h2>,
                      h3: ({ children }) => <h3 className="md-h3">{children}</h3>,
                      p: ({ children }) => <p className="md-p">{children}</p>,
                      ul: ({ children }) => <ul className="md-ul">{children}</ul>,
                      table: ({ children }) => <table className="w-full border-collapse text-sm my-3">{children}</table>,
                      th: ({ children }) => <th className="border border-primary/30 bg-primary/10 text-left px-3 py-1.5 text-xs font-semibold text-foreground">{children}</th>,
                      td: ({ children }) => <td className="border border-border px-3 py-1.5 text-xs text-muted-foreground">{children}</td>,
                    }}
                  >
                    {summaryContent}
                  </ReactMarkdown>
                </div>
              )}

              {/* ATA PDF Generation */}
              {summaryDepth === 'ata_completa' && summaryContent && !summaryLoading && (
                <div className="border-t pt-4 space-y-3">
                  <h4 className="text-sm font-medium text-foreground">Gerar ATA em PDF</h4>
                  <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-xs text-muted-foreground mb-1 block">Template</label>
                      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(templateLabels).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={generatePDF}
                      disabled={pdfLoading}
                      className="bg-primary text-primary-foreground"
                    >
                      {pdfLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                      Gerar ATA em PDF
                    </Button>
                  </div>
                  {!isPaidPlan && (
                    <p className="text-xs text-muted-foreground">
                      ⚠️ O PDF será gerado com marca d'água. <Link to="/plans" className="text-primary underline">Faça upgrade</Link> para remover.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Items */}
        {meeting.actionItems.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary" /> Itens de Ação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {meeting.actionItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Transcription */}
        {meeting.transcription && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Transcrição Completa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap text-sm leading-relaxed max-h-[600px] overflow-y-auto">
                {meeting.transcription}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
