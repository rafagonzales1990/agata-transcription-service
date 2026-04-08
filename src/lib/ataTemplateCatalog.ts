export interface SectionDefinition {
  id: string;
  key: string;
  label: string;
  description: string;
  isFixed: boolean;
}

export const FIXED_SECTION: SectionDefinition = {
  id: 'identificacao',
  key: 'identificacao',
  label: 'Identificação da Reunião',
  description: 'Título, data, hora, local, responsável e participantes',
  isFixed: true,
};

export const OPTIONAL_SECTIONS: SectionDefinition[] = [
  { id: 'pauta', key: 'pauta', label: 'Pauta / Tópicos', description: 'Assuntos discutidos', isFixed: false },
  { id: 'decisoes', key: 'decisoes', label: 'Decisões Tomadas', description: 'Resoluções e aprovações', isFixed: false },
  { id: 'acoes', key: 'acoes', label: 'Itens de Ação', description: 'Tarefas com responsável e prazo', isFixed: false },
  { id: 'riscos', key: 'riscos', label: 'Riscos e Impedimentos', description: 'Problemas identificados', isFixed: false },
  { id: 'resumo', key: 'resumo', label: 'Resumo Executivo', description: 'Síntese dos pontos principais', isFixed: false },
  { id: 'transcricao', key: 'transcricao', label: 'Transcrição Completa', description: 'Texto completo transcrito', isFixed: false },
  { id: 'proximos', key: 'proximos', label: 'Próximos Passos', description: 'Reuniões e entregas futuras', isFixed: false },
  { id: 'insights', key: 'insights', label: 'Insights e Oportunidades', description: 'Ideias levantadas', isFixed: false },
  { id: 'observacoes', key: 'observacoes', label: 'Observações Gerais', description: 'Campo livre para anotações', isFixed: false },
];

export const ALL_SECTIONS = [FIXED_SECTION, ...OPTIONAL_SECTIONS];

export const DEFAULT_ENABLED_IDS = ['identificacao', 'pauta', 'decisoes', 'acoes', 'resumo', 'proximos'];

export interface TemplateSectionData {
  id: string;
  key: string;
  label: string;
  enabled: boolean;
  order: number;
  instruction: string | null;
  isFixed: boolean;
}

export function buildDefaultSections(): TemplateSectionData[] {
  return ALL_SECTIONS.map((s, i) => ({
    id: s.id,
    key: s.key,
    label: s.label,
    enabled: DEFAULT_ENABLED_IDS.includes(s.id),
    order: DEFAULT_ENABLED_IDS.includes(s.id) ? DEFAULT_ENABLED_IDS.indexOf(s.id) + 1 : i + 10,
    instruction: null,
    isFixed: s.isFixed,
  }));
}

export const PLANS_WITH_TEMPLATES = ['inteligente', 'automacao', 'enterprise'];
