import { useCallback } from 'react';
import { compressImageForDownload } from '@/lib/compress-image';
import { resolveObservationDateTime } from '@/lib/observation-dates';
import type { ObservationWithUrl } from '@/lib/store/observations-store';

export function usePhotoDownload(
  selectedObservations: Set<string>,
  observations: ObservationWithUrl[]
) {
  const handleDownloadPhotos = useCallback(async (quality: 'low' | 'medium' | 'high' = 'medium') => {
    if (selectedObservations.size === 0) return;

    try {
      const qualityMap = {
        low: 800,
        medium: 2000,
        high: 10000,
      };
      const targetSizeKB = qualityMap[quality];

      const selectedObs = observations.filter(obs => selectedObservations.has(obs.id));
      const obsWithPhotos = selectedObs.filter(obs => obs.signedUrl);

      if (obsWithPhotos.length === 0) {
        alert("No photos found in selected observations");
        return;
      }

      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      let downloadCount = 0;

      for (const obs of obsWithPhotos) {
        try {
          if (obs.signedUrl) {
            const response = await fetch(obs.signedUrl);
            if (!response.ok) continue;

            const blob = await response.blob();
            let finalBlob = blob;
            let extension = blob.type.includes('jpeg') || blob.type.includes('jpg') ? '.jpg' :
                           blob.type.includes('png') ? '.png' : '.jpg';

            try {
              if (blob.type.startsWith('image/')) {
                const compressedBlob = await compressImageForDownload(blob, targetSizeKB);
                finalBlob = compressedBlob;
                extension = '.jpg';
              }
            } catch (compressionError) {
              console.warn(`Failed to compress image for observation ${obs.id}, attempting basic fallback compression:`, compressionError);

              try {
                if (blob.type.startsWith('image/')) {
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  const img = new window.Image();

                  await new Promise((resolve, reject) => {
                    img.onload = () => {
                      canvas.width = 1500;
                      canvas.height = 1500;
                      ctx?.drawImage(img, 0, 0, 1500, 1500);
                      canvas.toBlob((fallbackBlob) => {
                        if (fallbackBlob) {
                          finalBlob = fallbackBlob;
                          extension = '.jpg';
                        }
                        resolve(fallbackBlob);
                      }, 'image/jpeg', 0.7);
                    };
                    img.onerror = reject;
                    img.src = URL.createObjectURL(blob);
                  });
                }
              } catch (fallbackError) {
                console.warn(`Fallback compression also failed for ${obs.id}, using original:`, fallbackError);
              }
            }

            const date = resolveObservationDateTime(obs).toISOString();
            const dateStr = new Date(date).toISOString().split('T')[0];
            const site = obs.sites?.name ? `_${obs.sites.name.replace(/[^a-zA-Z0-9]/g, '_')}` : obs.site_id ? `_site_${obs.site_id.slice(0, 8)}` : '';
            const filename = `${dateStr}${site}_${obs.id.slice(0, 8)}${extension}`;

            zip.file(filename, finalBlob);
            downloadCount++;
          }
        } catch (error) {
          console.error(`Failed to download photo for observation ${obs.id}:`, error);
        }
      }

      if (downloadCount === 0) {
        alert("Failed to download any photos");
        return;
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
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
      alert("Failed to download photos. Please try again.");
    }
  }, [selectedObservations, observations]);

  return { handleDownloadPhotos };
}
