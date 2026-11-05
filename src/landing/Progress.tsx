import type { ReactNode } from 'react';
import { Icon } from '../components/Icon';
import { useLanding } from './context';
import { AXES, BELT_COLOR, BELT_TIP, EXAMPLE, RADAR, fmt, radarPoint, radarPolygon } from './landingData';
import { Reveal, stagger } from './Reveal';
import { Kicker, Meter, ProgressBar } from './ui';

const TILE = 'rounded-2xl border border-line bg-surface p-6 md:p-7';

function Tile({ id, label, title, text, className = '', delay = 0, children }: { id: string; label: string; title: string; text: string; className?: string; delay?: number; children: ReactNode }) {
  return (
    <Reveal as="article" aria-labelledby={id} delay={delay} className={`${TILE} ${className}`}>
      <span className="label">{label}</span>
      <h4 id={id} className="mt-2 mb-1.5 text-[22px] font-semibold">
        {title}
      </h4>
      <p className="mb-5 text-[15px] text-muted">{text}</p>
      {children}
    </Reveal>
  );
}

function Radar() {
  const { copy, app } = useLanding();
  const scores = AXES.map((axis) => EXAMPLE.axisScores[axis]);
  const top = scores.indexOf(Math.max(...scores));
  const topName = app.analytics.axes[AXES[top]].name;
  const spokes = AXES.map((_, i) => radarPoint(i, 100));
  return (
    <svg
      viewBox="0 0 320 290"
      className="mx-auto w-full max-w-[320px]"
      role="img"
      aria-label={fmt(copy.features.progress.radarLabel, { axis: topName })}
    >
      <polygon points={radarPolygon(AXES.map(() => 100))} fill="none" stroke="var(--color-line)" />
      <polygon points={radarPolygon(AXES.map(() => 50))} fill="none" stroke="var(--color-line)" />
      <g stroke="var(--color-line)">
        {spokes.map((p, i) => (
          <line key={i} x1={RADAR.cx} y1={RADAR.cy} x2={p.x.toFixed(1)} y2={p.y.toFixed(1)} />
        ))}
      </g>
      <Reveal
        as="polygon"
        variant="pop"
        delay={250}
        points={radarPolygon(scores)}
        fill="color-mix(in srgb, var(--color-accent) 22%, transparent)"
        stroke="var(--color-accent)"
        strokeWidth="2"
        style={{ transformOrigin: `${RADAR.cx}px ${RADAR.cy}px` }}
      />
      <g fill="var(--color-muted)" fontSize="12" textAnchor="middle" dominantBaseline="middle">
        {AXES.map((axis, i) => {
          const p = radarPoint(i, 100, RADAR.radius + 20);
          return (
            <text key={axis} x={p.x.toFixed(0)} y={p.y.toFixed(0)} fill={i === top ? 'var(--color-accent)' : undefined}>
              {i + 1}
            </text>
          );
        })}
      </g>
    </svg>
  );
}

function Analytics() {
  const { copy, app } = useLanding();
  const text = copy.features.progress;
  const { analytics } = app;
  const scores = AXES.map((axis) => EXAMPLE.axisScores[axis]);
  const top = scores.indexOf(Math.max(...scores));
  const low = scores.indexOf(Math.min(...scores));
  const insight = (index: number, label: string, strong: boolean) => {
    const axis = analytics.axes[AXES[index]];
    return (
      <div className={`rounded-xl border bg-surface-2 p-4 ${strong ? 'border-accent' : 'border-line'}`}>
        <span className={`font-display float-right text-[28px] leading-none ${strong ? 'text-accent' : ''}`}>{scores[index]}</span>
        <span className="label mb-0">{label}</span>
        <b className="mt-1 mb-0.5 block text-[17px]">{axis.name}</b>
        <small className="text-[13px] text-muted">{axis.basis}</small>
      </div>
    );
  };
  return (
    <Tile id="m1" label={app.common.nav.analytics} title={analytics.title} text={analytics.subtitle} className="flex flex-col md:row-span-2">
      <div className="grid items-center gap-6 sm:grid-cols-[minmax(0,320px)_1fr]">
        <Radar />
        <ol className="grid gap-2 text-sm">
          {AXES.map((axis, i) => (
            <li key={axis} className="grid grid-cols-[22px_1fr_30px] items-center gap-2">
              <span
                className={`grid size-[22px] place-items-center rounded-full border bg-surface-2 text-[11px] ${i === top ? 'border-accent text-accent' : 'border-line text-muted'}`}
              >
                {i + 1}
              </span>
              {analytics.axes[axis].name}
              <b className="text-right tabular-nums">{scores[i]}</b>
            </li>
          ))}
        </ol>
      </div>
      <div className="mt-auto grid gap-3 pt-6 sm:grid-cols-2">
        {insight(top, text.strong, true)}
        {insight(low, text.weak, false)}
      </div>
    </Tile>
  );
}

