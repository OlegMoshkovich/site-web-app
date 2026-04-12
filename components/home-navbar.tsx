"use client";

import { Button } from "@/components/ui/button";
import { AuthButtonClient } from "@/components/auth-button-client";
import { Search, Filter, Tag, FileText, Settings } from "lucide-react";
import { getNavbarClasses } from "@/lib/layout-constants";
import { homeTheme } from "@/lib/app-theme";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { translations } from "@/lib/translations";

type TFn = (key: keyof typeof translations.en) => string;

interface HomeNavbarProps {
  user: { id: string; email?: string } | null;
  showSearchSelector: boolean;
  onToggleSearch: () => void;
  showLabelSelector: boolean;
  onToggleLabelSelector: () => void;
  selectedLabels: string[];
  showDateSelector: boolean;
  onToggleDateSelector: () => void;
  hasActiveFilters: boolean;
  areAccordionsExpanded: boolean;
  onToggleAccordions: () => void;
  onShowCampaignModal: () => void;
  t: TFn;
}

export function HomeNavbar({
  user,
  showSearchSelector,
  onToggleSearch,
  showLabelSelector,
  onToggleLabelSelector,
  selectedLabels,
  showDateSelector,
  onToggleDateSelector,
  hasActiveFilters,
  areAccordionsExpanded,
  onToggleAccordions,
  onShowCampaignModal,
  t,
}: HomeNavbarProps) {
  const router = useRouter();
  const nav = getNavbarClasses({ background: user ? "surface" : "transparent" });

  return (
    <nav className={nav.container}>
      <div className={nav.content}>
        <div className="flex items-center gap-2">
          {!user && (
            <div className="h-8 px-2 sm:px-3 bg-transparent flex items-center justify-center rounded">
              <Image src="/images/banner_logo.png" alt="Site Banner" width={120} height={32} className="h-4 sm:h-6 w-auto max-w-none" />
            </div>
          )}
          {user && (
            <>
              <Button
                onClick={onToggleSearch}
                variant="outline" size="sm"
                className={`${homeTheme.outlineIconButton} ${showSearchSelector ? homeTheme.outlineIconButtonActive : ""}`}
                title={t("toggleSearch")}
              >
                <Search className="h-4 w-4" />
              </Button>
              <div className="relative">
                <Button
                  onClick={onToggleLabelSelector}
                  variant="outline" size="sm"
                  className={`${homeTheme.outlineIconButton} ${showLabelSelector ? homeTheme.outlineIconButtonActive : ""}`}
                  title={t("toggleLabelFilter")}
                >
                  <Tag className="h-4 w-4" />
                </Button>
                {selectedLabels.length > 0 && (
                  <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${homeTheme.filterIndicator}`} />
                )}
              </div>
              <div className="relative">
                <Button
                  onClick={onToggleDateSelector}
                  variant="outline" size="sm"
                  className={`${homeTheme.outlineIconButton} ${showDateSelector ? homeTheme.outlineIconButtonActive : ""}`}
                  title={t("toggleDateFilter")}
                >
                  <Filter className="h-4 w-4" />
                </Button>
                {hasActiveFilters && (
                  <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${homeTheme.filterIndicator}`} />
                )}
              </div>
            </>
          )}
        </div>

        {user && (
          <div className="absolute left-1/2 transform -translate-x-1/2 sm:block">
            <div
              onClick={onToggleAccordions}
              className="h-8 px-2 sm:px-3 bg-transparent flex items-center justify-center cursor-pointer hover:opacity-80 rounded"
              title={areAccordionsExpanded ? "Collapse all" : "Expand all"}
            >
              <Image src="/images/banner_logo.png" alt="Site Banner" width={120} height={32} className="h-5 sm:h-6 w-auto max-w-none" />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {!user && (
            <button
              onClick={onShowCampaignModal}
              onTouchEnd={(e) => { e.preventDefault(); onShowCampaignModal(); }}
              className="h-4 w-4 min-h-[28px] min-w-[28px] bg-[#00FF1A] hover:bg-green-600 active:bg-green-700 mr-2 transition-colors cursor-pointer flex items-center justify-center touch-manipulation rounded-full"
              title="View Campaign" aria-label="View Campaign"
            >
              <span className="text-black text-base font-bold text-sm">i</span>
            </button>
          )}
          {user && (
            <Button onClick={() => router.push('/reports')} variant="outline" size="sm"
              className={homeTheme.outlineIconButton} title={t("reports")}>
              <FileText className="h-4 w-4" />
            </Button>
          )}
          {user && (
            <Button onClick={() => router.push('/settings')} variant="outline" size="sm"
              className={homeTheme.outlineIconButton} title={t("settings")}>
              <Settings className="h-4 w-4" />
            </Button>
          )}
          <AuthButtonClient />
        </div>
      </div>
    </nav>
  );
}
