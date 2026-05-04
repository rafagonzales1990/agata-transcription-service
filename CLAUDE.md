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

## Localização dos repos (local)
Todos os repos vivem em `C:\dev\` — fora do OneDrive (double-sync OneDrive↔GitHub causava conflitos).

| Repo | Caminho local | Branch padrão |
|------|---------------|---------------|
| agata-transcription-service | `C:\dev\agata-transcription-service` | `main` |
| agata-desktop | `C:\dev\agata-desktop` | `main` |
| agata-extension | `C:\dev\agata-extension` | `main` |
| traderbi | `C:\dev\traderbi` | `develop` |

**Ferramentas adicionais:**
- Supabase CLI: `C:\dev\tools\supabase.exe` (alias `supabase` configurado no PowerShell `$PROFILE`)

**Regra:** NUNCA clonar/mover repos para dentro de `OneDrive`, `Documents` ou qualquer pasta sincronizada na nuvem. Sempre `C:\dev\<repo>`.

## Editor primário
- **VS Code** é o editor primário para TODOS os repos (`agata-transcription-service`, `agata-desktop`, `agata-extension`, `traderbi`).
- **Cursor** NÃO é mais o editor padrão — usar somente para edição visual / Live Preview pontual quando necessário.
- Aplicável tanto a `agata-transcription-service` quanto a `agata-desktop` (e demais repos).

## Linear — Labels padrão obrigatórios
Toda issue criada no Linear deve ter **NO MÍNIMO 2 labels**:

1. **Label de RESPONSÁVEL** (exatamente 1):
   - `DEV` — Claude/CTO
   - `SUPPORT` — Claude/CTO
   - `MKT` — Perplexity/CMO
   - `SALES` — Perplexity/CMO

2. **Label de CATEGORIA** (exatamente 1):
   - `Bug`
   - `Feature`
   - `Improvement`
   - `Hotfix`
   - `Validação`
   - `Tech Debt`

Issues sem ambas as labels são consideradas mal formadas e devem ser corrigidas antes de entrar no fluxo.

## Commit pattern
Padronização obrigatória de mensagens de commit:

```
feat(AGA-XX): descrição da feature
fix(AGA-XX): descrição do bug
chore: manutenção sem impacto funcional
```

- `feat` / `fix` → SEMPRE com referência à issue Linear (`AGA-XX`).
- `chore` → para manutenção sem impacto funcional (lockfile, configs, deps, docs internas) — não exige `AGA-XX`.

## Gestor de pacotes
- **Apenas `npm`** — projeto versionado via `package-lock.json`. `bun.lockb` foi removido em 02/05/2026.
- Setup: `npm ci` (não `npm install` — `ci` respeita o lockfile sem alterá-lo).
- Dev server: `npm run dev` → `http://localhost:8080`.
- Não há `.env` necessário no frontend — Supabase URL e publishable key estão hardcoded em `src/integrations/supabase/client.ts` (padrão Lovable). Segredos sensíveis vivem só em Supabase Secrets (edge functions).

## Verificação pós-clone / pós-mudança de pasta
Rodar este checklist sempre que clonar de novo, mover o repo, ou trocar de máquina:

1. **Localização correta**
   ```powershell
   pwd  # deve ser C:\dev\<repo> — nunca dentro de OneDrive/Documents
   ```
2. **Toolchain mínimo**
   ```powershell
   node --version   # >= 24.x
   npm --version    # >= 11.x
   git --version    # >= 2.x
   ```
3. **Sync com GitHub**
   ```powershell
   git remote -v                    # confirma origin = github.com/rafagonzales1990/<repo>
   git status                       # working tree clean esperado
   git branch -vv                   # confirma tracking de origin/<branch>
   git ls-remote --exit-code origin HEAD   # testa autenticação + rede
   git fetch --dry-run              # confirma que fetch funciona sem prompt
   ```
