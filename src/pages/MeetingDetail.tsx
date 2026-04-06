import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  FileText,
  ListChecks,
  Sparkles,
  Lock,
  Download,
  Printer,
  FileDown,
  Share2,
} from "lucide-react";
import { ShareMeetingModal } from "@/components/ShareMeetingModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
  fileDuration: number | null;
}

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle }
> = {
  completed: { label: "Concluída", variant: "default", icon: CheckCircle },
  processing: { label: "Processando", variant: "secondary", icon: Clock },
  pending: { label: "Pendente", variant: "outline", icon: Clock },
  failed: { label: "Falhou", variant: "destructive", icon: AlertCircle },
};

const PAID_PLANS = ["inteligente", "automacao", "enterprise"];

const templateLabels: Record<string, string> = {
  geral: "Ata Geral",
  juridico_audiencia: "Ata de Audiência",
  juridico_entrevista: "Ata Jurídica - Entrevista",
  rh_entrevista: "Ata RH - Entrevista",
  rh_pdi: "Ata RH - PDI",
  marketing_estrategia: "Ata Marketing - Estratégia",
  marketing_planejamento: "Ata Marketing - Planejamento",
  engenharia_projetos: "Ata Engenharia - Projetos",
  engenharia_obra: "Ata Engenharia - Obra",
  ti_sprint: "Ata TI - Sprint",
  financeiro: "Ata Financeiro",
  comercial: "Ata Comercial",
};

