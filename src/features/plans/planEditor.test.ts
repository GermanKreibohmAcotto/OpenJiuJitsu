import { describe, expect, it } from 'vitest';
import type { PlanBlock } from '../../domain/types';
import {
  addBlock,
  addTechniqueToBlock,
  applyExampleTemplate,
  moveBlock,
  removeBlock,
  removeTechniqueFromBlock,
  updateBlock,
} from './planEditor';

const block = (id: string, extra: Partial<PlanBlock> = {}): PlanBlock => ({
  id,
  kind: 'drill',
  title: id,
  minutes: 10,
  techniqueIds: [],
  ...extra,
});

describe('planEditor', () => {
  it('adds a block at the end without mutating the input', () => {
    const blocks = [block('a')];
    const next = addBlock(blocks, { kind: 'sparring', title: 'Roll', minutes: 30 }, () => 'new');
    expect(next.map((b) => b.id)).toEqual(['a', 'new']);
    expect(next[1]).toEqual({ id: 'new', kind: 'sparring', title: 'Roll', minutes: 30, techniqueIds: [] });
    expect(blocks).toHaveLength(1);
  });

  it('updates and removes a block by id', () => {
    const blocks = [block('a'), block('b')];
    expect(updateBlock(blocks, 'b', { minutes: 5 })[1].minutes).toBe(5);
    expect(removeBlock(blocks, 'a').map((b) => b.id)).toEqual(['b']);
  });

  it('moves blocks and ignores out-of-range moves', () => {
    const blocks = [block('a'), block('b'), block('c')];
    expect(moveBlock(blocks, 'a', 1).map((b) => b.id)).toEqual(['b', 'a', 'c']);
    expect(moveBlock(blocks, 'c', -1).map((b) => b.id)).toEqual(['a', 'c', 'b']);
    expect(moveBlock(blocks, 'a', -1)).toEqual(blocks);
    expect(moveBlock(blocks, 'c', 1)).toEqual(blocks);
    expect(moveBlock(blocks, 'zzz', 1)).toEqual(blocks);
  });

  it('adds techniques without duplicates and removes them', () => {
    const blocks = [block('a', { techniqueIds: ['x'] })];
    const added = addTechniqueToBlock(blocks, 'a', 'y');
    expect(added[0].techniqueIds).toEqual(['x', 'y']);
    expect(addTechniqueToBlock(added, 'a', 'x')[0].techniqueIds).toEqual(['x', 'y']);
    expect(removeTechniqueFromBlock(added, 'a', 'x')[0].techniqueIds).toEqual(['y']);
  });

  it('applies the example template, prefilling only known technique ids', () => {
    let n = 0;
    const known = new Set(['hip-escape-drill', 'knee-slice']);
    const blocks = applyExampleTemplate(
      { drills: 'Drills', pass: 'Passes', sparring: 'Sparring' },
      known,
      () => `id${n++}`,
    );
    expect(blocks.map((b) => [b.kind, b.minutes])).toEqual([
      ['drill', 15],
      ['technique', 20],
      ['sparring', 30],
    ]);
    expect(blocks[0].techniqueIds).toEqual(['hip-escape-drill']);
    expect(blocks[1].techniqueIds).toEqual(['knee-slice']);
    expect(blocks[2].techniqueIds).toEqual([]);
  });
});
