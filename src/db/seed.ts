import { db } from './db';
import { SEED_TECHNIQUES } from './seedData';

export const SEEDED_KEY = 'seededVersion';
export const SEED_VERSION = 1;

/**
 * Loads the built-in technique library on first run. The marker in `meta`
 * prevents reseeding after the user edits or deletes seeded techniques.
 */
export function ensureSeeded(): Promise<void> {
  return db.transaction('rw', db.techniques, db.meta, async () => {
    const marker = await db.meta.get(SEEDED_KEY);
    if (marker) return;
    await db.techniques.bulkPut(SEED_TECHNIQUES);
    await db.meta.put({ key: SEEDED_KEY, value: SEED_VERSION });
  });
}
