import { describe, expect, it } from 'vitest';
import { POSITIONS } from './types';
import { POSITION_EDGES, TRANSITION_KINDS, incomingEdges, outgoingEdges } from './positionGraph';

describe('position graph', () => {
  it('has at least one edge for every position', () => {
    for (const position of POSITIONS) {
      const touching = POSITION_EDGES.filter((e) => e.from === position || e.to === position);
      expect(touching.length, position).toBeGreaterThan(0);
    }
  });

  it('only references known positions and kinds, without self loops', () => {
    for (const edge of POSITION_EDGES) {
      expect(POSITIONS).toContain(edge.from);
      expect(POSITIONS).toContain(edge.to);
      expect(TRANSITION_KINDS).toContain(edge.kind);
      expect(edge.from).not.toBe(edge.to);
    }
  });

  it('has no duplicated edges', () => {
    const keys = POSITION_EDGES.map((e) => `${e.from}>${e.to}:${e.kind}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('exposes outgoing and incoming edges', () => {
    expect(outgoingEdges('mount')).toContainEqual({ from: 'mount', to: 'back', kind: 'control' });
    expect(incomingEdges('mount')).toContainEqual({ from: 'side_control', to: 'mount', kind: 'control' });
    expect(outgoingEdges('mount').every((e) => e.from === 'mount')).toBe(true);
    expect(incomingEdges('mount').every((e) => e.to === 'mount')).toBe(true);
  });

  it('covers the main flow of the spec', () => {
    expect(outgoingEdges('standing')).toContainEqual({ from: 'standing', to: 'closed_guard', kind: 'takedown' });
    expect(outgoingEdges('closed_guard')).toContainEqual({ from: 'closed_guard', to: 'side_control', kind: 'pass' });
    expect(outgoingEdges('side_control')).toContainEqual({ from: 'side_control', to: 'mount', kind: 'control' });
    expect(outgoingEdges('mount')).toContainEqual({ from: 'mount', to: 'half_guard', kind: 'escape' });
    expect(outgoingEdges('closed_guard')).toContainEqual({ from: 'closed_guard', to: 'mount', kind: 'sweep' });
  });
});
