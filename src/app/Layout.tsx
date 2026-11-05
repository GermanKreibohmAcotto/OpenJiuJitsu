import { Suspense } from 'react';
import { NavLink, Outlet } from 'react-router';
import { useTranslation } from 'react-i18next';
import { isDemoMode } from '../dev/demoMode';
import { Icon } from '../components/Icon';

/** Sections of the desktop sidebar. */
const NAV = [
  { to: '/library', key: 'library', icon: 'menu_book' },
  { to: '/plans', key: 'plans', icon: 'list_alt' },
  { to: '/journal', key: 'journal', icon: 'edit_note' },
  { to: '/sparring', key: 'sparring', icon: 'timer' },
  { to: '/analytics', key: 'analytics', icon: 'bar_chart' },
  { to: '/injuries', key: 'injuries', icon: 'healing' },
  { to: '/profile', key: 'profile', icon: 'person' },
] as const;

/** Icon links in the header, for phones. */
const HEADER_LINKS = [
  { key: 'analytics', icon: 'bar_chart' },
  { key: 'injuries', icon: 'healing' },
  { key: 'profile', icon: 'person' },
] as const;

/**
 * Bottom bar on phones: exactly five buttons, with Home in the middle as the primary one.
 * Analytics, Injuries and Profile stay one tap away from the header.
 */
const TAB_BAR = [
  { to: '/library', key: 'library', icon: 'menu_book' },
  { to: '/plans', key: 'plans', icon: 'list_alt' },
  { to: '/', key: 'home', icon: 'home', primary: true },
  { to: '/journal', key: 'journal', icon: 'edit_note' },
  { to: '/sparring', key: 'sparring', icon: 'timer' },
] as const;

export function Layout() {
  const { t } = useTranslation();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] font-medium md:flex-row md:gap-3 md:text-sm ${
      isActive ? 'text-accent md:bg-accent/10' : 'text-muted hover:text-zinc-100'
    }`;

  const headerIconClass = ({ isActive }: { isActive: boolean }) =>
    `btn btn-ghost px-2 md:hidden ${isActive ? 'text-accent' : ''}`;

  const tabClass = (primary: boolean) => ({ isActive }: { isActive: boolean }) =>
    `flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-0.5 py-1.5 text-[10px] leading-tight max-[340px]:text-[9px] ${
      primary ? '-mt-6' : ''
    } ${isActive ? 'text-accent' : 'text-muted hover:text-zinc-100'}`;

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden w-60 shrink-0 flex-col gap-1 border-r border-line p-4 md:flex">
        <NavLink to="/" className="mb-6 px-3 font-display text-lg tracking-tight">
          Open<span className="text-accent">JiuJitsu</span>
        </NavLink>
        <NavLink to="/" end className={linkClass}>
          <Icon name="home" className="text-xl" />
          {t('nav.home')}
        </NavLink>
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClass}>
            <Icon name={item.icon} className="text-xl" />
            {t(`nav.${item.key}`)}
          </NavLink>
        ))}
        <NavLink to="/settings" className={(s) => `${linkClass(s)} mt-auto`}>
          <Icon name="settings" className="text-xl" />
          {t('nav.settings')}
        </NavLink>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {isDemoMode() && (
          <div role="status" className="bg-accent px-4 py-1 text-center text-xs font-semibold text-accent-ink">
            {t('demoBanner')}
          </div>
        )}
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur">
          <NavLink to="/" className="font-display text-base tracking-tight md:invisible">
            Open<span className="text-accent">JiuJitsu</span>
          </NavLink>
          <div className="flex items-center gap-2">
            {HEADER_LINKS.map((item) => (
              <NavLink key={item.key} to={`/${item.key}`} aria-label={t(`nav.${item.key}`)} className={headerIconClass}>
                <Icon name={item.icon} className="text-xl" />
              </NavLink>
            ))}
            <NavLink to="/settings" aria-label={t('nav.settings')} className={headerIconClass}>
              <Icon name="settings" className="text-xl" />
            </NavLink>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-5 pb-28 md:pb-10">
          <Suspense fallback={<p className="text-sm text-muted">…</p>}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-5 items-end border-t border-line bg-bg/95 px-1 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
        {TAB_BAR.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className={tabClass('primary' in item)}>
            {'primary' in item ? (
              <span className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-bg bg-accent text-[1.75rem] text-accent-ink shadow-lg">
                <Icon name={item.icon} />
              </span>
            ) : (
              <Icon name={item.icon} className="text-2xl" />
            )}
            <span className="max-w-full truncate">{t(`nav.${item.key}`)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
