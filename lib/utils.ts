import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;

/**
 * Download photo and convert to data URL
 */
export async function getPhotoDataUrl(photoUrl: string, supabase: any): Promise<string | null> {
  if (!photoUrl) return null;
  
  console.log(`Starting download for photo: ${photoUrl}`);
  
  try {
    // Simple download from photos bucket
    const { data, error } = await supabase.storage
      .from('photos')
      .download(photoUrl);
    
    if (error) {
      console.log(`Download failed for ${photoUrl}:`, error.message);
      return null;
    }
    
    if (!data) {
      console.log(`No data for ${photoUrl}`);
      return null;
    }
    
    // Convert to data URL
    const arrayBuffer = await data.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = data.type || 'image/jpeg';
    
    console.log(`Successfully processed ${photoUrl}`);
    return `data:${mimeType};base64,${base64}`;
    
  } catch (error) {
    console.log(`Exception processing ${photoUrl}:`, error);
    return null;
  }
}

/**
 * Format date to readable string
 */
export function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return 'Invalid date';
  }
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}