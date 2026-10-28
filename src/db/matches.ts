import { db } from './db';
import { newId, nowIso } from './ids';
import type { SparringMatch } from '../domain/types';

export type MatchInput = Omit<SparringMatch, 'id' | 'createdAt'>;

/** Newest first. */
export async function listMatches(): Promise<SparringMatch[]> {
  const all = await db.matches.toArray();
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveMatch(input: MatchInput): Promise<SparringMatch> {
  const match: SparringMatch = { ...input, id: newId(), createdAt: nowIso() };
  await db.matches.add(match);
  return match;
}

export function deleteMatch(id: string): Promise<void> {
  return db.matches.delete(id);
}

export function getMatch(id: string): Promise<SparringMatch | undefined> {
  return db.matches.get(id);
}
