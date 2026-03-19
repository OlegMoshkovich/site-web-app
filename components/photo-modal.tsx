"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Modal } from "@/components/ui/modal";
import { PdfPlanCanvas } from "@/components/pdf-plan-canvas";
import { Calendar, MapPin, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Share, Edit3, X, Check, Printer, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { resolveObservationDateTime } from "@/lib/observation-dates";
import type { Observation } from "@/types/supabase";
import type { Label } from "@/lib/labels";

// Extended observation with signed URL for secure photo access
interface ObservationWithUrl extends Observation {
  signedUrl: string | null;      // Temporary signed URL for viewing the photo
  sites?: { name: string; logo_url?: string | null } | null; // Site information from join
  profiles?: { email: string } | null; // User profile information from join
  user_email?: string; // User email from the query
}

interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  observation: ObservationWithUrl;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onObservationUpdate?: (updatedObservation: ObservationWithUrl) => void;
  siteLabels?: Label[];
}

export function PhotoModal({ 
  isOpen, 
  onClose, 
  imageUrl, 
  observation, 
  onPrevious, 
  onNext, 
  hasPrevious = false, 
  hasNext = false,
  onObservationUpdate,
  siteLabels = []
}: PhotoModalProps) {
  const supabase = createClient();
  const [imageLoading, setImageLoading] = useState(true);
  const [shareSuccess, setShareSuccess] = useState(false);
  
  // Editing state
  const [editingNote, setEditingNote] = useState(false);
  const [editNoteValue, setEditNoteValue] = useState("");
  const [editingLabels, setEditingLabels] = useState(false);
  const [selectedLabelNames, setSelectedLabelNames] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  
  // Zoom and pan state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Plan preview state
  const [planImageData, setPlanImageData] = useState<{ url: string; name: string; isPdf: boolean } | null>(null);
  const [planImageLoading, setPlanImageLoading] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<{ id: string; plan_name: string; plan_url: string; site_id: string }[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Plan anchor editing state
  const [editingPlanAnchor, setEditingPlanAnchor] = useState(false);
  const [addingPlanAnchor, setAddingPlanAnchor] = useState(false);
  const [pendingAnchor, setPendingAnchor] = useState<{ x: number; y: number } | null>(null);

  // Resolve anchor coordinates from plan_anchor (jsonb)
  const anchorX: number | null = observation.plan_anchor?.x ?? null;
  const anchorY: number | null = observation.plan_anchor?.y ?? null;
  const hasPlanAnchor =
    anchorX != null && anchorY != null && !(anchorX === 0 && anchorY === 0);

  // Load all available plans for the site
  useEffect(() => {
    if ((!hasPlanAnchor && !addingPlanAnchor) || !observation.site_id) {
      setAvailablePlans([]);
      setPlanImageData(null);
      return;
    }

    let cancelled = false;

    const loadPlans = async () => {
      try {
        const { data, error } = await supabase
          .from('site_plans')
          .select('id, plan_name, plan_url, site_id')
          .eq('site_id', observation.site_id)
          .order('created_at', { ascending: false });

        if (cancelled || error || !data || data.length === 0) return;

        setAvailablePlans(data);

        // Default to the plan the observation was recorded on, or first plan
        const planId: string | null = observation.plan ?? null;
        const defaultPlan = data.find((p: any) => p.id === planId) ?? data[0];
        setSelectedPlanId(prev => prev ?? defaultPlan.id);
      } catch {}
    };

    loadPlans();
    return () => { cancelled = true; };
  }, [observation.id, observation.site_id, hasPlanAnchor, addingPlanAnchor]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load signed URL whenever selected plan changes
  useEffect(() => {
    if (!selectedPlanId || availablePlans.length === 0) return;

    const plan = availablePlans.find(p => p.id === selectedPlanId);
    if (!plan) return;

    let cancelled = false;

    const loadPlanUrl = async () => {
      setPlanImageLoading(true);
      setPlanImageData(null);
      try {
        const fileName = plan.plan_url.split('/').pop()?.split('?')[0];
        const filePath = `${plan.site_id}/${fileName}`;
        const { data: urlData } = await supabase.storage
          .from('plans')
          .createSignedUrl(filePath, 604800);

        if (!cancelled && urlData) {
          const isPdf = (fileName ?? '').toLowerCase().endsWith('.pdf');
          setPlanImageData({ url: urlData.signedUrl, name: plan.plan_name, isPdf });
        }
      } finally {
        if (!cancelled) setPlanImageLoading(false);
      }
    };

    loadPlanUrl();
    return () => { cancelled = true; };
  }, [selectedPlanId, availablePlans]); // eslint-disable-line react-hooks/exhaustive-deps

  // Portrait detection state
  const [isPortrait, setIsPortrait] = useState(false);

  // Reset zoom and pan when image changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsPortrait(false);
    // Only show loading state if there's an image to load
    setImageLoading(!!imageUrl);
  }, [imageUrl, observation.id]);

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

  // Touch events for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && scale > 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    }
  }, [scale, position]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Reset zoom function
  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Zoom in/out functions
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

  // Keyboard navigation and zoom
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'ArrowLeft' && hasPrevious && onPrevious && !isDragging) {
        onPrevious();
      } else if (e.key === 'ArrowRight' && hasNext && onNext && !isDragging) {
        onNext();
      } else if (e.key === 'Escape') {
        resetZoom();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        zoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        resetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, hasPrevious, hasNext, onPrevious, onNext, isDragging, resetZoom, zoomIn, zoomOut]);

  // Mouse and touch event listeners
  useEffect(() => {
    const container = imageContainerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      container.removeEventListener('wheel', handleWheel);
      if (isDragging) {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [handleWheel, isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

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

  // Reset editing state when observation changes
  useEffect(() => {
    setEditingNote(false);
    setEditingLabels(false);
    setEditNoteValue("");
    setSelectedLabelNames(new Set(observation.labels || []));
    setEditingPlanAnchor(false);
    setAddingPlanAnchor(false);
    setPendingAnchor(null);
    setSelectedPlanId(null);
    setAvailablePlans([]);
  }, [observation.id, observation.labels]);

  const handleShare = useCallback(async () => {
    try {
      const shareUrl = `${window.location.origin}/shared/${observation.id}`;
      await navigator.clipboard.writeText(shareUrl);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  }, [observation.id]);

  const handleStartEditNote = useCallback(() => {
    setEditNoteValue(observation.note || "");
    setEditingNote(true);
  }, [observation.note]);

  const handleCancelEditNote = useCallback(() => {
    setEditingNote(false);
    setEditNoteValue("");
  }, []);

  const handleSaveNote = useCallback(async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("observations")
        .update({ note: editNoteValue || null })
        .eq("id", observation.id);

      if (error) {
        console.error("Error updating note:", error);
        alert("Error updating note. Please try again.");
        setIsSaving(false);
        return;
      }

      const updatedObservation = { ...observation, note: editNoteValue || null };
      if (onObservationUpdate) {
        onObservationUpdate(updatedObservation);
      }
      
      setEditingNote(false);
      setEditNoteValue("");
    } catch (error) {
      console.error("Error updating note:", error);
      alert("Error updating note. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [supabase, observation, editNoteValue, onObservationUpdate]);

  const handleStartEditLabels = useCallback(() => {
    setSelectedLabelNames(new Set(observation.labels || []));
    setEditingLabels(true);
  }, [observation.labels]);

  const handleCancelEditLabels = useCallback(() => {
    setEditingLabels(false);
    setSelectedLabelNames(new Set(observation.labels || []));
  }, [observation.labels]);

  const handleToggleLabel = useCallback((labelName: string) => {
    setSelectedLabelNames(prev => {
      const newSet = new Set(prev);
      if (newSet.has(labelName)) {
        newSet.delete(labelName);
      } else {
        newSet.add(labelName);
      }
      return newSet;
    });
  }, []);

  const handleSaveLabels = useCallback(async () => {
    setIsSaving(true);
    try {
      // Convert selected label names to array
      const labels = Array.from(selectedLabelNames).filter(label => label.trim().length > 0);

      const { error } = await supabase
        .from("observations")
        .update({ labels: labels.length > 0 ? labels : null })
        .eq("id", observation.id);

      if (error) {
        console.error("Error updating labels:", error);
        alert("Error updating labels. Please try again.");
        setIsSaving(false);
        return;
      }

      const updatedObservation = { ...observation, labels: labels.length > 0 ? labels : null };
      if (onObservationUpdate) {
        onObservationUpdate(updatedObservation);
      }
      
      setEditingLabels(false);
    } catch (error) {
      console.error("Error updating labels:", error);
      alert("Error updating labels. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [supabase, observation, selectedLabelNames, onObservationUpdate]);

  const handleRemoveLabel = useCallback(async (labelName: string) => {
    const newLabels = (observation.labels || []).filter(l => l !== labelName);
    const next = newLabels.length > 0 ? newLabels : null;
    const { error } = await supabase
      .from("observations")
      .update({ labels: next })
      .eq("id", observation.id);
    if (error) { console.error("Error removing label:", error); return; }
    if (onObservationUpdate) onObservationUpdate({ ...observation, labels: next });
  }, [supabase, observation, onObservationUpdate]);

  const handlePrint = useCallback(() => {
    const dateStr = resolveObservationDateTime(observation).toLocaleString('en-GB');
    const siteName = observation.sites?.name || '';
    const labels  = observation.labels ? [...new Set(observation.labels)] : [];
    const note     = observation.note || '';
    const createdBy = observation.user_email || `User ${observation.user_id.slice(0, 8)}...`;
    const logoHtml  = observation.sites?.logo_url
      ? `<img src="${observation.sites.logo_url}" class="logo" />`
      : '';

    // ── Plan block ────────────────────────────────────────────────────────────
    // Use percentage-based positioning so the dot stays correct at any width.
    const dotL = `${((anchorX ?? 0) * 100).toFixed(2)}%`;
    const dotT = `${((anchorY ?? 0) * 100).toFixed(2)}%`;

    let planBlock = '';
    if (hasPlanAnchor && planImageData) {
      const dot = `<div class="dot" style="left:${dotL};top:${dotT};transform:translate(-50%,-50%);"></div>`;
      const namebar = `<div class="plan-name">${planImageData.name}</div>`;

      if (planImageData.isPdf) {
        planBlock = `
<div>
  <div class="col-head">Planposition</div>
  <div class="plan-wrap">
    <canvas id="pc" width="320" height="240" style="display:block;width:100%;height:auto;"></canvas>
    ${dot}${namebar}
  </div>
</div>
<script type="module">
  import * as pdfjs from 'https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.mjs';
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';
  const W=320,H=240;
  const pdf  = await pdfjs.getDocument({url:'${planImageData.url}'}).promise;
  const page = await pdf.getPage(1);
  const vp0  = page.getViewport({scale:1});
  const sc   = Math.min(W/vp0.width, H/vp0.height);
  const vp   = page.getViewport({scale:sc});
  const cv   = document.getElementById('pc');
  const ctx  = cv.getContext('2d');
  ctx.fillStyle='#fff'; ctx.fillRect(0,0,W,H);
  const ox=Math.floor((W-vp.width)/2), oy=Math.floor((H-vp.height)/2);
  const tmp=document.createElement('canvas');
  tmp.width=Math.ceil(vp.width); tmp.height=Math.ceil(vp.height);
  await page.render({canvas:tmp,viewport:vp}).promise;
  ctx.drawImage(tmp,ox,oy); pdf.destroy();
<\/script>`;
      } else {
        planBlock = `
<div>
  <div class="col-head">Planposition</div>
  <div class="plan-wrap">
    <img src="${planImageData.url}" style="width:100%;max-height:300px;object-fit:contain;display:block;" />
    ${dot}${namebar}
  </div>
</div>`;
      }
    }

    // ── HTML ──────────────────────────────────────────────────────────────────
    const safeNote = note.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const isPdf    = planImageData?.isPdf ?? false;

    const html = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"/>
<title>Observation – ${dateStr}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;color:#111;background:#fff;padding:18px;max-width:740px;margin:0 auto}
  /* Header */
  .hdr{display:flex;align-items:center;gap:10px;padding-bottom:8px;margin-bottom:10px;border-bottom:2px solid #111}
  .logo{width:34px;height:34px;object-fit:contain;border-radius:3px;flex-shrink:0}
  .site{font-size:14px;font-weight:700;line-height:1.2}
  .date{font-size:10px;color:#555}
  /* Visual section: column layout (photo then plan stacked) */
  .visual-col{display:flex;flex-direction:column;gap:12px;margin-bottom:10px}
  .col-head{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#6b7280;margin-bottom:4px}
  /* Photo */
  .photo-wrap{border:1px solid #e5e7eb;overflow:hidden}
  .photo-wrap img{width:100%;max-height:340px;object-fit:contain;display:block}
  .no-plan .photo-wrap img{max-height:440px}
  /* Plan */
  .plan-wrap{position:relative;display:block;border:1px solid #e5e7eb;overflow:hidden;width:100%}
  .dot{position:absolute;width:12px;height:12px;border-radius:50%;background:red;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.3);pointer-events:none}
  .plan-name{font-size:10px;color:#6b7280;padding:2px 5px;background:#f9fafb;border-top:1px solid #e5e7eb}
  /* Info */
  .info{display:grid;grid-template-columns:1fr 1fr;gap:3px 16px;margin-bottom:7px}
  .row{font-size:11px;color:#374151}
  .row b{font-weight:600}
  .section{margin-bottom:7px}
  .lbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#6b7280;margin-bottom:3px}
  .note{font-size:11px;line-height:1.55;color:#374151;white-space:pre-wrap}
  .tags{display:flex;flex-wrap:wrap;gap:3px}
  .tag{font-size:10px;border:1px solid #d1d5db;border-radius:3px;padding:1px 5px;color:#374151}
  @media print{body{padding:0}@page{margin:10mm;size:A4}.visual-col>div{break-inside:avoid}}
</style>
</head><body>

<div class="hdr">
  ${logoHtml}
  <div>
    ${siteName ? `<div class="site">${siteName}</div>` : ''}
    <div class="date">${dateStr}</div>
  </div>
</div>

<div class="visual-col${planBlock ? '' : ' no-plan'}">
  ${imageUrl ? `<div><div class="col-head">Photo</div><div class="photo-wrap"><img src="${imageUrl}" alt="photo"/></div></div>` : ''}
  ${planBlock}
</div>

${note ? `<div class="section"><div class="lbl">Description</div><p class="note">${safeNote}</p></div>` : ''}

<div class="info">
  <div class="row"><b>Created by:</b> ${createdBy}</div>
  ${observation.gps_lat != null && observation.gps_lng != null ? `<div class="row"><b>GPS:</b> ${observation.gps_lat.toFixed(6)}, ${observation.gps_lng.toFixed(6)}</div>` : ''}
</div>

${labels.length > 0 ? `<div class="section"><div class="lbl">Labels</div><div class="tags">${labels.map(l=>`<span class="tag">${l}</span>`).join('')}</div></div>` : ''}

<script>
  window.onload = function(){ setTimeout(function(){ window.print(); }, ${isPdf ? 2500 : 700}); };
<\/script>
</body></html>`;

    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
  }, [observation, imageUrl, hasPlanAnchor, planImageData, anchorX, anchorY]);

  const handlePlanImageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!editingPlanAnchor) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setPendingAnchor({ x, y });
  }, [editingPlanAnchor]);

  const handleSavePlanAnchor = useCallback(async () => {
    if (!pendingAnchor) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("observations")
        .update({ plan_anchor: pendingAnchor })
        .eq("id", observation.id);

      if (error) {
        console.error("Error updating plan anchor:", error);
        alert("Error updating plan position. Please try again.");
        return;
      }

      const updatedObservation = { ...observation, plan_anchor: pendingAnchor };
      if (onObservationUpdate) {
        onObservationUpdate(updatedObservation);
      }

      setEditingPlanAnchor(false);
      setAddingPlanAnchor(false);
      setPendingAnchor(null);
    } catch (error) {
      console.error("Error updating plan anchor:", error);
      alert("Error updating plan position. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [supabase, observation, pendingAnchor, onObservationUpdate]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-6xl mx-4">
      <div className="flex flex-col md:flex-row h-[76vh] md:h-[90vh] overflow-hidden">
        {/* Image container */}
        <div
          ref={imageContainerRef}
          className={`relative bg-gray-100 overflow-hidden md:flex-1 md:h-auto ${hasPlanAnchor || addingPlanAnchor ? 'h-[55%] flex-shrink-0' : 'flex-1 min-h-0'}`}
          style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
        >
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
            </div>
          )}
          
          {/* Site Logo */}
          {observation.sites?.logo_url && (
            <div className="absolute top-4 left-4 z-30">
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-2 shadow-lg opacity-80">
                <img 
                  src={observation.sites.logo_url} 
                  alt={`${observation.sites.name} logo`}
                  className="w-12 h-12 object-contain rounded opacity-90"
                />
              </div>
            </div>
          )}

          {/* Zoom controls - only show for images */}
          {imageUrl && (
            <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
              <button
                onClick={handleShare}
                className={`${shareSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-black hover:bg-gray-800'} text-white p-2 transition-colors`}
                aria-label="Share photo"
              >
                <Share className="h-4 w-4" />
              </button>
              <button
                onClick={handlePrint}
                className="hidden md:block bg-black hover:bg-gray-800 text-white p-2 transition-colors"
                aria-label="Print"
              >
                <Printer className="h-4 w-4" />
              </button>
              <button
                onClick={zoomIn}
                className="bg-black hover:bg-gray-800 text-white p-2 transition-colors"
                aria-label="Zoom in"
                disabled={scale >= 3}
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={zoomOut}
                className="bg-black hover:bg-gray-800 text-white p-2 transition-colors"
                aria-label="Zoom out"
                disabled={scale <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              {scale !== 1 && (
                <button
                  onClick={resetZoom}
                  className="bg-black hover:bg-gray-800 text-white px-2 py-1 text-xs transition-colors"
                  aria-label="Reset zoom"
                >
                  1:1
                </button>
              )}
            </div>
          )}

          {/* Share + print for text-only notes */}
          {!imageUrl && (
            <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
              <button
                onClick={handleShare}
                className={`${shareSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-black hover:bg-gray-800'} text-white p-2 transition-colors`}
                aria-label="Share note"
              >
                <Share className="h-4 w-4" />
              </button>
              <button
                onClick={handlePrint}
                className="hidden md:block bg-black hover:bg-gray-800 text-white p-2 transition-colors"
                aria-label="Print"
              >
                <Printer className="h-4 w-4" />
              </button>
            </div>
          )}
          
          {/* Zoom indicator */}
          {scale !== 1 && (
            <div className="absolute bottom-14 right-4 z-30 bg-black/70 text-white px-2 py-1 text-xs rounded">
              {Math.round(scale * 100)}%
            </div>
          )}
          
          {/* Timestamp and elevation tags overlay - full width bottom */}
          <div className="absolute bottom-0 left-0 right-0 z-30 bg-black/70 text-white px-3 py-2 text-xs flex items-center gap-2 flex-wrap">
            <span>{resolveObservationDateTime(observation).toLocaleString('en-GB')}</span>
            {(observation.sites?.name && observation.sites.name !== 'Munich') && (
              <>
                <span className="text-gray-300">•</span>
                <span>📍 {observation.sites.name}</span>
              </>
            )}
            {observation.labels && observation.labels.length > 0 && (
              <>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-1 flex-wrap">
                  {[...new Set(observation.labels)].map((label, idx) => (
                    <span key={idx} className="bg-white/20 px-1.5 py-0.5 rounded text-xs flex items-center gap-1">
                      {label}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveLabel(label); }}
                        className="hover:text-red-300 transition-colors leading-none"
                        title="Remove label"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
          
          {/* Previous button */}
          {hasPrevious && onPrevious && !isDragging && (
            <button
              onClick={onPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black hover:bg-gray-800 text-white p-2 transition-colors"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          
          {/* Next button */}
          {hasNext && onNext && !isDragging && (
            <button
              onClick={onNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black hover:bg-gray-800 text-white p-2 transition-colors"
              aria-label="Next photo"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
          
          {/* Zoomable/Pannable Image Container or Text Display */}
          {imageUrl ? (
            <div
              className="absolute inset-0 transition-transform duration-200 ease-out"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: 'center center'
              }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
            >
              <Image
                key={observation.id} // Force re-render when observation changes
                src={imageUrl}
                alt={`Photo for ${observation.sites?.name || (observation.site_id ? `site ${observation.site_id.slice(0, 8)}` : "observation")}`}
                fill
                className="object-contain select-none"
                sizes="(max-width: 768px) 100vw, 90vw"
                priority
                draggable={false}
                onLoad={() => {
                  console.log('Image loaded for observation:', observation.id);
                  setImageLoading(false);
                }}
                onError={() => {
                  console.log('Image error for observation:', observation.id);
                  setImageLoading(false);
                }}
              />
            </div>
          ) : (
            /* Text-only observation display */
            <div className="absolute inset-0 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="max-w-3xl text-center">
                <p className="text-lg md:text-xl text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {observation.note || 'No note provided'}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Info panel */}
        <div className={`relative p-4 pt-2 md:p-6 border-t bg-white overflow-y-auto flex-shrink-0 md:max-h-none md:h-auto md:w-96 md:flex-shrink-0 md:border-t-0 md:border-l ${hasPlanAnchor || addingPlanAnchor ? 'h-[45%]' : ''}`}>
         
            {/* Note */}
            <div className="mb-5 hidden md:block">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">Beschreibung</h3>
                {!editingNote && (
                  <button
                    onClick={handleStartEditNote}
                    className="text-gray-500 hover:text-blue-600 transition-colors p-1"
                    title="Edit note"
                    disabled={isSaving}
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                )}
              </div>
              {editingNote ? (
                <div className="space-y-2">
                  <textarea
                    value={editNoteValue}
                    onChange={(e) => setEditNoteValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        handleSaveNote();
                      }
                      if (e.key === "Escape") {
                        e.preventDefault();
                        handleCancelEditNote();
                      }
                    }}
                    className="w-full p-2 text-sm border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Notiz hinzufügen..."
                    autoFocus
                    disabled={isSaving}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleSaveNote}
                      size="sm"
                      disabled={isSaving}
                      className="h-7 px-2 text-xs"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      onClick={handleCancelEditNote}
                      size="sm"
                      variant="outline"
                      disabled={isSaving}
                      className="h-7 px-2 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                    <span className="text-xs text-gray-500">
                      Ctrl+Enter to save • Esc to cancel
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 text-sm min-h-[1.5rem]">
                  {observation.note || <span className="text-gray-400">Keine Anmerkungen</span>}
                </p>
              )}
            </div>
            
            {/* Metadata */}
            <div className="space-y-1 text-xs text-gray-500 hidden md:block">
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span>{resolveObservationDateTime(observation).toLocaleDateString()}</span>
              </div>

              {(observation.sites?.name || observation.site_id || (observation.gps_lat != null && observation.gps_lng != null)) && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span>
                    {observation.sites?.name || `${observation.site_id?.slice(0, 8)}...`}
                    {observation.gps_lat != null && observation.gps_lng != null && (
                      <a
                        href={`https://www.google.com/maps?q=${observation.gps_lat},${observation.gps_lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        {observation.gps_lat.toFixed(6)}, {observation.gps_lng.toFixed(6)}
                      </a>
                    )}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <User className="h-3 w-3 flex-shrink-0" />
                <span>{observation.user_email || `User ${observation.user_id.slice(0, 8)}...`}</span>
              </div>
            </div>
            {/* Labels — full-panel overlay when editing */}
            {editingLabels && (
              <div className="absolute inset-0 bg-white flex flex-col z-10">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b flex-shrink-0">
                  <h4 className="font-semibold text-gray-900">Bereich</h4>
                  <button
                    onClick={handleCancelEditLabels}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    title="Cancel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {/* Label hierarchy — scrollable */}
                <div className="flex-1 overflow-y-auto px-4 py-3">
                  {siteLabels.length > 0 ? (
                    <div className="space-y-3">
                      {(['location', 'gewerk', 'type'] as const).map(category => {
                        const sorted = [...siteLabels]
                          .filter(l => l.category === category)
                          .sort((a, b) => a.order_index - b.order_index);
                        if (sorted.length === 0) return null;
                        const parents = sorted.filter(l => !l.parent_id);
                        const childrenMap = sorted.reduce<Record<string, typeof sorted>>((acc, l) => {
                          if (l.parent_id) {
                            (acc[l.parent_id] ??= []).push(l);
                          }
                          return acc;
                        }, {});
                        // labels with no parent in this list (orphans treated as top-level)
                        const labelBtn = (label: typeof sorted[0]) => (
                          <button
                            key={label.id}
                            onClick={() => handleToggleLabel(label.name)}
                            disabled={isSaving}
                            className={`px-2 py-0.5 text-xs border transition-all disabled:opacity-50 disabled:cursor-not-allowed
                              ${selectedLabelNames.has(label.name)
                                ? 'bg-blue-500 text-white border-blue-600 hover:bg-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                              }`}
                            title={label.description || label.name}
                          >
                            {label.name}
                          </button>
                        );
                        return (
                          <div key={category}>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                              {category}
                            </p>
                            <div className="space-y-1">
                              {/* Labels without children — all in one wrapped row */}
                              {parents.filter(p => !childrenMap[p.id]).length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {parents.filter(p => !childrenMap[p.id]).map(parent => labelBtn(parent))}
                                </div>
                              )}
                              {/* Labels with children — parent on own row, children indented below */}
                              {parents.filter(p => childrenMap[p.id]).map(parent => (
                                <div key={parent.id}>
                                  <div className="flex flex-wrap gap-1">
                                    {labelBtn(parent)}
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-1 ml-3 pl-2 border-l-2 border-gray-100">
                                    {childrenMap[parent.id].map(child => labelBtn(child))}
                                  </div>
                                </div>
                              ))}
                              {/* orphan children whose parent isn't in this list */}
                              {sorted.filter(l => l.parent_id && !parents.find(p => p.id === l.parent_id)).map(l => (
                                <div key={l.id} className="flex flex-wrap gap-1">{labelBtn(l)}</div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 p-3 border border-gray-200 rounded-md">
                      No labels available for this site. Create labels in Settings.
                    </div>
                  )}
                </div>
                {/* Footer actions */}
                <div className="flex items-center gap-2 px-6 py-4 border-t flex-shrink-0">
                  <Button
                    onClick={handleSaveLabels}
                    size="sm"
                    disabled={isSaving}
                    className="h-8 px-3 text-xs"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                  <Button
                    onClick={handleCancelEditLabels}
                    size="sm"
                    variant="outline"
                    disabled={isSaving}
                    className="h-8 px-3 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Labels display */}
            <div className="mt-5 hidden md:block">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">Bereich</h4>
                <button
                  onClick={handleStartEditLabels}
                  className="text-gray-500 hover:text-blue-600 transition-colors p-1"
                  title="Edit labels"
                  disabled={isSaving}
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                {observation.labels && observation.labels.length > 0 ? (
                  [...new Set(observation.labels)]
                    .sort((a, b) => {
                      const aIdx = siteLabels.find(l => l.name === a)?.order_index ?? 999;
                      const bIdx = siteLabels.find(l => l.name === b)?.order_index ?? 999;
                      return aIdx - bIdx;
                    })
                    .map((label, idx) => (
                    <Badge
                      key={`modal-label-${idx}`}
                      variant="outline"
                      className="text-[10px] leading-tight px-1.5 py-0.5 border border-gray-300 bg-white whitespace-nowrap"
                    >
                      {processLabel(label)}
                    </Badge>
                  ))
                ) : (
                  <span className="text-gray-400 italic text-sm">Keine Labels</span>
                )}
              </div>
            </div>

            {/* Plan preview */}
            {!hasPlanAnchor && !addingPlanAnchor && observation.site_id && (
              <div className="mt-0 md:mt-5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">Planposition</h4>
                </div>
                <button
                  onClick={() => { setAddingPlanAnchor(true); setEditingPlanAnchor(true); setPendingAnchor(null); }}
                  className="text-xs text-gray-400 hover:text-blue-600 transition-colors"
                  disabled={isSaving}
                >
                  + Planposition hinzufügen
                </button>
              </div>
            )}
            {(hasPlanAnchor || addingPlanAnchor) && (
              <div className="mt-0 md:mt-5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">Planposition</h4>
                  {!editingPlanAnchor ? (
                    <button
                      onClick={() => { setEditingPlanAnchor(true); setPendingAnchor(null); }}
                      className="text-gray-500 hover:text-blue-600 transition-colors p-1"
                      title="Edit plan position"
                      disabled={isSaving}
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleSavePlanAnchor}
                        className="text-green-600 hover:text-green-700 transition-colors p-1"
                        title="Save"
                        disabled={isSaving || !pendingAnchor}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { setEditingPlanAnchor(false); setAddingPlanAnchor(false); setPendingAnchor(null); }}
                        className="text-gray-500 hover:text-red-600 transition-colors p-1"
                        title="Cancel"
                        disabled={isSaving}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                {editingPlanAnchor && availablePlans.length > 1 && (
                  <select
                    value={selectedPlanId ?? ''}
                    onChange={e => { setSelectedPlanId(e.target.value); setPendingAnchor(null); }}
                    className="w-full mb-2 text-xs border border-gray-300 rounded px-2 py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  >
                    {availablePlans.map(p => (
                      <option key={p.id} value={p.id}>{p.plan_name}</option>
                    ))}
                  </select>
                )}
                {editingPlanAnchor && (
                  <p className="text-xs text-gray-500 mb-1">Klicken Sie auf den Plan, um eine neue Position festzulegen</p>
                )}
                {planImageLoading ? (
                  <div
                    className="flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50"
                    style={{ width: 320, height: 280 }}
                  >
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400" />
                  </div>
                ) : planImageData ? (
                  <div
                    className="relative border border-gray-200 rounded-lg overflow-hidden"
                    style={{ width: 320, height: 280, cursor: editingPlanAnchor ? 'crosshair' : 'default' }}
                    onClick={handlePlanImageClick}
                  >
                    {planImageData.isPdf ? (
                      <PdfPlanCanvas url={planImageData.url} width={320} height={280} />
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={planImageData.url}
                        alt={planImageData.name}
                        style={{ width: 320, height: 280, objectFit: 'contain', display: 'block' }}
                      />
                    )}
                    {/* Anchor dot — shows pending position while editing, otherwise saved position */}
                    {(() => {
                      const displayX = pendingAnchor ? pendingAnchor.x : anchorX!;
                      const displayY = pendingAnchor ? pendingAnchor.y : anchorY!;
                      return (
                        <div
                          className="absolute pointer-events-none"
                          style={{
                            left: displayX * 320 - 7,
                            top: displayY * 280 - 7,
                            width: 14,
                            height: 14,
                            borderRadius: 7,
                            backgroundColor: pendingAnchor ? 'blue' : 'red',
                            border: '2px solid white',
                            zIndex: 1,
                          }}
                        />
                      );
                    })()}
                    <div className="absolute bottom-1 left-2 text-xs text-gray-500 bg-white/80 px-1 rounded">
                      {planImageData.name}
                    </div>
                  </div>
                ) : null}
              </div>
            )}

        </div>
      </div>
    </Modal>
  );
}
