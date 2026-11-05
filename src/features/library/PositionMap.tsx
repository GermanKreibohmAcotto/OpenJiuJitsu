import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';
import { matchesModeFilter, useSettings } from '../../app/settings';
import { ModeToggle } from '../../components/ModeToggle';
import { PageHeader } from '../../components/Page';
import { incomingEdges, isPositionInMode, outgoingEdges, type PositionEdge } from '../../domain/positionGraph';
import { POSITIONS, TECHNIQUE_TYPES, type Position } from '../../domain/types';
import { useTechniques } from '../../hooks/useTechniques';
import { localize } from '../../i18n';

const LAYERS: { id: string; positions: Position[] }[] = [
  { id: 'standing', positions: ['standing'] },
  {
    id: 'guards',
    positions: [
      'closed_guard',
      'half_guard',
      'spider_guard',
      'de_la_riva',
      'butterfly_guard',
      'x_guard',
      'lasso_guard',
      'single_leg_x',
    ],
  },
  { id: 'top', positions: ['side_control', 'mount', 'knee_on_belly', 'north_south'] },
  { id: 'back', positions: ['back', 'turtle'] },
];

function isPosition(value: string | null): value is Position {
  return value !== null && (POSITIONS as readonly string[]).includes(value);
}

export function PositionMap() {
  const { t, i18n } = useTranslation('library');
  const { modeFilter, setModeFilter } = useSettings();
  const techniques = useTechniques();
  const [params, setParams] = useSearchParams();
  const raw = params.get('pos');
  const selected = isPosition(raw) && isPositionInMode(raw, modeFilter) ? raw : null;

  const grouped = useMemo(() => {
    const here = (techniques ?? [])
      .filter((tech) => tech.position === selected && matchesModeFilter(tech.modes, modeFilter))
      .sort((a, b) => localize(a.name, i18n.language).localeCompare(localize(b.name, i18n.language)));
    return TECHNIQUE_TYPES.map((type) => ({ type, items: here.filter((tech) => tech.type === type) })).filter(
      (group) => group.items.length > 0,
    );
  }, [techniques, selected, modeFilter, i18n.language]);

  const select = (position: Position) => setParams({ pos: position });

  const edgeList = (edges: PositionEdge[], side: 'from' | 'to', title: string) => (
    <section aria-label={title}>
      <h3 className="mb-2 text-sm font-semibold text-muted">{title}</h3>
      {edges.length === 0 ? (
        <p className="text-sm text-muted">{t('map.noTransitions')}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {edges.map((e) => (
            <li key={`${e.from}-${e.to}-${e.kind}`}>
              <Link to={`/library/map?pos=${e[side]}`} className="chip hover:border-accent">
                {t(`common:positions.${e[side]}`)} · {t(`map.kinds.${e.kind}`)}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <>
      <PageHeader
        title={t('map.title')}
        subtitle={t('map.subtitle')}
        actions={
          <>
            <ModeToggle value={modeFilter} onChange={setModeFilter} allowAll />
            <Link to="/library" className="btn btn-ghost">
              {t('backToList')}
            </Link>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3">
        {LAYERS.map((layer) => (
          <div key={layer.id} className="card p-3">
            <h2 className="mb-2 text-xs uppercase tracking-wide text-muted">{t(`map.layers.${layer.id}`)}</h2>
            <div className="flex flex-wrap gap-2">
              {layer.positions.filter((position) => isPositionInMode(position, modeFilter)).map((position) => (
                <button
                  key={position}
                  type="button"
                  className={`chip ${selected === position ? 'chip-active' : ''}`}
                  aria-pressed={selected === position}
                  onClick={() => select(position)}
                >
                  {t(`common:positions.${position}`)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selected ? (
        <section aria-label={t(`common:positions.${selected}`)} className="card flex flex-col gap-4 p-4">
          <h2 className="font-display text-xl">{t(`common:positions.${selected}`)}</h2>
          {edgeList(outgoingEdges(selected, modeFilter), 'to', t('map.outgoing'))}
          {edgeList(incomingEdges(selected, modeFilter), 'from', t('map.incoming'))}
          <section aria-label={t('map.techniques')}>
            <h3 className="mb-2 text-sm font-semibold text-muted">{t('map.techniques')}</h3>
            {grouped.length === 0 ? (
              <p className="text-sm text-muted">{t('map.noTechniques')}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {grouped.map((group) => (
                  <div key={group.type}>
                    <h4 className="mb-1 text-xs uppercase tracking-wide text-muted">{t(`common:types.${group.type}`)}</h4>
                    <ul className="flex flex-col gap-1">
                      {group.items.map((tech) => (
                        <li key={tech.id}>
                          <Link to={`/library/${tech.id}`} className="hover:text-accent">
                            {localize(tech.name, i18n.language)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        </section>
      ) : (
        <p className="text-sm text-muted">{t('map.pick')}</p>
      )}
    </>
  );
}
