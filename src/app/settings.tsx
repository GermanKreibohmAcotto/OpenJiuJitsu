import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { getProfile } from '../db/profile';
import { isBelt } from '../domain/belts';
import type { Belt, Lang, Mode, ModeFilter } from '../domain/types';
import { isLang, setLang } from '../i18n';
import { BELT_ACCENTS, DEFAULT_ACCENT, applyAccent, isHexColor } from './accent';

const MODE_KEY = 'ojj.mode';
const ACCENT_KEY = 'ojj.accent';
const ACCENT_SOURCE_KEY = 'ojj.accentSource';
const BELT_KEY = 'ojj.belt';

export type AccentSource = 'manual' | 'belt';

interface Settings {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Global GI/NoGI filter applied to library lists and pickers. */
  modeFilter: ModeFilter;
  setModeFilter: (mode: ModeFilter) => void;
  /** Main interface color in use, as #rrggbb. */
  accent: string;
  /** Whether the color is picked by hand or follows the belt in the profile. */
  accentSource: AccentSource;
  /** Picks a color by hand (and stops following the belt). */
  setAccent: (hex: string) => void;
  setAccentSource: (source: AccentSource) => void;
  /** Accent the current belt maps to. */
  beltAccent: string;
  /** Mode used as default for new plans, sessions and matches. */
  defaultMode: Mode;
}

const SettingsContext = createContext<Settings | null>(null);

function readMode(): ModeFilter {
  const stored = localStorage.getItem(MODE_KEY);
  return stored === 'gi' || stored === 'nogi' ? stored : 'all';
}

function readAccent(): string {
  const stored = localStorage.getItem(ACCENT_KEY);
  return isHexColor(stored) ? stored : DEFAULT_ACCENT;
}

function readAccentSource(): AccentSource {
  return localStorage.getItem(ACCENT_SOURCE_KEY) === 'belt' ? 'belt' : 'manual';
}

function readBelt(): Belt {
  const stored = localStorage.getItem(BELT_KEY);
  return isBelt(stored) ? stored : 'white';
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [modeFilter, setModeState] = useState<ModeFilter>(readMode);
  const [manualAccent, setManualAccent] = useState<string>(readAccent);
  const [accentSource, setSourceState] = useState<AccentSource>(readAccentSource);
  const profile = useLiveQuery(getProfile, []);
  // The last known belt keeps the first paint right before the profile has loaded.
  const belt: Belt = profile?.belt ?? readBelt();
  const beltAccent = BELT_ACCENTS[belt];
  const accent = accentSource === 'belt' ? beltAccent : manualAccent;

  useLayoutEffect(() => applyAccent(accent), [accent]);
  useEffect(() => {
    if (profile) localStorage.setItem(BELT_KEY, profile.belt);
  }, [profile]);

  const setAccentSource = useCallback((source: AccentSource) => {
    localStorage.setItem(ACCENT_SOURCE_KEY, source);
    setSourceState(source);
  }, []);

  const setAccent = useCallback(
    (hex: string) => {
      if (!isHexColor(hex)) return;
      localStorage.setItem(ACCENT_KEY, hex);
      setManualAccent(hex);
      setAccentSource('manual');
    },
    [setAccentSource],
  );

  const setModeFilter = useCallback((mode: ModeFilter) => {
    localStorage.setItem(MODE_KEY, mode);
    setModeState(mode);
  }, []);

  const value = useMemo<Settings>(
    () => ({
      lang: isLang(i18n.language) ? i18n.language : 'es',
      setLang: (lang) => void setLang(lang),
      modeFilter,
      setModeFilter,
      accent,
      accentSource,
      setAccent,
      setAccentSource,
      beltAccent,
      defaultMode: modeFilter === 'nogi' ? 'nogi' : 'gi',
    }),
    [i18n.language, modeFilter, setModeFilter, accent, accentSource, setAccent, setAccentSource, beltAccent],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Settings {
  const settings = useContext(SettingsContext);
  if (!settings) throw new Error('useSettings must be used inside SettingsProvider');
  return settings;
}

/** True when a technique with `modes` passes the global filter. */
export function matchesModeFilter(modes: Mode[], filter: ModeFilter): boolean {
  return filter === 'all' || modes.includes(filter);
}
