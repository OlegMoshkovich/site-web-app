"use client";

import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { processLabel } from "@/lib/search-utils";
import type { translations } from "@/lib/translations";
import type { Label } from "@/lib/labels";
import { homeTheme } from "@/lib/app-theme";
import { cn } from "@/lib/utils";

type TFn = (key: keyof typeof translations.en) => string;

interface FilterPanelProps {
  showDateSelector: boolean;
  showSearchSelector: boolean;
  showLabelSelector: boolean;
  // Date + user + site filter
  startDate: string;
  endDate: string;
  onStartDateChange: (d: string) => void;
  onEndDateChange: (d: string) => void;
  selectedUserId: string;
  onUserChange: (id: string) => void;
  availableUsers: { id: string; displayName: string }[];
  selectedSiteId: string;
  onSiteChange: (id: string) => void;
  availableSites: { id: string; name: string }[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onSelectAll: () => void;
  allSelected: boolean;
  onLoadMore: (type: 'week' | 'month') => void;
  isLoadingMore: boolean;
  // Search
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isSearching: boolean;
  searchResultsCount: number;
  // Labels
  availableLabels: string[];
  siteLabels?: Label[];
  selectedLabels: string[];
  onToggleLabel: (label: string) => void;
  onClearLabels: () => void;
  t: TFn;
}

function LoadingSpinner() {
  return <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-1"></div>;
}

export function FilterPanel({
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
  onLoadMore,
  isLoadingMore,
  searchQuery,
  onSearchChange,
  isSearching,
  searchResultsCount,
  availableLabels,
  siteLabels,
  selectedLabels,
  onToggleLabel,
  onClearLabels,
  t,
}: FilterPanelProps) {
  // Build a set of label names present in observations for filtering
  const availableSet = new Set(availableLabels);

  // When siteLabels are provided, build the parent-child hierarchy filtered to availableLabels
  const labelBtn = (label: Label) => {
    const isSelected = selectedLabels.includes(label.name);
    return (
      <button
        key={label.id}
        onClick={() => onToggleLabel(label.name)}
        className={cn(
          isSelected ? homeTheme.labelToggleSelected : homeTheme.labelToggle,
        )}
      >
        {processLabel(label.name)}
      </button>
    );
  };

  const renderHierarchy = () => {
    // Filter structured labels to only those present in observations, deduplicate by name
    const filtered = (siteLabels || [])
      .filter(l => availableSet.has(l.name))
      .filter((l, i, arr) => arr.findIndex(x => x.name === l.name) === i);
    if (filtered.length === 0) return null;

    // Group by category
    const categories = [...new Set(filtered.map(l => l.category))];

    return (
      <div className="flex flex-col gap-3">
        {categories.map(category => {
          const catLabels = filtered
            .filter(l => l.category === category)
            .sort((a, b) => a.order_index - b.order_index);
          const parents = catLabels.filter(l => !l.parent_id);
          const childrenMap = catLabels.reduce<Record<string, Label[]>>((acc, l) => {
            if (l.parent_id) (acc[l.parent_id] ??= []).push(l);
            return acc;
          }, {});

          return (
            <div key={category}>
              <p className={homeTheme.labelCategoryHeading}>{category}</p>
              <div className="space-y-1">
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
                    <div className={cn("flex flex-wrap gap-2 mt-1 ml-3 pl-2", homeTheme.labelHierarchyIndent)}>
                      {childrenMap[parent.id].map(child => labelBtn(child))}
                    </div>
                  </div>
                ))}
                {/* Orphan children whose parent isn't in the filtered set */}
                {catLabels.filter(l => l.parent_id && !parents.find(p => p.id === l.parent_id)).map(l => (
                  <div key={l.id} className="flex flex-wrap gap-2">{labelBtn(l)}</div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  return (
    <>
      {showDateSelector && (
        <div className={cn("sticky top-16 z-40 flex flex-col sm:items-start sm:justify-between gap-3 sm:gap-4 p-2 sm:p-4", homeTheme.filterStickyPanel)}>
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-2 sm:gap-4">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={onStartDateChange}
              onEndDateChange={onEndDateChange}
              startLabel={t("start")}
              endLabel={t("end")}
            />
            <div className="flex flex-col gap-1">
              <label htmlFor="userFilter" className="text-sm font-medium text-muted-foreground">
                {t("user")}
              </label>
              <select
                id="userFilter"
                value={selectedUserId}
                onChange={(e) => onUserChange(e.target.value)}
                className="px-2 py-1 text-sm border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring w-32 sm:w-auto"
              >
                <option value="">{t("allUsers")}</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>{user.displayName}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="siteFilter" className="text-sm font-medium text-muted-foreground">
                {t("site")}
              </label>
              <select
                id="siteFilter"
                value={selectedSiteId}
                onChange={(e) => onSiteChange(e.target.value)}
                className="px-2 py-1 text-sm border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring w-32 sm:w-auto"
              >
                <option value="">{t("allSites")}</option>
                {availableSites.map((site) => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-row gap-1 sm:gap-3 w-full sm:w-auto">
              <Button
                onClick={onClearFilters}
                disabled={!hasActiveFilters}
                size="sm"
                variant="outline"
                className="flex-1 sm:w-auto text-xs px-2"
              >
                {t("clear")}
              </Button>
              <Button
                onClick={onSelectAll}
                size="sm"
                variant="outline"
                className="flex-1 sm:w-auto text-xs px-2"
              >
                {allSelected ? t("unselectAll") : t("selectAll")}
              </Button>
              <Button
                onClick={() => onLoadMore('week')}
                disabled={isLoadingMore}
                size="sm"
                variant="outline"
                className="flex-1 sm:w-auto text-xs px-2"
              >
                {isLoadingMore ? <><LoadingSpinner />Loading...</> : t('lastWeek')}
              </Button>
              <Button
                onClick={() => onLoadMore('month')}
                disabled={isLoadingMore}
                size="sm"
                variant="outline"
                className="flex-1 sm:w-auto text-xs px-2"
              >
                {isLoadingMore ? <><LoadingSpinner />Loading...</> : t('lastMonth')}
              </Button>
            </div>
          </div>
          <div className={homeTheme.filterNote}>{t("filteringNote")}</div>
        </div>
      )}

      {showSearchSelector && (
        <div
          className={cn("sticky z-40 flex flex-col gap-2 w-full p-4", homeTheme.filterStickyPanel)}
          style={{ top: showDateSelector ? '140px' : '64px' }}
        >
          <label className="text-sm font-medium text-muted-foreground">{t("search")}</label>
          <input
            type="text"
            placeholder={t("searchObservations")}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={homeTheme.searchField}
            style={{ fontSize: "16px" }}
          />
          {searchQuery && (
            <div className="text-xs text-muted-foreground">
              {isSearching
                ? "Searching..."
                : `${searchResultsCount} result${searchResultsCount !== 1 ? "s" : ""} found`}
            </div>
          )}
        </div>
      )}

      {showLabelSelector && (
        <div
          className={cn("sticky z-40 flex flex-col gap-3 w-full max-h-80 overflow-y-auto pr-1 p-4", homeTheme.filterStickyPanel)}
          style={{
            top: showDateSelector && showSearchSelector ? '240px' :
                 showDateSelector ? '140px' :
                 showSearchSelector ? '164px' : '64px',
          }}
        >
          <label className="text-sm font-medium text-muted-foreground">{t("filterByLabels")}</label>
          {availableLabels.length > 0 ? (
            siteLabels && siteLabels.length > 0
              ? renderHierarchy()
              : (
                <div className="flex flex-wrap gap-2">
                  {availableLabels.map((label) => {
                    const isSelected = selectedLabels.includes(label);
                    return (
                      <button
                        key={label}
                        onClick={() => onToggleLabel(label)}
                        className={cn(
                          isSelected ? homeTheme.labelToggleSelected : homeTheme.labelToggle,
                        )}
                      >
                        {processLabel(label)}
                      </button>
                    );
                  })}
                </div>
              )
          ) : (
            <div className="text-sm text-muted-foreground">{t("noLabelsFound")}</div>
          )}
          {selectedLabels.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {selectedLabels.length} {selectedLabels.length === 1 ? t("labelSelected") : t("labelsSelected")}
              </div>
              <button type="button" onClick={onClearLabels} className={homeTheme.linkAccent}>
                {t("clearAllLabels")}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
