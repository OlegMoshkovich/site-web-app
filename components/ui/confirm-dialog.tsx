"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ isOpen, message, onConfirm, onCancel }: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-lg shadow-xl p-5 max-w-xs w-full mx-4">
        <p className="text-sm text-gray-800 mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={onCancel} className="h-7 px-3 text-xs">
            Cancel
          </Button>
          <Button size="sm" onClick={onConfirm} className="h-7 px-3 text-xs bg-red-600 hover:bg-red-700 text-white border-0">
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
