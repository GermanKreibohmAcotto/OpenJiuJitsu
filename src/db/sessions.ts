import { db } from './db';
import { newId, nowIso } from './ids';
import type { Mode, TrainingSession } from '../domain/types';

export type SessionInput = Omit<TrainingSession, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };

export const DIFFICULTY_MIN = 1;
export const DIFFICULTY_MAX = 10;

function assertDifficulty(field: 'physicalDifficulty' | 'technicalDifficulty', value: number) {
  if (!Number.isInteger(value) || value < DIFFICULTY_MIN || value > DIFFICULTY_MAX) {
    throw new RangeError(`${field} must be an integer between ${DIFFICULTY_MIN} and ${DIFFICULTY_MAX}`);
  }
}

function assertSession(input: SessionInput) {
  assertDifficulty('physicalDifficulty', input.physicalDifficulty);
  assertDifficulty('technicalDifficulty', input.technicalDifficulty);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new RangeError('date must be yyyy-mm-dd');
  if (!(input.durationMin >= 0)) throw new RangeError('durationMin must be zero or positive');
  if (!(input.sparringRounds >= 0)) throw new RangeError('sparringRounds must be zero or positive');
}

/** Newest first; same-day sessions by creation time, newest first. */
export async function listSessions(): Promise<TrainingSession[]> {
  const all = await db.sessions.toArray();
  return all.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export function getSession(id: string): Promise<TrainingSession | undefined> {
  return db.sessions.get(id);
}

export async function saveSession(input: SessionInput): Promise<TrainingSession> {
  assertSession(input);
  const existing = input.id ? await db.sessions.get(input.id) : undefined;
  const now = nowIso();
  const session: TrainingSession = {
    ...input,
    id: existing?.id ?? input.id ?? newId(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await db.sessions.put(session);
  return session;
}

export function deleteSession(id: string): Promise<void> {
  return db.sessions.delete(id);
}

export interface SubmissionRecord {
  date: string;
  mode: Mode;
  techniqueId: string;
  outcome: 'achieved' | 'suffered';
}

/**
 * Adds a sparring round with a submission to the latest session of `date`
 * (same mode), creating a minimal session when there is none.
 */
export function recordSubmission(record: SubmissionRecord): Promise<TrainingSession> {
  return db.transaction('rw', db.sessions, async () => {
    const sameDay = (await db.sessions.where('date').equals(record.date).toArray())
      .filter((s) => s.mode === record.mode)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const base: SessionInput = sameDay[0] ?? {
      date: record.date,
      durationMin: 0,
      mode: record.mode,
      physicalDifficulty: 5,
      technicalDifficulty: 5,
      feelings: [],
      sparringRounds: 0,
      subsAchieved: [],
      subsSuffered: [],
      notes: '',
    };
    const key = record.outcome === 'achieved' ? 'subsAchieved' : 'subsSuffered';
    return saveSession({
      ...base,
      sparringRounds: base.sparringRounds + 1,
      [key]: [...base[key], record.techniqueId],
    });
  });
}
