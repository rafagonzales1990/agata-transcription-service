import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { FolderOpen } from 'lucide-react';

export default function DocumentsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documentos</h1>
          <p className="text-muted-foreground">ATAs e resumos gerados</p>
        </div>

        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <FolderOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <h3 className="font-medium text-foreground mb-1">Nenhum documento encontrado</h3>
              <p className="text-sm text-muted-foreground">Documentos gerados a partir de transcrições aparecerão aqui</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
