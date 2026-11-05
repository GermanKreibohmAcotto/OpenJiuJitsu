import { BELT_ACCENTS } from '../app/accent';
import { SEED_TECHNIQUES } from '../db/seedData';
import { BELT_COLORS } from '../domain/belts';
import { BELTS, type Belt, type Lang, type Technique } from '../domain/types';
import { BELT_ROUND_MINUTES } from '../features/sparring/timer';
import commonEn from '../i18n/locales/en';
import commonEs from '../i18n/locales/es';
import analyticsEn from '../features/analytics/locales/en';
import analyticsEs from '../features/analytics/locales/es';
import homeEn from '../features/home/locales/en';
import homeEs from '../features/home/locales/es';
import injuriesEn from '../features/injuries/locales/en';
import injuriesEs from '../features/injuries/locales/es';
import journalEn from '../features/journal/locales/en';
import journalEs from '../features/journal/locales/es';
import libraryEn from '../features/library/locales/en';
import libraryEs from '../features/library/locales/es';
import profileEn from '../features/profile/locales/en';
import profileEs from '../features/profile/locales/es';
import sparringEn from '../features/sparring/locales/en';
import sparringEs from '../features/sparring/locales/es';

/**
 * Everything the landing shows about the product comes from here: the real
 * library, legality rules and round lengths, and the app's own strings. The
 * landing never initializes i18next or the database; it reads the same plain
 * locale modules the app registers.
 */

/** Strings of the app, per language, as plain modules. */
const APP_STRINGS = {
  es: {
    common: commonEs,
    home: homeEs,
    analytics: analyticsEs,
    injuries: injuriesEs,
    journal: journalEs,
    library: libraryEs,
    profile: profileEs,
    sparring: sparringEs,
  },
  en: {
    common: commonEn,
    home: homeEn,
    analytics: analyticsEn,
    injuries: injuriesEn,
    journal: journalEn,
    library: libraryEn,
    profile: profileEn,
    sparring: sparringEn,
  },
} as const;

export function appStrings(lang: Lang) {
  return APP_STRINGS[lang];
}

export type AppStrings = ReturnType<typeof appStrings>;

/** `{{x}}` interpolation, the same placeholder syntax the app locales use. */
export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(vars[key] ?? ''));
}

/** Belt colors on the dark landing: the app's accents, except brown, which uses the real belt color. */
export const BELT_COLOR: Record<Belt, string> = { ...BELT_ACCENTS, brown: BELT_COLORS.brown };
/** The black tip of the belt, behind the stripes. */
export const BELT_TIP = BELT_COLORS.black;
/** Stripe color on a belt tip. */
export const STRIPE_COLOR = BELT_ACCENTS.white;

const TECHNIQUES = new Map(SEED_TECHNIQUES.map((technique) => [technique.id, technique]));

function technique(id: string): Technique {
  const found = TECHNIQUES.get(id);
  if (!found) throw new Error(`Seed technique not found: ${id}`);
  return found;
}

function nameOf(t: Technique, lang: Lang): string {
  return t.name[lang] || t.name.es || '';
}

export function techniqueName(id: string, lang: Lang): string {
  return nameOf(technique(id), lang);
}

export const TECHNIQUE_COUNT = SEED_TECHNIQUES.length;

export interface LibraryRow {
  id: string;
  name: string;
  type: string;
  position: string | null;
  steps: number;
  /** Name of the first linked counterpart, if any. */
  counterpart: string | null;
}

const LIBRARY_SUBMISSIONS = ['triangle-closed-guard', 'kimura-closed-guard'];

function firstOfType(type: Technique['type']): Technique {
  const found = SEED_TECHNIQUES.find((t) => t.type === type);
  if (!found) throw new Error(`No seed technique of type ${type}`);
  return found;
}

export function libraryRows(lang: Lang): LibraryRow[] {
  const { types, positions } = appStrings(lang).common;
  const ids = [...LIBRARY_SUBMISSIONS, firstOfType('pass').id, firstOfType('sweep').id];
  return ids.map((id) => {
    const t = technique(id);
    const counterpartId = t.counterpartIds[0];
    return {
      id,
      name: nameOf(t, lang),
      type: types[t.type],
      position: t.position ? positions[t.position] : null,
      steps: t.steps.length,
      counterpart: counterpartId ? techniqueName(counterpartId, lang) : null,
    };
  });
}

