import { db } from './db';
import { newId, nowIso } from './ids';
import { BODY_ZONES, INJURY_STATUSES, type Injury, type InjuryStatus } from '../domain/types';

export type InjuryInput = Omit<Injury, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };

export type InjuryField = 'zone' | 'intensity' | 'date' | 'status';

/** Invalid injury input; `field` lets the UI show a translated message. */
export class InjuryValidationError extends RangeError {
  constructor(
    readonly field: InjuryField,
    message: string,
  ) {
    super(message);
    this.name = 'InjuryValidationError';
  }
}

export const INTENSITY_MIN = 1;
export const INTENSITY_MAX = 10;

function assertInjury(input: InjuryInput) {
  if (!(BODY_ZONES as readonly string[]).includes(input.zone)) throw new InjuryValidationError('zone', 'zone is not a known body zone');
  if (!Number.isInteger(input.intensity) || input.intensity < INTENSITY_MIN || input.intensity > INTENSITY_MAX) {
    throw new InjuryValidationError('intensity', `intensity must be an integer between ${INTENSITY_MIN} and ${INTENSITY_MAX}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new InjuryValidationError('date', 'date must be yyyy-mm-dd');
  if (!(INJURY_STATUSES as readonly string[]).includes(input.status)) throw new InjuryValidationError('status', 'status must be active or recovered');
}

/** Active injuries first, then newest date first. */
export async function listInjuries(): Promise<Injury[]> {
  const all = await db.injuries.toArray();
  const rank = (i: Injury) => (i.status === 'active' ? 0 : 1);
  return all.sort((a, b) => rank(a) - rank(b) || b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export function getInjury(id: string): Promise<Injury | undefined> {
  return db.injuries.get(id);
}

export async function saveInjury(input: InjuryInput): Promise<Injury> {
  assertInjury(input);
  const existing = input.id ? await db.injuries.get(input.id) : undefined;
  const now = nowIso();
  const injury: Injury = {
    ...input,
    id: existing?.id ?? input.id ?? newId(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await db.injuries.put(injury);
  return injury;
}

export async function setInjuryStatus(id: string, status: InjuryStatus): Promise<void> {
  await db.injuries.update(id, { status, updatedAt: nowIso() });
}

export function deleteInjury(id: string): Promise<void> {
  return db.injuries.delete(id);
}
