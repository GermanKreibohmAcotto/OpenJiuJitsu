import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { Route, Routes } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../app/settings';
import { ModeToggle } from '../../components/ModeToggle';
import { EmptyState, PageHeader } from '../../components/Page';
import { listMatches } from '../../db/matches';
import { getProfile, saveSelfRating } from '../../db/profile';
import { listSessions } from '../../db/sessions';
import { AXES, RATING_MAX, RATING_MIN, computeAnalytics, dominantAxis, type Axis } from './metrics';
import { RadarProfile } from './RadarProfile';

function AnalyticsPage() {
  const { t } = useTranslation('analytics');
  const { modeFilter, setModeFilter } = useSettings();
  const matches = useLiveQuery(listMatches, []);
  const sessions = useLiveQuery(listSessions, []);
  const profile = useLiveQuery(getProfile, []);

  const results = useMemo(() => {
    if (!matches || !sessions || !profile) return undefined;
    const inMode = <T extends { mode: string }>(rows: T[]) => (modeFilter === 'all' ? rows : rows.filter((r) => r.mode === modeFilter));
    return computeAnalytics({ matches: inMode(matches), sessions: inMode(sessions), selfRatings: profile.selfRatings });
  }, [matches, sessions, profile, modeFilter]);

  if (!results || !profile) return null;

  const labels = Object.fromEntries(AXES.map((axis) => [axis, t(`axes.${axis}.name`)])) as Record<Axis, string>;
  const dominant = dominantAxis(results);
  const flexibility = profile.selfRatings?.flexibility;

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={<ModeToggle value={modeFilter} onChange={setModeFilter} allowAll />}
      />
      <div className="space-y-5">
        {dominant ? (
          <p className="card text-sm">
            <span className="text-muted">{t('dominant')}: </span>
            <span className="font-semibold text-accent">{labels[dominant]}</span>
          </p>
        ) : (
          <EmptyState>{t('empty')}</EmptyState>
        )}

        <section className="card" aria-label={t('chart')}>
          <RadarProfile results={results} labels={labels} label={t('chart')} />
        </section>

        <section className="card space-y-3">
          <h2 className="label mb-0">{t('breakdown')}</h2>
          <ul className="divide-y divide-line">
            {results.map((r) => (
              <li key={r.axis} className="flex items-start justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold">{labels[r.axis]}</p>
                  <p className="text-xs text-muted">{t(`axes.${r.axis}.basis`)}</p>
                </div>
                <span className={`shrink-0 tabular-nums ${r.hasData ? 'font-bold' : 'text-muted'}`}>
                  {r.hasData ? `${r.value}/100` : t('noData')}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card space-y-2">
          <label htmlFor="flexibility-rating" className="label mb-0">
            {t('rating.label')}
          </label>
          <p className="text-xs text-muted">{t('rating.help')}</p>
          <div className="flex items-center gap-3">
            <input
              id="flexibility-rating"
              type="range"
              min={RATING_MIN}
              max={RATING_MAX}
              step={1}
              value={flexibility ?? 5}
              onChange={(e) => void saveSelfRating('flexibility', Number(e.target.value))}
              className="flex-1"
            />
            <span className="w-14 text-right text-sm tabular-nums">
              {flexibility === undefined ? t('rating.unset') : `${flexibility}/${RATING_MAX}`}
            </span>
          </div>
        </section>
      </div>
    </>
  );
}

export function AnalyticsRoutes() {
  return (
    <Routes>
      <Route index element={<AnalyticsPage />} />
    </Routes>
  );
}
