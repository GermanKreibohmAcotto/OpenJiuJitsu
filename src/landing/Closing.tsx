import { useLanding } from './context';
import { BELT_COLOR, BELT_TIP, STRIPE_COLOR, TECHNIQUE_COUNT, fmt } from './landingData';
import { BELTS } from '../domain/types';
import { APP_URL, BTN, GITHUB_URL, Logo, SECTION_MX, SECTION_X } from './ui';

export function Faq() {
  const { copy } = useLanding();
  const { faq } = copy;
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className={`mt-24 grid gap-8 border-t border-line py-16 md:grid-cols-[1fr_2fr] md:gap-16 md:py-[72px] ${SECTION_X}`}
    >
      <div>
        <span className="label">{faq.eyebrow}</span>
        <h2 id="faq-title" className="font-display mt-2 text-[26px] leading-[1.1] md:text-[32px]">
          {faq.title}
        </h2>
      </div>
      <div className="grid gap-2.5">
        {faq.items.map((item, i) => (
          <details key={item.question} open={i === 0} className="rounded-2xl border border-line bg-surface px-5 py-4">
            <summary className="cursor-pointer font-semibold">{item.question}</summary>
            <p className="mt-2.5 text-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function Closing() {
  const { copy, app } = useLanding();
  const { closing } = copy;
  const stripeBelts = BELTS.filter((belt) => belt !== 'black');
  return (
    <section aria-labelledby="closing-title" className={`overflow-hidden rounded-3xl bg-accent text-accent-ink ${SECTION_MX}`}>
      <div className="grid items-center gap-10 px-6 pt-12 pb-12 md:grid-cols-[1.1fr_1fr] md:gap-16 md:px-16 md:pt-[72px] md:pb-16">
        <div>
          <span className="text-xs font-semibold tracking-wide uppercase">{closing.eyebrow}</span>
          <h2 id="closing-title" className="font-display mt-4 mb-5 text-[38px] leading-none tracking-[-0.03em] md:text-[60px]">
            {closing.title}
          </h2>
          <p className="mb-8 max-w-[520px] text-[19px]">{fmt(closing.text, { count: TECHNIQUE_COUNT })}</p>
          <div className="flex flex-wrap gap-3">
            <a className={`${BTN} border-bg bg-bg text-zinc-100 hover:border-bg hover:brightness-125`} href={APP_URL}>
              {closing.openApp}
            </a>
            <a className={`${BTN} border-2 border-accent-ink bg-transparent text-accent-ink hover:border-accent-ink`} href={GITHUB_URL}>
              {closing.code}
            </a>
          </div>
        </div>
        <ol aria-label={closing.stepsLabel} className="grid gap-3">
          {closing.steps.map((step, i) => (
            <li key={step.title} className="grid grid-cols-[48px_1fr] items-center gap-4 rounded-2xl bg-bg px-5 py-4 text-zinc-100">
              <span className="font-display grid size-12 place-items-center rounded-xl bg-accent text-[22px] text-accent-ink">{i + 1}</span>
              <span>
                <b className="block text-[17px]">{step.title}</b>
                <small className="text-sm text-muted">{fmt(step.text, { profile: app.common.nav.profile })}</small>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div aria-hidden="true" className="grid h-7 grid-cols-[1fr_1fr_1fr_1fr_120px] md:grid-cols-[1fr_1fr_1fr_1fr_180px]">
        {stripeBelts.map((belt) => (
          <div key={belt} style={{ background: BELT_COLOR[belt] }} />
        ))}
        <div className="flex gap-2.5 pl-6 md:pl-8" style={{ background: BELT_TIP }}>
          {[0, 1, 2, 3].map((i) => (
            <i key={i} className="w-2.5" style={{ background: STRIPE_COLOR }} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  const { copy } = useLanding();
  const { header, footer } = copy;
  return (
    <footer className={`flex flex-wrap items-center justify-between gap-6 py-8 pb-12 text-sm text-muted ${SECTION_MX}`}>
      <Logo className="text-lg text-zinc-100" />
      <nav aria-label={footer.navLabel} className="flex gap-6">
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
      <span>{footer.license}</span>
    </footer>
  );
}
