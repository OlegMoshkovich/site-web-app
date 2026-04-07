"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Info,
  X,
  Download,
  ZoomIn,
  ZoomOut,
  Loader2,
  ArrowLeft,
  Edit3,
  Check,
  Trash2,
} from "lucide-react";
import jsPDF from 'jspdf';
import { useRouter, useParams } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { generateWordReport, downloadWordDocument } from "@/lib/wordExport";
import Image from "next/image";
import { translations, type Language } from "@/lib/translations";
import { resolveObservationDateTime } from "@/lib/observation-dates";
import { getLabelsForSite, type Label } from "@/lib/labels";
import { PdfPlanCanvas } from "@/components/pdf-plan-canvas";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Report {
  id: string;
  title: string;
  description: string | null;
  ersteller?: string | null;
  baustelle?: string | null;
  report_date?: string | null;
  created_at: string;
  updated_at: string;
  settings: Record<string, unknown>;
}

interface Observation {
  id: string;
  plan: string | null;
  labels: string[] | null;
  user_id: string;
  note: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  photo_url: string | null;
  plan_url: string | null;
  plan_anchor: Record<string, unknown> | null;
  anchor_x: number | null;
  anchor_y: number | null;
  photo_date: string | null;
  taken_at: string | null;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  site_id: string | null;
  sites?: { name: string; logo_url?: string | null } | null;
}

interface ObservationWithUrl extends Observation {
  signedUrl: string | null;
}

const BUCKET = "photos";

const normalizePath = (v?: string | null) =>
  (v ?? "").trim().replace(/^\/+/, "") || null;

// Inline editable text field — click to edit, blur/Enter to save
function EditableText({
  value,
  onSave,
  multiline = false,
  className = "",
  placeholder = "Click to edit...",
  enabled = true,
}: {
  value: string;
  onSave: (newValue: string) => void;
  multiline?: boolean;
  className?: string;
  placeholder?: string;
  enabled?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) setDraft(value);
  }, [value, isEditing]);

  const commit = () => {
    setIsEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== value) onSave(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setDraft(value); setIsEditing(false); }
    if (!multiline && e.key === "Enter") { e.preventDefault(); commit(); }
    if (multiline && e.key === "Enter" && (e.ctrlKey || e.metaKey)) commit();
  };

  if (!enabled) {
    return <span className={className}>{value || <span className="text-gray-400 italic">{placeholder}</span>}</span>;
  }

  if (isEditing) {
    const sharedClass = `w-full bg-transparent border-b-2 border-blue-400 outline-none ${className}`;
    return multiline ? (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={`${sharedClass} resize-none`}
        rows={3}
      />
    ) : (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={sharedClass}
      />
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={`cursor-text hover:bg-blue-50 rounded px-1 -mx-1 transition-colors group relative ${className}`}
      title="Click to edit"
    >
      {value || <span className="text-gray-400 italic">{placeholder}</span>}
    </span>
  );
}

