import { describe, expect, it } from 'vitest';
import { DIVISIONS, divisionMinutes, penaltyRulesFor } from './divisions';

describe('IBJJF divisions (rules book 6.1, competition format article 1)', () => {
  it('uses the regulation match time of each age division', () => {
    expect(divisionMinutes('mightyMite')).toBe(2);
    expect(divisionMinutes('peeWee')).toBe(3);
    expect(divisionMinutes('junior')).toBe(4);
    expect(divisionMinutes('teenI')).toBe(4);
    expect(divisionMinutes('teenIII')).toBe(4);
    expect(divisionMinutes('juvenile')).toBe(5);
    expect(divisionMinutes('master')).toBe(5);
  });

  it('takes the adult match time from the belt', () => {
    expect(divisionMinutes('adult', 'white')).toBe(5);
    expect(divisionMinutes('adult', 'black')).toBe(10);
  });

  it('applies the under-15 penalty rules up to teen II', () => {
    expect(DIVISIONS.filter((d) => penaltyRulesFor(d) === 'youth')).toEqual(['mightyMite', 'peeWee', 'junior', 'teenI']);
  });
});
