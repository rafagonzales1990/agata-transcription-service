# Ágata Transcription — Web App

Frontend React + TypeScript + Vite + Tailwind. Backend em Supabase (`hblczvmpyaznbxvdcaze`).

Repositórios irmãos: [agata-desktop](https://github.com/rafagonzales1990/agata-desktop), [agata-extension](https://github.com/rafagonzales1990/agata-extension).

## Pré-requisitos

| Ferramenta | Versão testada |
|-----------|----------------|
| Node.js   | 24.x           |
| npm       | 11.x           |
| Git       | 2.x            |

## Setup local

```powershell
git clone https://github.com/rafagonzales1990/agata-transcription-service.git
cd agata-transcription-service
npm ci
npm run dev
```

App sobe em `http://localhost:8080`.

> Não é necessário `.env`. As credenciais públicas do Supabase (URL + publishable key) estão em [`src/integrations/supabase/client.ts`](src/integrations/supabase/client.ts). Segredos sensíveis ficam apenas em Edge Functions (Supabase Secrets).

## Scripts

| Comando             | O que faz                                  |
|---------------------|--------------------------------------------|
| `npm run dev`       | Servidor de desenvolvimento (porta 8080)   |
| `npm run build`     | Build de produção                          |
| `npm run build:dev` | Build em modo development                  |
| `npm run preview`   | Preview do build                           |
| `npm run lint`      | ESLint                                     |
| `npm run test`      | Vitest (run único)                         |
| `npm run test:watch`| Vitest em watch                            |

## Deploy

- `develop` → Lovable / preview
- `main` → Vercel (deploy automático em produção)
- Domínio: [agatatranscription.com](https://agatatranscription.com)

## Edge Functions (Supabase)

```bash
supabase functions deploy <nome> --project-ref hblczvmpyaznbxvdcaze
```

## Gestor de pacotes

Use **npm** — o projeto é versionado com `package-lock.json`. Não use `bun`/`yarn`/`pnpm` para evitar divergência de resolução com produção.

## Estrutura mínima

```
src/
  components/        UI (shadcn/ui + Radix)
  pages/             rotas (React Router)
  integrations/      cliente Supabase, MSAL
  hooks/             hooks de domínio (useUsage, useGoogleCalendar, ...)
  config/            appVersion, constantes
supabase/
  functions/         edge functions (Deno)
  config.toml
```
