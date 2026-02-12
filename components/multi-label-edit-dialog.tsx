"use client";

import { useState, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Loader2, Tag } from "lucide-react";
import type { Label } from "@/lib/labels";

interface MultiLabelEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  siteLabels: Label[];
  /** Labels shared by ALL selected observations (intersection) */
  commonLabels: string[];
  /** Labels present on SOME (but not all) selected observations */
  partialLabels: string[];
  onSave: (labelsToAdd: string[], labelsToRemove: string[]) => Promise<void>;
  language?: "de" | "en";
}

export function MultiLabelEditDialog({
  isOpen,
  onClose,
  selectedCount,
  siteLabels,
  commonLabels,
  partialLabels,
  onSave,
  language = "de",
}: MultiLabelEditDialogProps) {
  // Three states per label:
  //   "on"      — was common, keep ON  (or toggled on from off/partial)
  //   "partial" — present on some, unchanged
  //   "off"     — not present or toggled off
  const [labelStates, setLabelStates] = useState<Record<string, "on" | "partial" | "off">>(() => {
    const initial: Record<string, "on" | "partial" | "off"> = {};
    for (const label of siteLabels) {
      if (commonLabels.includes(label.name)) {
        initial[label.name] = "on";
      } else if (partialLabels.includes(label.name)) {
        initial[label.name] = "partial";
      } else {
        initial[label.name] = "off";
      }
    }
    return initial;
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = useCallback((labelName: string) => {
    setLabelStates(prev => {
      const current = prev[labelName];
      let next: "on" | "partial" | "off";
      if (current === "off") next = "on";
      else if (current === "partial") next = "on";
      else next = "off";
      return { ...prev, [labelName]: next };
    });
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    const labelsToAdd: string[] = [];
    const labelsToRemove: string[] = [];

    for (const label of siteLabels) {
      const name = label.name;
      const state = labelStates[name];
      if (state === "on" && !commonLabels.includes(name)) {
        labelsToAdd.push(name);
      } else if (state === "off" && (commonLabels.includes(name) || partialLabels.includes(name))) {
        labelsToRemove.push(name);
      }
      // "partial" (unchanged) and "on" that was already common → no change
    }

    try {
      await onSave(labelsToAdd, labelsToRemove);
      onClose();
    } finally {
      setIsSaving(false);
    }
  }, [siteLabels, labelStates, commonLabels, partialLabels, onSave, onClose]);

  const t = (de: string, en: string) => (language === "de" ? de : en);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-lg mx-4">
      <div className="p-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Tag className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {t("Labels bearbeiten", "Edit Labels")}
            </h2>
            <p className="text-sm text-gray-500">
              {selectedCount} {t("Fotos ausgewählt", "photos selected")}
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs text-gray-500 bg-gray-50 rounded-md px-3 py-2">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-blue-500" />
            {t("bei allen vorhanden", "on all")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-blue-200 border border-blue-400" />
            {t("bei einigen vorhanden", "on some")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-white border border-gray-300" />
            {t("nicht vorhanden", "not present")}
          </span>
        </div>

        {/* Label grid */}
        {siteLabels.length > 0 ? (
          <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
            {siteLabels.map((label) => {
              const state = labelStates[label.name] ?? "off";
              return (
                <button
                  key={label.id}
                  onClick={() => handleToggle(label.name)}
                  title={label.description || label.name}
                  className={[
                    "px-3 py-1.5 text-sm rounded-md border transition-all select-none",
                    state === "on"
                      ? "bg-blue-500 text-white border-blue-600"
                      : state === "partial"
                      ? "bg-blue-100 text-blue-700 border-blue-400"
                      : "bg-white text-gray-700 border-gray-300 hover:border-gray-400",
                  ].join(" ")}
                >
                  {label.name}
                  {state === "partial" && (
                    <span className="ml-1 text-blue-500 text-xs">~</span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">
            {t(
              "Keine Labels für diese Baustelle vorhanden. Labels können in den Einstellungen erstellt werden.",
              "No labels available for this site. Create labels in Settings."
            )}
          </p>
        )}

        {/* Info note */}
        <p className="text-xs text-gray-400">
          {t(
            "Labels mit \"~\" sind nur bei einem Teil der ausgewählten Fotos vorhanden. Klicken zum Aktivieren für alle, erneut klicken zum Entfernen von allen.",
            "Labels marked with \"~\" are present on only some of the selected photos. Click to add to all, click again to remove from all."
          )}
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-1 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {t("Abbrechen", "Cancel")}
          </Button>
          <Button onClick={handleSave} disabled={isSaving || siteLabels.length === 0}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("Speichern…", "Saving…")}
              </>
            ) : (
              t("Speichern", "Save")
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
