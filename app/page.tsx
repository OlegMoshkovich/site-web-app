"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/footer";
import { PhotoModal } from "@/components/photo-modal";
import { ClaudeChat } from "@/components/claude-chat";
import { UserManualCarousel } from "@/components/user-manual-carousel";
import { FolderUploadDropZone } from "@/components/folder-upload-drop-zone";
import { FolderUploadModal } from "@/components/folder-upload-modal";
import { SaveReportDialog } from "@/components/save-report-dialog";
import { PhotoQualityDialog } from "@/components/photo-quality-dialog";
import { CampaignModal } from "@/components/campaign-modal";
import { HomeNavbar } from "@/components/home-navbar";
import { ObservationsFeed } from "@/components/observations-feed";
import { SelectionActions } from "@/components/selection-actions";
import { HomeAppFooter } from "@/components/home-app-footer";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { translations, useLanguage } from "@/lib/translations";
import { getContentClasses } from "@/lib/layout-constants";
import { homeTheme } from "@/lib/app-theme";
import { FolderUp } from "lucide-react";
import { useObservationsStore } from "@/lib/store/observations-store";
import { usePhotoDownload } from "@/lib/hooks/use-photo-download";
import { useSelectionBox } from "@/lib/hooks/use-selection-box";
import { useFilterState } from "@/lib/hooks/use-filter-state";
import type { ObservationWithUrl } from "@/lib/store/observations-store";

