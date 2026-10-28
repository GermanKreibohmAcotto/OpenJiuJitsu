import { db } from './db';
import { newId } from './ids';
import type { Graduation, Profile } from '../domain/types';

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