export default function ReportDetailPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [observations, setObservations] = useState<ObservationWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingWord, setIsGeneratingWord] = useState(false);
  const [language, setLanguage] = useState<Language>("de");
  const [labelRemoveConfirm, setLabelRemoveConfirm] = useState<{ observationId: string; label: string } | null>(null);

  // Quality selector state
  const [showQualityDialog, setShowQualityDialog] = useState(false);
  const [downloadType, setDownloadType] = useState<'pdf' | 'word' | null>(null);

  // Photo modal state
  const [selectedPhoto, setSelectedPhoto] = useState<ObservationWithUrl | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const reportId = params.id as string;

  // Translation function
  const t = (key: keyof typeof translations.en) => {
    const value = translations[language][key] || translations.en[key];
    return typeof value === 'string' ? value : '';
  };

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'de')) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Photo modal handlers
  const openPhotoModal = (observation: ObservationWithUrl) => {
    setSelectedPhoto(observation);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const closePhotoModal = () => {
    setSelectedPhoto(null);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Zoom and pan handlers
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.01;
    const newScale = Math.min(Math.max(0.5, scale + delta), 3);
    setScale(newScale);
  }, [scale]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [scale, position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const zoomIn = useCallback(() => {
    const newScale = Math.min(scale * 1.3, 3);
    setScale(newScale);
  }, [scale]);

  const zoomOut = useCallback(() => {
    const newScale = Math.max(scale / 1.3, 0.5);
    setScale(newScale);
    if (newScale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  // Inline edit handlers
  const handleUpdateReport = useCallback(async (
    field: 'title' | 'description' | 'ersteller' | 'baustelle',
    value: string
  ) => {
    if (!report) return;
    setReport(prev => prev ? { ...prev, [field]: value || null } : prev);
    const { error } = await supabase.from('reports').update({ [field]: value || null }).eq('id', reportId);
    if (error) console.error('Error updating report:', error);
  }, [report, supabase, reportId]);

  // Pending observation changes — accumulated locally, committed on button press
  const [pendingChanges, setPendingChanges] = useState<Record<string, { note?: string | null; labels?: string[] | null }>>({});
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleUpdateObservationNote = useCallback((observationId: string, note: string) => {
    setObservations(prev => prev.map(o => o.id === observationId ? { ...o, note: note || null } : o));
    setPendingChanges(prev => ({ ...prev, [observationId]: { ...prev[observationId], note: note || null } }));
  }, []);

  const handleUpdateObservationLabels = useCallback((observationId: string, labels: string[]) => {
    const next = labels.length > 0 ? labels : null;
    setObservations(prev => prev.map(o => o.id === observationId ? { ...o, labels: next } : o));
    setPendingChanges(prev => ({ ...prev, [observationId]: { ...prev[observationId], labels: next } }));
  }, []);

  const handleRemoveObservation = useCallback(async (observationId: string) => {
    if (!confirm('Remove this observation from the report?')) return;
    const { error } = await supabase
      .from('report_observations')
      .delete()
      .eq('report_id', reportId)
      .eq('observation_id', observationId);
    if (error) {
      alert('Failed to remove observation.');
      return;
    }
    setObservations(prev => prev.filter(o => o.id !== observationId));
  }, [supabase, reportId]);

  const handleCommitChanges = useCallback(async () => {
    const entries = Object.entries(pendingChanges);
    if (entries.length === 0) return;
    setIsSavingAll(true);
    try {
      const results = await Promise.all(
        entries.map(([observationId, changes]) =>
          supabase.from('observations').update(changes).eq('id', observationId).select('id')
        )
      );
      const failed = results.filter(r => r.error || !r.data || r.data.length === 0);
      if (failed.length > 0) {
        alert(`${failed.length} change(s) could not be saved. You may not have permission to edit these observations.`);
      } else {
        setPendingChanges({});
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (error) {
      console.error('Error committing changes:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSavingAll(false);
    }
  }, [pendingChanges, supabase]);

  // Plan data map: plan UUID → { url, name, isPdf }
  const [planDataMap, setPlanDataMap] = useState<Record<string, { url: string; name: string; isPdf: boolean } | null>>({});

  // Plan anchor editing state
  const [editingAnchorFor, setEditingAnchorFor] = useState<string | null>(null); // observation id
  const [pendingAnchorMap, setPendingAnchorMap] = useState<Record<string, { x: number; y: number }>>({});

  const handlePlanClick = useCallback((e: React.MouseEvent<HTMLDivElement>, obsId: string) => {
    if (editingAnchorFor !== obsId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setPendingAnchorMap(prev => ({ ...prev, [obsId]: { x, y } }));
  }, [editingAnchorFor]);

  const handleSaveAnchor = useCallback(async (obsId: string) => {
    const anchor = pendingAnchorMap[obsId];
    if (!anchor) return;
    const { error } = await supabase.from('observations').update({ plan_anchor: anchor }).eq('id', obsId);
    if (error) { console.error('Error saving anchor:', error); return; }
    setObservations(prev => prev.map(o => o.id === obsId ? { ...o, plan_anchor: anchor } : o));
    setEditingAnchorFor(null);
    setPendingAnchorMap(prev => { const n = { ...prev }; delete n[obsId]; return n; });
  }, [supabase, pendingAnchorMap, setObservations]);

  // Resolve anchor coordinates from plan_anchor JSONB or legacy anchor_x/anchor_y
  const getAnchorPoint = (obs: Observation): { x: number; y: number } | null => {
    const anchor = obs.plan_anchor;
    if (anchor && typeof anchor === 'object' && anchor.x != null && anchor.y != null && !(anchor.x === 0 && anchor.y === 0)) {
      return { x: Number(anchor.x), y: Number(anchor.y) };
    }
    if (obs.anchor_x != null && obs.anchor_y != null && !(obs.anchor_x === 0 && obs.anchor_y === 0)) {
      return { x: obs.anchor_x, y: obs.anchor_y };
    }
    return null;
  };

  // Available site labels + dropdown state
  const [siteLabels, setSiteLabels] = useState<Label[]>([]);
  const [addingLabelFor, setAddingLabelFor] = useState<string | null>(null);
  const [labelFilter, setLabelFilter] = useState('');

  // Mouse and touch event listeners for modal
  useEffect(() => {
    if (!selectedPhoto) return;

    const container = imageContainerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      container.removeEventListener('wheel', handleWheel);
      if (isDragging) {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      }
    };
  }, [selectedPhoto, handleWheel, isDragging, handleMouseMove, handleMouseUp]);

  // Handler functions for report actions

  // Renders first page of a PDF plan URL onto an offscreen canvas (objectFit:contain, white bg)
  const renderPdfPlanToCanvas = async (url: string, cw: number, ch: number): Promise<HTMLCanvasElement> => {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

    const pdfDoc = await pdfjsLib.getDocument({ url }).promise;
    const page = await pdfDoc.getPage(1);
    const viewport = page.getViewport({ scale: 1 });
    const scale = Math.min(cw / viewport.width, ch / viewport.height);
    const scaledVp = page.getViewport({ scale });

    const offscreen = document.createElement('canvas');
    offscreen.width = Math.ceil(scaledVp.width);
    offscreen.height = Math.ceil(scaledVp.height);
    await page.render({ canvas: offscreen, viewport: scaledVp }).promise;

    const out = document.createElement('canvas');
    out.width = cw;
    out.height = ch;
    const ctx = out.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(offscreen, Math.floor((cw - scaledVp.width) / 2), Math.floor((ch - scaledVp.height) / 2));
    pdfDoc.destroy();
    return out;
  };

  const handleExportReport = async (quality: 'low' | 'medium' | 'high' = 'medium') => {
    try {
      setIsGeneratingPDF(true);

      // Quality settings: compression ratio for JPEG
      const qualityMap = {
        low: 0.5,
        medium: 0.7,
        high: 1.0  // Maximum quality (no compression)
      };
      const imageQuality = qualityMap[quality];

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 14;

      // Function to add header to current page
      const addHeader = async (isFirstPage: boolean = false) => {
        let yPosition = margin;

        // Header section with professional styling and logo
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        const reportTitle = report?.title || 'INSPECTION REPORT';

        // Calculate available width for text (account for logo space)
        const logoWidth = 30;
        const logoSpace = 45; // Logo width + some margin
        const maxTextWidth = pageWidth - margin - logoSpace;
        // Split title if it's too long to avoid logo overlap
        const titleLines = pdf.splitTextToSize(reportTitle, maxTextWidth);
        pdf.text(titleLines, margin, yPosition);
        yPosition += titleLines.length * 7; // Adjust for multiple lines

        // Add site logo in top-right corner if available
        if (observations.length > 0 && observations[0].sites?.logo_url) {
          try {
            const logoImg = new window.Image();
            logoImg.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
              logoImg.onload = resolve;
              logoImg.onerror = reject;
              logoImg.src = observations[0].sites!.logo_url!;
            });

            const logoCanvas = document.createElement('canvas');
            const logoCtx = logoCanvas.getContext('2d');
            logoCanvas.width = logoImg.width;
            logoCanvas.height = logoImg.height;
            if (logoCtx) {
              logoCtx.fillStyle = 'white';
              logoCtx.fillRect(0, 0, logoCanvas.width, logoCanvas.height);
              logoCtx.drawImage(logoImg, 0, 0);
            }

            const logoData = logoCanvas.toDataURL('image/jpeg', imageQuality);

            // Position logo in top-right
            const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
            pdf.addImage(logoData, 'JPEG', pageWidth - margin - logoWidth, margin - 5, logoWidth, logoHeight);
          } catch (error) {
            console.error('Error adding site logo to PDF header:', error);
          }
        }

        yPosition += 3;

        // Only show description on first page
        if (isFirstPage) {
          // Project details
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          const reportDescription = report?.description || 'Baustelleninspektion Dokumentation';

          // Split description if it's too long to avoid logo overlap
          const descriptionLines = pdf.splitTextToSize(reportDescription, maxTextWidth);
          pdf.text(descriptionLines, margin, yPosition);
          yPosition += descriptionLines.length * 5; // Adjust for multiple lines
        }

        // Show Ersteller, Baustelle, and Date on every page
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');

        // Add Ersteller if available
        if (report?.ersteller) {
          pdf.text(`Ersteller: ${report.ersteller}`, margin, yPosition);
          yPosition += 5;
        }

        // Add Baustelle if available
        if (report?.baustelle) {
          pdf.text(`Baustelle: ${report.baustelle}`, margin, yPosition);
          yPosition += 5;
        }

        const dateText = report?.report_date
          ? new Date(report.report_date).toLocaleDateString('de-DE', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            })
          : new Date().toLocaleDateString('de-DE', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            });
        pdf.setFont('helvetica', 'bold');
        pdf.text('Datum: ', margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        const datumWidth = pdf.getTextWidth('Datum: ');
        pdf.text(dateText, margin + datumWidth + 1, yPosition);
        yPosition += 6;

        // Add a horizontal separator line under the header
        pdf.setLineWidth(0.3);
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 5;

        return yPosition;
      };

      // Add header to first page with full details
      let yPosition = await addHeader(true);

      // Process each observation
      for (let i = 0; i < observations.length; i++) {
        const observation = observations[i];

        // Check if we need a new page - adjusted for 2 observations per page
        if (yPosition > pageHeight - 120) {
          pdf.addPage();
          yPosition = await addHeader(false); // Add header to new page without description
        }

        // Add observation content
        if (observation.signedUrl) {
          try {
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = observation.signedUrl!;
            });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Aggressive scaling for smaller PDF file size
            // Target around 400px max dimension to significantly reduce file size
            const maxDimension = 400;
            const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);

            if (ctx) {
              // Use medium quality smoothing to reduce processing overhead
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'medium';

              // Create rounded rectangle clipping path
              const radius = Math.round(10 * scale); // Scale radius proportionally
              ctx.beginPath();
              ctx.roundRect(0, 0, canvas.width, canvas.height, radius);
              ctx.clip();

              // Draw the scaled image with rounded corners
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            }

            const imgData = canvas.toDataURL('image/jpeg', imageQuality);

            // Calculate image dimensions for PDF - increased size for 2 per page
            const imgWidth = 74;
            const imgHeight = (img.height / img.width) * imgWidth;

            // Add image
            pdf.addImage(imgData, 'JPEG', margin, yPosition, imgWidth, imgHeight);

            // Timestamp at bottom-left of photo
            const photoTimestamp = resolveObservationDateTime(observation).toLocaleDateString('de-DE', {
              year: 'numeric', month: '2-digit', day: '2-digit'
            });
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(255, 255, 255);
            pdf.text(photoTimestamp, margin + 2, yPosition + imgHeight - 2);
            pdf.setTextColor(0, 0, 0);

            // Add text content next to image
            const textStartX = margin + imgWidth + 10;
            const textWidth = pageWidth - textStartX - margin;
            let textY = yPosition + 5;

            // 1. Beschreibung (note) — first item
            if (observation.note) {
              pdf.setFontSize(10);
              pdf.setFont('helvetica', 'bold');
              pdf.text('Beschreibung:', textStartX, textY);
              textY += 5;
              pdf.setFont('helvetica', 'normal');
              const noteText = observation.note.replace(/^Beschreibung:\s*/i, '');
              const noteLines = pdf.splitTextToSize(noteText, textWidth);
              pdf.text(noteLines, textStartX, textY);
              textY += noteLines.length * 5 + 4;
            }

            // 2. Aufgenommen am
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Aufgenommen am: ', textStartX, textY);
            pdf.setFont('helvetica', 'normal');
            const timestamp = resolveObservationDateTime(observation).toLocaleDateString('de-DE', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            });
            const aufgenommenWidth = pdf.getTextWidth('Aufgenommen am: ');
            pdf.text(timestamp, textStartX + aufgenommenWidth + 2, textY);
            textY += 10;

            // 3. Labels — each as a bordered badge
            if (observation.labels && observation.labels.length > 0) {
              pdf.setFontSize(8);
              pdf.setFont('helvetica', 'normal');

              const badgeHeight = 5;
              const padX = 2.5;
              const gapX = 2;
              const gapY = 2;
              let bx = textStartX;

              for (const label of observation.labels) {
                const tw = pdf.getTextWidth(label);
                const bw = tw + padX * 2;

                // Wrap to next row if badge doesn't fit
                if (bx + bw > textStartX + textWidth && bx > textStartX) {
                  bx = textStartX;
                  textY += badgeHeight + gapY;
                }

                // Draw border
                pdf.setDrawColor(120, 120, 120);
                pdf.setLineWidth(0.3);
                pdf.rect(bx, textY - 3.5, bw, badgeHeight, 'S');

                // Draw label text
                pdf.text(label, bx + padX, textY);

                bx += bw + gapX;
              }

              textY += badgeHeight + 3;
            }

            // Add plan if available (both image and PDF plans)
            if (observation.plan && planDataMap[observation.plan]) {
              const planInfo = planDataMap[observation.plan]!;
              const anchor = getAnchorPoint(observation);
              try {
                const planPdfWidth = textWidth;
                const planPdfHeight = 50; // fixed height in mm for consistent layout
                // Render at 300 DPI (11.81 px/mm) for sharp plan output in the PDF
                const PX_PER_MM = 11.81;
                const cw = Math.round(planPdfWidth * PX_PER_MM);
                const ch = Math.round(planPdfHeight * PX_PER_MM);
                // Anchor dot radius scaled to match canvas resolution
                const dotRadius = Math.round(7 * PX_PER_MM / 3.78);

                let planCanvas: HTMLCanvasElement;

                if (planInfo.isPdf) {
                  planCanvas = await renderPdfPlanToCanvas(planInfo.url, cw, ch);
                } else {
                  const planImg = new window.Image();
                  planImg.crossOrigin = 'anonymous';
                  await new Promise((resolve, reject) => {
                    planImg.onload = resolve;
                    planImg.onerror = reject;
                    planImg.src = planInfo.url;
                  });

                  planCanvas = document.createElement('canvas');
                  planCanvas.width = cw;
                  planCanvas.height = ch;
                  const planCtx = planCanvas.getContext('2d');
                  if (planCtx) {
                    const imgAspect = planImg.width / planImg.height;
                    const containerAspect = cw / ch;
                    let dw: number, dh: number, dx: number, dy: number;
                    if (imgAspect > containerAspect) {
                      dw = cw; dh = cw / imgAspect; dx = 0; dy = (ch - dh) / 2;
                    } else {
                      dh = ch; dw = ch * imgAspect; dy = 0; dx = (cw - dw) / 2;
                    }
                    planCtx.fillStyle = 'white';
                    planCtx.fillRect(0, 0, cw, ch);
                    planCtx.drawImage(planImg, dx, dy, dw, dh);
                  }
                }

                // Draw red anchor dot on top of whichever canvas was rendered
                if (anchor) {
                  const planCtx = planCanvas.getContext('2d');
                  if (planCtx) {
                    const dotX = anchor.x * cw;
                    const dotY = anchor.y * ch;
                    planCtx.beginPath();
                    planCtx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
                    planCtx.fillStyle = 'red';
                    planCtx.fill();
                    planCtx.strokeStyle = 'white';
                    planCtx.lineWidth = dotRadius * 0.4;
                    planCtx.stroke();
                  }
                }

                // Label
                textY += 3;
                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'bold');
                pdf.text('Planposition:', textStartX, textY);
                textY += 4;

                const planImgData = planCanvas.toDataURL('image/jpeg', imageQuality);
                pdf.addImage(planImgData, 'JPEG', textStartX, textY, planPdfWidth, planPdfHeight);

                // Plan name below image
                pdf.setFontSize(7);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(100, 100, 100);
                const planNameLines = pdf.splitTextToSize(planInfo.name, planPdfWidth);
                pdf.text(planNameLines, textStartX + 1, textY + planPdfHeight + 3);
                pdf.setTextColor(0, 0, 0);

                textY += planPdfHeight + planNameLines.length * 3 + 5;
              } catch (err) {
                console.error('Error adding plan to PDF:', err);
              }
            }

            //spacing
            yPosition += Math.max(imgHeight, textY - yPosition) + 10;

          } catch (error) {
            console.error('Error adding observation to PDF:', error);
            // Fallback: just add text without image
            if (observation.note) {
              pdf.setFontSize(10);
              pdf.setFont('helvetica', 'normal');
              pdf.text(`${i + 1}. ${observation.note}`, margin, yPosition);
              yPosition += 8;
            }

            if (observation.labels && observation.labels.length > 0) {
              pdf.setFontSize(10);
              pdf.setFont('helvetica', 'bold');
              pdf.text('Labels:', margin, yPosition);
              pdf.setFont('helvetica', 'normal');
              const bereichWidth = pdf.getTextWidth('Labels:');
              pdf.text(observation.labels.join(', '), margin + bereichWidth + 2, yPosition);
              yPosition += 8;
            }

            yPosition += 8;
          }
        }
      }

      // Add footer to all pages
      const totalPages = (pdf.internal as unknown as { getNumberOfPages(): number }).getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);

        // Footer line
        pdf.setLineWidth(0.1);
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);

        // Footer text (page numbers only)
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Seite ${i}/${totalPages}`, pageWidth - margin - 10, pageHeight - 12);
      }

      // Save the PDF
      const filename = report?.title ? `${report.title.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf` : `report-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleExportWord = async (quality: 'low' | 'medium' | 'high' = 'medium') => {
    try {
      setIsGeneratingWord(true);

      // Prepare report data
      const reportData = {
        title: report?.title,
        description: report?.description,
        ersteller: report?.ersteller,
        baustelle: report?.baustelle,
        report_date: report?.report_date,
        created_at: report?.created_at
      };

      // Display settings - for now we'll include everything
      const displaySettings = {
        photo: true,
        note: true,
        labels: true,
        gps: true
      };

      // Generate Word document with quality parameter
      const blob = await generateWordReport(observations, reportData, displaySettings, quality);

      // Download the document
      const filename = report?.title
        ? `${report.title.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.docx`
        : `report-${new Date().toISOString().split('T')[0]}.docx`;

      downloadWordDocument(blob, filename);

    } catch (error) {
      console.error('Error generating Word document:', error);
      alert('Error generating Word document. Please try again.');
    } finally {
      setIsGeneratingWord(false);
    }
  };

  // Check authentication status
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);
      } catch (error) {
        console.error('Error getting user:', error);
        setIsAuthenticated(false);
      }
    };

    getUser();

    // Listen for auth changes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    const fetchReportAndObservations = async () => {
    try {
      setLoading(true);

      // Fetch report details
      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .select('id, title, description, ersteller, baustelle, report_date, created_at, updated_at, settings')
        .eq('id', reportId)
        .single();

      if (reportError) {
        console.error('Error fetching report:', reportError);
        router.push('/reports');
        return;
      }

      setReport(reportData);

      // First, get the observation IDs for this report in the order they were added
      const { data: reportObsData, error: reportObsError } = await supabase
        .from('report_observations')
        .select('observation_id, created_at')
        .eq('report_id', reportId)
        .order('created_at', { ascending: true });

      if (reportObsError) {
        console.error('Error fetching report observations:', reportObsError);
        return;
      }

      if (!reportObsData || reportObsData.length === 0) {
        setObservations([]);
        return;
      }

      // Extract observation IDs in the correct order
      const observationIds = reportObsData.map((item: { observation_id: string }) => item.observation_id);

      // Fetch the actual observations
      const { data: observationsData, error: obsError } = await supabase
        .from('observations')
        .select(`
          *,
          sites(name, logo_url)
        `)
        .in('id', observationIds);

      if (obsError) {
        console.error('Error fetching observations:', obsError);
        return;
      }

      // Sort observations to match the report order
      const sortedObservationsData = observationIds.map((id: string) =>
        observationsData.find((obs: Observation) => obs.id === id)
      ).filter(Boolean) as Observation[];

      // Show observations immediately with null URLs — don't block render
      const withPlaceholders: ObservationWithUrl[] = sortedObservationsData.map(obs => ({
        ...obs,
        signedUrl: null,
      }));
      setObservations(withPlaceholders);
      setLoading(false);

      // Build label list from two sources and merge:
      // 1. Labels extracted from observation.labels[] arrays (always available)
      const obsLabelNames = [...new Set(
        sortedObservationsData.flatMap((o: Observation) => o.labels || []).filter(Boolean)
      )] as string[];

      // 2. Labels from the labels table per site (may be empty if table isn't used)
      const uniqueSiteIds = [...new Set(sortedObservationsData.map((o: Observation) => o.site_id).filter(Boolean))] as string[];
      let dbLabels: Label[] = [];
      if (uniqueSiteIds.length > 0) {
        try {
          const allLabelArrays = await Promise.all(uniqueSiteIds.map(id => getLabelsForSite(id)));
          const seen = new Set<string>();
          dbLabels = allLabelArrays.flat().filter(l => { if (seen.has(l.name)) return false; seen.add(l.name); return true; });
        } catch (e) {
          console.error('Error fetching site labels:', e);
        }
      }

      // Merge: db labels first, then observation labels not already covered
      const dbLabelNames = new Set(dbLabels.map(l => l.name));
      const extraLabels: Label[] = obsLabelNames
        .filter(name => !dbLabelNames.has(name))
        .map(name => ({ id: `obs-${name}`, name, category: 'type' as const, order_index: 999 }));

      setSiteLabels([...dbLabels, ...extraLabels]);

      // Fetch plan signed URLs for observations that have a plan
      const uniquePlanIds = [...new Set(
        sortedObservationsData.filter((o: Observation) => o.plan).map((o: Observation) => o.plan as string)
      )];
      if (uniquePlanIds.length > 0) {
        try {
          const { data: planRows } = await supabase
            .from('site_plans')
            .select('id, plan_name, plan_url, site_id')
            .in('id', uniquePlanIds);
          if (planRows) {
            const planMap: Record<string, { url: string; name: string; isPdf: boolean } | null> = {};
            await Promise.all(planRows.map(async (plan: { id: string; plan_name: string; plan_url: string; site_id: string }) => {
              try {
                const fileName = plan.plan_url.split('/').pop()?.split('?')[0];
                const filePath = `${plan.site_id}/${fileName}`;
                const { data: urlData } = await supabase.storage
                  .from('plans')
                  .createSignedUrl(filePath, 604800);
                if (urlData) {
                  const isPdf = (fileName ?? '').toLowerCase().endsWith('.pdf');
                  planMap[plan.id] = { url: urlData.signedUrl, name: plan.plan_name, isPdf };
                } else {
                  planMap[plan.id] = null;
                }
              } catch {
                planMap[plan.id] = null;
              }
            }));
            setPlanDataMap(planMap);
          }
        } catch (e) {
          console.error('Error fetching plan data:', e);
        }
      }

      // Generate signed URLs in batches of 20, progressively updating the UI
      const BATCH_SIZE = 20;
      const photoObs = sortedObservationsData.filter(obs => obs.photo_url);

      for (let i = 0; i < photoObs.length; i += BATCH_SIZE) {
        const batch = photoObs.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map(async (obs: Observation) => {
            const normalizedPath = normalizePath(obs.photo_url);
            if (!normalizedPath) return { id: obs.id, signedUrl: null };
            try {
              const { data: urlData } = await supabase.storage
                .from(BUCKET)
                .createSignedUrl(normalizedPath, 3600);
              return { id: obs.id, signedUrl: urlData?.signedUrl || null };
            } catch (error) {
              console.error(`Error getting signed URL for ${obs.photo_url}:`, error);
              return { id: obs.id, signedUrl: null };
            }
          })
        );

        setObservations(prev =>
          prev.map(obs => {
            const result = batchResults.find(r => r.id === obs.id);
            return result ? { ...obs, signedUrl: result.signedUrl } : obs;
          })
        );
      }
    } catch (error) {
      console.error('Error fetching report and observations:', error);
      setLoading(false);
    }
    };

    fetchReportAndObservations();
  }, [reportId, router, supabase]);


  const processLabel = (label: string) => {
    const cleanLabel = label.trim();
    let processedLabel = cleanLabel;

    if (cleanLabel.includes(" ")) {
      processedLabel = cleanLabel;
    } else if (cleanLabel.includes("_")) {
      processedLabel = cleanLabel.replace(/_/g, " ");
    } else if (cleanLabel.includes("-")) {
      processedLabel = cleanLabel.replace(/-/g, " ");
    } else {
      processedLabel = cleanLabel
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
        .replace(/([a-z])([0-9])/g, "$1 $2")
        .replace(/([0-9])([a-zA-Z])/g, "$1 $2");
    }

    return processedLabel.replace(/\s+/g, " ").trim();
  };


  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center">
        <div className="flex-1 w-full flex flex-col gap-0 items-center">
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading report...</div>
          </div>
        </div>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="min-h-screen flex flex-col items-center">
        <div className="flex-1 w-full flex flex-col gap-0 items-center">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Report not found</h3>
            <p className="text-gray-500 mb-4">The report you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
            <Button onClick={() => router.push('/reports')} variant="outline">
              Back to Reports
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top navigation bar */}
      <nav className="sticky top-0 z-20 w-full flex justify-center h-16 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="w-full flex justify-between items-center px-2 sm:px-4 text-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/')}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            >
              <Image
                src="/images/banner_logo.png"
                alt="Site Logo"
                width={120}
                height={32}
                className="w-auto object-contain lg:h-6 h-5"
              />
            </button>
            {isAuthenticated && (
              <button
                onClick={() => router.push('/reports')}
                className="hover:bg-gray-100 transition-colors p-1 rounded ml-4"
                title="Back to Reports"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setDownloadType('pdf');
                setShowQualityDialog(true);
              }}
              variant="outline"
              size="sm"
              className="h-8 px-3 transition-all"
              title="Download PDF Report"
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="hidden sm:inline ml-1">
                {isGeneratingPDF ? 'Generating...' : 'PDF'}
              </span>
            </Button>
            <Button
              onClick={() => {
                setDownloadType('word');
                setShowQualityDialog(true);
              }}
              variant="outline"
              size="sm"
              className="h-8 px-3 transition-all hidden sm:inline-flex"
              title="Download Word Report"
              disabled={isGeneratingWord}
            >
              {isGeneratingWord ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="hidden sm:inline ml-1">
                {isGeneratingWord ? 'Generating...' : 'Word'}
              </span>
            </Button>
            {isAuthenticated && Object.keys(pendingChanges).length > 0 && (
              <Button
                onClick={handleCommitChanges}
                disabled={isSavingAll}
                size="sm"
                className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white transition-all"
                title="Save pending changes to database"
              >
                {isSavingAll ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving...</>
                ) : saveSuccess ? (
                  <>✓ Saved</>
                ) : (
                  <>Save ({Object.keys(pendingChanges).length})</>
                )}
              </Button>
            )}
            <Button
              onClick={() => setShowInfoModal(true)}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 transition-all"
              title="Info"
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center">
        {/* Main content */}
        <div className="flex-1 flex flex-col gap-6 max-w-4xl px-3 sm:px-5 py-6 w-full print:max-w-none print:px-4 print:py-2">
          {/* Report Info Card */}
          <Card>
            <CardHeader>
              {/* Title and Logo on same line */}
              <div className="flex justify-between items-center mb-4">
                <CardTitle className="flex-1">
                  <EditableText
                    value={report.title}
                    onSave={(v) => handleUpdateReport('title', v)}
                    enabled={isAuthenticated}
                    className="text-xl font-semibold"
                  />
                </CardTitle>
                {/* Site Logo */}
                {observations.length > 0 && observations[0].sites?.logo_url && (
                  <div className="flex-shrink-0">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2">
                      <img
                        src={observations[0].sites.logo_url}
                        alt={`${observations[0].sites.name} logo`}
                        className="h-10 sm:h-12 w-auto object-contain rounded"
                      />
                    </div>
                  </div>
                )}
              </div>
              {/* Description */}
              <div className="mt-3">
                <CardDescription className="text-black text-sm pb-3" style={{ fontSize: '14px' }}>
                  <EditableText
                    value={report.description || ''}
                    onSave={(v) => handleUpdateReport('description', v)}
                    multiline
                    enabled={isAuthenticated}
                    placeholder="Add description..."
                  />
                </CardDescription>
              </div>
              <div className="flex justify-start">
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          {/* <Calendar className="h-4 w-4" /> */}
                          <span>Erstellt {formatDate(report.report_date || report.created_at)}</span>
                        </div>
                      </div>
            </CardHeader>

            <CardContent className="pt-0">
              {/* All unique labels */}
              {(() => {
                const allLabels = observations.flatMap(obs => obs.labels || []);
                const uniqueLabels = [...new Set(allLabels)];
                if (uniqueLabels.length > 0) {
                  return (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Labels</h4>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {uniqueLabels.map((label, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {processLabel(label)}
                          </Badge>
                        ))}
                      </div>

                    </div>
                  );
                }
                return null;
              })()}
            </CardContent>
          </Card>

          {/* Observations */}
          {observations.length > 0 ? (
            <div className="space-y-4">
              <div className="grid gap-4 print:gap-2">
                {observations.map((observation, index) => (
                  <Card key={observation.id} className="overflow-hidden print:break-inside-avoid p-0">
                    <div className="flex flex-col lg:flex-row print:flex-row items-center lg:items-stretch print:items-stretch">
                      {/* Image */}
                      {observation.signedUrl && (
                        <div
                          className="flex-shrink-0 relative bg-transparent cursor-pointer w-80 lg:w-80 lg:border lg:border-gray-200 flex items-center justify-center"
                          onClick={() => openPhotoModal(observation)}
                        >
                          <Image
                            src={observation.signedUrl}
                            alt="Observation"
                            width={400}
                            height={300}
                            className="w-full h-auto object-contain hover:opacity-90 transition-opacity"
                            style={{ maxHeight: '280px' }}
                          />
                          {/* Photo number overlay */}
                          <div className="absolute top-0 left-0 w-8 h-8 bg-black text-white flex items-center justify-center text-sm font-bold shadow-md">
                            {index + 1}
                          </div>
                          {/* Site Logo overlay on each photo */}
                          {observation.sites?.logo_url && (
                            <div className="absolute bottom-2 right-2 z-10">
                              <div className="rounded-lg p-1.5 opacity-80">
                                <img
                                  src={observation.sites.logo_url}
                                  alt={`${observation.sites.name} logo`}
                                  className="h-6 w-auto object-contain rounded opacity-90"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 w-full lg:w-auto">
                        {/* Always show CardHeader for consistent layout */}
                        <CardHeader className="pb-3 print:pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 flex-1 min-w-0">
                              <CardTitle className={`text-lg print:text-base ${!observation.note ? 'text-gray-600' : ''}`}>
                                <EditableText
                                  value={observation.note || ''}
                                  onSave={(v) => handleUpdateObservationNote(observation.id, v)}
                                  multiline
                                  enabled={isAuthenticated}
                                  placeholder={`Fotodokumentation ${index + 1}`}
                                />
                              </CardTitle>
                            </div>
                            {isAuthenticated && (
                              <button
                                onClick={() => handleRemoveObservation(observation.id)}
                                className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors p-1 rounded print:hidden"
                                title="Remove from report"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </CardHeader>

                        <CardContent className="pt-0 print:pt-0">
                          <div className="space-y-3 print:space-y-2">
                            {/* Labels */}
                            <div className="flex flex-wrap gap-1 items-center">
                              {[...new Set(observation.labels || [])].map((label) => (
                                <Badge
                                  key={`${observation.id}-${label}`}
                                  variant="outline"
                                  className="text-xs px-1.5 py-0.5 flex items-center gap-1"
                                >
                                  {processLabel(label)}
                                  {isAuthenticated && (
                                    <button
                                      onClick={() => setLabelRemoveConfirm({ observationId: observation.id, label })}
                                      className="ml-0.5 hover:text-red-500 transition-colors leading-none"
                                      title="Remove label"
                                    >
                                      ×
                                    </button>
                                  )}
                                </Badge>
                              ))}

                              {/* Add label */}
                              {isAuthenticated && (
                                addingLabelFor === observation.id ? (
                                  <div className="relative">
                                    {/* Backdrop to close on outside click */}
                                    <div
                                      className="fixed inset-0 z-40"
                                      onClick={() => { setAddingLabelFor(null); setLabelFilter(''); }}
                                    />
                                    <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg w-52">
                                      {/* Filter input */}
                                      <div className="p-2 border-b border-gray-100">
                                        <input
                                          autoFocus
                                          type="text"
                                          value={labelFilter}
                                          onChange={(e) => setLabelFilter(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Escape') { setAddingLabelFor(null); setLabelFilter(''); }
                                          }}
                                          className="w-full text-xs border border-gray-300 rounded px-2 py-1 outline-none focus:border-blue-400"
                                          placeholder="Search labels..."
                                        />
                                      </div>
                                      {/* Label list */}
                                      <div className="max-h-48 overflow-y-auto py-1">
                                        {siteLabels
                                          .filter(l =>
                                            !(observation.labels || []).includes(l.name) &&
                                            l.name.toLowerCase().includes(labelFilter.toLowerCase())
                                          )
                                          .map(label => (
                                            <button
                                              key={label.id}
                                              onMouseDown={(e) => {
                                                // Use mousedown so it fires before the backdrop onClick
                                                e.preventDefault();
                                                handleUpdateObservationLabels(
                                                  observation.id,
                                                  [...(observation.labels || []), label.name]
                                                );
                                                setAddingLabelFor(null);
                                                setLabelFilter('');
                                              }}
                                              className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors"
                                            >
                                              {label.name}
                                            </button>
                                          ))}
                                        {siteLabels.filter(l =>
                                          !(observation.labels || []).includes(l.name) &&
                                          l.name.toLowerCase().includes(labelFilter.toLowerCase())
                                        ).length === 0 && (
                                          <div className="px-3 py-2 text-xs text-gray-400 italic">No labels available</div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => { setAddingLabelFor(observation.id); setLabelFilter(''); }}
                                    className="text-xs border border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors px-1.5 py-0.5 rounded"
                                    title="Add label"
                                  >
                                    + label
                                  </button>
                                )
                              )}
                            </div>

                            {/* Plan widget */}
                            {observation.plan && planDataMap[observation.plan] && (() => {
                              const planData = planDataMap[observation.plan!]!;
                              const savedAnchor = getAnchorPoint(observation);
                              const isEditing = editingAnchorFor === observation.id;
                              const pending = pendingAnchorMap[observation.id];
                              const displayAnchor = pending ?? savedAnchor;
                              return (
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-semibold text-gray-900">Planposition</h4>
                                    {isAuthenticated && (
                                      isEditing ? (
                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={() => handleSaveAnchor(observation.id)}
                                            disabled={!pending}
                                            className="text-green-600 hover:text-green-700 disabled:opacity-40 p-1 transition-colors"
                                            title="Save position"
                                          >
                                            <Check className="h-4 w-4" />
                                          </button>
                                          <button
                                            onClick={() => { setEditingAnchorFor(null); setPendingAnchorMap(prev => { const n={...prev}; delete n[observation.id]; return n; }); }}
                                            className="text-gray-500 hover:text-red-600 p-1 transition-colors"
                                            title="Cancel"
                                          >
                                            <X className="h-4 w-4" />
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => { setEditingAnchorFor(observation.id); setPendingAnchorMap(prev => { const n={...prev}; delete n[observation.id]; return n; }); }}
                                          className="text-gray-500 hover:text-blue-600 p-1 transition-colors"
                                          title="Edit plan position"
                                        >
                                          <Edit3 className="h-4 w-4" />
                                        </button>
                                      )
                                    )}
                                  </div>
                                  {isEditing && (
                                    <p className="text-xs text-gray-500 mb-1">Click on the plan to set a new position</p>
                                  )}
                                  <div
                                    className="relative border border-gray-200 rounded-lg overflow-hidden"
                                    style={{ width: 320, height: 280, cursor: isEditing ? 'crosshair' : 'default' }}
                                    onClick={(e) => handlePlanClick(e, observation.id)}
                                  >
                                    {planData.isPdf ? (
                                      <PdfPlanCanvas url={planData.url} width={320} height={280} />
                                    ) : (
                                      /* eslint-disable-next-line @next/next/no-img-element */
                                      <img
                                        src={planData.url}
                                        alt={planData.name}
                                        style={{ width: 320, height: 280, objectFit: 'contain', display: 'block' }}
                                      />
                                    )}
                                    {displayAnchor && (
                                      <div
                                        className="absolute pointer-events-none"
                                        style={{
                                          left: displayAnchor.x * 320 - 7,
                                          top: displayAnchor.y * 280 - 7,
                                          width: 14,
                                          height: 14,
                                          borderRadius: 7,
                                          backgroundColor: pending ? 'blue' : 'red',
                                          border: '2px solid white',
                                          zIndex: 1,
                                        }}
                                      />
                                    )}
                                    <div className="absolute bottom-1 left-2 text-xs text-gray-500 bg-white/80 px-1 rounded">
                                      {planData.name}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Date + pending indicator */}
                            <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
                              <span>{formatDate(resolveObservationDateTime(observation).toISOString())}</span>
                              {pendingChanges[observation.id] && (
                                <span className="text-amber-500">unsaved</span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No observations found in this report.</p>
            </div>
          )}
        </div>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Simple Site Mobile App</h2>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              <div>
                <p className="text-gray-600 mb-4">Unverzichtbar für das Sammeln von Beobachtungen vor Ort</p>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-gray-700">Fotos aufnehmen und Notizen vor Ort hinzufügen</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-gray-700">GPS-Standortverfolgung</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-gray-700">Automatische Synchronisation mit Ihren Standorten</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Web vs Mobile:</h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Web Portal:</h4>
                    <p className="text-gray-600 text-sm">Team-Beobachtungen anzeigen, Berichte erstellen und Einstellungen verwalten</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900">Mobile App:</h4>
                    <p className="text-gray-600 text-sm">Erforderlich für das Sammeln von Beobachtungen vor Ort</p>
                  </div>
                </div>
              </div>

              {/* App Store Button */}
              <div className="text-center">
                <a
                  href="https://apps.apple.com/us/app/simple-site/id6749160249"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block hover:opacity-80 transition-opacity"
                >
                  <Image
                    src="/app_screens/available-app-store_1.png"
                    alt="Available on the App Store"
                    width={180}
                    height={60}
                    className="mx-auto"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && selectedPhoto.signedUrl && (
        <div className="fixed inset-0 bg-white backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full h-full max-w-7xl max-h-full flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-white/95 backdrop-blur-sm border-b border-gray-200">
              <div className="text-gray-900">
                <h3 className="text-lg font-semibold">
                  {selectedPhoto.note || `Fotodokumentation ${observations.findIndex(obs => obs.id === selectedPhoto.id) + 1}`}
                </h3>
                <p className="text-sm text-gray-600">
                  {resolveObservationDateTime(selectedPhoto).toLocaleDateString('de-DE', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  })}
                </p>
              </div>
              <button
                onClick={closePhotoModal}
                className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Image Container */}
            <div
              ref={imageContainerRef}
              className="flex-1 relative bg-gray-100 overflow-hidden"
              style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
            >
              {/* Zoom Controls */}
              <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
                <button
                  onClick={zoomIn}
                  className="bg-white/90 hover:bg-white text-gray-700 p-2 transition-colors rounded shadow-lg border border-gray-200"
                  disabled={scale >= 3}
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  onClick={zoomOut}
                  className="bg-white/90 hover:bg-white text-gray-700 p-2 transition-colors rounded shadow-lg border border-gray-200"
                  disabled={scale <= 0.5}
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                {scale !== 1 && (
                  <button
                    onClick={resetZoom}
                    className="bg-white/90 hover:bg-white text-gray-700 px-2 py-1 text-xs transition-colors rounded shadow-lg border border-gray-200"
                  >
                    1:1
                  </button>
                )}
              </div>

              {/* Zoom indicator */}
              {scale !== 1 && (
                <div className="absolute bottom-4 right-4 z-30 bg-white/90 text-gray-700 px-2 py-1 text-xs rounded shadow-lg border border-gray-200">
                  {Math.round(scale * 100)}%
                </div>
              )}

              {/* Site logo overlay */}
              {selectedPhoto.sites?.logo_url && (
                <div className="absolute top-4 left-4 z-30">
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-gray-200">
                    <img
                      src={selectedPhoto.sites.logo_url}
                      alt={`${selectedPhoto.sites.name} logo`}
                      className="w-12 h-12 object-contain rounded"
                    />
                  </div>
                </div>
              )}

              {/* Zoomable/Pannable Image Container */}
              <div
                className="absolute inset-0 transition-transform duration-200 ease-out"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transformOrigin: 'center center'
                }}
                onMouseDown={handleMouseDown}
              >
                <Image
                  src={selectedPhoto.signedUrl}
                  alt="Observation"
                  fill
                  className="object-contain select-none"
                  sizes="100vw"
                  draggable={false}
                />
              </div>
            </div>

            {/* Bottom Info Panel */}
            <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4 max-h-32 overflow-y-auto">
              <div className="space-y-2">
                {selectedPhoto.labels && selectedPhoto.labels.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">{t("labelsTitle")}</h4>
                    <div className="flex flex-wrap gap-2">
                      {[...new Set(selectedPhoto.labels)].map((label, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 border border-gray-300 bg-gray-50 rounded"
                        >
                          {processLabel(label)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedPhoto.note && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">{t("noteTitle")}</h4>
                    <p className="text-sm text-gray-700">{selectedPhoto.note}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quality Selection Dialog */}
      {showQualityDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {language === "de" ? "Fotoqualität auswählen" : "Select Photo Quality"}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {language === "de"
                ? `Wählen Sie die Qualität für Fotos in Ihrem ${downloadType === 'pdf' ? 'PDF' : 'Word'}-Dokument. Höhere Qualität erzeugt größere Dateien.`
                : `Choose the quality for photos in your ${downloadType === 'pdf' ? 'PDF' : 'Word'} document. Higher quality produces larger files.`}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowQualityDialog(false);
                  if (downloadType === 'pdf') {
                    handleExportReport('low');
                  } else {
                    handleExportWord('low');
                  }
                }}
                className="w-full p-4 text-left border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="font-semibold">
                  {language === "de" ? "Niedrige Qualität" : "Low Quality"}
                </div>
                <div className="text-sm text-gray-600">
                  {language === "de"
                    ? downloadType === 'pdf' ? "0.5 JPEG-Kompression - Kleinere Dateigröße" : "Kleinere Bilder - Kleinere Dateigröße"
                    : downloadType === 'pdf' ? "0.5 JPEG compression - Smaller file size" : "Smaller images - Smaller file size"}
                </div>
              </button>
              <button
                onClick={() => {
                  setShowQualityDialog(false);
                  if (downloadType === 'pdf') {
                    handleExportReport('medium');
                  } else {
                    handleExportWord('medium');
                  }
                }}
                className="w-full p-4 text-left border-2 border-blue-500 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="font-semibold flex items-center gap-2">
                  {language === "de" ? "Mittlere Qualität" : "Medium Quality"}
                  <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                    {language === "de" ? "Empfohlen" : "Recommended"}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {language === "de"
                    ? downloadType === 'pdf' ? "0.7 JPEG-Kompression - Ausgewogene Qualität" : "Mittlere Bilder - Ausgewogene Qualität"
                    : downloadType === 'pdf' ? "0.7 JPEG compression - Balanced quality" : "Medium images - Balanced quality"}
                </div>
              </button>
              <button
                onClick={() => {
                  setShowQualityDialog(false);
                  if (downloadType === 'pdf') {
                    handleExportReport('high');
                  } else {
                    handleExportWord('high');
                  }
                }}
                className="w-full p-4 text-left border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="font-semibold">
                  {language === "de" ? "Hohe Qualität" : "High Quality"}
                </div>
                <div className="text-sm text-gray-600">
                  {language === "de"
                    ? downloadType === 'pdf' ? "1.0 JPEG (unkomprimiert) - Maximale Qualität, sehr große Datei" : "3200×2400px Bilder - Maximale Qualität, sehr große Datei"
                    : downloadType === 'pdf' ? "1.0 JPEG (uncompressed) - Maximum quality, very large file" : "3200×2400px images - Maximum quality, very large file"}
                </div>
              </button>
            </div>
            <div className="flex justify-end mt-6">
              <Button
                onClick={() => setShowQualityDialog(false)}
                variant="outline"
              >
                {language === "de" ? "Abbrechen" : "Cancel"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>

    <ConfirmDialog
      isOpen={labelRemoveConfirm !== null}
      message={`Remove label "${labelRemoveConfirm?.label}"?`}
      onConfirm={() => {
        if (labelRemoveConfirm) {
          handleUpdateObservationLabels(
            labelRemoveConfirm.observationId,
            (observations.find(o => o.id === labelRemoveConfirm.observationId)?.labels || []).filter(l => l !== labelRemoveConfirm.label)
          );
        }
        setLabelRemoveConfirm(null);
      }}
      onCancel={() => setLabelRemoveConfirm(null)}
    />
    </>
  );
}
