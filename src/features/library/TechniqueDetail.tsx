import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import { BeltLegalityBadges } from '../../components/BeltLegalityBadges';
import { ModeBadges } from '../../components/ModeToggle';
import { EmptyState, PageHeader } from '../../components/Page';
import { db } from '../../db/db';
import { deleteTechnique, getTechnique } from '../../db/techniques';
import { LEGALITY_SOURCE, allowedBelts, isAllowedFor } from '../../domain/belts';
import { MODES, type MediaItem, type Technique } from '../../domain/types';
import { useTechniqueMap } from '../../hooks/useTechniques';
import { localize } from '../../i18n';
import { Icon } from '../../components/Icon';
import { isSafeUrl, parseYoutubeId, youtubeEmbedUrl } from './media';

function MediaView({ item, title }: { item: MediaItem; title: string }) {
  if (!isSafeUrl(item.url)) return null;
  if (item.kind === 'youtube') {
    const id = parseYoutubeId(item.url);
    if (id) {
      return (
        <iframe
          title={title}
          src={youtubeEmbedUrl(id)}
          className="aspect-video w-full rounded-xl border border-line"
          allow="encrypted-media; picture-in-picture"
          allowFullScreen
          referrerPolicy="no-referrer"
        />
      );
    }
    return (
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-accent underline">
        {item.url}
      </a>
    );
  }
  return (
    <img src={item.url} alt={title} loading="lazy" referrerPolicy="no-referrer" className="max-h-96 rounded-xl border border-line" />
  );
}

function StepsChecklist({ technique }: { technique: Technique }) {
  const { t, i18n } = useTranslation('library');
  const [done, setDone] = useState<Set<number>>(new Set());
  const toggle = (index: number) =>
    setDone((current) => {
      const next = new Set(current);
      if (!next.delete(index)) next.add(index);
      return next;
    });

  return (
    <section className="card" aria-labelledby="steps-title">
      <h2 id="steps-title" className="label">
        {t('detail.steps')}
      </h2>
      <p className="mb-2 text-xs text-muted">{t('detail.stepsProgress', { done: done.size, total: technique.steps.length })}</p>
      <ul className="flex flex-col gap-2">
        {technique.steps.map((step, index) => (
          <li key={index}>
            <label className={`flex cursor-pointer items-start gap-2 text-sm ${done.has(index) ? 'text-muted line-through' : ''}`}>
              <input type="checkbox" className="mt-1 accent-accent" checked={done.has(index)} onChange={() => toggle(index)} />
              <span>{localize(step, i18n.language)}</span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TechniqueDetail() {
  const { t, i18n } = useTranslation('library');
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const result = useLiveQuery(async () => ({ technique: await getTechnique(id) }), [id]);
  const profile = useLiveQuery(() => db.profile.get('me'), []);
  const techniqueMap = useTechniqueMap();
  const belt = profile?.belt ?? 'white';

  const counterparts = useMemo(
    () => (result?.technique?.counterpartIds ?? []).flatMap((cid) => techniqueMap.get(cid) ?? []),
    [result, techniqueMap],
  );

  if (!result) return null;
  const technique = result.technique;
  if (!technique) {
    return (
      <EmptyState
        action={
          <Link to="/library" className="btn">
            {t('backToList')}
          </Link>
        }
      >
        {t('notFound')}
      </EmptyState>
    );
  }

  const name = localize(technique.name, i18n.language);
  const description = localize(technique.description, i18n.language);

  const remove = async () => {
    if (!window.confirm(t('detail.deleteConfirm', { name }))) return;
    await deleteTechnique(technique.id);
    navigate('/library');
  };

  return (
    <>
      <PageHeader
        title={name}
        actions={
          <>
            <Link to="/library" className="btn btn-ghost">
              {t('common:actions.back')}
            </Link>
            <Link to={`/library/${technique.id}/edit`} className="btn">
              {t('common:actions.edit')}
            </Link>
            <button type="button" className="btn btn-danger" onClick={remove}>
              {t('common:actions.delete')}
            </button>
          </>
        }
      />

      <div className="flex flex-col gap-4">
        <section className="card flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span>
            <span className="label inline">{t('detail.category')}:</span> {t(`common:categories.${technique.category}`)}
          </span>
          <span>
            <span className="label inline">{t('detail.type')}:</span> {t(`common:types.${technique.type}`)}
          </span>
          {technique.position && (
            <span>
              <span className="label inline">{t('detail.position')}:</span> {t(`common:positions.${technique.position}`)}
            </span>
          )}
          <ModeBadges modes={technique.modes} />
        </section>

        {description && (
          <section className="card">
            <h2 className="label">{t('detail.description')}</h2>
            <p className="text-sm whitespace-pre-line">{description}</p>
          </section>
        )}

        {technique.steps.length > 0 && <StepsChecklist technique={technique} />}

        {technique.media.some((item) => isSafeUrl(item.url)) && (
          <section className="card flex flex-col gap-3">
            <h2 className="label">{t('detail.media')}</h2>
            {technique.media.map((item, index) => (
              <MediaView key={index} item={item} title={name} />
            ))}
          </section>
        )}

        <section className="card">
          <h2 className="label">{t('detail.counterparts')}</h2>
          {counterparts.length === 0 ? (
            <p className="text-sm text-danger"><Icon name="warning" /> {t('noCounterpart')}</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {counterparts.map((c) => (
                <li key={c.id}>
                  <Link to={`/library/${c.id}`} className="chip hover:border-accent hover:text-accent">
                    {localize(c.name, i18n.language)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {technique.legality && (
          <section className="card flex flex-col gap-3" aria-labelledby="legality-title">
            <h2 id="legality-title" className="label">
              {t('detail.legality')}
            </h2>
            {MODES.map((mode) => {
              const belts = allowedBelts(technique.legality, mode);
              return (
                <div key={mode} className="flex flex-col gap-1 text-sm">
                  <BeltLegalityBadges legality={technique.legality} modes={[mode]} />
                  {belts.length > 0 && (
                    <span className="text-xs text-muted">
                      {t('detail.allowedBelts', { belts: belts.map((b) => t(`common:belts.${b}`)).join(', ') })}
                    </span>
                  )}
                </div>
              );
            })}
            <div className="border-t border-line pt-3 text-sm">
              <p className="label">{t('detail.forYourBelt', { belt: t(`common:belts.${belt}`) })}</p>
              <ul className="flex flex-wrap gap-2">
                {MODES.map((mode) => {
                  const ok = isAllowedFor(technique.legality, mode, belt);
                  return (
                    <li key={mode} className={`chip ${ok ? 'chip-active' : 'border-danger/40 text-danger'}`}>
                      {t(`common:modes.${mode}`)}: {ok ? t('detail.allowed') : t('detail.notAllowed')}
                    </li>
                  );
                })}
              </ul>
            </div>
            <p className="text-xs text-muted">{t('common:legality.source', { source: LEGALITY_SOURCE })}</p>
          </section>
        )}
      </div>
    </>
  );
}
