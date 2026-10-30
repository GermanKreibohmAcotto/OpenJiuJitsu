import { describe, expect, it } from 'vitest';
import type { Graduation, Profile, TrainingSession } from '../../domain/types';
import { graduationProgress } from './progress';

function session(date: string, durationMin = 60): TrainingSession {
  return {
    id: date + durationMin,
    date,
    durationMin,
    mode: 'gi',
    physicalDifficulty: 5,
    technicalDifficulty: 5,
    feelings: [],
    sparringRounds: 0,
    subsAchieved: [],
    subsSuffered: [],
    notes: '',
    createdAt: '',
    updatedAt: '',
  };
}

const grad = (date: string, id = date): Graduation => ({ id, belt: 'blue', stripes: 0, date });
const profile = (overrides: Partial<Profile> = {}): Profile => ({
  id: 'me',
  name: '',
  academy: '',
  belt: 'blue',
  stripes: 0,
  ...overrides,
});

const today = '2026-10-30';

describe('graduationProgress', () => {
  it('counts classes and hours since the latest graduation, inclusive', () => {
    const sessions = [session('2025-12-31', 600), session('2026-01-01', 90), session('2026-05-01', 30)];
    const result = graduationProgress({
      sessions,
      graduations: [grad('2024-01-01'), grad('2026-01-01')],
      profile: profile({ startedAt: '2020-01-01' }),
      today,
    });
    expect(result).toMatchObject({ since: '2026-01-01', classes: 2, hours: 2 });
  });

  it('falls back to the start date, then to all sessions', () => {
    const sessions = [session('2024-01-01', 60), session('2026-01-01', 60)];
    const started = graduationProgress({ sessions, graduations: [], profile: profile({ startedAt: '2025-06-01' }), today });
    expect(started).toMatchObject({ since: '2025-06-01', classes: 1 });
    const none = graduationProgress({ sessions, graduations: [], profile: profile(), today });
    expect(none).toMatchObject({ since: '2024-01-01', classes: 2, hours: 2 });
    const empty = graduationProgress({ sessions: [], graduations: [], profile: profile(), today });
    expect(empty).toMatchObject({ since: undefined, classes: 0, hours: 0, months: 0 });
  });

  it('measures time at the belt in months', () => {
    const result = graduationProgress({ sessions: [], graduations: [grad('2025-10-30')], profile: profile(), today });
    expect(result.months).toBe(12);
  });

  it.each([
    ['blue', 24],
    ['purple', 18],
    ['brown', 12],
  ] as const)('uses the IBJJF minimum for %s', (belt, months) => {
    const result = graduationProgress({ sessions: [], graduations: [grad('2025-10-30')], profile: profile({ belt }), today });
    expect(result.bars).toEqual([{ key: 'months', current: 12, target: months, source: 'ibjjf', ratio: 12 / months }]);
    expect(result.noMinimum).toBe(false);
  });

  it.each(['white', 'black'] as const)('has no IBJJF minimum for %s', (belt) => {
    const result = graduationProgress({ sessions: [], graduations: [], profile: profile({ belt }), today });
    expect(result.bars).toEqual([]);
    expect(result.noMinimum).toBe(true);
  });

  it('caps the ratio at 1', () => {
    const result = graduationProgress({ sessions: [], graduations: [grad('2020-01-01')], profile: profile(), today });
    expect(result.bars[0].ratio).toBe(1);
  });

  it('lets each own field replace the reference with its own bar', () => {
    const sessions = Array.from({ length: 5 }, (_, i) => session(`2026-10-0${i + 1}`, 120));
    const result = graduationProgress({
      sessions,
      graduations: [grad('2026-04-30')],
      profile: profile({ graduationGoal: { classes: 20, hours: 40 } }),
      today,
    });
    expect(result.bars).toEqual([
      { key: 'classes', current: 5, target: 20, source: 'own', ratio: 0.25 },
      { key: 'hours', current: 10, target: 40, source: 'own', ratio: 0.25 },
      { key: 'months', current: 6, target: 24, source: 'ibjjf', ratio: 0.25 },
    ]);
  });

  it('own months replaces the IBJJF one, also where there is no reference', () => {
    const base = { sessions: [], graduations: [grad('2026-04-30')], today };
    const blue = graduationProgress({ ...base, profile: profile({ graduationGoal: { months: 12 } }) });
    expect(blue.bars).toEqual([{ key: 'months', current: 6, target: 12, source: 'own', ratio: 0.5 }]);
    const white = graduationProgress({ ...base, profile: profile({ belt: 'white', graduationGoal: { months: 12 } }) });
    expect(white.bars).toHaveLength(1);
    expect(white.noMinimum).toBe(false);
  });

  it('returns to the reference when the goal is cleared', () => {
    const base = { sessions: [], graduations: [grad('2026-04-30')], today };
    const cleared = graduationProgress({ ...base, profile: profile({ graduationGoal: undefined }) });
    const empty = graduationProgress({ ...base, profile: profile({ graduationGoal: {} }) });
    expect(cleared.bars).toEqual(empty.bars);
    expect(cleared.bars).toEqual([{ key: 'months', current: 6, target: 24, source: 'ibjjf', ratio: 0.25 }]);
  });
});
