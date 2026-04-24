import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, ListChecks, AlertCircle } from "lucide-react";
import { LogoIcon } from "@/components/LogoIcon";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SharedData {
  title: string;
  meetingDate: string | null;
  createdAt: string;
  summary: string | null;
  actionItems: string[];
}

export default function SharedMeeting() {
  const { token } = useParams<{ token: string }>();
  const [meeting, setMeeting] = useState<SharedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      if (!token) { setError(true); setLoading(false); return; }

      // Find share by token via RPC (MeetingShare blocks direct SELECT)
      const { data: rpcData, error: shareErr } = await supabase
        .rpc('get_meeting_by_share_token', { share_token: token });

      const share = (rpcData as any)?.[0] || null;

      if (shareErr || !share) { setError(true); setLoading(false); return; }

      // Check expiry
      if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
        setError(true); setLoading(false); return;
      }

      // Fetch meeting data (public via share)
      const { data: m, error: mErr } = await supabase
        .from("Meeting")
        .select("title, meetingDate, createdAt, summary, actionItems")
        .eq("id", share.meetingId)
        .maybeSingle();

      if (mErr || !m) { setError(true); setLoading(false); return; }

      setMeeting(m as SharedData);
      setLoading(false);
    }
    load();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 px-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h1 className="text-xl font-semibold text-foreground">Este link não é válido ou expirou.</h1>
        <p className="text-sm text-muted-foreground">Solicite um novo link ao organizador da reunião.</p>
        <Link to="/" className="text-primary hover:underline text-sm mt-2">
          Ir para Ágata Transcription →
        </Link>
      </div>
    );
  }

  const date = meeting.meetingDate
    ? new Date(meeting.meetingDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    : new Date(meeting.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  // Strip depth meta from summary
  let summaryContent = meeting.summary || "";
  const metaMatch = summaryContent.match(/^<!-- depth:\w+ -->\n/);
  if (metaMatch) summaryContent = summaryContent.slice(metaMatch[0].length);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <LogoIcon size={32} />
          <span className="font-semibold text-foreground">Ágata Transcription</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{meeting.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{date}</p>
        </div>

        {/* Summary */}
        {summaryContent && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Resumo Executivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="markdown-rendered overflow-x-auto">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{summaryContent}</ReactMarkdown>
              </div>
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
                  <li key={i} className="flex items-start gap-2">
                    <Badge variant="outline" className="shrink-0 mt-0.5 text-xs">{i + 1}</Badge>
                    <span className="text-sm text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {!summaryContent && meeting.actionItems.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Esta reunião ainda não possui resumo ou itens de ação.
          </p>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center">
        <Link to="/" className="text-xs text-muted-foreground hover:text-primary transition-colors">
          Powered by <span className="font-semibold">Ágata Transcription</span>
        </Link>
      </footer>
    </div>
  );
}
