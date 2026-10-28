import { todayIso } from '../../db/ids';
import type { Profile, SparringMatch, TrainingSession } from '../../domain/types';
import { SCORE_VALUES } from '../sparring/scoring';
import { daysBetween } from '../profile/stats';

/** Hexagon axes, clockwise from the top. */
export const AXES = ['pressure', 'wrestling', 'submission', 'defense', 'consistency', 'transitions', 'flexibility'] as const;
export type Axis = (typeof AXES)[number];

/** Axes the user rates by hand because no logged data measures them. */
export const SELF_RATED_AXES = ['flexibility'] as const;
export type SelfRatedAxis = (typeof SELF_RATED_AXES)[number];
export type SelfRatings = NonNullable<Profile['selfRatings']>;

/** Weeks of history the consistency axis looks at. */
export const CONSISTENCY_WEEKS = 8;

export const RATING_MIN = 1;
export const RATING_MAX = 10;

/**
 * Reference values that map a raw measure to 100. Reaching them is "full marks"
 * for that axis; they are intentionally easy to tune in one place.
 */
export const REFERENCE = {
  /** Points per match from top-game actions (pass, knee on belly, mount). */
  pressurePointsPerMatch: 6,
  /** Points per match from sweeps and back takes. */
  transitionPointsPerMatch: 6,
  /** Points per match from takedowns. */
  takedownPointsPerMatch: 4,
  /** Sparring rounds per session, as a cardio proxy. */
  roundsPerSession: 6,
  /** Training sessions per week that count as full consistency. */
  sessionsPerWeek: 4,
  /** Takedowns landed per sparring round (journal). */
  takedownsPerRound: 0.5,
  /** Submissions achieved per sparring round. */
  subsPerRound: 0.4,
  /** Submissions suffered per round that zeroes the defense component. */
  sufferedPerRound: 0.5,
  /** Opponent points conceded per match that zeroes the defense component. */
  concededPerMatch: 8,
} as const;

export interface AxisResult {
  axis: Axis;
  /** 0..100. Zero when `hasData` is false. */
  value: number;
  hasData: boolean;
}

export interface AnalyticsInput {
  matches: SparringMatch[];
  sessions: TrainingSession[];
  selfRatings?: SelfRatings;
  /** yyyy-mm-dd the consistency window ends on. Defaults to today. */
  today?: string;
}

const clamp = (value: number) => Math.max(0, Math.min(100, value));
const average = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;

type PointKind = keyof typeof SCORE_VALUES;

/** Points scored by `athlete` per match, counting only the given actions. */
function pointsPerMatch(logged: SparringMatch[], athlete: 0 | 1, kinds: readonly PointKind[]): number {
  let points = 0;
  for (const match of logged) {
    for (const event of match.events ?? []) {
      if (event.athlete === athlete && (kinds as readonly string[]).includes(event.kind)) {
        points += SCORE_VALUES[event.kind as PointKind];
      }
    }
  }
  return points / logged.length;
}

const result = (axis: Axis, components: number[]): AxisResult =>
  components.length === 0 ? { axis, value: 0, hasData: false } : { axis, value: Math.round(clamp(average(components))), hasData: true };

/**
 * Six-axis playing-style profile. Athlete 0 is always the user. Axes measured from
 * matches only use matches that kept a scoring log; session axes need logged rounds.
 */
export function computeAnalytics({ matches, sessions, selfRatings, today = todayIso() }: AnalyticsInput): AxisResult[] {
  const logged = matches.filter((m) => m.events !== undefined);
  const hasMatches = logged.length > 0;
  const rounds = sessions.reduce((sum, s) => sum + s.sparringRounds, 0);
  const achieved = sessions.reduce((sum, s) => sum + s.subsAchieved.length, 0);
  const suffered = sessions.reduce((sum, s) => sum + s.subsSuffered.length, 0);
  const matchScore = (kinds: readonly PointKind[], reference: number) =>
    (pointsPerMatch(logged, 0, kinds) / reference) * 100;

  const wrestling: number[] = [];
  if (hasMatches) wrestling.push(matchScore(['takedown'], REFERENCE.takedownPointsPerMatch));
  if (sessions.length > 0) wrestling.push((rounds / sessions.length / REFERENCE.roundsPerSession) * 100);
  // Only sessions that track takedowns can say how many were landed.
  const tracked = sessions.filter((s) => s.takedownsAchieved !== undefined);
  const trackedRounds = tracked.reduce((sum, s) => sum + s.sparringRounds, 0);
  if (trackedRounds > 0) {
    const landed = tracked.reduce((sum, s) => sum + (s.takedownsAchieved?.length ?? 0), 0);
    wrestling.push((landed / trackedRounds / REFERENCE.takedownsPerRound) * 100);
  }

  const defense: number[] = [];
  if (rounds > 0) defense.push(100 - (suffered / rounds / REFERENCE.sufferedPerRound) * 100);
  if (hasMatches) {
    const opponent = pointsPerMatch(logged, 1, Object.keys(SCORE_VALUES) as PointKind[]);
    defense.push(100 - (opponent / REFERENCE.concededPerMatch) * 100);
  }

  const recent = sessions.filter((s) => {
    const age = daysBetween(s.date, today);
    return age >= 0 && age < CONSISTENCY_WEEKS * 7;
  });
  const perWeek = recent.length / CONSISTENCY_WEEKS;

  const rating = selfRatings?.flexibility;

  return [
    result('pressure', hasMatches ? [matchScore(['guardPass', 'kneeOnBelly', 'mount'], REFERENCE.pressurePointsPerMatch)] : []),
    result('wrestling', wrestling),
    result('submission', rounds > 0 ? [(achieved / rounds / REFERENCE.subsPerRound) * 100] : []),
    result('defense', defense),
    result('consistency', sessions.length > 0 ? [(perWeek / REFERENCE.sessionsPerWeek) * 100] : []),
    result('transitions', hasMatches ? [matchScore(['sweep', 'backControl'], REFERENCE.transitionPointsPerMatch)] : []),
    result('flexibility', rating === undefined ? [] : [(rating / RATING_MAX) * 100]),
  ];
}

/** The axis with the highest value, or undefined when nothing is measured. */
export function dominantAxis(results: AxisResult[]): Axis | undefined {
  const measured = results.filter((r) => r.hasData && r.value > 0);
  if (measured.length === 0) return undefined;
  return measured.reduce((best, r) => (r.value > best.value ? r : best)).axis;
}
