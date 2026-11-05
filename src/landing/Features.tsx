import type { ReactNode } from 'react';
import type { Belt } from '../domain/types';
import { useLanding } from './context';
import {
  BELT_COLOR,
  EXAMPLE,
  TECHNIQUE_COUNT,
  fmt,
  legalityRows,
  libraryRows,
  planExample,
  roundMinutes,
  techniqueName,
} from './landingData';
import { Progress } from './Progress';
import { Reveal, stagger } from './Reveal';
import { BeltChip, Kicker, Meter, Panel, PanelHead, Row, SECTION_X, Small } from './ui';

interface FeatureProps {
  id: string;
  num: string;
  kicker: string;
  title: string;
  text: string;
  bullets?: string[];
  flip?: boolean;
  children: ReactNode;
}

function Feature({ id, num, kicker, title, text, bullets, flip, children }: FeatureProps) {
  return (
    <article aria-labelledby={id} className="grid items-center gap-8 border-t border-line py-14 md:grid-cols-[1fr_1.15fr] md:gap-16">
      <Reveal className={flip ? 'md:order-2' : ''}>
        <Kicker num={num}>{kicker}</Kicker>
        <h3 id={id} className="font-display mt-3 mb-3.5 text-[26px] leading-[1.1] md:text-[32px]">
          {title}
        </h3>
        <p className="mb-4 max-w-[520px] text-[17px] text-zinc-300">{text}</p>
        {bullets && (
          <ul className="grid gap-2 text-[15px] text-muted">
            {bullets.map((bullet, i) => (
              <Reveal as="li" key={bullet} delay={stagger(i, 80, 150)} className="flex gap-2.5">
                <span className="mt-[9px] size-1.5 flex-none rounded-full bg-accent" />
                {bullet}
              </Reveal>
            ))}
          </ul>
        )}
      </Reveal>
      {/* The panel slides in from the side it sits on. */}
      <Reveal variant={flip ? 'left' : 'right'} delay={120}>
        {children}
      </Reveal>
    </article>
  );
}

function ModeChips() {
  const { app } = useLanding();
  return (
    <span className="flex gap-1">
      <span className="chip chip-active">{app.common.modes.gi}</span>
      <span className="chip">{app.common.modes.nogi}</span>
    </span>
  );
}

function Library() {
  const { lang, copy, app } = useLanding();
  const text = copy.features.library;
  const rows = libraryRows(lang);
  return (
    <Feature
      id="f1"
      num="01"
      kicker={app.common.nav.library}
      title={fmt(text.title, { count: TECHNIQUE_COUNT })}
      text={text.text}
      bullets={text.bullets}
    >
      <Panel label={app.library.title}>
        <PanelHead title={app.library.title} aside={<ModeChips />} />
        {rows.map((row, i) => (
          <Row key={row.id} index={i}>
            <span>
              {row.name}
              <Small>{[row.type, row.position, fmt(text.steps, { count: row.steps })].filter(Boolean).join(' · ')}</Small>
            </span>
            {row.counterpart && (
              <span className="text-right text-[13px] text-accent">
                {text.counterpart} {row.counterpart}
              </span>
            )}
          </Row>
        ))}
      </Panel>
    </Feature>
  );
}

function Legality() {
  const { lang, copy, app } = useLanding();
  const text = copy.features.legality;
  const belt = (min: Belt | null) =>
    min ? <BeltChip belt={min} label={app.common.belts[min]} /> : <span className="chip">{app.common.legality.notAllowed}</span>;
  return (
    <Feature id="f2" num="02" kicker={text.kicker} title={text.title} text={text.text} bullets={text.bullets} flip>
      <Panel label={app.common.legality.title}>
        <PanelHead
          title={app.common.types.submission}
          aside={
            <span className="label mb-0">
              {app.common.modes.gi} · {app.common.modes.nogi}
            </span>
          }
        />
        {legalityRows(lang).map((row, i) => (
          <Row key={row.id} index={i}>
            <span>{row.name}</span>
            <span className="flex flex-wrap justify-end gap-1">
              {belt(row.gi)}
              {belt(row.nogi)}
            </span>
          </Row>
        ))}
      </Panel>
    </Feature>
  );
}

