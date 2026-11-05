import type { ReactNode } from 'react';
import { Icon, type IconName } from '../components/Icon';
import type { Lang } from '../domain/types';
import { useLanding } from './context';
import { BELT_COLOR, BELT_TIP, EXAMPLE, STRIPE_COLOR, fmt } from './landingData';
import { APP_URL, BTN, GITHUB_URL, Logo, SECTION_X } from './ui';

const LANG_OPTIONS: { lang: Lang; label: string }[] = [
  { lang: 'es', label: 'ES' },
  { lang: 'en', label: 'EN' },
];

function LanguageToggle({ onChange }: { onChange: (lang: Lang) => void }) {
  const { lang, copy } = useLanding();
  return (
    <div role="group" aria-label={copy.header.language} className="flex gap-1">
      {LANG_OPTIONS.map((option) => (
        <button
          key={option.lang}
          type="button"
          lang={option.lang}
          aria-pressed={lang === option.lang}
          onClick={() => onChange(option.lang)}
          className={`chip cursor-pointer ${lang === option.lang ? 'chip-active' : ''}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function PhoneCard({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-line bg-surface px-3.5 py-3">{children}</div>;
}

function PhoneSmall({ children }: { children: ReactNode }) {
  return <small className="block text-xs text-muted">{children}</small>;
}

const TABS: { key: 'library' | 'plans' | 'home' | 'journal' | 'sparring'; icon: IconName }[] = [
  { key: 'library', icon: 'menu_book' },
  { key: 'plans', icon: 'list_alt' },
  { key: 'home', icon: 'home' },
  { key: 'journal', icon: 'edit_note' },
  { key: 'sparring', icon: 'timer' },
];

/** The real Home screen of the app, filled with example values. */
function PhoneMock() {
  const { app, copy } = useLanding();
  const { common, home } = app;
  const beltLine = `${common.belts[EXAMPLE.belt]} · ${fmt(common.stripes_other, { count: EXAMPLE.stripes })}`;
  const hoursLine = fmt(home.hoursValue, { value: EXAMPLE.hours });
  const sessionsLine = fmt(home.sessions, { count: EXAMPLE.sessions });
  const goalLine = `${fmt(home.goal.progress, { count: EXAMPLE.goalDone, goal: EXAMPLE.goalTarget })} · ${fmt(home.goal.current_other, { count: EXAMPLE.streakWeeks })}`;
  const lastLine = fmt(home.last.summary, { date: copy.phone.date, mode: common.modes.gi, minutes: EXAMPLE.lastMinutes });
  const lastDetails = fmt(home.last.details, {
    rounds: EXAMPLE.lastRounds,
    achieved: EXAMPLE.lastAchieved,
    suffered: EXAMPLE.lastSuffered,
  });
  const label = [home.title, beltLine, `${home.hours}: ${hoursLine}`, sessionsLine, goalLine, lastLine, lastDetails].join('. ');
  const quick = [home.actions.journal, home.actions.sparring, home.actions.plan, home.actions.library];

  return (
    <div
      role="img"
      aria-label={label}
      className="relative w-[min(340px,calc(100%-2rem))] rounded-[44px] border-10 border-line bg-bg px-4 pt-[18px] shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
    >
      <div className="flex items-center justify-between border-b border-line pb-3">
        <Logo className="text-[15px]" />
        <span className="label mb-0">{home.title}</span>
      </div>
      <div className="grid gap-2.5 py-3.5">
        <PhoneCard>
          <PhoneSmall>{home.belt}</PhoneSmall>
          <h3 className="text-sm font-semibold">{beltLine}</h3>
          <div className="mt-2 flex h-[18px] justify-end rounded-[4px]" style={{ background: BELT_COLOR[EXAMPLE.belt] }}>
            <span className="flex w-14 justify-center gap-[5px]" style={{ background: BELT_TIP }}>
              {Array.from({ length: EXAMPLE.stripes }, (_, i) => (
                <i key={i} className="w-[5px]" style={{ background: STRIPE_COLOR }} />
              ))}
            </span>
          </div>
        </PhoneCard>
        <PhoneCard>
          <PhoneSmall>{home.hours}</PhoneSmall>
          <span className="font-display text-[22px] text-accent">{hoursLine}</span>
          <PhoneSmall>{sessionsLine}</PhoneSmall>
        </PhoneCard>
        <PhoneCard>
          <h3 className="text-sm font-semibold">{home.goal.title}</h3>
          <PhoneSmall>{home.goal.label}</PhoneSmall>
          <div className="my-2 mb-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
            <i className="block h-full bg-accent" style={{ width: `${Math.round((EXAMPLE.goalDone / EXAMPLE.goalTarget) * 100)}%` }} />
          </div>
          <PhoneSmall>{goalLine}</PhoneSmall>
        </PhoneCard>
        <PhoneCard>
          <h3 className="text-sm font-semibold">{home.last.title}</h3>
          <PhoneSmall>{lastLine}</PhoneSmall>
          <PhoneSmall>{lastDetails}</PhoneSmall>
        </PhoneCard>
        <PhoneCard>
          <h3 className="text-sm font-semibold">{home.actions.title}</h3>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {quick.map((text) => (
              <span key={text} className="rounded-[10px] border border-line bg-surface-2 py-1.5 text-center text-[11px]">
                {text}
              </span>
            ))}
          </div>
        </PhoneCard>
      </div>
      <div className="grid grid-cols-5 items-end border-t border-line pt-2 pb-3.5 text-center text-[10px] text-muted">
        {TABS.map((tab) =>
          tab.key === 'home' ? (
            <span key={tab.key} className="flex flex-col items-center text-accent">
              <span className="-mt-[22px] mb-0.5 grid size-[46px] place-items-center rounded-full border-4 border-bg bg-accent text-xl text-accent-ink">
                <Icon name={tab.icon} />
              </span>
              {common.nav[tab.key]}
            </span>
          ) : (
            <span key={tab.key} className="flex flex-col items-center gap-0.5">
              <Icon name={tab.icon} className="text-base" />
              {common.nav[tab.key]}
            </span>
          ),
        )}
      </div>
    </div>
  );
}

export function Hero({ onLangChange }: { onLangChange: (lang: Lang) => void }) {
  const { copy } = useLanding();
  const { hero, header } = copy;
  return (
    <div className="grid md:min-h-[900px] md:grid-cols-2">
      <section aria-labelledby="hero-title" className={`flex flex-col py-10 ${SECTION_X}`}>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <Logo className="text-[22px]" />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <nav aria-label={header.navLabel} className="flex gap-6 text-[15px] text-muted">
              <a href="#funciones" className="hover:text-zinc-100">
                {header.features}
              </a>
              <a href="#faq" className="hover:text-zinc-100">
                {header.faq}
              </a>
              <a href={GITHUB_URL} className="hover:text-zinc-100">
                {header.github}
              </a>
            </nav>
            <LanguageToggle onChange={onLangChange} />
          </div>
        </div>
        <div className="my-14 md:my-auto">
          <span className="label">{hero.eyebrow}</span>
          <h1 id="hero-title" className="font-display mt-4 mb-5 text-[40px] leading-[1.02] tracking-[-0.03em] sm:text-[52px] lg:text-[64px]">
            {hero.titleLead} <em className="text-accent not-italic">{hero.titleAccent}</em>
          </h1>
          <p className="mb-8 max-w-[520px] text-[19px] text-zinc-300">{hero.lead}</p>
          <div className="flex flex-wrap gap-3">
            <a className={`${BTN} btn-primary`} href={APP_URL}>
              {hero.openApp}
            </a>
            <a className={BTN} href="#funciones">
              {hero.seeMore}
            </a>
          </div>
          <ul className="mt-10 grid gap-3 sm:grid-cols-3">
            {hero.guarantees.map((item) => (
              <li key={item.title} className="border-t-2 border-accent pt-3 text-sm text-muted">
                <b className="block text-base font-semibold text-zinc-100">{item.title}</b>
                {item.text}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex gap-4 text-[13px] text-muted">
          <span>{hero.license}</span>
          <span>{hero.languages}</span>
        </div>
      </section>
      <div className="relative grid place-items-center overflow-hidden border-t border-line bg-surface py-16 md:border-t-0 md:border-l md:py-0">
        <div
          aria-hidden="true"
          className="absolute size-[560px] rounded-full"
          style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--color-accent) 14%, transparent), transparent 70%)' }}
        />
        <PhoneMock />
      </div>
    </div>
  );
}
