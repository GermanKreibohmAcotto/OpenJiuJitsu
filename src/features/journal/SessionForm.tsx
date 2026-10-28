import { useLiveQuery } from 'dexie-react-hooks';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { useSettings } from '../../app/settings';
import { ModeToggle } from '../../components/ModeToggle';
import { EmptyState, PageHeader } from '../../components/Page';
import { newId, todayIso } from '../../db/ids';
import { getPlan, listPlans, planTotalMinutes } from '../../db/plans';
import { getSession, saveSession, SessionValidationError } from '../../db/sessions';
import { FEELING_TAGS, type Mode } from '../../domain/types';
import { SubmissionField } from './SubmissionField';
import { useFeelingLabel } from './parts';

interface Draft {
  date: string;
  /** Kept as text so the field can be empty while typing. */
  durationMin: string;
  mode: Mode;
  planId: string;
  physicalDifficulty: number;
  technicalDifficulty: number;
  feelings: string[];
  sparringRounds: string;
  subsAchieved: string[];
  subsSuffered: string[];
  takedownsAchieved: string[];
  takedownsSuffered: string[];
  notes: string;
}

function DifficultyField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  const id = `difficulty-${newId()}`;
  return (
    <div className="card">
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="range"
          min={1}
          max={10}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-accent"
        />
        <output htmlFor={id} className="w-8 text-right text-lg font-bold">
          {value}
        </output>
      </div>
    </div>
  );
}

