import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, FileText, Repeat, HelpCircle, AlertTriangle } from 'lucide-react';

const tips = [
  {
    icon: Upload,
    title: 'Faça upload do áudio',
    description: 'Envie arquivos de áudio ou vídeo (MP3, MP4, WAV, M4A, WEBM) de até 500MB. Reuniões longas com vídeo são suportadas.',
  },
  {
    icon: FileText,
    title: 'Revise o resumo e ATA',
    description: 'Após a transcrição, acesse o resumo inteligente, itens de ação e baixe a ATA em PDF.',
  },
  {
    icon: Repeat,
    title: 'Organize com Rotinas',
    description: 'Crie rotinas para agrupar reuniões recorrentes (ex: Daily, Sprint Review) e consolidar resumos.',
  },
];

export function HelpModal({ children }: { children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Como usar o Ágata
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          {tips.map((tip, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <tip.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">{tip.title}</p>
                <p className="text-sm text-muted-foreground">{tip.description}</p>
              </div>
            </div>
          ))}

          {/* Extension recording notice */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Boas práticas de gravação</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                Informe os participantes antes de gravar. A extensão oferece um botão "Avisar sobre gravação" que envia uma mensagem automática no chat da reunião.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
