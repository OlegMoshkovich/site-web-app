"use client";

import { Button } from "@/components/ui/button";
import { MultiLabelEditDialog } from "@/components/multi-label-edit-dialog";
import { Download, Pencil } from "lucide-react";
import type { Label } from "@/lib/labels";
import type { ObservationWithUrl } from "@/lib/store/observations-store";
import type { translations } from "@/lib/translations";

type TFn = (key: keyof typeof translations.en) => string;

interface SelectionActionsProps {
  selectedObservations: Set<string>;
  onClearSelection: () => void;
  onOpenPhotoQuality: () => void;
  onOpenSaveReport: () => void;
  showMultiLabelEdit: boolean;
  onOpenMultiLabelEdit: () => void;
  onCloseMultiLabelEdit: () => void;
  observations: ObservationWithUrl[];
  siteLabels: Map<string, Label[]>;
  onFetchSiteLabels: (siteId: string, userId: string) => void;
  user: { id: string; email?: string } | null;
  onBulkSaveLabels: (labelsToAdd: string[], labelsToRemove: string[]) => Promise<void>;
  onRemoveLabelFromPhoto: (photoId: string, label: string) => Promise<void>;
  language: "en" | "de";
  t: TFn;
}

export function SelectionActions({
  selectedObservations,
  onClearSelection,
  onOpenPhotoQuality,
  onOpenSaveReport,
  showMultiLabelEdit,
  onOpenMultiLabelEdit,
  onCloseMultiLabelEdit,
  observations,
  siteLabels,
  onFetchSiteLabels,
  user,
  onBulkSaveLabels,
  onRemoveLabelFromPhoto,
  language,
  t,
}: SelectionActionsProps) {
  if (selectedObservations.size === 0) return null;

  const selectedObs = observations.filter(o => selectedObservations.has(o.id));
  const firstSiteId = selectedObs[0]?.site_id;
  const currentSiteLabels = firstSiteId ? (siteLabels.get(firstSiteId) || []) : [];
  if (firstSiteId && user && currentSiteLabels.length === 0) onFetchSiteLabels(firstSiteId, user.id);
  const allLabelSets = selectedObs.map(o => new Set(o.labels || []));
  const allLabelNames = Array.from(new Set(allLabelSets.flatMap(s => Array.from(s))));
  const commonLabels = allLabelNames.filter(l => allLabelSets.every(s => s.has(l)));
  const partialLabels = allLabelNames.filter(l => !commonLabels.includes(l));

  const actionBtnClass =
    "w-full justify-center shadow-lg transition-all hover:shadow-xl";

  return (
    <>
      {/* Same horizontal band as HomeAppFooter / max-w-6xl — avoids overlap with footer upload + aligns all actions */}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center pb-[env(safe-area-inset-bottom)] sm:bottom-28">
        <div className="pointer-events-auto flex w-full max-w-6xl justify-end px-3 sm:px-8">
          <div className="flex w-full max-w-sm flex-col gap-3 items-stretch">
            <Button onClick={onClearSelection} variant="secondary" size="lg" className={actionBtnClass}>
              {t("clearSelection")}
            </Button>
            <Button onClick={onOpenMultiLabelEdit} variant="outline" size="lg" className={actionBtnClass}>
              <Pencil className="h-4 w-4 mr-2 shrink-0" />
              {language === "de" ? "Labels bearbeiten" : "Edit Labels"} ({selectedObservations.size})
            </Button>
            <Button
              onClick={onOpenPhotoQuality}
              variant="outline"
              size="lg"
              className={`hidden md:inline-flex ${actionBtnClass}`}
            >
              <Download className="h-4 w-4 mr-2 shrink-0" />
              {language === "de" ? "Fotos herunterladen" : "Download Photos"} ({selectedObservations.size})
            </Button>
            <Button onClick={onOpenSaveReport} size="lg" className={actionBtnClass}>
              {t("generateReportSelected").replace("{count}", selectedObservations.size.toString())}
            </Button>
          </div>
        </div>
      </div>

      {showMultiLabelEdit && (
        <MultiLabelEditDialog
          isOpen={showMultiLabelEdit}
          onClose={onCloseMultiLabelEdit}
          selectedCount={selectedObservations.size}
          siteLabels={currentSiteLabels}
          selectedPhotos={selectedObs.map(o => ({ id: o.id, signedUrl: o.signedUrl, note: o.note ?? null, labels: o.labels ?? null }))}
          commonLabels={commonLabels}
          partialLabels={partialLabels}
          onSave={onBulkSaveLabels}
          onRemoveLabelFromPhoto={onRemoveLabelFromPhoto}
          language={language}
        />
      )}
    </>
  );
}
