import { describe, expect, it } from 'vitest';
import { addEvent, computeTotals, decideMatch, decideWinner, disqualified, SCORE_VALUES, undoLast, type ScoreEvent } from './scoring';

function build(...entries: [0 | 1, ScoreEvent['kind']][]): ScoreEvent[] {
  return entries.reduce<ScoreEvent[]>((events, [athlete, kind]) => addEvent(events, athlete, kind), []);
}

describe('scoring values', () => {
  it('uses IBJJF adult point values', () => {
    expect(SCORE_VALUES).toEqual({
      takedown: 2,
      sweep: 2,
      kneeOnBelly: 2,
      guardPass: 3,
      mount: 4,
      backControl: 4,
    });
  });

  it('totals points, advantages and penalties per athlete', () => {
    const events = build([0, 'takedown'], [0, 'mount'], [1, 'guardPass'], [1, 'advantage'], [0, 'penalty'], [1, 'advantage']);
    expect(computeTotals(events)).toEqual([
      { points: 6, advantages: 0, penalties: 1 },
      { points: 3, advantages: 2, penalties: 0 },
    ]);
  });

  it('starts at zero', () => {
    expect(computeTotals([])).toEqual([
      { points: 0, advantages: 0, penalties: 0 },
      { points: 0, advantages: 0, penalties: 0 },
    ]);
  });
});

describe('undo', () => {
  it('removes only the last event without mutating the input', () => {
    const events = build([0, 'takedown'], [1, 'sweep']);
    const after = undoLast(events);
    expect(after).toHaveLength(1);
    expect(computeTotals(after)[1].points).toBe(0);
    expect(events).toHaveLength(2);
  });

  it('is a no-op on an empty log', () => {
    expect(undoLast([])).toEqual([]);
  });
});

describe('decideWinner', () => {
  it('prefers more points', () => {
    const totals = computeTotals(build([1, 'mount'], [0, 'takedown'], [0, 'advantage'], [0, 'advantage']));
    expect(decideWinner(totals)).toEqual({ winner: 1, method: 'points' });
  });

  it('breaks a points tie with advantages', () => {
    const totals = computeTotals(build([0, 'takedown'], [1, 'sweep'], [1, 'advantage']));
    expect(decideWinner(totals)).toEqual({ winner: 1, method: 'advantages' });
  });

  it('breaks a points and advantages tie with fewer penalties', () => {
    const totals = computeTotals(build([0, 'takedown'], [1, 'sweep'], [0, 'penalty']));
    expect(decideWinner(totals)).toEqual({ winner: 1, method: 'penalties' });
  });

  it('is a draw when everything is level', () => {
    expect(decideWinner(computeTotals(build([0, 'takedown'], [1, 'sweep'])))).toEqual({ winner: null, method: 'draw' });
  });
});

describe('penalty escalation (IBJJF rules book 6.1, article 7.2)', () => {
  const pen = (n: number, athlete: 0 | 1 = 0): [0 | 1, ScoreEvent['kind']][] => Array.from({ length: n }, () => [athlete, 'penalty']);

  it('only marks the first penalty', () => {
    expect(computeTotals(build(...pen(1)))).toEqual([
      { points: 0, advantages: 0, penalties: 1 },
      { points: 0, advantages: 0, penalties: 0 },
    ]);
  });

  it('gives the opponent an advantage on the second penalty', () => {
    expect(computeTotals(build(...pen(2)))[1]).toEqual({ points: 0, advantages: 1, penalties: 0 });
  });

  it('gives the opponent two points on the third penalty', () => {
    expect(computeTotals(build(...pen(3)))).toEqual([
      { points: 0, advantages: 0, penalties: 3 },
      { points: 2, advantages: 1, penalties: 0 },
    ]);
  });

  it('disqualifies on the fourth penalty and the opponent wins', () => {
    expect(disqualified(build(...pen(3)))).toBeNull();
    expect(disqualified(build(...pen(4, 1)))).toBe(1);
    const events = build([0, 'mount'], ...pen(4, 1));
    expect(decideMatch(events)).toEqual({ winner: 0, method: 'penalties' });
  });

  it('under-15 divisions award two points on the fourth and fifth penalties and disqualify on the sixth', () => {
    expect(computeTotals(build(...pen(5)), 'youth')[1]).toEqual({ points: 6, advantages: 1, penalties: 0 });
    expect(disqualified(build(...pen(5)), 'youth')).toBeNull();
    expect(disqualified(build(...pen(6)), 'youth')).toBe(0);
  });

  it('keeps a points decision when nobody is disqualified', () => {
    expect(decideMatch(build([0, 'takedown'], [1, 'sweep'], [1, 'advantage']))).toEqual({ winner: 1, method: 'advantages' });
  });
});