function Goal({ label, current, target, display }: { label: string; current: number; target: number; display: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-muted">{label}</span>
        {display}
      </div>
      <ProgressBar percent={(current / target) * 100} />
    </div>
  );
}

function Profile() {
  const { copy, app } = useLanding();
  const { profile, common } = app;
  const text = copy.features.progress;
  const of = (value: { current: number; target: number }, unit = '') =>
    fmt(profile.progress.of, { current: `${value.current}${unit}`, target: `${value.target}${unit}` });
  return (
    <Tile id="m2" label={common.nav.profile} title={profile.progress.title} text={profile.subtitle} delay={stagger(1, 90)}>
      <Goal label={profile.progress.bar.classes} current={EXAMPLE.classes.current} target={EXAMPLE.classes.target} display={of(EXAMPLE.classes)} />
      <Goal label={app.home.hours} current={EXAMPLE.hoursGoal.current} target={EXAMPLE.hoursGoal.target} display={of(EXAMPLE.hoursGoal, ' h')} />
      <Goal label={profile.progress.bar.months} current={EXAMPLE.months.current} target={EXAMPLE.months.target} display={of(EXAMPLE.months)} />
      <div role="group" aria-label={profile.graduations.title} className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-2 text-[13px] text-muted">
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <i className="inline-block h-2 w-[22px] rounded-[2px]" style={{ background: BELT_COLOR.white }} />
          {common.belts.white} · {text.timeline.white}
        </span>
        <span className="hidden h-0.5 min-w-4 flex-1 bg-line sm:block" />
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <i className="inline-block h-2 w-[22px] rounded-[2px]" style={{ background: BELT_COLOR.blue }} />
          {common.belts.blue} · {text.timeline.blue}
        </span>
        <span className="hidden h-0.5 min-w-4 flex-1 bg-line sm:block" />
        <span className="flex items-center gap-1.5 whitespace-nowrap text-zinc-100">
          <i className="inline-block h-2 w-[22px] rounded-[2px]" style={{ background: BELT_COLOR[EXAMPLE.belt], boxShadow: `inset -6px 0 0 ${BELT_TIP}` }} />
          {fmt(common.stripes_other, { count: EXAMPLE.stripes })} · {text.timeline.today}
        </span>
      </div>
    </Tile>
  );
}

function Injuries() {
  const { copy, app } = useLanding();
  const { injuries } = app;
  return (
    <Tile id="m3" label={app.common.nav.injuries} title={injuries.title} text={injuries.subtitle} delay={stagger(2, 90)}>
      {EXAMPLE.injuries.map((injury) => {
        const active = injury.status === 'active';
        return (
          <div key={injury.zone} className="grid grid-cols-[auto_1fr_auto] items-center gap-3.5 rounded-xl border border-line bg-surface-2 px-3.5 py-3 [&+&]:mt-2">
            <span
              aria-hidden="true"
              className={`grid size-10 place-items-center rounded-xl text-xl ${active ? 'bg-accent/12 text-accent' : 'bg-surface text-muted'}`}
            >
              <Icon name="healing" />
            </span>
            <span>
              {injuries.zones[injury.zone]}
              <small className="block text-[13px] text-muted">
                {injuries.status[injury.status]}
                {active ? ` · ${copy.features.progress.injuryNote}` : ''}
              </small>
            </span>
            <span className="w-24 sm:w-[120px]">
              <small className="text-[13px] text-muted">{fmt(injuries.intensityValue, { value: injury.intensity })}</small>
              <Meter value={injury.intensity} />
            </span>
          </div>
        );
      })}
    </Tile>
  );
}

export function Progress() {
  const { copy } = useLanding();
  const text = copy.features.progress;
  return (
    <div className="border-t border-line pt-14">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-6">
        <Reveal>
          <Kicker num="06">{text.kicker}</Kicker>
          <h3 className="font-display mt-3 text-[26px] leading-[1.1] md:text-[32px]">{text.title}</h3>
        </Reveal>
        <Reveal as="p" delay={120} className="max-w-[420px] text-muted">
          {text.text}
        </Reveal>
      </header>
      <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]">
        <Analytics />
        <Profile />
        <Injuries />
      </div>
    </div>
  );
}
