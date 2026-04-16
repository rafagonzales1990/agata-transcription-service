import { X, Smartphone } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';

interface PWAInstallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function StepItem({ step, icon, text }: { step: number; icon: string; text: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
        {step}
      </div>
      <div className="flex items-start gap-2 pt-0.5">
        <span className="text-xl leading-none">{icon}</span>
        <p className="text-sm text-foreground">{text}</p>
      </div>
    </div>
  );
}

export function PWAInstallModal({ open, onOpenChange }: PWAInstallModalProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="text-left pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle>Instale o Ágata no seu celular</SheetTitle>
              <SheetDescription>
                Acesse como app nativo, sem precisar abrir o navegador
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="android" className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="android" className="flex-1 gap-1.5">
              🤖 Android
            </TabsTrigger>
            <TabsTrigger value="ios" className="flex-1 gap-1.5">
              🍎 iOS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="android" className="space-y-3 mt-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              No Google Chrome
            </p>
            <StepItem step={1} icon="⋮" text='Toque no menu ⋮ no canto superior direito' />
            <StepItem step={2} icon="📲" text='Selecione "Adicionar à tela inicial"' />
            <StepItem step={3} icon="✅" text='Confirme tocando em "Adicionar"' />
          </TabsContent>

          <TabsContent value="ios" className="space-y-3 mt-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              No Safari
            </p>
            <StepItem step={1} icon="□↑" text='Toque no botão compartilhar ⎙ na barra inferior' />
            <StepItem step={2} icon="➕" text='Role e toque em "Adicionar à Tela de Início"' />
            <StepItem step={3} icon="✅" text='Confirme tocando em "Adicionar"' />
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-3 rounded-lg bg-primary/5 border border-primary/10">
          <p className="text-xs text-muted-foreground text-center">
            💡 Após instalar, o Ágata aparecerá na sua tela inicial como um app independente
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
