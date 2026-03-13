"use client";

import { Button } from "@/components/ui/button";

interface PhotoQualityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  onSelectQuality: (quality: 'low' | 'medium' | 'high') => void;
}

export function PhotoQualityDialog({ isOpen, onClose, language, onSelectQuality }: PhotoQualityDialogProps) {
  if (!isOpen) return null;

  const de = language === "de";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {de ? "Fotoqualität auswählen" : "Select Photo Quality"}
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          {de
            ? "Wählen Sie die Qualität für Ihre Fotos. Höhere Qualität erzeugt größere Dateien."
            : "Choose the quality for your photos. Higher quality produces larger files."}
        </p>
        <div className="space-y-3">
          <button
            onClick={() => { onClose(); onSelectQuality('low'); }}
            className="w-full p-4 text-left border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="font-semibold">{de ? "Niedrige Qualität" : "Low Quality"}</div>
            <div className="text-sm text-gray-600">
              {de ? "~800KB pro Bild - Kleinere Dateigröße" : "~800KB per image - Smaller file size"}
            </div>
          </button>
          <button
            onClick={() => { onClose(); onSelectQuality('medium'); }}
            className="w-full p-4 text-left border-2 border-blue-500 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <div className="font-semibold flex items-center gap-2">
              {de ? "Mittlere Qualität" : "Medium Quality"}
              <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                {de ? "Empfohlen" : "Recommended"}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {de ? "~2MB pro Bild - Ausgewogene Qualität" : "~2MB per image - Balanced quality"}
            </div>
          </button>
          <button
            onClick={() => { onClose(); onSelectQuality('high'); }}
            className="w-full p-4 text-left border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="font-semibold">{de ? "Hohe Qualität" : "High Quality"}</div>
            <div className="text-sm text-gray-600">
              {de
                ? "~10MB pro Bild - Maximale Qualität, sehr große Datei"
                : "~10MB per image - Maximum quality, very large file"}
            </div>
          </button>
        </div>
        <div className="flex justify-end mt-6">
          <Button onClick={onClose} variant="outline">
            {de ? "Abbrechen" : "Cancel"}
          </Button>
        </div>
      </div>
    </div>
  );
}
