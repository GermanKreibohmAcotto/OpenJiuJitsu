import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import { deleteTechnique, getTechnique, saveTechnique, type TechniqueInput } from './techniques';
import { listSessions, recordSubmission, saveSession, type SessionInput } from './sessions';
import { getProfile, saveGraduationGoal, saveProfile, saveWeeklyGoal } from './profile';
import { ensureSeeded, SEEDED_KEY, SEED_VERSION } from './seed';
import { SEED_TECHNIQUES } from './seedData';

function techniqueInput(name: string, counterpartIds: string[] = []): TechniqueInput {
  return {
    name: { es: name },
    category: 'submission',
    type: 'submission',
    description: {},
    steps: [],
    media: [],
    modes: ['gi', 'nogi'],
    counterpartIds,
  };
}

function sessionInput(overrides: Partial<SessionInput> = {}): SessionInput {
  return {
    date: '2026-10-26',
    durationMin: 90,
    mode: 'gi',
    physicalDifficulty: 7,
    technicalDifficulty: 5,
    feelings: ['tired'],
    sparringRounds: 4,
    subsAchieved: [],
    subsSuffered: [],
    notes: '',
    ...overrides,
  };
}

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('technique counterparts', () => {
  it('links the counterpart back when a technique is saved', async () => {
    const escape = await saveTechnique(techniqueInput('Escape de Kimura'));
    const kimura = await saveTechnique(techniqueInput('Kimura', [escape.id]));

    expect((await getTechnique(escape.id))?.counterpartIds).toEqual([kimura.id]);
  });

  it('unlinks the old counterpart when a relation is removed', async () => {
    const escape = await saveTechnique(techniqueInput('Escape de Kimura'));
    const kimura = await saveTechnique(techniqueInput('Kimura', [escape.id]));

    await saveTechnique({ ...techniqueInput('Kimura'), id: kimura.id });

    expect((await getTechnique(escape.id))?.counterpartIds).toEqual([]);
  });

  it('ignores self links and unknown ids', async () => {
    const kimura = await saveTechnique(techniqueInput('Kimura'));
    const saved = await saveTechnique({ ...techniqueInput('Kimura', [kimura.id, 'missing']), id: kimura.id });

    expect(saved.counterpartIds).toEqual([]);
  });

  it('removes a deleted technique from its counterparts', async () => {
    const escape = await saveTechnique(techniqueInput('Escape de Kimura'));
    const kimura = await saveTechnique(techniqueInput('Kimura', [escape.id]));

    await deleteTechnique(kimura.id);

    expect(await getTechnique(kimura.id)).toBeUndefined();
    expect((await getTechnique(escape.id))?.counterpartIds).toEqual([]);
  });
});

describe('seed library', () => {
  it('seeds once and every seeded technique has a counterpart that links back', async () => {
    await ensureSeeded();
    await ensureSeeded();

    const all = await db.techniques.toArray();
    expect(all).toHaveLength(SEED_TECHNIQUES.length);
    const byId = new Map(all.map((t) => [t.id, t]));
    for (const technique of all) {
      expect(technique.counterpartIds.length, technique.id).toBeGreaterThan(0);
      for (const counterpartId of technique.counterpartIds) {
        expect(byId.get(counterpartId)?.counterpartIds, `${technique.id} -> ${counterpartId}`).toContain(technique.id);
      }
    }
  });

  it('ships takedowns and throws as their own category', () => {
    const takedowns = SEED_TECHNIQUES.filter((t) => t.category === 'takedown');
    expect(takedowns.length).toBeGreaterThanOrEqual(10);
    expect(takedowns.every((t) => t.type === 'takedown' && t.position === 'standing')).toBe(true);
    expect(takedowns.map((t) => t.id)).toContain('double-leg');
  });

  it('adds only the techniques newer than the stored seed version, keeping what the user has', async () => {
    await ensureSeeded();
    const original = SEED_TECHNIQUES.filter((t) => t.category !== 'takedown' && t.id !== 'clinch-defense' && t.id !== 'sprawl-defense' && t.id !== 'guard-pull');
    // Simulate a library seeded at version 1: no takedowns, the user deleted one old technique and edited another.
    await db.techniques.clear();
    await db.techniques.bulkPut(
      original
        .filter((t) => t.id !== 'kneebar')
        .map((t) => (t.id === 'toreando-pass' ? { ...t, counterpartIds: t.counterpartIds.filter((id) => id !== 'guard-pull'), name: { es: 'Mi toreando' } } : t)),
    );
    await db.meta.put({ key: SEEDED_KEY, value: 1 });

    await ensureSeeded();

    expect(await db.techniques.get('double-leg')).toBeDefined();
    expect(await db.techniques.get('kneebar')).toBeUndefined();
    const toreando = await db.techniques.get('toreando-pass');
    expect(toreando?.name).toEqual({ es: 'Mi toreando' });
    expect(toreando?.counterpartIds).toContain('guard-pull');
    expect((await db.meta.get(SEEDED_KEY))?.value).toBe(SEED_VERSION);
  });

  it('does not reseed after the user deletes every technique', async () => {
    await ensureSeeded();
    await db.techniques.clear();
    await ensureSeeded();

    expect(await db.techniques.count()).toBe(0);
  });

  it('gives every seeded submission its belt legality', async () => {
    const submissions = SEED_TECHNIQUES.filter((t) => t.type === 'submission');
    expect(submissions.length).toBeGreaterThan(0);
    for (const technique of submissions) expect(technique.legality, technique.id).toBeDefined();
  });
});

