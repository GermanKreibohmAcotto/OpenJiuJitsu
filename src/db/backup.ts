import { db } from './db';
import { nowIso } from './ids';
import { SEEDED_KEY, SEED_VERSION } from './seed';
import { isBelt } from '../domain/belts';
import {
  BLOCK_KINDS,
  CATEGORIES,
  MATCH_EVENT_KINDS,
  MATCH_METHODS,
  MEDIA_KINDS,
  MODES,
  POSITIONS,
  TECHNIQUE_TYPES,
  type Graduation,
  type Profile,
  type SparringMatch,
  type Technique,
  type TrainingPlan,
  type TrainingSession,
} from '../domain/types';

export const BACKUP_APP = 'openjiujitsu';
export const BACKUP_VERSION = 1;

export interface BackupData {
  techniques: Technique[];
  plans: TrainingPlan[];
  sessions: TrainingSession[];
  graduations: Graduation[];
  profile: Profile[];
  matches: SparringMatch[];
}

export interface Backup {
  app: typeof BACKUP_APP;
  version: number;
  exportedAt: string;
  data: BackupData;
}

export type BackupErrorCode = 'invalidJson' | 'notBackup' | 'unsupportedVersion' | 'noData' | 'notList' | 'invalidRecord';

/** Validation failure. `code` and `params` let the UI show a translated message. */
export class BackupError extends Error {
  constructor(
    readonly code: BackupErrorCode,
    message: string,
    readonly params: Record<string, string | number> = {},
  ) {
    super(message);
    this.name = 'BackupError';
  }
}

type Rec = Record<string, unknown>;
const isRecord = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);
const isString = (v: unknown): v is string => typeof v === 'string';
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(isString);
const oneOf = (list: readonly string[], v: unknown) => isString(v) && list.includes(v);

const isLocalized = (v: unknown) => isRecord(v) && Object.values(v).every(isString);
const isOptional = (v: unknown, check: (x: unknown) => boolean) => v === undefined || check(v);
const everyOf = (v: unknown, check: (x: unknown) => boolean) => Array.isArray(v) && v.every(check);

const isMedia = (v: unknown) => isRecord(v) && oneOf(MEDIA_KINDS, v.kind) && isString(v.url);
const isLegality = (v: unknown) =>
  isRecord(v) && MODES.every((mode) => v[mode] === null || isBelt(v[mode]));
const isBlock = (v: unknown) =>
  isRecord(v) &&
  isString(v.id) &&
  oneOf(BLOCK_KINDS, v.kind) &&
  isString(v.title) &&
  isNumber(v.minutes) &&
  isStringArray(v.techniqueIds);
const isAthlete = (v: unknown) =>
  isRecord(v) && isString(v.name) && isNumber(v.points) && isNumber(v.advantages) && isNumber(v.penalties);

const isMatchEvent = (v: unknown) => isRecord(v) && (v.athlete === 0 || v.athlete === 1) && oneOf(MATCH_EVENT_KINDS, v.kind) && isOptional(v.techniqueId, isString);

