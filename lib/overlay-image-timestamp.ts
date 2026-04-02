/**
 * Metadata burned into downloaded observation photos (logo top-left, text bottom-right).
 */
export type PhotoDownloadOverlayInfo = {
  timestamp: string;
  site?: string | null;
  user?: string | null;
  /** Public URL for site logo; drawn top-left when load succeeds */
  siteLogoUrl?: string | null;
};

const MAX_LINE_CHARS = 96;
const OVERLAY_TIMEOUT_MS = 30000;

function truncateLine(s: string): string {
  const t = s.trim();
  if (t.length <= MAX_LINE_CHARS) return t;
  return `${t.slice(0, MAX_LINE_CHARS - 1)}…`;
}

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const timeout = setTimeout(() => {
      URL.revokeObjectURL(url);
      reject(new Error('Main image load timeout'));
    }, OVERLAY_TIMEOUT_MS);

    img.onload = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load main image for overlay'));
    };
    img.crossOrigin = 'anonymous';
    const url = URL.createObjectURL(blob);
    img.src = url;
  });
}

function loadImageFromUrl(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const timeout = setTimeout(() => {
      reject(new Error('Logo load timeout'));
    }, OVERLAY_TIMEOUT_MS);

    img.onload = () => {
      clearTimeout(timeout);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Failed to load site logo'));
    };
    img.crossOrigin = 'anonymous';
    img.src = src;
  });
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
  });
}

/**
 * Draws optional site logo top-left (with translucent white underlay) and text bottom-right; returns a JPEG blob.
 */
export async function overlayTimestampOnImage(
  blob: Blob,
  info: PhotoDownloadOverlayInfo
): Promise<Blob> {
  if (!blob.type.startsWith('image/')) {
    return blob;
  }

  const mainImg = await loadImageFromBlob(blob);

  let logoImg: HTMLImageElement | null = null;
  const logoUrl = info.siteLogoUrl?.trim();
  if (logoUrl) {
    try {
      logoImg = await loadImageFromUrl(logoUrl);
    } catch {
      logoImg = null;
    }
  }

  const lines = [info.timestamp, info.site?.trim(), info.user?.trim()]
    .filter((x): x is string => Boolean(x))
    .map(truncateLine);

  const hasText = lines.length > 0;
  if (!hasText && !logoImg) {
    return blob;
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  const w = mainImg.naturalWidth;
  const h = mainImg.naturalHeight;
  canvas.width = w;
  canvas.height = h;

  ctx.drawImage(mainImg, 0, 0, w, h);

  const pad = Math.max(8, Math.round(Math.min(w, h) * 0.015));

  if (logoImg) {
    const maxLogo = Math.min(w, h) * 0.14;
    const lw = logoImg.naturalWidth;
    const lh = logoImg.naturalHeight;
    if (lw > 0 && lh > 0) {
      const scale = Math.min(maxLogo / lw, maxLogo / lh, 1);
      const dw = lw * scale;
      const dh = lh * scale;
      const logoInnerPad = Math.max(6, Math.round(pad * 0.45));
      const logoBoxX = pad - logoInnerPad;
      const logoBoxY = pad - logoInnerPad;
      const logoBoxW = dw + logoInnerPad * 2;
      const logoBoxH = dh + logoInnerPad * 2;
      const logoR = Math.min(10, logoInnerPad * 0.9);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
      ctx.beginPath();
      ctx.roundRect(logoBoxX, logoBoxY, logoBoxW, logoBoxH, logoR);
      ctx.fill();
      ctx.drawImage(logoImg, pad, pad, dw, dh);
    }
  }

  if (hasText) {
    let fontSize = Math.min(52, Math.max(14, Math.round(Math.min(w, h) * 0.028)));
    const fontFamily = 'system-ui, -apple-system, sans-serif';
    const maxTextWidth = w * 0.88 - pad * 2;
    const lineHeight = () => fontSize * 1.22;

    const measureMaxWidth = (fs: number) => {
      ctx.font = `400 ${fs}px ${fontFamily}`;
      return Math.max(...lines.map((line) => ctx.measureText(line).width));
    };

    while (fontSize >= 12 && measureMaxWidth(fontSize) > maxTextWidth) {
      fontSize = Math.max(12, Math.floor(fontSize * 0.92));
    }

    ctx.font = `400 ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';

    const textX = w - pad;
    const lh = lineHeight();
    const totalTextH = lines.length * lh;
    const boxPadX = pad * 0.6;
    const boxPadY = pad * 0.35;
    const maxLineW = Math.max(...lines.map((line) => ctx.measureText(line).width));
    const boxW = maxLineW + boxPadX * 2;
    const boxH = totalTextH + boxPadY * 2;
    const boxX = textX - maxLineW - boxPadX;
    const boxY = h - pad - boxH;
    const textY = boxY + boxPadY;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    const r = Math.min(10, fontSize * 0.35);
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, r);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    lines.forEach((line, i) => {
      ctx.fillText(line, textX, textY + i * lh);
    });
  }

  const out = await canvasToJpegBlob(canvas, 0.92);
  return out ?? blob;
}
