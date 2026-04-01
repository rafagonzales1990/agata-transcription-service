import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileAudio, Upload, TrendingUp, Clock, Zap, ArrowRight, FolderOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const stats = [
  { label: 'Reuniões', value: '0', icon: FileAudio, color: 'text-primary' },
  { label: 'Minutos Transcritos', value: '0', icon: Clock, color: 'text-primary' },
  { label: 'Transcrições Usadas', value: '0/5', icon: TrendingUp, color: 'text-primary' },
  { label: 'Plano Atual', value: 'Teste Grátis', icon: Zap, color: 'text-primary' },
];

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Bem-vindo ao Ágata Transcription</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Começar Nova Transcrição</CardTitle>
              <CardDescription>Envie um áudio ou grave diretamente</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/upload">
                <Button className="bg-primary hover:bg-emerald-600 text-primary-foreground">
                  <Upload className="h-4 w-4 mr-2" /> Nova Transcrição
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reuniões Recentes</CardTitle>
              <CardDescription>Suas últimas transcrições</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma reunião ainda</p>
                <p className="text-xs">Faça seu primeiro upload para começar</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
