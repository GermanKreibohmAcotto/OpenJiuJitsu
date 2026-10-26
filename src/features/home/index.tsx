import { Link, Route, Routes } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSettings } from '../../app/settings';
import { BeltBar } from '../../components/BeltBar';
import { PageHeader } from '../../components/Page';
import { getProfile } from '../../db/profile';
import { listSessions } from '../../db/sessions';
import { filterByMode, minutesToHours, totalMinutes } from '../profile/stats';

const ACTIONS = [
  { to: '/journal/new', key: 'journal', icon: '📝' },
  { to: '/sparring', key: 'sparring', icon: '⏱️' },
  { to: '/plans/new', key: 'plan', icon: '🗂️' },
  { to: '/library', key: 'library', icon: '📖' },
] as const;

function Dashboard() {
  const { t } = useTranslation('home');
  const { modeFilter } = useSettings();
  const profile = useLiveQuery(getProfile, []);
  const allSessions = useLiveQuery(listSessions, []);
  const sessions = filterByMode(allSessions ?? [], modeFilter);
  const last = sessions[0];

  return (
    <>
      <PageHeader title={t('title')} />
      <div className="grid gap-4 md:grid-cols-2">
        <section className="card space-y-3" aria-labelledby="home-belt">
          <div className="flex items-center justify-between gap-2">
            <h2 id="home-belt" className="text-sm font-semibold">
              {profile?.name || t('belt')}
            </h2>
            <Link to="/profile" className="btn btn-ghost text-accent">
              {t('editProfile')}
            </Link>
          </div>
          {profile && <BeltBar belt={profile.belt} stripes={profile.stripes} size="lg" />}
        </section>

        <section className="card" aria-labelledby="home-hours">
          <h2 id="home-hours" className="label">
            {t('hours')}
          </h2>
          <p className="text-3xl font-bold">{t('hoursValue', { value: minutesToHours(totalMinutes(sessions)) })}</p>
          <p className="text-sm text-muted">{t('sessions', { count: sessions.length })}</p>
        </section>

        <section className="card md:col-span-2" aria-labelledby="home-last">
          <h2 id="home-last" className="label">
            {t('last.title')}
          </h2>
          {last ? (
            <>
              <p className="font-medium">
                {t('last.summary', { date: last.date, mode: t(`modes.${last.mode}`, { ns: 'common' }), minutes: last.durationMin })}
              </p>
              <p className="text-sm text-muted">
                {t('last.details', { rounds: last.sparringRounds, achieved: last.subsAchieved.length, suffered: last.subsSuffered.length })}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted">{t('last.empty')}</p>
          )}
        </section>

        <nav className="md:col-span-2" aria-label={t('actions.title')}>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {ACTIONS.map((action) => (
              <li key={action.key}>
                <Link to={action.to} className="card flex flex-col items-center gap-1 py-5 text-sm font-medium hover:border-accent">
                  <span aria-hidden className="text-2xl">
                    {action.icon}
                  </span>
                  {t(`actions.${action.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}

export function HomeRoutes() {
  return (
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path="*" element={<Dashboard />} />
    </Routes>
  );
}