4. **Lockfile sanidade**
   ```powershell
   ls package-lock.json   # deve existir
   ls bun.lockb           # NÃO deve existir (remover se aparecer)
   ```
5. **Variáveis de ambiente esperadas**
   ```powershell
   # frontend deste repo: nenhuma .env necessária
   # se grep retornar algo, revisar antes de rodar:
   ```
   Use a tool Grep do Claude com pattern `import\.meta\.env\.VITE_` em `src/`.
6. **Install + smoke test**
   ```powershell
   npm ci
   npm run dev    # confirma que sobe na porta 8080
   npm run lint   # confirma toolchain TypeScript/ESLint OK
   ```
7. **Edge Functions (opcional, só se for mexer)**
   ```powershell
   supabase --version
   supabase link --project-ref hblczvmpyaznbxvdcaze
   ```

## Regras Críticas
- Supabase: SEMPRE `.maybeSingle()` — NUNCA `.single()`
- SQL: colunas camelCase com aspas duplas (`"planId"`, `"createdAt"`)
- Tabelas: PascalCase com aspas (`"Meeting"`, `"User"`, `"Plan"`, `"Usage"`)
- NUNCA expor chaves de API no frontend — sempre Edge Functions + Secrets
- Primeira hipótese em falha silenciosa: RLS
- **RLS recursiva**: NUNCA usar subqueries que referenciam tabelas com RLS ativa dentro de policies — causa recursão infinita e quebra todas as queries. Usar `SECURITY DEFINER` functions em vez de subqueries diretas.
- **Deploy Desktop**: SEMPRE via tag (`npm version patch` + `git push --tags`) — NUNCA fazer push direto do .exe. GitHub Actions compila e sobe para GCS automaticamente.

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
- Web App: v1.5.0 (`src/config/appVersion.ts`)
- Desktop: v1.0.5
- Extensão Chrome: v1.0.4 🔄 em revisão

## Histórico de Releases

### Migração para C:\dev — 02/05/2026

| Item | Detalhe |
|------|---------|
| Motivo | OneDrive estava fazendo double-sync com GitHub e gerando conflitos / arquivos travados |
| Origem | `C:\Users\Rafael\OneDrive\...\<repo>` |
| Destino | `C:\dev\<repo>` para todos os 4 repos (agata-transcription-service, agata-desktop, agata-extension, traderbi) |
| Sync GitHub | Verificado em todos: `origin` correto, working tree clean, tracking ativo |
| Toolchain verificado | Node 24.15.0, npm 11.12.1, Git 2.54.0 |
| `bun.lockb` removido | Repo agora é npm-only — duplicidade de lockfile era fonte de divergência |
| README.md | Substituído (era só TODO) — agora cobre setup, scripts, deploy, npm-only |
| CLAUDE.md | Adicionada seção "Localização dos repos" + "Verificação pós-clone" |

### Security Fixes — 24/04/2026

| Fix | Detalhe |
|-----|---------|
| MeetingShare | RPC `get_meeting_by_share_token` — SELECT direto bloqueado por RLS; SharedMeeting.tsx migrado para `.rpc()` |
| NurturingLog | Policy explícita `USING(false)` — acesso só via service_role |
| Functions | `SET search_path = public` em todas as funções para evitar search_path injection |
| Storage | Policy restrita ao próprio uid — sem listagem pública |

#### Azure AD configurado

| Item | Detalhe |
|------|---------|
| Client ID | `8fbbec4e-2f38-4179-8147-fff591b79d19` |
| Permissões | `User.Read`, `Calendars.Read`, `offline_access` |
| Redirect URIs | Supabase callback + `agatatranscription.com` SPA |
| Provider | Azure habilitado no Supabase Auth |

#### Pendências para amanhã

- Testar Microsoft SSO no login
- Testar Google Calendar em Configurações → Integrações
- Testar sessões ativas em Configurações → Segurança
- Aguardar extensão v1.0.3 aprovação na Store

