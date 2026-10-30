import type { Position } from './types';

export const TRANSITION_KINDS = ['takedown', 'pass', 'sweep', 'escape', 'control'] as const;
export type TransitionKind = (typeof TRANSITION_KINDS)[number];

export interface PositionEdge {
  from: Position;
  to: Position;
  kind: TransitionKind;
}

const edge = (from: Position, to: Position, kind: TransitionKind): PositionEdge => ({ from, to, kind });

const GUARDS: Position[] = [
  'closed_guard',
  'half_guard',
  'spider_guard',
  'de_la_riva',
  'butterfly_guard',
  'x_guard',
  'lasso_guard',
  'single_leg_x',
];

/** Fixed graph of common transitions between positions (not exhaustive). */
export const POSITION_EDGES: readonly PositionEdge[] = [
  // standing → guards (pull) and top positions (takedown)
  ...(['closed_guard', 'half_guard', 'spider_guard', 'de_la_riva', 'butterfly_guard'] as Position[]).map((to) =>
    edge('standing', to, 'takedown'),
  ),
  edge('standing', 'side_control', 'takedown'),
  edge('standing', 'turtle', 'takedown'),
  // guards → side control by pass
  ...GUARDS.map((from) => edge(from, 'side_control', 'pass')),
  edge('half_guard', 'knee_on_belly', 'pass'),
  edge('closed_guard', 'back', 'control'),
  // guards → top positions by sweep
  edge('closed_guard', 'mount', 'sweep'),
  edge('half_guard', 'side_control', 'sweep'),
  edge('spider_guard', 'mount', 'sweep'),
  edge('de_la_riva', 'standing', 'sweep'),
  edge('butterfly_guard', 'standing', 'sweep'),
  edge('x_guard', 'standing', 'sweep'),
  edge('lasso_guard', 'mount', 'sweep'),
  edge('single_leg_x', 'standing', 'sweep'),
  // top positions: advancing the control
  edge('side_control', 'mount', 'control'),
  edge('side_control', 'knee_on_belly', 'control'),
  edge('side_control', 'north_south', 'control'),
  edge('north_south', 'side_control', 'control'),
  edge('knee_on_belly', 'mount', 'control'),
  edge('knee_on_belly', 'side_control', 'control'),
  edge('mount', 'back', 'control'),
  edge('turtle', 'back', 'control'),
  edge('side_control', 'back', 'control'),
  edge('back', 'mount', 'control'),
  edge('north_south', 'mount', 'control'),
  // bottom positions → guard by escape
  edge('mount', 'half_guard', 'escape'),
  edge('mount', 'closed_guard', 'escape'),
  edge('side_control', 'half_guard', 'escape'),
  edge('side_control', 'closed_guard', 'escape'),
  edge('side_control', 'turtle', 'escape'),
  edge('knee_on_belly', 'half_guard', 'escape'),
  edge('north_south', 'closed_guard', 'escape'),
  edge('back', 'closed_guard', 'escape'),
  edge('back', 'turtle', 'escape'),
  edge('turtle', 'closed_guard', 'escape'),
  edge('turtle', 'half_guard', 'escape'),
];

export function outgoingEdges(position: Position): PositionEdge[] {
  return POSITION_EDGES.filter((e) => e.from === position);
}

export function incomingEdges(position: Position): PositionEdge[] {
  return POSITION_EDGES.filter((e) => e.to === position);
}
