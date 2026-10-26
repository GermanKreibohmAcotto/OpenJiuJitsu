import { useTranslation } from 'react-i18next';
import type { Mode, ModeFilter } from '../domain/types';

interface ModeToggleProps<T extends ModeFilter> {
  value: T;
  onChange: (mode: T) => void;
  /** Include the "GI + NoGI" option. */
  allowAll?: boolean;
  className?: string;
}

/** Segmented GI / NoGI (/ both) selector. */
export function ModeToggle<T extends ModeFilter>({ value, onChange, allowAll = false, className = '' }: ModeToggleProps<T>) {
  const { t } = useTranslation();
  const options = (allowAll ? ['all', 'gi', 'nogi'] : ['gi', 'nogi']) as T[];
  return (
    <div role="radiogroup" aria-label={t('modeFilter')} className={`inline-flex rounded-xl border border-line bg-surface-2 p-0.5 ${className}`}>
      {options.map((mode) => (
        <button
          key={mode}
          type="button"
          role="radio"
          aria-checked={value === mode}
          onClick={() => onChange(mode)}
          className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
            value === mode ? 'bg-accent text-accent-ink' : 'text-muted hover:text-zinc-100'
          }`}
        >
          {t(`modes.${mode}`)}
        </button>
      ))}
    </div>
  );
}

export function ModeBadges({ modes }: { modes: Mode[] }) {
  const { t } = useTranslation();
  return (
    <span className="inline-flex gap-1">
      {modes.map((mode) => (
        <span key={mode} className="chip px-2 py-0 text-[10px] font-semibold tracking-wider uppercase">
          {t(`modes.${mode}`)}
        </span>
      ))}
    </span>
  );
}
