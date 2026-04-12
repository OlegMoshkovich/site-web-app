"use client";

import Image from "next/image";
import { Trash2, ZoomIn, FileText, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { resolveObservationDateTime } from "@/lib/observation-dates";
import { processLabel } from "@/lib/search-utils";
import type { ObservationWithUrl } from "@/lib/store/observations-store";

interface ObservationCardProps {
  observation: ObservationWithUrl;
  index: number;
  isSelected: boolean;
  isDragging: boolean;
  onToggleSelect: (id: string) => void;
  onOpenPhoto: (obs: ObservationWithUrl, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export function ObservationCard({
  observation,
  index,
  isSelected,
  isDragging,
  onToggleSelect,
  onOpenPhoto,
  onDelete,
}: ObservationCardProps) {
  const hasPhoto = Boolean(observation.signedUrl);
  const labels = observation.labels ?? [];
  const timestamp = resolveObservationDateTime(observation);

  const tsFields = (() => {
    if (typeof window === "undefined" || !observation.site_id) return { datetime: true, user: false, logo: true };
    try {
      const saved = localStorage.getItem(`timestamp_fields_${observation.site_id}`);
      if (saved) return JSON.parse(saved) as { datetime: boolean; user: boolean; logo: boolean };
    } catch { /* ignore */ }
    return { datetime: true, user: false, logo: true };
  })();

  const timeStrParts: string[] = [];
  if (tsFields.datetime !== false) {
    timeStrParts.push(`${timestamp.toLocaleDateString('en-GB')} ${timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
  }
  if (tsFields.user) {
    const userStr = observation.user_name?.trim() || observation.user_email?.trim() || observation.profiles?.email?.trim();
    if (userStr) timeStrParts.push(userStr);
  }
  const timeStr = timeStrParts.join(' · ');

  const labelBadges = labels.length > 0 && (
    <div className="mt-1 flex flex-wrap gap-1">
      {labels.map((label, idx) => (
        <Badge
          key={`${observation.id}-label-${idx}`}
          variant="outline"
          className="text-[10px] leading-tight px-1 py-0 border border-border bg-muted/60 text-muted-foreground truncate max-w-[50ch]"
        >
          {processLabel(label)}
        </Badge>
      ))}
    </div>
  );

  const checkbox = (
    <div
      className={`absolute bottom-1 right-2 z-20 transition-opacity w-5 h-5 flex items-center justify-center ${
        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onToggleSelect(observation.id);
      }}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onToggleSelect(observation.id)}
        className="bg-background border-2 border-border data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 shadow-md w-5 h-5"
      />
    </div>
  );

  const deleteButton = (
    <button
      onClick={(e) => onDelete(observation.id, e)}
      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white p-1 rounded-full shadow-lg z-10"
      title="Delete observation"
    >
      <Trash2 className="h-3 w-3" />
    </button>
  );

  if (hasPhoto) {
    return (
      <div className="w-full">
        <div
          data-observation-id={observation.id}
          className={`relative aspect-square w-full overflow-hidden group select-none cursor-pointer ${
            isSelected ? "ring-2 ring-blue-500 ring-offset-1" : ""
          }`}
          onClick={() => {
            if (isDragging) return;
            onToggleSelect(observation.id);
          }}
        >
          <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-muted-foreground border-t-transparent"></div>
          </div>
          <Image
            src={observation.signedUrl as string}
            alt={`Photo for ${observation.sites?.name || (observation.site_id ? `site ${observation.site_id.slice(0, 8)}` : "observation")}`}
            fill
            draggable={false}
            className="object-cover hover:scale-105 transition-transform duration-200 pointer-events-none"
            sizes="(max-width: 480px) 50vw, (max-width: 640px) 25vw, (max-width: 768px) 20vw, (max-width: 1024px) 17vw, 16vw"
            priority={index < 6}
            onLoad={(e) => {
              const skeleton = e.currentTarget.previousElementSibling as HTMLElement;
              if (skeleton) skeleton.style.display = 'none';
            }}
          />
          <div className="absolute top-0 left-0 right-0 bg-black/60 text-white p-1.5 text-xs">
            <p className="text-center leading-tight">{timeStr}</p>
          </div>
          <button
            onClick={(e) => onOpenPhoto(observation, e)}
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 flex items-center justify-center"
            title="View photo"
          >
            <ZoomIn className="h-6 w-6 text-white drop-shadow-lg" />
          </button>
          {deleteButton}
          {observation.note && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-xs">
              <p className="line-clamp-2 leading-tight">{observation.note}</p>
            </div>
          )}
          {checkbox}
        </div>
        {labelBadges}
      </div>
    );
  }

  if (!observation.note) return null;

  return (
    <div className="w-full">
      <div
        data-observation-id={observation.id}
        className={`relative aspect-square w-full overflow-hidden group select-none cursor-pointer bg-gradient-to-br from-muted to-muted/70 border-2 ${
          isSelected ? "ring-2 ring-blue-500 ring-offset-1 border-blue-400" : "border-border"
        }`}
        onClick={() => {
          if (isDragging) return;
          onToggleSelect(observation.id);
        }}
      >
        <div className="absolute top-0 left-0 right-0 bg-foreground text-background p-1.5 text-xs">
          <p className="text-center leading-tight">{timeStr}</p>
        </div>
        <div className="absolute inset-0 flex items-center justify-center p-3 pt-10 pb-10">
          <p className="text-xs text-foreground line-clamp-6 text-center leading-tight">
            {observation.note}
          </p>
        </div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
          <FileText className="h-12 w-12 text-muted-foreground" />
        </div>
        <button
          onClick={(e) => onOpenPhoto(observation, e)}
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 flex items-center justify-center"
          title="View full note"
        >
          <Eye className="h-6 w-6 text-white drop-shadow-lg" />
        </button>
        {deleteButton}
        {checkbox}
      </div>
      {labelBadges}
    </div>
  );
}
