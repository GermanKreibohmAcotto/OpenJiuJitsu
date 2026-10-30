import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { formatClock } from './MatchScreen';
import { keepAwake } from './sound';
import { createTimer, pause, remainingMs, reset, resume, start, sync, type TimerConfig, type TimerState } from './timer';
import { useRoundCues } from './useRoundCues';

function clampInt(value: string, min: number, fallback: number): number {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n >= min ? n : fallback;
}

/** Standalone round timer: nothing is scored or saved. */
export function TimerPage() {
  const { t } = useTranslation('sparring');
  const [minutes, setMinutes] = useState('5');
  const [rest, setRest] = useState('30');
  const [rounds, setRounds] = useState('6');
  const [timer, setTimer] = useState<TimerState>(createTimer);
  const [now, setNow] = useState(() => Date.now());

  const roundSec = clampInt(minutes, 1, 5) * 60;
  const restSec = clampInt(rest, 0, 0);
  const totalRounds = clampInt(rounds, 1, 1);
  const config = useMemo<TimerConfig>(
    () => ({ roundSec, restSec, rounds: totalRounds }),
    [roundSec, restSec, totalRounds],
  );

  useEffect(() => {
    if (!timer.running) return;
    const tick = () => {
      const current = Date.now();
      setNow(current);
      setTimer((state) => sync(state, config, current));
    };
    const id = window.setInterval(tick, 250);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [timer.running, config]);

  useEffect(() => {
    if (!timer.running) return;
    return keepAwake();
  }, [timer.running]);

  useRoundCues(timer, config, now);

  const act = (fn: (state: TimerState, at: number) => TimerState) => {
    const at = Date.now();
    setNow(at);
    setTimer((state) => fn(state, at));
  };

  const resting = timer.phase === 'rest';
  const status =
    timer.phase === 'idle'
      ? t('match.ready')
      : timer.phase === 'finished'
        ? t('match.finished')
        : resting
          ? t('match.rest', { next: timer.round + 1 })
          : t('match.round', { current: timer.round, total: config.rounds });

  return (
    <div className="flex flex-col gap-4">
      <Link to="/sparring" className="btn btn-ghost self-start">
        {t('timer.back')}
      </Link>
      <section className="card flex flex-col items-center gap-3 text-center" aria-label={status}>
        <p className={`text-sm font-semibold tracking-wide uppercase ${resting ? 'text-accent' : 'text-muted'}`}>{status}</p>
        <p role="timer" className="text-7xl font-bold tabular-nums sm:text-8xl">
          {formatClock(remainingMs(timer, config, now))}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {timer.phase === 'idle' && (
            <button type="button" className="btn btn-primary px-6 py-3 text-base" onClick={() => act(start)}>
              {t('match.start')}
            </button>
          )}
          {(timer.phase === 'round' || resting) && (
            <button
              type="button"
              className="btn btn-primary px-6 py-3 text-base"
              onClick={() => act(timer.running ? pause : resume)}
            >
              {timer.running ? t('match.pause') : t('match.resume')}
            </button>
          )}
          {timer.phase !== 'idle' && (
            <button type="button" className="btn" onClick={() => setTimer(reset())}>
              {t('timer.reset')}
            </button>
          )}
        </div>
      </section>
      {timer.phase === 'idle' && (
        <section className="card grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="timer-minutes">
              {t('setup.customMinutes')}
            </label>
            <input id="timer-minutes" className="input" type="number" min={1} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="timer-rest">
              {t('setup.rest')}
            </label>
            <input id="timer-rest" className="input" type="number" min={0} value={rest} onChange={(e) => setRest(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="timer-rounds">
              {t('setup.rounds')}
            </label>
            <input id="timer-rounds" className="input" type="number" min={1} value={rounds} onChange={(e) => setRounds(e.target.value)} />
          </div>
        </section>
      )}
    </div>
  );
}
