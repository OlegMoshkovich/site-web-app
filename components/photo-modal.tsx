"use client";

import Image from "next/image";
import { Modal } from "@/components/ui/modal";
import { Calendar, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Observation } from "@/types/supabase";

// Extended observation with signed URL for secure photo access
interface ObservationWithUrl extends Observation {
  signedUrl: string | null;      // Temporary signed URL for viewing the photo
  sites?: { name: string } | null; // Site information from join
  profiles?: { email: string } | null; // User profile information from join
  user_email?: string; // User email from the query
}

interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  observation: ObservationWithUrl;
}

export function PhotoModal({ isOpen, onClose, imageUrl, observation }: PhotoModalProps) {
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
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-6xl mx-4">
      <div className="flex flex-col max-h-[90vh]">
        {/* Image container */}
        <div className="relative bg-gray-100 h-96 md:h-[500px] flex-shrink-0">
          <Image
            src={imageUrl}
            alt={`Photo for ${observation.sites?.name || (observation.site_id ? `site ${observation.site_id.slice(0, 8)}` : "observation")}`}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 90vw"
            priority
          />
        </div>
        
        {/* Info panel */}
        <div className="p-6 border-t bg-white max-h-64 overflow-y-auto">
          <div className="space-y-4">
            {/* Note */}
            {observation.note && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Note</h3>
                <p className="text-gray-700">{observation.note}</p>
              </div>
            )}
            
            {/* Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(observation.taken_at || observation.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                {(observation.sites?.name || observation.site_id) && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>
                      Site: {observation.sites?.name || `${observation.site_id?.slice(0, 8)}...`}
                    </span>
                  </div>
                )}
                
                <div className="text-gray-600">
                  <span className="font-medium">Created by:</span>{" "}
                  {observation.user_email || `User ${observation.user_id.slice(0, 8)}...`}
                </div>
              </div>
              
              <div className="space-y-2">
                {observation.latitude != null && observation.longitude != null && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>
                      GPS: {observation.latitude.toFixed(6)}, {observation.longitude.toFixed(6)}
                    </span>
                  </div>
                )}
                
                {observation.anchor_x != null &&
                  observation.anchor_y != null &&
                  !(observation.anchor_x === 0 && observation.anchor_y === 0) && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>
                      Plan Anchor: {observation.anchor_x.toFixed(6)}, {observation.anchor_y.toFixed(6)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Labels */}
            {observation.labels && observation.labels.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Labels</h4>
                <div className="flex flex-wrap gap-2">
                  {observation.labels.map((label, idx) => (
                    <Badge
                      key={`modal-label-${idx}`}
                      variant="outline"
                      className="text-xs px-2 py-1 border border-gray-300 bg-white"
                    >
                      {processLabel(label)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}