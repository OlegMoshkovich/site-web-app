"use client";

import { useState, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Loader2, Tag, ChevronDown, X } from "lucide-react";
import type { Label } from "@/lib/labels";

interface SelectedPhoto {
  id: string;
  signedUrl: string | null;
  note: string | null;
  labels: string[] | null;
}

interface MultiLabelEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  siteLabels: Label[];
  selectedPhotos?: SelectedPhoto[];
  /** Labels shared by ALL selected observations (intersection) */
  commonLabels: string[];
  /** Labels present on SOME (but not all) selected observations */
  partialLabels: string[];
  onSave: (labelsToAdd: string[], labelsToRemove: string[]) => Promise<void>;
  onRemoveLabelFromPhoto?: (photoId: string, label: string) => void;
  language?: "de" | "en";
}

export function MultiLabelEditDialog({
  isOpen,
  onClose,
  selectedCount,
  siteLabels,
  selectedPhotos = [],
  commonLabels,
  partialLabels,
  onSave,
  onRemoveLabelFromPhoto,
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

  // Label removal confirmation
  const [photoLabelToRemove, setPhotoLabelToRemove] = useState<{ photoId: string; label: string } | null>(null);

  // Accordion state — all categories open by default
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const isCategoryOpen = (cat: string) => openCategories[cat] !== false; // default open
  const toggleCategory = useCallback((cat: string) =>
    setOpenCategories(prev => ({ ...prev, [cat]: prev[cat] === false ? true : false })), []);

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
    <>
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-lg mx-4 max-h-[85vh] flex flex-col">
      <div className="p-6 flex flex-col gap-5 min-h-0 flex-1 overflow-hidden">
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

        {/* Label grid — parent/child hierarchy grouped by category */}
        <div className="flex-1 min-h-0 flex flex-col">
        {siteLabels.length > 0 ? (() => {
          const sorted = [...siteLabels].sort((a, b) => a.order_index - b.order_index);
          const categories = [...new Set(sorted.map(l => l.category))];

          const labelBtn = (label: Label) => {
            const state = labelStates[label.name] ?? "off";
            return (
              <button
                key={label.id}
                onClick={() => handleToggle(label.name)}
                title={label.description || label.name}
                className={[
                  "px-2 py-0.5 text-xs border transition-all select-none",
                  state === "on"
                    ? "bg-blue-500 text-white border-blue-600 hover:bg-blue-600"
                    : state === "partial"
                    ? "bg-blue-100 text-blue-700 border-blue-400 hover:bg-blue-200"
                    : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50",
                ].join(" ")}
              >
                {label.name}
                {state === "partial" && <span className="ml-1 text-blue-500 text-xs">~</span>}
              </button>
            );
          };

          return (
            <div className="flex flex-col flex-1 overflow-y-auto pr-1 min-h-0 divide-y divide-gray-100">
              {categories.map(category => {
                const catLabels = sorted.filter(l => l.category === category);
                const parents = catLabels.filter(l => !l.parent_id);
                const childrenMap = catLabels.reduce<Record<string, Label[]>>((acc, l) => {
                  if (l.parent_id) (acc[l.parent_id] ??= []).push(l);
                  return acc;
                }, {});
                const isOpen = isCategoryOpen(category);

                return (
                  <div key={category}>
                    {/* Accordion header */}
                    <button
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center justify-between py-2 text-left group"
                    >
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 group-hover:text-gray-600 transition-colors">
                        {category}
                      </span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {/* Accordion body */}
                    {isOpen && (
                      <div className="space-y-1 pb-2">
                        {/* Parents without children — all in one wrapped row */}
                        {parents.filter(p => !childrenMap[p.id]).length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {parents.filter(p => !childrenMap[p.id]).map(p => labelBtn(p))}
                          </div>
                        )}
                        {/* Parents with children */}
                        {parents.filter(p => childrenMap[p.id]).map(parent => (
                          <div key={parent.id}>
                            <div className="flex flex-wrap gap-2">{labelBtn(parent)}</div>
                            <div className="flex flex-wrap gap-2 mt-1 ml-3 pl-2 border-l-2 border-gray-100">
                              {childrenMap[parent.id].map(child => labelBtn(child))}
                            </div>
                          </div>
                        ))}
                        {/* Orphan children */}
                        {catLabels.filter(l => l.parent_id && !parents.find(p => p.id === l.parent_id)).map(l => (
                          <div key={l.id} className="flex flex-wrap gap-2">{labelBtn(l)}</div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })() : (
          <p className="text-sm text-gray-400 italic">
            {t(
              "Keine Labels für diese Baustelle vorhanden. Labels können in den Einstellungen erstellt werden.",
              "No labels available for this site. Create labels in Settings."
            )}
          </p>
        )}
        </div>

        {/* Selected photos accordion */}
        {selectedPhotos.length > 0 && (() => {
          const key = "selected-photos";
          const isOpen = isCategoryOpen(key);
          return (
            <div className="border-t border-gray-100">
              <button
                type="button"
                onClick={() => toggleCategory(key)}
                className="w-full flex items-center justify-between py-2 text-left group"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 group-hover:text-gray-600 transition-colors">
                  {t("Ausgewählte Fotos", "Selected Photos")} ({selectedPhotos.length})
                </span>
                <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="flex flex-col gap-2 pb-2 overflow-y-auto max-h-48">
                  {selectedPhotos.map(photo => (
                    <div key={photo.id} className="flex items-start gap-2">
                      {/* Thumbnail */}
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded overflow-hidden border border-gray-200">
                        {photo.signedUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={photo.signedUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">📝</div>
                        )}
                      </div>
                      {/* Labels */}
                      <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                        {photo.labels && photo.labels.length > 0
                          ? photo.labels.map(l => (
                            <span key={l} className="px-1.5 py-0.5 text-xs border border-gray-300 bg-white text-gray-700 whitespace-nowrap flex items-center gap-1">
                              {l}
                              {onRemoveLabelFromPhoto && (
                                <button
                                  onClick={() => setPhotoLabelToRemove({ photoId: photo.id, label: l })}
                                  className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                                  title="Remove label"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </span>
                          ))
                          : <span className="text-xs text-gray-400 italic">{t("Keine Labels", "No labels")}</span>
                        }
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

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

    <ConfirmDialog
      isOpen={photoLabelToRemove !== null}
      message={`Remove label "${photoLabelToRemove?.label}" from this photo?`}
      onConfirm={() => {
        if (photoLabelToRemove && onRemoveLabelFromPhoto) {
          onRemoveLabelFromPhoto(photoLabelToRemove.photoId, photoLabelToRemove.label);
        }
        setPhotoLabelToRemove(null);
      }}
      onCancel={() => setPhotoLabelToRemove(null)}
    />
    </>
  );
}
