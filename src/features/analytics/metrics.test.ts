import { describe, expect, it } from 'vitest';
import type { MatchEvent, SparringMatch, TrainingSession } from '../../domain/types';
import { computeAnalytics, dominantAxis, type Axis } from './metrics';

const match = (events: MatchEvent[] | undefined, id = 'm'): SparringMatch => ({
  id,
  date: '2026-10-01',
  mode: 'gi',
  durationSec: 300,
  athletes: [
    { name: 'Me', points: 0, advantages: 0, penalties: 0 },
    { name: 'Them', points: 0, advantages: 0, penalties: 0 },
  ],
  winner: null,
  method: 'draw',
  events,
  createdAt: '2026-10-01T10:00:00.000Z',
});

const session = (over: Partial<TrainingSession> = {}): TrainingSession => ({
  id: 's',
  date: '2026-10-01',
  durationMin: 60,
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
  ...over,
});

const pick = (results: ReturnType<typeof computeAnalytics>, axis: Axis) => results.find((r) => r.axis === axis)!;

describe('computeAnalytics', () => {
  it('scores consistency as sessions per week over the last eight weeks', () => {
    const today = '2026-10-28';
    const inWindow = (date: string, id: string) => session({ id, date });
    const results = computeAnalytics({
      today,
      matches: [],
      sessions: [
        // 16 sessions in 8 weeks = 2 per week, half of the 4 per week reference.
        ...Array.from({ length: 16 }, (_, i) => inWindow('2026-10-20', `in${i}`)),
        inWindow('2026-08-01', 'old'), // outside the window
        inWindow('2026-11-05', 'future'), // not yet happened
      ],
    });
    expect(pick(results, 'consistency')).toEqual({ axis: 'consistency', value: 50, hasData: true });
  });

  it('reports zero consistency, with data, when every session is older than the window', () => {
    const results = computeAnalytics({ today: '2026-10-28', matches: [], sessions: [session({ date: '2026-01-01' })] });
    expect(pick(results, 'consistency')).toEqual({ axis: 'consistency', value: 0, hasData: true });
  });

  it('returns the six axes clockwise from the top, all without data when nothing is logged', () => {
    const results = computeAnalytics({ matches: [], sessions: [] });
    expect(results.map((r) => r.axis)).toEqual(['pressure', 'wrestling', 'submission', 'defense', 'consistency', 'transitions', 'flexibility']);
    expect(results.every((r) => !r.hasData && r.value === 0)).toBe(true);
    expect(dominantAxis(results)).toBeUndefined();
  });

  it('scores pressure and transitions from the user actions in the match log', () => {
    const results = computeAnalytics({
      matches: [
        match([
          { athlete: 0, kind: 'guardPass' }, // 3
          { athlete: 0, kind: 'mount' }, // 4 -> 7 of 6, capped at 100
          { athlete: 0, kind: 'sweep' }, // 2 of 6
          { athlete: 1, kind: 'guardPass' }, // the opponent never counts for the user
        ]),
      ],
      sessions: [],
    });
    expect(pick(results, 'pressure')).toEqual({ axis: 'pressure', value: 100, hasData: true });
    expect(pick(results, 'transitions')).toEqual({ axis: 'transitions', value: 33, hasData: true });
    expect(dominantAxis(results)).toBe('pressure');
  });

  it('ignores matches saved without a scoring log', () => {
    const results = computeAnalytics({ matches: [match(undefined)], sessions: [] });
    expect(pick(results, 'pressure').hasData).toBe(false);
  });

  it('scores submission as finishes per sparring round', () => {
    const results = computeAnalytics({
      matches: [],
      sessions: [session({ sparringRounds: 10, subsAchieved: ['a', 'b'] })],
    });
    expect(pick(results, 'submission')).toEqual({ axis: 'submission', value: 50, hasData: true });
    expect(pick(computeAnalytics({ matches: [], sessions: [session()] }), 'submission').hasData).toBe(false);
  });

  it('combines takedowns and rounds per session into wrestling', () => {
    const results = computeAnalytics({
      matches: [match([{ athlete: 0, kind: 'takedown' }, { athlete: 0, kind: 'takedown' }])], // 4 of 4 -> 100
      sessions: [session({ sparringRounds: 3 })], // 3 of 6 -> 50
    });
    expect(pick(results, 'wrestling').value).toBe(75);
  });

  it('lowers defense with submissions suffered and points conceded', () => {
    const results = computeAnalytics({
      matches: [match([{ athlete: 1, kind: 'mount' }, { athlete: 1, kind: 'takedown' }])], // 6 of 8 -> 25
      sessions: [session({ sparringRounds: 10, subsSuffered: ['a', 'b'] })], // 0.2 of 0.5 -> 60
    });
    expect(pick(results, 'defense').value).toBe(43); // round(avg(60, 25))
  });

  it('takes flexibility from the self rating', () => {
    const results = computeAnalytics({ matches: [], sessions: [], selfRatings: { flexibility: 7 } });
    expect(pick(results, 'flexibility')).toEqual({ axis: 'flexibility', value: 70, hasData: true });
  });
});
