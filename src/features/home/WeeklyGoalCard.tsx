import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { todayIso } from '../../db/ids';
import { saveWeeklyGoal } from '../../db/profile';
import type { TrainingSession } from '../../domain/types';
import { weeklyProgress } from './streak';

interface WeeklyGoalCardProps {
  goal?: number;
  sessions: TrainingSession[];
}

export function WeeklyGoalCard({ goal, sessions }: WeeklyGoalCardProps) {
  const { t } = useTranslation('home');
  const [value, setValue] = useState(goal === undefined ? '' : String(goal));
  const [error, setError] = useState(false);
  const progress = goal === undefined ? undefined : weeklyProgress(sessions.map((s) => s.date), goal, todayIso());

  async function submit(event: FormEvent) {
    event.preventDefault();
    const next = value.trim() === '' ? undefined : Number(value);
    try {
      await saveWeeklyGoal(next);
      setError(false);
    } catch {
      setError(true);
    }
  }

  return (
    <section className="card space-y-3 md:col-span-2" aria-labelledby="home-goal">
      <h2 id="home-goal" className="label">
        {t('goal.title')}
      </h2>
      {progress && goal !== undefined ? (
        <div className="space-y-1">
          <p className="text-3xl font-bold">{t('goal.progress', { count: progress.thisWeek, goal })}</p>
          <p className="text-sm text-muted">{t('goal.current', { count: progress.current })}</p>
          <p className="text-sm text-muted">{t('goal.best', { count: progress.best })}</p>
        </div>
      ) : (
        <p className="text-sm text-muted">{t('goal.invite')}</p>
      )}
      <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor="weekly-goal">
            {t('goal.label')}
          </label>
          <input
            id="weekly-goal"
            type="number"
            inputMode="numeric"
            className="input w-28"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary">
          {t('goal.save')}
        </button>
      </form>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {t('goal.invalid')}
        </p>
      )}
    </section>
  );
}
