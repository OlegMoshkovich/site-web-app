'use client';

import { useEffect, useRef, useState } from 'react';

interface PdfPlanCanvasProps {
  url: string;
  width: number;
  height: number;
}

/**
 * Renders the first page of a PDF to a <canvas> at exactly width×height pixels.
 * The page is scaled with objectFit:contain (letterboxed, white background) so
 * that anchor coordinates (anchorX * width, anchorY * height) map directly to
 * canvas pixel positions regardless of the PDF page's natural aspect ratio.
 */
export function PdfPlanCanvas({ url, width, height }: PdfPlanCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      setLoading(true);
      setError(false);

      try {
        // Dynamic import keeps pdfjs out of the initial bundle
        const pdfjsLib = await import('pdfjs-dist');

        // Point at the CDN worker — avoids webpack/Next.js bundling complexity
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

        const loadingTask = pdfjsLib.getDocument({ url });
        const pdf = await loadingTask.promise;
        if (cancelled) { pdf.destroy(); return; }

        const page = await pdf.getPage(1);
        if (cancelled) { pdf.destroy(); return; }

        // Scale to contain within width×height (letterbox, white fill)
        const viewport = page.getViewport({ scale: 1 });
        const scale = Math.min(width / viewport.width, height / viewport.height);
        const scaledViewport = page.getViewport({ scale });

        const offsetX = Math.floor((width  - scaledViewport.width)  / 2);
        const offsetY = Math.floor((height - scaledViewport.height) / 2);

        // Render the page to an offscreen canvas at its natural scaled size,
        // then composite it centred onto the fixed-size output canvas.
        const offscreen = document.createElement('canvas');
        offscreen.width  = Math.ceil(scaledViewport.width);
        offscreen.height = Math.ceil(scaledViewport.height);

        await page.render({ canvas: offscreen, viewport: scaledViewport }).promise;
        if (cancelled) { pdf.destroy(); return; }

        const canvas = canvasRef.current;
        if (!canvas) { pdf.destroy(); return; }

        canvas.width  = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) { pdf.destroy(); return; }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(offscreen, offsetX, offsetY);

        pdf.destroy();
      } catch (err) {
        if (!cancelled) {
          console.error('PdfPlanCanvas: render error', err);
          setError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    render();
    return () => { cancelled = true; };
  }, [url, width, height]);

  if (error) {
    return (
      <div
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f3f4f6',
          color: '#9ca3af',
          fontSize: 13,
        }}
      >
        Unable to render PDF
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width, height }}>
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f9fafb',
          }}
        >
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400" />
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}
