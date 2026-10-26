import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import { LANGS, type Lang, type LocalizedText } from '../domain/types';
import es from './locales/es';
import en from './locales/en';

export const DEFAULT_LANG: Lang = 'es';
const LANG_KEY = 'ojj.lang';

type Resources = Record<string, Record<string, unknown>>;

/**
 * Each feature owns its strings in `src/features/<feature>/locales/<lang>.ts`
 * (default export). They are registered as the `<feature>` namespace.
 */
function featureResources(): Record<Lang, Resources> {
  const modules = import.meta.glob<Record<string, unknown>>('../features/*/locales/*.ts', {
    eager: true,
    import: 'default',
  });
  const resources: Record<Lang, Resources> = { es: {}, en: {} };
  for (const [path, strings] of Object.entries(modules)) {
    const match = path.match(/features\/([^/]+)\/locales\/([^/]+)\.ts$/);
    if (!match) continue;
    const [, feature, lang] = match;
    if ((LANGS as readonly string[]).includes(lang)) resources[lang as Lang][feature] = strings;
  }
  return resources;
}

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value);
}

export function initialLang(): Lang {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(LANG_KEY) : null;
  if (isLang(stored)) return stored;
  const browser = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : '';
  return browser === 'en' ? 'en' : DEFAULT_LANG;
}

export function setLang(lang: Lang) {
  localStorage.setItem(LANG_KEY, lang);
  document.documentElement.lang = lang;
  return i18n.changeLanguage(lang);
}

const features = featureResources();

void i18n.use(initReactI18next).init({
  resources: {
    es: { common: es, ...features.es },
    en: { common: en, ...features.en },
  },
  lng: initialLang(),
  fallbackLng: DEFAULT_LANG,
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  returnNull: false,
});

/** Picks the active language, falling back to any filled language. */
export function localize(text: LocalizedText | undefined, lang: string): string {
  if (!text) return '';
  return text[lang as Lang] || text[DEFAULT_LANG] || Object.values(text).find(Boolean) || '';
}

/** Hook returning a `localize` bound to the active language. */
export function useLocalize() {
  const { i18n: instance } = useTranslation();
  return (text: LocalizedText | undefined) => localize(text, instance.language);
}

/** Writes `value` into the active language of a localized text, keeping the others. */
export function withLocalized(text: LocalizedText | undefined, lang: string, value: string): LocalizedText {
  return { ...text, [isLang(lang) ? lang : DEFAULT_LANG]: value };
}

export default i18n;