### Hotfixes — 24/04/2026

#### Web (edge functions + infra)

| Fix | Detalhe |
|-----|---------|
| Gemini cascade | `gemini-2.0-flash` → `gemini-2.5-flash-lite` (descontinuado para novos usuários desde mar/2026) |
| Secret name | `GOOGLE_GEMINI_API_KEY` — nome correto (era `GEMINI_API_KEY` no health-check) |
| Secrets órfãos | Removidos: `rafa_rez@msn.com` e `Ágata Transcription` |
| Nurturing cron | JSON inválido no header corrigido — sem `service_role` em header HTTP |
| Health-check | Threshold: 2 falhas consecutivas antes de alertar (anti-spam) |
| Status IAs | Auth via `supabase.functions.invoke` + 3 provedores (2.5, Lite, OpenAI) |
| HealthCheckLog | Tabela criada — log histórico por provedor com latência e detalhe |

#### Extensão Chrome v1.0.3 (repo agata-extension)

| Fix | Detalhe |
|-----|---------|
| Blob >64MB | `content.js` faz upload direto ao Supabase Storage (era via background) |
| getDisplayMedia sem áudio | Aviso visual adicionado ao usuário |
| Fallback | Download local automático se upload falhar |
| Status | Submetida para revisão na Chrome Web Store |

### DEV 9 — Upgrade Overlay + Google Calendar + ATA Versions — 23/04/2026

#### Frente 1 — Tela de upgrade suave (trial expirado)

| Item | Detalhe |
|------|---------|
| Overlay | Full-screen quando `trialEndsAt < now` + sem `stripeSubscriptionId` |
| Métricas | Exibe reuniões e minutos transcritos no trial |
| CTAs | Primário → `/plans`; secundário → modo somente leitura |
| Upload bloqueado | Toast + redirect para `/plans` |
| Banner leitura | Banner persistente vermelho no topo em modo somente leitura |

#### Frente 2 — Google Calendar (read-only)

| Item | Detalhe |
|------|---------|
| OAuth | `signInWithOAuth` com scope `calendar.readonly` |
| Token | Salvo em `User.googleCalendarToken` |
| Hook | `useGoogleCalendar` — busca eventos nas próximas 24h |
| Dashboard | Card "Próximas reuniões" |
| Gravar | Botão → `/upload?title=EventTitle` (pré-preenche título) |
| Desconectar | Limpa token do banco |
| Reconectar | Automático se token expirado (401) |
| Config | Settings › Integrações |

#### Frente 3 — Histórico de versões de ATA

| Item | Detalhe |
|------|---------|
| Tabela | `AtaVersion` (meetingId, userId, ataContent, versionNumber) + RLS owner-only |
| Trigger | Salva versão atual antes de cada geração/regeneração |
| Limite | 5 versões por reunião (deleta mais antigas) |
| UI | Collapsible "Versões anteriores" na aba ATA |
| Modal | Conteúdo read-only + botão "Restaurar" |
| Restaurar | Salva versão atual antes de sobrescrever |

#### DB migrations

| Migration | Detalhe |
|-----------|---------|
| `20260423204718` | `CREATE TABLE AtaVersion` com RLS owner-only |
| `20260423205121` | `ALTER TABLE User ADD COLUMN googleCalendarToken TEXT` |

### v1.5.0 — DEV 8 — Conversão Trial — 23/04/2026

#### Banco

| Item | Detalhe |
|------|---------|
| trialEndsAt corrigido | 13 usuários sem `trialEndsAt` corrigidos: `createdAt + 14 dias` |
| isInternal | Campo adicionado na tabela `User` — exclui adm@ do nurturing |
| rafa_rez@msn.com | `trialEndsAt` ajustado para 11 dias restantes |
| NurturingLog | Tabela criada: `userId`, `emailType`, `sentAt` |

