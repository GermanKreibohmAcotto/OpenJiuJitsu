import { useState, type FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { BeltBar } from '../../components/BeltBar';
import { MAX_STRIPES } from '../../domain/belts';
import { BELTS, type Belt, type Graduation } from '../../domain/types';
import { todayIso } from '../../db/ids';
import { deleteGraduation, listGraduations, saveGraduation } from '../../db/profile';
import { daysBetween, humanizeDays } from './stats';

export interface GraduationSuggestion {
  belt: Belt;
  stripes: number;
}

function formatDate(date: string, lang: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(y, m - 1, d));
}

function GraduationForm({ initial }: { initial: GraduationSuggestion }) {
  const { t } = useTranslation('profile');
  const [belt, setBelt] = useState<Belt>(initial.belt);
  const [stripes, setStripes] = useState(initial.stripes);
  const [date, setDate] = useState(todayIso());
  const [notes, setNotes] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!date) return;
    await saveGraduation({ belt, stripes, date, notes: notes.trim() || undefined });
    setNotes('');
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="label" htmlFor="grad-belt">
          {t('graduations.belt')}
        </label>
        <select
          id="grad-belt"
          className="input"
          value={belt}
          onChange={(e) => {
            const next = e.target.value as Belt;
            setBelt(next);
            setStripes((current) => Math.min(current, MAX_STRIPES[next]));
          }}
        >
          {BELTS.map((option) => (
            <option key={option} value={option}>
              {t(`belts.${option}`, { ns: 'common' })}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="grad-stripes">
          {t('graduations.stripes')}
        </label>
        <select id="grad-stripes" className="input" value={stripes} onChange={(e) => setStripes(Number(e.target.value))}>
          {Array.from({ length: MAX_STRIPES[belt] + 1 }, (_, count) => (
            <option key={count} value={count}>
              {count}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="grad-date">
          {t('graduations.date')}
        </label>
        <input id="grad-date" type="date" required className="input" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="grad-notes">
          {t('graduations.notes')}
        </label>
        <input id="grad-notes" className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <button type="submit" className="btn btn-primary">
          {t('graduations.add')}
        </button>
      </div>
    </form>
  );
}

function TimelineItem({ graduation, previous, lang }: { graduation: Graduation; previous?: Graduation; lang: string }) {
  const { t } = useTranslation('profile');
  const [confirming, setConfirming] = useState(false);
  const date = formatDate(graduation.date, lang);
  const span = previous ? humanizeDays(daysBetween(previous.date, graduation.date)) : undefined;

  return (
    <li
      aria-label={t('graduations.item', { belt: t(`belts.${graduation.belt}`, { ns: 'common' }), date })}
      className="relative ml-3 border-l border-line pb-5 pl-5 last:pb-0"
    >
      <span aria-hidden className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-accent" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{date}</p>
        {confirming ? (
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted">{t('actions.confirmDelete', { ns: 'common' })}</span>
            <button type="button" className="btn btn-danger" onClick={() => void deleteGraduation(graduation.id)}>
              {t('actions.delete', { ns: 'common' })}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)}>
              {t('actions.cancel', { ns: 'common' })}
            </button>
          </span>
        ) : (
          <button type="button" className="btn btn-ghost" onClick={() => setConfirming(true)}>
            {t('actions.delete', { ns: 'common' })}
          </button>
        )}
      </div>
      <BeltBar belt={graduation.belt} stripes={graduation.stripes} className="mt-2 max-w-xs" />
      {graduation.notes && <p className="mt-2 text-sm text-zinc-300">{graduation.notes}</p>}
      {span && (
        <p className="mt-1 text-xs text-muted">
          {t('graduations.since', { span: t(`graduations.span.${span.unit}`, { count: span.count }) })}
        </p>
      )}
    </li>
  );
}

interface GraduationTimelineProps {
  /** Prefills the form after a belt/stripes change; a new `key` resets the form. */
  suggestion?: GraduationSuggestion & { key: number };
  fallback: GraduationSuggestion;
}

export function GraduationTimeline({ suggestion, fallback }: GraduationTimelineProps) {
  const { t, i18n } = useTranslation('profile');
  const graduations = useLiveQuery(listGraduations, []);

  return (
    <section className="card space-y-4" aria-labelledby="graduations-title">
      <h2 id="graduations-title" className="text-lg font-semibold">
        {t('graduations.title')}
      </h2>
      {suggestion && (
        <p role="status" className="rounded-xl border border-accent/40 bg-accent/10 p-3 text-sm text-accent">
          {t('editor.changed')}
        </p>
      )}
      <GraduationForm key={suggestion?.key ?? 0} initial={suggestion ?? fallback} />
      {graduations && graduations.length === 0 && <p className="text-sm text-muted">{t('graduations.empty')}</p>}
      {graduations && graduations.length > 0 && (
        <ol className="pt-2">
          {graduations.map((graduation, index) => (
            <TimelineItem key={graduation.id} graduation={graduation} previous={graduations[index - 1]} lang={i18n.language} />
          ))}
        </ol>
      )}
    </section>
  );
}
