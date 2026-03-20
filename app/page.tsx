"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback, useMemo, useRef, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Search,
  Filter,
  Download,
  Settings,
  Tag,
  FileText,
  Pencil,
  Upload,
} from "lucide-react";
import { AuthButtonClient } from "@/components/auth-button-client";
import { Footer } from "@/components/footer";
import { PhotoModal } from "@/components/photo-modal";
import { MultiLabelEditDialog } from "@/components/multi-label-edit-dialog";
import { ClaudeChat } from "@/components/claude-chat";
import { UserManualCarousel } from "@/components/user-manual-carousel";
import { FolderUploadDropZone } from "@/components/folder-upload-drop-zone";
import { FolderUploadModal } from "@/components/folder-upload-modal";
import { SaveReportDialog } from "@/components/save-report-dialog";
import { PhotoQualityDialog } from "@/components/photo-quality-dialog";
import { CampaignModal } from "@/components/campaign-modal";
import { ObservationCard } from "@/components/observation-card";
import { FilterPanel } from "@/components/filter-panel";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { translations, useLanguage } from "@/lib/translations";
import { getNavbarClasses, getContentClasses } from "@/lib/layout-constants";
import { useObservationsStore } from "@/lib/store/observations-store";
import {
  filterObservationsByDateRange,
  filterObservationsByLabels,
  filterObservationsByUserId,
  filterObservationsBySiteId,
  groupObservationsByDate,
} from "@/lib/search-utils";
import { usePhotoDownload } from "@/lib/hooks/use-photo-download";
import { useSelectionBox } from "@/lib/hooks/use-selection-box";
import type { Observation } from "@/types/supabase";

interface ObservationWithUrl extends Observation {
  signedUrl: string | null;
  sites?: { name: string } | null;
  profiles?: { email: string } | null;
  user_email?: string;
}

