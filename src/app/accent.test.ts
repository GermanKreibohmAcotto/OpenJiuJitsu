import { afterEach, describe, expect, it } from 'vitest';
import { ACCENT_PRESETS, BELT_ACCENTS, DEFAULT_ACCENT, applyAccent, inkFor, isHexColor, luminance } from './accent';
import { BELTS } from '../domain/types';

afterEach(() => document.documentElement.removeAttribute('style'));

describe('accent color', () => {
  it('accepts only #rrggbb values', () => {
    expect(isHexColor('#a3e635')).toBe(true);
    expect(isHexColor('#A3E635')).toBe(true);
    for (const bad of ['a3e635', '#fff', '#12345g', 'red', '', null, 42]) expect(isHexColor(bad)).toBe(false);
  });

  it('picks dark text on light accents and white text on dark ones', () => {
    expect(inkFor('#ffffff')).toBe('#0b0d10');
    expect(inkFor(DEFAULT_ACCENT)).toBe('#0b0d10');
    expect(inkFor('#1d4ed8')).toBe('#ffffff');
    expect(inkFor('#000000')).toBe('#ffffff');
  });

  it('offers valid, distinct presets that include the default', () => {
    expect(ACCENT_PRESETS.every((p) => isHexColor(p.hex))).toBe(true);
    expect(new Set(ACCENT_PRESETS.map((p) => p.hex)).size).toBe(ACCENT_PRESETS.length);
    expect(ACCENT_PRESETS[0].hex).toBe(DEFAULT_ACCENT);
  });

  it('maps every belt to a valid accent that stays visible on the dark background', () => {
    expect(Object.keys(BELT_ACCENTS).sort()).toEqual([...BELTS].sort());
    for (const belt of BELTS) {
      expect(isHexColor(BELT_ACCENTS[belt]), belt).toBe(true);
      expect(luminance(BELT_ACCENTS[belt]), belt).toBeGreaterThan(0.1);
    }
  });

  it('writes the theme variables, and clears them for the default', () => {
    const root = document.documentElement;
    applyAccent('#3b82f6');
    expect(root.style.getPropertyValue('--color-accent')).toBe('#3b82f6');
    expect(root.style.getPropertyValue('--color-accent-ink')).toBe('#ffffff');
    applyAccent(DEFAULT_ACCENT);
    expect(root.style.getPropertyValue('--color-accent')).toBe('');
    expect(root.style.getPropertyValue('--color-accent-ink')).toBe('');
  });
});
