import { MODES, type Mode, type ModeFilter, type TrainingSession } from '../../domain/types';

export interface SubmissionCount {
  id: string;
  count: number;
}

export interface ModeTotals {
  sessions: number;
  minutes: number;
  rounds: number;
}

export function filterByMode(sessions: TrainingSession[], filter: ModeFilter): TrainingSession[] {
  return filter === 'all' ? sessions : sessions.filter((s) => s.mode === filter);
}

export function totalMinutes(sessions: TrainingSession[]): number {
  return sessions.reduce((sum, s) => sum + s.durationMin, 0);
}

/** Hours rounded to one decimal. */
export function minutesToHours(minutes: number): number {
  return Math.round((minutes / 60) * 10) / 10;
}

export function totalSparringRounds(sessions: TrainingSession[]): number {
  return sessions.reduce((sum, s) => sum + s.sparringRounds, 0);
}

/** Submission counts (repeated ids count repeatedly), most frequent first, ties by id. */
export function countSubmissions(
  sessions: TrainingSession[],
  field: 'subsAchieved' | 'subsSuffered',
): SubmissionCount[] {
  const counts = new Map<string, number>();
  for (const session of sessions) {
    for (const id of session[field]) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return [...counts]
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
}

export function modeSplit(sessions: TrainingSession[]): Record<Mode, ModeTotals> {
  const split = Object.fromEntries(MODES.map((mode) => [mode, { sessions: 0, minutes: 0, rounds: 0 }])) as Record<
    Mode,
    ModeTotals
  >;
  for (const s of sessions) {
    split[s.mode].sessions += 1;
    split[s.mode].minutes += s.durationMin;
    split[s.mode].rounds += s.sparringRounds;
  }
  return split;
}

/** Whole days between two yyyy-mm-dd dates (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

export interface Span {
  unit: 'days' | 'months' | 'years';
  count: number;
}

/** Coarse human span: days under two months, months under two years, years (one decimal) beyond. */
export function humanizeDays(days: number): Span {
  if (days < 60) return { unit: 'days', count: Math.max(0, days) };
  if (days < 730) return { unit: 'months', count: Math.round(days / 30.44) };
  return { unit: 'years', count: Math.round((days / 365.25) * 10) / 10 };
}
