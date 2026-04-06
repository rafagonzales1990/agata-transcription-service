import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Link2, RefreshCw, Mail, Loader2, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ShareMeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string;
}

export function ShareMeetingModal({ open, onOpenChange, meetingId }: ShareMeetingModalProps) {
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    if (open && meetingId) {
      fetchExistingShare();
    }
  }, [open, meetingId]);

  async function fetchExistingShare() {
    const { data } = await supabase
      .from("MeetingShare" as any)
      .select("id, token")
      .eq("meetingId", meetingId)
      .limit(1)
      .maybeSingle();

    if (data) {
      setShareToken((data as any).token);
      setShareId((data as any).id);
    } else {
      setShareToken(null);
      setShareId(null);
    }
  }

  async function generateLink() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("MeetingShare" as any)
        .insert({ meetingId } as any)
        .select("id, token")
        .single();

      if (error) throw error;
      setShareToken((data as any).token);
      setShareId((data as any).id);
      toast.success("Link público gerado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar link");
    } finally {
      setLoading(false);
    }
  }

  async function revokeLink() {
    if (!shareId) return;
    setRevoking(true);
    try {
      const { error } = await supabase
        .from("MeetingShare" as any)
        .delete()
        .eq("id", shareId);

      if (error) throw error;
      setShareToken(null);
      setShareId(null);
      toast.success("Link revogado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao revogar link");
    } finally {
      setRevoking(false);
    }
  }

  async function regenerateLink() {
    if (shareId) {
      await supabase.from("MeetingShare" as any).delete().eq("id", shareId);
    }
    await generateLink();
  }

  function copyLink() {
    if (!shareToken) return;
    const url = `${window.location.origin}/shared/${shareToken}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  }

  const shareUrl = shareToken ? `${window.location.origin}/shared/${shareToken}` : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar Reunião</DialogTitle>
          <DialogDescription>
            Gere um link público ou envie por e-mail.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link" className="flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" /> Link público
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> E-mail
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4 mt-4">
            {shareToken ? (
              <>
                <div className="flex gap-2">
                  <Input value={shareUrl} readOnly className="text-xs" />
                  <Button size="icon" variant="outline" onClick={copyLink} title="Copiar">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Qualquer pessoa com este link pode ver o resumo e itens de ação.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={regenerateLink}
                    disabled={loading}
                    className="flex items-center gap-1.5"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Regenerar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={revokeLink}
                    disabled={revoking}
                    className="flex items-center gap-1.5"
                  >
                    {revoking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    Revogar
                  </Button>
                </div>
              </>
            ) : (
              <Button onClick={generateLink} disabled={loading} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
                Gerar link público
              </Button>
            )}
          </TabsContent>

          <TabsContent value="email" className="space-y-4 mt-4">
            <Input placeholder="email@exemplo.com" disabled />
            <p className="text-sm text-muted-foreground text-center py-4">
              📧 Em breve — envio por e-mail será habilitado em uma próxima versão.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
