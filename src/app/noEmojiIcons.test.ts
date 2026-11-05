import { describe, expect, it } from 'vitest';

// UI icons come from Material Symbols (components/Icon), never from emojis or text glyphs.
const ICON_GLYPHS = /[\p{Extended_Pictographic}←-⇿✕✖⠀-⣿−️]/u;
const SOURCES = import.meta.glob<string>('../**/*.tsx', { query: '?raw', import: 'default', eager: true });

describe('UI icons', () => {
  it('uses no emojis or symbol glyphs in components', () => {
    const offenders = Object.entries(SOURCES).flatMap(([file, source]) =>
      source.split('\n').flatMap((line, i) => (ICON_GLYPHS.test(line) ? [`${file}:${i + 1}: ${line.trim()}`] : [])),
    );
    expect(Object.keys(SOURCES).length).toBeGreaterThan(20);
    expect(offenders).toEqual([]);
  });
});
