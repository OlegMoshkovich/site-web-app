// src/lib/observations.ts
import { createClient } from './client';
import type { Observation } from '../../types/supabase';

/**
 * Fetch all observations for a user, newest first.
 */
export async function fetchUserObservations(userId: string): Promise<Observation[]> {
  if (!userId) throw new Error('User ID is required to fetch user observations');

  const supabase = createClient();
  const { data, error } = await supabase
    .from('observations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * Fetch all unique observation dates (YYYY-MM-DD) for a user, sorted descending.
 */
export async function fetchObservationDates(userId: string): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('observations')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const seen = new Set<string>();
  const dates: string[] = [];

  for (const row of data ?? []) {
    const created = (row as { created_at?: string })?.created_at;
    if (!created) continue;
    const yyyyMmDd = created.split('T')[0];
    if (!seen.has(yyyyMmDd)) {
      seen.add(yyyyMmDd);
      dates.push(yyyyMmDd);
    }
  }
  return dates;
}

/**
 * Download a photo by its storage path (NOT a public URL).
 * Example path: "users/123/2025-08-17/photo.jpg"
 */
export async function downloadPhoto(path: string) {
    // console.log('downloadPhoto path from the function', path);
  try {
    if (!path?.trim()) {
      console.error('Invalid storage path provided:', path);
      return null;
    }

    const supabase = createClient();
    const { data, error } = await supabase.storage.from('photos').download(path);
    console.log('data from process photo', data);

    if (error) {
      console.error(`Storage error for ${path}:`, error);
      return null;
    }

    if (!data) {
      console.error(`No file data returned for ${path}`);
      return null;
    }

    return data; // Blob (web) or Blob-like (Expo RN)
  } catch (err) {
    console.error(`Exception downloading photo ${path}:`, err);
    return null;
  }
}

/**
 * Get the currently authenticated user.
 */
export async function getCurrentUser() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user ?? null;
}
