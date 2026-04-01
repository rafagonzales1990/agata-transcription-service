import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Repeat, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RoutinesPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Rotinas</h1>
            <p className="text-muted-foreground">Agende transcrições recorrentes</p>
          </div>
          <Button className="bg-primary hover:bg-emerald-600 text-primary-foreground" onClick={() => {}}>
            <Plus className="h-4 w-4 mr-2" /> Nova Rotina
          </Button>
        </div>

        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <Repeat className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <h3 className="font-medium text-foreground mb-1">Nenhuma rotina configurada</h3>
              <p className="text-sm text-muted-foreground">Crie rotinas para reuniões recorrentes</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
