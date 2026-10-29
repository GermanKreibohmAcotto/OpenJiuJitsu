import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { BeltBar } from '../../components/BeltBar';
import { MAX_STRIPES } from '../../domain/belts';
import { BELTS, type Belt, type Profile } from '../../domain/types';
import { saveProfile } from '../../db/profile';

interface BeltEditorProps {
  profile: Profile;
  /** Called after saving when the belt or stripes differ from the stored ones. */
  onGraduationChange: (belt: Belt, stripes: number) => void;
}

export function BeltEditor({ profile, onGraduationChange }: BeltEditorProps) {
  const { t } = useTranslation('profile');
  const [name, setName] = useState(profile.name);
  const [academy, setAcademy] = useState(profile.academy);
  const [belt, setBelt] = useState<Belt>(profile.belt);
  const [stripes, setStripes] = useState(profile.stripes);
  const [saved, setSaved] = useState(false);

  function selectBelt(next: Belt) {
    setBelt(next);
    setStripes((current) => Math.min(current, MAX_STRIPES[next]));
    setSaved(false);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    await saveProfile({ ...profile, name: name.trim(), academy: academy.trim(), belt, stripes });
    setSaved(true);
    if (belt !== profile.belt || stripes !== profile.stripes) onGraduationChange(belt, stripes);
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <h2 className="text-lg font-semibold">{t('editor.title')}</h2>
      <BeltBar belt={belt} stripes={stripes} size="lg" />

      <div role="radiogroup" aria-label={t('editor.belt')} className="grid grid-cols-5 gap-2">
        {BELTS.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={belt === option}
            aria-label={t(`belts.${option}`, { ns: 'common' })}
            onClick={() => selectBelt(option)}
            className={`min-w-0 rounded-xl border px-1 py-2 ${belt === option ? 'border-accent bg-accent/10' : 'border-line'}`}
          >
            <BeltBar belt={option} size="sm" />
            <span aria-hidden className="mt-1 block text-[10px] sm:text-xs">
              {t(`belts.${option}`, { ns: 'common' })}
            </span>
          </button>
        ))}
      </div>

      <div>
        <span className="label" id="stripes-label">
          {t('editor.stripes')}
        </span>
        <div role="radiogroup" aria-labelledby="stripes-label" className="flex flex-wrap gap-2">
          {Array.from({ length: MAX_STRIPES[belt] + 1 }, (_, count) => (
            <button
              key={count}
              type="button"
              role="radio"
              aria-checked={stripes === count}
              aria-label={t('stripes', { ns: 'common', count })}
              onClick={() => {
                setStripes(count);
                setSaved(false);
              }}
              className={`chip px-3 py-1.5 text-sm ${stripes === count ? 'chip-active' : ''}`}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="profile-name">
            {t('editor.name')}
          </label>
          <input id="profile-name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="profile-academy">
            {t('editor.academy')}
          </label>
          <input id="profile-academy" className="input" value={academy} onChange={(e) => setAcademy(e.target.value)} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" className="btn btn-primary">
          {t('actions.save', { ns: 'common' })}
        </button>
        {saved && (
          <p role="status" className="text-sm text-accent">
            {t('editor.saved')}
          </p>
        )}
      </div>
    </form>
  );
}
