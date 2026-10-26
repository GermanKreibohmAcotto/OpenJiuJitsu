import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { EmptyState, PageHeader } from '../../components/Page';
import { getPlan, planTotalMinutes } from '../../db/plans';
import { useTechniqueMap } from '../../hooks/useTechniques';
import { useLocalize } from '../../i18n';

export function PlanDetailPage() {
  const { id = '' } = useParams();
  const { t } = useTranslation('plans');
  const localize = useLocalize();
  const techniques = useTechniqueMap();
  // `null` marks a plan that does not exist; `undefined` is still loading.
  const plan = useLiveQuery(async () => (await getPlan(id)) ?? null, [id]);

  if (plan === undefined) return null;
  if (plan === null) return <EmptyState>{t('builder.notFound')}</EmptyState>;

  return (
    <>
      <PageHeader
        title={plan.name || t('untitled')}
        subtitle={[t(`common:modes.${plan.mode}`), plan.date, t('common:minutes', { count: planTotalMinutes(plan) })]
          .filter(Boolean)
          .join(' · ')}
        actions={
          <>
            <Link to={`/plans/${plan.id}/edit`} className="btn">
              {t('actions.edit')}
            </Link>
            <Link to={`/journal/new?planId=${plan.id}`} className="btn btn-primary">
              {t('actions.logSession')}
            </Link>
          </>
        }
      />
      <div className="flex flex-col gap-5">
        <section className="card">
          <h2 className="mb-2 font-semibold">{t('detail.objectives')}</h2>
          {plan.objectives.length === 0 ? (
            <p className="text-sm text-muted">{t('detail.noObjectives')}</p>
          ) : (
            <ul className="list-disc pl-5 text-sm">
              {plan.objectives.map((objective, index) => (
                <li key={index}>{objective}</li>
              ))}
            </ul>
          )}
        </section>
        <section className="flex flex-col gap-3">
          <h2 className="font-semibold">{t('detail.blocks')}</h2>
          {plan.blocks.length === 0 && <p className="text-sm text-muted">{t('detail.noBlocks')}</p>}
          <ol className="flex flex-col gap-3">
            {plan.blocks.map((block) => (
              <li key={block.id} className="card">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-semibold">{block.title}</h3>
                  <span className="text-sm text-muted">
                    {t(`common:blockKinds.${block.kind}`)} · {t('common:minutes', { count: block.minutes })}
                  </span>
                </div>
                {block.techniqueIds.length === 0 ? (
                  <p className="mt-2 text-sm text-muted">{t('detail.noTechniques')}</p>
                ) : (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {block.techniqueIds.map((techniqueId) => {
                      const technique = techniques.get(techniqueId);
                      return (
                        <li key={techniqueId} className="chip">
                          {technique ? (
                            <Link to={`/library/${techniqueId}`}>{localize(technique.name)}</Link>
                          ) : (
                            <span>{t('common:unknownTechnique')}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
