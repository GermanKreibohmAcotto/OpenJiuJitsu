import { useTranslation } from 'react-i18next';
import { FEELING_TAGS } from '../../domain/types';

/** Built-in feelings are translated; custom free tags are shown as typed. */
export function useFeelingLabel() {
  const { t } = useTranslation();
  return (tag: string) => ((FEELING_TAGS as readonly string[]).includes(tag) ? t(`common:feelings.${tag}`) : tag);
}

export function FeelingChips({ feelings }: { feelings: string[] }) {
  const label = useFeelingLabel();
  if (feelings.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {feelings.map((tag) => (
        <li key={tag} className="chip chip-active">
          {label(tag)}
        </li>
      ))}
    </ul>
  );
}

/** Groups repeated ids into [id, count] pairs, keeping first-seen order. */
export function countIds(ids: string[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts];
}

/** Formats a yyyy-mm-dd date in the local calendar (no timezone shift). */
export function formatDate(iso: string, lang: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(lang, { year: 'numeric', month: 'short', day: 'numeric' });
}
