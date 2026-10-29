import type { Belt } from '../domain/types';

export const DEFAULT_ACCENT = '#a3e635';

/**
 * Accent per belt, tuned to stay visible on the dark theme: the real brown and black
 * belts would vanish into the background, so brown is lightened and black uses the
 * red of its bar.
 */
export const BELT_ACCENTS: Record<Belt, string> = {
  white: '#f4f4f5',
  blue: '#3b82f6',
  purple: '#a855f7',
  brown: '#c2813b',
  black: '#ef4444',
};

/** Ready-made accent colors, in the order they are offered. */
export const ACCENT_PRESETS = [
  { key: 'lime', hex: DEFAULT_ACCENT },
  { key: 'red', hex: '#ef4444' },
  { key: 'orange', hex: '#f97316' },
  { key: 'amber', hex: '#f59e0b' },
  { key: 'cyan', hex: '#22d3ee' },
  { key: 'blue', hex: '#3b82f6' },
  { key: 'violet', hex: '#8b5cf6' },
  { key: 'pink', hex: '#ec4899' },
] as const;

const HEX = /^#[0-9a-f]{6}$/i;

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX.test(value);
}

/** WCAG relative luminance of a #rrggbb color, 0 (black) to 1 (white). */
export function luminance(hex: string): number {
  const channel = (start: number) => {
    const c = parseInt(hex.slice(start, start + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** Text color that stays readable on top of `hex` (dark on light accents, white on dark ones). */
export function inkFor(hex: string): string {
  return luminance(hex) > 0.35 ? '#0b0d10' : '#ffffff';
}

/** Writes the accent into the theme variables. The default clears the overrides so the stylesheet applies. */
export function applyAccent(hex: string, root: HTMLElement = document.documentElement) {
  if (hex.toLowerCase() === DEFAULT_ACCENT) {
    root.style.removeProperty('--color-accent');
    root.style.removeProperty('--color-accent-ink');
    return;
  }
  root.style.setProperty('--color-accent', hex);
  root.style.setProperty('--color-accent-ink', inkFor(hex));
}
