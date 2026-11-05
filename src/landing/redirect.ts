/**
 * Where the landing should send the visitor instead of rendering, or null to stay.
 * The app used to live at `/`: old `/#/journal` links and installed PWAs (whose
 * start_url was `/`) must still land in the app.
 */
export function appRedirectTarget(hash: string, standalone: boolean): string | null {
  if (hash.startsWith('#/')) return `/app/${hash}`;
  if (standalone) return '/app/';
  return null;
}
