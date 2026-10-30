import { describe, expect, it } from 'vitest';
import { weeklyProgress } from './streak';

// 2026-10-26 is a Monday; 2026-11-01 a Sunday.
describe('weeklyProgress', () => {
  it('has nothing without sessions', () => {
    expect(weeklyProgress([], 2, '2026-10-30')).toEqual({ thisWeek: 0, current: 0, best: 0 });
  });

  it('counts the current week from Monday to Sunday', () => {
    const dates = ['2026-10-25', '2026-10-26', '2026-11-01', '2026-11-02'];
    expect(weeklyProgress(dates, 2, '2026-10-26').thisWeek).toBe(1);
    expect(weeklyProgress(dates, 2, '2026-11-01').thisWeek).toBe(2);
    expect(weeklyProgress(dates, 2, '2026-11-02').thisWeek).toBe(1);
  });

  it('counts every session, several on the same day too', () => {
    expect(weeklyProgress(['2026-10-27', '2026-10-27'], 2, '2026-10-30')).toEqual({ thisWeek: 2, current: 1, best: 1 });
  });

  it('counts the current week in the streak only once the goal is met', () => {
    const previous = ['2026-10-19', '2026-10-20', '2026-10-12', '2026-10-13'];
    expect(weeklyProgress([...previous, '2026-10-27'], 2, '2026-10-30')).toMatchObject({ thisWeek: 1, current: 2 });
    expect(weeklyProgress([...previous, '2026-10-27', '2026-10-28'], 2, '2026-10-30')).toMatchObject({ thisWeek: 2, current: 3 });
  });

  it('breaks the streak when a past week misses the goal', () => {
    const dates = ['2026-10-05', '2026-10-06', '2026-10-12', '2026-10-19', '2026-10-20', '2026-10-27', '2026-10-28'];
    expect(weeklyProgress(dates, 2, '2026-10-30')).toEqual({ thisWeek: 2, current: 2, best: 2 });
  });

  it('resets the current streak when the previous week was missed', () => {
    const dates = ['2026-10-05', '2026-10-06', '2026-10-12', '2026-10-13', '2026-10-19'];
    expect(weeklyProgress(dates, 2, '2026-10-30')).toEqual({ thisWeek: 0, current: 0, best: 2 });
  });

  it('keeps the best streak from the past', () => {
    const dates = ['2026-09-07', '2026-09-14', '2026-09-21', '2026-10-26'];
    expect(weeklyProgress(dates, 1, '2026-10-30')).toEqual({ thisWeek: 1, current: 1, best: 3 });
  });

  it('ignores sessions after today', () => {
    expect(weeklyProgress(['2026-11-10'], 1, '2026-10-30')).toEqual({ thisWeek: 0, current: 0, best: 0 });
  });

  it('crosses year boundaries', () => {
    const dates = ['2025-12-29', '2026-01-05'];
    expect(weeklyProgress(dates, 1, '2026-01-07')).toEqual({ thisWeek: 1, current: 2, best: 2 });
  });
});