#### Edge function nurturing-emails

| Item | Detalhe |
|------|---------|
| Sequência | day1 (dia 1-2), day3 (dia 3-9), day10 (2-4 dias restantes), day13 (1 dia restante) |
| Exclusão | `isInternal = true` excluído |
| Guard | Skip se trial expirado (`daysLeft <= 0`) |
| Cron | Todo dia às 10h UTC (7h Brasília) |
| Alcance | 21 usuários elegíveis no primeiro disparo |

#### Frontend (Lovable)

| Item | Detalhe |
|------|---------|
| Checklist onboarding | Dashboard para contas < 7 dias com 0 meetings — 4 passos: conta criada, primeira transcrição, ver resumo, baixar ATA — progress bar + success state + hide após 24h |
| Status admin corrigido | `null trialEndsAt + onboarding false` → "Cadastro incompleto"; trial expirado sem subscription → "Trial expirado"; `basic + trial ativo` → badge "Trial Xd" (amber); `basic sem trial` → "Gratuito" (gray) |

### DEV 6 — Infra Desktop + Legal + RLS — 23/04/2026

#### Desktop (repo agata-desktop)

| Item | Detalhe |
|------|---------|
| GCS bucket | `agata-desktop-releases` (southamerica-east1) |
| Build automático | GitHub Actions → Windows .exe + Mac .zip no push de tag |
| Upload automático | Artefatos enviados ao GCS via Actions |
| Auto-update | `electron-updater` configurado com `latest.yml` |
| Locale pruning | `electronLanguages: pt-BR + en-US` |
| Tamanho Windows | 71 MB → 68.3 MB |
| Node.js Actions | Node 24 (`FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`) |
| Fluxo de release | `npm version patch` + `git push --tags` |

#### Web (repo agata-transcription-service)

| Item | Detalhe |
|------|---------|
| Downloads page | URLs atualizadas para GCS (Desktop v1.0.5) |
| RLS Enterprise Admin | Refeita com SECURITY DEFINER functions: `get_my_team_id`, `get_my_role`, `is_enterprise_admin` — sem recursão; policies seguras para Meeting, Usage, User, TeamInvite |
| Documentos legais | Páginas /termos, /privacidade, /eula publicadas |
| Aceite obrigatório | Checkbox no cadastro; `termsAcceptedAt` e `termsVersion` gravados na tabela User |

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

### DEV 13 — Migração Lovable → Vercel — 27/04/2026

| Item | Detalhe |
|------|---------|
| Branch develop | Criada no GitHub — Lovable commita em develop |
| Vercel | Projeto criado: `agata-transcription-service.vercel.app` |
| vercel.json | Criado na raiz — SPA routing (fix 404 em OAuth redirects) |
| DNS | Nameservers Hostinger → `ns1.vercel-dns.com` / `ns2.vercel-dns.com` |
| Propagação DNS | < 1 hora |
| Supabase Auth URLs | Atualizadas: `agatatranscription.com` + `*.vercel.app` |
| Google Cloud OAuth | Redirect URIs atualizados |
| Azure OAuth | Redirect URIs já estavam configurados |
| SSO Microsoft | Funcionando via `rafa_rez@msn.com` |
| SSO Google | Configurado (testado com novo usuário) |

**Fluxo de deploy:**
- `develop` → Lovable / VS Code (preview)
- `main` → Vercel (produção automática)
- Merge: `git checkout main && git merge develop && git push origin main`

## Planos
- basic (Gratuito), inteligente (Essencial R$49/mês), automacao (Pro R$183/mês), enterprise

## Deploy de Edge Functions
supabase functions deploy <nome> --project-ref hblczvmpyaznbxvdcaze

## Design System
- Primary: Emerald 600 #059669
- Dark mode base: Green Navy #0D1F2D
- Tipografia app: Inter | Marketing: Poppins
- Tom: corporativo, PT-BR, minimalista