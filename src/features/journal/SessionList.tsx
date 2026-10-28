import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { EmptyState, PageHeader } from '../../components/Page';
import { ModeBadges } from '../../components/ModeToggle';
import { listPlans } from '../../db/plans';
import { listSessions } from '../../db/sessions';
import { FeelingChips, formatDate } from './parts';

export function SessionList() {
  const { t, i18n } = useTranslation('journal');
  const sessions = useLiveQuery(() => listSessions(), []);
  const plans = useLiveQuery(() => listPlans(), []);
  const planNames = useMemo(() => new Map((plans ?? []).map((p) => [p.id, p.name])), [plans]);

  const newButton = (
    <Link to="/journal/new" className="btn btn-primary">
      {t('newSession')}
    </Link>
  );

  return (
    <>
      <PageHeader title={t('title')} actions={newButton} />
      {sessions?.length === 0 && <EmptyState action={newButton}>{t('empty')}</EmptyState>}
      <ul className="flex flex-col gap-3">
        {sessions?.map((s) => {
          const planName = s.planId ? planNames.get(s.planId) : undefined;
          return (
            <li key={s.id} className="card flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link to={`/journal/${s.id}`} className="font-semibold hover:text-accent">
                  <time dateTime={s.date}>{formatDate(s.date, i18n.language)}</time>
                </Link>
                <span className="flex items-center gap-2 text-xs text-muted">
                  {t('common:minutes', { count: s.durationMin })}
                  <ModeBadges modes={[s.mode]} />
                </span>
              </div>
              {planName && <p className="text-sm text-muted">{t('list.plan', { name: planName })}</p>}
              <p className="flex flex-wrap gap-x-4 text-sm text-muted">
                <span>{t('list.physical', { value: s.physicalDifficulty })}</span>
                <span>{t('list.technical', { value: s.technicalDifficulty })}</span>
                <span>{t('list.rounds', { count: s.sparringRounds })}</span>
                <span>{t('list.achieved', { count: s.subsAchieved.length })}</span>
                <span>{t('list.suffered', { count: s.subsSuffered.length })}</span>
                <span>{t('list.takedownsAchieved', { count: (s.takedownsAchieved ?? []).length })}</span>
                <span>{t('list.takedownsSuffered', { count: (s.takedownsSuffered ?? []).length })}</span>
              </p>
              <FeelingChips feelings={s.feelings} />
            </li>
          );
        })}
      </ul>
    </>
  );
}
