/**
 * Ágata Transcription — App Version (Single Source of Truth)
 *
 * Semantic Versioning rules for Ágata:
 *
 * PATCH (v0.9.1): bug fixes, small improvements, no breaking changes
 *   Ex: "Tabela PDF quebrada", "Botão Stripe falhou", "Upload travou"
 *
 * MINOR (v0.10.0): new features, backward compatible
 *   Ex: "Página de planos ativa", "Download Word", "Chunking 20MB"
 *
 * MAJOR (v1.0.0): breaking changes, new architecture, major refactor
 *   Ex: "Migração Supabase completa", "Billing Stripe v2", "Multi-tenant"
 *
 * ── Release flow ──
 * 1. Finish changes in Lovable
 * 2. Bump version below (PATCH/MINOR/MAJOR)
 * 3. Add 1-3 bullets to changelog
 * 4. Test in preview
 * 5. Publish
 *
 * ── Future automation ──
 * - Read version from package.json via import.meta.env
 * - Inject git commit hash at build time (VITE_COMMIT_SHA)
 * - Use CI/CD to auto-bump on merge to main
 */

export const appVersion = {
  version: 'v0.9.5',
  releaseDate: '2026-04-06',
  environmentLabel: (import.meta.env.MODE === 'production' ? 'production' : 'dev') as string,
  changelog: [
    'Compartilhamento público de reuniões',
    'Busca e filtros no histórico de reuniões',
    'Onboarding do primeiro uso',
    'Google AdSense para usuários trial/basic com fallback 10s',
    'Banners de upgrade Pro (sidebar + footer)',
    'GTM (GTM-T63TT8CJ) integrado no index.html',
  ],
} as const;
