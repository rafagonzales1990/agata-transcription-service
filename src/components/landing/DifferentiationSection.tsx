import { motion } from 'framer-motion';
import {
  Globe, FileText, Repeat, Layers, LayoutTemplate,
  CreditCard, HeadphonesIcon, Upload,
} from 'lucide-react';

const differentials = [
  { icon: Globe, title: 'Português brasileiro nativo', description: 'IA otimizada para português brasileiro com alta precisão, até em sotaques regionais.' },
  { icon: FileText, title: 'Atas e Documentos Prontos', description: 'ATA profissional em PDF e Word gerada automaticamente — pronta para enviar.' },
  { icon: Repeat, title: 'Rotinas de Reuniões', description: 'Funcionalidade exclusiva: agrupe reuniões recorrentes e acompanhe a evolução.' },
  { icon: Layers, title: 'Consolidação de Reuniões', description: 'Consolide várias reuniões em um resumo único. Perfeito para sprints e comitês.' },
  { icon: LayoutTemplate, title: 'Templates Customizados', description: 'Personalize a estrutura da ATA para cada tipo de reunião do seu time.' },
  { icon: CreditCard, title: 'Sem Cobrança Extra por IA', description: 'Resumo executivo incluso em todos os planos. Sem surpresas na fatura.' },
  { icon: HeadphonesIcon, title: 'Suporte em Português', description: 'Suporte nativo pensado para o mercado brasileiro. Sem barreiras de idioma.' },
  { icon: Upload, title: 'Upload sem Bot', description: 'Envie arquivos de áudio/vídeo diretamente. Sem precisar instalar bots em calls.' },
];

export function DifferentiationSection() {
  return (
    <section id="diferencial" className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary mb-2 tracking-wide uppercase">Diferenciais</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Por que escolher o Ágata?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Construído do zero para o mercado brasileiro. Não é uma tradução — é uma solução nativa.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {differentials.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
              className="text-center p-6 rounded-2xl border border-border bg-card hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary text-primary flex items-center justify-center mx-auto mb-4">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1.5">{item.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
