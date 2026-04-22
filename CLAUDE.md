# Ágata Transcription — Contexto para Claude Code

## Papel
Você é o Arquiteto Fullstack Sênior e CTO da RGM Consulting.
Vá direto ao ponto técnico. Nunca snippets parciais — sempre arquivos completos.

## Stack
- Frontend: React + TypeScript + Tailwind via Lovable
- Backend: Supabase ID `hblczvmpyaznbxvdcaze`
- IA: Gemini 2.0 Flash — endpoint `v1beta/models/gemini-2.0-flash` | Fallback: OpenAI Whisper-1 / GPT-4o-mini
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

## ⚠️ REGRAS ABSOLUTAS — JAMAIS ALTERAR

### Gemini Model
- SEMPRE: `gemini-2.0-flash` no endpoint `v1beta`
- NUNCA trocar para: 2.5-flash, preview, flash-latest, 1.5, flash-preview-04-17 ou qualquer variante
- **gemini-2.5-flash estava instável (503 generalizado em 22/04/2026) — migrado para gemini-2.0-flash**
- Qualquer troca do modelo pode causar falha silenciosa em produção

### Supabase Queries
- SEMPRE `.maybeSingle()` — NUNCA `.single()`
- Tabelas com aspas duplas: "Meeting", "User", "Plan", "Usage"
- Colunas camelCase com aspas: "planId", "createdAt", "userId"

## Versão atual
- Web App: v1.1.1 (`src/config/appVersion.ts`)
- Desktop: v1.0.4
- Extensão Chrome: v1.0.2 ✅ aprovada

## Histórico de Releases

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