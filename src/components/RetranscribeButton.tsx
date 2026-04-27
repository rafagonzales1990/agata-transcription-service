import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RetranscribeButtonProps {
  meetingId: string;
  storagePath: string;
  status: string;
  fileDeleted?: boolean | null;
  fileExpiresAt?: string | null;
  variant?: "full" | "icon";
  onStarted?: () => void;
}

export function isRetranscribeAvailable(
  fileDeleted?: boolean | null,
  fileExpiresAt?: string | null,
): boolean {
  if (fileDeleted) return false;
  if (!fileExpiresAt) return false;
  return new Date(fileExpiresAt) > new Date();
}

export function formatFileExpiry(fileExpiresAt: string): string {
  const d = new Date(fileExpiresAt);
  const date = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${date} às ${time}`;
}

export function isExpiringSoon(fileExpiresAt: string): boolean {
  const ms = new Date(fileExpiresAt).getTime() - Date.now();
  return ms > 0 && ms < 2 * 60 * 60 * 1000;
}

export function RetranscribeButton({
  meetingId,
  storagePath,
  status,
  fileDeleted,
  fileExpiresAt,
  variant = "full",
  onStarted,
}: RetranscribeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!isRetranscribeAvailable(fileDeleted, fileExpiresAt)) return null;

  const isProcessing = status === "processing" || loading;

  const trigger = async () => {
    setLoading(true);
    try {
      await supabase
        .from("Meeting")
        .update({ status: "processing", errorMessage: null, updatedAt: new Date().toISOString() })
        .eq("id", meetingId);
      onStarted?.();

      const { data, error } = await supabase.functions.invoke("transcribe", {
        body: { meetingId, storagePath },
      });

      if (error && !(error as any)?.status?.toString().startsWith("2")) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Transcrição reiniciada! Acompanhe o progresso aqui.");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao retranscrever");
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isProcessing) return;
    if (status === "completed") {
      setConfirmOpen(true);
    } else {
      trigger();
    }
  };

  const expiringSoon = fileExpiresAt ? isExpiringSoon(fileExpiresAt) : false;

  const button =
    variant === "icon" ? (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleClick}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Transcrever Novamente</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ) : (
      <Button
        variant={status === "failed" ? "destructive" : "outline"}
        size="sm"
        onClick={handleClick}
        disabled={isProcessing}
        className="flex items-center gap-1.5"
      >
        {isProcessing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5" />
        )}
        Transcrever Novamente
      </Button>
    );

  return (
    <>
      {variant === "full" ? (
        <div className="flex flex-col items-end gap-1">
          {button}
          {fileExpiresAt && (
            <span
              className={`text-[11px] ${
                expiringSoon ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
              }`}
            >
              Arquivo disponível até {formatFileExpiry(fileExpiresAt)}
            </span>
          )}
        </div>
      ) : (
        button
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retranscrever reunião?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso vai substituir a transcrição atual pela nova versão gerada pela IA. Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => trigger()}
            >
              Sim, retranscrever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
