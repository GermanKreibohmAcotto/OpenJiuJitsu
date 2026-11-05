import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { MatchConfig } from './SetupForm';
import { penaltyRulesFor } from './divisions';
import { StallingCounter } from './StallingCounter';
import { addEvent, computeTotals, disqualified, POINT_KINDS, SCORE_VALUES, undoLast, type AthleteIndex, type ScoreEvent } from './scoring';
import { keepAwake } from './sound';
import { useRoundCues } from './useRoundCues';
import { createTimer, fightedMs, pause, remainingMs, reset, resume, start, sync, type TimerState } from './timer';

interface MatchScreenProps {
  config: MatchConfig;
  onFinish: (events: ScoreEvent[], durationSec: number) => void;
}

export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  return `${String(m).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function MatchScreen({ config, onFinish }: MatchScreenProps) {
  const { t } = useTranslation('sparring');
  const [timer, setTimer] = useState<TimerState>(createTimer);
  const [now, setNow] = useState(() => Date.now());
  const [events, setEvents] = useState<ScoreEvent[]>([]);

  // Derive time from timestamps on every tick and when the tab becomes visible again.
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

  const rules = penaltyRulesFor(config.division);
  const totals = computeTotals(events, rules);
  const out = disqualified(events, rules);
  const remaining = remainingMs(timer, config, now);
  const score = (athlete: AthleteIndex, kind: ScoreEvent['kind']) => setEvents((list) => addEvent(list, athlete, kind));
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
  const actionLabel = (kind: ScoreEvent['kind']) =>
    kind === 'advantage' || kind === 'penalty' ? t(`match.${kind}`) : t(`match.actions.${kind}`);

  return (
    <div className="flex flex-col gap-4">
      <section className="card flex flex-col items-center gap-3 text-center" aria-label={status}>
        <p className={`text-sm font-semibold tracking-wide uppercase ${resting ? 'text-accent' : 'text-muted'}`}>{status}</p>
        <p role="timer" className="text-7xl font-bold tabular-nums sm:text-8xl">
          {formatClock(remaining)}
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
              {t('match.reset')}
            </button>
          )}
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => onFinish(events, Math.round(fightedMs(timer, config, Date.now()) / 1000))}
          >
            {t('match.end')}
          </button>
        </div>
      </section>

      {out !== null && (
        <p role="alert" className="card border-danger/40 text-center font-semibold text-danger">
          {t('match.disqualified', { name: config.names[out] })}
        </p>
      )}
      <StallingCounter names={config.names} disabled={out !== null} onPenalty={(athlete) => score(athlete, 'penalty')} />

      <div className="grid grid-cols-2 gap-3">
        {([0, 1] as const).map((i) => (
          <section key={i} className="card flex flex-col gap-3" aria-label={config.names[i]}>
            <h2 className="truncate text-center text-lg font-semibold">{config.names[i]}</h2>
            <p
              className="text-center text-6xl font-bold tabular-nums"
              data-testid={`points-${i}`}
              aria-label={t('match.points', { name: config.names[i] })}
            >
              {totals[i].points}
            </p>
            <p className="flex justify-center gap-3 text-xs text-muted">
              <span>
                {t('match.advantages')}: <b data-testid={`advantages-${i}`}>{totals[i].advantages}</b>
              </span>
              <span>
                {t('match.penalties')}: <b data-testid={`penalties-${i}`}>{totals[i].penalties}</b>
              </span>
            </p>
            <div className="grid gap-2">
              {POINT_KINDS.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  className="btn min-h-12 justify-between"
                  aria-label={t('match.scoreLabel', { name: config.names[i], action: actionLabel(kind), points: SCORE_VALUES[kind] })}
                  disabled={out !== null}
                  onClick={() => score(i, kind)}
                >
                  <span aria-hidden>{actionLabel(kind)}</span>
                  <span aria-hidden className="text-accent">
                    +{SCORE_VALUES[kind]}
                  </span>
                </button>
              ))}
              {(['advantage', 'penalty'] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  className={`btn min-h-12 ${kind === 'penalty' ? 'btn-danger' : ''}`}
                  aria-label={t('match.plainLabel', { name: config.names[i], action: actionLabel(kind) })}
                  disabled={out !== null}
                  onClick={() => score(i, kind)}
                >
                  <span aria-hidden>{actionLabel(kind)}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="card">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="label mb-0">{t('match.log')}</h2>
          <button type="button" className="btn btn-ghost" disabled={events.length === 0} onClick={() => setEvents(undoLast)}>
            {t('match.undo')}
          </button>
        </div>
        {events.length === 0 ? (
          <p className="text-sm text-muted">{t('match.logEmpty')}</p>
        ) : (
          <ol className="flex flex-col-reverse gap-1 text-sm">
            {events.map((event) => (
              <li key={event.id}>
                {config.names[event.athlete]} · {actionLabel(event.kind)}
                {event.kind !== 'advantage' && event.kind !== 'penalty' && ` (+${SCORE_VALUES[event.kind]})`}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
