import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { EmptyState, PageHeader } from '../../components/Page';
import { deletePlan, listPlans, planTotalMinutes, savePlan } from '../../db/plans';
import { newId } from '../../db/ids';
import type { TrainingPlan } from '../../domain/types';

export function PlanListPage() {
  const { t } = useTranslation('plans');
  const plans = useLiveQuery(listPlans, []);

  const duplicate = (plan: TrainingPlan) =>
    savePlan({
      name: t('copyName', { name: plan.name }),
      mode: plan.mode,
      date: plan.date,
      objectives: [...plan.objectives],
      blocks: plan.blocks.map((b) => ({ ...b, id: newId(), techniqueIds: [...b.techniqueIds] })),
    });

  const remove = (plan: TrainingPlan) => {
    if (window.confirm(t('actions.confirmDelete', { name: plan.name }))) void deletePlan(plan.id);
  };

  return (
    <>
      <PageHeader
        title={t('title')}
        actions={
          <Link to="/plans/new" className="btn btn-primary">
            {t('actions.new')}
          </Link>
        }
      />
      {plans && plans.length === 0 && <EmptyState>{t('empty')}</EmptyState>}
      <ul className="flex flex-col gap-3">
        {(plans ?? []).map((plan) => (
          <li key={plan.id} className="card flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <Link to={`/plans/${plan.id}`} className="font-semibold hover:text-accent">
                {plan.name || t('untitled')}
              </Link>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                <span className="chip px-2 py-0 text-[10px] font-semibold uppercase">{t(`common:modes.${plan.mode}`)}</span>
                {plan.date && <span>{plan.date}</span>}
                <span>{t('common:minutes', { count: planTotalMinutes(plan) })}</span>
                <span>{t('objectivesCount', { count: plan.objectives.length })}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to={`/plans/${plan.id}`} className="btn" aria-label={`${t('actions.open')} ${plan.name}`}>
                {t('actions.open')}
              </Link>
              <button type="button" className="btn" aria-label={`${t('actions.duplicate')} ${plan.name}`} onClick={() => void duplicate(plan)}>
                {t('actions.duplicate')}
              </button>
              <button type="button" className="btn btn-danger" aria-label={`${t('actions.delete')} ${plan.name}`} onClick={() => remove(plan)}>
                {t('actions.delete')}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