export default function MeetingDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [meeting, setMeeting] = useState<MeetingRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryContent, setSummaryContent] = useState<string>("");
  const [summaryDepth, setSummaryDepth] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState("geral");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [wordLoading, setWordLoading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const isPaidPlan = PAID_PLANS.includes(profile?.plan_id || "basic");

  useEffect(() => {
    async function fetchMeeting() {
      if (!id) return;
      const { data, error } = await supabase
        .from("Meeting")
        .select(
          "id, title, fileName, status, createdAt, summary, transcription, participants, meetingDate, meetingTime, actionItems, responsible, location, description, ataTemplate, fileDuration",
        )
        .eq("id", id)
        .single();

      if (error) console.error("Error fetching meeting:", error);
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

  const generateSummary = useCallback(
    async (depth: string) => {
      if (!id) return;
      setSummaryLoading(true);
      setSummaryContent("");
      setSummaryDepth(depth);

      try {
        const { data, error } = await supabase.functions.invoke("generate-summary", {
          body: { meetingId: id, depth },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setSummaryContent(data.summary);
        toast.success("Resumo gerado com sucesso!");
      } catch (err: any) {
        toast.error(err.message || "Erro ao gerar resumo");
        setSummaryContent("");
        setSummaryDepth("");
      } finally {
        setSummaryLoading(false);
      }
    },
    [id],
  );

  const convertMarkdownToHtml = (md: string): string => {
    let html = md;
    html = html.replace(/(?:^\|.+\|$\n?)+/gm, (tableMatch) => {
      const rows = tableMatch.trim().split('\n').map((row) => row.trim()).filter(Boolean);
      if (rows.length < 2) return tableMatch;

      const parsedRows = rows
        .map((row) => row.split('|').slice(1, -1).map((cell) => cell.trim()))
        .filter((cells) => cells.length > 0);

      const contentRows = parsedRows.filter(
        (cells) => !cells.every((cell) => /^:?-{3,}:?$/.test(cell)),
      );

      if (contentRows.length === 0) return tableMatch;

      const [headerCells, ...bodyRows] = contentRows;
      let tableHtml = '<table class="ata-table"><thead><tr>';
      headerCells.forEach((cell) => {
        tableHtml += `<th>${cell}</th>`;
      });
      tableHtml += '</tr></thead>';

      if (bodyRows.length > 0) {
        tableHtml += '<tbody>';
        bodyRows.forEach((cells) => {
          tableHtml += '<tr>';
          cells.forEach((cell) => {
            tableHtml += `<td>${cell}</td>`;
          });
          tableHtml += '</tr>';
        });
        tableHtml += '</tbody>';
      }

      tableHtml += '</table>';
      return tableHtml;
    });
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 class="section-title">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/(?:^- .+$\n?)+/gm, (listMatch) => {
      const items = listMatch.trim().split('\n');
      let listHtml = '<ul>';
      items.forEach(item => {
        const content = item.replace(/^- /, '').trim();
        if (content) listHtml += `<li>${content}</li>`;
      });
      listHtml += '</ul>';
      return listHtml;
    });
    html = html.replace(/(?:^\d+\. .+$\n?)+/gm, (listMatch) => {
      const items = listMatch.trim().split('\n');
      let listHtml = '<ol>';
      items.forEach(item => {
        const content = item.replace(/^\d+\. /, '').trim();
        if (content) listHtml += `<li>${content}</li>`;
      });
      listHtml += '</ol>';
      return listHtml;
    });
    html = html.replace(/^---$/gm, '<hr/>');
    html = html.replace(/\n\n+/g, '</p><p>');
    html = html.replace(/\n/g, ' ');
    html = `<p>${html}</p>`;
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<p>\s*(<h[123]>)/g, '$1');
    html = html.replace(/<p>\s*(<table[^>]*>.*?<\/table>|<ul>|<ol>|<\/ol>|<hr\/>)\s*<\/p>/gs, '$1');
    return html;
  };

  const generatePDF = useCallback(async () => {
    if (!id || !meeting) return;
    setPdfLoading(true);

    try {
      let summaryContent = meeting.summary || '';
      const metaMatch = summaryContent.match(/^<!-- depth:\w+ -->\n/);
      if (metaMatch) summaryContent = summaryContent.slice(metaMatch[0].length);

      const html = convertMarkdownToHtml(summaryContent);
      const date = meeting.meetingDate
        ? new Date(meeting.meetingDate).toLocaleDateString('pt-BR')
        : new Date(meeting.createdAt).toLocaleDateString('pt-BR');

      const templateLabel = templateLabels[selectedTemplate] || 'Ata Geral';

      const infoRows = [
        `<tr><td class="label">Título</td><td>${meeting.title}</td></tr>`,
        `<tr><td class="label">Data</td><td>${date}${meeting.meetingTime ? ' · ' + meeting.meetingTime : ''}</td></tr>`,
        meeting.location ? `<tr><td class="label">Local</td><td>${meeting.location}</td></tr>` : '',
        meeting.responsible ? `<tr><td class="label">Responsável</td><td>${meeting.responsible}</td></tr>` : '',
        meeting.participants?.length ? `<tr><td class="label">Participantes</td><td>${meeting.participants.join(', ')}</td></tr>` : '',
      ].filter(Boolean).join('');

      // Get enterprise info for branding
      let headerHtml = '';
      let footerText = 'Documento gerado automaticamente por Ágata Transcription | agatatranscription.com';
      
      try {
        const { data: userData } = await supabase
          .from('User')
          .select('planId, teamId')
          .eq('id', profile?.user_id || '')
          .single();

        if (userData?.planId === 'enterprise' && userData?.teamId) {
          const { data: team } = await supabase
            .from('Team')
            .select('name, companyName, logoUrl')
            .eq('id', userData.teamId)
            .single();

          if (team) {
            const companyName = team.companyName || team.name || '';
            footerText = `Documento gerado por ${companyName} | powered by Ágata Transcription`;
            if (team.logoUrl) {
              headerHtml = `<div class="header"><img src="${team.logoUrl}" class="logo" /><span class="logo-text">${companyName}</span></div>`;
            } else {
              headerHtml = `<div class="header"><span class="logo-text">${companyName}</span></div>`;
            }
          }
        }
      } catch (_) { /* fallback to default */ }

      if (!headerHtml) {
        headerHtml = `<div class="header"><span class="logo-text">Ágata Transcription</span></div>`;
      }

      const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${templateLabel} — ${meeting.title}</title>
  <style>
    @page { margin: 1.5cm 2cm 2cm 2cm; }
    html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: 'Segoe UI', Aptos, Arial, sans-serif; font-size: 10pt; line-height: 1.5; color: #333; margin: 0; padding: 20px; }
    .header { display: flex; align-items: center; gap: 10px; padding-bottom: 8px; border-bottom: 3px solid #059669; margin-bottom: 15px; }
    .header .logo { width: 40px; height: 40px; object-fit: contain; }
    .logo-text { font-size: 14pt; font-weight: 700; color: #065F46; }
    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10pt; }
    .info-table td { padding: 6px 10px; border: 1px solid #A7F3D0; }
    .info-table td.label { background: #D1FAE5; font-weight: 700; color: #065F46; width: 140px; }
    h1 { font-size: 14pt; font-weight: 700; color: #111; margin: 15px 0 8px 0; page-break-after: avoid; break-after: avoid; }
    h2, .section-title { color: #059669; font-size: 11pt; font-weight: 700; margin: 18px 0 8px 0; border-bottom: 2px solid #059669; padding-bottom: 4px; page-break-after: avoid; break-after: avoid; }
    h3 { color: #065F46; font-size: 10pt; font-weight: 700; margin: 12px 0 6px 0; page-break-after: avoid; break-after: avoid; }
    p { margin: 6px 0; orphans: 3; widows: 3; }
    ul, ol { margin: 6px 0; padding-left: 20px; }
    li { margin: 3px 0; }
    strong { color: #065F46; font-weight: 700; }
    .ata-table { width: 100%; border-collapse: collapse; border-spacing: 0; margin: 10px 0; font-size: 9pt; page-break-inside: auto; }
    .ata-table thead { display: table-header-group; }
    .ata-table tbody { display: table-row-group; }
    .ata-table th, .ata-table td { border: 1px solid #A7F3D0; padding: 6px 8px; text-align: left; vertical-align: top; }
    .ata-table thead th { background: #059669 !important; color: #FFFFFF !important; font-weight: 700; }
    .ata-table tbody tr:nth-child(even) td { background: #F0FDF4; }
    .ata-table tbody tr:nth-child(odd) td { background: #FFFFFF; }
    .ata-table tr { page-break-inside: avoid; break-inside: avoid; }
    hr { border: none; border-top: 1px solid #E5E7EB; margin: 15px 0; }
    .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #E5E7EB; text-align: center; color: #aaa; font-size: 8pt; }
    @media print {
      body { padding: 0; }
      h1, h2, h3, .section-title { page-break-after: avoid !important; break-after: avoid !important; }
      .info-table, .ata-table { page-break-inside: avoid; }
      .ata-table thead th { background: #059669 !important; color: #FFFFFF !important; }
      .footer { position: fixed; bottom: 0; left: 0; right: 0; }
    }
  </style>
</head>
<body>
  ${headerHtml}
  <table class="info-table">
    ${infoRows}
  </table>
  ${html}
  <div class="footer">${footerText}</div>
</body>
</html>`;

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(fullHtml);
        printWindow.document.close();
        printWindow.onload = () => setTimeout(() => printWindow.print(), 500);
      }
      toast.success("ATA gerada! Use Ctrl+P para salvar como PDF.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar PDF");
    } finally {
      setPdfLoading(false);
    }
  }, [id, meeting, selectedTemplate, profile]);

  const generateWord = useCallback(async () => {
    if (!id || !meeting) return;
    setWordLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-ata", {
        body: { meetingId: id, template: selectedTemplate },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const { base64, filename } = data;

      // Converte base64 para blob e faz download
      const byteChars = atob(base64);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "ATA.docx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Arquivo Word baixado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar Word");
    } finally {
      setWordLoading(false);
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
          <Link to="/meetings">
            <Button variant="outline">Voltar para Reuniões</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const cfg = statusConfig[meeting.status] || statusConfig.pending;
  const StatusIcon = cfg.icon;
  const date = meeting.meetingDate
    ? new Date(meeting.meetingDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    : new Date(meeting.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  const durationLabel = meeting.fileDuration ? `${Math.round(meeting.fileDuration / 60)} min` : null;

  const nextDepth = summaryDepth === "executivo" ? "detalhado" : summaryDepth === "detalhado" ? "ata_completa" : null;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Back + Header */}
        <div>
          <Link
            to="/meetings"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ChevronLeft className="h-4 w-4" /> Voltar para Reuniões
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{meeting.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {date}
                {meeting.meetingTime && ` · ${meeting.meetingTime}`}
                {meeting.location && ` · ${meeting.location}`}
                {durationLabel && ` · ${durationLabel}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShareOpen(true)} className="flex items-center gap-1.5">
                <Share2 className="h-3.5 w-3.5" /> Compartilhar
              </Button>
              <Badge variant={cfg.variant} className="shrink-0 flex items-center gap-1">
                <StatusIcon className="h-3 w-3" /> {cfg.label}
              </Badge>
            </div>
          </div>
          {meeting.description && <p className="text-sm text-muted-foreground mt-2">{meeting.description}</p>}
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
                {meeting.participants.map((p, i) => (
                  <Badge key={i} variant="secondary">
                    {p}
                  </Badge>
                ))}
              </div>
              {meeting.responsible && (
                <p className="text-sm text-muted-foreground mt-2">Responsável: {meeting.responsible}</p>
              )}
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
              <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap text-sm leading-relaxed max-h-[400px] overflow-y-auto">
                {meeting.transcription}
              </div>
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
                  variant={summaryDepth === "executivo" ? "default" : "outline"}
                  onClick={() => generateSummary("executivo")}
                  disabled={summaryLoading}
                >
                  Executivo
                </Button>
                <Button
                  size="sm"
                  variant={summaryDepth === "detalhado" ? "default" : "outline"}
                  onClick={() =>
                    isPaidPlan ? generateSummary("detalhado") : toast.error("Disponível apenas para planos pagos")
                  }
                  disabled={summaryLoading}
                >
                  {!isPaidPlan && <Lock className="h-3 w-3 mr-1" />}
                  Detalhado
                </Button>
                <Button
                  size="sm"
                  variant={summaryDepth === "ata_completa" ? "default" : "outline"}
                  onClick={() =>
                    isPaidPlan ? generateSummary("ata_completa") : toast.error("Disponível apenas para planos pagos")
                  }
                  disabled={summaryLoading}
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
                <div className="markdown-rendered">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{summaryContent}</ReactMarkdown>
                </div>
              )}

              {/* Action buttons after summary */}
              {summaryContent && !summaryLoading && (
                <div className="border-t pt-4 flex flex-wrap gap-3 items-end">
                  {nextDepth && isPaidPlan && (
                    <Button size="sm" variant="outline" onClick={() => generateSummary(nextDepth)}>
                      <Sparkles className="h-3 w-3 mr-1" />
                      Gerar como {nextDepth === "detalhado" ? "Detalhado" : "ATA Completa"}
                    </Button>
                  )}

                  <div className="flex items-center gap-2 ml-auto flex-wrap">
                    <div className="min-w-[180px]">
                      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(templateLabels).map(([k, v]) => (
                            <SelectItem key={k} value={k}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button size="sm" onClick={generatePDF} disabled={pdfLoading || wordLoading}>
                      {pdfLoading ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Printer className="h-3 w-3 mr-1" />
                      )}
                      Baixar PDF
                    </Button>
                    <Button size="sm" variant="outline" onClick={generateWord} disabled={pdfLoading || wordLoading}>
                      {wordLoading ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <FileDown className="h-3 w-3 mr-1" />
                      )}
                      Baixar Word
                    </Button>
                  </div>
                </div>
              )}

              {summaryContent && !summaryLoading && !isPaidPlan && (
                <p className="text-xs text-muted-foreground">
                  ⚠️ Os documentos serão gerados com marca d'água.{" "}
                  <Link to="/plans" className="text-primary underline">
                    Faça upgrade
                  </Link>{" "}
                  para remover.
                </p>
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
      </div>
    </AppLayout>
  );
}
