"use client";

import { useState } from "react";
import Image from "next/image";

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CampaignModal({ isOpen, onClose }: CampaignModalProps) {
  const [imageLoading, setImageLoading] = useState(true);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-black w-full h-full relative flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 text-3xl z-10"
        >
          ×
        </button>
        <div className="flex justify-center items-center w-full h-full p-4 relative">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          )}
          <Image
            src="/campaign/CloneitToTheMoon_DE.png"
            alt="Cloneit To The Moon Campaign"
            width={1200}
            height={800}
            className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={() => setImageLoading(false)}
            onError={() => setImageLoading(false)}
          />
        </div>
      </div>
    </div>
  );
}
