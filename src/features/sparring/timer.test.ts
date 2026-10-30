import { describe, expect, it } from 'vitest';
import { createTimer, cueBetween, fightedMs, pause, remainingMs, reset, resume, start, sync, type TimerConfig } from './timer';

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

describe('cueBetween', () => {
  const cfg: TimerConfig = { roundSec: 300, restSec: 60, rounds: 2 };
  const running = start(createTimer(), T0);

  it('beeps at the start of the first round', () => {
    expect(cueBetween(createTimer(), running, cfg, T0, T0)).toBe('start');
  });

  it('warns once when 30 s remain, not before and not again', () => {
    expect(cueBetween(running, running, cfg, T0, T0 + sec(269))).toBeNull();
    expect(cueBetween(running, running, cfg, T0 + sec(269), T0 + sec(270))).toBe('warning');
    expect(cueBetween(running, running, cfg, T0 + sec(270), T0 + sec(271))).toBeNull();
    // Coming back from a throttled tab past the mark still warns once.
    expect(cueBetween(running, running, cfg, T0 + sec(100), T0 + sec(280))).toBe('warning');
  });

  it('does not warn for rounds of 30 s or less', () => {
    const short: TimerConfig = { roundSec: 30, restSec: 10, rounds: 1 };
    expect(cueBetween(running, running, short, T0, T0 + sec(1))).toBeNull();
    const shorter: TimerConfig = { roundSec: 20, restSec: 10, rounds: 1 };
    expect(cueBetween(running, running, shorter, T0, T0 + sec(10))).toBeNull();
  });

  it('does not warn during rest', () => {
    const rest = sync(running, cfg, T0 + sec(300));
    expect(rest.phase).toBe('rest');
    expect(cueBetween(rest, rest, cfg, T0 + sec(300), T0 + sec(331))).toBeNull();
  });

  it('beeps at round end, with and without rest, and when finished', () => {
    const rest = sync(running, cfg, T0 + sec(300));
    expect(cueBetween(running, rest, cfg, T0 + sec(299), T0 + sec(300))).toBe('end');
    const noRest: TimerConfig = { ...cfg, restSec: 0 };
    expect(cueBetween(running, sync(running, noRest, T0 + sec(300)), noRest, T0 + sec(299), T0 + sec(300))).toBe('end');
    const second = sync(rest, cfg, T0 + sec(360));
    const done = sync(second, cfg, T0 + sec(660));
    expect(done.phase).toBe('finished');
    expect(cueBetween(second, done, cfg, T0 + sec(659), T0 + sec(660))).toBe('end');
  });

  it('beeps when the rest ends and the next round starts', () => {
    const rest = sync(running, cfg, T0 + sec(300));
    const second = sync(rest, cfg, T0 + sec(360));
    expect(second.phase).toBe('round');
    expect(cueBetween(rest, second, cfg, T0 + sec(359), T0 + sec(360))).toBe('start');
  });

  it('stays silent on pause, resume and reset', () => {
    const paused = pause(running, T0 + sec(10));
    expect(cueBetween(running, paused, cfg, T0 + sec(10), T0 + sec(10))).toBeNull();
    expect(cueBetween(paused, resume(paused, T0 + sec(20)), cfg, T0 + sec(10), T0 + sec(20))).toBeNull();
    expect(cueBetween(running, reset(), cfg, T0 + sec(10), T0 + sec(10))).toBeNull();
  });
});
