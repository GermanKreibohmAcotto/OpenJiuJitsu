import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDndContext,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { matchesModeFilter, useSettings } from '../../app/settings';
import { ModeToggle } from '../../components/ModeToggle';
import { EmptyState, PageHeader } from '../../components/Page';
import { matchesSearch, TechniquePicker } from '../../components/TechniquePicker';
import { getPlan, planTotalMinutes, savePlan } from '../../db/plans';
import { BLOCK_KINDS, type BlockKind, type Mode, type PlanBlock, type Technique, type TrainingPlan } from '../../domain/types';
import { useTechniqueMap, useTechniques } from '../../hooks/useTechniques';
import { useLocalize } from '../../i18n';
import { Icon } from '../../components/Icon';
import {
  addBlock,
  addTechniqueToBlock,
  applyExampleTemplate,
  moveBlock,
  removeBlock,
  removeTechniqueFromBlock,
  updateBlock,
} from './planEditor';

/** Loads the plan being edited (or none for `/plans/new`) and mounts the form once ready. */
export function PlanBuilderPage() {
  const { id } = useParams();
  const { t } = useTranslation('plans');
  const { defaultMode } = useSettings();
  const [initial, setInitial] = useState<TrainingPlan | 'missing' | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    void getPlan(id).then((plan) => active && setInitial(plan ?? 'missing'));
    return () => {
      active = false;
    };
  }, [id]);

  if (id && initial === null) return null;
  if (initial === 'missing') return <EmptyState>{t('builder.notFound')}</EmptyState>;
  const plan = initial ?? undefined;
  return (
    <PlanForm
      planId={plan?.id}
      title={t(plan ? 'builder.editTitle' : 'builder.newTitle')}
      initial={{
        name: plan?.name ?? '',
        date: plan?.date ?? '',
        mode: plan?.mode ?? defaultMode,
        objectives: plan?.objectives ?? [],
        blocks: plan?.blocks ?? [],
      }}
    />
  );
}

interface FormState {
  name: string;
  date: string;
  mode: Mode;
  objectives: string[];
  blocks: PlanBlock[];
}

