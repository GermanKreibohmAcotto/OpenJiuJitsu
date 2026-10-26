import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { matchesModeFilter, useSettings } from '../app/settings';
import type { ModeFilter, Technique, TechniqueType } from '../domain/types';
import { useTechniques } from '../hooks/useTechniques';
import { localize } from '../i18n';

interface TechniquePickerProps {
  /** Selected technique ids. */
  value: string[];
  onChange: (ids: string[]) => void;
  /** Single-select replaces the selection on click. */
  multiple?: boolean;
  /** Only offer these technique types (e.g. ['submission']). */
  types?: TechniqueType[];
  /** Overrides the global GI/NoGI filter. */
  mode?: ModeFilter;
  label?: string;
  maxHeightClass?: string;
}

export function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

/** Accent-insensitive search over the technique name in every language. */
export function matchesSearch(technique: Technique, query: string): boolean {
  const q = normalizeSearch(query);
  if (!q) return true;
  return Object.values(technique.name).some((name) => name && normalizeSearch(name).includes(q));
}

/** Searchable technique selector shared by plans, journal and sparring. */
export function TechniquePicker({
  value,
  onChange,
  multiple = true,
  types,
  mode,
  label,
  maxHeightClass = 'max-h-64',
}: TechniquePickerProps) {
  const { t, i18n } = useTranslation();
  const { modeFilter } = useSettings();
  const techniques = useTechniques();
  const [query, setQuery] = useState('');
  const filter = mode ?? modeFilter;

  const options = useMemo(
    () =>
      (techniques ?? [])
        .filter((tech) => !types || types.includes(tech.type))
        .filter((tech) => matchesModeFilter(tech.modes, filter))
        .filter((tech) => matchesSearch(tech, query))
        .sort((a, b) => localize(a.name, i18n.language).localeCompare(localize(b.name, i18n.language))),
    [techniques, types, filter, query, i18n.language],
  );

  const toggle = (id: string) => {
    if (!multiple) return onChange(value[0] === id ? [] : [id]);
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  return (
    <div className="flex flex-col gap-2">
      {label && <span className="label">{label}</span>}
      <input
        type="search"
        className="input"
        placeholder={t('picker.placeholder')}
        aria-label={label ?? t('picker.placeholder')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ul className={`${maxHeightClass} overflow-y-auto rounded-xl border border-line`} role="listbox" aria-multiselectable={multiple}>
        {options.length === 0 && <li className="p-3 text-sm text-muted">{t('picker.empty')}</li>}
        {options.map((tech) => {
          const selected = value.includes(tech.id);
          return (
            <li key={tech.id} role="option" aria-selected={selected}>
              <button
                type="button"
                onClick={() => toggle(tech.id)}
                className={`flex w-full items-center justify-between gap-2 border-b border-line px-3 py-2 text-left text-sm last:border-b-0 ${
                  selected ? 'bg-accent/10 text-accent' : 'hover:bg-surface-2'
                }`}
              >
                <span>{localize(tech.name, i18n.language)}</span>
                <span className="text-xs text-muted">{t(`types.${tech.type}`)}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {multiple && value.length > 0 && <p className="text-xs text-muted">{t('picker.selected', { count: value.length })}</p>}
    </div>
  );
}
