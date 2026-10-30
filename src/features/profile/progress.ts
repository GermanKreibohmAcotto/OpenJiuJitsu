import type { Belt, Graduation, Profile, TrainingSession } from '../../domain/types';
import { daysBetween } from './stats';

/** IBJJF adult minimum months at a belt before the next one; white and black have none. */
const IBJJF_MONTHS: Partial<Record<Belt, number>> = { blue: 24, purple: 18, brown: 12 };

export interface ProgressBar {
  key: 'classes' | 'hours' | 'months';
  current: number;
  target: number;
  source: 'own' | 'ibjjf';
  /** current / target, capped at 1. */
  ratio: number;
}

export interface GraduationProgress {
  /** Start of the period: last graduation, else start date, else first session. */
  since?: string;
  classes: number;
  hours: number;
  months: number;
  bars: ProgressBar[];
  /** No months target at all: no own goal and the belt has no IBJJF reference. */
  noMinimum: boolean;
}

interface Input {
  sessions: TrainingSession[];
  graduations: Graduation[];
  profile: Profile;
  today: string;
}

const round1 = (value: number) => Math.round(value * 10) / 10;

export function graduationProgress({ sessions, graduations, profile, today }: Input): GraduationProgress {
  const lastGraduation = graduations.reduce<string | undefined>((latest, g) => (!latest || g.date > latest ? g.date : latest), undefined);
  const firstSession = sessions.reduce<string | undefined>((first, s) => (!first || s.date < first ? s.date : first), undefined);
  const since = lastGraduation ?? profile.startedAt ?? firstSession;

  const period = since ? sessions.filter((s) => s.date >= since) : sessions;
  const classes = period.length;
  const hours = round1(period.reduce((sum, s) => sum + s.durationMin, 0) / 60);
  const months = since ? Math.max(0, round1(daysBetween(since, today) / 30.4375)) : 0;

  const goal = profile.graduationGoal ?? {};
  const bar = (key: ProgressBar['key'], current: number, own?: number, reference?: number): ProgressBar[] => {
    const target = own ?? reference;
    if (!target) return [];
    return [{ key, current, target, source: own ? 'own' : 'ibjjf', ratio: Math.min(1, current / target) }];
  };
  const bars = [
    ...bar('classes', classes, goal.classes),
    ...bar('hours', hours, goal.hours),
    ...bar('months', months, goal.months, IBJJF_MONTHS[profile.belt]),
  ];

  return { since, classes, hours, months, bars, noMinimum: !bars.some((b) => b.key === 'months') };
}
