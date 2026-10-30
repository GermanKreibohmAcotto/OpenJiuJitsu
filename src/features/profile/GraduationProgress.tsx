import { useLiveQuery } from 'dexie-react-hooks';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { todayIso } from '../../db/ids';
import { listGraduations, saveGraduationGoal } from '../../db/profile';
import { listSessions } from '../../db/sessions';
import type { GraduationGoal, Profile } from '../../domain/types';
import { graduationProgress } from './progress';

const FIELDS = ['classes', 'hours', 'months'] as const;

interface GraduationProgressProps {
  profile: Profile;
}

function toGoal(values: Record<(typeof FIELDS)[number], string>): GraduationGoal {
  const goal: GraduationGoal = {};
  for (const key of FIELDS) {
    const text = values[key].trim();
    if (text !== '' && Number(text) > 0) goal[key] = Number(text);
  }
  return goal;
}

export function GraduationProgress({ profile }: GraduationProgressProps) {
  const { t } = useTranslation('profile');
  const sessions = useLiveQuery(listSessions, []);
  const graduations = useLiveQuery(listGraduations, []);
  const own = profile.graduationGoal ?? {};
  const [values, setValues] = useState({
    classes: own.classes?.toString() ?? '',
    hours: own.hours?.toString() ?? '',
    months: own.months?.toString() ?? '',
  });
  if (!sessions || !graduations) return null;
  const progress = graduationProgress({ sessions, graduations, profile, today: todayIso() });

  async function submit(event: FormEvent) {
    event.preventDefault();
    await saveGraduationGoal(toGoal(values));
  }

  return (
    <section className="card space-y-4" aria-labelledby="graduation-progress">
      <h2 id="graduation-progress" className="text-lg font-semibold">
        {t('progress.title')}
      </h2>
      <div className="space-y-1 text-sm">
        {progress.since && <p className="text-muted">{t('progress.since', { date: progress.since })}</p>}
        <p>{t('progress.classes', { value: progress.classes })}</p>
        <p>{t('progress.hours', { value: progress.hours })}</p>
        <p>{t('progress.months', { value: progress.months })}</p>
      </div>

      <ul className="space-y-3">
        {progress.bars.map((bar) => {
          const label = t(`progress.bar.${bar.key}`);
          return (
            <li key={bar.key} className="space-y-1">
              <div className="flex justify-between gap-2 text-sm">
                <span>{label}</span>
                <span className="text-muted">
                  {t('progress.of', { current: bar.current, target: bar.target })} · {t(`progress.source.${bar.source}`)}
                </span>
              </div>
              <div
                role="progressbar"
                aria-label={label}
                aria-valuemin={0}
                aria-valuemax={bar.target}
                aria-valuenow={bar.current}
                className="h-2 overflow-hidden rounded-full bg-line"
              >
                <div className="h-full bg-accent" style={{ width: `${Math.round(bar.ratio * 100)}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      {progress.noMinimum && <p className="text-sm text-muted">{t('progress.noMinimum')}</p>}

      <form onSubmit={submit} className="space-y-3">
        <p className="text-sm text-muted">{t('progress.goalHint')}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {FIELDS.map((key) => (
            <div key={key}>
              <label className="label" htmlFor={`goal-${key}`}>
                {t(`progress.goal.${key}`)}
              </label>
              <input
                id={`goal-${key}`}
                type="number"
                min={0}
                step="any"
                className="input"
                value={values[key]}
                onChange={(e) => setValues({ ...values, [key]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <button type="submit" className="btn btn-primary">
          {t('progress.save')}
        </button>
      </form>
    </section>
  );
}
