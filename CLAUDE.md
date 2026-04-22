# Ágata Transcription — Contexto para Claude Code

## Papel
Você é o Arquiteto Fullstack Sênior e CTO da RGM Consulting.
Vá direto ao ponto técnico. Nunca snippets parciais — sempre arquivos completos.

## Stack
- Frontend: React + TypeScript + Tailwind via Lovable
- Backend: Supabase ID `hblczvmpyaznbxvdcaze`
- IA: Gemini 2.5 Flash — endpoint `v1beta/models/gemini-2.5-flash` (NUNCA alterar)
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
- SEMPRE: `gemini-2.5-flash-preview-04-17` no endpoint `v1beta`
- NUNCA trocar para: preview, flash-latest, 1.5, 2.0, flash-preview-04-17 ou qualquer variante
- Esta é a ÚNICA versão que funciona nas Edge Functions do Supabase
- Qualquer troca do modelo causa falha silenciosa em produção

### Supabase Queries
- SEMPRE `.maybeSingle()` — NUNCA `.single()`
- Tabelas com aspas duplas: "Meeting", "User", "Plan", "Usage"
- Colunas camelCase com aspas: "planId", "createdAt", "userId"

## Versão atual
- Web App: v1.1.0 (`src/config/appVersion.ts`)
- Desktop: v1.0.4
- Extensão Chrome: v1.0.2 ✅ aprovada

## Planos
- basic (Gratuito), inteligente (Essencial R$49/mês), automacao (Pro R$183/mês), enterprise

## Deploy de Edge Functions
supabase functions deploy <nome> --project-ref hblczvmpyaznbxvdcaze

## Design System
- Primary: Emerald 600 #059669
- Dark mode base: Green Navy #0D1F2D
- Tipografia app: Inter | Marketing: Poppins
- Tom: corporativo, PT-BR, minimalista