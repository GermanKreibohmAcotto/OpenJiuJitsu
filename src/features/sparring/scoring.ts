import type { AthleteScore, MatchMethod } from '../../domain/types';

/** IBJJF adult point values. */
export const SCORE_VALUES = {
  takedown: 2,
  sweep: 2,
  kneeOnBelly: 2,
  guardPass: 3,
  mount: 4,
  backControl: 4,
} as const;

export type PointKind = keyof typeof SCORE_VALUES;
export const POINT_KINDS = Object.keys(SCORE_VALUES) as PointKind[];

export type ScoreKind = PointKind | 'advantage' | 'penalty';
export type AthleteIndex = 0 | 1;

export interface ScoreEvent {
  id: number;
  athlete: AthleteIndex;
  kind: ScoreKind;
}

export type Totals = Pick<AthleteScore, 'points' | 'advantages' | 'penalties'>;

export interface Decision {
  winner: AthleteIndex | null;
  method: Extract<MatchMethod, 'points' | 'advantages' | 'penalties' | 'draw'>;
}

export function addEvent(events: ScoreEvent[], athlete: AthleteIndex, kind: ScoreKind): ScoreEvent[] {
  const id = events.length ? events[events.length - 1].id + 1 : 1;
  return [...events, { id, athlete, kind }];
}

export function undoLast(events: ScoreEvent[]): ScoreEvent[] {
  return events.slice(0, -1);
}

export function computeTotals(events: ScoreEvent[]): [Totals, Totals] {
  const totals: [Totals, Totals] = [
    { points: 0, advantages: 0, penalties: 0 },
    { points: 0, advantages: 0, penalties: 0 },
  ];
  for (const { athlete, kind } of events) {
    const target = totals[athlete];
    if (kind === 'advantage') target.advantages += 1;
    else if (kind === 'penalty') target.penalties += 1;
    else target.points += SCORE_VALUES[kind];
  }
  return totals;
}

/** Points, then advantages, then fewer penalties; otherwise a draw. */
export function decideWinner([a, b]: [Totals, Totals]): Decision {
  if (a.points !== b.points) return { winner: a.points > b.points ? 0 : 1, method: 'points' };
  if (a.advantages !== b.advantages) return { winner: a.advantages > b.advantages ? 0 : 1, method: 'advantages' };
  if (a.penalties !== b.penalties) return { winner: a.penalties < b.penalties ? 0 : 1, method: 'penalties' };
  return { winner: null, method: 'draw' };
}
