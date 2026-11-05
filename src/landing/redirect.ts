/**
 * Where the landing should send the visitor instead of rendering, or null to stay.
 * The app used to live at the site root: old `/#/journal` links and installed PWAs
 * (whose start_url was the root) must still land in the app. `base` is the Vite base
 * the site is served from (`/` or a subpath such as `/OpenJiuJitsu/`).
 */
export function appRedirectTarget(hash: string, standalone: boolean, base = '/'): string | null {
  const app = `${base}app/`;
  if (hash.startsWith('#/')) return `${app}${hash}`;
  if (standalone) return app;
  return null;
}
