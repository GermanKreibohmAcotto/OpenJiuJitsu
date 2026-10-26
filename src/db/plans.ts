import { db } from './db';
import { newId, nowIso } from './ids';
import type { TrainingPlan } from '../domain/types';

export type PlanInput = Omit<TrainingPlan, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };

/** Most recently updated first. */
export async function listPlans(): Promise<TrainingPlan[]> {
  const all = await db.plans.toArray();
  return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getPlan(id: string): Promise<TrainingPlan | undefined> {
  return db.plans.get(id);
}

export async function savePlan(input: PlanInput): Promise<TrainingPlan> {
  const existing = input.id ? await db.plans.get(input.id) : undefined;
  const now = nowIso();
  const plan: TrainingPlan = {
    ...input,
    id: existing?.id ?? input.id ?? newId(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await db.plans.put(plan);
  return plan;
}

export function deletePlan(id: string): Promise<void> {
  return db.plans.delete(id);
}

export function planTotalMinutes(plan: Pick<TrainingPlan, 'blocks'>): number {
  return plan.blocks.reduce((sum, block) => sum + (Number.isFinite(block.minutes) ? block.minutes : 0), 0);
}
