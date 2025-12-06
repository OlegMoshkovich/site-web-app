/**
 * Observation-related utility functions
 */

import { getSignedPhotoUrl } from "@/lib/supabase/api";
import type { Observation } from "@/types/supabase";

// Extended observation interface
interface ObservationWithUrl extends Observation {
  signedUrl: string | null;
  sites?: { name: string } | null;
  profiles?: { email: string } | null;
  user_email?: string;
}

/**
 * Refreshes signed URLs for observations that have photos
 * @param observations - Array of observations to refresh URLs for
 * @returns Promise that resolves to updated observations array
 */
export async function refreshSignedUrls(observations: ObservationWithUrl[]): Promise<ObservationWithUrl[]> {
  if (!observations.length) return observations;

  try {
    const updatedObservations = await Promise.all(
      observations.map(async (obs) => {
        if (obs.photo_url && obs.photo_url.trim()) {
          try {
            const freshSignedUrl = await getSignedPhotoUrl(obs.photo_url, 3600);
            // Only update if we got a valid signed URL, otherwise keep the existing one
            return { ...obs, signedUrl: freshSignedUrl || obs.signedUrl };
          } catch (err) {
            console.warn(`Failed to refresh signed URL for observation ${obs.id}:`, err);
            // Keep the existing signed URL if refresh fails
            return obs;
          }
        }
        return obs;
      })
    );

    // Only return changes if we have meaningful updates to prevent unnecessary re-renders
    const hasChanges = updatedObservations.some((obs, index) =>
      obs.signedUrl !== observations[index].signedUrl
    );

    return hasChanges ? updatedObservations : observations;
  } catch (error) {
    console.error('Error refreshing signed URLs:', error);
    return observations;
  }
}

/**
 * Extracts unique users from observations
 * @param observations - Array of observations
 * @returns Array of user objects with id and display name
 */
export function extractUsers(observations: ObservationWithUrl[]): Array<{id: string, displayName: string}> {
  if (observations.length === 0) return [];

  const allUsers = new Map<string, string>();
  observations.forEach(obs => {
    if (obs.user_id) {
      const displayName = obs.user_email || `User ${obs.user_id.slice(0, 8)}...`;
      allUsers.set(obs.user_id, displayName);
    }
  });

  return Array.from(allUsers.entries())
    .map(([id, displayName]) => ({ id, displayName }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

/**
 * Extracts unique sites from observations
 * @param observations - Array of observations
 * @returns Array of site objects with id and name
 */
export function extractSites(observations: ObservationWithUrl[]): Array<{id: string, name: string}> {
  if (observations.length === 0) return [];

  const allSites = new Map<string, string>();
  observations.forEach(obs => {
    if (obs.site_id) {
      const siteName = obs.sites?.name || `Site ${obs.site_id.slice(0, 8)}...`;
      allSites.set(obs.site_id, siteName);
    }
  });

  return Array.from(allSites.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Checks if observations need signed URL refresh
 * @param observations - Array of observations to check
 * @returns Boolean indicating if refresh is needed
 */
export function needsSignedUrlRefresh(observations: ObservationWithUrl[]): boolean {
  return observations.some(obs =>
    obs.photo_url && obs.photo_url.trim() && !obs.signedUrl
  );
}