describe('training sessions', () => {
  it('rejects difficulty outside 1..10 and stores nothing', async () => {
    await expect(saveSession(sessionInput({ physicalDifficulty: 11 }))).rejects.toThrow('physicalDifficulty');
    await expect(saveSession(sessionInput({ technicalDifficulty: 0 }))).rejects.toThrow('technicalDifficulty');
    expect(await db.sessions.count()).toBe(0);
  });

  it('lists sessions newest first', async () => {
    await saveSession(sessionInput({ date: '2026-10-01' }));
    await saveSession(sessionInput({ date: '2026-10-20' }));

    expect((await listSessions()).map((s) => s.date)).toEqual(['2026-10-20', '2026-10-01']);
  });

  it('records a sparring submission into the session of that day, creating it when missing', async () => {
    await recordSubmission({ date: '2026-10-26', mode: 'nogi', techniqueId: 'kimura', outcome: 'achieved' });
    await recordSubmission({ date: '2026-10-26', mode: 'nogi', techniqueId: 'armbar', outcome: 'suffered' });

    const sessions = await listSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({ subsAchieved: ['kimura'], subsSuffered: ['armbar'], sparringRounds: 2 });
  });
});

describe('profile goals', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it('stores the weekly goal without touching other profile fields', async () => {
    await saveProfile({ name: 'Ana', academy: 'GB', belt: 'blue', stripes: 2, startedAt: '2020-01-01', selfRatings: { flexibility: 4 } });
    await saveWeeklyGoal(3);
    expect(await getProfile()).toEqual({
      id: 'me', name: 'Ana', academy: 'GB', belt: 'blue', stripes: 2, startedAt: '2020-01-01', selfRatings: { flexibility: 4 }, weeklyGoal: 3,
    });
    await saveWeeklyGoal(undefined);
    expect(await getProfile()).not.toHaveProperty('weeklyGoal');
    expect(await getProfile()).toMatchObject({ name: 'Ana', startedAt: '2020-01-01' });
  });

  it.each([0, 15, 1.5, Number.NaN])('rejects weekly goal %s and keeps the stored one', async (bad) => {
    await saveWeeklyGoal(2);
    await expect(saveWeeklyGoal(bad)).rejects.toThrow();
    expect((await getProfile()).weeklyGoal).toBe(2);
  });

  it('stores the graduation goal, dropping empty fields, and clears it', async () => {
    await saveProfile({ name: 'Ana', academy: '', belt: 'purple', stripes: 0, weeklyGoal: 4 });
    await saveGraduationGoal({ classes: 100, hours: undefined, months: 6 });
    expect(await getProfile()).toMatchObject({ name: 'Ana', weeklyGoal: 4, graduationGoal: { classes: 100, months: 6 } });
    expect((await getProfile()).graduationGoal).not.toHaveProperty('hours');
    await saveGraduationGoal({});
    expect(await getProfile()).not.toHaveProperty('graduationGoal');
    expect((await getProfile()).weeklyGoal).toBe(4);
  });
});
