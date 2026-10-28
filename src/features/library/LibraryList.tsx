import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { matchesModeFilter, useSettings } from '../../app/settings';
import { BeltLegalityBadges } from '../../components/BeltLegalityBadges';
import { ModeBadges, ModeToggle } from '../../components/ModeToggle';
import { EmptyState, PageHeader } from '../../components/Page';
import { matchesSearch } from '../../components/TechniquePicker';
import { CATEGORIES, TECHNIQUE_TYPES, type Category, type TechniqueType } from '../../domain/types';
import { useTechniques } from '../../hooks/useTechniques';
import { localize } from '../../i18n';

export function LibraryList() {
  const { t, i18n } = useTranslation('library');
  const { modeFilter, setModeFilter } = useSettings();
  const techniques = useTechniques();
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [type, setType] = useState<TechniqueType | 'all'>('all');
  const [query, setQuery] = useState('');

  const visible = useMemo(
    () =>
      (techniques ?? [])
        .filter((tech) => category === 'all' || tech.category === category)
        .filter((tech) => type === 'all' || tech.type === type)
        .filter((tech) => matchesModeFilter(tech.modes, modeFilter))
        .filter((tech) => matchesSearch(tech, query))
        .sort((a, b) => localize(a.name, i18n.language).localeCompare(localize(b.name, i18n.language))),
    [techniques, category, type, modeFilter, query, i18n.language],
  );

  return (
    <>
      <PageHeader
        title={t('title')}
        actions={
          <>
            <ModeToggle value={modeFilter} onChange={setModeFilter} allowAll />
            <Link to="/library/new" className="btn btn-primary">
              {t('newTechnique')}
            </Link>
          </>
        }
      />

      <div role="tablist" aria-label={t('categoryTabs')} className="mb-3 flex flex-wrap gap-2">
        {(['all', ...CATEGORIES] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={category === value}
            onClick={() => setCategory(value)}
            className={`chip cursor-pointer ${category === value ? 'chip-active' : ''}`}
          >
            {value === 'all' ? t('all') : t(`common:categories.${value}`)}
          </button>
        ))}
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          type="search"
          className="input"
          aria-label={t('common:actions.search')}
          placeholder={t('common:picker.placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="input"
          aria-label={t('typeFilter')}
          value={type}
          onChange={(e) => setType(e.target.value as TechniqueType | 'all')}
        >
          <option value="all">{t('allTypes')}</option>
          {TECHNIQUE_TYPES.map((value) => (
            <option key={value} value={value}>
              {t(`common:types.${value}`)}
            </option>
          ))}
        </select>
      </div>

      {techniques && visible.length === 0 ? (
        <EmptyState>{t('noResults')}</EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((tech) => (
            <li key={tech.id} className="card flex flex-col gap-2 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link to={`/library/${tech.id}`} className="font-semibold hover:text-accent">
                  {localize(tech.name, i18n.language)}
                </Link>
                <ModeBadges modes={tech.modes} />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <span>{t(`common:types.${tech.type}`)}</span>
                {tech.position && <span>· {t(`common:positions.${tech.position}`)}</span>}
                {tech.type === 'submission' && <BeltLegalityBadges legality={tech.legality} modes={tech.modes} />}
                {tech.counterpartIds.length === 0 && (
                  <span className="chip border-danger/40 text-danger" title={t('noCounterpartHint')}>
                    <span aria-hidden>⚠</span> {t('noCounterpart')}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
