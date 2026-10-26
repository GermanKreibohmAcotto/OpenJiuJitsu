import { describe, expect, it } from 'vitest';
import type { TrainingSession } from '../../domain/types';
import {
  countSubmissions,
  daysBetween,
  humanizeDays,
  filterByMode,
  minutesToHours,
  modeSplit,
  totalMinutes,
  totalSparringRounds,
} from './stats';

function session(partial: Partial<TrainingSession>): TrainingSession {
  return {
    id: 's',
    date: '2026-01-01',
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
    ...partial,
  };
}

const sessions = [
  session({ id: 'a', durationMin: 90, mode: 'gi', sparringRounds: 4, subsAchieved: ['kimura', 'armbar', 'kimura'], subsSuffered: ['triangle'] }),
  session({ id: 'b', durationMin: 60, mode: 'nogi', sparringRounds: 2, subsAchieved: ['armbar'], subsSuffered: ['triangle', 'rnc'] }),
];

describe('profile stats', () => {
  it('sums minutes and converts to hours rounded to one decimal', () => {
    expect(totalMinutes(sessions)).toBe(150);
    expect(minutesToHours(150)).toBe(2.5);
    expect(minutesToHours(100)).toBe(1.7);
    expect(totalMinutes([])).toBe(0);
  });

  it('sums sparring rounds', () => {
    expect(totalSparringRounds(sessions)).toBe(6);
  });

  it('filters by mode and keeps everything for "all"', () => {
    expect(filterByMode(sessions, 'gi').map((s) => s.id)).toEqual(['a']);
    expect(filterByMode(sessions, 'nogi').map((s) => s.id)).toEqual(['b']);
    expect(filterByMode(sessions, 'all')).toHaveLength(2);
  });

  it('counts submissions sorted by count desc, ties by id', () => {
    expect(countSubmissions(sessions, 'subsAchieved')).toEqual([
      { id: 'armbar', count: 2 },
      { id: 'kimura', count: 2 },
    ]);
    expect(countSubmissions(sessions, 'subsSuffered')).toEqual([
      { id: 'triangle', count: 2 },
      { id: 'rnc', count: 1 },
    ]);
    expect(countSubmissions([], 'subsAchieved')).toEqual([]);
  });

  it('splits sessions, minutes and rounds per mode', () => {
    expect(modeSplit(sessions)).toEqual({
      gi: { sessions: 1, minutes: 90, rounds: 4 },
      nogi: { sessions: 1, minutes: 60, rounds: 2 },
    });
  });

  it('measures and humanizes spans between graduations', () => {
    expect(daysBetween('2026-01-01', '2026-01-31')).toBe(30);
    expect(humanizeDays(30)).toEqual({ unit: 'days', count: 30 });
    expect(humanizeDays(365)).toEqual({ unit: 'months', count: 12 });
    expect(humanizeDays(1096)).toEqual({ unit: 'years', count: 3 });
  });
});
