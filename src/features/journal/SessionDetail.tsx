import { useLiveQuery } from 'dexie-react-hooks';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import { EmptyState, PageHeader } from '../../components/Page';
import { ModeBadges } from '../../components/ModeToggle';
import { getPlan } from '../../db/plans';
import { deleteSession, getSession } from '../../db/sessions';
import { useTechniqueMap } from '../../hooks/useTechniques';
import { useLocalize } from '../../i18n';
import { FeelingChips, countIds, formatDate } from './parts';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card flex flex-col gap-2">
      <h2 className="label mb-0">{title}</h2>
      {children}
    </section>
  );
}

function SubmissionList({ ids }: { ids: string[] }) {
  const { t } = useTranslation('journal');
  const techniques = useTechniqueMap();
  const localize = useLocalize();
  if (ids.length === 0) return <p className="text-sm text-muted">{t('detail.nothing')}</p>;
  return (
    <ul className="flex flex-col gap-1 text-sm">
      {countIds(ids).map(([id, count]) => {
        const technique = techniques.get(id);
        return (
          <li key={id} className="flex items-center gap-2">
            {technique ? (
              <Link to={`/library/${id}`} className="text-accent hover:underline">
                {localize(technique.name)}
              </Link>
            ) : (
              <span className="text-muted">{t('common:unknownTechnique')}</span>
            )}
            {count > 1 && <span className="chip">×{count}</span>}
          </li>
        );
      })}
    </ul>
  );
}

export function SessionDetail() {
  const { t, i18n } = useTranslation('journal');
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  // undefined while loading, null when the record does not exist.
  const session = useLiveQuery(async () => (await getSession(id)) ?? null, [id]);
  const plan = useLiveQuery(async () => (session?.planId ? ((await getPlan(session.planId)) ?? null) : null), [session?.planId]);

  if (session === undefined) return null;
  if (session === null) {
    return (
      <EmptyState action={<Link to="/journal" className="btn">{t('detail.backToList')}</Link>}>{t('detail.notFound')}</EmptyState>
    );
  }

  const remove = async () => {
    await deleteSession(session.id);
    navigate('/journal');
  };

  const actions = confirming ? (
    <>
      <button type="button" className="btn btn-danger" onClick={() => void remove()}>
        {t('common:actions.confirmDelete')}
      </button>
      <button type="button" className="btn" onClick={() => setConfirming(false)}>
        {t('common:actions.cancel')}
      </button>
    </>
  ) : (
    <>
      <Link to={`/journal/${session.id}/edit`} className="btn">
        {t('common:actions.edit')}
      </Link>
      <button type="button" className="btn btn-danger" onClick={() => setConfirming(true)}>
        {t('common:actions.delete')}
      </button>
    </>
  );

  return (
    <>
      <PageHeader title={formatDate(session.date, i18n.language)} actions={actions} />
      <div className="flex flex-col gap-3">
        <Section title={t('form.sessionHeading')}>
          <p className="flex flex-wrap items-center gap-3 text-sm">
            <time dateTime={session.date}>{session.date}</time>
            <span>{t('common:minutes', { count: session.durationMin })}</span>
            <ModeBadges modes={[session.mode]} />
          </p>
          <p className="text-sm">
            <span className="text-muted">{t('detail.plan')}: </span>
            {session.planId && plan ? (
              <Link to={`/plans/${plan.id}`} className="text-accent hover:underline">
                {plan.name}
              </Link>
            ) : (
              t('detail.none')
            )}
          </p>
        </Section>
        <Section title={t('detail.physical')}>
          <p className="text-sm">{session.physicalDifficulty}/10</p>
        </Section>
        <Section title={t('detail.technical')}>
          <p className="text-sm">{session.technicalDifficulty}/10</p>
        </Section>
        <Section title={t('detail.feelings')}>
          {session.feelings.length ? <FeelingChips feelings={session.feelings} /> : <p className="text-sm text-muted">{t('detail.nothing')}</p>}
        </Section>
        <Section title={t('detail.rounds')}>
          <p className="text-sm">{session.sparringRounds}</p>
        </Section>
        <Section title={t('detail.achieved')}>
          <SubmissionList ids={session.subsAchieved} />
        </Section>
        <Section title={t('detail.suffered')}>
          <SubmissionList ids={session.subsSuffered} />
        </Section>
        <section className="card border-accent bg-accent/10">
          <h2 className="label text-accent">{t('detail.notes')}</h2>
          {session.notes ? <p className="text-sm whitespace-pre-wrap">{session.notes}</p> : <p className="text-sm text-muted">{t('detail.noNotes')}</p>}
        </section>
      </div>
    </>
  );
}
