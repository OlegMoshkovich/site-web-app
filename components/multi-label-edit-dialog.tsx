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
          <div className="rounded-lg bg-primary/15 p-2 dark:bg-primary/20">
            <Tag className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {t("Labels bearbeiten", "Edit Labels")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {selectedCount} {t("Fotos ausgewählt", "photos selected")}
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-primary" />
            {t("bei allen vorhanden", "on all")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm border border-primary/60 bg-primary/30" />
            {t("bei einigen vorhanden", "on some")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm border border-border bg-background" />
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
                  "rounded-md px-2 py-0.5 text-xs border transition-all select-none",
                  state === "on"
                    ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                    : state === "partial"
                    ? "border-primary/50 bg-primary/15 text-foreground hover:bg-primary/25 dark:bg-primary/20"
                    : "border-border bg-muted text-foreground hover:bg-muted/80",
                ].join(" ")}
              >
                {label.name}
                {state === "partial" && <span className="ml-1 text-xs text-primary">~</span>}
              </button>
            );
          };

          return (
            <div className="flex min-h-0 flex-1 flex-col divide-y divide-border overflow-y-auto pr-1">
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
                      className="group flex w-full items-center justify-between py-2 text-left"
                    >
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-foreground">
                        {category}
                      </span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
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
                            <div className="ml-3 mt-1 flex flex-wrap gap-2 border-l-2 border-border pl-2">
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
          <p className="text-sm italic text-muted-foreground">
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
            <div className="border-t border-border">
              <button
                type="button"
                onClick={() => toggleCategory(key)}
                className="group flex w-full items-center justify-between py-2 text-left"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-foreground">
                  {t("Ausgewählte Fotos", "Selected Photos")} ({selectedPhotos.length})
                </span>
                <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="flex max-h-48 flex-col gap-2 overflow-y-auto pb-2">
                  {selectedPhotos.map(photo => (
                    <div key={photo.id} className="flex items-start gap-2">
                      {/* Thumbnail */}
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded border border-border bg-muted">
                        {photo.signedUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={photo.signedUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">📝</div>
                        )}
                      </div>
                      {/* Labels */}
                      <div className="flex min-w-0 flex-1 flex-wrap gap-1">
                        {photo.labels && photo.labels.length > 0
                          ? photo.labels.map(l => (
                            <span key={l} className="flex items-center gap-1 whitespace-nowrap rounded-md border border-border bg-muted px-1.5 py-0.5 text-xs text-foreground">
                              {l}
                              {onRemoveLabelFromPhoto && (
                                <button
                                  onClick={() => setPhotoLabelToRemove({ photoId: photo.id, label: l })}
                                  className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                                  title="Remove label"
                                  type="button"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </span>
                          ))
                          : <span className="text-xs italic text-muted-foreground">{t("Keine Labels", "No labels")}</span>
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
        <p className="text-xs text-muted-foreground">
          {t(
            "Labels mit \"~\" sind nur bei einem Teil der ausgewählten Fotos vorhanden. Klicken zum Aktivieren für alle, erneut klicken zum Entfernen von allen.",
            "Labels marked with \"~\" are present on only some of the selected photos. Click to add to all, click again to remove from all."
          )}
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-border pt-1">
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
