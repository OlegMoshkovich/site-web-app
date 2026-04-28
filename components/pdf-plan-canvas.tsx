'use client';

import { useEffect, useRef, useState } from 'react';

interface PdfPlanCanvasProps {
  url: string;
  width: number;
  height: number;
  fit?: 'contain' | 'fill';
}

/**
 * Renders the first page of a PDF to a <canvas> at exactly width×height CSS pixels.
 * The canvas backing store is scaled by devicePixelRatio (minimum 2×) so the output
 * is crisp on retina / HiDPI displays.
 *
 * The page is scaled with objectFit:contain (letterboxed, white background) so
 * that anchor coordinates (anchorX * width, anchorY * height) map directly to
 * CSS pixel positions regardless of the PDF page's natural aspect ratio.
 */
export function PdfPlanCanvas({ url, width, height, fit = 'contain' }: PdfPlanCanvasProps) {
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

        // Use at least 2× for quality; respect device pixel ratio on HiDPI screens
        const dpr = Math.max(typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1, 2);
        const physW = Math.round(width  * dpr);
        const physH = Math.round(height * dpr);

        // Scale the PDF page to fit the requested box.
        const viewport = page.getViewport({ scale: 1 });
        const scale =
          fit === 'fill'
            ? Math.max(physW / viewport.width, physH / viewport.height)
            : Math.min(physW / viewport.width, physH / viewport.height);
        const scaledViewport =
          fit === 'fill'
            ? page.getViewport({
                scale,
                // Keep default rotation; the destination canvas stretch below removes
                // letterboxing so normalized calibration coordinates stay exact.
              })
            : page.getViewport({ scale });

        const offsetX = Math.floor((physW - scaledViewport.width)  / 2);
        const offsetY = Math.floor((physH - scaledViewport.height) / 2);

        // Render page to an offscreen canvas at the high-res scaled size
        const offscreen = document.createElement('canvas');
        offscreen.width  = Math.ceil(scaledViewport.width);
        offscreen.height = Math.ceil(scaledViewport.height);

        await page.render({ canvas: offscreen, viewport: scaledViewport }).promise;
        if (cancelled) { pdf.destroy(); return; }

        const canvas = canvasRef.current;
        if (!canvas) { pdf.destroy(); return; }

        // Set physical pixel dimensions and CSS display dimensions separately
        canvas.width  = physW;
        canvas.height = physH;
        canvas.style.width  = `${width}px`;
        canvas.style.height = `${height}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) { pdf.destroy(); return; }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, physW, physH);
        if (fit === 'fill') {
          ctx.drawImage(offscreen, 0, 0, physW, physH);
        } else {
          ctx.drawImage(offscreen, offsetX, offsetY);
        }

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
  }, [url, width, height, fit]);

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
