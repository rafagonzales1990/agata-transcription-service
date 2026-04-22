# Ágata Transcription — Contexto para Claude Code

## Papel
Você é o Arquiteto Fullstack Sênior e CTO da RGM Consulting.
Vá direto ao ponto técnico. Nunca snippets parciais — sempre arquivos completos.

## Stack
- Frontend: React + TypeScript + Tailwind via Lovable
- Backend: Supabase ID `hblczvmpyaznbxvdcaze`
- IA: CASCADE `gemini-2.5-flash` → `gemini-2.0-flash` → OpenAI Whisper-1/GPT-4o-mini | endpoint `v1beta`
- Embeddings: `gemini-embedding-001` v1beta, outputDimensionality: 768
- Pagamentos: Stripe Live
- Email: Resend
- Monitoramento: Sentry

## Regras Críticas
- Supabase: SEMPRE `.maybeSingle()` — NUNCA `.single()`
- SQL: colunas camelCase com aspas duplas (`"planId"`, `"createdAt"`)
- Tabelas: PascalCase com aspas (`"Meeting"`, `"User"`, `"Plan"`, `"Usage"`)
- NUNCA expor chaves de API no frontend — sempre Edge Functions + Secrets
- Primeira hipótese em falha silenciosa: RLS
- **RLS recursiva**: NUNCA usar subqueries que referenciam tabelas com RLS ativa dentro de policies — causa recursão infinita e quebra todas as queries. Usar `SECURITY DEFINER` functions em vez de subqueries diretas.

## ⚠️ REGRAS ABSOLUTAS — JAMAIS ALTERAR

### Gemini Model
- Modelo atual: `gemini-2.5-flash` (CASCADE: 2.5 → 2.0 → OpenAI)
- NUNCA trocar para: preview, flash-latest, 1.5, flash-preview-04-17 ou qualquer variante não estável
- Qualquer troca do modelo pode causar falha silenciosa em produção

### Supabase Queries
- SEMPRE `.maybeSingle()` — NUNCA `.single()`
- Tabelas com aspas duplas: "Meeting", "User", "Plan", "Usage"
- Colunas camelCase com aspas: "planId", "createdAt", "userId"

## Versão atual
- Web App: v1.4.0 (`src/config/appVersion.ts`)
- Desktop: v1.0.4
- Extensão Chrome: v1.0.2 ✅ aprovada

## Histórico de Releases

### v1.4.0 — Enterprise Admin — 22/04/2026

| Feature | Detalhe |
|---------|---------|
| Enterprise Admin | Rota /enterprise/admin com acesso role=enterprise_admin ou isTeamOwner=true |
| Dashboard | 4 cards (membros, reuniões mês, minutos, convites) + gráfico Recharts por membro (4 semanas) |
| Membros | Tabela com uso individual, convidar, remover, convites pendentes |
| Reuniões do Time | Todas as reuniões scoped ao teamId, filtros por membro/status |
| Projetos do Time | Projetos compartilhados (teamId), criar/editar |
| Configurações | Nome/empresa, dissolver time (owner), sair do time (membro) |
| Sidebar | "Painel do Time" visível apenas para enterprise_admin/isTeamOwner |
| health-check | Testa gemini-2.5 e gemini-2.0 em paralelo, sempre retorna 200 |

### HOTFIXES — 22/04/2026

| Fix | Detalhe |
|-----|---------|
| CPF modal timing | `userDataLoaded` bloqueia modal até query terminar |
| CPF modal condição | `userDataLoaded && !hasCompletedOnboarding && !userCpf` — sem dependência de isAdmin |
| CPF modal botão X | `onDismiss` simples sem navigate/signOut; modal volta na próxima visita |
| RLS recursiva | Policies enterprise_admin com subquery em User/Meeting causavam loop — removidas |
| Cache entre sessões | `queryClient.clear()` no SIGNED_OUT event |
| health-check 200 | Sempre retorna 200; erros no payload; alerta só se ambos Gemini falharem |

### v1.3.0 — Projetos — 22/04/2026

| Feature | Detalhe |
|---------|---------|
| Página /projects | Organização de reuniões por projeto/cliente |
| Modal criar/editar | Nome, descrição, 8 cores preset |
| Compartilhar com time | Toggle Enterprise para projetos scoped ao teamId |
| Bulk categorizar | Modal para categorizar reuniões em lote |
| Filtro "Sem projeto" | Na página de Reuniões |
| Badge por projeto | Badge colorido na lista de reuniões |
| Upload com projeto | Select de projeto no upload de reunião |
| Limites por plano | basic=3, inteligente=10, automacao=30, enterprise=ilimitado |
| maxProjects | Coluna adicionada na tabela Plan |
| RLS Projetos | Usuário vê próprios projetos + projetos do time (teamId) |

### DEV 5 — 22/04/2026

| Feature | Detalhe |
|---------|---------|
| Counter de uso | Banco corrigido (gabrielcastroesilva zerado); hook useUsage corrigido: currentMonth format, maybeSingle, auto-refresh via Realtime |
| Stripe | 3 webhooks mortos excluídos; teste CLI com 200 OK; secret revertido e revogado; price IDs todos ativos confirmados |
| Chrome Web Store | Extensão aprovada e pública (hhefgnokghkmeekjjpaipjmfhnhbnpjb) |
| Card DEV status | Breakdown completed/failed/processing com totais |
| Markdown rendering | SharedMeeting migrado para markdown-rendered + overflow-x-auto |
| check-trials bug | Root cause: query em profiles.trial_ends_at em vez de User.trialEndsAt; corrigido e deployado; 4 e-mails de expiração enviados manualmente |
| Gemini cascade | 4 edge functions: gemini-2.5-flash → gemini-2.0-flash → OpenAI; provider logado no TranscriptionLog |
| v1.2.0 versionamento | package.json, appVersion.ts, CLAUDE.md atualizados |
| v1.3.0 Projetos | Página /projects, modal criar/editar, bulk categorizar, filtro histórico, badge, upload, limites por plano |

### DEV 11 — Resiliência e Monitoramento (v1.1.1) ✅ — 22/04/2026

| Feature | Detalhe |
|---------|---------|
| Arquitetura assíncrona de transcrição | 202 imediato + EdgeRuntime.waitUntil + Realtime broadcast + polling 10s no frontend |
| Fallback OpenAI Whisper-1 | Acionado automaticamente quando Gemini retorna 503/erro |
| Fallback GPT-4o-mini | generate-summary, generate-ata, generate-followup |
| Monitor Status IAs | Edge function health-check + aba "Status IAs" no painel DEV |
| Cron de alerta por e-mail | A cada hora, e-mail para adm@ se Gemini degraded/down |
| Painel Custos por provedor | Gemini vs OpenAI com taxa de fallback % |
| Dashboard DEV corrigido | 8 cards de métricas operacionais |
| TranscriptionLog com provider | Rastreia qual AI foi usada em cada transcrição |

**Causa raiz do dia:** Gemini API com instabilidade generalizada (503) em 22/04/2026.
**Secrets adicionados:** OPENAI_API_KEY
**Regra crítica:** GEMINI_MODEL = 'gemini-2.0-flash' (2.5-flash instável no v1beta)

## Planos
- basic (Gratuito), inteligente (Essencial R$49/mês), automacao (Pro R$183/mês), enterprise

## Deploy de Edge Functions
supabase functions deploy <nome> --project-ref hblczvmpyaznbxvdcaze

## Design System
- Primary: Emerald 600 #059669
- Dark mode base: Green Navy #0D1F2D
- Tipografia app: Inter | Marketing: Poppins
- Tom: corporativo, PT-BR, minimalista