"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { ZoomIn, ZoomOut } from "lucide-react";
import { AuthButtonClient } from "@/components/auth-button-client";
import { Footer } from "@/components/footer";
import type { Observation } from "@/types/supabase";

interface SharedPhotoViewerProps {
  observation: Observation & { sites?: { name: string } | null };
  imageUrl: string;
}

export function SharedPhotoViewer({ observation, imageUrl }: SharedPhotoViewerProps) {
  const [imageLoading, setImageLoading] = useState(true);
  
  // Zoom and pan state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top navigation bar */}
      <nav className="sticky top-0 z-20 w-full flex justify-center h-16 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="w-full flex justify-between items-center px-2 sm:px-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="text-lg font-semibold">
              Simple Site
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <AuthButtonClient />
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4">
        {/* Image container */}
        <div 
          ref={imageContainerRef}
          className="relative bg-gray-100 h-96 md:h-[500px] flex-shrink-0 overflow-hidden border border-gray-200 rounded-lg"
          style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
        >
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
            </div>
          )}
          
          {/* Banner logo overlay - top left */}
          <div className="absolute top-1 left-1 sm:top-4 sm:left-4 z-30">
            <Image
              src="/images/banner.svg"
              alt="Simple Site"
              width={56}
              height={14}
              className="h-4 sm:h-8 w-auto bg-white/90 backdrop-blur-sm px-1 py-0.5 sm:px-3 sm:py-2 rounded text-xs sm:text-sm"
              priority
            />
          </div>
          
          {/* Zoom controls */}
          <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
            <button
              onClick={zoomIn}
              className="bg-black hover:bg-gray-800 text-white p-2 transition-colors rounded"
              aria-label="Zoom in"
              disabled={scale >= 3}
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={zoomOut}
              className="bg-black hover:bg-gray-800 text-white p-2 transition-colors rounded"
              aria-label="Zoom out"
              disabled={scale <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            {scale > 1 && (
              <button
                onClick={resetZoom}
                className="bg-black hover:bg-gray-800 text-white px-2 py-1 text-xs transition-colors rounded"
                aria-label="Reset zoom"
              >
                1:1
              </button>
            )}
          </div>
          
          {/* Zoom indicator */}
          {scale !== 1 && (
            <div className="absolute bottom-4 right-4 z-30 bg-black/70 text-white px-2 py-1 text-xs rounded">
              {Math.round(scale * 100)}%
            </div>
          )}
          
          {/* Timestamp and elevation tags overlay - centered at bottom */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 bg-black/70 text-white px-3 py-1 text-xs rounded flex items-center gap-2">
            <span>{new Date(observation.taken_at || observation.created_at).toLocaleString('en-GB')}</span>
            {(observation.sites?.name && observation.sites.name !== 'Munich') && (
              <>
                <span className="text-gray-300">•</span>
                <span>📍 {observation.sites.name}</span>
              </>
            )}
            {observation.labels && observation.labels.length > 0 && (
              <>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-1">
                  {observation.labels.slice(0, 3).map((label, idx) => (
                    <span key={idx} className="bg-white/20 px-1.5 py-0.5 rounded text-xs">
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
        <div className="mt-6 bg-white p-6 border border-gray-200 rounded-lg">
          <div className="space-y-4">
            {/* Note */}
            {observation.note && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Note</h3>
                <p className="text-gray-700">{observation.note}</p>
              </div>
            )}
            
            {/* Labels */}
            {observation.labels && observation.labels.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Labels</h4>
                <div className="flex flex-wrap gap-2">
                  {observation.labels.map((label, idx) => (
                    <span
                      key={`shared-label-${idx}`}
                      className="text-xs px-2 py-1 border border-gray-300 bg-gray-50 rounded"
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
      
      {/* Footer */}
      <Footer />
    </div>
  );
}