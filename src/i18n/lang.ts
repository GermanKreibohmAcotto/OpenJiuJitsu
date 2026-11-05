import { LANGS, type Lang } from '../domain/types';

/**
 * Pure language helpers, free of i18next, so pages that do not load the app
 * (the landing) can share the stored language with it.
 */
export const DEFAULT_LANG: Lang = 'es';
export const LANG_KEY = 'ojj.lang';

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value);
}

export function initialLang(): Lang {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(LANG_KEY) : null;
  if (isLang(stored)) return stored;
  const browser = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : '';
  return browser === 'en' ? 'en' : DEFAULT_LANG;
}
