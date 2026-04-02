import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, Printer, Loader2, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const templateLabels: Record<string, string> = {
  geral: 'Ata Geral',
  juridico_audiencia: 'Ata de Audiência',
  juridico_entrevista: 'Ata Jurídica',
  rh_entrevista: 'Ata RH - Entrevista',
  rh_pdi: 'Ata RH - PDI',
  marketing_estrategia: 'Ata Marketing',
  marketing_planejamento: 'Ata Marketing - Plan.',
  engenharia_projetos: 'Ata Eng. Projetos',
  engenharia_obra: 'Ata Eng. Obra',
  ti_sprint: 'Ata TI Sprint',
  financeiro: 'Ata Financeiro',
  comercial: 'Ata Comercial',
};

interface DocMeeting {
  id: string;
  title: string;
  meetingDate: string | null;
  createdAt: string;
  ataTemplate: string;
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DocMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDocs() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('Meeting')
        .select('id, title, meetingDate, createdAt, ataTemplate')
        .eq('userId', user.id)
        .not('ataTemplate', 'is', null)
        .order('createdAt', { ascending: false });

      if (!error && data) setDocs(data.filter(d => d.ataTemplate) as DocMeeting[]);
      setLoading(false);
    }
    fetchDocs();
  }, []);

  const handleDownload = async (doc: DocMeeting) => {
    setDownloadingId(doc.id);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ata', {
        body: { meetingId: doc.id, template: doc.ataTemplate },
      });

      if (error) throw error;

      if (typeof data === 'object' && data.base64 && data.filename) {
        // DOCX download
        const byteCharacters = atob(data.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        throw new Error('Formato inválido');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao baixar ATA');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documentos</h1>
          <p className="text-muted-foreground">ATAs e resumos gerados</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : docs.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <FolderOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <h3 className="font-medium text-foreground mb-1">Nenhum documento encontrado</h3>
                <p className="text-sm text-muted-foreground">Documentos gerados a partir de transcrições aparecerão aqui</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {docs.map((doc) => {
              const date = doc.meetingDate
                ? new Date(doc.meetingDate).toLocaleDateString('pt-BR')
                : new Date(doc.createdAt).toLocaleDateString('pt-BR');

              return (
                <Card key={doc.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">{date}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {templateLabels[doc.ataTemplate] || doc.ataTemplate}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      disabled={downloadingId === doc.id}
                    >
                      {downloadingId === doc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5 mr-1" />}
                      Baixar ATA
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
