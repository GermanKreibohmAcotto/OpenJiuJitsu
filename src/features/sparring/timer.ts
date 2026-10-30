/**
 * Round/rest timer as a pure state machine. Remaining time is derived from
 * timestamps (`now`), so it never drifts and survives throttled background tabs.
 */
export interface TimerConfig {
  roundSec: number;
  restSec: number;
  rounds: number;
}

export type TimerPhase = 'idle' | 'round' | 'rest' | 'finished';

export interface TimerState {
  phase: TimerPhase;
  /** 1-based current round. */
  round: number;
  running: boolean;
  /** Timestamp from which `elapsedBeforeMs` keeps counting while running. */
  startedAt: number;
  /** Time already consumed in the current phase before `startedAt`. */
  elapsedBeforeMs: number;
}

export function createTimer(): TimerState {
  return { phase: 'idle', round: 1, running: false, startedAt: 0, elapsedBeforeMs: 0 };
}

export const reset = createTimer;

export function start(state: TimerState, now: number): TimerState {
  if (state.phase !== 'idle') return state;
  return { phase: 'round', round: 1, running: true, startedAt: now, elapsedBeforeMs: 0 };
}

export function pause(state: TimerState, now: number): TimerState {
  if (!state.running) return state;
  return { ...state, running: false, elapsedBeforeMs: elapsedMs(state, now) };
}

export function resume(state: TimerState, now: number): TimerState {
  if (state.running || state.phase === 'idle' || state.phase === 'finished') return state;
  return { ...state, running: true, startedAt: now };
}

function elapsedMs(state: TimerState, now: number): number {
  return state.elapsedBeforeMs + (state.running ? Math.max(0, now - state.startedAt) : 0);
}

function phaseMs(state: TimerState, config: TimerConfig): number {
  if (state.phase === 'round') return config.roundSec * 1000;
  if (state.phase === 'rest') return config.restSec * 1000;
  return 0;
}

export function remainingMs(state: TimerState, config: TimerConfig, now: number): number {
  if (state.phase === 'idle') return config.roundSec * 1000;
  if (state.phase === 'finished') return 0;
  return Math.max(0, phaseMs(state, config) - elapsedMs(state, now));
}

/** Milliseconds spent fighting (rest excluded) across all rounds so far. */
export function fightedMs(state: TimerState, config: TimerConfig, now: number): number {
  const full = config.roundSec * 1000;
  switch (state.phase) {
    case 'idle':
      return 0;
    case 'round':
      return (state.round - 1) * full + Math.min(full, elapsedMs(state, now));
    case 'rest':
      return state.round * full;
    case 'finished':
      return config.rounds * full;
  }
}

/** Moves to the following phase; `startedAt` is the instant the new phase began. */
function advance(state: TimerState, config: TimerConfig, startedAt: number): TimerState {
  const next = { ...state, startedAt, elapsedBeforeMs: 0 };
  if (state.phase === 'round') {
    if (state.round >= config.rounds) return { ...next, phase: 'finished', running: false };
    if (config.restSec > 0) return { ...next, phase: 'rest' };
    return { ...next, phase: 'round', round: state.round + 1 };
  }
  return { ...next, phase: 'round', round: state.round + 1 };
}

/** Applies every phase boundary crossed up to `now`. Returns the same object when nothing changed. */
export function sync(state: TimerState, config: TimerConfig, now: number): TimerState {
  let current = state;
  while (current.running && (current.phase === 'round' || current.phase === 'rest')) {
    const left = phaseMs(current, config) - elapsedMs(current, now);
    if (left > 0) break;
    current = advance(current, config, now + left);
  }
  return current;
}

/** IBJJF adult round length in minutes per belt. */
export const BELT_ROUND_MINUTES = { white: 5, blue: 6, purple: 7, brown: 8, black: 10 } as const;

export type TimerCue = 'start' | 'warning' | 'end';

/** Remaining time at which a round gives its warning beep. */
export const WARNING_MS = 30_000;

/**
 * Which beep (if any) the move from one timer snapshot to the next calls for.
 * `start` also covers a rest ending into the next round; `warning` fires once, when
 * the clock crosses 30 s left, and only for rounds longer than 30 s.
 */
export function cueBetween(
  before: TimerState,
  after: TimerState,
  config: TimerConfig,
  beforeNow: number,
  afterNow: number,
): TimerCue | null {
  if (before.phase === 'idle') return after.phase === 'round' ? 'start' : null;
  if (before.phase !== after.phase || before.round !== after.round) {
    if (after.phase === 'idle') return null;
    return after.phase === 'round' && before.phase === 'rest' ? 'start' : 'end';
  }
  if (after.phase === 'round' && config.roundSec * 1000 > WARNING_MS) {
    const wasAbove = remainingMs(before, config, beforeNow) > WARNING_MS;
    if (wasAbove && remainingMs(after, config, afterNow) <= WARNING_MS) return 'warning';
  }
  return null;
}
