import { ICON_PATHS, type IconName } from './iconPaths';

export type { IconName };

/**
 * A Material Symbols icon. Decorative by default: the surrounding control carries the accessible name.
 * Size follows the font size (1em) and color follows `currentColor`.
 */
export function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 -960 960 960"
      width="1em"
      height="1em"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      data-icon={name}
      className={`inline-block shrink-0 ${className}`}
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}
