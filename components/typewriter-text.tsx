"use client";

import { useState, useEffect, useRef } from "react";

interface TypewriterTextProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  onComplete?: () => void;
}

export function TypewriterText({ 
  text, 
  speed = 50, 
  delay = 0, 
  className = "",
  onComplete 
}: TypewriterTextProps) {
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!text || hasRun.current) {
      // If already completed, just show the full text
      if (hasRun.current) {
        setDisplayText(text);
        setIsComplete(true);
      }
      return;
    }

    hasRun.current = true;
    setDisplayText("");
    setIsComplete(false);

    const timer = setTimeout(() => {
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex < text.length) {
          currentIndex++;
          setDisplayText(text.slice(0, currentIndex));
        } else {
          clearInterval(interval);
          setDisplayText(text); // Ensure full text is shown
          setIsComplete(true);
          onComplete?.();
        }
      }, speed);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timer);
  }, [text, speed, delay, onComplete]);

  return (
    <span className={className}>
      {displayText}
      {!isComplete && <span className="animate-pulse">|</span>}
    </span>
  );
}