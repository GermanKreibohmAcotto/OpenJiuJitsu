import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TechniquePicker } from '../../components/TechniquePicker';
import { saveMatch } from '../../db/matches';
import { todayIso } from '../../db/ids';
import { recordSubmission } from '../../db/sessions';
import type { MatchMethod } from '../../domain/types';
import type { MatchConfig } from './SetupForm';
import { computeTotals, decideWinner, type AthleteIndex, type ScoreEvent } from './scoring';

type Outcome = 'time' | 'submission' | 'referee';
const OUTCOMES: Outcome[] = ['time', 'submission', 'referee'];
const OUTCOME_KEYS = { time: 'byTime', submission: 'bySubmission', referee: 'byReferee' } as const;

interface ResultFormProps {
  config: MatchConfig;
  events: ScoreEvent[];
  durationSec: number;
  onDone: () => void;
}

function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          className={`chip px-3 py-1.5 text-sm ${value === option.value ? 'chip-active' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function ResultForm({ config, events, durationSec, onDone }: ResultFormProps) {
  const { t } = useTranslation('sparring');
  const [outcome, setOutcome] = useState<Outcome>('time');
  const [submitter, setSubmitter] = useState<AthleteIndex>(0);
  const [techniqueIds, setTechniqueIds] = useState<string[]>([]);
  const [refereeWinner, setRefereeWinner] = useState<AthleteIndex | -1>(-1);
  const [toJournal, setToJournal] = useState(true);
  const [saving, setSaving] = useState(false);

  const totals = computeTotals(events);
  const decision = decideWinner(totals);
  const techniqueId = techniqueIds[0];

  const resolved: { winner: AthleteIndex | null; method: MatchMethod } =
    outcome === 'submission'
      ? { winner: submitter, method: 'submission' }
      : outcome === 'referee'
        ? { winner: refereeWinner === -1 ? null : refereeWinner, method: 'referee' }
        : decision;

  const summary =
    resolved.winner === null
      ? t('result.draw')
      : t('result.decided', { name: config.names[resolved.winner], method: t(`methods.${resolved.method}`) });
  const canSave = !saving && (outcome !== 'submission' || Boolean(techniqueId));
  const athleteOptions = ([0, 1] as const).map((i) => ({ value: i, label: config.names[i] }));

  const save = async () => {
    setSaving(true);
    try {
      await saveMatch({
        date: todayIso(),
        mode: config.mode,
        durationSec,
        athletes: [
          { name: config.names[0], ...totals[0] },
          { name: config.names[1], ...totals[1] },
        ],
        winner: resolved.winner,
        method: resolved.method,
        events: events.map(({ athlete, kind }) => ({ athlete, kind })),
        ...(outcome === 'submission' ? { submissionId: techniqueId } : {}),
      });
      if (outcome === 'submission' && toJournal && techniqueId) {
        await recordSubmission({
          date: todayIso(),
          mode: config.mode,
          techniqueId,
          outcome: submitter === 0 ? 'achieved' : 'suffered',
        });
      }
      onDone();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t('result.title')}</h2>
      <p className="flex items-center justify-center gap-6 text-center text-5xl font-bold tabular-nums">
        <span>{totals[0].points}</span>
        <span className="text-muted">–</span>
        <span>{totals[1].points}</span>
      </p>
      <p className="text-center text-sm text-muted">
        {config.names[0]} · {config.names[1]}
      </p>
      <Segmented
        label={t('result.title')}
        options={OUTCOMES.map((o) => ({ value: o, label: t(`result.${OUTCOME_KEYS[o]}`) }))}
        value={outcome}
        onChange={setOutcome}
      />
      {outcome === 'referee' && (
        <div>
          <span className="label">{t('result.referee')}</span>
          <Segmented
            label={t('result.referee')}
            options={[...athleteOptions, { value: -1 as const, label: t('result.draw') }]}
            value={refereeWinner}
            onChange={setRefereeWinner}
          />
        </div>
      )}
      {outcome === 'submission' && (
        <>
          <div>
            <span className="label">{t('result.submitter')}</span>
            <Segmented label={t('result.submitter')} options={athleteOptions} value={submitter} onChange={setSubmitter} />
          </div>
          <TechniquePicker
            label={t('result.technique')}
            value={techniqueIds}
            onChange={setTechniqueIds}
            multiple={false}
            types={['submission']}
            mode={config.mode}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={toJournal} onChange={(e) => setToJournal(e.target.checked)} />
            {t('result.toJournal')}
          </label>
        </>
      )}
      <p className="text-center text-lg font-semibold text-accent">{summary}</p>
      <div className="flex gap-2">
        <button type="button" className="btn btn-primary flex-1 py-3" disabled={!canSave} onClick={() => void save()}>
          {t('result.save')}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onDone}>
          {t('result.discard')}
        </button>
      </div>
    </div>
  );
}
