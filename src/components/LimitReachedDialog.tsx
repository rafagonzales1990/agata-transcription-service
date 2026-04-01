import { FileAudio, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Link, useNavigate } from 'react-router-dom';

interface Props {
  open: boolean;
  onClose: () => void;
  planName?: string;
  used?: number;
  max?: number;
}

export function LimitReachedDialog({ open, onClose, planName = 'Gratuito', used = 0, max = 2 }: Props) {
  const navigate = useNavigate();
  const benefits = [
    'Mais transcrições por mês',
    'Arquivos de áudio mais longos',
    'Resumos com IA avançada',
    'ATAs em PDF sem marca d\'água',
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
              <FileAudio className="h-7 w-7 text-amber-600" />
            </div>
          </div>
          <DialogTitle className="text-center">Limite de Transcrições Atingido</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Você atingiu o limite do plano <strong>{planName}</strong> ({used}/{max} transcrições).
          </p>
          <Progress value={100} className="h-2 [&>div]:bg-red-500" />
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">Com o upgrade você ganha:</p>
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                {b}
              </div>
            ))}
          </div>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700"
            onClick={() => navigate('/plans')}
          >
            Ver Planos e Fazer Upgrade
          </Button>
          <Button variant="ghost" className="w-full" onClick={onClose}>
            Continuar no plano atual
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
