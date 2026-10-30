import { useLiveQuery } from 'dexie-react-hooks';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import { EmptyState, PageHeader } from '../../components/Page';
import { todayIso } from '../../db/ids';
import { getInjury, InjuryValidationError, saveInjury } from '../../db/injuries';
import { BODY_ZONES, INJURY_STATUSES, type BodyZone, type InjuryStatus } from '../../domain/types';

interface Draft {
  zone: BodyZone;
  intensity: number;
  date: string;
  notes: string;
  status: InjuryStatus;
}

function InjuryFormBody({ id, initial }: { id?: string; initial: Draft }) {
  const { t } = useTranslation('injuries');
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Draft>(initial);
  const [error, setError] = useState<string | null>(null);
  const patch = (changes: Partial<Draft>) => setDraft((d) => ({ ...d, ...changes }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await saveInjury({ id, ...draft });
      navigate('/injuries');
    } catch (e) {
      setError(e instanceof InjuryValidationError ? t(`form.invalidField.${e.field}`) : t('form.saveError'));
    }
  };

  return (
    <>
      <PageHeader title={id ? t('form.editTitle') : t('form.newTitle')} />
      <form onSubmit={(e) => void submit(e)} className="card flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="injury-zone" className="label">
              {t('form.zone')}
            </label>
            <select id="injury-zone" className="input" value={draft.zone} onChange={(e) => patch({ zone: e.target.value as BodyZone })}>
              {BODY_ZONES.map((zone) => (
                <option key={zone} value={zone}>
                  {t(`zones.${zone}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="injury-date" className="label">
              {t('form.date')}
            </label>
            <input id="injury-date" type="date" className="input" value={draft.date} onChange={(e) => patch({ date: e.target.value })} />
          </div>
        </div>
        <div>
          <label htmlFor="injury-intensity" className="label">
            {t('form.intensity')}
          </label>
          <div className="flex items-center gap-3">
            <input
              id="injury-intensity"
              type="range"
              min={1}
              max={10}
              step={1}
              value={draft.intensity}
              onChange={(e) => patch({ intensity: Number(e.target.value) })}
              className="w-full accent-accent"
            />
            <output htmlFor="injury-intensity" className="w-8 text-right text-lg font-bold">
              {draft.intensity}
            </output>
          </div>
        </div>
        <div>
          <label htmlFor="injury-status" className="label">
            {t('form.status')}
          </label>
          <select id="injury-status" className="input" value={draft.status} onChange={(e) => patch({ status: e.target.value as InjuryStatus })}>
            {INJURY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`status.${status}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="injury-notes" className="label">
            {t('form.notes')}
          </label>
          <textarea
            id="injury-notes"
            className="input min-h-24"
            placeholder={t('form.notesPlaceholder')}
            value={draft.notes}
            onChange={(e) => patch({ notes: e.target.value })}
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary">
            {t('common:actions.save')}
          </button>
          <Link to="/injuries" className="btn">
            {t('common:actions.cancel')}
          </Link>
        </div>
      </form>
    </>
  );
}

export function InjuryForm() {
  const { t } = useTranslation('injuries');
  const { id } = useParams();
  // undefined while loading, null when the record does not exist.
  const existing = useLiveQuery(async () => (id ? ((await getInjury(id)) ?? null) : undefined), [id]);

  if (id && existing === undefined) return null;
  if (id && existing === null) {
    return (
      <EmptyState action={<Link to="/injuries" className="btn">{t('form.backToList')}</Link>}>{t('form.notFound')}</EmptyState>
    );
  }
  const initial: Draft = existing
    ? { zone: existing.zone, intensity: existing.intensity, date: existing.date, notes: existing.notes, status: existing.status }
    : { zone: 'knee', intensity: 5, date: todayIso(), notes: '', status: 'active' };
  return <InjuryFormBody id={id} initial={initial} />;
}
