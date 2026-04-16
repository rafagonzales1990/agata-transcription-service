/**
 * Ágata Transcription — App Version (Single Source of Truth)
 *
 * Versioning:
 *   Web App:   v1.1.x
 *   Desktop:   v1.0.x
 *   Extension: v1.0.x
 *
 * Semantic Versioning rules for Ágata:
 *
 * PATCH (v1.1.1): bug fixes, small improvements, no breaking changes
 * MINOR (v1.2.0): new features, backward compatible
 * MAJOR (v2.0.0): breaking changes, new architecture, major refactor
 *
 * ── Release flow ──
 * 1. Finish changes in Lovable
 * 2. Bump version below (PATCH/MINOR/MAJOR)
 * 3. Add 1-3 bullets to changelog
 * 4. Test in preview
 * 5. Publish
 */

export const appVersion = {
  version: 'v1.1.0',
  releaseDate: '2026-04-16',
  environmentLabel: (import.meta.env.MODE === 'production' ? 'production' : 'dev') as string,
  changelog: [
    'PWA: modal de instalação com instruções Android/iOS',
    'Service worker com auto-update e versionamento',
    'Nova versão estável v1.1.0',
  ],
} as const;
