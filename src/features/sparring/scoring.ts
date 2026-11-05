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

/** Penalty rules: adults are disqualified on the 4th penalty, under-15 divisions on the 6th. */
export type PenaltyRules = 'adult' | 'youth';

export type PenaltyConsequence = 'none' | 'advantage' | 'twoPoints' | 'disqualification';

/** What the n-th penalty of an athlete does (IBJJF rules book 6.1, article 7.2). */
export function penaltyConsequence(count: number, rules: PenaltyRules = 'adult'): PenaltyConsequence {
  if (count <= 1) return 'none';
  if (count === 2) return 'advantage';
  if (count === 3) return 'twoPoints';
  if (rules === 'youth') return count <= 5 ? 'twoPoints' : 'disqualification';
  return 'disqualification';
}

/** Seconds of passivity the referee counts before a lack of combativeness penalty (article 7.3.2). */
export const STALLING_SECONDS = 20;

/** Totals with the penalty consequences already given to the opponent. */
export function computeTotals(events: ScoreEvent[], rules: PenaltyRules = 'adult'): [Totals, Totals] {
  const totals: [Totals, Totals] = [
    { points: 0, advantages: 0, penalties: 0 },
    { points: 0, advantages: 0, penalties: 0 },
  ];
  for (const { athlete, kind } of events) {
    const target = totals[athlete];
    if (kind === 'advantage') target.advantages += 1;
    else if (kind === 'penalty') {
      target.penalties += 1;
      const against = totals[athlete === 0 ? 1 : 0];
      const consequence = penaltyConsequence(target.penalties, rules);
      if (consequence === 'advantage') against.advantages += 1;
      else if (consequence === 'twoPoints') against.points += 2;
    } else target.points += SCORE_VALUES[kind];
  }
  return totals;
}

/** The athlete who has reached the disqualifying penalty, if any. */
export function disqualified(events: ScoreEvent[], rules: PenaltyRules = 'adult'): AthleteIndex | null {
  const penalties = [0, 0];
  for (const { athlete, kind } of events) {
    if (kind !== 'penalty') continue;
    penalties[athlete] += 1;
    if (penaltyConsequence(penalties[athlete], rules) === 'disqualification') return athlete;
  }
  return null;
}

/** Points, then advantages, then fewer penalties; otherwise a draw. */
export function decideWinner([a, b]: [Totals, Totals]): Decision {
  if (a.points !== b.points) return { winner: a.points > b.points ? 0 : 1, method: 'points' };
  if (a.advantages !== b.advantages) return { winner: a.advantages > b.advantages ? 0 : 1, method: 'advantages' };
  if (a.penalties !== b.penalties) return { winner: a.penalties < b.penalties ? 0 : 1, method: 'penalties' };
  return { winner: null, method: 'draw' };
}

/** A disqualification gives the match to the opponent; otherwise points, advantages and penalties decide. */
export function decideMatch(events: ScoreEvent[], rules: PenaltyRules = 'adult'): Decision {
  const out = disqualified(events, rules);
  if (out !== null) return { winner: out === 0 ? 1 : 0, method: 'penalties' };
  return decideWinner(computeTotals(events, rules));
}
