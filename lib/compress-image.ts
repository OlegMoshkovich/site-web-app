/**
 * Compresses an image blob using a multi-pass approach to reach a target size.
 * Returns the original blob unchanged for non-image types.
 */
export function compressImageForDownload(blob: Blob, targetSizeKB: number = 2000): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!blob.type.startsWith('image/')) {
      resolve(blob);
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new window.Image();

      const timeout = setTimeout(() => {
        reject(new Error('Image compression timeout'));
      }, 30000);

      img.onload = () => {
        try {
          clearTimeout(timeout);

          const compressionPasses = [
            { maxDim: 3000, quality: 0.9 },
            { maxDim: 2500, quality: 0.85 },
            { maxDim: 2000, quality: 0.8 },
            { maxDim: 1500, quality: 0.75 },
          ];

          let passIndex = 0;

          const tryPass = () => {
            if (passIndex >= compressionPasses.length) {
              canvas.width = 1200;
              canvas.height = 1200;
              ctx?.drawImage(img, 0, 0, 1200, 1200);
              canvas.toBlob((finalBlob) => {
                resolve(finalBlob || blob);
              }, 'image/jpeg', 0.7);
              return;
            }

            const pass = compressionPasses[passIndex];
            let { width, height } = img;

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

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((compressedBlob) => {
              if (!compressedBlob) {
                passIndex++;
                tryPass();
                return;
              }
              if (compressedBlob.size <= targetSizeKB * 1024) {
                resolve(compressedBlob);
              } else {
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

      img.crossOrigin = 'anonymous';
      img.src = URL.createObjectURL(blob);
    } catch (error) {
      reject(error);
    }
  });
}
