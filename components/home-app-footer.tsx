"use client";

import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { FolderUp, Bot, X, MapPin } from "lucide-react";
import { homeClaudeTheme, homeTheme } from "@/lib/app-theme";
import { cn } from "@/lib/utils";
import type { translations } from "@/lib/translations";

type TFn = (key: keyof typeof translations.en) => string;

interface HomeAppFooterProps {
  onUploadClick: () => void;
  onMapClick: () => void;
  claudeOpen: boolean;
  onClaudeToggle: () => void;
  t: TFn;
}

export function HomeAppFooter({
  onUploadClick,
  onMapClick,
  claudeOpen,
  onClaudeToggle,
  t,
}: HomeAppFooterProps) {
  return (
    <footer
      className={cn(
        homeTheme.footerFixed,
        "pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2.5 sm:pt-3",
      )}
    >
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-8 flex flex-row justify-between items-center gap-3 min-h-[3rem] sm:min-h-[3.25rem]">
        <div className={cn(homeTheme.footerText, "flex flex-col justify-center gap-y-0.5 min-w-0 shrink")}>
          <span className="font-medium leading-tight">clone:it GmbH</span>
          <a href="mailto:admin@cloneit.site" className="hover:underline font-medium leading-tight truncate">
            admin@cloneit.site
          </a>
        </div>

        <div className="flex items-center justify-end gap-3 sm:gap-4 shrink-0 min-w-0 pointer-events-auto">
          <div className="flex items-center justify-end gap-2">
            <div className="hidden sm:block">
              <Button
                onClick={onUploadClick}
                variant="outline"
                size="sm"
                className={homeTheme.bottomBarOutlineButton}
                title={t("uploadPhotos")}
              >
                <FolderUp className="h-4 w-4" />
              </Button>
            </div>

            <Button
              type="button"
              onClick={onMapClick}
              variant="outline"
              size="sm"
              className={homeTheme.bottomBarOutlineButton}
              title={t("mapView")}
              aria-label={t("mapView")}
            >
              <MapPin className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              onClick={onClaudeToggle}
              variant="ghost"
              size="sm"
              className={cn(homeClaudeTheme.chatFab, !claudeOpen && "rounded-none")}
              title="AI Assistant"
              aria-expanded={claudeOpen}
            >
              {claudeOpen ? <X className="h-5 w-5" /> : <Bot className="h-6 w-6" />}
            </Button>
          </div>

          <ThemeSwitcher
            triggerClassName={homeTheme.outlineIconButton}
            dropdownSide="top"
            dropdownAlign="end"
          />
        </div>
      </div>
    </footer>
  );
}
