import { useLiveQuery } from 'dexie-react-hooks';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { useSettings } from '../../app/settings';
import { EmptyState, PageHeader } from '../../components/Page';
import { TechniquePicker } from '../../components/TechniquePicker';
import { saveTechnique, getTechnique } from '../../db/techniques';
import { LEGALITY_PRESETS } from '../../domain/belts';
import {
  BELTS,
  CATEGORIES,
  MEDIA_KINDS,
  MODES,
  POSITIONS,
  TECHNIQUE_TYPES,
  type BeltLegality,
  type Category,
  type LocalizedText,
  type MediaItem,
  type Mode,
  type Position,
  type Technique,
  type TechniqueType,
} from '../../domain/types';
import { localize, withLocalized } from '../../i18n';
import { isSafeUrl } from './media';

type PresetKey = keyof typeof LEGALITY_PRESETS;
const CUSTOM = 'custom';

function presetOf(legality: BeltLegality): PresetKey | typeof CUSTOM {
  const found = (Object.keys(LEGALITY_PRESETS) as PresetKey[]).find(
    (key) => LEGALITY_PRESETS[key].gi === legality.gi && LEGALITY_PRESETS[key].nogi === legality.nogi,
  );
  return found ?? CUSTOM;
}

function swap<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

export function TechniqueEditRoute() {
  const { t } = useTranslation('library');
  const { id = '' } = useParams();
  const result = useLiveQuery(async () => ({ technique: await getTechnique(id) }), [id]);
  if (!result) return null;
  if (!result.technique) return <EmptyState>{t('notFound')}</EmptyState>;
  return <TechniqueForm key={id} initial={result.technique} />;
}

