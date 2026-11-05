import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { STALLING_SECONDS, type AthleteIndex } from './scoring';

interface StallingCounterProps {
  names: [string, string];
  disabled: boolean;
  onPenalty: (athlete: AthleteIndex) => void;
}

/** The referee's 20-second count for lack of combativeness; once it runs out, either athlete can be penalized. */
export function StallingCounter({ names, disabled, onPenalty }: StallingCounterProps) {
  const { t } = useTranslation('sparring');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const left = startedAt === null ? null : Math.max(0, STALLING_SECONDS - Math.floor((now - startedAt) / 1000));

  useEffect(() => {
    if (startedAt === null || left === 0) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [startedAt, left]);

  const cancel = () => setStartedAt(null);

  if (left === null) {
    return (
      <button
        type="button"
        className="btn self-center"
        disabled={disabled}
        onClick={() => {
          setNow(Date.now());
          setStartedAt(Date.now());
        }}
      >
        {t('match.stalling.count')}
      </button>
    );
  }

  return (
    <section className="card flex flex-wrap items-center justify-center gap-3" aria-label={t('match.stalling.title')}>
      <p role="status" className="text-sm font-semibold">
        {left > 0 ? t('match.stalling.counting', { seconds: left }) : t('match.stalling.due', { seconds: STALLING_SECONDS })}
      </p>
      {left === 0 &&
        ([0, 1] as const).map((i) => (
          <button
            key={i}
            type="button"
            className="btn btn-danger"
            onClick={() => {
              onPenalty(i);
              cancel();
            }}
          >
            {t('match.stalling.penalize', { name: names[i] })}
          </button>
        ))}
      <button type="button" className="btn btn-ghost" onClick={cancel}>
        {t('match.stalling.cancel')}
      </button>
    </section>
  );
}
