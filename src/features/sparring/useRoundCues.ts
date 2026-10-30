import { useEffect, useRef } from 'react';
import { beep } from './sound';
import { cueBetween, type TimerConfig, type TimerState } from './timer';

/** Plays the start, 30 s warning and end beeps as the timer moves between snapshots. */
export function useRoundCues(timer: TimerState, config: TimerConfig, now: number): void {
  const previous = useRef({ timer, now });
  useEffect(() => {
    const before = previous.current;
    previous.current = { timer, now };
    const cue = cueBetween(before.timer, timer, config, before.now, now);
    if (cue === 'start') beep(400, 1175);
    else if (cue === 'warning') beep(250, 660);
    else if (cue === 'end') beep();
  }, [timer, config, now]);
}
