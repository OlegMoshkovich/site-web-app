"use client";

import "leaflet/dist/leaflet.css";
import type { ComponentProps } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  eachDayOfInterval,
  endOfWeek,
  format,
  parse,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { de, enUS } from "date-fns/locale";
import type { ObservationWithUrl } from "@/lib/store/observations-store";
import { Button } from "@/components/ui/button";
import { FilterPanel } from "@/components/filter-panel";
import { Slider } from "@/components/ui/slider";
import { homeTheme } from "@/lib/app-theme";
import { LAYOUT_CONSTANTS } from "@/lib/layout-constants";
import { cn } from "@/lib/utils";
import { Filter, Search, Tag } from "lucide-react";
import type { Language } from "@/lib/translations";
import type { translations } from "@/lib/translations";

type TFn = (key: keyof typeof translations.en) => string;

type TimelineStep = "day" | "week" | "all";

export type ObservationsMapModalFilterPanelProps = Omit<
  ComponentProps<typeof FilterPanel>,
  "embedded"
>;

function fixLeafletDefaultIcons(L: typeof import("leaflet")) {
  const proto = L.Icon.Default.prototype as unknown as { _getIconUrl?: string };
  delete proto._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

function getObservationTimeMs(o: ObservationWithUrl): number {
  const raw = o.taken_at ?? o.photo_date ?? o.created_at;
  const d = raw ? new Date(raw).getTime() : NaN;
  return Number.isFinite(d) ? d : new Date(o.created_at).getTime();
}

function calendarDayKey(ms: number): string {
  return format(new Date(ms), "yyyy-MM-dd");
}

/** Monday-based week (ISO-style), key = yyyy-MM-dd of week start */
function weekStartKeyFromMs(ms: number): string {
  return format(
    startOfWeek(new Date(ms), { weekStartsOn: 1 }),
    "yyyy-MM-dd",
  );
}

function filterObservationsWithGps(observations: ObservationWithUrl[]) {
  return observations.filter((o) => {
    const lat = o.gps_lat;
    const lng = o.gps_lng;
    if (lat == null || lng == null) return false;
    const nlat = Number(lat);
    const nlng = Number(lng);
    return (
      Number.isFinite(nlat) &&
      Number.isFinite(nlng) &&
      Math.abs(nlat) <= 90 &&
      Math.abs(nlng) <= 180
    );
  });
}

function filterPtsByCalendarDay(
  pts: ObservationWithUrl[],
  dayKey: string,
): ObservationWithUrl[] {
  return pts.filter(
    (o) => calendarDayKey(getObservationTimeMs(o)) === dayKey,
  );
}

function filterPtsByWeekStart(
  pts: ObservationWithUrl[],
  weekStartKey: string,
): ObservationWithUrl[] {
  return pts.filter(
    (o) => weekStartKeyFromMs(getObservationTimeMs(o)) === weekStartKey,
  );
}

/** Every calendar day from earliest to latest observation (local dates) — one slider step = one day. */
function continuousCalendarDayKeys(pts: ObservationWithUrl[]): string[] {
  if (pts.length === 0) return [];
  const times = pts.map(getObservationTimeMs);
  const start = startOfDay(new Date(Math.min(...times)));
  const end = startOfDay(new Date(Math.max(...times)));
  return eachDayOfInterval({ start, end }).map((d) => format(d, "yyyy-MM-dd"));
}

function sortedUniqueWeekKeys(pts: ObservationWithUrl[]): string[] {
  const set = new Set<string>();
  for (const o of pts) {
    set.add(weekStartKeyFromMs(getObservationTimeMs(o)));
  }
  return Array.from(set).sort();
}

export function ObservationsMapModal({
  open,
  onClose,
  observations,
  language,
  t,
  onOpenObservation,
  filterPanelProps,
  showSearchSelector,
  onToggleSearch,
  showLabelSelector,
  onToggleLabelSelector,
  selectedLabels,
  showDateSelector,
  onToggleDateSelector,
  hasActiveFilters,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: {
  open: boolean;
  onClose: () => void;
  observations: ObservationWithUrl[];
  language: Language;
  t: TFn;
  onOpenObservation?: (observation: ObservationWithUrl) => void;
  filterPanelProps: ObservationsMapModalFilterPanelProps;
  showSearchSelector: boolean;
  onToggleSearch: () => void;
  showLabelSelector: boolean;
  onToggleLabelSelector: () => void;
  selectedLabels: string[];
  showDateSelector: boolean;
  onToggleDateSelector: () => void;
  hasActiveFilters: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: (type: "week" | "month") => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const observationsRef = useRef(observations);
  observationsRef.current = observations;
  const onOpenObservationRef = useRef(onOpenObservation);
  onOpenObservationRef.current = onOpenObservation;

  const dateLocale = language === "de" ? de : enUS;

  const dataSig = observations
    .map(
      (o) =>
        `${o.id}:${o.gps_lat}:${o.gps_lng}:${(o.note ?? "").slice(0, 200)}:${o.signedUrl ?? ""}:${o.site_name ?? ""}:${o.plan ?? ""}`,
    )
    .join("|");

  const ptsWithGps = useMemo(
    () => filterObservationsWithGps(observations),
    [dataSig],
  );

  const dayKeys = useMemo(
    () => continuousCalendarDayKeys(ptsWithGps),
    [ptsWithGps],
  );

  const weekKeys = useMemo(
    () => sortedUniqueWeekKeys(ptsWithGps),
    [ptsWithGps],
  );

  const [timelineStep, setTimelineStep] = useState<TimelineStep>("day");
  const [timelineIndex, setTimelineIndex] = useState<number | null>(null);

  const keys = timelineStep === "day" ? dayKeys : weekKeys;

  useEffect(() => {
    if (!open) {
      setTimelineIndex(null);
      return;
    }
    if (timelineStep === "all") return;
    const k = timelineStep === "day" ? dayKeys : weekKeys;
    if (k.length === 0) return;
    setTimelineIndex(k.length - 1);
  }, [open, timelineStep, dayKeys, weekKeys]);

  const selectedKey =
    timelineIndex !== null && keys.length > 0
      ? keys[Math.min(timelineIndex, keys.length - 1)]
      : null;

  const selectedDayDate =
    timelineStep === "day" && selectedKey !== null
      ? parse(selectedKey, "yyyy-MM-dd", new Date())
      : null;

  const selectedWeekRange =
    timelineStep === "week" && selectedKey !== null
      ? (() => {
          const start = parse(selectedKey, "yyyy-MM-dd", new Date());
          const end = endOfWeek(start, { weekStartsOn: 1 });
          return { start, end };
        })()
      : null;

  const firstTimelineLabel =
    timelineStep === "day"
      ? dayKeys.length > 0
        ? parse(dayKeys[0], "yyyy-MM-dd", new Date())
        : null
      : weekKeys.length > 0
        ? parse(weekKeys[0], "yyyy-MM-dd", new Date())
        : null;

  const lastTimelineLabel =
    timelineStep === "day"
      ? dayKeys.length > 0
        ? parse(dayKeys[dayKeys.length - 1], "yyyy-MM-dd", new Date())
        : null
      : weekKeys.length > 0
        ? endOfWeek(
            parse(weekKeys[weekKeys.length - 1], "yyyy-MM-dd", new Date()),
            { weekStartsOn: 1 },
          )
        : null;

  const mapFilterKey = `${timelineStep}|${timelineStep === "all" ? "all" : (selectedKey ?? "none")}`;

  const firstDayInSpectrum =
    dayKeys.length > 0
      ? parse(dayKeys[0], "yyyy-MM-dd", new Date())
      : null;
  const lastDayInSpectrum =
    dayKeys.length > 0
      ? parse(dayKeys[dayKeys.length - 1], "yyyy-MM-dd", new Date())
      : null;

  const ptsFiltered = useMemo(() => {
    if (ptsWithGps.length === 0) return [];
    if (timelineStep === "all") return ptsWithGps;
    if (!selectedKey) return [];
    if (timelineStep === "day") {
      return filterPtsByCalendarDay(ptsWithGps, selectedKey);
    }
    return filterPtsByWeekStart(ptsWithGps, selectedKey);
  }, [ptsWithGps, selectedKey, timelineStep]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      return;
    }

    if (ptsWithGps.length === 0) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      return;
    }

    if (timelineStep !== "all" && !selectedKey) return;

    if (!containerRef.current) return;

    let cancelled = false;

    const run = async () => {
      const leafletMod = await import("leaflet");
      const L = leafletMod.default as typeof import("leaflet");
      if (cancelled || !containerRef.current) return;

      fixLeafletDefaultIcons(L);

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const el = containerRef.current;
      const map = L.map(el);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const base = filterObservationsWithGps(observationsRef.current);
      const pts =
        timelineStep === "all"
          ? base
          : timelineStep === "day"
            ? filterPtsByCalendarDay(base, selectedKey!)
            : filterPtsByWeekStart(base, selectedKey!);

      const leafletBounds = L.latLngBounds([] as [number, number][]);

      pts.forEach((obs) => {
        const lat = Number(obs.gps_lat);
        const lng = Number(obs.gps_lng);
        const marker = L.marker([lat, lng], {
          title: obs.site_name || obs.plan || undefined,
        }).addTo(map);
        leafletBounds.extend([lat, lng]);
        marker.on("click", () => {
          onOpenObservationRef.current?.(obs);
        });
      });

      if (pts.length === 1) {
        map.setView(
          [Number(pts[0].gps_lat), Number(pts[0].gps_lng)],
          15,
        );
      } else if (pts.length > 1) {
        map.fitBounds(leafletBounds, { padding: [40, 40], maxZoom: 18 });
      } else {
        map.setView([51, 10], 5);
      }

      // Cleanup may have removed this map while we were building markers; stale refs throw in invalidateSize.
      if (cancelled || mapRef.current !== map) return;
      try {
        map.invalidateSize();
      } catch {
        /* map container detached */
      }
      requestAnimationFrame(() => {
        if (cancelled || mapRef.current !== map) return;
        try {
          map.invalidateSize();
        } catch {
          /* map container detached */
        }
      });
    };

    void run();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [open, dataSig, mapFilterKey, timelineStep]);

  if (!open) return null;

  const showTimeline =
    timelineStep === "all"
      ? dayKeys.length > 0
      : keys.length > 0 &&
        timelineIndex !== null &&
        (timelineStep === "day"
          ? selectedDayDate !== null
          : selectedWeekRange !== null);
  const showSlider = timelineStep !== "all" && keys.length > 1;

  const emptyLabel =
    timelineStep === "week"
      ? t("mapNoObservationsInWeek")
      : t("mapNoObservationsOnDate");

  const navPad = LAYOUT_CONSTANTS.navbar.padding;

  const loadMoreFooter =
    hasMore ? (
      <div
        className={cn(
          "flex flex-row flex-wrap items-center justify-center gap-3 pt-1 sm:gap-2 sm:pt-0",
          showTimeline
            ? "order-4 w-full shrink-0 sm:ml-auto sm:w-auto sm:justify-end"
            : "w-full py-2 sm:py-1",
        )}
      >
        {(["week", "month"] as const).map((type) => (
          <Button
            key={type}
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoadingMore}
            className="text-xs transition-all"
            onClick={() => onLoadMore(type)}
          >
            {isLoadingMore ? (
              <>
                <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary border-b-transparent" />
                {t("loading")}
              </>
            ) : type === "week" ? (
              t("lastWeek")
            ) : (
              t("lastMonth")
            )}
          </Button>
        ))}
      </div>
    ) : null;

  return (
    <div
      className="fixed inset-0 z-[100] flex min-h-0 flex-col bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="observations-map-title"
    >
      <header
        className={cn(
          LAYOUT_CONSTANTS.navbar.height,
          "flex shrink-0 items-center gap-2 border-b border-border/70 bg-background",
          navPad,
          "pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))]",
        )}
      >
        <h2
          id="observations-map-title"
          className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground"
        >
          {t("mapViewTitle")}
        </h2>
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
          <Button
            type="button"
            onClick={onToggleSearch}
            variant="outline"
            size="sm"
            className={cn(
              homeTheme.outlineIconButton,
              showSearchSelector ? homeTheme.outlineIconButtonActive : "",
            )}
            title={t("toggleSearch")}
            aria-pressed={showSearchSelector}
          >
            <Search className="h-4 w-4" />
          </Button>
          <div className="relative">
            <Button
              type="button"
              onClick={onToggleLabelSelector}
              variant="outline"
              size="sm"
              className={cn(
                homeTheme.outlineIconButton,
                showLabelSelector ? homeTheme.outlineIconButtonActive : "",
              )}
              title={t("toggleLabelFilter")}
              aria-pressed={showLabelSelector}
            >
              <Tag className="h-4 w-4" />
            </Button>
            {selectedLabels.length > 0 && (
              <div
                className={`pointer-events-none absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full ${homeTheme.filterIndicator}`}
              />
            )}
          </div>
          <div className="relative">
            <Button
              type="button"
              onClick={onToggleDateSelector}
              variant="outline"
              size="sm"
              className={cn(
                homeTheme.outlineIconButton,
                showDateSelector ? homeTheme.outlineIconButtonActive : "",
              )}
              title={t("toggleDateFilter")}
              aria-pressed={showDateSelector}
            >
              <Filter className="h-4 w-4" />
            </Button>
            {hasActiveFilters && (
              <div
                className={`pointer-events-none absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full ${homeTheme.filterIndicator}`}
              />
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 shrink-0 border-border bg-background px-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground sm:px-3"
            onClick={onClose}
          >
            {t("mapClose")}
          </Button>
        </div>
      </header>
      <div className="shrink-0 overflow-y-auto max-h-[min(50vh,22rem)] border-b border-border/70 bg-background">
        <FilterPanel {...filterPanelProps} embedded />
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="relative min-h-0 flex-1">
          {ptsWithGps.length === 0 ? (
            <div className="flex h-full items-center justify-center p-6 text-center text-muted-foreground text-sm sm:text-base">
              {t("mapNoObservationsWithLocation")}
            </div>
          ) : (
            <>
              <div
                ref={containerRef}
                className="absolute inset-0 z-0 [&_.leaflet-marker-icon]:cursor-pointer"
              />
              {ptsFiltered.length === 0 && (
                <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center px-6">
                  <p className="rounded-md border border-border bg-background/90 px-4 py-3 text-center text-sm text-muted-foreground shadow-sm">
                    {emptyLabel}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      {(showTimeline || hasMore) && (
          <footer
            className={cn(
              "shrink-0 border-t border-border/70 bg-background",
              navPad,
              "flex flex-col gap-5 py-5 sm:gap-3 sm:py-3.5",
              "pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))]",
            )}
          >
            {showTimeline ? (
            <div
              className="flex min-h-[11rem] flex-col gap-5 sm:min-h-[5.75rem] sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:py-0 lg:gap-6"
            >
            <div
              className="inline-flex h-9 w-full shrink-0 items-center self-center rounded-md border border-border bg-muted/40 p-0.5 sm:h-8 sm:w-auto sm:min-w-[15rem]"
              role="group"
              aria-label={t("mapObservationDate")}
            >
              <button
                type="button"
                onClick={() => setTimelineStep("day")}
                className={cn(
                  "flex-1 rounded-sm px-1.5 py-1 text-[11px] font-medium transition-colors sm:px-2 sm:text-xs",
                  timelineStep === "day"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t("mapTimelineStepDay")}
              </button>
              <button
                type="button"
                onClick={() => setTimelineStep("week")}
                className={cn(
                  "flex-1 rounded-sm px-1.5 py-1 text-[11px] font-medium transition-colors sm:px-2 sm:text-xs",
                  timelineStep === "week"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t("mapTimelineStepWeek")}
              </button>
              <button
                type="button"
                onClick={() => setTimelineStep("all")}
                className={cn(
                  "flex-1 rounded-sm px-1.5 py-1 text-[11px] font-medium transition-colors sm:px-2 sm:text-xs",
                  timelineStep === "all"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t("mapTimelineStepShowAll")}
              </button>
            </div>
            {showSlider && firstTimelineLabel && lastTimelineLabel ? (
              <div className="order-3 flex min-h-0 min-w-0 flex-1 flex-col justify-center gap-4 sm:order-2 sm:gap-3">
                <div className="flex items-center justify-between gap-3 px-0.5 text-[10px] leading-tight text-muted-foreground sm:px-1 sm:text-[11px]">
                  <span className="min-w-0 max-w-[48%] truncate">
                    {format(firstTimelineLabel, "PP", { locale: dateLocale })}
                  </span>
                  <span className="min-w-0 max-w-[48%] truncate text-right">
                    {format(lastTimelineLabel, "PP", { locale: dateLocale })}
                  </span>
                </div>
                <Slider
                  compact
                  min={0}
                  max={keys.length - 1}
                  step={1}
                  value={[timelineIndex ?? 0]}
                  onValueChange={(v) => {
                    const raw = v[0];
                    if (typeof raw !== "number") return;
                    const n = Math.round(raw);
                    const hi = keys.length - 1;
                    setTimelineIndex(Math.max(0, Math.min(hi, n)));
                  }}
                  className="w-full max-w-none"
                  aria-label={
                    timelineStep === "day"
                      ? t("mapObservationDate")
                      : t("mapObservationWeek")
                  }
                />
              </div>
            ) : null}
            <div className="order-2 flex min-h-0 w-full max-w-[22rem] shrink-0 items-center justify-center self-center py-1 sm:order-3 sm:w-[22rem] sm:max-w-none sm:justify-end sm:py-0">
              <span className="sr-only">
                {timelineStep === "all"
                  ? t("mapTimelineStepShowAll")
                  : timelineStep === "day"
                    ? t("mapObservationDate")
                    : t("mapObservationWeek")}
              </span>
              <p className="w-full text-center text-base font-semibold tabular-nums leading-snug text-foreground sm:ml-6 sm:text-md sm:text-left sm:leading-tight">
                {timelineStep === "all" &&
                firstDayInSpectrum &&
                lastDayInSpectrum ? (
                  <>
                    <span className="block text-muted-foreground sm:inline sm:pr-1">
                      {t("mapTimelineStepShowAll")}
                    </span>
                    <span className="block sm:inline">
                      {format(firstDayInSpectrum, "PP", { locale: dateLocale })}{" "}
                      –{" "}
                      {format(lastDayInSpectrum, "PP", { locale: dateLocale })}
                    </span>
                  </>
                ) : timelineStep === "day" && selectedDayDate ? (
                  format(selectedDayDate, "PPP", { locale: dateLocale })
                ) : selectedWeekRange ? (
                  <>
                    {format(selectedWeekRange.start, "PP", {
                      locale: dateLocale,
                    })}{" "}
                    –{" "}
                    {format(selectedWeekRange.end, "PP", { locale: dateLocale })}
                  </>
                ) : null}
              </p>
            </div>
            {loadMoreFooter}
            </div>
            ) : null}
            {!showTimeline ? loadMoreFooter : null}
          </footer>
        )}
      </div>
    </div>
  );
}
