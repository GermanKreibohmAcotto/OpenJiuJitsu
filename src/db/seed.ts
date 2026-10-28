import { db } from './db';
import { SEED_ADDED_IN, SEED_TECHNIQUES } from './seedData';

export const SEEDED_KEY = 'seededVersion';
export const SEED_VERSION = 2;

/**
 * Loads the built-in technique library on first run. The marker in `meta`
 * prevents reseeding after the user edits or deletes seeded techniques.
 * When the marker is older than SEED_VERSION, only techniques introduced after it
 * are added (never overwriting or restoring anything the user already has).
 */
export function ensureSeeded(): Promise<void> {
  return db.transaction('rw', db.techniques, db.meta, async () => {
    const marker = await db.meta.get(SEEDED_KEY);
    if (!marker) {
      await db.techniques.bulkPut(SEED_TECHNIQUES);
      await db.meta.put({ key: SEEDED_KEY, value: SEED_VERSION });
      return;
    }

    const installed = typeof marker.value === 'number' ? marker.value : 1;
    if (installed >= SEED_VERSION) return;

    const incoming = SEED_TECHNIQUES.filter((t) => (SEED_ADDED_IN.get(t.id) ?? 1) > installed);
    const present = await db.techniques.bulkGet(incoming.map((t) => t.id));
    const toAdd = incoming.filter((_, i) => !present[i]);
    await db.techniques.bulkAdd(toAdd);

    // Keep counterpart links symmetric for techniques the user already had.
    for (const technique of toAdd) {
      for (const counterpartId of technique.counterpartIds) {
        const counterpart = await db.techniques.get(counterpartId);
        if (counterpart && !counterpart.counterpartIds.includes(technique.id)) {
          await db.techniques.update(counterpartId, { counterpartIds: [...counterpart.counterpartIds, technique.id] });
        }
      }
    }
    await db.meta.put({ key: SEEDED_KEY, value: SEED_VERSION });
  });
}
