import { db } from './db';
import { newId, nowIso } from './ids';
import type { Technique } from '../domain/types';

export type TechniqueInput = Omit<Technique, 'id' | 'builtin' | 'createdAt' | 'updatedAt'> & { id?: string };

export function listTechniques(): Promise<Technique[]> {
  return db.techniques.toArray();
}

export function getTechnique(id: string): Promise<Technique | undefined> {
  return db.techniques.get(id);
}

function withLink(technique: Technique, id: string, linked: boolean, updatedAt: string): Technique {
  const has = technique.counterpartIds.includes(id);
  if (has === linked) return technique;
  const counterpartIds = linked
    ? [...technique.counterpartIds, id]
    : technique.counterpartIds.filter((c) => c !== id);
  return { ...technique, counterpartIds, updatedAt };
}

/**
 * Creates or updates a technique. Counterpart relations are kept symmetric:
 * adding B as counterpart of A also adds A to B, and removing it unlinks both.
 * Self links and ids of missing techniques are dropped.
 */
export function saveTechnique(input: TechniqueInput): Promise<Technique> {
  return db.transaction('rw', db.techniques, async () => {
    const existing = input.id ? await db.techniques.get(input.id) : undefined;
    const id = existing?.id ?? input.id ?? newId();
    const now = nowIso();

    const requested = [...new Set(input.counterpartIds)].filter((c) => c !== id);
    const found = (await db.techniques.bulkGet(requested)).filter((t): t is Technique => t !== undefined);
    const counterpartIds = found.map((t) => t.id);

    const technique: Technique = {
      ...input,
      id,
      counterpartIds,
      builtin: existing?.builtin ?? false,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    const removedIds = (existing?.counterpartIds ?? []).filter((c) => !counterpartIds.includes(c));
    const removed = (await db.techniques.bulkGet(removedIds)).filter((t): t is Technique => t !== undefined);

    await db.techniques.bulkPut([
      technique,
      ...found.map((t) => withLink(t, id, true, now)),
      ...removed.map((t) => withLink(t, id, false, now)),
    ]);
    return technique;
  });
}

/** Deletes a technique and unlinks it from its counterparts. Plans and sessions keep the dangling id. */
export function deleteTechnique(id: string): Promise<void> {
  return db.transaction('rw', db.techniques, async () => {
    const existing = await db.techniques.get(id);
    if (!existing) return;
    const now = nowIso();
    const linked = (await db.techniques.bulkGet(existing.counterpartIds)).filter(
      (t): t is Technique => t !== undefined,
    );
    await db.techniques.bulkPut(linked.map((t) => withLink(t, id, false, now)));
    await db.techniques.delete(id);
  });
}