export function TechniqueForm({ initial }: { initial?: Technique }) {
  const { t, i18n } = useTranslation('library');
  const { defaultMode } = useSettings();
  const navigate = useNavigate();
  const lang = i18n.language;

  const [name, setName] = useState<LocalizedText>(initial?.name ?? {});
  const [description, setDescription] = useState<LocalizedText>(initial?.description ?? {});
  const [steps, setSteps] = useState<LocalizedText[]>(initial?.steps ?? []);
  const [category, setCategory] = useState<Category>(initial?.category ?? 'submission');
  const [type, setType] = useState<TechniqueType>(initial?.type ?? 'submission');
  const [position, setPosition] = useState<Position | ''>(initial?.position ?? '');
  const [modes, setModes] = useState<Mode[]>(initial?.modes ?? [defaultMode]);
  const [media, setMedia] = useState<MediaItem[]>(initial?.media ?? []);
  const [counterpartIds, setCounterpartIds] = useState<string[]>(initial?.counterpartIds ?? []);
  const [legality, setLegality] = useState<BeltLegality>(initial?.legality ?? LEGALITY_PRESETS.allBelts);
  const [errors, setErrors] = useState<{ name?: boolean; modes?: boolean; media: number[] }>({ media: [] });

  const toggleMode = (mode: Mode) =>
    setModes((current) => (current.includes(mode) ? current.filter((m) => m !== mode) : [...current, mode]));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = {
      name: !localize(name, lang).trim(),
      modes: modes.length === 0,
      media: media.flatMap((item, index) => (isSafeUrl(item.url) ? [] : [index])),
    };
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.modes || nextErrors.media.length > 0) return;

    const saved = await saveTechnique({
      id: initial?.id,
      name: { ...name, [lang]: (name[lang as keyof LocalizedText] ?? '').trim() },
      description,
      steps: steps.filter((step) => Object.values(step).some((value) => value?.trim())),
      category,
      type,
      position: position || undefined,
      modes: MODES.filter((mode) => modes.includes(mode)),
      media: media.map((item) => ({ ...item, url: item.url.trim() })),
      counterpartIds: counterpartIds.filter((c) => c !== initial?.id),
      legality: type === 'submission' ? legality : undefined,
    });
    navigate(`/library/${saved.id}`);
  };

  const activeValue = (text: LocalizedText) => text[lang as keyof LocalizedText] ?? '';

  return (
    <>
      <PageHeader title={initial ? t('form.editTitle') : t('form.createTitle')} />
      <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
        <div>
          <label className="label" htmlFor="tech-name">
            {t('form.name')}
          </label>
          <input
            id="tech-name"
            className="input"
            value={activeValue(name)}
            placeholder={localize(name, lang)}
            onChange={(e) => setName(withLocalized(name, lang, e.target.value))}
          />
          {errors.name && (
            <p role="alert" className="mt-1 text-xs text-danger">
              {t('form.nameRequired')}
            </p>
          )}
        </div>

        <div>
          <label className="label" htmlFor="tech-description">
            {t('form.description')}
          </label>
          <textarea
            id="tech-description"
            className="input min-h-24"
            value={activeValue(description)}
            placeholder={localize(description, lang)}
            onChange={(e) => setDescription(withLocalized(description, lang, e.target.value))}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="tech-category">
              {t('form.category')}
            </label>
            <select id="tech-category" className="input" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              {CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {t(`common:categories.${value}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="tech-type">
              {t('form.type')}
            </label>
            <select id="tech-type" className="input" value={type} onChange={(e) => setType(e.target.value as TechniqueType)}>
              {TECHNIQUE_TYPES.map((value) => (
                <option key={value} value={value}>
                  {t(`common:types.${value}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="tech-position">
              {t('form.position')}
            </label>
            <select id="tech-position" className="input" value={position} onChange={(e) => setPosition(e.target.value as Position | '')}>
              <option value="">{t('form.noPosition')}</option>
              {POSITIONS.map((value) => (
                <option key={value} value={value}>
                  {t(`common:positions.${value}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset>
          <legend className="label">{t('form.modes')}</legend>
          <div className="flex gap-4">
            {MODES.map((mode) => (
              <label key={mode} className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="accent-accent" checked={modes.includes(mode)} onChange={() => toggleMode(mode)} />
                {t(`common:modes.${mode}`)}
              </label>
            ))}
          </div>
          {errors.modes && (
            <p role="alert" className="mt-1 text-xs text-danger">
              {t('form.modesRequired')}
            </p>
          )}
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="label">{t('form.steps')}</legend>
          {steps.map((step, index) => (
            <div key={index} className="flex gap-1">
              <input
                className="input"
                aria-label={t('form.step', { n: index + 1 })}
                value={activeValue(step)}
                placeholder={localize(step, lang)}
                onChange={(e) => setSteps(steps.map((s, i) => (i === index ? withLocalized(s, lang, e.target.value) : s)))}
              />
              <button type="button" className="btn px-2" aria-label={t('form.moveUp', { n: index + 1 })} disabled={index === 0} onClick={() => setSteps(swap(steps, index, index - 1))}>
                ↑
              </button>
              <button type="button" className="btn px-2" aria-label={t('form.moveDown', { n: index + 1 })} disabled={index === steps.length - 1} onClick={() => setSteps(swap(steps, index, index + 1))}>
                ↓
              </button>
              <button type="button" className="btn btn-danger px-2" aria-label={t('form.removeStep', { n: index + 1 })} onClick={() => setSteps(steps.filter((_, i) => i !== index))}>
                ✕
              </button>
            </div>
          ))}
          <button type="button" className="btn self-start" onClick={() => setSteps([...steps, {}])}>
            {t('form.addStep')}
          </button>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="label">{t('form.media')}</legend>
          {media.map((item, index) => (
            <div key={index}>
              <div className="flex gap-1">
                <select
                  className="input w-32"
                  aria-label={t('form.mediaKind')}
                  value={item.kind}
                  onChange={(e) => setMedia(media.map((m, i) => (i === index ? { ...m, kind: e.target.value as MediaItem['kind'] } : m)))}
                >
                  {MEDIA_KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {t(`form.mediaKinds.${kind}`)}
                    </option>
                  ))}
                </select>
                <input
                  className="input"
                  type="url"
                  inputMode="url"
                  aria-label={t('form.url')}
                  placeholder="https://"
                  value={item.url}
                  onChange={(e) => setMedia(media.map((m, i) => (i === index ? { ...m, url: e.target.value } : m)))}
                />
                <button type="button" className="btn btn-danger px-2" aria-label={t('form.removeMedia', { n: index + 1 })} onClick={() => setMedia(media.filter((_, i) => i !== index))}>
                  ✕
                </button>
              </div>
              {errors.media.includes(index) && (
                <p role="alert" className="mt-1 text-xs text-danger">
                  {t('form.urlInvalid')}
                </p>
              )}
            </div>
          ))}
          <button type="button" className="btn self-start" onClick={() => setMedia([...media, { kind: 'youtube', url: '' }])}>
            {t('form.addMedia')}
          </button>
        </fieldset>

        <TechniquePicker
          label={t('form.counterparts')}
          value={counterpartIds}
          mode="all"
          excludeIds={initial ? [initial.id] : undefined}
          onChange={setCounterpartIds}
        />

        {type === 'submission' && (
          <fieldset className="flex flex-col gap-3">
            <legend className="label">{t('form.legality')}</legend>
            <div>
              <label className="label" htmlFor="tech-preset">
                {t('form.preset')}
              </label>
              <select
                id="tech-preset"
                className="input"
                value={presetOf(legality)}
                onChange={(e) => {
                  if (e.target.value !== CUSTOM) setLegality({ ...LEGALITY_PRESETS[e.target.value as PresetKey] });
                }}
              >
                <option value={CUSTOM}>{t('form.presetCustom')}</option>
                {(Object.keys(LEGALITY_PRESETS) as PresetKey[]).map((key) => (
                  <option key={key} value={key}>
                    {t(`form.presets.${key}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {MODES.map((mode) => (
                <div key={mode}>
                  <label className="label" htmlFor={`tech-belt-${mode}`}>
                    {t('form.minBelt', { mode: t(`common:modes.${mode}`) })}
                  </label>
                  <select
                    id={`tech-belt-${mode}`}
                    className="input"
                    value={legality[mode] ?? ''}
                    onChange={(e) => setLegality({ ...legality, [mode]: e.target.value || null })}
                  >
                    <option value="">{t('common:legality.notAllowed')}</option>
                    {BELTS.map((belt) => (
                      <option key={belt} value={belt}>
                        {t(`common:belts.${belt}`)}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </fieldset>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={() => navigate(initial ? `/library/${initial.id}` : '/library')}>
            {t('common:actions.cancel')}
          </button>
          <button type="submit" className="btn btn-primary">
            {t('common:actions.save')}
          </button>
        </div>
      </form>
    </>
  );
}
