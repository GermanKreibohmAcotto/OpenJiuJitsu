import { useTranslation } from 'react-i18next';
import { TechniquePicker } from '../../components/TechniquePicker';
import type { Mode } from '../../domain/types';
import { useTechniqueMap } from '../../hooks/useTechniques';
import { useLocalize } from '../../i18n';
import { countIds } from './parts';

interface SubmissionFieldProps {
  legend: string;
  hint: string;
  mode: Mode;
  /** Technique ids; a repeated id is a repeated submission (the storage contract used by stats). */
  value: string[];
  onChange: (ids: string[]) => void;
}

/** Picks submissions from the library and counts how many times each one happened. */
export function SubmissionField({ legend, hint, mode, value, onChange }: SubmissionFieldProps) {
  const { t } = useTranslation('journal');
  const techniques = useTechniqueMap();
  const localize = useLocalize();
  const counts = countIds(value);

  // The picker toggles unique ids: new ones start at one, deselected ones drop all their repeats.
  const onPick = (ids: string[]) => {
    const kept = value.filter((id) => ids.includes(id));
    const added = ids.filter((id) => !value.includes(id));
    onChange([...kept, ...added]);
  };

  const setCount = (id: string, count: number) => {
    const rest = value.filter((v) => v !== id);
    onChange([...rest, ...Array<string>(Math.max(count, 0)).fill(id)]);
  };

  return (
    <fieldset className="card flex flex-col gap-3">
      <legend className="label px-1">{legend}</legend>
      <p className="text-xs text-muted">{hint}</p>
      <TechniquePicker value={counts.map(([id]) => id)} onChange={onPick} types={['submission']} mode={mode} />
      {counts.length > 0 && (
        <ul className="flex flex-col gap-1">
          {counts.map(([id, count]) => {
            const name = techniques.has(id) ? localize(techniques.get(id)?.name) : t('common:unknownTechnique');
            return (
              <li key={id} className="flex items-center justify-between gap-2 text-sm">
                <span>{name}</span>
                <span className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn px-3 py-1"
                    aria-label={t('form.decrease', { name })}
                    onClick={() => setCount(id, count - 1)}
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-semibold" aria-live="polite">
                    {count}
                  </span>
                  <button
                    type="button"
                    className="btn px-3 py-1"
                    aria-label={t('form.increase', { name })}
                    onClick={() => setCount(id, count + 1)}
                  >
                    +
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </fieldset>
  );
}
