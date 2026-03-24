"use client";

import { Button } from "@/components/ui/button";
import { FolderUp, Box } from "lucide-react";
import type { translations } from "@/lib/translations";

type TFn = (key: keyof typeof translations.en) => string;

interface HomeBottomBarProps {
  onUploadClick: () => void;
  showModelMenu: boolean;
  onToggleModelMenu: () => void;
  t: TFn;
}

export function HomeBottomBar({ onUploadClick, showModelMenu, onToggleModelMenu, t }: HomeBottomBarProps) {
  return (
    <div className="fixed bottom-2 sm:bottom-6 left-0 right-0 z-40 pointer-events-none">
      <div className="max-w-6xl mx-auto px-3 sm:px-8 flex justify-end">
        <div className="pointer-events-auto flex items-center gap-2 mr-2">
          <Button
            onClick={onUploadClick}
            variant="outline" size="sm"
            className="h-8 w-8 px-0 text-sm border-gray-300 flex items-center justify-center bg-white hover:bg-gray-100"
            title={t("uploadPhotos")}
          >
            <FolderUp className="h-4 w-4" />
          </Button>
        </div>
        <div className="pointer-events-auto mr-10 relative">
          <Button
            onClick={onToggleModelMenu}
            variant="outline" size="sm"
            className={`h-8 w-8 px-0 text-sm border-gray-300 flex items-center justify-center ${showModelMenu ? "bg-gray-200 text-gray-700" : "bg-white"}`}
          >
            <Box className="h-4 w-4" />
          </Button>
          {showModelMenu && (
            <div className="absolute bottom-10 right-0 bg-white border border-gray-200 shadow-lg min-w-[180px] z-50">
              <a href="/model/custom" className="block px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 border-b border-gray-100">Custom</a>
              <a href="/model/test-parameters" className="block px-4 py-2 text-sm text-gray-800 hover:bg-gray-50">Test Parameters</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
