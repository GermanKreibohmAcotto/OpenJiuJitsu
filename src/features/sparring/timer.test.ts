import { describe, expect, it } from 'vitest';
import { createTimer, fightedMs, pause, remainingMs, reset, resume, start, sync, type TimerConfig } from './timer';

const config: TimerConfig = { roundSec: 300, restSec: 60, rounds: 2 };
const T0 = 1_000_000;
const sec = (n: number) => n * 1000;

describe('timer state machine', () => {
  it('stays idle until started', () => {
    const state = createTimer();
    expect(state.phase).toBe('idle');
    expect(remainingMs(state, config, T0)).toBe(sec(300));
    expect(sync(state, config, T0 + sec(999))).toBe(state);
  });

  it('counts down from timestamps, not ticks', () => {
    const state = start(createTimer(), T0);
    expect(state.phase).toBe('round');
    expect(state.round).toBe(1);
    // A single late sync (background tab) still yields the right remaining time.
    expect(remainingMs(state, config, T0 + sec(100))).toBe(sec(200));
  });

  it('goes round -> rest -> next round -> finished', () => {
    let state = start(createTimer(), T0);
    state = sync(state, config, T0 + sec(300));
    expect(state.phase).toBe('rest');
    expect(remainingMs(state, config, T0 + sec(300))).toBe(sec(60));
    state = sync(state, config, T0 + sec(360));
    expect(state).toMatchObject({ phase: 'round', round: 2 });
    state = sync(state, config, T0 + sec(660));
    expect(state.phase).toBe('finished');
    expect(state.running).toBe(false);
    expect(remainingMs(state, config, T0 + sec(700))).toBe(0);
  });

  it('carries overflow across phases after a long gap', () => {
    const state = sync(start(createTimer(), T0), config, T0 + sec(330));
    expect(state.phase).toBe('rest');
    expect(remainingMs(state, config, T0 + sec(330))).toBe(sec(30));
  });

  it('skips the rest phase when restSec is 0', () => {
    const noRest = { ...config, restSec: 0 };
    const state = sync(start(createTimer(), T0), noRest, T0 + sec(300));
    expect(state).toMatchObject({ phase: 'round', round: 2 });
  });

  it('pause keeps the remaining time and resume continues from it', () => {
    let state = start(createTimer(), T0);
    state = pause(state, T0 + sec(100));
    expect(remainingMs(state, config, T0 + sec(5000))).toBe(sec(200));
    expect(sync(state, config, T0 + sec(5000))).toBe(state);
    state = resume(state, T0 + sec(5000));
    expect(remainingMs(state, config, T0 + sec(5050))).toBe(sec(150));
  });

  it('reset returns to idle', () => {
    const state = reset();
    expect(state).toEqual(createTimer());
  });

  it('reports fought time across rounds, excluding rest', () => {
    let state = start(createTimer(), T0);
    state = sync(state, config, T0 + sec(330));
    expect(fightedMs(state, config, T0 + sec(330))).toBe(sec(300));
    state = sync(state, config, T0 + sec(400));
    expect(fightedMs(state, config, T0 + sec(400))).toBe(sec(340));
  });
});
