import type { BlockKind, PlanBlock } from '../../domain/types';
import { newId } from '../../db/ids';

export interface NewBlock {
  kind: BlockKind;
  title: string;
  minutes: number;
}

export function addBlock(blocks: PlanBlock[], input: NewBlock, makeId: () => string = newId): PlanBlock[] {
  return [...blocks, { id: makeId(), ...input, techniqueIds: [] }];
}

export function updateBlock(blocks: PlanBlock[], id: string, patch: Partial<Omit<PlanBlock, 'id'>>): PlanBlock[] {
  return blocks.map((b) => (b.id === id ? { ...b, ...patch } : b));
}

export function removeBlock(blocks: PlanBlock[], id: string): PlanBlock[] {
  return blocks.filter((b) => b.id !== id);
}

/** Moves a block by `delta` positions; out-of-range moves leave the order unchanged. */
export function moveBlock(blocks: PlanBlock[], id: string, delta: number): PlanBlock[] {
  const from = blocks.findIndex((b) => b.id === id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= blocks.length) return blocks;
  const next = [...blocks];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function addTechniqueToBlock(blocks: PlanBlock[], blockId: string, techniqueId: string): PlanBlock[] {
  return blocks.map((b) =>
    b.id === blockId && !b.techniqueIds.includes(techniqueId) ? { ...b, techniqueIds: [...b.techniqueIds, techniqueId] } : b,
  );
}

export function removeTechniqueFromBlock(blocks: PlanBlock[], blockId: string, techniqueId: string): PlanBlock[] {
  return blocks.map((b) =>
    b.id === blockId ? { ...b, techniqueIds: b.techniqueIds.filter((id) => id !== techniqueId) } : b,
  );
}

export interface TemplateTitles {
  drills: string;
  pass: string;
  sparring: string;
}

/**
 * S4 example: 15 min hip drills + 20 min guard passes + 30 min sparring.
 * Technique ids are prefilled only when they exist in `knownIds`.
 */
export function applyExampleTemplate(
  titles: TemplateTitles,
  knownIds: ReadonlySet<string>,
  makeId: () => string = newId,
): PlanBlock[] {
  const known = (ids: string[]) => ids.filter((id) => knownIds.has(id));
  return [
    { id: makeId(), kind: 'drill', title: titles.drills, minutes: 15, techniqueIds: known(['hip-escape-drill', 'bridge-drill']) },
    { id: makeId(), kind: 'technique', title: titles.pass, minutes: 20, techniqueIds: known(['knee-slice', 'toreando-pass']) },
    { id: makeId(), kind: 'sparring', title: titles.sparring, minutes: 30, techniqueIds: [] },
  ];
}
