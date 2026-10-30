import Dexie from 'dexie';
import { beforeEach, describe, expect, it } from 'vitest';
import { OpenJiuJitsuDB, db } from './db';
import { InjuryValidationError, deleteInjury, listInjuries, saveInjury, setInjuryStatus } from './injuries';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

const base = { zone: 'knee', intensity: 5, date: '2026-10-20', notes: '', status: 'active' } as const;

describe('database upgrade', () => {
  it('opens an existing version 1 database as version 2 keeping its data', async () => {
    const name = `upgrade-${crypto.randomUUID()}`;
    const old = new Dexie(name);
    old.version(1).stores({
      techniques: 'id, category, type, *modes, updatedAt',
      plans: 'id, date, updatedAt',
      sessions: 'id, date, planId',
      graduations: 'id, date',
      profile: 'id',
      matches: 'id, date',
      meta: 'key',
    });
    await old.open();
    await old.table('graduations').put({ id: 'g1', belt: 'blue', stripes: 1, date: '2026-01-01' });
    old.close();

    const upgraded = new OpenJiuJitsuDB(name);
    await upgraded.open();
    expect((await upgraded.graduations.toArray()).map((g) => g.id)).toEqual(['g1']);
    expect(await upgraded.injuries.count()).toBe(0);
    await upgraded.delete();
  });
});

describe('injury repository', () => {
  it('lists active first, then by date descending', async () => {
    const a = await saveInjury({ ...base, date: '2026-10-01' });
    const b = await saveInjury({ ...base, date: '2026-10-10', status: 'recovered' });
    const c = await saveInjury({ ...base, date: '2026-10-05' });
    expect((await listInjuries()).map((i) => i.id)).toEqual([c.id, a.id, b.id]);
  });

  it('rejects invalid input without storing anything', async () => {
    for (const bad of [
      { zone: 'toe' },
      { intensity: 0 },
      { intensity: 11 },
      { intensity: 2.5 },
      { date: '20/10/2026' },
      { status: 'gone' },
    ]) {
      await expect(saveInjury({ ...base, ...bad } as never)).rejects.toBeInstanceOf(InjuryValidationError);
    }
    expect(await db.injuries.count()).toBe(0);
  });

  it('updates keeping createdAt, changes status and deletes', async () => {
    const created = await saveInjury(base);
    const edited = await saveInjury({ ...base, id: created.id, intensity: 7, notes: 'mejor' });
    expect(edited.createdAt).toBe(created.createdAt);
    expect((await db.injuries.get(created.id))?.intensity).toBe(7);

    await setInjuryStatus(created.id, 'recovered');
    expect((await db.injuries.get(created.id))?.status).toBe('recovered');

    await deleteInjury(created.id);
    expect(await db.injuries.count()).toBe(0);
  });
});
