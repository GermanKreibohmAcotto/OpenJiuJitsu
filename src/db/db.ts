import Dexie, { type EntityTable } from 'dexie';
import type {
  Graduation,
  Injury,
  Profile,
  SparringMatch,
  Technique,
  TrainingPlan,
  TrainingSession,
} from '../domain/types';

export interface MetaEntry {
  key: string;
  value: unknown;
}

export class OpenJiuJitsuDB extends Dexie {
  techniques!: EntityTable<Technique, 'id'>;
  plans!: EntityTable<TrainingPlan, 'id'>;
  sessions!: EntityTable<TrainingSession, 'id'>;
  graduations!: EntityTable<Graduation, 'id'>;
  profile!: EntityTable<Profile, 'id'>;
  matches!: EntityTable<SparringMatch, 'id'>;
  injuries!: EntityTable<Injury, 'id'>;
  meta!: EntityTable<MetaEntry, 'key'>;

  constructor(name = 'openjiujitsu') {
    super(name);
    const v1 = {
      techniques: 'id, category, type, *modes, updatedAt',
      plans: 'id, date, updatedAt',
      sessions: 'id, date, planId',
      graduations: 'id, date',
      profile: 'id',
      matches: 'id, date',
      meta: 'key',
    };
    this.version(1).stores(v1);
    // v2 adds the injury log; every v1 table is carried over untouched.
    this.version(2).stores({ ...v1, injuries: 'id, date, status' });
  }
}

export const db = new OpenJiuJitsuDB();

/** Every data table, in export order. `meta` is internal and never exported. */
export const DATA_TABLES = ['techniques', 'plans', 'sessions', 'graduations', 'profile', 'matches', 'injuries'] as const;
export type DataTable = (typeof DATA_TABLES)[number];
