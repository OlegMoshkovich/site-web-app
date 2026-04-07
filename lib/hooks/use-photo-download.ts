import { useCallback } from 'react';
import { buildObservationPhotoDownloadBlob } from '@/lib/build-observation-download-blob';
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
            const built = await buildObservationPhotoDownloadBlob(obs.signedUrl, obs, targetSizeKB);
            if (!built) continue;

            zip.file(built.filename, built.blob);
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
