import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, FileText, Brain, Repeat, Layers, LayoutTemplate } from 'lucide-react';

const features = [
  { icon: Mic, title: 'Transcrição Automática', description: 'Envie áudios em MP3, WAV, M4A e mais. IA transcreve com alta precisão em PT-BR.' },
  { icon: Brain, title: 'Resumo Executivo', description: 'Resumos estruturados com decisões, ações e próximos passos gerados automaticamente.' },
  { icon: FileText, title: 'Ata em PDF + Word', description: 'Gere atas profissionais prontas para compartilhar, em PDF e Word, com um clique.' },
  { icon: Repeat, title: 'Rotinas de Reunião', description: 'Agrupe reuniões recorrentes e acompanhe a evolução de cada série automaticamente.' },
  { icon: Layers, title: 'Consolidação de Reuniões', description: 'Consolide múltiplas reuniões em um único resumo executivo para visão estratégica.' },
  { icon: LayoutTemplate, title: 'Templates Customizados', description: 'Use templates adaptados ao seu tipo de reunião: sprint, 1:1, board, comitê e mais.' },
];

export function FeaturesSection() {
  return (
    <section id="recursos" className="py-20 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary mb-2 tracking-wide uppercase">Recursos</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Tudo que sua reunião precisa, em um só lugar
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Da transcrição à documentação final — automatize o trabalho manual e foque no que importa.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow border-border bg-card">
                <CardContent className="p-6">
                  <div className="w-11 h-11 rounded-xl bg-secondary text-primary flex items-center justify-center mb-4">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1.5">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