function Plans() {
  const { lang, copy, app } = useLanding();
  const text = copy.features.plans;
  const plan = planExample(lang, text.rounds);
  const minutes = (count: number) => fmt(app.common.minutes, { count });
  return (
    <Feature id="f3" num="03" kicker={app.common.nav.plans} title={text.title} text={text.text}>
      <Panel label={`${app.common.nav.plans}: ${plan.blocks.map((b) => `${b.title} ${minutes(b.minutes)}`).join(', ')}`}>
        <PanelHead title={app.common.nav.plans} aside={<span className="label mb-0">{minutes(plan.total)}</span>} />
        <div className="grid gap-2 sm:grid-cols-[15fr_20fr_30fr]">
          {plan.blocks.map((block, i) => (
            <Reveal key={block.kind} delay={stagger(i, 90, 150)} className="min-h-[120px] rounded-xl border border-line bg-surface-2 p-3 text-sm">
              <b className="mb-2 block">
                {block.title} · {minutes(block.minutes)}
              </b>
              <div className="flex flex-wrap gap-1">
                {block.chips.map((chip) => (
                  <span key={chip} className="chip">
                    {chip}
                  </span>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </Panel>
    </Feature>
  );
}

function Field({ label, children, full }: { label: string; children: ReactNode; full?: boolean }) {
  return (
    <div className={`rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm ${full ? 'sm:col-span-2' : ''}`}>
      <span className="label mb-0.5 text-[11px]">{label}</span>
      {children}
    </div>
  );
}

function Journal() {
  const { lang, copy, app } = useLanding();
  const text = copy.features.journal;
  const { journal } = app;
  const names = (ids: string[]) => ids.map((id) => techniqueName(id, lang)).join(', ');
  return (
    <Feature id="f4" num="04" kicker={app.common.nav.journal} title={text.title} text={text.text} flip>
      <Panel label={journal.title}>
        <PanelHead title={journal.title} aside={<span className="chip">{app.common.modes.gi}</span>} />
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label={journal.form.duration}>{EXAMPLE.journal.minutes}</Field>
          <Field label={journal.detail.plan}>{app.common.positions.closed_guard}</Field>
          <Field label={journal.detail.physical}>
            {EXAMPLE.journal.physical} / 10
            <Meter value={EXAMPLE.journal.physical} />
          </Field>
          <Field label={journal.detail.technical}>
            {EXAMPLE.journal.technical} / 10
            <Meter value={EXAMPLE.journal.technical} />
          </Field>
          <Field label={journal.detail.achieved}>{names(EXAMPLE.journal.achieved)}</Field>
          <Field label={journal.detail.suffered}>{names(EXAMPLE.journal.suffered)}</Field>
          <Field label={journal.detail.notes} full>
            {text.notes}
          </Field>
        </div>
      </Panel>
    </Feature>
  );
}

interface Score {
  points: number;
  advantages: number;
  penalties: number;
}

function Sparring() {
  const { copy, app } = useLanding();
  const text = copy.features.sparring;
  const { sparring } = app;
  const { match } = EXAMPLE;
  const side = (name: string, score: Score, lead: boolean) => (
    <div className={`rounded-xl border bg-surface-2 p-3.5 ${lead ? 'border-accent' : 'border-line'}`}>
      <small className="label">{name}</small>
      <div className={`font-display text-[44px] leading-none ${lead ? 'text-accent' : ''}`}>{score.points}</div>
      <small className="text-muted">
        {fmt(text.summary, {
          advantages: sparring.match.advantages,
          a: score.advantages,
          penalties: sparring.match.penalties,
          p: score.penalties,
        })}
      </small>
    </div>
  );
  return (
    <Feature id="f5" num="05" kicker={app.common.nav.sparring} title={text.title} text={text.text}>
      <Panel label={`${sparring.title}: ${match.time}, ${match.you.points} - ${match.rival.points}`}>
        <p className="font-display mt-1 mb-3 text-center text-[44px] tabular-nums sm:text-[52px]">{match.time}</p>
        <div className="grid grid-cols-2 gap-2">
          {side(text.you, match.you, true)}
          {side(text.rival, match.rival, false)}
        </div>
        <div className="mt-3 grid grid-cols-5 gap-1.5" role="group" aria-label={sparring.setup.belt}>
          {roundMinutes().map(({ belt, minutes }) => (
            <span
              key={belt}
              className="rounded-[10px] border border-t-[3px] border-line bg-surface-2 py-2 text-center text-xs"
              style={{ borderTopColor: BELT_COLOR[belt] }}
            >
              <b className="block text-[15px]">{minutes}</b>
              {app.common.belts[belt]}
            </span>
          ))}
        </div>
      </Panel>
    </Feature>
  );
}

export function Features() {
  const { copy } = useLanding();
  const text = copy.features;
  return (
    <section id="funciones" aria-labelledby="features-title" className={`border-t border-line pt-24 pb-10 ${SECTION_X}`}>
      <header className="mb-14 grid items-end gap-6 md:grid-cols-2 md:gap-16">
        <Reveal>
          <span className="label">{text.eyebrow}</span>
          <h2 id="features-title" className="font-display mt-3 text-[34px] leading-[1.05] tracking-[-0.02em] md:text-5xl">
            {text.title}
          </h2>
        </Reveal>
        <Reveal as="p" delay={120} className="text-lg text-muted">
          {text.intro}
        </Reveal>
      </header>
      <Library />
      <Legality />
      <Plans />
      <Journal />
      <Sparring />
      <Progress />
    </section>
  );
}
