"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface UserManualCarouselProps {
  className?: string;
  width?: number;
  height?: number;
  mobileHeight?: number;
  desktopHeight?: number;
}

export function UserManualCarousel({ 
  className = "", 
  width = 320, 
  height = 480,
  mobileHeight,
  desktopHeight
}: UserManualCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  
  // Touch/swipe handling
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // User manual images
  const images = [
    { src: "/userManual/1.png", alt: "User Manual Page 1" },
    { src: "/userManual/2.png", alt: "User Manual Page 2" },
    { src: "/userManual/3.png", alt: "User Manual Page 3" },
    { src: "/userManual/4.png", alt: "User Manual Page 4" },
    { src: "/userManual/5.png", alt: "User Manual Page 5" },
  ];

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, images.length]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  // Minimum swipe distance for a swipe to be registered
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null); // otherwise the swipe is fired even with usual touch events
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext(); // Swipe left = next image
    }
    if (isRightSwipe) {
      goToPrevious(); // Swipe right = previous image
    }
  };


  return (
    <div 
      className={`relative mx-auto ${className}`}
      style={{ width: `${width}px` }}
    >
      {/* Main carousel container */}
      <div 
        className={`overflow-hidden rounded-lg bg-white ${
          mobileHeight && desktopHeight 
            ? 'h-[var(--mobile-height)] sm:h-[var(--desktop-height)]' 
            : ''
        }`}
        style={{ 
          height: mobileHeight && desktopHeight ? undefined : `${height}px`,
          ...(mobileHeight && desktopHeight && {
            '--mobile-height': `${mobileHeight}px`,
            '--desktop-height': `${desktopHeight}px`
          })
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div 
          className="flex transition-transform duration-500 ease-in-out h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((image, index) => (
            <div key={index} className="w-full h-full flex-shrink-0 relative">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes={`(max-width: 512px) 100vw, ${width}px`}
                className="object-contain"
                priority={index === 0}
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDQwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPg=="
              />
            </div>
          ))}
        </div>

        {/* Navigation arrows */}
        <Button
          onClick={goToPrevious}
          variant="outline"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 border-gray-300"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          onClick={goToNext}
          variant="outline"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 border-gray-300"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

      </div>

    </div>
  );
}