export default function Home() {
  const supabase = createClient();
  const router = useRouter();

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const {
    observations,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    availableLabels: storeAvailableLabels,
    siteLabels,
    fetchInitialObservations,
    loadMoreObservations,
    setObservations,
    setAvailableLabels,
    fetchSiteLabels,
    clearStore,
    searchResults,
    isSearching,
    performSearch,
    clearSearch,
  } = useObservationsStore();

  const [selectedObservations, setSelectedObservations] = useState<Set<string>>(new Set());
  const { language, mounted } = useLanguage();
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showPhotoQualityDialog, setShowPhotoQualityDialog] = useState(false);
  const [showMultiLabelEdit, setShowMultiLabelEdit] = useState(false);
  const [areAccordionsExpanded, setAreAccordionsExpanded] = useState<boolean>(false);
  const [showModelMenu, setShowModelMenu] = useState<boolean>(false);
  const [claudeOpen, setClaudeOpen] = useState(false);
  const [hasToggledAccordions, setHasToggledAccordions] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedPhotoObservation, setSelectedPhotoObservation] = useState<ObservationWithUrl | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(0);

  const t = useCallback(
    (key: keyof typeof translations.en) => {
      const value = translations[language][key];
      return typeof value === "string" ? value : "";
    },
    [language],
  );

  const filters = useFilterState({
    user,
    observations,
    searchResults,
    siteLabels,
    fetchSiteLabels,
  });

  // Hooks
  const { handleDownloadPhotos } = usePhotoDownload(selectedObservations, observations);
  const { selectionBox, handleSelectionStart } = useSelectionBox(selectedObservations, setSelectedObservations);

  // Debounced DB search
  useEffect(() => {
    if (!user || !filters.showSearchSelector) { clearSearch(); return; }
    if (!filters.searchQuery.trim()) { clearSearch(); return; }
    const timer = setTimeout(() => performSearch(user.id, filters.searchQuery), 400);
    return () => clearTimeout(timer);
  }, [filters.searchQuery, filters.showSearchSelector, user, performSearch, clearSearch]);

  // Photo modal
  const handleOpenPhotoModal = useCallback((observation: ObservationWithUrl, event: React.MouseEvent) => {
    event.stopPropagation();
    const all = filters.getFilteredObservations().filter(o => o.signedUrl || o.note);
    setCurrentPhotoIndex(all.findIndex(o => o.id === observation.id));
    setSelectedPhotoObservation(observation);
    setPhotoModalOpen(true);
  }, [filters.getFilteredObservations]);

  const handleClosePhotoModal = useCallback(() => {
    setPhotoModalOpen(false);
    setSelectedPhotoObservation(null);
    setCurrentPhotoIndex(0);
  }, []);

  const handlePreviousPhoto = useCallback(() => {
    const all = filters.getFilteredObservations().filter(o => o.signedUrl || o.note);
    if (currentPhotoIndex > 0) {
      const idx = currentPhotoIndex - 1;
      setCurrentPhotoIndex(idx);
      setSelectedPhotoObservation(all[idx]);
    }
  }, [filters.getFilteredObservations, currentPhotoIndex]);

  const handleNextPhoto = useCallback(() => {
    const all = filters.getFilteredObservations().filter(o => o.signedUrl || o.note);
    if (currentPhotoIndex < all.length - 1) {
      const idx = currentPhotoIndex + 1;
      setCurrentPhotoIndex(idx);
      setSelectedPhotoObservation(all[idx]);
    }
  }, [filters.getFilteredObservations, currentPhotoIndex]);

  // Delete observation(s)
  const handleDeleteObservation = useCallback(
    async (observationId: string, event: React.MouseEvent) => {
      event.stopPropagation();
      const idsToDelete = selectedObservations.has(observationId) && selectedObservations.size > 1
        ? Array.from(selectedObservations)
        : [observationId];
      const confirmed = window.confirm(
        idsToDelete.length > 1
          ? `Are you sure you want to delete ${idsToDelete.length} selected observations? This action cannot be undone.`
          : "Are you sure you want to delete this observation? This action cannot be undone."
      );
      if (!confirmed) return;
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) { alert("You must be logged in to delete observations."); return; }
        const { error, count } = await supabase
          .from("observations")
          .delete({ count: 'exact' })
          .in("id", idsToDelete);
        if (error) { console.error("Error deleting observations:", error); alert("Error deleting observations. Please try again."); return; }
        if (count === 0) { alert("You don't have permission to delete these observations."); return; }
        setObservations(observations.filter(o => !idsToDelete.includes(o.id)));
        setSelectedObservations(new Set());
        if (idsToDelete.length > 1) alert(`Successfully deleted ${count} observation${count > 1 ? 's' : ''}.`);
      } catch (error) {
        console.error("Error deleting observations:", error);
        alert("Error deleting observations. Please try again.");
      }
    },
    [supabase, observations, setObservations, selectedObservations],
  );

  // Bulk label update
  const handleBulkSaveLabels = useCallback(async (labelsToAdd: string[], labelsToRemove: string[]) => {
    const ids = Array.from(selectedObservations);
    if (ids.length === 0) return;
    const updated = observations.map(obs => {
      if (!selectedObservations.has(obs.id)) return obs;
      const current = new Set(obs.labels || []);
      labelsToAdd.forEach(l => current.add(l));
      labelsToRemove.forEach(l => current.delete(l));
      const next = Array.from(current);
      return { ...obs, labels: next.length > 0 ? next : null };
    });
    setObservations(updated);
    await Promise.all(ids.map(async (id) => {
      const obs = updated.find(o => o.id === id);
      const labels = obs?.labels ?? null;
      await supabase.from("observations").update({ labels: labels && labels.length > 0 ? labels : null }).eq("id", id);
    }));
  }, [selectedObservations, observations, setObservations, supabase]);

  const handleRemoveLabelFromPhoto = useCallback(async (photoId: string, label: string) => {
    const obs = observations.find(o => o.id === photoId);
    if (!obs) return;
    const newLabels = (obs.labels || []).filter(l => l !== label);
    const next = newLabels.length > 0 ? newLabels : null;
    const { error } = await supabase.from('observations').update({ labels: next }).eq('id', photoId);
    if (error) { console.error('Error removing label:', error); return; }
    setObservations(observations.map(o => o.id === photoId ? { ...o, labels: next } : o));
  }, [supabase, observations, setObservations]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFolderDrop = useCallback((files: File[]) => {
    if (!user?.id) { alert('Please log in before uploading files.'); return; }
    setDroppedFiles(files);
    setShowUploadModal(true);
  }, [user]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    handleFolderDrop(files);
    e.target.value = '';
  }, [handleFolderDrop]);

  const handleUploadComplete = useCallback(() => {
    setShowUploadModal(false);
    setDroppedFiles([]);
    if (user?.id) fetchInitialObservations(user.id);
  }, [user, fetchInitialObservations]);

  const handleSelectAll = useCallback(() => {
    const visibleIds = filters.getFilteredObservations().map(o => o.id);
    const newSelected = new Set(selectedObservations);
    if (visibleIds.every(id => newSelected.has(id))) {
      visibleIds.forEach(id => newSelected.delete(id));
    } else {
      visibleIds.forEach(id => newSelected.add(id));
    }
    setSelectedObservations(newSelected);
  }, [filters.getFilteredObservations, selectedObservations]);

  const handleLoadMore = useCallback(async (type: 'week' | 'month') => {
    if (!user) return;
    await loadMoreObservations(user.id, type);
  }, [user, loadMoreObservations]);

  // Auth + initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: authData, error: userError } = await supabase.auth.getUser();
        if (userError || !authData.user) { setUser(null); return; }
        setUser(authData.user);
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', authData.user.id)
            .single();
          if (!profile || !profile.onboarding_completed) { router.push("/onboarding"); return; }
        } catch (error) {
          console.warn('Error checking onboarding status, continuing to main app:', error);
        }
        await fetchInitialObservations(authData.user.id);
      } catch (e) {
        console.error("Error in fetchData:", e);
      } finally {
        setIsInitializing(false);
      }
    };
    fetchData();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: { user: { id: string; email?: string } } | null) => {
      if (event === "SIGNED_OUT") {
        setUser(null); clearStore(); setSelectedObservations(new Set());
      } else if (event === "SIGNED_IN" && session?.user) {
        fetchData();
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase, router, fetchInitialObservations, clearStore]);

  if (!mounted || isInitializing) {
    return (
      <div className="flex items-center justify-center bg-black" style={{ height: '100dvh' }}>
        <Image src="/images/banner_logo.png" alt="simple site" width={160} height={42} priority />
      </div>
    );
  }

  const filteredObservations = filters.getFilteredObservations();
  const allSelected = (() => {
    const visibleIds = filteredObservations.map(o => o.id);
    return visibleIds.length > 0 && visibleIds.every(id => selectedObservations.has(id));
  })();

  return (
    <main
      className={`min-h-screen flex flex-col items-center relative ${user ? homeTheme.main : ''} ${user ? 'pb-24 sm:pb-28' : ''} ${selectionBox ? 'select-none' : ''}`}
      style={selectionBox ? { userSelect: 'none', WebkitUserSelect: 'none' } as React.CSSProperties : undefined}
      onMouseDown={handleSelectionStart}
    >
      {!user && (
        <div className="fixed inset-0 -z-10 bg-black bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/images/backgound.png)', transform: 'translateZ(0)', WebkitTransform: 'translateZ(0)' }} />
      )}
      <div className="flex-1 w-full flex flex-col gap-0 items-center">
        <HomeNavbar
          user={user}
          showSearchSelector={filters.showSearchSelector}
          onToggleSearch={() => filters.setShowSearchSelector(!filters.showSearchSelector)}
          showLabelSelector={filters.showLabelSelector}
          onToggleLabelSelector={() => filters.setShowLabelSelector(!filters.showLabelSelector)}
          selectedLabels={filters.selectedLabels}
          showDateSelector={filters.showDateSelector}
          onToggleDateSelector={() => filters.setShowDateSelector(!filters.showDateSelector)}
          hasActiveFilters={filters.hasActiveFilters}
          areAccordionsExpanded={areAccordionsExpanded}
          onToggleAccordions={() => { setAreAccordionsExpanded(!areAccordionsExpanded); setHasToggledAccordions(true); }}
          onShowCampaignModal={() => setShowCampaignModal(true)}
          t={t}
        />

        {user && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileInputChange}
          />
        )}

        {user && (
          <div className={homeTheme.mobileUploadStrip}>
            <div className="w-full max-w-6xl mx-auto px-3">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
                className={homeTheme.mobileUploadButton}
                title={t("uploadPhotos")}
              >
                <FolderUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className={getContentClasses().container}>
          <div className={getContentClasses().inner}>
            {!user ? (
              <div className="text-center py-8 sm:py-10">
                <h1 className="text-4xl sm:text-7xl md:text-8xl lg:text-6xl font-bold text-white mb-8">
                  {t("welcomeTitle")}
                </h1>
                <div className="mt-8">
                  <div className="flex justify-center">
                    <Suspense fallback={<div className="w-[600px] h-[300px] sm:h-[400px] bg-muted animate-pulse rounded-lg" />}>
                      <UserManualCarousel width={600} mobileHeight={300} desktopHeight={400} />
                    </Suspense>
                  </div>
                  <div className="h-14 mt-2 flex justify-center">
                    <a href="https://apps.apple.com/us/app/simple-site/id6749160249" target="_blank" rel="noopener noreferrer" className="relative transition-opacity hover:opacity-80">
                      <Image src="/app_screens/available-app-store_1.png" alt="Available on the App Store" width={100} height={30} className="h-10 w-auto object-contain max-w-[300px] rounded-lg" />
                    </a>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : observations.length > 0 ? (
              <ObservationsFeed
                showDateSelector={filters.showDateSelector}
                showSearchSelector={filters.showSearchSelector}
                showLabelSelector={filters.showLabelSelector}
                startDate={filters.startDate}
                endDate={filters.endDate}
                onStartDateChange={filters.setStartDate}
                onEndDateChange={filters.setEndDate}
                selectedUserId={filters.selectedUserId}
                onUserChange={filters.setSelectedUserId}
                availableUsers={filters.availableUsers}
                selectedSiteId={filters.selectedSiteId}
                onSiteChange={filters.setSelectedSiteId}
                availableSites={filters.availableSites}
                hasActiveFilters={filters.hasActiveFilters}
                onClearFilters={filters.handleClearDateRange}
                onSelectAll={handleSelectAll}
                allSelected={allSelected}
                onLoadMore={handleLoadMore}
                isLoadingMore={isLoadingMore}
                searchQuery={filters.searchQuery}
                onSearchChange={filters.setSearchQuery}
                isSearching={isSearching}
                searchResultsCount={searchResults.length}
                availableLabels={storeAvailableLabels}
                siteLabels={filters.filterPanelSiteLabels}
                selectedLabels={filters.selectedLabels}
                onToggleLabel={(label) => filters.setSelectedLabels(prev =>
                  prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
                )}
                onClearLabels={() => filters.setSelectedLabels([])}
                filteredObservations={filteredObservations}
                selectedObservations={selectedObservations}
                onToggleSelect={(id) => {
                  const next = new Set(selectedObservations);
                  if (next.has(id)) next.delete(id); else next.add(id);
                  setSelectedObservations(next);
                }}
                onOpenPhoto={handleOpenPhotoModal}
                onDelete={handleDeleteObservation}
                isDragging={!!selectionBox}
                areAccordionsExpanded={areAccordionsExpanded}
                hasToggledAccordions={hasToggledAccordions}
                hasMore={hasMore}
                language={language}
                t={t}
              />
            ) : (
              <div className="text-center py-12">
                <div className="space-y-6">
                  <p className="text-muted-foreground text-lg">{t('noObservationsPastTwoDays')}</p>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">{t('loadObservationsLongerPeriod')}</p>
                    <div className="flex flex-wrap justify-center gap-3">
                      {(['week', 'month'] as const).map((type) => (
                        <Button key={type} onClick={() => handleLoadMore(type)} disabled={isLoadingMore} variant="outline" size="sm" className="shadow-md hover:shadow-lg transition-all">
                          {isLoadingMore ? <><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2" />Loading...</> : t(type === 'week' ? 'loadPastWeek' : 'loadPastMonth')}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isLoading &&
              (user ? (
                <HomeAppFooter
                  onUploadClick={() => fileInputRef.current?.click()}
                  showModelMenu={showModelMenu}
                  onToggleModelMenu={() => setShowModelMenu(!showModelMenu)}
                  claudeOpen={claudeOpen}
                  onClaudeToggle={() => setClaudeOpen((o) => !o)}
                  t={t}
                />
              ) : (
                <Footer />
              ))}
          </div>
        </div>
      </div>

      <SelectionActions
        selectedObservations={selectedObservations}
        onClearSelection={() => setSelectedObservations(new Set())}
        onOpenPhotoQuality={() => setShowPhotoQualityDialog(true)}
        onOpenSaveReport={() => setShowSaveDialog(true)}
        showMultiLabelEdit={showMultiLabelEdit}
        onOpenMultiLabelEdit={() => setShowMultiLabelEdit(true)}
        onCloseMultiLabelEdit={() => setShowMultiLabelEdit(false)}
        observations={observations}
        siteLabels={siteLabels}
        onFetchSiteLabels={fetchSiteLabels}
        user={user}
        onBulkSaveLabels={handleBulkSaveLabels}
        onRemoveLabelFromPhoto={handleRemoveLabelFromPhoto}
        language={language}
        t={t}
      />

      {/* Photo modal */}
      {selectedPhotoObservation && (selectedPhotoObservation.signedUrl || selectedPhotoObservation.note) && (() => {
        const all = filteredObservations.filter(o => o.signedUrl || o.note);
        const currentSiteLabels = selectedPhotoObservation.site_id
          ? (siteLabels.get(selectedPhotoObservation.site_id) || [])
          : [];
        if (selectedPhotoObservation.site_id && user && currentSiteLabels.length === 0) {
          fetchSiteLabels(selectedPhotoObservation.site_id, user.id);
        }
        return (
          <PhotoModal
            isOpen={photoModalOpen}
            onClose={handleClosePhotoModal}
            imageUrl={selectedPhotoObservation.signedUrl}
            observation={selectedPhotoObservation}
            onPrevious={handlePreviousPhoto}
            onNext={handleNextPhoto}
            hasPrevious={currentPhotoIndex > 0}
            hasNext={currentPhotoIndex < all.length - 1}
            nextImageUrl={all[currentPhotoIndex + 1]?.signedUrl}
            prevImageUrl={all[currentPhotoIndex - 1]?.signedUrl}
            siteLabels={currentSiteLabels}
            onObservationUpdate={(updated) => {
              setObservations(observations.map(o => o.id === updated.id ? updated : o));
              if (updated.labels) {
                const current = new Set(storeAvailableLabels);
                updated.labels.forEach(l => { if (l?.trim()) current.add(l.trim()); });
                setAvailableLabels(Array.from(current).sort());
              }
              if (selectedPhotoObservation.id === updated.id) setSelectedPhotoObservation(updated);
            }}
          />
        );
      })()}

      <PhotoQualityDialog
        isOpen={showPhotoQualityDialog}
        onClose={() => setShowPhotoQualityDialog(false)}
        language={language}
        onSelectQuality={handleDownloadPhotos}
      />

      <SaveReportDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        selectedObservations={selectedObservations}
        language={language}
        onSuccess={() => setSelectedObservations(new Set())}
      />

      {user && (
        <ClaudeChat
          selectedObservations={selectedObservations}
          allObservations={observations.filter(obs => obs.taken_at !== null || obs.photo_date !== null).map(obs => ({
            ...obs, taken_at: obs.taken_at || obs.photo_date || obs.created_at,
          }))}
          onLoadMoreData={async (period: 'week' | 'month') => { await loadMoreObservations(user.id, period); }}
          isOpen={claudeOpen}
          onOpenChange={setClaudeOpen}
        />
      )}

      {selectionBox && (() => {
        const left = Math.min(selectionBox.startX, selectionBox.currentX);
        const top = Math.min(selectionBox.startY, selectionBox.currentY);
        const width = Math.abs(selectionBox.currentX - selectionBox.startX);
        const height = Math.abs(selectionBox.currentY - selectionBox.startY);
        return (
          <div
            className={`fixed pointer-events-none z-[5] ${homeTheme.selectionOverlay}`}
            style={{ left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` }}
          />
        );
      })()}

      <CampaignModal isOpen={showCampaignModal} onClose={() => setShowCampaignModal(false)} />

      {user && <FolderUploadDropZone onFilesDropped={handleFolderDrop} />}
      <FolderUploadModal
        isOpen={showUploadModal}
        files={droppedFiles}
        onClose={() => setShowUploadModal(false)}
        onUploadComplete={handleUploadComplete}
        userId={user?.id || ''}
        availableSites={filters.availableSites}
        initialSiteId={filters.selectedSiteId || null}
      />
    </main>
  );
}
