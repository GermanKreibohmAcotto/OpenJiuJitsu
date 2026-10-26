import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Lang, Mode, ModeFilter } from '../domain/types';
import { isLang, setLang } from '../i18n';

const MODE_KEY = 'ojj.mode';

interface Settings {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Global GI/NoGI filter applied to library lists and pickers. */
  modeFilter: ModeFilter;
  setModeFilter: (mode: ModeFilter) => void;
  /** Mode used as default for new plans, sessions and matches. */
  defaultMode: Mode;
}

const SettingsContext = createContext<Settings | null>(null);

function readMode(): ModeFilter {
  const stored = localStorage.getItem(MODE_KEY);
  return stored === 'gi' || stored === 'nogi' ? stored : 'all';
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [modeFilter, setModeState] = useState<ModeFilter>(readMode);

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
      defaultMode: modeFilter === 'nogi' ? 'nogi' : 'gi',
    }),
    [i18n.language, modeFilter, setModeFilter],
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
