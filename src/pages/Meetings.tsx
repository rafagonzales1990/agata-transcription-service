import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function MeetingsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reuniões</h1>
            <p className="text-muted-foreground">Gerencie suas transcrições</p>
          </div>
          <Link to="/upload">
            <Button className="bg-primary hover:bg-emerald-600 text-primary-foreground">
              Nova Transcrição
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <FolderOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <h3 className="font-medium text-foreground mb-1">Nenhuma reunião encontrada</h3>
              <p className="text-sm text-muted-foreground mb-4">Suas transcrições aparecerão aqui após o primeiro upload</p>
              <Link to="/upload">
                <Button variant="outline">Fazer Upload</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
