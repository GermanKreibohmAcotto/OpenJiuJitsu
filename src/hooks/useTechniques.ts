import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { db } from '../db/db';
import type { Technique } from '../domain/types';

/** Live list of every technique (undefined while loading). */
export function useTechniques(): Technique[] | undefined {
  return useLiveQuery(() => db.techniques.toArray(), []);
}

/** Live id -> technique map, for resolving ids stored in plans and sessions. */
export function useTechniqueMap(): Map<string, Technique> {
  const techniques = useTechniques();
  return useMemo(() => new Map((techniques ?? []).map((t) => [t.id, t])), [techniques]);
}