const VALIDATORS: Record<keyof BackupData, (r: Rec) => boolean> = {
  techniques: (r) =>
    isLocalized(r.name) &&
    isLocalized(r.description) &&
    oneOf(CATEGORIES, r.category) &&
    oneOf(TECHNIQUE_TYPES, r.type) &&
    everyOf(r.steps, isLocalized) &&
    everyOf(r.media, isMedia) &&
    everyOf(r.modes, (m) => oneOf(MODES, m)) &&
    isStringArray(r.counterpartIds) &&
    isOptional(r.legality, isLegality) &&
    isOptional(r.position, (p) => oneOf(POSITIONS, p)),
  plans: (r) =>
    isString(r.name) && oneOf(MODES, r.mode) && isStringArray(r.objectives) && everyOf(r.blocks, isBlock),
  sessions: (r) =>
    isString(r.date) &&
    isNumber(r.durationMin) &&
    oneOf(MODES, r.mode) &&
    isNumber(r.physicalDifficulty) &&
    isNumber(r.technicalDifficulty) &&
    isNumber(r.sparringRounds) &&
    isString(r.notes) &&
    isStringArray(r.feelings) &&
    isStringArray(r.subsAchieved) &&
    isStringArray(r.subsSuffered) &&
    isOptional(r.takedownsAchieved, isStringArray) &&
    isOptional(r.takedownsSuffered, isStringArray) &&
    isOptional(r.planId, isString),
  graduations: (r) => isBelt(r.belt) && isNumber(r.stripes) && isString(r.date),
  profile: (r) =>
    r.id === 'me' &&
    isBelt(r.belt) &&
    isNumber(r.stripes) &&
    isString(r.name) &&
    isOptional(r.selfRatings, (v) => isRecord(v) && isOptional(v.flexibility, isNumber)),
  matches: (r) =>
    isString(r.date) &&
    oneOf(MODES, r.mode) &&
    isNumber(r.durationSec) &&
    Array.isArray(r.athletes) &&
    r.athletes.length === 2 &&
    r.athletes.every(isAthlete) &&
    (r.winner === null || r.winner === 0 || r.winner === 1) &&
    oneOf(MATCH_METHODS, r.method) &&
    isOptional(r.submissionId, isString) &&
    isOptional(r.events, (e) => everyOf(e, isMatchEvent)),
};

export async function exportData(): Promise<Backup> {
  const [techniques, plans, sessions, graduations, profile, matches] = await Promise.all([
    db.techniques.toArray(),
    db.plans.toArray(),
    db.sessions.toArray(),
    db.graduations.toArray(),
    db.profile.toArray(),
    db.matches.toArray(),
  ]);
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: nowIso(),
    data: { techniques, plans, sessions, graduations, profile, matches },
  };
}

/** Parses and validates a backup file. Throws BackupError without touching the database. */
export function parseBackup(json: string): Backup {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new BackupError('invalidJson', 'The file is not valid JSON.');
  }
  if (!isRecord(raw) || raw.app !== BACKUP_APP) throw new BackupError('notBackup', 'The file is not an OpenJiuJitsu backup.');
  if (!isNumber(raw.version) || raw.version > BACKUP_VERSION || raw.version < 1) {
    throw new BackupError('unsupportedVersion', `Unsupported backup version: ${String(raw.version)}.`, {
      version: String(raw.version),
    });
  }
  if (!isRecord(raw.data)) throw new BackupError('noData', 'The backup has no data section.');

  const data = {} as Record<keyof BackupData, unknown[]>;
  for (const table of Object.keys(VALIDATORS) as (keyof BackupData)[]) {
    // A missing table is an error, never an empty list: importing replaces everything.
    const rows = raw.data[table];
    if (!Array.isArray(rows)) throw new BackupError('notList', `"${table}" must be a list.`, { table });
    rows.forEach((row, index) => {
      if (!isRecord(row) || !isString(row.id) || !VALIDATORS[table](row)) {
        throw new BackupError('invalidRecord', `Invalid record #${index + 1} in "${table}".`, { table, index: index + 1 });
      }
    });
    data[table] = rows;
  }
  return {
    app: BACKUP_APP,
    version: raw.version,
    exportedAt: isString(raw.exportedAt) ? raw.exportedAt : '',
    data: data as unknown as BackupData,
  };
}

/** Replaces all stored data with the backup in one transaction (all or nothing). */
export function importData(backup: Backup): Promise<void> {
  const tables = [db.techniques, db.plans, db.sessions, db.graduations, db.profile, db.matches, db.meta];
  return db.transaction('rw', tables, async () => {
    await Promise.all(tables.map((t) => t.clear()));
    const { data } = backup;
    await db.techniques.bulkPut(data.techniques);
    await db.plans.bulkPut(data.plans);
    await db.sessions.bulkPut(data.sessions);
    await db.graduations.bulkPut(data.graduations);
    await db.profile.bulkPut(data.profile);
    await db.matches.bulkPut(data.matches);
    // An imported library counts as seeded, so the built-in seed never overwrites it.
    await db.meta.put({ key: SEEDED_KEY, value: SEED_VERSION });
  });
}
