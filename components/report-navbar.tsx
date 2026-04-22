"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Info, Loader2 } from "lucide-react";
import { getNavbarClasses } from "@/lib/layout-constants";
import { homeTheme } from "@/lib/app-theme";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { translations } from "@/lib/translations";

type TFn = (key: keyof typeof translations.en) => string;

const outlineToolbarBtn =
  "h-8 min-h-8 gap-1.5 border border-border bg-background px-3 text-sm hover:bg-accent hover:text-accent-foreground";

export interface ReportNavbarProps {
  t: TFn;
  isAuthenticated: boolean;
  onBackToReports: () => void;
  onPdfClick: () => void;
  pdfDisabled: boolean;
  pdfLoading: boolean;
  pdfLabelShort: string;
  onWordClick: () => void;
  wordDisabled: boolean;
  wordLoading: boolean;
  wordLabelShort: string;
  onInfoClick: () => void;
  showSave: boolean;
  onSave: () => void;
  saveDisabled: boolean;
  saveLoading: boolean;
  saveSuccess: boolean;
  saveCount: number;
}

export function ReportNavbar({
  t,
  isAuthenticated,
  onBackToReports,
  onPdfClick,
  pdfDisabled,
  pdfLoading,
  pdfLabelShort,
  onWordClick,
  wordDisabled,
  wordLoading,
  wordLabelShort,
  onInfoClick,
  showSave,
  onSave,
  saveDisabled,
  saveLoading,
  saveSuccess,
  saveCount,
}: ReportNavbarProps) {
  const router = useRouter();
  const nav = getNavbarClasses({ background: "surface" });

  return (
    <nav className={nav.container}>
      <div className={`${nav.content} relative`}>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {isAuthenticated && (
            <Button
              onClick={onBackToReports}
              variant="outline"
              size="sm"
              className={homeTheme.outlineIconButton}
              title="Back to Reports"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 transform sm:block">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex h-8 cursor-pointer items-center justify-center rounded px-2 hover:opacity-80 sm:px-3"
            title={t("home")}
          >
            <Image
              src="/images/banner_logo.png"
              alt="Site Banner"
              width={120}
              height={32}
              className="h-5 w-auto max-w-none sm:h-6"
            />
          </button>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pdfDisabled}
            className={`${outlineToolbarBtn} inline-flex items-center`}
            title="Download PDF Report"
            onClick={onPdfClick}
          >
            {pdfLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{pdfLabelShort}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={wordDisabled}
            className={`${outlineToolbarBtn} hidden items-center sm:inline-flex`}
            title="Download Word Report"
            onClick={onWordClick}
          >
            {wordLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{wordLabelShort}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={homeTheme.outlineIconButton}
            title="Info"
            onClick={onInfoClick}
          >
            <Info className="h-4 w-4" />
          </Button>
          {showSave && (
            <Button
              onClick={onSave}
              disabled={saveDisabled}
              size="sm"
              className="h-8 px-3 transition-all"
              title="Save pending changes to database"
            >
              {saveLoading ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : saveSuccess ? (
                <>✓ Saved</>
              ) : (
                <>Save ({saveCount})</>
              )}
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
