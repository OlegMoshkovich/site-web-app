"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { FilterPanel } from "@/components/filter-panel";
import { ObservationCard } from "@/components/observation-card";
import { groupObservationsByDate } from "@/lib/search-utils";
import type { Label } from "@/lib/labels";
import type { ObservationWithUrl } from "@/lib/store/observations-store";
import type { translations } from "@/lib/translations";
import { homeTheme } from "@/lib/app-theme";
import { cn } from "@/lib/utils";

type TFn = (key: keyof typeof translations.en) => string;

interface ObservationsFeedProps {
  // FilterPanel props
  showDateSelector: boolean;
  showSearchSelector: boolean;
  showLabelSelector: boolean;
  startDate: string;
  endDate: string;
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
  selectedUserId: string;
  onUserChange: (v: string) => void;
  availableUsers: { id: string; displayName: string }[];
  selectedSiteId: string;
  onSiteChange: (v: string) => void;
  availableSites: { id: string; name: string }[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onSelectAll: () => void;
  allSelected: boolean;
  isLoadingMore: boolean;
  onLoadMore: (type: 'week' | 'month') => void;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  isSearching: boolean;
  searchResultsCount: number;
  availableLabels: string[];
  siteLabels: Label[];
  selectedLabels: string[];
  onToggleLabel: (label: string) => void;
  onClearLabels: () => void;
  // Grid
  filteredObservations: ObservationWithUrl[];
  selectedObservations: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpenPhoto: (obs: ObservationWithUrl, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  isDragging: boolean;
  areAccordionsExpanded: boolean;
  hasToggledAccordions: boolean;
  hasMore: boolean;
  language: string;
  t: TFn;
}

export function ObservationsFeed({
  showDateSelector,
  showSearchSelector,
  showLabelSelector,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  selectedUserId,
  onUserChange,
  availableUsers,
  selectedSiteId,
  onSiteChange,
  availableSites,
  hasActiveFilters,
  onClearFilters,
  onSelectAll,
  allSelected,
  isLoadingMore,
  onLoadMore,
  searchQuery,
  onSearchChange,
  isSearching,
  searchResultsCount,
  availableLabels,
  siteLabels,
  selectedLabels,
  onToggleLabel,
  onClearLabels,
  filteredObservations,
  selectedObservations,
  onToggleSelect,
  onOpenPhoto,
  onDelete,
  isDragging,
  areAccordionsExpanded,
  hasToggledAccordions,
  hasMore,
  language,
  t,
}: ObservationsFeedProps) {
  const { groups, sortedDates } = groupObservationsByDate(filteredObservations);


  return (
    <div className="space-y-8">
      <FilterPanel
        showDateSelector={showDateSelector}
        showSearchSelector={showSearchSelector}
        showLabelSelector={showLabelSelector}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={onStartDateChange}
        onEndDateChange={onEndDateChange}
        selectedUserId={selectedUserId}
        onUserChange={onUserChange}
        availableUsers={availableUsers}
        selectedSiteId={selectedSiteId}
        onSiteChange={onSiteChange}
        availableSites={availableSites}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={onClearFilters}
        onSelectAll={onSelectAll}
        allSelected={allSelected}
        onLoadMore={onLoadMore}
        isLoadingMore={isLoadingMore}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        isSearching={isSearching}
        searchResultsCount={searchResultsCount}
        availableLabels={availableLabels}
        siteLabels={siteLabels}
        selectedLabels={selectedLabels}
        onToggleLabel={onToggleLabel}
        onClearLabels={onClearLabels}
        t={t}
      />

      {sortedDates.map((dateKey, dateIndex) => {
        const obs = groups[dateKey];
        const dateObj = new Date(dateKey);
        const weekdayPart = dateObj
          .toLocaleDateString(language === "de" ? "de-DE" : "en-US", { weekday: "long" })
          .toUpperCase();
        const datePart = dateObj
          .toLocaleDateString("de-DE", {month: "2-digit", day: "2-digit" }).replace(/\.$/, '');

        // ISO week number
        const getISOWeek = (d: Date) => {
          const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
          date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
          const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
          return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        };
        const weekNum = getISOWeek(dateObj);
        const prevWeekNum = dateIndex > 0 ? getISOWeek(new Date(sortedDates[dateIndex - 1])) : null;
        const showWeekHeader = prevWeekNum === null || weekNum !== prevWeekNum;

        // Week Monday–Sunday range
        const weekMonday = new Date(dateObj);
        weekMonday.setDate(dateObj.getDate() - ((dateObj.getDay() || 7) - 1));
        const weekSunday = new Date(weekMonday);
        weekSunday.setDate(weekMonday.getDate() + 6);
        const locale = language === "de" ? "de-DE" : "en-US";
        const fmtDay = (d: Date) => d.toLocaleDateString(locale, { day: "numeric", month: "short" });
        const weekRange = `${fmtDay(weekMonday)} – ${fmtDay(weekSunday)}`;

        // Top 4 most frequent labels for this day
        const labelCounts = new Map<string, number>();
        obs.forEach(o => {
          o.labels?.forEach(label => {
            if (label?.trim()) labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
          });
        });
        const sortedLabels = Array.from(labelCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([label]) => label);
        const topLabels = sortedLabels.slice(0, 4);
        const remainingLabels = sortedLabels.length - 4;

        return (
          <div key={dateKey} className="space-y-2">
            {showWeekHeader && (
              <div className={cn(`flex items-baseline gap-2 px-0 ${homeTheme.weekHeader}`, dateIndex > 0 && 'mt-6 pt-6')}>
                <span>{language === "de" ? `KW ${weekNum}` : `Week ${weekNum}`} |</span>
                <span>{weekRange}</span>
              </div>
            )}
            <Accordion
              key={`${dateKey}-${areAccordionsExpanded}`}
              type="single" collapsible
              defaultValue={areAccordionsExpanded ? "observations" : ""}
              className="mt-1"
            >
              <AccordionItem value="observations">
                <AccordionTrigger
                  rightElement={
                    <div className="flex items-end gap-1.5">
                      {topLabels.map((label, i) => (
                        <span
                          key={label}
                          className={cn(homeTheme.observationChip, i >= 2 && 'hidden sm:block')}
                        >
                          {label}
                        </span>
                      ))}
                      {remainingLabels > 0 && (
                        <span className={cn(homeTheme.observationChipMore, "shrink-0")}>
                          +{remainingLabels}
                        </span>
                      )}
                      <span className={cn(homeTheme.dateCounter, "shrink-0")}>
                        {obs.length}
                      </span>
                    </div>
                  }
                >
                  <span className="font-semibold">{datePart}<span className="font-semibold"> | <span className="text-sm">{weekdayPart}</span></span></span>
                </AccordionTrigger>
                <AccordionContent className="p-0 border-none">
                  <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-6 gap-1 sm:gap-2 md:gap-3">
                    {obs.map((observation, index) => (
                      <ObservationCard
                        key={observation.id}
                        observation={observation}
                        index={index}
                        isSelected={selectedObservations.has(observation.id)}
                        isDragging={isDragging}
                        onToggleSelect={onToggleSelect}
                        onOpenPhoto={onOpenPhoto}
                        onDelete={onDelete}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        );
      })}

      {hasMore && (
        <div className="flex flex-col items-center gap-4 pb-8 pt-4">
          <div className="flex flex-wrap justify-center gap-3">
            {(['week', 'month'] as const).map((type) => (
              <Button key={type} onClick={() => onLoadMore(type)} disabled={isLoadingMore} variant="outline" size="sm" className="transition-all">
                {isLoadingMore
                  ? <><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2" />Loading...</>
                  : t(type === 'week' ? 'lastWeek' : 'lastMonth')}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
