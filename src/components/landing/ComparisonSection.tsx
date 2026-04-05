import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

type CellStatus = 'check' | 'partial' | 'no';

interface CompRow {
  feature: string;
  agata: { status: CellStatus; label: string };
  fireflies: { status: CellStatus; label: string };
  otter: { status: CellStatus; label: string };
  sonix: { status: CellStatus; label: string };
}

const rows: CompRow[] = [
  {
    feature: 'PT-BR nativo e preciso',
    agata: { status: 'check', label: 'Alta precisão' },
    fireflies: { status: 'partial', label: 'Limitado' },
    otter: { status: 'partial', label: 'Limitado' },
    sonix: { status: 'partial', label: 'Limitado' },
  },
  {
    feature: 'ATA em PDF + Word',
    agata: { status: 'check', label: 'PDF + Word' },
    fireflies: { status: 'no', label: 'Não tem' },
    otter: { status: 'no', label: 'Não tem' },
    sonix: { status: 'no', label: 'Não tem' },
  },
  {
    feature: 'Resumo Executivo',
    agata: { status: 'check', label: 'Incluído' },
    fireflies: { status: 'partial', label: 'Limitado' },
    otter: { status: 'check', label: 'Incluído' },
    sonix: { status: 'partial', label: 'Básico' },
  },
  {
    feature: 'Rotinas de Reunião',
    agata: { status: 'check', label: 'Exclusivo' },
    fireflies: { status: 'no', label: 'Não tem' },
    otter: { status: 'no', label: 'Não tem' },
    sonix: { status: 'no', label: 'Não tem' },
  },
  {
    feature: 'Consolidação de reuniões',
    agata: { status: 'check', label: 'Incluído' },
    fireflies: { status: 'no', label: 'Não tem' },
    otter: { status: 'no', label: 'Não tem' },
    sonix: { status: 'no', label: 'Não tem' },
  },
  {
    feature: 'Templates customizados',
    agata: { status: 'check', label: 'Incluído' },
    fireflies: { status: 'no', label: 'Não tem' },
    otter: { status: 'no', label: 'Não tem' },
    sonix: { status: 'no', label: 'Não tem' },
  },
  {
    feature: 'Plano gratuito',
    agata: { status: 'check', label: '5 transcrições' },
    fireflies: { status: 'partial', label: '800 min' },
    otter: { status: 'partial', label: '300 min' },
    sonix: { status: 'partial', label: 'Pay-per-use' },
  },
  {
    feature: 'Preço entrada pago',
    agata: { status: 'check', label: 'R$ 61/mês' },
    fireflies: { status: 'partial', label: 'R$ 58/mês*' },
    otter: { status: 'partial', label: 'R$ 48/mês*' },
    sonix: { status: 'partial', label: 'R$ 128/mês*' },
  },
  {
    feature: 'Cobrança extra por IA',
    agata: { status: 'check', label: 'Não tem' },
    fireflies: { status: 'partial', label: '20 créditos' },
    otter: { status: 'check', label: 'Não tem' },
    sonix: { status: 'partial', label: 'R$58/hora' },
  },
  {
    feature: 'Suporte em PT-BR',
    agata: { status: 'check', label: 'Nativo' },
    fireflies: { status: 'no', label: 'Inglês' },
    otter: { status: 'no', label: 'Inglês' },
    sonix: { status: 'no', label: 'Inglês' },
  },
  {
    feature: 'Upload de arquivo (sem bot)',
    agata: { status: 'check', label: 'Ilimitado' },
    fireflies: { status: 'check', label: 'Sim' },
    otter: { status: 'partial', label: 'Limitado' },
    sonix: { status: 'check', label: 'Sim' },
  },
];

function StatusIcon({ status }: { status: CellStatus }) {
  if (status === 'check') return <CheckCircle className="h-4 w-4 text-primary shrink-0" />;
  if (status === 'partial') return <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />;
  return <XCircle className="h-4 w-4 text-destructive/60 shrink-0" />;
}

function CellBg({ status }: { status: CellStatus }) {
  if (status === 'check') return 'bg-secondary/50';
  if (status === 'partial') return 'bg-yellow-50';
  return 'bg-red-50/50';
}

export function ComparisonSection() {
  return (
    <section id="comparativo" className="py-20 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary mb-2 tracking-wide uppercase">Comparativo</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Ágata vs Concorrentes
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">
            Comparação honesta e atualizada. *USD convertido @ R$5,80 · Dados: Abril 2026
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm"
        >
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="bg-foreground text-background">
                <th className="text-left px-5 py-4 font-semibold text-sm rounded-tl-2xl">Recurso</th>
                <th className="px-5 py-4 font-semibold text-sm bg-primary/90 text-primary-foreground">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="font-bold">🪨 Ágata</span>
                    <span className="text-[10px] opacity-80 font-normal">agatatranscription.com</span>
                  </div>
                </th>
                <th className="px-5 py-4 font-semibold text-sm text-center">Fireflies.ai</th>
                <th className="px-5 py-4 font-semibold text-sm text-center">Otter.ai</th>
                <th className="px-5 py-4 font-semibold text-sm text-center rounded-tr-2xl">Sonix</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={`border-t border-border ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                  <td className="px-5 py-3.5 font-medium text-foreground">{row.feature}</td>
                  <td className={`px-5 py-3.5 text-center ${CellBg({ status: row.agata.status })}`}>
                    <span className="inline-flex items-center justify-center gap-1.5 text-sm">
                      <StatusIcon status={row.agata.status} />
                      <span className="font-medium text-foreground">{row.agata.label}</span>
                    </span>
                  </td>
                  {[row.fireflies, row.otter, row.sonix].map((cell, j) => (
                    <td key={j} className={`px-5 py-3.5 text-center ${CellBg({ status: cell.status })}`}>
                      <span className="inline-flex items-center justify-center gap-1.5 text-sm">
                        <StatusIcon status={cell.status} />
                        <span className="text-muted-foreground">{cell.label}</span>
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          ✓ Vantagem exclusiva &nbsp; ⚠ Parcial &nbsp; ✕ Não disponível
        </p>
      </div>
    </section>
  );
}
