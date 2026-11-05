import { describe, expect, it } from 'vitest';
import { SEED_TECHNIQUES } from '../db/seedData';
import { LEGALITY_PRESETS } from '../domain/belts';
import { BELTS } from '../domain/types';
import { BELT_ROUND_MINUTES } from '../features/sparring/timer';
import { TECHNIQUE_COUNT, fmt, legalityRows, libraryRows, radarPoint, roundMinutes } from './landingData';

describe('landingData', () => {
  it('counts the techniques the app ships with', () => {
    expect(TECHNIQUE_COUNT).toBe(SEED_TECHNIQUES.length);
  });

  it('takes legality rows from the techniques themselves', () => {
    const rows = legalityRows('es');
    expect(rows.map((row) => row.id)).toEqual(['rear-naked-choke', 'wrist-lock', 'kneebar', 'inside-heel-hook']);
    const byId = Object.fromEntries(rows.map((row) => [row.id, row]));
    expect(byId['rear-naked-choke']).toMatchObject(LEGALITY_PRESETS.allBelts);
    expect(byId['wrist-lock']).toMatchObject({ gi: 'blue', nogi: 'blue' });
    expect(byId['kneebar']).toMatchObject({ gi: 'brown', nogi: 'brown' });
    expect(byId['inside-heel-hook']).toMatchObject({ gi: null, nogi: 'brown' });
    expect(byId['rear-naked-choke'].name).toBe('Mata león');
    expect(legalityRows('en')[0].name).toBe('Rear naked choke');
  });

  it('exposes the round minutes per belt from the sparring timer', () => {
    expect(roundMinutes().map((row) => row.belt)).toEqual([...BELTS]);
    for (const { belt, minutes } of roundMinutes()) expect(minutes).toBe(BELT_ROUND_MINUTES[belt]);
  });

  it('resolves counterpart names and picks a pass and a sweep by type', () => {
    const rows = libraryRows('es');
    expect(rows.slice(0, 2).map((row) => row.id)).toEqual(['triangle-closed-guard', 'kimura-closed-guard']);
    const byId = new Map(SEED_TECHNIQUES.map((t) => [t.id, t]));
    for (const row of rows.slice(0, 2)) {
      const counterpartId = byId.get(row.id)!.counterpartIds[0];
      expect(row.counterpart).toBe(byId.get(counterpartId)!.name.es);
    }
    expect(rows.map((row) => byId.get(row.id)!.type)).toEqual(['submission', 'submission', 'pass', 'sweep']);
    expect(libraryRows('en')[0].name).toBe('Triangle from closed guard');
  });

  it('interpolates {{x}} placeholders', () => {
    expect(fmt('{{a}} de {{b}}', { a: 2, b: 'tres' })).toBe('2 de tres');
  });

  it('places radar vertices from the score, starting at the top', () => {
    const top = radarPoint(0, 100);
    expect(top.x).toBeCloseTo(160);
    expect(top.y).toBeCloseTo(50);
    expect(radarPoint(0, 0)).toEqual({ x: 160, y: 150 });
  });
});
