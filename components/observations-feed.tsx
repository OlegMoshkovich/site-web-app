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

        return (
          <div key={dateKey} className="space-y-2">
            {showWeekHeader && (
              <div className={`flex items-baseline gap-2 text-xs font-normal text-gray-400 uppercase tracking-widest px-0 ${dateIndex > 0 ? 'mt-6 pt-6 ' : ''}`}>
                <span>{language === "de" ? `KW ${weekNum}` : `Week ${weekNum}`} |</span>
                <span className=" text-gray-400">{weekRange}</span>
              </div>
            )}
            <Accordion
              key={`${dateKey}-${areAccordionsExpanded}`}
              type="single" collapsible
              defaultValue={areAccordionsExpanded ? "observations" : (!hasToggledAccordions && dateIndex === 0) ? "observations" : ""}
              className="mt-1"
            >
              <AccordionItem value="observations">
                <AccordionTrigger
                  rightElement={
                    <span className="text-xs w-6 h-6 flex items-center justify-center border border-gray-300 font-normal group-data-[state=open]:bg-[#f0f0f0] group-data-[state=closed]:bg-transparent transition-colors">
                      {obs.length}
                    </span>
                  }
                >
                  <span className="font-normal">{datePart}<span className="font-normal"> | <span className="text-sm">{weekdayPart}</span></span></span>
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
