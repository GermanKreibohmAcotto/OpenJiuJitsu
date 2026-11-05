import { NavLink } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from '../../components/Icon';

const TABS: { to: string; key: 'match' | 'timer'; icon: IconName; end: boolean }[] = [
  { to: '/sparring', key: 'match', icon: 'swords', end: true },
  { to: '/sparring/timer', key: 'timer', icon: 'timer', end: false },
];

/** Sibling modes of the sparring section: a scored match or the bare round timer. */
export function SparringTabs() {
  const { t } = useTranslation('sparring');
  return (
    <nav aria-label={t('tabs.label')} className="mb-4 flex gap-1 border-b border-line">
      {TABS.map(({ to, key, icon, end }) => (
        <NavLink
          key={key}
          to={to}
          end={end}
          className={({ isActive }) =>
            `-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold ${
              isActive ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-zinc-100'
            }`
          }
        >
          <Icon name={icon} className="text-xl" />
          {t(`tabs.${key}`)}
        </NavLink>
      ))}
    </nav>
  );
}