export interface LegalityRow {
  id: string;
  name: string;
  gi: Belt | null;
  nogi: Belt | null;
}

const LEGALITY_IDS = ['rear-naked-choke', 'wrist-lock', 'kneebar', 'inside-heel-hook'];

export function legalityRows(lang: Lang): LegalityRow[] {
  return LEGALITY_IDS.map((id) => {
    const t = technique(id);
    return { id, name: nameOf(t, lang), gi: t.legality?.gi ?? null, nogi: t.legality?.nogi ?? null };
  });
}

export function roundMinutes(): { belt: Belt; minutes: number }[] {
  return BELTS.map((belt) => ({ belt, minutes: BELT_ROUND_MINUTES[belt] }));
}

export interface PlanBlockExample {
  kind: 'drill' | 'pass' | 'sparring';
  title: string;
  minutes: number;
  chips: string[];
}

const PLAN_DRILLS = ['hip-escape-drill', 'bridge-drill'];
const PLAN_PASSES = ['toreando-pass', 'over-under-pass'];
const PLAN_ROLLING_MINUTES = 30;

/** An example class plan built from library techniques. Rounds are as long as a blue belt round. */
export function planExample(lang: Lang, roundsLabel: string): { blocks: PlanBlockExample[]; total: number } {
  const { blockKinds, categories } = appStrings(lang).common;
  const rounds = Math.round(PLAN_ROLLING_MINUTES / BELT_ROUND_MINUTES.blue);
  const blocks: PlanBlockExample[] = [
    { kind: 'drill', title: blockKinds.drill, minutes: 15, chips: PLAN_DRILLS.map((id) => techniqueName(id, lang)) },
    { kind: 'pass', title: categories.pass, minutes: 20, chips: PLAN_PASSES.map((id) => techniqueName(id, lang)) },
    {
      kind: 'sparring',
      title: blockKinds.sparring,
      minutes: PLAN_ROLLING_MINUTES,
      chips: [fmt(roundsLabel, { rounds, minutes: BELT_ROUND_MINUTES.blue })],
    },
  ];
  return { blocks, total: blocks.reduce((sum, block) => sum + block.minutes, 0) };
}

export const AXES = ['pressure', 'wrestling', 'submission', 'defense', 'consistency', 'transitions', 'flexibility'] as const;
export type Axis = (typeof AXES)[number];

/** Illustrative values for the previews. They are examples, not data from any user. */
export const EXAMPLE = {
  belt: 'blue' as Belt,
  stripes: 2,
  hours: 42,
  sessions: 31,
  goalDone: 2,
  goalTarget: 3,
  streakWeeks: 4,
  lastMinutes: 90,
  lastRounds: 6,
  lastAchieved: 2,
  lastSuffered: 1,
  axisScores: { pressure: 82, wrestling: 60, submission: 90, defense: 55, consistency: 75, transitions: 40, flexibility: 65 } as Record<Axis, number>,
  classes: { current: 46, target: 80 },
  hoursGoal: { current: 42, target: 70 },
  months: { current: 14, target: 24 },
  injuries: [
    { zone: 'knee', status: 'active', intensity: 4 },
    { zone: 'shoulder', status: 'recovered', intensity: 2 },
  ] as const,
  match: { time: '04:12', you: { points: 6, advantages: 1, penalties: 0 }, rival: { points: 2, advantages: 0, penalties: 1 } },
  journal: {
    minutes: 90,
    physical: 7,
    technical: 5,
    achieved: ['triangle-closed-guard', 'armbar-closed-guard'],
    suffered: ['rear-naked-choke'],
  },
};

export const RADAR = { cx: 160, cy: 150, radius: 100 } as const;

/** Vertex `index` (of seven axes, starting at the top, clockwise) at `value` percent of the radar radius. */
export function radarPoint(index: number, value: number, scale: number = RADAR.radius) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / AXES.length;
  const r = (scale * value) / 100;
  return { x: RADAR.cx + r * Math.cos(angle), y: RADAR.cy + r * Math.sin(angle) };
}

export function radarPolygon(values: number[], scale?: number): string {
  return values
    .map((value, index) => radarPoint(index, value, scale))
    .map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');
}
