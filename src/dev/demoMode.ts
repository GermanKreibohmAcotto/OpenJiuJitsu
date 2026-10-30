import Dexie from 'dexie';

/** localStorage key of the dev-only demo flag. */
export const DEMO_FLAG_KEY = 'ojj.demo';
export const DEMO_DB_NAME = 'openjiujitsu-demo';
const REAL_DB_NAME = 'openjiujitsu';

/** Database name for the given mode. */
export const databaseName = (demo: boolean): string => (demo ? DEMO_DB_NAME : REAL_DB_NAME);

/** Dev only: `?demo` turns the flag on and drops the parameter from the address. */
function applyDemoParam(): void {
  if (!import.meta.env.DEV) return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has('demo')) return;
  localStorage.setItem(DEMO_FLAG_KEY, '1');
  url.searchParams.delete('demo');
  window.history.replaceState(null, '', url);
}

applyDemoParam();

// Read once at startup: the database singleton is opened with this value, so it can't change until a reload.
const demoMode = import.meta.env.DEV && localStorage.getItem(DEMO_FLAG_KEY) === '1';

/** Always false in production builds, which therefore never open the demo database. */
export const isDemoMode = (): boolean => demoMode;

/** Persists the flag and reloads so the app reopens with the matching database. */
export function setDemoMode(on: boolean): void {
  if (on) localStorage.setItem(DEMO_FLAG_KEY, '1');
  else localStorage.removeItem(DEMO_FLAG_KEY);
  window.location.reload();
}

/** Deletes the demo database and reloads, so it is seeded and filled again from scratch. */
export async function resetDemo(): Promise<void> {
  await Dexie.delete(DEMO_DB_NAME);
  window.location.reload();
}