export default function Home() {
  const supabase = createClient();
  const router = useRouter();

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

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
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const { language, mounted } = useLanguage();
  const [showDateSelector, setShowDateSelector] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSearchSelector, setShowSearchSelector] = useState<boolean>(false);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [showLabelSelector, setShowLabelSelector] = useState<boolean>(false);
  const availableLabels = storeAvailableLabels;

  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [availableUsers, setAvailableUsers] = useState<{ id: string; displayName: string }[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [availableSites, setAvailableSites] = useState<{ id: string; name: string }[]>([]);

  // Structured labels for the filter panel — scoped to the selected site
  const filterPanelSiteLabels = useMemo(() => {
    if (selectedSiteId) return siteLabels.get(selectedSiteId) || [];
    // No site selected: aggregate from all loaded sites (deduped)
    const all: import("@/lib/labels").Label[] = [];
    const seen = new Set<string>();
    siteLabels.forEach(labels => {
      labels.forEach(l => { if (!seen.has(l.id)) { seen.add(l.id); all.push(l); } });
    });
    return all;
  }, [siteLabels, selectedSiteId]);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedPhotoObservation, setSelectedPhotoObservation] = useState<ObservationWithUrl | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showPhotoQualityDialog, setShowPhotoQualityDialog] = useState(false);
  const [showMultiLabelEdit, setShowMultiLabelEdit] = useState(false);
  const [areAccordionsExpanded, setAreAccordionsExpanded] = useState<boolean>(false);

  const t = useCallback(
    (key: keyof typeof translations.en) => {
      const value = translations[language][key];
      return typeof value === "string" ? value : "";
    },
    [language],
  );

  // Cookie helpers
  const setCookie = useCallback((name: string, value: string, days: number = 30) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  }, []);

  const getCookie = useCallback((name: string): string => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return "";
  }, []);

  const deleteCookie = useCallback((name: string) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
  }, []);

  // Hooks
  const { handleDownloadPhotos } = usePhotoDownload(selectedObservations, observations);
  const { selectionBox, handleSelectionStart } = useSelectionBox(selectedObservations, setSelectedObservations);

  // Debounced DB search
  useEffect(() => {
    if (!user || !showSearchSelector) { clearSearch(); return; }
    if (!searchQuery.trim()) { clearSearch(); return; }
    const timer = setTimeout(() => performSearch(user.id, searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery, showSearchSelector, user, performSearch, clearSearch]);

  // Filtered observations
  const getFilteredObservations = useCallback(() => {
    let filtered = (showSearchSelector && searchQuery.trim()) ? searchResults : observations;
    if (showDateSelector && startDate && endDate) {
      filtered = filterObservationsByDateRange(filtered, startDate, endDate);
    }
    if (selectedUserId) filtered = filterObservationsByUserId(filtered, selectedUserId);
    if (selectedSiteId) filtered = filterObservationsBySiteId(filtered, selectedSiteId);
    if (selectedLabels.length > 0) {
      filtered = filterObservationsByLabels(filtered, selectedLabels, false);
    }
    return filtered;
  }, [observations, searchResults, showDateSelector, startDate, endDate, selectedUserId, selectedSiteId, showSearchSelector, searchQuery, selectedLabels]);

  const hasActiveFilters = !!(startDate || endDate || selectedUserId || selectedSiteId);

  // Photo modal
  const handleOpenPhotoModal = useCallback((observation: ObservationWithUrl, event: React.MouseEvent) => {
    event.stopPropagation();
    const all = getFilteredObservations().filter(o => o.signedUrl || o.note);
    setCurrentPhotoIndex(all.findIndex(o => o.id === observation.id));
    setSelectedPhotoObservation(observation);
    setPhotoModalOpen(true);
  }, [getFilteredObservations]);

  const handleClosePhotoModal = useCallback(() => {
    setPhotoModalOpen(false);
    setSelectedPhotoObservation(null);
    setCurrentPhotoIndex(0);
  }, []);

  const handlePreviousPhoto = useCallback(() => {
    const all = getFilteredObservations().filter(o => o.signedUrl || o.note);
    if (currentPhotoIndex > 0) {
      const idx = currentPhotoIndex - 1;
      setCurrentPhotoIndex(idx);
      setSelectedPhotoObservation(all[idx]);
    }
  }, [getFilteredObservations, currentPhotoIndex]);

  const handleNextPhoto = useCallback(() => {
    const all = getFilteredObservations().filter(o => o.signedUrl || o.note);
    if (currentPhotoIndex < all.length - 1) {
      const idx = currentPhotoIndex + 1;
      setCurrentPhotoIndex(idx);
      setSelectedPhotoObservation(all[idx]);
    }
  }, [getFilteredObservations, currentPhotoIndex]);

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

  const handleClearDateRange = useCallback(() => {
    setStartDate(""); setEndDate(""); setSelectedUserId(""); setSelectedSiteId("");
    deleteCookie('filter_startDate'); deleteCookie('filter_endDate');
    deleteCookie('filter_userId'); deleteCookie('filter_siteId');
  }, [deleteCookie]);

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
    const visibleIds = getFilteredObservations().map(o => o.id);
    const newSelected = new Set(selectedObservations);
    if (visibleIds.every(id => newSelected.has(id))) {
      visibleIds.forEach(id => newSelected.delete(id));
    } else {
      visibleIds.forEach(id => newSelected.add(id));
    }
    setSelectedObservations(newSelected);
  }, [getFilteredObservations, selectedObservations]);

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

  // Fetch sites for filter
  useEffect(() => {
    if (!user?.id) return;
    const fetchAllSites = async () => {
      try {
        const [
          { data: ownedSites, error: ownedError },
          { data: collaborations, error: collabError },
        ] = await Promise.all([
          supabase.from('sites').select('id, name').eq('user_id', user.id).order('name', { ascending: true }),
          supabase.from('site_collaborators').select('site_id, sites(id, name)').eq('user_id', user.id).eq('status', 'accepted'),
        ]);
        if (ownedError) { console.error('Error loading owned sites:', ownedError); return; }
        if (collabError) console.error('Error loading collaborative sites:', collabError);
        const collaborativeSites = (collaborations || []).map((c: any) => c.sites).filter(Boolean);
        const all = [...(ownedSites || []), ...collaborativeSites];
        const unique = all.reduce((acc: any[], site: any) => {
          if (!acc.find((s: any) => s.id === site.id)) acc.push(site);
          return acc;
        }, []);
        unique.sort((a: any, b: any) => a.name.localeCompare(b.name));
        setAvailableSites(unique);
      } catch (error) {
        console.error('Error fetching sites:', error);
      }
    };
    fetchAllSites();
  }, [user, supabase]);

  // Fetch structured site labels when the label filter is opened (always refresh)
  useEffect(() => {
    if (!showLabelSelector || !user) return;
    if (selectedSiteId) {
      fetchSiteLabels(selectedSiteId, user.id);
    } else {
      const siteIds = [...new Set(observations.map((o: any) => o.site_id).filter(Boolean))];
      siteIds.forEach((siteId: string) => {
        fetchSiteLabels(siteId, user.id);
      });
    }
  }, [showLabelSelector, selectedSiteId, user, observations, fetchSiteLabels]);

  // Load filter cookies on mount
  useEffect(() => {
    const savedStartDate = getCookie('filter_startDate');
    const savedEndDate = getCookie('filter_endDate');
    const savedUserId = getCookie('filter_userId');
    const savedSiteId = getCookie('filter_siteId');
    if (savedStartDate) setStartDate(savedStartDate);
    if (savedEndDate) setEndDate(savedEndDate);
    if (savedUserId) setSelectedUserId(savedUserId);
    if (savedSiteId) setSelectedSiteId(savedSiteId);
  }, [getCookie]);

  // Persist filter cookies
  useEffect(() => {
    startDate ? setCookie('filter_startDate', startDate) : deleteCookie('filter_startDate');
    endDate ? setCookie('filter_endDate', endDate) : deleteCookie('filter_endDate');
    selectedUserId ? setCookie('filter_userId', selectedUserId) : deleteCookie('filter_userId');
    selectedSiteId ? setCookie('filter_siteId', selectedSiteId) : deleteCookie('filter_siteId');
  }, [startDate, endDate, selectedUserId, selectedSiteId, setCookie, deleteCookie]);

  // Extract unique users from observations
  useEffect(() => {
    if (observations.length === 0) return;
    const allUsers = new Map<string, string>();
    observations.forEach(obs => {
      if (obs.user_id) {
        allUsers.set(obs.user_id, obs.user_email || `User ${obs.user_id.slice(0, 8)}...`);
      }
    });
    setAvailableUsers(
      Array.from(allUsers.entries())
        .map(([id, displayName]) => ({ id, displayName }))
        .sort((a, b) => a.displayName.localeCompare(b.displayName))
    );
  }, [observations]);

  if (!mounted) return null;

  return (
    <main
      className={`min-h-screen flex flex-col items-center relative ${selectionBox ? 'select-none' : ''}`}
      style={selectionBox ? { userSelect: 'none', WebkitUserSelect: 'none' } as React.CSSProperties : undefined}
      onMouseDown={handleSelectionStart}
    >
      {!user && (
        <div className="fixed inset-0 -z-10 bg-black bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/images/backgound.png)' }} />
      )}
      <div className="flex-1 w-full flex flex-col gap-0 items-center">
        {/* Navbar */}
        <nav className={`${getNavbarClasses().container} ${user ? 'bg-white' : ''}`}>
          <div className={getNavbarClasses().content}>
            <div className="flex items-center gap-2">
              {!user && (
                <div className="h-8 px-2 sm:px-3 bg-transparent flex items-center justify-center rounded">
                  <Image src="/images/banner_logo.png" alt="Site Banner" width={120} height={32} className="h-4 sm:h-6 w-auto max-w-none" />
                </div>
              )}
              {user && (
                <>
                  <Button
                    onClick={() => setShowSearchSelector(!showSearchSelector)}
                    variant="outline" size="sm"
                    className={`h-8 w-8 px-0 text-sm border-gray-300 flex items-center justify-center ${showSearchSelector ? "bg-gray-200 text-gray-700" : "bg-white"}`}
                    title={t("toggleSearch")}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                  <div className="relative">
                    <Button
                      onClick={() => setShowLabelSelector(!showLabelSelector)}
                      variant="outline" size="sm"
                      className={`h-8 w-8 px-0 text-sm border-gray-300 flex items-center justify-center ${showLabelSelector ? "bg-gray-200 text-gray-700" : "bg-white"}`}
                      title={t("toggleLabelFilter")}
                    >
                      <Tag className="h-4 w-4" />
                    </Button>
                    {selectedLabels.length > 0 && (
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border border-white" />
                    )}
                  </div>
                  <div className="relative">
                    <Button
                      onClick={() => setShowDateSelector(!showDateSelector)}
                      variant="outline" size="sm"
                      className={`h-8 w-8 px-0 text-sm border-gray-300 flex items-center justify-center ${showDateSelector ? "bg-gray-200 text-gray-700" : "bg-white"}`}
                      title={t("toggleDateFilter")}
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                    {hasActiveFilters && (
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border border-white" />
                    )}
                  </div>
                </>
              )}
            </div>

            {user && (
              <div className="absolute left-1/2 transform -translate-x-1/2 sm:block">
                <div
                  onClick={() => setAreAccordionsExpanded(!areAccordionsExpanded)}
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
                  onClick={() => setShowCampaignModal(true)}
                  onTouchEnd={(e) => { e.preventDefault(); setShowCampaignModal(true); }}
                  className="h-4 w-4 min-h-[28px] min-w-[28px] bg-[#00FF1A] hover:bg-green-600 active:bg-green-700 mr-2 transition-colors cursor-pointer flex items-center justify-center touch-manipulation rounded-full"
                  title="View Campaign" aria-label="View Campaign"
                >
                  <span className="text-black text-base font-bold text-sm">i</span>
                </button>
              )}
              {user && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline" size="sm"
                    className="hidden sm:flex h-8 w-8 px-0 text-sm border-gray-300 items-center justify-center bg-white hover:bg-gray-100"
                    title={t("uploadPhotos")}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </>
              )}
              {user && (
                <Button onClick={() => router.push('/reports')} variant="outline" size="sm"
                  className="h-8 w-8 px-0 text-sm border-gray-300 flex items-center justify-center bg-white hover:bg-gray-100" title={t("reports")}>
                  <FileText className="h-4 w-4" />
                </Button>
              )}
              {user && (
                <Button onClick={() => router.push('/settings')} variant="outline" size="sm"
                  className="h-8 w-8 px-0 text-sm border-gray-300 flex items-center justify-center bg-white hover:bg-gray-100" title={t("settings")}>
                  <Settings className="h-4 w-4" />
                </Button>
              )}
              <AuthButtonClient />
            </div>
          </div>
        </nav>

        {/* Mobile upload button — below navbar, full content width, hidden on sm+ */}
        {user && (
          <div className="sm:hidden w-full max-w-6xl mx-auto px-3 pt-0 pb-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full h-8 border-gray-300 bg-white hover:bg-gray-100 flex items-center justify-center gap-2 text-sm"
            >
              <Upload className="h-4 w-4" />
              {/* {t("uploadPhotos")} */}
            </Button>
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
                    <Suspense fallback={<div className="w-[600px] h-[300px] sm:h-[400px] bg-gray-200 animate-pulse rounded-lg"></div>}>
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
            ) : isLoading ? (
              <div className="text-center py-12">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                </div>
              </div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : observations.length > 0 ? (
              <div className="space-y-8">
                <FilterPanel
                  showDateSelector={showDateSelector}
                  showSearchSelector={showSearchSelector}
                  showLabelSelector={showLabelSelector}
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                  selectedUserId={selectedUserId}
                  onUserChange={setSelectedUserId}
                  availableUsers={availableUsers}
                  selectedSiteId={selectedSiteId}
                  onSiteChange={setSelectedSiteId}
                  availableSites={availableSites}
                  hasActiveFilters={hasActiveFilters}
                  onClearFilters={handleClearDateRange}
                  onSelectAll={handleSelectAll}
                  allSelected={(() => {
                    const visibleIds = getFilteredObservations().map(o => o.id);
                    return visibleIds.length > 0 && visibleIds.every(id => selectedObservations.has(id));
                  })()}
                  onLoadMore={handleLoadMore}
                  isLoadingMore={isLoadingMore}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  isSearching={isSearching}
                  searchResultsCount={searchResults.length}
                  availableLabels={availableLabels}
                  siteLabels={filterPanelSiteLabels}
                  selectedLabels={selectedLabels}
                  onToggleLabel={(label) => setSelectedLabels(prev =>
                    prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
                  )}
                  onClearLabels={() => setSelectedLabels([])}
                  t={t}
                />

                {(() => {
                  const { groups, sortedDates } = groupObservationsByDate(getFilteredObservations());
                  return sortedDates.map((dateKey, dateIndex) => {
                    const obs = groups[dateKey];
                    const formattedDate = new Date(dateKey)
                      .toLocaleDateString(language === "de" ? "de-DE" : "en-US", {
                        weekday: "long", year: "numeric", month: "long", day: "numeric",
                      })
                      .toUpperCase();
                    return (
                      <div key={dateKey} className="space-y-2">
                        <Accordion
                          key={`${dateKey}-${areAccordionsExpanded}`}
                          type="single" collapsible
                          defaultValue={areAccordionsExpanded ? "observations" : dateIndex === 0 ? "observations" : ""}
                          className="mt-1"
                        >
                          <AccordionItem value="observations">
                            <AccordionTrigger>{formattedDate} ({obs.length})</AccordionTrigger>
                            <AccordionContent className="p-0 border-none">
                              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-6 gap-1 sm:gap-2 md:gap-3">
                                {obs.map((observation, index) => (
                                  <ObservationCard
                                    key={observation.id}
                                    observation={observation}
                                    index={index}
                                    isSelected={selectedObservations.has(observation.id)}
                                    isDragging={!!selectionBox}
                                    onToggleSelect={(id) => {
                                      const next = new Set(selectedObservations);
                                      if (next.has(id)) next.delete(id); else next.add(id);
                                      setSelectedObservations(next);
                                    }}
                                    onOpenPhoto={handleOpenPhotoModal}
                                    onDelete={handleDeleteObservation}
                                  />
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    );
                  });
                })()}

                {hasMore && (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <div className="text-sm text-gray-600 mb-2">{t('loadMoreLabel')}</div>
                    <div className="flex flex-wrap justify-center gap-3">
                      {(['week', 'month'] as const).map((type) => (
                        <Button key={type} onClick={() => handleLoadMore(type)} disabled={isLoadingMore} variant="outline" size="sm" className=" transition-all">
                          {isLoadingMore ? <><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2"></div>Loading...</> : t(type === 'week' ? 'lastWeek' : 'lastMonth')}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : user && !error && isLoading ? (
              <div className="text-center py-12">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="space-y-6">
                  <p className="text-muted-foreground text-lg">{t('noObservationsPastTwoDays')}</p>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">{t('loadObservationsLongerPeriod')}</p>
                    <div className="flex flex-wrap justify-center gap-3">
                      {(['week', 'month'] as const).map((type) => (
                        <Button key={type} onClick={() => handleLoadMore(type)} disabled={isLoadingMore} variant="outline" size="sm" className="shadow-md hover:shadow-lg transition-all">
                          {isLoadingMore ? <><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2"></div>Loading...</> : t(type === 'week' ? 'loadPastWeek' : 'loadPastMonth')}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isLoading && <Footer user={user} textColor="text-black" />}
          </div>
        </div>
      </div>

      {/* Selection action buttons */}
      {selectedObservations.size > 0 && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
          <Button onClick={() => setSelectedObservations(new Set())} variant="secondary" size="lg" className="shadow-lg hover:shadow-xl transition-all">
            {t("clearSelection")}
          </Button>
          <Button onClick={() => setShowMultiLabelEdit(true)} variant="outline" size="lg" className="shadow-lg hover:shadow-xl transition-all">
            <Pencil className="h-4 w-4 mr-2" />
            {language === "de" ? "Labels bearbeiten" : "Edit Labels"} ({selectedObservations.size})
          </Button>
          <Button onClick={() => setShowPhotoQualityDialog(true)} variant="outline" size="lg" className="hidden md:flex shadow-lg hover:shadow-xl transition-all">
            <Download className="h-4 w-4 mr-2" />
            {language === "de" ? "Fotos herunterladen" : "Download Photos"} ({selectedObservations.size})
          </Button>
          <Button onClick={() => setShowSaveDialog(true)} size="lg" className="shadow-lg hover:shadow-xl transition-all">
            {t("generateReportSelected").replace("{count}", selectedObservations.size.toString())}
          </Button>
        </div>
      )}

      {/* Multi-label edit dialog */}
      {showMultiLabelEdit && (() => {
        const selectedObs = observations.filter(o => selectedObservations.has(o.id));
        const firstSiteId = selectedObs[0]?.site_id;
        const currentSiteLabels = firstSiteId ? (siteLabels.get(firstSiteId) || []) : [];
        if (firstSiteId && user && currentSiteLabels.length === 0) fetchSiteLabels(firstSiteId, user.id);
        const allLabelSets = selectedObs.map(o => new Set(o.labels || []));
        const allLabelNames = Array.from(new Set(allLabelSets.flatMap(s => Array.from(s))));
        const commonLabels = allLabelNames.filter(l => allLabelSets.every(s => s.has(l)));
        const partialLabels = allLabelNames.filter(l => !commonLabels.includes(l));
        return (
          <MultiLabelEditDialog
            isOpen={showMultiLabelEdit}
            onClose={() => setShowMultiLabelEdit(false)}
            selectedCount={selectedObservations.size}
            siteLabels={currentSiteLabels}
            selectedPhotos={selectedObs.map(o => ({ id: o.id, signedUrl: o.signedUrl, note: o.note ?? null, labels: o.labels ?? null }))}
            commonLabels={commonLabels}
            partialLabels={partialLabels}
            onSave={handleBulkSaveLabels}
            onRemoveLabelFromPhoto={handleRemoveLabelFromPhoto}
            language={language}
          />
        );
      })()}

      {/* Photo modal */}
      {selectedPhotoObservation && (selectedPhotoObservation.signedUrl || selectedPhotoObservation.note) && (() => {
        const all = getFilteredObservations().filter(o => o.signedUrl || o.note);
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

      {user && <ClaudeChat
        selectedObservations={selectedObservations}
        allObservations={observations.filter(obs => obs.taken_at !== null || obs.photo_date !== null).map(obs => ({
          ...obs, taken_at: obs.taken_at || obs.photo_date || obs.created_at,
        }))}
        onLoadMoreData={async (period: 'week' | 'month') => { await loadMoreObservations(user.id, period); }}
      />}

      {selectionBox && (() => {
        const left = Math.min(selectionBox.startX, selectionBox.currentX);
        const top = Math.min(selectionBox.startY, selectionBox.currentY);
        const width = Math.abs(selectionBox.currentX - selectionBox.startX);
        const height = Math.abs(selectionBox.currentY - selectionBox.startY);
        return (
          <div className="fixed pointer-events-none z-[5]" style={{ left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px`, border: '2px solid #3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)' }} />
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
        availableSites={availableSites}
        initialSiteId={selectedSiteId || null}
      />
    </main>
  );
}
