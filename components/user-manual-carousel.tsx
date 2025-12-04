"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

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
  
  // Next.js routing hooks
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
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
    { src: "/userManual/6.png", alt: "User Manual Page 6" },
  ];

  // Function to update URL with current slide
  const updateURL = useCallback((slideIndex: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slideIndex > 0) {
      params.set('slide', (slideIndex + 1).toString());
    } else {
      params.delete('slide');
    }
    const newURL = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newURL, { scroll: false });
  }, [searchParams, pathname, router]);

  // Initialize from URL parameter
  useEffect(() => {
    const slideParam = searchParams.get('slide');
    if (slideParam) {
      const slideNumber = parseInt(slideParam, 10);
      if (!isNaN(slideNumber) && slideNumber >= 1 && slideNumber <= images.length) {
        setCurrentIndex(slideNumber - 1);
      }
    }
  }, [searchParams, images.length]);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        // Stop at the last slide and disable auto-play
        if (prev === images.length - 1) {
          setIsAutoPlaying(false);
          return prev;
        }
        const newIndex = prev + 1;
        updateURL(newIndex);
        return newIndex;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, images.length, updateURL]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => {
      const newIndex = Math.max(0, prev - 1);
      updateURL(newIndex);
      return newIndex;
    });
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => {
      const newIndex = Math.min(images.length - 1, prev + 1);
      updateURL(newIndex);
      return newIndex;
    });
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

    if (isLeftSwipe && currentIndex < images.length - 1) {
      goToNext(); // Swipe left = next image (only if not at last)
    }
    if (isRightSwipe && currentIndex > 0) {
      goToPrevious(); // Swipe right = previous image (only if not at first)
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
          disabled={currentIndex === 0}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          onClick={goToNext}
          variant="outline"
          size="icon"
          disabled={currentIndex === images.length - 1}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

      </div>

    </div>
  );
}