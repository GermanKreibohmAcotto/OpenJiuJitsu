import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { Lang } from '../domain/types';
import { LANG_KEY, initialLang } from '../i18n/lang';
import { Closing, Faq, SiteFooter } from './Closing';
import { LandingContext, type LandingView } from './context';
import { Features } from './Features';
import { Hero } from './Hero';
import { appStrings } from './landingData';
import en from './locales/en';
import es from './locales/es';

const COPY = { es, en } as const;

/** The landing is red on dark ink; the app keeps its own lime accent. */
export const LANDING_THEME = { '--color-accent': '#ef4444', '--color-accent-ink': '#0b0d10' } as CSSProperties;

export function Landing() {
  const [lang, setLang] = useState<Lang>(initialLang);
  const view = useMemo<LandingView>(() => ({ lang, copy: COPY[lang], app: appStrings(lang) }), [lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = COPY[lang].meta.title;
  }, [lang]);

  // Same key as the app, so the choice carries over when opening it.
  const changeLang = (next: Lang) => {
    localStorage.setItem(LANG_KEY, next);
    setLang(next);
  };

  return (
    <LandingContext.Provider value={view}>
      <div id="top" style={LANDING_THEME} className="min-h-screen bg-bg text-zinc-100">
        <main>
          <Hero onLangChange={changeLang} />
          <Features />
          <Faq />
          <Closing />
        </main>
        <SiteFooter />
      </div>
    </LandingContext.Provider>
  );
}
