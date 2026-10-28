import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useSettings } from '../../app/settings';
import { ModeToggle } from '../../components/ModeToggle';
import { EmptyState } from '../../components/Page';
import { listSessions } from '../../db/sessions';
import { MODES, type Technique } from '../../domain/types';
import { useTechniqueMap } from '../../hooks/useTechniques';
import { useLocalize } from '../../i18n';
import {
  countSubmissions,
  filterByMode,
  minutesToHours,
  modeSplit,
  totalMinutes,
  totalSparringRounds,
  type SubmissionCount,
} from './stats';

const TOP = 5;

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card">
      <p className="label">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

interface RankedChartProps {
  data: { name: string; count: number }[];
  color: string;
  label: string;
  valueLabel: string;
}

function RankedChart({ data, color, label, valueLabel }: RankedChartProps) {
  return (
    <div role="img" aria-label={label} style={{ height: data.length * 40 + 30 }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
          <XAxis type="number" allowDecimals={false} stroke="#8b93a1" fontSize={11} />
          <YAxis type="category" dataKey="name" width={130} stroke="#8b93a1" fontSize={11} interval={0} />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{ background: '#1b1f26', border: '1px solid #262b33', borderRadius: 12 }}
            formatter={(value) => [value, valueLabel]}
          />
          <Bar dataKey="count" fill={color} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Counterpart worth training: prefer an escape/defense, otherwise the first one. */
function trainingTarget(technique: Technique | undefined, techniques: Map<string, Technique>): Technique | undefined {
  const counterparts = (technique?.counterpartIds ?? []).map((id) => techniques.get(id)).filter((c): c is Technique => !!c);
  return counterparts.find((c) => c.type === 'escape') ?? counterparts[0];
}

export function StatsDashboard() {
  const { t } = useTranslation('profile');
  const localize = useLocalize();
  const { modeFilter, setModeFilter, accent } = useSettings();
  const techniques = useTechniqueMap();
  const allSessions = useLiveQuery(listSessions, []);

  if (!allSessions) return null;
  if (allSessions.length === 0) {
    return (
      <section aria-labelledby="stats-title" className="space-y-3">
        <h2 id="stats-title" className="text-lg font-semibold">
          {t('stats.title')}
        </h2>
        <EmptyState
          action={
            <Link to="/journal/new" className="btn btn-primary">
              {t('stats.emptyAction')}
            </Link>
          }
        >
          {t('stats.empty')}
        </EmptyState>
      </section>
    );
  }

  const sessions = filterByMode(allSessions, modeFilter);
  const split = modeSplit(allSessions);
  const nameOf = (id: string) => (techniques.has(id) ? localize(techniques.get(id)?.name) : t('unknownTechnique', { ns: 'common' }));
  const ranked = (entries: SubmissionCount[]) => entries.slice(0, TOP).map((e) => ({ ...e, name: nameOf(e.id) }));
  const achieved = ranked(countSubmissions(sessions, 'subsAchieved'));
  const suffered = ranked(countSubmissions(sessions, 'subsSuffered'));
  const takedownsLanded = ranked(countSubmissions(sessions, 'takedownsAchieved'));
  const takedownsTaken = ranked(countSubmissions(sessions, 'takedownsSuffered'));

  return (
    <section aria-labelledby="stats-title" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="stats-title" className="text-lg font-semibold">
          {t('stats.title')}
        </h2>
        <ModeToggle value={modeFilter} onChange={setModeFilter} allowAll />
      </div>

      <div className="grid grid-cols-1 gap-3 min-[430px]:grid-cols-3">
        <StatCard label={t('stats.hours')} value={t('stats.hoursValue', { value: minutesToHours(totalMinutes(sessions)) })} />
        <StatCard label={t('stats.sessions')} value={sessions.length} />
        <StatCard label={t('stats.rounds')} value={totalSparringRounds(sessions)} />
      </div>

      <div className="card space-y-2">
        <h3 className="text-sm font-semibold">{t('stats.split')}</h3>
        {MODES.map((mode) => {
          const share = totalMinutes(allSessions) ? (split[mode].minutes / totalMinutes(allSessions)) * 100 : 0;
          return (
            <div key={mode}>
              <p className="flex justify-between text-xs text-muted">
                <span className="font-semibold text-zinc-100">{t(`modes.${mode}`, { ns: 'common' })}</span>
                <span>{t('stats.splitRow', { ...split[mode] })}</span>
              </p>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full bg-accent" style={{ width: `${share}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="card space-y-3">
        <h3 className="text-sm font-semibold">{t('stats.achieved')}</h3>
        {achieved.length === 0 ? (
          <p className="text-sm text-muted">{t('stats.achievedEmpty')}</p>
        ) : (
          <>
            <RankedChart data={achieved} color={accent} label={t('stats.achievedChart')} valueLabel={t('stats.times')} />
            <ol className="sr-only">
              {achieved.map((entry) => (
                <li key={entry.id}>
                  <span>{entry.name}</span>: {entry.count}
                </li>
              ))}
            </ol>
          </>
        )}
      </div>

      <div className="card space-y-3">
        <h3 className="text-sm font-semibold">{t('stats.suffered')}</h3>
        {suffered.length === 0 ? (
          <p className="text-sm text-muted">{t('stats.sufferedEmpty')}</p>
        ) : (
          <>
            <p className="text-xs text-muted">{t('stats.sufferedHint')}</p>
            <RankedChart data={suffered} color="#f87171" label={t('stats.sufferedChart')} valueLabel={t('stats.times')} />
            <ol className="divide-y divide-line">
              {suffered.map((entry) => {
                const target = trainingTarget(techniques.get(entry.id), techniques);
                return (
                  <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <span>
                      {entry.name} <span className="text-muted">×{entry.count}</span>
                    </span>
                    {target && (
                      <Link to={`/library/${target.id}`} className="btn btn-ghost text-accent">
                        {t('stats.train', { name: localize(target.name) })}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </div>

      <div className="card space-y-3">
        <h3 className="text-sm font-semibold">{t('stats.takedownsAchieved')}</h3>
        {takedownsLanded.length === 0 ? (
          <p className="text-sm text-muted">{t('stats.takedownsAchievedEmpty')}</p>
        ) : (
          <>
            <RankedChart data={takedownsLanded} color={accent} label={t('stats.takedownsAchievedChart')} valueLabel={t('stats.times')} />
            <ol className="sr-only">
              {takedownsLanded.map((entry) => (
                <li key={entry.id}>
                  <span>{entry.name}</span>: {entry.count}
                </li>
              ))}
            </ol>
          </>
        )}
      </div>

      <div className="card space-y-3">
        <h3 className="text-sm font-semibold">{t('stats.takedownsSuffered')}</h3>
        {takedownsTaken.length === 0 ? (
          <p className="text-sm text-muted">{t('stats.takedownsSufferedEmpty')}</p>
        ) : (
          <>
            <p className="text-xs text-muted">{t('stats.takedownsSufferedHint')}</p>
            <RankedChart data={takedownsTaken} color="#f87171" label={t('stats.takedownsSufferedChart')} valueLabel={t('stats.times')} />
            <ol className="divide-y divide-line">
              {takedownsTaken.map((entry) => {
                const target = trainingTarget(techniques.get(entry.id), techniques);
                return (
                  <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <span>
                      {entry.name} <span className="text-muted">×{entry.count}</span>
                    </span>
                    {target && (
                      <Link to={`/library/${target.id}`} className="btn btn-ghost text-accent">
                        {t('stats.train', { name: localize(target.name) })}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </div>
    </section>
  );
}
