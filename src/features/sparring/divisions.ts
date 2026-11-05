import type { Belt } from '../../domain/types';
import { BELT_ROUND_MINUTES } from './timer';
import type { PenaltyRules } from './scoring';

/** Age divisions of the IBJJF rules book 6.1, competition format article 1. */
export const DIVISIONS = ['mightyMite', 'peeWee', 'junior', 'teenI', 'teenIII', 'juvenile', 'adult', 'master'] as const;
export type Division = (typeof DIVISIONS)[number];

const FIXED_MINUTES = { mightyMite: 2, peeWee: 3, junior: 4, teenI: 4, teenIII: 4, juvenile: 5, master: 5 } as const;

/** Regulation match time; adults depend on the belt. */
export function divisionMinutes(division: Division, belt: Belt = 'white'): number {
  return division === 'adult' ? BELT_ROUND_MINUTES[belt] : FIXED_MINUTES[division];
}

/** Under-15 divisions (up to teen II) escalate penalties differently (article 7.2.4). `teenI` covers teen I and II. */
export function penaltyRulesFor(division: Division): PenaltyRules {
  return division === 'mightyMite' || division === 'peeWee' || division === 'junior' || division === 'teenI' ? 'youth' : 'adult';
}