function PlanForm({ planId, title, initial }: { planId?: string; title: string; initial: FormState }) {
  const { t } = useTranslation('plans');
  const navigate = useNavigate();
  const techniqueMap = useTechniqueMap();
  const [form, setForm] = useState<FormState>(initial);
  const [objective, setObjective] = useState('');
  const [newBlock, setNewBlock] = useState<{ kind: BlockKind; title: string; minutes: string }>({
    kind: 'technique',
    title: '',
    minutes: '10',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const setBlocks = (update: (blocks: PlanBlock[]) => PlanBlock[]) => setForm((f) => ({ ...f, blocks: update(f.blocks) }));
  const total = planTotalMinutes({ blocks: form.blocks });

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const type = active.data.current?.type;
    if (type === 'technique') {
      setBlocks((blocks) => addTechniqueToBlock(blocks, String(over.id), String(active.data.current?.techniqueId)));
    } else if (type === 'block') {
      setBlocks((blocks) => {
        const from = blocks.findIndex((b) => b.id === active.id);
        const to = blocks.findIndex((b) => b.id === over.id);
        return from < 0 || to < 0 ? blocks : moveBlock(blocks, String(active.id), to - from);
      });
    }
  };

  const addObjective = () => {
    const text = objective.trim();
    if (!text) return;
    setForm((f) => ({ ...f, objectives: [...f.objectives, text] }));
    setObjective('');
  };

  const submitBlock = () => {
    const minutes = Math.max(0, Number(newBlock.minutes) || 0);
    const blockTitle = newBlock.title.trim() || t(`common:blockKinds.${newBlock.kind}`);
    setBlocks((blocks) => addBlock(blocks, { kind: newBlock.kind, title: blockTitle, minutes }));
    setNewBlock((b) => ({ ...b, title: '' }));
  };

  const loadTemplate = () =>
    setBlocks(() =>
      applyExampleTemplate(
        { drills: t('builder.template.drills'), pass: t('builder.template.pass'), sparring: t('builder.template.sparring') },
        new Set(techniqueMap.keys()),
      ),
    );

  const save = async () => {
    const saved = await savePlan({
      id: planId,
      name: form.name.trim(),
      mode: form.mode,
      date: form.date || undefined,
      objectives: form.objectives,
      blocks: form.blocks,
    });
    navigate(`/plans/${saved.id}`);
  };

  return (
    <>
      <PageHeader
        title={title}
        actions={
          <>
            <button type="button" className="btn" onClick={loadTemplate}>
              {t('actions.template')}
            </button>
            <button type="button" className="btn btn-primary" disabled={!form.name.trim()} onClick={() => void save()}>
              {t('actions.save')}
            </button>
          </>
        }
      />
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
          <div className="flex flex-col gap-5">
            <section className="card grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="label">{t('builder.name')}</span>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="label">{t('builder.date')}</span>
                <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </label>
              <div className="flex flex-col gap-1">
                <span className="label">{t('builder.mode')}</span>
                <ModeToggle value={form.mode} onChange={(mode) => setForm({ ...form, mode })} />
              </div>
            </section>

            <section className="card flex flex-col gap-3">
              <div>
                <h2 className="font-semibold">{t('builder.objectives.title')}</h2>
                <p className="text-sm text-muted">{t('builder.objectives.hint')}</p>
              </div>
              <ul className="flex flex-col gap-2">
                {form.objectives.map((text, index) => (
                  <li key={index} className="flex items-center justify-between gap-2 text-sm">
                    <span>{text}</span>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      aria-label={t('builder.objectives.remove', { text })}
                      onClick={() => setForm((f) => ({ ...f, objectives: f.objectives.filter((_, i) => i !== index) }))}
                    >
                      <Icon name="close" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <input
                  className="input"
                  aria-label={t('builder.objectives.input')}
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addObjective();
                    }
                  }}
                />
                <button type="button" className="btn" onClick={addObjective}>
                  {t('builder.objectives.add')}
                </button>
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{t('builder.blocks.title')}</h2>
                <p className="text-sm text-muted">
                  {t('builder.total')}:{' '}
                  <strong data-testid="total" className="text-zinc-100">
                    {t('common:minutes', { count: total })}
                  </strong>
                </p>
              </div>
              {form.blocks.length === 0 && <EmptyState>{t('builder.blocks.empty')}</EmptyState>}
              <SortableContext items={form.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                <ul className="flex flex-col gap-3">
                  {form.blocks.map((block, index) => (
                    <BlockCard
                      key={block.id}
                      block={block}
                      index={index}
                      count={form.blocks.length}
                      mode={form.mode}
                      techniques={techniqueMap}
                      onChange={(patch) => setBlocks((blocks) => updateBlock(blocks, block.id, patch))}
                      onRemove={() => setBlocks((blocks) => removeBlock(blocks, block.id))}
                      onMove={(delta) => setBlocks((blocks) => moveBlock(blocks, block.id, delta))}
                      onRemoveTechnique={(techniqueId) =>
                        setBlocks((blocks) => removeTechniqueFromBlock(blocks, block.id, techniqueId))
                      }
                    />
                  ))}
                </ul>
              </SortableContext>

              <div className="card grid gap-2 sm:grid-cols-[10rem_1fr_6rem_auto] sm:items-end">
                <select
                  className="input"
                  aria-label={t('builder.blocks.newKind')}
                  value={newBlock.kind}
                  onChange={(e) => setNewBlock({ ...newBlock, kind: e.target.value as BlockKind })}
                >
                  {BLOCK_KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {t(`common:blockKinds.${kind}`)}
                    </option>
                  ))}
                </select>
                <input
                  className="input"
                  aria-label={t('builder.blocks.newTitle')}
                  value={newBlock.title}
                  onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })}
                />
                <input
                  type="number"
                  min={0}
                  className="input"
                  aria-label={t('builder.blocks.newMinutes')}
                  value={newBlock.minutes}
                  onChange={(e) => setNewBlock({ ...newBlock, minutes: e.target.value })}
                />
                <button type="button" className="btn btn-primary" onClick={submitBlock}>
                  {t('builder.blocks.add')}
                </button>
              </div>
            </section>
          </div>

          <LibraryPanel planMode={form.mode} />
        </div>
      </DndContext>
    </>
  );
}

interface BlockCardProps {
  block: PlanBlock;
  index: number;
  count: number;
  mode: Mode;
  techniques: Map<string, Technique>;
  onChange: (patch: Partial<Omit<PlanBlock, 'id'>>) => void;
  onRemove: () => void;
  onMove: (delta: number) => void;
  onRemoveTechnique: (techniqueId: string) => void;
}

