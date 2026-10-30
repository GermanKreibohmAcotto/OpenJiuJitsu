import { db } from './db';
import { newId } from './ids';
import type { Graduation, GraduationGoal, Profile } from '../domain/types';

export const DEFAULT_PROFILE: Profile = { id: 'me', name: '', academy: '', belt: 'white', stripes: 0 };

export async function getProfile(): Promise<Profile> {
  return (await db.profile.get('me')) ?? DEFAULT_PROFILE;
}

export async function saveProfile(profile: Omit<Profile, 'id'>): Promise<Profile> {
  const saved: Profile = { ...profile, id: 'me' };
  await db.profile.put(saved);
  return saved;
}

/** Stores one self-rated style axis (1..10) without touching the rest of the profile. */
export async function saveSelfRating(axis: 'flexibility', value: number): Promise<void> {
  const { id: _id, ...profile } = await getProfile();
  await saveProfile({ ...profile, selfRatings: { ...profile.selfRatings, [axis]: value } });
}

/** Oldest first, for the graduation timeline. */
export async function listGraduations(): Promise<Graduation[]> {
  const all = await db.graduations.toArray();
  return all.sort((a, b) => a.date.localeCompare(b.date));
}

export async function saveGraduation(input: Omit<Graduation, 'id'> & { id?: string }): Promise<Graduation> {
  const graduation: Graduation = { ...input, id: input.id ?? newId() };
  await db.graduations.put(graduation);
  return graduation;
}

export function deleteGraduation(id: string): Promise<void> {
  return db.graduations.delete(id);
}

/** Stores the weekly training goal (integer 1..14), or clears it with `undefined`, keeping the rest of the profile. */
export async function saveWeeklyGoal(goal: number | undefined): Promise<void> {
  if (goal !== undefined && (!Number.isInteger(goal) || goal < 1 || goal > 14)) {
    throw new RangeError('weeklyGoal must be an integer between 1 and 14');
  }
  const { id: _id, weeklyGoal: _previous, ...profile } = await getProfile();
  await saveProfile(goal === undefined ? profile : { ...profile, weeklyGoal: goal });
}

/** Stores the own graduation goal (unset or non-positive fields dropped); an empty goal clears it. */
export async function saveGraduationGoal(goal: GraduationGoal): Promise<void> {
  const kept = Object.fromEntries(
    (['classes', 'hours', 'months'] as const).flatMap((key) => {
      const value = goal[key];
      return value !== undefined && Number.isFinite(value) && value > 0 ? [[key, value]] : [];
    }),
  ) as GraduationGoal;
  const { id: _id, graduationGoal: _previous, ...profile } = await getProfile();
  await saveProfile(Object.keys(kept).length > 0 ? { ...profile, graduationGoal: kept } : profile);
}
