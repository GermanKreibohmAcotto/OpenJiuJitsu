import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../app/settings';
import { ModeToggle } from '../../components/ModeToggle';
import { BELTS, type Mode } from '../../domain/types';
import { BELT_ROUND_MINUTES, type TimerConfig } from './timer';

export interface MatchConfig extends TimerConfig {
  names: [string, string];
  mode: Mode;
}

const CUSTOM = 'custom';

function clampInt(value: string, min: number, fallback: number): number {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n >= min ? n : fallback;
}

export function SetupForm({ onStart }: { onStart: (config: MatchConfig) => void }) {
  const { t } = useTranslation('sparring');
  const { t: tc } = useTranslation();
  const { defaultMode } = useSettings();
  const [names, setNames] = useState<[string, string]>([t('defaults.you'), t('defaults.partner')]);
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [preset, setPreset] = useState<string>('white');
  const [customMin, setCustomMin] = useState('5');
  const [rounds, setRounds] = useState('1');
  const [rest, setRest] = useState('30');

  const minutes = preset === CUSTOM ? clampInt(customMin, 1, 5) : BELT_ROUND_MINUTES[preset as keyof typeof BELT_ROUND_MINUTES];

  const setName = (index: 0 | 1, value: string) =>
    setNames((current) => (index === 0 ? [value, current[1]] : [current[0], value]));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    onStart({
      names: [names[0].trim() || t('defaults.you'), names[1].trim() || t('defaults.partner')],
      mode,
      roundSec: minutes * 60,
      rounds: clampInt(rounds, 1, 1),
      restSec: clampInt(rest, 0, 0),
    });
  };

  return (
    <form onSubmit={submit} className="card flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {([0, 1] as const).map((i) => (
          <div key={i}>
            <label className="label" htmlFor={`athlete-${i}`}>
              {t('setup.athlete', { n: i + 1 })}
            </label>
            <input id={`athlete-${i}`} className="input" value={names[i]} onChange={(e) => setName(i, e.target.value)} />
          </div>
        ))}
      </div>
      <div>
        <span className="label">{t('setup.mode')}</span>
        <ModeToggle value={mode} onChange={setMode} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="belt-preset">
            {t('setup.belt')}
          </label>
          <select id="belt-preset" className="input" value={preset} onChange={(e) => setPreset(e.target.value)}>
            {BELTS.map((belt) => (
              <option key={belt} value={belt}>
                {t('setup.beltOption', { belt: tc(`belts.${belt}`), minutes: BELT_ROUND_MINUTES[belt] })}
              </option>
            ))}
            <option value={CUSTOM}>{t('setup.custom')}</option>
          </select>
        </div>
        {preset === CUSTOM && (
          <div>
            <label className="label" htmlFor="custom-minutes">
              {t('setup.customMinutes')}
            </label>
            <input id="custom-minutes" className="input" type="number" min={1} value={customMin} onChange={(e) => setCustomMin(e.target.value)} />
          </div>
        )}
        <div>
          <label className="label" htmlFor="rounds">
            {t('setup.rounds')}
          </label>
          <input id="rounds" className="input" type="number" min={1} value={rounds} onChange={(e) => setRounds(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="rest">
            {t('setup.rest')}
          </label>
          <input id="rest" className="input" type="number" min={0} value={rest} onChange={(e) => setRest(e.target.value)} />
        </div>
      </div>
      <button type="submit" className="btn btn-primary py-3 text-base">
        {t('setup.start')}
      </button>
    </form>
  );
}
