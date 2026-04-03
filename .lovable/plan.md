
## LinkedIn Demo Funnel — Plano de Implementação

### Fase 1 — Database + GA4 helpers
- Criar tabela `Lead` com todos os campos, indexes, RLS e trigger de `updatedAt`
- Adicionar eventos GA4 no helper `src/lib/gtag.ts`

### Fase 2 — Landing Page `/demo`
- Página pública com hero, ICP chips, benefícios, FAQ, social proof
- Captura de UTMs da URL
- Persona dinâmica no copy
- Sticky CTA mobile
- Formulário de lead capture inline

### Fase 3 — Demo Experience
- Tabs: upload áudio / colar texto
- Limite de 5min áudio / 5000 chars texto
- Chamada ao generate-summary existente
- Exibição de resumo + CTA de conversão

### Fase 4 — Signup Attribution + Checkout Attribution
- Conectar Lead ao user no signup (match por email)
- Atualizar Lead no checkout/pagamento via stripe-webhook

### Fase 5 — Email Templates + Follow-up
- Templates: demo-ready, demo-followup-24h, demo-followup-72h
- Edge function `followup-demo-leads` com lógica de cron
- Campos `demoFollowup24hSent` e `demoFollowup72hSent` na tabela Lead

### Fase 6 — Admin Leads View
- Página `/admin/leads` com tabela, filtros, busca, ações básicas

### Notas
- Não altera páginas existentes além de signup attribution
- Reutiliza generate-summary e send-email existentes
- MVP funcional, com comentários para futuras melhorias
