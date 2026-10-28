import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import { ModeBadges } from '../../components/ModeToggle';
import { EmptyState, PageHeader } from '../../components/Page';
import { deleteMatch, getMatch } from '../../db/matches';
import { useTechniqueMap } from '../../hooks/useTechniques';
import { useLocalize } from '../../i18n';
import { SCORE_VALUES } from './scoring';

function formatDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function MatchDetail() {
  const { t } = useTranslation('sparring');
  const { t: tc } = useTranslation();
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const techniques = useTechniqueMap();
  const localize = useLocalize();
  // undefined while loading, null when the record does not exist.
  const match = useLiveQuery(async () => (await getMatch(id)) ?? null, [id]);

  if (match === undefined) return null;
  if (match === null) {
    return (
      <EmptyState action={<Link to="/sparring" className="btn">{t('detail.backToList')}</Link>}>{t('detail.notFound')}</EmptyState>
    );
  }

  const technique = match.submissionId ? techniques.get(match.submissionId) : undefined;
  const remove = async () => {
    await deleteMatch(match.id);
    navigate('/sparring');
  };

  const actions = confirming ? (
    <>
      <button type="button" className="btn btn-danger" onClick={() => void remove()}>
        {tc('actions.confirmDelete')}
      </button>
      <button type="button" className="btn" onClick={() => setConfirming(false)}>
        {tc('actions.cancel')}
      </button>
    </>
  ) : (
    <>
      <Link to="/sparring" className="btn">
        {t('detail.backToList')}
      </Link>
      <button type="button" className="btn btn-danger" onClick={() => setConfirming(true)}>
        {t('history.delete')}
      </button>
    </>
  );

  return (
    <>
      <PageHeader
        title={`${match.athletes[0].name} ${match.athletes[0].points} – ${match.athletes[1].points} ${match.athletes[1].name}`}
        subtitle={match.winner === null ? t('history.draw') : t('history.winner', { name: match.athletes[match.winner].name })}
        actions={actions}
      />
      <div className="flex flex-col gap-3">
        <section className="card flex flex-col gap-2">
          <h2 className="label mb-0">{t('detail.info')}</h2>
          <p className="flex flex-wrap items-center gap-3 text-sm">
            <time dateTime={match.date}>{match.date}</time>
            <ModeBadges modes={[match.mode]} />
            <span>{t('detail.duration', { value: formatDuration(match.durationSec) })}</span>
          </p>
          <p className="text-sm">
            <span className="text-muted">{t('detail.method')}: </span>
            {t(`methods.${match.method}`)}
          </p>
          {match.submissionId && (
            <p className="text-sm">
              <span className="text-muted">{t('detail.submission')}: </span>
              {technique ? (
                <Link to={`/library/${technique.id}`} className="text-accent hover:underline">
                  {localize(technique.name)}
                </Link>
              ) : (
                tc('unknownTechnique')
              )}
            </p>
          )}
        </section>
        <section className="card overflow-x-auto">
          <h2 className="label">{t('detail.scoreboard')}</h2>
          <table className="w-full text-xs sm:text-sm">
            <thead className="text-left text-muted">
              <tr>
                <th className="py-1 font-medium">{t('detail.athlete')}</th>
                <th className="py-1 text-right font-medium">{t('detail.points')}</th>
                <th className="py-1 text-right font-medium">{t('match.advantages')}</th>
                <th className="py-1 text-right font-medium">{t('match.penalties')}</th>
              </tr>
            </thead>
            <tbody>
              {match.athletes.map((athlete, index) => (
                <tr key={index} className={match.winner === index ? 'font-semibold text-accent' : ''}>
                  <td className="py-1">{athlete.name}</td>
                  <td className="py-1 text-right">{athlete.points}</td>
                  <td className="py-1 text-right">{athlete.advantages}</td>
                  <td className="py-1 text-right">{athlete.penalties}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="card">
          <h2 className="label">{t('detail.log')}</h2>
          {!match.events ? (
            <p className="text-sm text-muted">{t('detail.logUnavailable')}</p>
          ) : match.events.length === 0 ? (
            <p className="text-sm text-muted">{t('detail.logNone')}</p>
          ) : (
            <ol className="flex flex-col gap-1.5 text-sm">
              {match.events.map((event, index) => {
                const { kind } = event;
                const points = kind === 'advantage' || kind === 'penalty' ? null : SCORE_VALUES[kind];
                const label = points === null ? t(`match.${kind}`) : t(`match.actions.${kind}`);
                const technique = event.techniqueId ? techniques.get(event.techniqueId) : undefined;
                return (
                  <li key={index} className="flex items-center justify-between gap-3">
                    <span>
                      <span className="mr-2 text-muted tabular-nums">{index + 1}.</span>
                      <span className={match.winner === event.athlete ? 'font-semibold text-accent' : 'font-semibold'}>
                        {match.athletes[event.athlete].name}
                      </span>{' '}
                      · {label}
                      {technique && (
                        <>
                          {' '}
                          <Link to={`/library/${technique.id}`} className="text-accent hover:underline">
                            ({localize(technique.name)})
                          </Link>
                        </>
                      )}
                    </span>
                    {points !== null && <span className="chip px-2 py-0 tabular-nums">+{points}</span>}
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}
