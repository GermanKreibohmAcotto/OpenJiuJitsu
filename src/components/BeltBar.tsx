import { useTranslation } from 'react-i18next';
import { BELT_COLORS, MAX_STRIPES } from '../domain/belts';
import type { Belt } from '../domain/types';

interface BeltBarProps {
  belt: Belt;
  stripes?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const HEIGHT = { sm: 'h-3', md: 'h-6', lg: 'h-10' } as const;

/** Visual belt: colored band with the rank bar and stripes (red bar for black belt). */
export function BeltBar({ belt, stripes = 0, size = 'md', className = '' }: BeltBarProps) {
  const { t } = useTranslation();
  const shown = Math.max(0, Math.min(stripes, MAX_STRIPES[belt]));
  const label = `${t(`belts.${belt}`)} · ${t('stripes', { count: shown })}`;

  return (
    <div
      role="img"
      aria-label={label}
      title={label}
      className={`relative flex w-full overflow-hidden rounded-md border border-black/40 ${HEIGHT[size]} ${className}`}
      style={{ backgroundColor: BELT_COLORS[belt] }}
    >
      <div
        className="absolute inset-y-0 right-[12%] flex w-[22%] items-stretch justify-start gap-[6%] px-[3%]"
        style={{ backgroundColor: belt === 'black' ? '#dc2626' : '#0a0a0a' }}
      >
        {Array.from({ length: shown }, (_, i) => (
          <span key={i} className="block w-[10%] bg-white" />
        ))}
      </div>
    </div>
  );
}
