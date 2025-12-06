/**
 * Image compression utilities for optimizing photos before download
 */

/**
 * Compresses an image blob using multi-pass approach
 * @param blob - The image blob to compress
 * @param targetSizeKB - Target size in kilobytes (default: 50)
 * @returns Promise that resolves to the compressed blob
 */
export function compressImageForDownload(blob: Blob, targetSizeKB: number = 50): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // If it's not an image, return as-is
    if (!blob.type.startsWith('image/')) {
      resolve(blob);
      return;
    }

    // Even if it's small, still compress it to ensure consistency
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = typeof window !== "undefined" ? new window.Image() : null;
      if (!img) {
        reject(new Error("Could not create Image object in this environment"));
        return;
      }

      // Set up timeout to prevent hanging
      const timeout = setTimeout(() => {
        reject(new Error('Image compression timeout'));
      }, 30000);

      img.onload = () => {
        try {
          clearTimeout(timeout);

          // Multi-pass compression: try different dimension sizes
          const compressionPasses = [
            { maxDim: 600, quality: 0.3 },  // Very aggressive first pass
            { maxDim: 500, quality: 0.25 }, // Even more aggressive
            { maxDim: 400, quality: 0.2 },  // Very small
            { maxDim: 300, quality: 0.15 }  // Tiny but readable
          ];

          let passIndex = 0;

          const tryPass = () => {
            if (passIndex >= compressionPasses.length) {
              // If all passes fail, use the tiniest possible version
              canvas.width = 200;
              canvas.height = 200;
              ctx?.drawImage(img, 0, 0, 200, 200);
              canvas.toBlob((finalBlob) => {
                resolve(finalBlob || blob);
              }, 'image/jpeg', 0.1);
              return;
            }

            const pass = compressionPasses[passIndex];
            let { width, height } = img;

            // Calculate dimensions for this pass
            if (width > height && width > pass.maxDim) {
              height = (height * pass.maxDim) / width;
              width = pass.maxDim;
            } else if (height > pass.maxDim) {
              width = (width * pass.maxDim) / height;
              height = pass.maxDim;
            }

            canvas.width = width;
            canvas.height = height;

            if (!ctx) {
              reject(new Error('Failed to get canvas context'));
              return;
            }

            // Draw image
            ctx.drawImage(img, 0, 0, width, height);

            // Try compression with current pass settings
            canvas.toBlob((compressedBlob) => {
              if (!compressedBlob) {
                passIndex++;
                tryPass(); // Try next pass
                return;
              }

              // If this pass achieves target size, use it
              if (compressedBlob.size <= targetSizeKB * 1024) {
                resolve(compressedBlob);
              } else {
                // Try next pass
                passIndex++;
                tryPass();
              }
            }, 'image/jpeg', pass.quality);
          };

          tryPass();
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      };

      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to load image for compression'));
      };

      // Set CORS to anonymous to handle cross-origin issues
      img.crossOrigin = 'anonymous';
      img.src = URL.createObjectURL(blob);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Attempts simple fallback compression for images
 * @param blob - The image blob to compress
 * @returns Promise that resolves to the compressed blob
 */
export function simpleImageCompression(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!blob.type.startsWith('image/')) {
      resolve(blob);
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = typeof window !== "undefined" ? new window.Image() : null;
      if (!img) {
        reject(new Error("Could not create Image object in this environment"));
        return;
      }

      img.onload = () => {
        // Very small dimensions
        canvas.width = 300;
        canvas.height = 300;
        ctx?.drawImage(img, 0, 0, 300, 300);

        canvas.toBlob((fallbackBlob) => {
          resolve(fallbackBlob || blob);
        }, 'image/jpeg', 0.1);
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(blob);
    } catch (error) {
      reject(error);
    }
  });
}