function BlockCard({ block, index, count, mode, techniques, onChange, onRemove, onMove, onRemoveTechnique }: BlockCardProps) {
  const { t } = useTranslation('plans');
  const localize = useLocalize();
  const [picking, setPicking] = useState(false);
  const n = index + 1;
  const { active } = useDndContext();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging, isOver } = useSortable({
    id: block.id,
    data: { type: 'block' },
  });
  const droppingTechnique = isOver && active?.data.current?.type === 'technique';

  return (
    <li
      ref={setNodeRef}
      role="group"
      aria-label={t('builder.blocks.block', { n })}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`card flex flex-col gap-3 ${isDragging ? 'opacity-60' : ''} ${droppingTechnique ? 'ring-2 ring-accent' : ''}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          ref={setActivatorNodeRef}
          className="btn btn-ghost cursor-grab touch-none"
          aria-label={t('builder.blocks.dragHandle', { n })}
          {...attributes}
          {...listeners}
        >
          <Icon name="drag_indicator" />
        </button>
        <select
          className="input w-auto"
          aria-label={t('builder.blocks.kind', { n })}
          value={block.kind}
          onChange={(e) => onChange({ kind: e.target.value as BlockKind })}
        >
          {BLOCK_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {t(`common:blockKinds.${kind}`)}
            </option>
          ))}
        </select>
        <input
          className="input min-w-0 flex-1"
          aria-label={t('builder.blocks.blockTitle', { n })}
          value={block.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
        <input
          type="number"
          min={0}
          className="input w-24"
          aria-label={t('builder.blocks.minutes', { n })}
          value={block.minutes}
          onChange={(e) => onChange({ minutes: Math.max(0, Number(e.target.value) || 0) })}
        />
        <button type="button" className="btn btn-ghost" disabled={index === 0} aria-label={t('builder.blocks.moveUp', { n })} onClick={() => onMove(-1)}>
          <Icon name="arrow_upward" />
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={index === count - 1}
          aria-label={t('builder.blocks.moveDown', { n })}
          onClick={() => onMove(1)}
        >
          <Icon name="arrow_downward" />
        </button>
        <button type="button" className="btn btn-danger" aria-label={t('builder.blocks.remove', { n })} onClick={onRemove}>
          <Icon name="close" />
        </button>
      </div>

      {block.techniqueIds.length === 0 ? (
        <p className="text-sm text-muted">{droppingTechnique ? t('builder.blocks.dropHere') : t('builder.blocks.noTechniques')}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {block.techniqueIds.map((techniqueId) => {
            const name = techniques.has(techniqueId) ? localize(techniques.get(techniqueId)!.name) : t('common:unknownTechnique');
            return (
              <li key={techniqueId} className="chip">
                <span>{name}</span>
                <button type="button" aria-label={t('builder.blocks.removeTechnique', { name })} onClick={() => onRemoveTechnique(techniqueId)}>
                  <Icon name="close" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-col gap-2">
        <button type="button" className="btn self-start" aria-expanded={picking} onClick={() => setPicking((p) => !p)}>
          {picking ? t('builder.blocks.closePicker') : t('builder.blocks.addTechnique')}
        </button>
        {picking && <TechniquePicker value={block.techniqueIds} mode={mode} onChange={(ids) => onChange({ techniqueIds: ids })} />}
      </div>
    </li>
  );
}

function LibraryPanel({ planMode }: { planMode: Mode }) {
  const { t, i18n } = useTranslation('plans');
  const localize = useLocalize();
  const { modeFilter, setModeFilter } = useSettings();
  const techniques = useTechniques();
  const [query, setQuery] = useState('');

  const visible = (techniques ?? [])
    .filter((tech) => matchesModeFilter(tech.modes, planMode) && matchesModeFilter(tech.modes, modeFilter))
    .filter((tech) => matchesSearch(tech, query))
    .sort((a, b) => localize(a.name).localeCompare(localize(b.name), i18n.language));

  return (
    <aside className="card flex h-fit flex-col gap-3 lg:sticky lg:top-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">{t('builder.library.title')}</h2>
        <ModeToggle value={modeFilter} onChange={setModeFilter} allowAll />
      </div>
      <p className="text-xs text-muted">{t('builder.library.hint')}</p>
      <input
        type="search"
        className="input"
        aria-label={t('builder.library.search')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ul className="max-h-96 overflow-y-auto rounded-xl border border-line">
        {visible.map((tech) => (
          <DraggableTechnique key={tech.id} technique={tech} name={localize(tech.name)} />
        ))}
      </ul>
    </aside>
  );
}

function DraggableTechnique({ technique, name }: { technique: Technique; name: string }) {
  const { t } = useTranslation('plans');
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `technique:${technique.id}`,
    data: { type: 'technique', techniqueId: technique.id },
  });
  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-label={t('builder.library.drag', { name })}
      className={`cursor-grab touch-none border-b border-line px-3 py-2 text-sm last:border-b-0 ${isDragging ? 'opacity-50' : ''}`}
    >
      {name}
    </li>
  );
}
