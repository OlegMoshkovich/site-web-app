/**
 * Download utilities for handling photo downloads and ZIP creation
 */

import { compressImageForDownload, simpleImageCompression } from './image-utils';

// Extended observation interface for download operations
interface ObservationWithUrl {
  id: string;
  signedUrl: string | null;
  taken_at?: string | null;
  created_at: string;
  sites?: { name: string } | null;
  site_id?: string | null;
}

/**
 * Downloads photos for selected observations as a ZIP file
 * @param selectedObservations - Set of selected observation IDs
 * @param observations - Array of all observations with signed URLs
 * @param language - Current language for UI feedback
 */
export async function downloadPhotosAsZip(
  selectedObservations: Set<string>, 
  observations: ObservationWithUrl[], 
  language: 'en' | 'de' = 'en'
) {
  if (selectedObservations.size === 0) return;

  try {
    // Get selected observations
    const selectedObs = observations.filter(obs =>
      selectedObservations.has(obs.id)
    );

    // Filter only observations that have photos
    const obsWithPhotos = selectedObs.filter(obs => obs.signedUrl);

    if (obsWithPhotos.length === 0) {
      const message = language === 'de' ? "Keine Fotos in ausgewählten Beobachtungen gefunden" : "No photos found in selected observations";
      alert(message);
      return;
    }

    // Dynamically import JSZip
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    let downloadCount = 0;

    // Download each photo and add to ZIP
    for (const obs of obsWithPhotos) {
      try {
        if (obs.signedUrl) {
          // Fetch the image
          const response = await fetch(obs.signedUrl);
          if (!response.ok) continue;

          const blob = await response.blob();

          // Try to compress the image for download, fallback to original if it fails
          let finalBlob = blob;
          let extension = blob.type.includes('jpeg') || blob.type.includes('jpg') ? '.jpg' :
                         blob.type.includes('png') ? '.png' : '.jpg';

          try {
            // Attempt compression for images only (target 30KB for very small files)
            if (blob.type.startsWith('image/')) {
              const compressedBlob = await compressImageForDownload(blob, 30);
              finalBlob = compressedBlob;
              extension = '.jpg'; // Compressed images are always JPEG
            }
          } catch (compressionError) {
            console.warn(`Failed to compress image for observation ${obs.id}, attempting basic fallback compression:`, compressionError);

            // Try a simple fallback compression
            try {
              if (blob.type.startsWith('image/')) {
                const fallbackBlob = await simpleImageCompression(blob);
                finalBlob = fallbackBlob;
                extension = '.jpg';
              }
            } catch (fallbackError) {
              console.warn(`Fallback compression also failed for ${obs.id}, using original:`, fallbackError);
              // Keep using the original blob and extension
            }
          }

          // Create a filename based on observation data
          const date = obs.taken_at || obs.created_at;
          const dateStr = new Date(date).toISOString().split('T')[0];
          const site = obs.sites?.name ? `_${obs.sites.name.replace(/[^a-zA-Z0-9]/g, '_')}` : obs.site_id ? `_site_${obs.site_id.slice(0, 8)}` : '';

          const filename = `${dateStr}${site}_${obs.id.slice(0, 8)}${extension}`;

          // Add image to ZIP (compressed or original)
          zip.file(filename, finalBlob);
          downloadCount++;
        }
      } catch (error) {
        console.error(`Failed to download photo for observation ${obs.id}:`, error);
        // Continue with other photos
      }
    }

    if (downloadCount === 0) {
      const message = language === 'de' ? "Fehler beim Herunterladen der Fotos" : "Failed to download any photos";
      alert(message);
      return;
    }

    // Generate ZIP file
    const zipBlob = await zip.generateAsync({ type: "blob" });

    // Download the ZIP file
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `observations_photos_${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error("Error downloading photos:", error);
    const message = language === 'de' ? "Fehler beim Herunterladen der Fotos. Bitte versuchen Sie es erneut." : "Failed to download photos. Please try again.";
    alert(message);
  }
}