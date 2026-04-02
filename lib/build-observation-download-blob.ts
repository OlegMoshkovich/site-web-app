import { compressImageForDownload } from '@/lib/compress-image';
import { overlayTimestampOnImage } from '@/lib/overlay-image-timestamp';
import { resolveObservationDateTime, type ObservationDateFields } from '@/lib/observation-dates';

/** Fields needed to compress, overlay, and name a downloaded observation photo */
export type PhotoDownloadObservationFields = ObservationDateFields & {
  id: string;
  user_id: string;
  site_id: string | null;
  site_name?: string | null;
  sites?: { name: string; logo_url?: string | null } | null;
  profiles?: { email: string } | null;
  user_email?: string;
  user_name?: string | null;
};

/**
 * Fetches a photo, compresses when possible, applies the same overlay as bulk download, returns blob + filename.
 */
export async function buildObservationPhotoDownloadBlob(
  photoUrl: string,
  obs: PhotoDownloadObservationFields,
  targetSizeKB: number = 2000
): Promise<{ blob: Blob; filename: string } | null> {
  const response = await fetch(photoUrl);
  if (!response.ok) return null;

  const blob = await response.blob();
  let finalBlob = blob;
  let extension = blob.type.includes('jpeg') || blob.type.includes('jpg')
    ? '.jpg'
    : blob.type.includes('png')
      ? '.png'
      : '.jpg';

  try {
    if (blob.type.startsWith('image/')) {
      const compressedBlob = await compressImageForDownload(blob, targetSizeKB);
      finalBlob = compressedBlob;
      extension = '.jpg';
    }
  } catch (compressionError) {
    console.warn(
      `Failed to compress image for observation ${obs.id}, attempting basic fallback compression:`,
      compressionError
    );

    try {
      if (blob.type.startsWith('image/')) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new window.Image();

        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            canvas.width = 1500;
            canvas.height = 1500;
            ctx?.drawImage(img, 0, 0, 1500, 1500);
            canvas.toBlob((fallbackBlob) => {
              if (fallbackBlob) {
                finalBlob = fallbackBlob;
                extension = '.jpg';
              }
              resolve();
            }, 'image/jpeg', 0.7);
          };
          img.onerror = () => reject(new Error('Fallback image load failed'));
          img.src = URL.createObjectURL(blob);
        });
      }
    } catch (fallbackError) {
      console.warn(`Fallback compression also failed for ${obs.id}, using original:`, fallbackError);
    }
  }

  if (blob.type.startsWith('image/')) {
    const timestamp = resolveObservationDateTime(obs);
    const timestampLabel = `${timestamp.toLocaleDateString('en-GB')} ${timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
    const siteLabel =
      obs.sites?.name?.trim() ||
      obs.site_name?.trim() ||
      (obs.site_id ? `${obs.site_id.slice(0, 8)}…` : null);
    const userLabel =
      obs.user_name?.trim() ||
      obs.user_email?.trim() ||
      obs.profiles?.email?.trim() ||
      `User ${obs.user_id.slice(0, 8)}…`;
    try {
      finalBlob = await overlayTimestampOnImage(finalBlob, {
        timestamp: timestampLabel,
        site: siteLabel,
        // user: userLabel,
        siteLogoUrl: obs.sites?.logo_url ?? null,
      });
      extension = '.jpg';
    } catch (overlayError) {
      console.warn(`Failed to apply timestamp overlay for observation ${obs.id}:`, overlayError);
    }
  }

  const date = resolveObservationDateTime(obs).toISOString();
  const dateStr = new Date(date).toISOString().split('T')[0];
  const site = obs.sites?.name
    ? `_${obs.sites.name.replace(/[^a-zA-Z0-9]/g, '_')}`
    : obs.site_id
      ? `_site_${obs.site_id.slice(0, 8)}`
      : '';
  const filename = `${dateStr}${site}_${obs.id.slice(0, 8)}${extension}`;

  return { blob: finalBlob, filename };
}
