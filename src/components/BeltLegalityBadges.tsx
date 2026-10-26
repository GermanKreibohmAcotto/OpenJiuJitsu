import { useTranslation } from 'react-i18next';
import { BELT_COLORS } from '../domain/belts';
import { MODES, type BeltLegality, type Mode } from '../domain/types';

function legalityText(t: (key: string, opts?: Record<string, unknown>) => string, legality: BeltLegality, mode: Mode) {
  const min = legality[mode];
  if (min === null) return t('legality.notAllowed');
  if (min === 'white') return t('legality.allBelts');
  return t('legality.from', { belt: t(`belts.${min}`) });
}

/** "GI: Brown and up · NoGI: Brown and up" chips for a submission. */
export function BeltLegalityBadges({ legality, modes = [...MODES] }: { legality?: BeltLegality; modes?: Mode[] }) {
  const { t } = useTranslation();
  if (!legality) return null;
  return (
    <span className="inline-flex flex-wrap gap-1" aria-label={t('legality.title')}>
      {modes.map((mode) => {
        const min = legality[mode];
        return (
          <span key={mode} className={`chip ${min === null ? 'border-danger/40 text-danger' : ''}`}>
            {min && (
              <span
                aria-hidden
                className="h-2.5 w-2.5 rounded-full border border-white/30"
                style={{ backgroundColor: BELT_COLORS[min] }}
              />
            )}
            <span className="font-semibold">{t(`modes.${mode}`)}:</span> {legalityText(t, legality, mode)}
          </span>
        );
      })}
    </span>
  );
}
