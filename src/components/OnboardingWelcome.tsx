import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, FolderOpen, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface OnboardingWelcomeProps {
  onDismiss: () => void;
}

const steps = [
  { icon: Upload, label: 'Upload', description: 'Envie seu áudio ou vídeo', color: 'from-purple-500 to-purple-600' },
  { icon: FileText, label: 'Transcrição', description: 'IA transcreve automaticamente', color: 'from-emerald-500 to-teal-600' },
  { icon: FolderOpen, label: 'Documentos', description: 'Resumo e ATA prontos', color: 'from-blue-500 to-blue-600' },
];

export function OnboardingWelcome({ onDismiss }: OnboardingWelcomeProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="border-2 border-primary/20 shadow-xl bg-gradient-to-br from-white to-emerald-50/30 relative overflow-hidden">
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Bem-vindo ao Ágata! 🎙️
            </h2>
            <p className="text-muted-foreground text-lg">
              Vamos transcrever sua primeira reunião.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 mb-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.15 }}
                className="flex flex-col items-center text-center"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-3 shadow-lg`}>
                  <step.icon className="h-7 w-7 text-white" />
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs font-bold text-muted-foreground">{i + 1}.</span>
                  <span className="font-semibold text-foreground">{step.label}</span>
                </div>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute" />
                )}
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/upload">
              <Button size="lg" className="bg-primary hover:bg-emerald-600 text-primary-foreground px-8 shadow-lg">
                Fazer meu primeiro upload →
              </Button>
            </Link>
            <button
              onClick={onDismiss}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Já sei usar, fechar
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
