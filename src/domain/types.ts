export const LANGS = ['es', 'en'] as const;
export type Lang = (typeof LANGS)[number];

/** Text stored per language. User-created content usually fills only the active language. */
export type LocalizedText = Partial<Record<Lang, string>>;

export const MODES = ['gi', 'nogi'] as const;
export type Mode = (typeof MODES)[number];
/** Global filter: one mode or both. */
export type ModeFilter = Mode | 'all';

export const BELTS = ['white', 'blue', 'purple', 'brown', 'black'] as const;
export type Belt = (typeof BELTS)[number];

export const CATEGORIES = ['drill', 'guard', 'pass', 'submission', 'escape'] as const;
export type Category = (typeof CATEGORIES)[number];

export const TECHNIQUE_TYPES = [
  'submission',
  'sweep',
  'escape',
  'pass',
  'guard',
  'takedown',
  'drill',
] as const;
export type TechniqueType = (typeof TECHNIQUE_TYPES)[number];

export const POSITIONS = [
  'standing',
  'closed_guard',
  'half_guard',
  'spider_guard',
  'de_la_riva',
  'butterfly_guard',
  'x_guard',
  'lasso_guard',
  'single_leg_x',
  'mount',
  'side_control',
  'back',
  'knee_on_belly',
  'turtle',
  'north_south',
] as const;
export type Position = (typeof POSITIONS)[number];

export const MEDIA_KINDS = ['youtube', 'gif', 'image'] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

export interface MediaItem {
  kind: MediaKind;
  url: string;
}

/**
 * Minimum belt allowed to apply a technique in a ruleset, per mode.
 * `null` means the technique is not allowed for any adult belt in that mode.
 */
export interface BeltLegality {
  gi: Belt | null;
  nogi: Belt | null;
}

export interface Technique {
  id: string;
  name: LocalizedText;
  category: Category;
  type: TechniqueType;
  position?: Position;
  description: LocalizedText;
  /** Ordered execution checklist. */
  steps: LocalizedText[];
  media: MediaItem[];
  /** Modes in which the technique applies (GI, NoGI or both). */
  modes: Mode[];
  /** Counterpart techniques (e.g. Kimura <-> Kimura escape). Kept symmetric by the repository. */
  counterpartIds: string[];
  /** Belt legality (IBJJF adult). Present for submissions. */
  legality?: BeltLegality;
  /** Shipped with the app (seed) rather than created by the user. */
  builtin: boolean;
  createdAt: string;
  updatedAt: string;
}

export const BLOCK_KINDS = ['warmup', 'drill', 'technique', 'sparring', 'other'] as const;
export type BlockKind = (typeof BLOCK_KINDS)[number];

export interface PlanBlock {
  id: string;
  kind: BlockKind;
  title: string;
  minutes: number;
  techniqueIds: string[];
  notes?: string;
}

export interface TrainingPlan {
  id: string;
  name: string;
  mode: Mode;
  /** Optional ISO date (yyyy-mm-dd) the plan is meant for. */
  date?: string;
  objectives: string[];
  blocks: PlanBlock[];
  createdAt: string;
  updatedAt: string;
}

export const FEELING_TAGS = ['tired', 'fluid', 'frustrated', 'strong', 'motivated', 'sore', 'focused', 'slow'] as const;
export type FeelingTag = (typeof FEELING_TAGS)[number];

export interface TrainingSession {
  id: string;
  /** ISO date yyyy-mm-dd. */
  date: string;
  durationMin: number;
  mode: Mode;
  planId?: string;
  /** 1..10 */
  physicalDifficulty: number;
  /** 1..10 */
  technicalDifficulty: number;
  /** Built-in FeelingTag ids or free custom tags. */
  feelings: string[];
  sparringRounds: number;
  /** Technique ids; repeated ids count as repeated submissions. */
  subsAchieved: string[];
  subsSuffered: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: 'me';
  name: string;
  academy: string;
  belt: Belt;
  stripes: number;
  startedAt?: string;
}

export interface Graduation {
  id: string;
  belt: Belt;
  stripes: number;
  /** ISO date yyyy-mm-dd. */
  date: string;
  notes?: string;
}

export const MATCH_METHODS = ['points', 'advantages', 'penalties', 'submission', 'draw', 'referee'] as const;
export type MatchMethod = (typeof MATCH_METHODS)[number];

export interface AthleteScore {
  name: string;
  points: number;
  advantages: number;
  penalties: number;
}

export interface SparringMatch {
  id: string;
  date: string;
  mode: Mode;
  durationSec: number;
  athletes: [AthleteScore, AthleteScore];
  /** Index of the winner, or null for a draw. */
  winner: 0 | 1 | null;
  method: MatchMethod;
  submissionId?: string;
  createdAt: string;
}