function SessionFormBody({ id, initial }: { id?: string; initial: Draft }) {
  const { t } = useTranslation('journal');
  const navigate = useNavigate();
  const feelingLabel = useFeelingLabel();
  const plans = useLiveQuery(() => listPlans(), []);
  const [draft, setDraft] = useState<Draft>(initial);
  const [customFeeling, setCustomFeeling] = useState('');
  const [error, setError] = useState<string | null>(null);

  const patch = (changes: Partial<Draft>) => setDraft((d) => ({ ...d, ...changes }));
  const customTags = draft.feelings.filter((tag) => !(FEELING_TAGS as readonly string[]).includes(tag));

  const toggleFeeling = (tag: string) =>
    patch({ feelings: draft.feelings.includes(tag) ? draft.feelings.filter((f) => f !== tag) : [...draft.feelings, tag] });

  const addCustomFeeling = () => {
    const tag = customFeeling.trim();
    if (tag && !draft.feelings.includes(tag)) patch({ feelings: [...draft.feelings, tag] });
    setCustomFeeling('');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const saved = await saveSession({
        id,
        date: draft.date,
        durationMin: Number(draft.durationMin),
        mode: draft.mode,
        planId: draft.planId || undefined,
        physicalDifficulty: draft.physicalDifficulty,
        technicalDifficulty: draft.technicalDifficulty,
        feelings: draft.feelings,
        sparringRounds: Number(draft.sparringRounds),
        subsAchieved: draft.subsAchieved,
        subsSuffered: draft.subsSuffered,
        takedownsAchieved: draft.takedownsAchieved,
        takedownsSuffered: draft.takedownsSuffered,
        notes: draft.notes,
      });
      navigate(`/journal/${saved.id}`);
    } catch (e) {
      setError(e instanceof SessionValidationError ? t(`form.invalidField.${e.field}`) : t('form.saveError'));
    }
  };

  return (
    <>
      <PageHeader title={id ? t('form.editTitle') : t('form.newTitle')} />
      <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
        <section className="card flex flex-col gap-3" aria-labelledby="session-heading">
          <div>
            <h2 id="session-heading" className="font-semibold">
              {t('form.sessionHeading')}
            </h2>
            <p className="text-xs text-muted">{t('form.sessionHint')}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="session-date" className="label">
                {t('form.date')}
              </label>
              <input id="session-date" type="date" className="input" value={draft.date} onChange={(e) => patch({ date: e.target.value })} />
            </div>
            <div>
              <label htmlFor="session-duration" className="label">
                {t('form.duration')}
              </label>
              <input
                id="session-duration"
                type="number"
                min={0}
                inputMode="numeric"
                className="input"
                value={draft.durationMin}
                onChange={(e) => patch({ durationMin: e.target.value })}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <span className="label">{t('form.mode')}</span>
              <ModeToggle value={draft.mode} onChange={(mode) => patch({ mode })} />
            </div>
            <div className="min-w-48 flex-1">
              <label htmlFor="session-plan" className="label">
                {t('form.plan')}
              </label>
              <select id="session-plan" className="input" value={draft.planId} onChange={(e) => patch({ planId: e.target.value })}>
                <option value="">{t('form.noPlan')}</option>
                {plans?.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <DifficultyField label={t('form.physical')} value={draft.physicalDifficulty} onChange={(v) => patch({ physicalDifficulty: v })} />
          <DifficultyField label={t('form.technical')} value={draft.technicalDifficulty} onChange={(v) => patch({ technicalDifficulty: v })} />
        </div>

        <fieldset className="card flex flex-col gap-3">
          <legend className="label px-1">{t('form.feelings')}</legend>
          <p className="text-xs text-muted">{t('form.feelingsHint')}</p>
          <div className="flex flex-wrap gap-2">
            {[...FEELING_TAGS, ...customTags].map((tag) => {
              const active = draft.feelings.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleFeeling(tag)}
                  className={`chip px-3 py-1 ${active ? 'chip-active' : ''}`}
                >
                  {feelingLabel(tag)}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              className="input"
              aria-label={t('form.customFeeling')}
              placeholder={t('form.customFeeling')}
              value={customFeeling}
              onChange={(e) => setCustomFeeling(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomFeeling();
                }
              }}
            />
            <button type="button" className="btn" aria-label={t('form.addFeeling')} onClick={addCustomFeeling}>
              {t('common:actions.add')}
            </button>
          </div>
        </fieldset>

        <div className="card">
          <label htmlFor="session-rounds" className="label">
            {t('form.rounds')}
          </label>
          <input
            id="session-rounds"
            type="number"
            min={0}
            inputMode="numeric"
            className="input"
            value={draft.sparringRounds}
            onChange={(e) => patch({ sparringRounds: e.target.value })}
          />
        </div>

        <SubmissionField
          legend={t('form.achieved')}
          hint={t('form.achievedHint')}
          mode={draft.mode}
          value={draft.subsAchieved}
          onChange={(subsAchieved) => patch({ subsAchieved })}
        />
        <SubmissionField
          legend={t('form.suffered')}
          hint={t('form.sufferedHint')}
          mode={draft.mode}
          value={draft.subsSuffered}
          onChange={(subsSuffered) => patch({ subsSuffered })}
        />
        <SubmissionField
          legend={t('form.takedownsAchieved')}
          hint={t('form.takedownsAchievedHint')}
          mode={draft.mode}
          types={['takedown']}
          value={draft.takedownsAchieved}
          onChange={(takedownsAchieved) => patch({ takedownsAchieved })}
        />
        <SubmissionField
          legend={t('form.takedownsSuffered')}
          hint={t('form.takedownsSufferedHint')}
          mode={draft.mode}
          types={['takedown']}
          value={draft.takedownsSuffered}
          onChange={(takedownsSuffered) => patch({ takedownsSuffered })}
        />

        <div className="card">
          <label htmlFor="session-notes" className="label">
            {t('form.notes')}
          </label>
          <textarea
            id="session-notes"
            className="input min-h-28"
            placeholder={t('form.notesPlaceholder')}
            value={draft.notes}
            onChange={(e) => patch({ notes: e.target.value })}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-danger/40 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary">
            {t('common:actions.save')}
          </button>
          <Link to={id ? `/journal/${id}` : '/journal'} className="btn">
            {t('common:actions.cancel')}
          </Link>
        </div>
      </form>
    </>
  );
}

/** Loads the data the form starts from (existing session or plan prefill), then mounts the form. */
export function SessionForm() {
  const { t } = useTranslation('journal');
  const { id } = useParams();
  const [params] = useSearchParams();
  const { defaultMode } = useSettings();
  const planId = id ? undefined : (params.get('planId') ?? undefined);

  // undefined while loading, null when missing.
  const session = useLiveQuery(async () => (id ? ((await getSession(id)) ?? null) : null), [id]);
  const plan = useLiveQuery(async () => (planId ? ((await getPlan(planId)) ?? null) : null), [planId]);

  if (session === undefined || plan === undefined) return null;
  if (id && session === null) {
    return (
      <EmptyState action={<Link to="/journal" className="btn">{t('detail.backToList')}</Link>}>{t('form.notFound')}</EmptyState>
    );
  }

  const initial: Draft = session
    ? {
        date: session.date,
        durationMin: String(session.durationMin),
        mode: session.mode,
        planId: session.planId ?? '',
        physicalDifficulty: session.physicalDifficulty,
        technicalDifficulty: session.technicalDifficulty,
        feelings: session.feelings,
        sparringRounds: String(session.sparringRounds),
        subsAchieved: session.subsAchieved,
        subsSuffered: session.subsSuffered,
        takedownsAchieved: session.takedownsAchieved ?? [],
        takedownsSuffered: session.takedownsSuffered ?? [],
        notes: session.notes,
      }
    : {
        date: todayIso(),
        durationMin: plan ? String(planTotalMinutes(plan)) : '60',
        mode: plan?.mode ?? defaultMode,
        planId: plan?.id ?? '',
        physicalDifficulty: 5,
        technicalDifficulty: 5,
        feelings: [],
        sparringRounds: '0',
        subsAchieved: [],
        subsSuffered: [],
        takedownsAchieved: [],
        takedownsSuffered: [],
        notes: '',
      };

  return <SessionFormBody id={id} initial={initial} />;
}
