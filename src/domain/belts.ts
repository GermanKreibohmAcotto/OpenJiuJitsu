import { BELTS, type Belt, type BeltLegality, type Mode } from './types';

export const BELT_COLORS: Record<Belt, string> = {
  white: '#f4f4f5',
  blue: '#1d4ed8',
  purple: '#7e22ce',
  brown: '#78350f',
  black: '#0a0a0a',
};

/** Max stripes shown on the belt bar. Black belt degrees go up to 6 before coral. */
export const MAX_STRIPES: Record<Belt, number> = {
  white: 4,
  blue: 4,
  purple: 4,
  brown: 4,
  black: 6,
};

export function beltRank(belt: Belt): number {
  return BELTS.indexOf(belt);
}

export function isBelt(value: unknown): value is Belt {
  return typeof value === 'string' && (BELTS as readonly string[]).includes(value);
}

/** Whether `belt` may apply a technique with `legality` in `mode`. Techniques without legality data are allowed. */
export function isAllowedFor(legality: BeltLegality | undefined, mode: Mode, belt: Belt): boolean {
  if (!legality) return true;
  const min = legality[mode];
  if (min === null) return false;
  return beltRank(belt) >= beltRank(min);
}

/** Belts allowed to apply the technique in `mode`, lowest first. */
export function allowedBelts(legality: BeltLegality | undefined, mode: Mode): Belt[] {
  return BELTS.filter((belt) => isAllowedFor(legality, mode, belt));
}

/**
 * IBJJF Rule Book v6.1 (June 2024), adult divisions.
 * Presets for the restriction groups of the "Technical Fouls – Illegal Moves" table.
 */
export const LEGALITY_PRESETS = {
  /** Chokes, armlocks, shoulder locks, omoplata, triangle, straight foot lock, ezekiel. */
  allBelts: { gi: 'white', nogi: 'white' },
  /** Wrist locks. */
  blueAndUp: { gi: 'blue', nogi: 'blue' },
  /** Kneebar, toe hold, calf slicer, bicep slicer, kidney squeeze with legs. */
  brownAndUp: { gi: 'brown', nogi: 'brown' },
  /** Heel hooks: allowed only for adult brown/black belts in NoGI since 2021. */
  heelHook: { gi: null, nogi: 'brown' },
  /** Not allowed for any adult belt (e.g. spinal locks without choke). */
  forbidden: { gi: null, nogi: null },
} as const satisfies Record<string, BeltLegality>;

export const LEGALITY_SOURCE = 'IBJJF Rule Book v6.1 (2024)';
