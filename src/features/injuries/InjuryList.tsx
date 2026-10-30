import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { EmptyState, PageHeader } from '../../components/Page';
import { deleteInjury, listInjuries, setInjuryStatus } from '../../db/injuries';

export function InjuryList() {
  const { t } = useTranslation('injuries');
  const injuries = useLiveQuery(() => listInjuries(), []);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const newButton = (
    <Link to="/injuries/new" className="btn btn-primary">
      {t('newInjury')}
    </Link>
  );

  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} actions={newButton} />
      {injuries?.length === 0 && <EmptyState action={newButton}>{t('empty')}</EmptyState>}
      <ul className="flex flex-col gap-3">
        {injuries?.map((injury) => {
          const recovered = injury.status === 'recovered';
          return (
            <li key={injury.id} className={`card flex flex-col gap-2 ${recovered ? 'opacity-70' : ''}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{t(`zones.${injury.zone}`)}</span>
                <span className="flex items-center gap-2 text-xs text-muted">
                  <time dateTime={injury.date}>{injury.date}</time>
                  <span className={`chip ${recovered ? '' : 'chip-active'}`}>{t(`status.${injury.status}`)}</span>
                </span>
              </div>
              <p className="text-sm text-muted">{t('intensityValue', { value: injury.intensity })}</p>
              {injury.notes && <p className="text-sm whitespace-pre-wrap">{injury.notes}</p>}
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn" onClick={() => void setInjuryStatus(injury.id, recovered ? 'active' : 'recovered')}>
                  {recovered ? t('markActive') : t('markRecovered')}
                </button>
                {confirmingId === injury.id ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => void deleteInjury(injury.id).then(() => setConfirmingId(null))}
                    >
                      {t('common:actions.confirmDelete')}
                    </button>
                    <button type="button" className="btn" onClick={() => setConfirmingId(null)}>
                      {t('common:actions.cancel')}
                    </button>
                  </>
                ) : (
                  <>
                    <Link to={`/injuries/${injury.id}/edit`} className="btn">
                      {t('common:actions.edit')}
                    </Link>
                    <button type="button" className="btn btn-danger" onClick={() => setConfirmingId(injury.id)}>
                      {t('common:actions.delete')}
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
