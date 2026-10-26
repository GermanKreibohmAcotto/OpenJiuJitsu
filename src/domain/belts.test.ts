import { describe, expect, it } from 'vitest';
import { allowedBelts, isAllowedFor, LEGALITY_PRESETS } from './belts';

describe('belt legality (IBJJF adult)', () => {
  it('allows all-belt submissions to white belts in GI and NoGI', () => {
    expect(isAllowedFor(LEGALITY_PRESETS.allBelts, 'gi', 'white')).toBe(true);
    expect(isAllowedFor(LEGALITY_PRESETS.allBelts, 'nogi', 'white')).toBe(true);
  });

  it('restricts wrist locks to blue belt and above', () => {
    expect(isAllowedFor(LEGALITY_PRESETS.blueAndUp, 'gi', 'white')).toBe(false);
    expect(allowedBelts(LEGALITY_PRESETS.blueAndUp, 'gi')).toEqual(['blue', 'purple', 'brown', 'black']);
  });

  it('restricts kneebars and toe holds to brown and black', () => {
    expect(isAllowedFor(LEGALITY_PRESETS.brownAndUp, 'nogi', 'purple')).toBe(false);
    expect(allowedBelts(LEGALITY_PRESETS.brownAndUp, 'nogi')).toEqual(['brown', 'black']);
  });

  it('allows heel hooks only for brown/black in NoGI and never in GI', () => {
    expect(allowedBelts(LEGALITY_PRESETS.heelHook, 'gi')).toEqual([]);
    expect(allowedBelts(LEGALITY_PRESETS.heelHook, 'nogi')).toEqual(['brown', 'black']);
  });

  it('treats techniques without legality data as allowed', () => {
    expect(isAllowedFor(undefined, 'gi', 'white')).toBe(true);
  });
});
