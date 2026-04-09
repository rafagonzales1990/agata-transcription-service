export interface MeetingTemplate {
  value: string;
  label: string;
  group: string;
}

export const MEETING_TEMPLATES: MeetingTemplate[] = [
  { value: 'geral', label: '📋 Reunião Geral', group: 'Geral' },
  { value: 'juridico_audiencia', label: '⚖️ Audiência Jurídica', group: 'Jurídico' },
  { value: 'juridico_entrevista', label: '⚖️ Entrevista Jurídica', group: 'Jurídico' },
  { value: 'rh_entrevista', label: '👥 Entrevista RH', group: 'Recursos Humanos' },
  { value: 'rh_pdi', label: '👥 PDI / Feedback', group: 'Recursos Humanos' },
  { value: 'marketing_estrategia', label: '📣 Estratégia de Marketing', group: 'Marketing' },
  { value: 'marketing_planejamento', label: '📣 Planejamento de Marketing', group: 'Marketing' },
  { value: 'engenharia_projetos', label: '🔧 Projetos de Engenharia', group: 'Engenharia' },
  { value: 'engenharia_obra', label: '🔧 Reunião de Obra', group: 'Engenharia' },
  { value: 'ti_sprint', label: '💻 Sprint / Ágil', group: 'Tecnologia' },
  { value: 'financeiro', label: '💰 Reunião Financeira', group: 'Financeiro' },
  { value: 'comercial', label: '🤝 Reunião Comercial', group: 'Comercial' },
];

export const MEETING_TEMPLATE_GROUPS = [
  'Geral', 'Jurídico', 'Recursos Humanos', 'Marketing',
  'Engenharia', 'Tecnologia', 'Financeiro', 'Comercial',
];

export const TEMPLATE_LABELS: Record<string, string> = {
  geral: 'Ata Geral',
  juridico_audiencia: 'Ata de Audiência',
  juridico_entrevista: 'Ata Jurídica - Entrevista',
  rh_entrevista: 'Ata RH - Entrevista',
  rh_pdi: 'Ata RH - PDI',
  marketing_estrategia: 'Ata Marketing - Estratégia',
  marketing_planejamento: 'Ata Marketing - Planejamento',
  engenharia_projetos: 'Ata Engenharia - Projetos',
  engenharia_obra: 'Ata Engenharia - Obra',
  ti_sprint: 'Ata TI - Sprint',
  financeiro: 'Ata Financeiro',
  comercial: 'Ata Comercial',
};
