"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ZoomIn, ZoomOut, Info, X, Download } from "lucide-react";
import { Footer } from "@/components/footer";
import { translations, type Language } from "@/lib/translations";
import { resolveObservationDateTime } from "@/lib/observation-dates";
import type { Observation } from "@/types/supabase";
import { createClient } from "@/lib/supabase/client";

interface SharedPhotoViewerProps {
  observation: Observation & { sites?: { name: string; logo_url?: string | null } | null };
  imageUrl: string;
}

export function SharedPhotoViewer({ observation, imageUrl }: SharedPhotoViewerProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [language, setLanguage] = useState<Language>("en");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const supabase = createClient();
  
  // Translation function
  const t = (key: keyof typeof translations.en) => {
    const value = translations[language][key] || translations.en[key];
    return typeof value === 'string' ? value : '';
  };
  
  // Zoom and pan state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Check authentication status on component mount
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: { user?: unknown } | null) => {
        setIsAuthenticated(!!session?.user);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Download photo function
  const downloadPhoto = useCallback(async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      const filename = `observation_${observation.id}_${resolveObservationDateTime(observation).toISOString().split('T')[0]}.jpg`;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading photo:', error);
    }
  }, [imageUrl, observation.id, observation.taken_at, observation.photo_date, observation.created_at]);

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

  return (
    <div className="dark flex min-h-screen flex-col bg-background text-foreground">
      {/* Top navigation bar */}
      <nav className="sticky top-0 z-20 flex h-16 w-full justify-center border-b border-border bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80">
        <div className="flex w-full items-center justify-between px-2 text-sm sm:px-4">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-lg font-semibold text-foreground transition-colors hover:text-muted-foreground"
            >
              Simple Site
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Language selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="h-8 w-8 cursor-pointer appearance-none rounded-md border border-input bg-background px-0 text-center text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              style={{ textAlignLast: "center" }}
              title="Change Language"
            >
              <option value="en">EN</option>
              <option value="de">DE</option>
            </select>
            {isAuthenticated && (
              <button
                onClick={downloadPhoto}
                className="flex h-8 items-center gap-1 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                title="Download photo"
                type="button"
              >
                <Download className="h-4 w-4" />
              </button>
            )}
            
            <button
              type="button"
              onClick={() => setShowInfoModal(true)}
              className="flex h-8 items-center gap-1 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Info className="h-4 w-4" />
            </button>
          
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4">
        {/* Image container */}
        <div 
          ref={imageContainerRef}
          className="relative h-96 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-muted md:h-[500px]"
          style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
        >
          {imageLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-muted">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            </div>
          )}
          
          {/* Site logo overlay - top left */}
          <div className="absolute left-2 top-2 z-30 sm:left-4 sm:top-4">
            {observation.sites?.logo_url ? (
              <div className="rounded-lg border border-border bg-white p-2 shadow-md">
                <img 
                  src={observation.sites.logo_url} 
                  alt={`${observation.sites.name} logo`}
                  className="h-6 w-auto object-contain rounded sm:h-8"
                />
              </div>
            ) : (
              <Image
                src="/images/banner.svg"
                alt="Simple Site"
                width={160}
                height={40}
                className="h-6 w-auto rounded bg-white px-2 py-1 text-xs sm:h-8 sm:px-3 sm:py-2 sm:text-sm"
                priority
              />
            )}
          </div>
          
          {/* Zoom controls */}
          <div className="absolute right-4 top-4 z-30 flex flex-col gap-2">
            <button
              type="button"
              onClick={zoomIn}
              className="rounded-md bg-secondary p-2 text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:opacity-40"
              aria-label="Zoom in"
              disabled={scale >= 3}
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={zoomOut}
              className="rounded-md bg-secondary p-2 text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:opacity-40"
              aria-label="Zoom out"
              disabled={scale <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            {scale !== 1 && (
              <button
                type="button"
                onClick={resetZoom}
                className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground transition-colors hover:bg-secondary/80"
                aria-label="Reset zoom"
              >
                1:1
              </button>
            )}
          </div>
          
          {/* Zoom indicator */}
          {scale !== 1 && (
            <div className="absolute bottom-4 right-4 z-30 rounded-md border border-border/50 bg-background/90 px-2 py-1 text-xs text-foreground backdrop-blur-sm">
              {Math.round(scale * 100)}%
            </div>
          )}
          
          {/* Timestamp and elevation tags overlay - centered at bottom */}
          <div className="absolute bottom-4 left-1/2 z-30 flex max-w-[95%] -translate-x-1/2 transform items-center gap-2 rounded-md bg-black/75 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
            <span>{resolveObservationDateTime(observation).toLocaleString('en-GB')}</span>
            {(observation.sites?.name && observation.sites.name !== 'Munich') && (
              <>
                <span className="text-white/60">•</span>
                <span>📍 {observation.sites.name}</span>
              </>
            )}
            {observation.labels && observation.labels.length > 0 && (
              <>
                <span className="text-white/60">•</span>
                <div className="flex items-center gap-1">
                  {[...new Set(observation.labels)].slice(0, 3).map((label, idx) => (
                    <span key={idx} className="rounded bg-white/15 px-1.5 py-0.5 text-xs">
                      {label}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
          
          {/* Zoomable/Pannable Image Container */}
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
              src={imageUrl}
              alt={`Photo for ${observation.sites?.name || "observation"}`}
              fill
              className="object-contain select-none"
              sizes="(max-width: 768px) 100vw, 90vw"
              priority
              draggable={false}
              onLoad={() => {
                setImageLoading(false);
              }}
              onError={() => {
                setImageLoading(false);
              }}
            />
          </div>
        </div>
        
        {/* Info panel */}
        <div className="mt-6 rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
          <div className="space-y-4">
            {/* Note */}
            {observation.note && (
              <div>
                <h3 className="mb-2 font-semibold text-card-foreground">{t("noteTitle")}</h3>
                <p className="text-muted-foreground">{observation.note}</p>
              </div>
            )}

            {/* Labels */}
            {observation.labels && observation.labels.length > 0 && (
              <div>
                <h4 className="mb-2 font-medium text-card-foreground">{t("labelsTitle")}</h4>
                <div className="flex flex-wrap gap-2">
                  {[...new Set(observation.labels)].map((label, idx) => (
                    <span
                      key={`shared-label-${idx}`}
                      className="rounded-md border border-border bg-muted px-2 py-1 text-xs text-foreground"
                    >
                      {processLabel(label)}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
      
      {/* Footer — muted links on dark shared page */}
      <Footer textColor="text-muted-foreground" />
      
      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-border bg-card text-card-foreground shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border p-6">
              <h2 className="text-lg font-semibold text-card-foreground">{t("simpleSiteMobileApp")}</h2>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="space-y-4 p-6">
              <p className="text-muted-foreground">
                {t("essentialForCollecting")}
              </p>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <span className="text-foreground">{t("takePhotosAndAddNotes")}</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <span className="text-foreground">{t("gpsLocationTracking")}</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <span className="text-foreground">{t("automaticSyncWithSites")}</span>
                </div>
              </div>
              
              <div className="pt-4">
                <p className="mb-3 text-sm font-medium text-card-foreground">{t("webVsMobile")}</p>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-card-foreground">{t("webPortal")}</p>
                    <p className="text-muted-foreground">{t("viewTeamObservationsGenerateReports")}</p>
                  </div>
                  <div>
                    <p className="font-medium text-card-foreground">{t("mobileApp")}</p>
                    <p className="text-muted-foreground">{t("requiredForCollectingObservations")}</p>
                  </div>
                </div>
              </div>
              
              {/* App Store Button */}
              <div className="flex justify-center pt-4">
                <a 
                  href="https://apps.apple.com/us/app/simple-site/id6749160249"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <Image
                    src="/app_screens/available-app-store_1.png"
                    alt={t("availableOnAppStore")}
                    width={120}
                    height={36}
                    className="w-auto h-auto object-contain"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
