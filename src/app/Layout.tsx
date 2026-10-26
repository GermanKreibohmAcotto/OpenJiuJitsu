import { NavLink, Outlet } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ModeToggle } from '../components/ModeToggle';
import { useSettings } from './settings';

const NAV = [
  { to: '/library', key: 'library', icon: '📖' },
  { to: '/plans', key: 'plans', icon: '🗂️' },
  { to: '/journal', key: 'journal', icon: '📝' },
  { to: '/sparring', key: 'sparring', icon: '⏱️' },
  { to: '/profile', key: 'profile', icon: '🥋' },
] as const;

export function Layout() {
  const { t } = useTranslation();
  const { modeFilter, setModeFilter } = useSettings();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] font-medium md:flex-row md:gap-3 md:text-sm ${
      isActive ? 'text-accent md:bg-accent/10' : 'text-muted hover:text-zinc-100'
    }`;

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden w-60 shrink-0 flex-col gap-1 border-r border-line p-4 md:flex">
        <NavLink to="/" className="mb-6 px-3 text-lg font-extrabold tracking-tight">
          Open<span className="text-accent">JiuJitsu</span>
        </NavLink>
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClass}>
            <span aria-hidden>{item.icon}</span>
            {t(`nav.${item.key}`)}
          </NavLink>
        ))}
        <NavLink to="/settings" className={(s) => `${linkClass(s)} mt-auto`}>
          <span aria-hidden>⚙️</span>
          {t('nav.settings')}
        </NavLink>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur">
          <NavLink to="/" className="text-base font-extrabold tracking-tight md:invisible">
            Open<span className="text-accent">JiuJitsu</span>
          </NavLink>
          <div className="flex items-center gap-2">
            <ModeToggle value={modeFilter} onChange={setModeFilter} allowAll />
            <NavLink to="/settings" aria-label={t('nav.settings')} className="btn btn-ghost px-2 md:hidden">
              ⚙️
            </NavLink>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-5 pb-28 md:pb-10">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t border-line bg-bg/95 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClass}>
            <span aria-hidden className="text-lg">
              {item.icon}
            </span>
            {t(`nav.${item.key}`)}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
