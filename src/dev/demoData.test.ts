import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/db';
import { ensureSeeded } from '../db/seed';
import { DEFAULT_PROFILE } from '../db/profile';
import { loadDemoData, removeDemoData } from './demoData';

async function snapshot() {
  return {
    techniques: (await db.techniques.toArray()).map((t) => t.id).sort(),
    meta: await db.meta.toArray(),
    plans: (await db.plans.toArray()).map((r) => r.id).sort(),
    sessions: (await db.sessions.toArray()).map((r) => r.id).sort(),
    matches: (await db.matches.toArray()).map((r) => r.id).sort(),
    graduations: (await db.graduations.toArray()).map((r) => r.id).sort(),
    injuries: (await db.injuries.toArray()).map((r) => r.id).sort(),
    profile: await db.profile.toArray(),
  };
}

async function addUserRecords() {
  const at = '2026-01-01T10:00:00.000Z';
  await db.plans.put({ id: 'user-plan', name: 'Mine', mode: 'gi', objectives: [], blocks: [], createdAt: at, updatedAt: at });
  await db.sessions.put({
    id: 'user-session', date: '2026-01-01', durationMin: 60, mode: 'gi', physicalDifficulty: 5, technicalDifficulty: 5,
    feelings: [], sparringRounds: 0, subsAchieved: [], subsSuffered: [], takedownsAchieved: [], takedownsSuffered: [],
    notes: '', createdAt: at, updatedAt: at,
  });
  await db.matches.put({
    id: 'user-match', date: '2026-01-01', mode: 'gi', durationSec: 300,
    athletes: [{ name: 'A', points: 0, advantages: 0, penalties: 0 }, { name: 'B', points: 0, advantages: 0, penalties: 0 }],
    winner: null, method: 'draw', createdAt: at,
  });
  await db.graduations.put({ id: 'user-grad', belt: 'white', stripes: 1, date: '2026-01-01' });
  await db.injuries.put({ id: 'user-injury', zone: 'knee', intensity: 3, date: '2026-01-01', notes: '', status: 'active', createdAt: at, updatedAt: at });
}

beforeEach(async () => {
  await db.delete();
  await db.open();
  await ensureSeeded();
});

describe('removeDemoData', () => {
  it('deletes only demo-* records and leaves user records, techniques and meta unchanged', async () => {
    await addUserRecords();
    const before = await snapshot();
    await loadDemoData();
    const withDemo = await snapshot();
    expect(withDemo.plans.length).toBeGreaterThan(before.plans.length);

    const removed = await removeDemoData(db);

    const after = await snapshot();
    expect(after.techniques).toEqual(before.techniques);
    expect(after.meta).toEqual(before.meta);
    for (const table of ['plans', 'sessions', 'matches', 'graduations', 'injuries'] as const) {
      expect(after[table]).toEqual(before[table]);
    }
    const expected = (['plans', 'sessions', 'matches', 'graduations', 'injuries'] as const).reduce(
      (sum, table) => sum + withDemo[table].length - before[table].length,
      0,
    );
    expect(removed).toBe(expected);
    expect(removed).toBeGreaterThan(0);
  });

  it('resets the profile when it is the demo identity', async () => {
    await loadDemoData();
    await removeDemoData(db);
    expect(await db.profile.get('me')).toEqual(DEFAULT_PROFILE);
  });

  it('keeps the profile when name or academy differ from the demo ones', async () => {
    const mine = { ...DEFAULT_PROFILE, name: 'Alex Silva', academy: 'My Gym', belt: 'blue' as const };
    await db.profile.put(mine);
    await removeDemoData(db);
    expect(await db.profile.get('me')).toEqual(mine);

    const other = { ...mine, name: 'Someone', academy: 'Open Mat Academy' };
    await db.profile.put(other);
    await removeDemoData(db);
    expect(await db.profile.get('me')).toEqual(other);
  });

  it('is a no-op the second time', async () => {
    await loadDemoData();
    await removeDemoData(db);
    const first = await snapshot();
    expect(await removeDemoData(db)).toBe(0);
    expect(await snapshot()).toEqual(first);
  });
});
