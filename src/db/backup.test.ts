import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from './db';
import { BackupError, exportData, importData, parseBackup } from './backup';
import { saveTechnique } from './techniques';
import { ensureSeeded, SEEDED_KEY, SEED_VERSION } from './seed';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

async function addKimura() {
  return saveTechnique({
    name: { es: 'Kimura' },
    category: 'submission',
    type: 'submission',
    description: {},
    steps: [],
    media: [],
    modes: ['gi'],
    counterpartIds: [],
  });
}

describe('backup', () => {
  it('round-trips every table through export and import', async () => {
    const kimura = await addKimura();
    const json = JSON.stringify(await exportData());

    await db.techniques.clear();
    await importData(parseBackup(json));

    expect((await db.techniques.toArray()).map((t) => t.id)).toEqual([kimura.id]);
  });

  it('rejects a file from another app and leaves stored data unchanged', async () => {
    const kimura = await addKimura();

    expect(() => parseBackup(JSON.stringify({ app: 'opengym', version: 1, data: {} }))).toThrow(BackupError);
    expect(() => parseBackup('not json')).toThrow(BackupError);
    expect((await db.techniques.toArray()).map((t) => t.id)).toEqual([kimura.id]);
  });

  it('rejects malformed records before touching the database', async () => {
    const kimura = await addKimura();
    const backup = await exportData();
    const broken = { ...backup, data: { ...backup.data, techniques: [{ id: 'x', category: 'nope' }] } };

    expect(() => parseBackup(JSON.stringify(broken))).toThrow(BackupError);
    expect((await db.techniques.toArray()).map((t) => t.id)).toEqual([kimura.id]);
  });

  it('rejects a newer backup version', () => {
    expect(() => parseBackup(JSON.stringify({ app: 'openjiujitsu', version: 99, data: {} }))).toThrow(BackupError);
  });
});

describe('backup hardening', () => {
  async function seedEveryTable() {
    const kimura = await addKimura();
    await db.plans.put({
      id: 'p1',
      name: 'Plan',
      mode: 'gi',
      objectives: ['base'],
      blocks: [{ id: 'b1', kind: 'drill', title: 'Drills', minutes: 15, techniqueIds: [kimura.id] }],
      createdAt: 'x',
      updatedAt: 'x',
    });
    await db.sessions.put({
      id: 's1',
      date: '2026-10-26',
      durationMin: 90,
      mode: 'gi',
      physicalDifficulty: 7,
      technicalDifficulty: 5,
      feelings: ['tired'],
      sparringRounds: 3,
      subsAchieved: [kimura.id],
      subsSuffered: [],
      notes: 'codo',
      createdAt: 'x',
      updatedAt: 'x',
    });
    await db.graduations.put({ id: 'g1', belt: 'blue', stripes: 1, date: '2026-01-01' });
    await db.profile.put({ id: 'me', name: 'Fede', academy: '', belt: 'blue', stripes: 1 });
    await db.matches.put({
      id: 'm1',
      date: '2026-10-26',
      mode: 'nogi',
      durationSec: 300,
      athletes: [
        { name: 'Yo', points: 4, advantages: 1, penalties: 0 },
        { name: 'Otro', points: 2, advantages: 0, penalties: 1 },
      ],
      winner: 0,
      method: 'points',
      createdAt: 'x',
    });
  }

  it('round-trips all six tables and keeps the seed from overwriting the import', async () => {
    await seedEveryTable();
    const before = (await exportData()).data;
    const json = JSON.stringify(await exportData());

    await db.delete();
    await db.open();
    await importData(parseBackup(json));
    await ensureSeeded();

    const after = (await exportData()).data;
    expect(after).toEqual(before);
    expect((await db.meta.get(SEEDED_KEY))?.value).toBe(SEED_VERSION);
  });

  it('accepts a genuine export of the seeded library', async () => {
    await ensureSeeded();
    await seedEveryTable();

    expect(parseBackup(JSON.stringify(await exportData())).data.techniques.length).toBeGreaterThan(30);
  });

  it('rejects a backup that omits a table instead of wiping it', async () => {
    const kimura = await addKimura();
    const backup = await exportData();
    const { techniques: _omitted, ...rest } = backup.data;

    expect(() => parseBackup(JSON.stringify({ app: 'openjiujitsu', version: 1, data: {} }))).toThrow(BackupError);
    expect(() => parseBackup(JSON.stringify({ ...backup, data: rest }))).toThrow(BackupError);
    expect((await db.techniques.toArray()).map((t) => t.id)).toEqual([kimura.id]);
  });

  it('round-trips the profile goals and rejects malformed ones', async () => {
    await db.profile.put({
      id: 'me',
      name: 'Fede',
      academy: '',
      belt: 'blue',
      stripes: 1,
      weeklyGoal: 3,
      graduationGoal: { classes: 120, hours: 180, months: 18 },
    });
    const backup = await exportData();
    const profile = backup.data.profile[0];

    expect(parseBackup(JSON.stringify(backup)).data.profile[0]).toEqual(profile);
    for (const bad of [{ weeklyGoal: '3' }, { graduationGoal: 5 }, { graduationGoal: { classes: 'x' } }]) {
      const broken = { ...backup, data: { ...backup.data, profile: [{ ...profile, ...bad }] } };
      expect(() => parseBackup(JSON.stringify(broken))).toThrow(BackupError);
    }
    expect((await db.profile.get('me'))?.weeklyGoal).toBe(3);
  });

  it('rejects nested malformed records', async () => {
    await seedEveryTable();
    const backup = await exportData();
    const variants = [
      { techniques: [{ ...backup.data.techniques[0], name: { es: 1 } }] },
      { techniques: [{ ...backup.data.techniques[0], steps: [1] }] },
      { techniques: [{ ...backup.data.techniques[0], media: [{ kind: 'video', url: 'x' }] }] },
      { plans: [{ ...backup.data.plans[0], blocks: [{}] }] },
      { sessions: [{ ...backup.data.sessions[0], notes: undefined }] },
      { matches: [{ ...backup.data.matches[0], athletes: [{}, {}] }] },
      { techniques: [{ ...backup.data.techniques[0], position: 5 }] },
      { sessions: [{ ...backup.data.sessions[0], planId: {} }] },
      { matches: [{ ...backup.data.matches[0], method: 'magic' }] },
      { matches: [{ ...backup.data.matches[0], winner: 2 }] },
    ];
    for (const patch of variants) {
      const json = JSON.stringify({ ...backup, data: { ...backup.data, ...patch } });
      expect(() => parseBackup(json), JSON.stringify(patch).slice(0, 80)).toThrow(BackupError);
    }
  });

  it('leaves stored data intact when the import fails midway', async () => {
    const kimura = await addKimura();
    const backup = parseBackup(JSON.stringify(await exportData()));
    const failing = vi.spyOn(db.matches, 'bulkPut').mockRejectedValue(new Error('disk full'));
    await expect(importData({ ...backup, data: { ...backup.data, techniques: [] } })).rejects.toThrow('disk full');
    failing.mockRestore();
    expect((await db.techniques.toArray()).map((t) => t.id)).toEqual([kimura.id]);
  });
});
