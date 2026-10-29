import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { EmptyState } from '../../components/Page';
import { deleteMatch, listMatches } from '../../db/matches';
import { useTechniqueMap } from '../../hooks/useTechniques';
import { useLocalize } from '../../i18n';

export function MatchHistory() {
  const { t } = useTranslation('sparring');
  const { t: tc } = useTranslation();
  const matches = useLiveQuery(listMatches, []);
  const techniques = useTechniqueMap();
  const localize = useLocalize();

  const remove = (id: string) => {
    if (window.confirm(tc('actions.confirmDelete'))) void deleteMatch(id);
  };

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-semibold">{t('history.title')}</h2>
      {matches && matches.length === 0 && <EmptyState>{t('history.empty')}</EmptyState>}
      <ul className="flex flex-col gap-2">
        {(matches ?? []).map((match) => {
          const technique = match.submissionId ? techniques.get(match.submissionId) : undefined;
          return (
            <li key={match.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1 basis-56">
                <Link to={`/sparring/${match.id}`} className="font-semibold hover:text-accent">
                  {match.athletes[0].name} {match.athletes[0].points} – {match.athletes[1].points} {match.athletes[1].name}
                </Link>
                <p className="text-xs text-muted">
                  {match.date} · {tc(`modes.${match.mode}`)} · {t(`methods.${match.method}`)} ·{' '}
                  {match.winner === null ? t('history.draw') : t('history.winner', { name: match.athletes[match.winner].name })}
                </p>
                {match.submissionId && (
                  <p className="text-xs text-muted">
                    {t('history.submission', { name: technique ? localize(technique.name) : tc('unknownTechnique') })}
                  </p>
                )}
              </div>
              <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                <Link to={`/sparring/${match.id}`} className="btn flex-1 sm:flex-none">
                  {t('history.details')}
                </Link>
                <button type="button" className="btn btn-danger flex-1 sm:flex-none" onClick={() => remove(match.id)}>
                  {t('history.delete')}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
