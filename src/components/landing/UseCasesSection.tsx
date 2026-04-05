import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Scale, Users, Megaphone, Cog, DollarSign } from 'lucide-react';

const useCases = [
  {
    icon: Scale,
    title: 'Jurídico',
    description: 'Transcreva audiências, depoimentos e reuniões com clientes. Gere atas com valor documental em PDF, prontas para arquivo.',
  },
  {
    icon: Users,
    title: 'RH / People',
    description: 'Documente entrevistas, feedbacks e reuniões de performance. Mantenha registros estruturados e organizados automaticamente.',
  },
  {
    icon: Megaphone,
    title: 'Marketing',
    description: 'Registre brainstorms, planejamentos de campanha e reuniões com clientes. Transforme ideias em documentação acionável.',
  },
  {
    icon: Cog,
    title: 'Engenharia / Operações',
    description: 'Documente sprints, dailys e retrospectivas. Use rotinas para acompanhar a evolução de projetos ao longo do tempo.',
  },
  {
    icon: DollarSign,
    title: 'Financeiro / Comercial',
    description: 'Registre reuniões de forecast, comitês e negociações. Consolide reuniões de pipeline para visão estratégica.',
  },
];

export function UseCasesSection() {
  return (
    <section id="casos" className="py-20 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary mb-2 tracking-wide uppercase">Casos de Uso</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Para cada área da empresa
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ágata se adapta ao seu setor. Veja como profissionais de diferentes áreas usam a plataforma.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((uc, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
            >
              <Card className="h-full border-border hover:shadow-lg transition-shadow bg-card">
                <CardContent className="p-6">
                  <div className="w-11 h-11 rounded-xl bg-secondary text-primary flex items-center justify-center mb-4">
                    <uc.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{uc.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{uc.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
