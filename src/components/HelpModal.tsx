import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, FileText, Repeat, HelpCircle } from 'lucide-react';

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
        </div>
      </DialogContent>
    </Dialog>
  );
}
