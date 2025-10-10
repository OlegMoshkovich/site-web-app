"use client";

// Force dynamic rendering to ensure fresh data on each request
export const dynamic = "force-dynamic";

// React hooks for state management and side effects
import { useEffect, useState, useCallback } from "react";
// Supabase client for database operations
import { createClient } from "@/lib/supabase/client";
// Utility function for formatting dates
import { formatDate } from "@/lib/utils";
// UI components from shadcn/ui
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// Lucide React icons
import {
  Calendar,
  MapPin,
  Edit3,
  Check,
  X,
  Trash2,
  Grid3X3,
  List,
  Search,
  Filter,
  Download,
  Settings,
  Tag,
} from "lucide-react";
// Authentication component
import { AuthButtonClient } from "@/components/auth-button-client";
// Footer component
import { Footer } from "@/components/footer";
// Next.js router for navigation
import { useRouter } from "next/navigation";
// Next.js Image component for optimized images
import Image from "next/image";
// Translation system
import { translations, type Language, useLanguage } from "@/lib/translations";
// Utility functions
import {
  filterObservationsBySearch,
  filterObservationsByDateRange,
  filterObservationsByLabels,
  filterObservationsByUserId,
  filterObservationsBySiteId,
  groupObservationsByDate,
  processLabel,
} from "@/lib/search-utils";
// Types
import type { Observation } from "@/types/supabase";

// Extended observation with signed URL for secure photo access
interface ObservationWithUrl extends Observation {
  signedUrl: string | null;      // Temporary signed URL for viewing the photo
  sites?: { name: string } | null; // Site information from join
  profiles?: { email: string } | null; // User profile information from join
}

// Supabase storage bucket name for photos
const BUCKET = "photos";

// Main component for the observations page
export default function Home() {
  // Initialize Supabase client for database operations
  const supabase = createClient();
  // Next.js router for programmatic navigation
  const router = useRouter();

  // ===== STATE MANAGEMENT =====
  // Current authenticated user (null if not logged in)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  // Array of observations with signed photo URLs
  const [observations, setObservations] = useState<ObservationWithUrl[]>([]);
  // Loading state for async operations
  const [isLoading, setIsLoading] = useState(true);
  // Error message if something goes wrong
  const [error, setError] = useState<string | null>(null);
  // Set of selected observation IDs for bulk operations
  const [selectedObservations, setSelectedObservations] = useState<Set<string>>(
    new Set(),
  );
  // Date range selection for filtering observations
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  // Language management with localStorage persistence
  const { language, setLanguage, mounted } = useLanguage();
  // Toggle state for showing/hiding the date selector
  const [showDateSelector, setShowDateSelector] = useState<boolean>(false);
  // Edit state for inline note editing
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteValue, setEditNoteValue] = useState<string>("");
  // View mode state
  const [viewMode, setViewMode] = useState<"card" | "list">("list");
  // Search state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSearchSelector, setShowSearchSelector] = useState<boolean>(false);
  // Label filter state
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [showLabelSelector, setShowLabelSelector] = useState<boolean>(false);
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);
  // User filter state
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [availableUsers, setAvailableUsers] = useState<{id: string, displayName: string}[]>([]);
  // Site filter state  
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [availableSites, setAvailableSites] = useState<{id: string, name: string}[]>([]);

  // ===== UTILITY FUNCTIONS =====
  // Helper function to get translated text based on current language
  const t = useCallback(
    (key: keyof typeof translations.en) => {
      const value = translations[language][key];
      return typeof value === "string" ? value : "";
    },
    [language],
  );

  // Clean up file paths by removing leading slashes and empty strings
  const normalizePath = (v?: string | null) =>
    (v ?? "").trim().replace(/^\/+/, "") || null;

  // ===== PHOTO MANAGEMENT =====
  // Generate a temporary signed URL for viewing a photo from Supabase storage
  // This is necessary because photos are stored privately and need authentication
  const getSignedPhotoUrl = useCallback(
    async (
      filenameOrPath: string,
      expiresIn = 3600,
    ): Promise<string | null> => {
      // Clean up the file path
      const key = normalizePath(filenameOrPath);
      if (!key) return null;

      // Request a signed URL from Supabase storage
      // If the file doesn't exist, this will fail gracefully
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(key, expiresIn);

      if (error) {
        console.error("createSignedUrl error", { 
          key, 
          bucket: BUCKET,
          error: error.message || error 
        });
        return null;
      }

      return data.signedUrl;
    },
    [supabase],
  );

  // ===== ACTION HANDLERS =====
  // Navigate to the report generation page with selected observations
  const handleGenerateReport = useCallback(() => {
    if (selectedObservations.size === 0) return;

    // Convert selected observation IDs to a comma-separated string
    const selectedIds = Array.from(selectedObservations);
    const queryString = selectedIds.join(",");

    // Navigate to the report page with selected observation IDs as URL parameters
    router.push(`/report?ids=${queryString}`);
  }, [selectedObservations, router]);

  // Download photos for selected observations as a ZIP file
  const handleDownloadPhotos = useCallback(async () => {
    if (selectedObservations.size === 0) return;

    try {
      // Get selected observations
      const selectedObs = observations.filter(obs => 
        selectedObservations.has(obs.id)
      );

      // Filter only observations that have photos
      const obsWithPhotos = selectedObs.filter(obs => obs.signedUrl);

      if (obsWithPhotos.length === 0) {
        alert("No photos found in selected observations");
        return;
      }

      // Dynamically import JSZip
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      let downloadCount = 0;
      
      // Download each photo and add to ZIP
      for (const obs of obsWithPhotos) {
        try {
          if (obs.signedUrl) {
            // Fetch the image
            const response = await fetch(obs.signedUrl);
            if (!response.ok) continue;
            
            const blob = await response.blob();
            
            // Create a filename based on observation data
            const date = obs.taken_at || obs.created_at;
            const dateStr = new Date(date).toISOString().split('T')[0];
            const site = obs.sites?.name ? `_${obs.sites.name.replace(/[^a-zA-Z0-9]/g, '_')}` : obs.site_id ? `_site_${obs.site_id.slice(0, 8)}` : '';
            const extension = blob.type.includes('jpeg') || blob.type.includes('jpg') ? '.jpg' : 
                            blob.type.includes('png') ? '.png' : '.jpg';
            
            const filename = `${dateStr}${site}_${obs.id.slice(0, 8)}${extension}`;
            
            // Add to ZIP
            zip.file(filename, blob);
            downloadCount++;
          }
        } catch (error) {
          console.error(`Failed to download photo for observation ${obs.id}:`, error);
          // Continue with other photos
        }
      }

      if (downloadCount === 0) {
        alert("Failed to download any photos");
        return;
      }

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: "blob" });
      
      // Download the ZIP file
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `observations_photos_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log(`Successfully downloaded ${downloadCount} photos in ZIP file`);
    } catch (error) {
      console.error("Error downloading photos:", error);
      alert("Failed to download photos. Please try again.");
    }
  }, [selectedObservations, observations]);

  // ===== NOTE EDITING =====
  // Handle note editing
  const handleEditNote = useCallback(
    (observationId: string, currentNote: string, event: React.MouseEvent) => {
      event.stopPropagation(); // Prevent card selection
      setEditingNoteId(observationId);
      setEditNoteValue(currentNote || "");
    },
    [],
  );

  const handleSaveNote = useCallback(
    async (observationId: string, event?: React.MouseEvent) => {
      if (event) event.stopPropagation(); // Prevent card selection

      try {
        const { error } = await supabase
          .from("observations")
          .update({ note: editNoteValue })
          .eq("id", observationId);

        if (error) {
          console.error("Error updating note:", error);
          alert("Error updating note. Please try again.");
          return;
        }

        // Update local state
        setObservations((prev) =>
          prev.map((obs) =>
            obs.id === observationId ? { ...obs, note: editNoteValue } : obs,
          ),
        );

        setEditingNoteId(null);
        setEditNoteValue("");
      } catch (error) {
        console.error("Error updating note:", error);
        alert("Error updating note. Please try again.");
      }
    },
    [supabase, editNoteValue],
  );

  const handleCancelEdit = useCallback((event?: React.MouseEvent) => {
    if (event) event.stopPropagation(); // Prevent card selection
    setEditingNoteId(null);
    setEditNoteValue("");
  }, []);

  // ===== DELETE FUNCTIONALITY =====
  // Handle observation deletion with confirmation
  const handleDeleteObservation = useCallback(
    async (observationId: string, event: React.MouseEvent) => {
      event.stopPropagation(); // Prevent card selection

      // Show confirmation dialog
      const confirmed = window.confirm(
        "Are you sure you want to delete this observation? This action cannot be undone.",
      );
      if (!confirmed) return;

      try {
        const { error } = await supabase
          .from("observations")
          .delete()
          .eq("id", observationId);

        if (error) {
          console.error("Error deleting observation:", error);
          alert("Error deleting observation. Please try again.");
          return;
        }

        // Remove from local state
        setObservations((prev) =>
          prev.filter((obs) => obs.id !== observationId),
        );

        // Remove from selected observations if it was selected
        setSelectedObservations((prev) => {
          const newSelected = new Set(prev);
          newSelected.delete(observationId);
          return newSelected;
        });

        console.log(`Observation ${observationId} deleted successfully`);
      } catch (error) {
        console.error("Error deleting observation:", error);
        alert("Error deleting observation. Please try again.");
      }
    },
    [supabase],
  );


  const handleClearDateRange = useCallback(() => {
    setStartDate("");
    setEndDate("");
    setSelectedUserId("");
    setSelectedSiteId("");
  }, []);

  const handleSelectAll = useCallback(() => {
    // Get currently visible (filtered) observations
    let filteredObservations = observations;
    
    // Apply date range filter if both dates are set
    if (showDateSelector && startDate && endDate) {
      filteredObservations = filterObservationsByDateRange(
        filteredObservations,
        startDate,
        endDate
      );
    }
    
    // Then apply user filter if active
    if (selectedUserId) {
      filteredObservations = filterObservationsByUserId(filteredObservations, selectedUserId);
    }
    
    // Then apply site filter if active
    if (selectedSiteId) {
      filteredObservations = filterObservationsBySiteId(filteredObservations, selectedSiteId);
    }
    
    // Then apply search filter if active
    if (showSearchSelector && searchQuery.trim()) {
      filteredObservations = filterObservationsBySearch(filteredObservations, searchQuery);
    }
    
    // Then apply label filter if active
    if (showLabelSelector && selectedLabels.length > 0) {
      filteredObservations = filterObservationsByLabels(filteredObservations, selectedLabels, false);
    }
    
    const visibleIds = filteredObservations.map((obs) => obs.id);

    // If all visible observations are already selected, unselect all
    if (visibleIds.every(id => selectedObservations.has(id))) {
      const newSelected = new Set(selectedObservations);
      visibleIds.forEach(id => newSelected.delete(id));
      setSelectedObservations(newSelected);
    } else {
      // Otherwise, select all visible observations
      const newSelected = new Set(selectedObservations);
      visibleIds.forEach(id => newSelected.add(id));
      setSelectedObservations(newSelected);
    }
  }, [observations, selectedObservations, showDateSelector, startDate, endDate, selectedUserId, selectedSiteId, showSearchSelector, searchQuery, showLabelSelector, selectedLabels]);

  // ===== UTILITY FUNCTIONS =====
  // Calculate the minimum and maximum dates available in the observations
  // This is used to set the min/max values for date input fields
  const getAvailableDateRange = useCallback(() => {
    if (observations.length === 0) return { min: "", max: "" };

    // Extract all dates from observations (photo_date or created_at)
    const dates = observations.map(
      (obs) => new Date(obs.taken_at || obs.created_at),
    );
    // Find the earliest and latest dates
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    // Return dates in YYYY-MM-DD format for HTML date inputs
    return {
      min: minDate.toISOString().split("T")[0], // Earliest available date
      max: maxDate.toISOString().split("T")[0], // Latest available date
    };
  }, [observations]);


  // ===== DATA FETCHING =====
  // Main effect that runs when the component mounts to fetch user data and observations
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Step 1: Authenticate the current user
        const { data: authData, error: userError } =
          await supabase.auth.getUser();
        if (userError || !authData.user) {
          setUser(null);
          setIsLoading(false);
          return;
        }
        setUser(authData.user);

        // Step 1.5: Check if user should see onboarding
        try {
          // Check profiles table for onboarding status first
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', authData.user.id)
            .single();

          console.log('Profile check:', { profile, profileError });

          // Redirect to onboarding if:
          // 1. Profile doesn't exist, OR
          // 2. Profile exists but onboarding_completed is false
          if (!profile || (profile && !profile.onboarding_completed)) {
            console.log('Redirecting to onboarding - user needs to complete onboarding');
            router.push("/onboarding");
            return;
          } else {
            console.log('User has completed onboarding - continuing to main app');
          }
        } catch (error) {
          console.warn('Error checking onboarding status, continuing to main app:', error);
        }

        // Step 2: Fetch observations with collaboration permissions
        let base: Observation[];
        try {
          const { fetchCollaborativeObservations } = await import("@/lib/supabase/api");
          base = await fetchCollaborativeObservations(authData.user.id);
        } catch (obsError: unknown) {
          console.error("Error fetching collaborative observations:", obsError);
          const errorMessage = obsError instanceof Error ? obsError.message : String(obsError);
          setError(`${t("errorLoading")} ${errorMessage}`);
          setIsLoading(false);
          return;
        }

        // Step 3: Generate signed URLs for each photo in parallel
        // This is necessary because photos are stored privately in Supabase
        const withUrls: ObservationWithUrl[] = await Promise.all(
          base.map(async (o) => {
            const signedUrl = o.photo_url
              ? await getSignedPhotoUrl(o.photo_url, 3600) // 1 hour expiration
              : null;
            return { ...o, signedUrl };
          }),
        );

        setObservations(withUrls);
        
        // Extract unique labels from all observations
        const allLabels = new Set<string>();
        withUrls.forEach(obs => {
          if (obs.labels) {
            obs.labels.forEach(label => {
              if (label && label.trim()) {
                allLabels.add(label.trim());
              }
            });
          }
        });
        setAvailableLabels(Array.from(allLabels).sort());
        
        // Extract unique users from all observations
        const allUsers = new Map<string, string>();
        withUrls.forEach(obs => {
          if (obs.user_id) {
            const displayName = obs.user_email || `User ${obs.user_id.slice(0, 8)}...`;
            allUsers.set(obs.user_id, displayName);
          }
        });
        setAvailableUsers(Array.from(allUsers.entries()).map(([id, displayName]) => ({ id, displayName })).sort((a, b) => a.displayName.localeCompare(b.displayName)));
        
        // Extract unique sites from all observations
        const allSites = new Map<string, string>();
        withUrls.forEach(obs => {
          if (obs.site_id) {
            const siteName = obs.sites?.name || `Site ${obs.site_id.slice(0, 8)}...`;
            allSites.set(obs.site_id, siteName);
          }
        });
        setAvailableSites(Array.from(allSites.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name)));
        
        setIsLoading(false);
      } catch (e) {
        console.error("Error in fetchData:", e);
        setError(t("unexpectedError"));
        setIsLoading(false);
      }
    };

    fetchData();

    // Listen for auth changes (including logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (
        event: string,
        session: { user: { id: string; email?: string } } | null,
      ) => {
        if (event === "SIGNED_OUT") {
          setUser(null);
          setObservations([]);
          setSelectedObservations(new Set());
          setIsLoading(false);
        } else if (event === "SIGNED_IN" && session?.user) {
          // Refetch data when user signs in
          fetchData();
        }
      },
    );

    return () => subscription.unsubscribe();
  }, [supabase, getSignedPhotoUrl, t, router]);

  // ===== MAIN RENDER =====
  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-0 items-center">
        {/* Top navigation bar with site title, language selector, and auth */}
        <nav className="sticky top-0 z-20 w-full flex justify-center h-16 bg-white/95 backdrop-blur-sm border-b border-gray-200">
          <div className="w-full max-w-5xl flex justify-between items-center px-3 sm:px-5 text-sm">
            <div className="flex text-lg gap-5 items-center font-semibold">
              {user ? "Simple" : t("siteTitle")}
            </div>
            <div className="flex items-center gap-2">
              {user && (
                <Button
                  onClick={() => setShowSearchSelector(!showSearchSelector)}
                  variant="outline"
                  size="sm"
                  className={`h-8 w-8 px-0 text-sm border-gray-300 flex items-center justify-center ${
                    showSearchSelector
                      ? "bg-gray-200 text-gray-700"
                      : "bg-white"
                  }`}
                  title="Toggle search"
                >
                  <Search className="h-4 w-4" />
                </Button>
              )}

              {user && (
                <Button
                  onClick={() => setShowLabelSelector(!showLabelSelector)}
                  variant="outline"
                  size="sm"
                  className={`h-8 w-8 px-0 text-sm border-gray-300 flex items-center justify-center ${
                    showLabelSelector
                      ? "bg-gray-200 text-gray-700"
                      : "bg-white"
                  }`}
                  title="Toggle label filter"
                >
                  <Tag className="h-4 w-4" />
                </Button>
              )}

              {user && (
                <Button
                  onClick={() => setShowDateSelector(!showDateSelector)}
                  variant="outline"
                  size="sm"
                  className={`h-8 w-8 px-0 text-sm border-gray-300 flex items-center justify-center ${
                    showDateSelector ? "bg-gray-200 text-gray-700" : "bg-white"
                  }`}
                  title="Toggle date filter"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              )}

              {/* View Mode Toggle */}
              {user && (
                <button
                  onClick={() =>
                    setViewMode(viewMode === "list" ? "card" : "list")
                  }
                  className="h-8 w-8 px-0 border border-gray-300 transition-colors text-gray-500 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center"
                  title={
                    viewMode === "list"
                      ? "Switch to card view"
                      : "Switch to list view"
                  }
                >
                  {viewMode === "list" ? (
                    <Grid3X3 className="h-4 w-4" />
                  ) : (
                    <List className="h-4 w-4" />
                  )}
                </button>
              )}
              {/* Language selector */}
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="h-8 w-8 px-0 text-sm border border-gray-300 bg-white focus:outline-none focus:border-gray-400 cursor-pointer appearance-none text-center"
                style={{ textAlignLast: "center" }}
              >
                <option value="en">EN</option>
                <option value="de">DE</option>
              </select>

              {/* Settings gear icon */}
              {user && (
                <Button
                  onClick={() => router.push('/settings')}
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 px-0 text-sm border-gray-300 flex items-center justify-center bg-white hover:bg-gray-100"
                  title="Settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}

              <AuthButtonClient />
            </div>
          </div>
        </nav>

        {/* Main content area with responsive padding */}
        <div className="flex-1 flex flex-col gap-0 max-w-5xl px-3 sm:px-5 py-1 sm:py-3 md:py-4">
          <div className="w-full">
            {/* Conditional rendering based on app state */}
            {!user ? (
              // Show welcome message when user is not logged in
              <div className="text-center py-20
               sm:py-12">
                <h1 className="text-4xl sm:text-7xl md:text-8xl lg:text-6xl font-bold text-gray-900 mb-8">
                  {t("welcomeTitle")}
                </h1>
                {/* <p className="text-muted-foreground text-sm">{t('pleaseSignIn')}</p> */}

                {/* App Screenshots */}
                <div className="mt-8 max-w-lg mx-auto">
                  <div className="flex justify-center items-center gap-0 space-x-1 mx-auto">
                    <div className="relative overflow-hidden rounded-lg shadow-lg bg-gray-100">
                      <Image
                        src="/app_screens/Screen1.jpeg"
                        alt="App Screenshot 1"
                        width={130}
                        height={240}
                        className="w-full h-full object-cover"
                        priority
                        placeholder="blur"
                        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTMwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDEzMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMzAiIGhlaWdodD0iMjQwIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPg=="
                      />
                    </div>
                    <div className="relative overflow-hidden rounded-lg shadow-lg bg-gray-100">
                      <Image
                        src="/app_screens/Screen2.jpeg"
                        alt="App Screenshot 2"
                        width={130}
                        height={240}
                        className="w-full h-full object-cover"
                        priority
                        placeholder="blur"
                        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTMwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDEzMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMzAiIGhlaWdodD0iMjQwIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPg=="
                      />
                    </div>
                    <div className="relative overflow-hidden rounded-lg shadow-lg  bg-gray-100">
                      <Image
                        src="/app_screens/Screen3.jpeg"
                        alt="App Screenshot 3"
                        width={130}
                        height={240}
                        className="w-full h-full object-cover"
                        priority
                        placeholder="blur"
                        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTMwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDEzMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMzAiIGhlaWdodD0iMjQwIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPg=="
                      />
                    </div>
                  </div>
                  
                  {/* App Store Badge */}
                  <div className="mt-8 flex justify-center">
                    <a 
                      href="https://apps.apple.com/us/app/simple-site/id6749160249"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative hover:opacity-80 transition-opacity"
                    >
                      <Image
                        src="/app_screens/available-app-store.png"
                        alt="Available on the App Store"
                        width={100}
                        height={30}
                        className="w-auto h-auto object-contain"
                      />
                    </a>
                  </div>
                </div>
              </div>
            ) : isLoading ? (
              // Show loading spinner while fetching data
              <div className="text-center py-12">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                </div>
              </div>
            ) : error ? (
              // Show error message if something went wrong
              <div className="text-red-500">{error}</div>
            ) : observations.length > 0 ? (
              <div className="space-y-8">
                {/* Date Range Selection - Conditionally rendered */}
                {showDateSelector && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-2 sm:p-4 bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-2 sm:gap-4">
                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor="startDate"
                          className="text-sm font-medium text-muted-foreground"
                        >
                          {t("start")}
                        </label>
                        <input
                          type="date"
                          id="startDate"
                          value={startDate}
                          onChange={(e) => {
                            const newStartDate = e.target.value;
                            setStartDate(newStartDate);

                            // No longer auto-selecting - just filtering the display
                          }}
                          min={getAvailableDateRange().min}
                          max={endDate || getAvailableDateRange().max}
                          className="px-2 py-1 text-sm border focus:outline-none focus:ring-primary w-32 sm:w-auto"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor="endDate"
                          className="text-sm font-medium text-muted-foreground"
                        >
                          {t("end")}
                        </label>
                        <input
                          type="date"
                          id="endDate"
                          value={endDate}
                          onChange={(e) => {
                            const newEndDate = e.target.value;
                            setEndDate(newEndDate);

                            // No longer auto-selecting - just filtering the display
                          }}
                          min={startDate || getAvailableDateRange().min}
                          max={getAvailableDateRange().max}
                          className="px-2 py-1 text-sm border focus:outline-none focus:ring-primary w-32 sm:w-auto"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor="userFilter"
                          className="text-sm font-medium text-muted-foreground"
                        >
                          {t("user")}
                        </label>
                        <select
                          id="userFilter"
                          value={selectedUserId}
                          onChange={(e) => setSelectedUserId(e.target.value)}
                          className="px-2 py-1 text-sm border focus:outline-none focus:ring-primary w-32 sm:w-auto"
                        >
                          <option value="">{t("allUsers")}</option>
                          {availableUsers.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.displayName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor="siteFilter"
                          className="text-sm font-medium text-muted-foreground"
                        >
                          {t("site")}
                        </label>
                        <select
                          id="siteFilter"
                          value={selectedSiteId}
                          onChange={(e) => setSelectedSiteId(e.target.value)}
                          className="px-2 py-1 text-sm border focus:outline-none focus:ring-primary w-32 sm:w-auto"
                        >
                          <option value="">{t("allSites")}</option>
                          {availableSites.map((site) => (
                            <option key={site.id} value={site.id}>
                              {site.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-row gap-1 sm:gap-3 w-full sm:w-auto">
                        <Button
                          onClick={handleClearDateRange}
                          disabled={!startDate && !endDate && !selectedUserId && !selectedSiteId}
                          size="sm"
                          variant="outline"
                          className="flex-1 sm:w-auto text-xs px-2"
                        >
                          {t("clear")}
                        </Button>
                        <Button
                          onClick={handleSelectAll}
                          size="sm"
                          variant="outline"
                          className="flex-1 sm:w-auto text-xs px-2"
                        >
                          {(() => {
                            // Get currently visible (filtered) observations count for button text
                            let filteredObservations = observations;
                            
                            // Apply date range filter if both dates are set
                            if (showDateSelector && startDate && endDate) {
                              filteredObservations = filterObservationsByDateRange(
                                filteredObservations,
                                startDate,
                                endDate
                              );
                            }
                            
                            // Then apply user filter if active
                            if (selectedUserId) {
                              filteredObservations = filterObservationsByUserId(filteredObservations, selectedUserId);
                            }
                            
                            // Then apply site filter if active
                            if (selectedSiteId) {
                              filteredObservations = filterObservationsBySiteId(filteredObservations, selectedSiteId);
                            }
                            
                            // Then apply search filter if active
                            if (showSearchSelector && searchQuery.trim()) {
                              filteredObservations = filterObservationsBySearch(filteredObservations, searchQuery);
                            }
                            
                            // Then apply label filter if active
                            if (showLabelSelector && selectedLabels.length > 0) {
                              filteredObservations = filterObservationsByLabels(filteredObservations, selectedLabels, false);
                            }
                            
                            const visibleIds = filteredObservations.map((obs) => obs.id);
                            const allVisibleSelected = visibleIds.every(id => selectedObservations.has(id));
                            
                            return allVisibleSelected ? t("unselectAll") : t("selectAll");
                          })()}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Search Input - Conditionally rendered */}
                {showSearchSelector && (
                  <div className="flex flex-col gap-2 w-full">
                    <label className="text-sm font-medium text-muted-foreground">
                      {t("search")}
                    </label>
                    <input
                      type="text"
                      placeholder={t("searchObservations")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 text-base border border-gray-300 focus:outline-none focus:border-gray-400"
                      style={{ fontSize: "16px" }}
                    />
                    {searchQuery && (
                      <div className="text-xs text-muted-foreground">
                        {(() => {
                          const filteredCount = filterObservationsBySearch(
                            observations,
                            searchQuery,
                          ).length;
                          return `${filteredCount} result${filteredCount !== 1 ? "s" : ""} found`;
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* Label Filter - Conditionally rendered */}
                {showLabelSelector && (
                  <div className="flex flex-col gap-3 w-full max-h-80 overflow-y-auto pr-1">
                    <label className="text-sm font-medium text-muted-foreground">
                      {t("filterByLabels")}
                    </label>
                    {availableLabels.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {availableLabels.map((label) => {
                          const isSelected = selectedLabels.includes(label);
                          const processedLabel = processLabel(label);
                          return (
                            <button
                              key={label}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedLabels(prev => prev.filter(l => l !== label));
                                } else {
                                  setSelectedLabels(prev => [...prev, label]);
                                }
                              }}
                              className={`px-3 py-1 text-sm border transition-colors ${
                                isSelected
                                  ? "bg-black text-white border-black"
                                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {processedLabel}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {t("noLabelsFound")}
                      </div>
                    )}
                    {selectedLabels.length > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          {selectedLabels.length} {selectedLabels.length === 1 ? t("labelSelected") : t("labelsSelected")}
                        </div>
                        <button
                          onClick={() => setSelectedLabels([])}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          {t("clearAllLabels")}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {(() => {
                  // Start with all observations
                  let filteredObservations = observations;
                  
                  // Apply date range filter if both dates are set
                  if (showDateSelector && startDate && endDate) {
                    filteredObservations = filterObservationsByDateRange(
                      filteredObservations,
                      startDate,
                      endDate
                    );
                  }
                  
                  // Then apply user filter if active
                  if (selectedUserId) {
                    filteredObservations = filterObservationsByUserId(filteredObservations, selectedUserId);
                  }
                  
                  // Then apply site filter if active
                  if (selectedSiteId) {
                    filteredObservations = filterObservationsBySiteId(filteredObservations, selectedSiteId);
                  }
                  
                  // Then apply search filter if active
                  if (showSearchSelector && searchQuery.trim()) {
                    filteredObservations = filterObservationsBySearch(filteredObservations, searchQuery);
                  }
                  
                  // Then apply label filter if active
                  if (showLabelSelector && selectedLabels.length > 0) {
                    filteredObservations = filterObservationsByLabels(filteredObservations, selectedLabels, false); // OR logic - match any selected label
                  }

                  // Group filtered observations by date
                  const { groups: groupedObservations, sortedDates } =
                    groupObservationsByDate(filteredObservations);

                  return sortedDates.map((dateKey) => (
                    <div key={dateKey} className="space-y-4">
                      {/* Date Header */}
                      <div className="border-b border-gray-200 pb-1">
                        <div className="text-sm ">
                          {new Date(dateKey)
                            .toLocaleDateString(
                              language === "de" ? "de-DE" : "en-US",
                              {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )
                            .toUpperCase()}
                        </div>
                      </div>

                      {/* Observations for this date */}
                      <div
                        className={
                          viewMode === "card"
                            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6"
                            : "space-y-3 px-1 sm:px-0"
                        }
                      >
                        {groupedObservations[dateKey].map((observation) => {
                          const hasPhoto = Boolean(observation.signedUrl);
                          const labels = observation.labels ?? [];

                          if (viewMode === "list") {
                            return (
                              <div
                                key={observation.id}
                                className={`flex items-start gap-3 p-4 border hover:shadow-md transition-all cursor-pointer group ${
                                  selectedObservations.has(observation.id)
                                    ? "ring-2 ring-primary shadow-md bg-primary/5"
                                    : "hover:bg-muted/50"
                                }`}
                                onClick={() => {
                                  const newSelected = new Set(
                                    selectedObservations,
                                  );
                                  if (newSelected.has(observation.id)) {
                                    newSelected.delete(observation.id);
                                  } else {
                                    newSelected.add(observation.id);
                                  }
                                  setSelectedObservations(newSelected);
                                }}
                              >
                                {/* Photo thumbnail - larger on desktop */}
                                <div className="relative w-20 h-20 sm:w-32 sm:h-32 md:w-40 md:h-40 flex-shrink-0 overflow-hidden group/photo">
                                  {hasPhoto ? (
                                    <>
                                      {/* Skeleton loading background */}
                                      <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                                      <Image
                                        src={observation.signedUrl as string}
                                        alt={`Photo for ${observation.sites?.name || (observation.site_id ? `site ${observation.site_id.slice(0, 8)}` : "observation")}`}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 640px) 80px, (max-width: 768px) 128px, 160px"
                                        onLoad={(e) => {
                                          // Hide skeleton when image loads
                                          const skeleton = e.currentTarget.previousElementSibling as HTMLElement;
                                          if (skeleton) skeleton.style.display = 'none';
                                        }}
                                      />
                                    </>
                                  ) : (
                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center border">
                                      <span className="text-sm font-medium text-gray-600">Note</span>
                                    </div>
                                  )}

                                  {/* Delete button for list view */}
                                  <button
                                    onClick={(e) =>
                                      handleDeleteObservation(observation.id, e)
                                    }
                                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white p-1 rounded-full shadow-lg"
                                    title="Delete observation"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  {editingNoteId === observation.id ? (
                                    <div
                                      className="space-y-2"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <textarea
                                        value={editNoteValue}
                                        onChange={(e) =>
                                          setEditNoteValue(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                          if (
                                            e.key === "Enter" &&
                                            (e.ctrlKey || e.metaKey)
                                          ) {
                                            e.preventDefault();
                                            handleSaveNote(observation.id);
                                          }
                                          if (e.key === "Escape") {
                                            e.preventDefault();
                                            handleCancelEdit();
                                          }
                                        }}
                                        className="w-full p-2 text-sm border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows={2}
                                        placeholder="Add a note..."
                                        autoFocus
                                      />
                                      <div className="flex items-center justify-between">
                                        <div className="flex gap-2">
                                          <button
                                            onClick={(e) =>
                                              handleSaveNote(observation.id, e)
                                            }
                                            className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                          >
                                            <Check className="h-3 w-3" />
                                            Save
                                          </button>
                                          <button
                                            onClick={handleCancelEdit}
                                            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                                          >
                                            <X className="h-3 w-3" />
                                            Cancel
                                          </button>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          Ctrl+Enter to save • Esc to cancel
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <div className="flex items-start justify-between gap-2">
                                        <p
                                          className={`text-sm flex-1 ${!observation.note ? "text-muted-foreground italic" : ""}`}
                                        >
                                          {observation.note ||
                                            t("noDescription")}
                                        </p>
                                        <button
                                          onClick={(e) =>
                                            handleEditNote(
                                              observation.id,
                                              observation.note || "",
                                              e,
                                            )
                                          }
                                          className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 text-gray-500 hover:text-blue-600 transition-all"
                                          title="Edit note"
                                        >
                                          <Edit3 className="h-3 w-3" />
                                        </button>
                                      </div>

                                      {/* Metadata in compact form */}
                                      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1 text-xs">
                                          <Calendar className="h-3 w-3" />
                                          {new Date(
                                            observation.taken_at ||
                                              observation.created_at,
                                          ).toLocaleDateString()}
                                        </span>
                                        
                                        {(observation.sites?.name || observation.site_id) && (
                                          <span className="flex items-center gap-1 text-xs">
                                            <MapPin className="h-3 w-3" />
                                            <span className="truncate">
                                              Site: {observation.sites?.name || `${observation.site_id?.slice(0, 8)}...`}
                                            </span>
                                          </span>
                                        )}

                                        {/* Tags/Labels section - positioned under site information */}
                                        {labels && labels.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {labels.slice(0, 4).map((label, idx) => {
                                              const cleanLabel = label.trim();
                                              let processedLabel = cleanLabel;

                                              // First, try to split by common separators
                                              if (cleanLabel.includes(" ")) {
                                                processedLabel = cleanLabel;
                                              } else if (cleanLabel.includes("_")) {
                                                processedLabel = cleanLabel.replace(/_/g, " ");
                                              } else if (cleanLabel.includes("-")) {
                                                processedLabel = cleanLabel.replace(/-/g, " ");
                                              } else {
                                                // Split camelCase and PascalCase more aggressively
                                                processedLabel = cleanLabel
                                                  .replace(/([a-z])([A-Z])/g, "$1 $2")
                                                  .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
                                                  .replace(/([a-z])([0-9])/g, "$1 $2")
                                                  .replace(/([0-9])([a-zA-Z])/g, "$1 $2");
                                              }

                                              processedLabel = processedLabel.replace(/\s+/g, " ").trim();

                                              return (
                                                <Badge
                                                  key={`${observation.id}-label-${idx}`}
                                                  variant="outline"
                                                  className="text-xs px-1.5 py-0.5 border border-gray-300 bg-white text-gray-700"
                                                >
                                                  {processedLabel}
                                                </Badge>
                                              );
                                            })}
                                            {labels.length > 4 && (
                                              <Badge
                                                variant="outline"
                                                className="text-xs px-1.5 py-0.5 border border-gray-300 bg-gray-50 text-gray-500"
                                              >
                                                +{labels.length - 4}
                                              </Badge>
                                            )}
                                          </div>
                                        )}

                                        <span className="flex items-center gap-1 text-xs">
                                          <span className="font-medium">Created by:</span>
                                          <span className="truncate">{observation.user_email || `User ${observation.user_id.slice(0, 8)}...`}</span>
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }

                          return (
                            <Card
                              key={observation.id}
                              className={`overflow-hidden hover:shadow-lg transition-all cursor-pointer group ${
                                selectedObservations.has(observation.id)
                                  ? "ring-2 ring-primary shadow-lg scale-102 bg-primary/5"
                                  : "hover:bg-muted/50"
                              }`}
                              onClick={() => {
                                const newSelected = new Set(
                                  selectedObservations,
                                );
                                if (newSelected.has(observation.id)) {
                                  newSelected.delete(observation.id);
                                } else {
                                  newSelected.add(observation.id);
                                }
                                setSelectedObservations(newSelected);
                              }}
                            >
                              {hasPhoto && (
                                <div className="relative aspect-square w-full group/photo">
                                  {/* Skeleton loading background */}
                                  <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                                  <Image
                                    src={observation.signedUrl as string}
                                    alt={`Photo for ${observation.sites?.name || (observation.site_id ? `site ${observation.site_id.slice(0, 8)}` : "observation")}`}
                                    fill
                                    className="object-contain bg-gray-50"
                                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                                    onLoad={(e) => {
                                      // Hide skeleton when image loads
                                      const skeleton = e.currentTarget.previousElementSibling as HTMLElement;
                                      if (skeleton) skeleton.style.display = 'none';
                                    }}
                                  />
                                  {/* Delete button positioned over photo */}
                                  <button
                                    onClick={(e) =>
                                      handleDeleteObservation(observation.id, e)
                                    }
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg"
                                    title="Delete observation"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              )}

                              {/* Delete button for cards without photos */}
                              {!hasPhoto && (
                                <button
                                  onClick={(e) =>
                                    handleDeleteObservation(observation.id, e)
                                  }
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg"
                                  title="Delete observation"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}


                              <CardHeader>
                                {editingNoteId === observation.id ? (
                                  <div
                                    className="space-y-2"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <textarea
                                      value={editNoteValue}
                                      onChange={(e) =>
                                        setEditNoteValue(e.target.value)
                                      }
                                      onKeyDown={(e) => {
                                        if (
                                          e.key === "Enter" &&
                                          (e.ctrlKey || e.metaKey)
                                        ) {
                                          e.preventDefault();
                                          handleSaveNote(observation.id);
                                        }
                                        if (e.key === "Escape") {
                                          e.preventDefault();
                                          handleCancelEdit();
                                        }
                                      }}
                                      className="w-full p-2 text-sm border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      rows={3}
                                      placeholder="Add a note..."
                                      autoFocus
                                    />
                                    <div className="flex items-center justify-between">
                                      <div className="flex gap-2">
                                        <button
                                          onClick={(e) =>
                                            handleSaveNote(observation.id, e)
                                          }
                                          className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                        >
                                          <Check className="h-3 w-3" />
                                          Save
                                        </button>
                                        <button
                                          onClick={handleCancelEdit}
                                          className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                                        >
                                          <X className="h-3 w-3" />
                                          Cancel
                                        </button>
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        Ctrl+Enter to save • Esc to cancel
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="relative group">
                                    <div className="flex items-start justify-between gap-2">
                                      <CardDescription
                                        className={`line-clamp-2 flex-1 ${!observation.note ? "text-muted-foreground italic" : ""}`}
                                      >
                                        {observation.note || t("noDescription")}
                                      </CardDescription>
                                      <button
                                        onClick={(e) =>
                                          handleEditNote(
                                            observation.id,
                                            observation.note || "",
                                            e,
                                          )
                                        }
                                        className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 text-gray-500 hover:text-blue-600 transition-all"
                                        title="Edit note"
                                      >
                                        <Edit3 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </CardHeader>

                              <CardContent className="space-y-3">
                                {(observation.sites?.name || observation.site_id) && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span className="font-medium">Site:</span>
                                    <span>{observation.sites?.name || `${observation.site_id?.slice(0, 8)}...`}</span>
                                  </div>
                                )}

                                {/* Tags/Labels section - positioned under site information */}
                                {labels && labels.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {labels.map((label, idx) => {
                                      // Clean up the label - remove extra spaces and split if it's concatenated
                                      const cleanLabel = label.trim();

                                      // More aggressive splitting for concatenated strings
                                      let processedLabel = cleanLabel;

                                      // First, try to split by common separators
                                      if (cleanLabel.includes(" ")) {
                                        processedLabel = cleanLabel;
                                      } else if (cleanLabel.includes("_")) {
                                        processedLabel = cleanLabel.replace(
                                          /_/g,
                                          " ",
                                        );
                                      } else if (cleanLabel.includes("-")) {
                                        processedLabel = cleanLabel.replace(
                                          /-/g,
                                          " ",
                                        );
                                      } else {
                                        // Split camelCase and PascalCase more aggressively
                                        processedLabel = cleanLabel
                                          .replace(/([a-z])([A-Z])/g, "$1 $2") // camelCase
                                          .replace(
                                            /([A-Z])([A-Z][a-z])/g,
                                            "$1 $2",
                                          ) // PascalCase
                                          .replace(/([a-z])([0-9])/g, "$1 $2") // letters to numbers
                                          .replace(
                                            /([0-9])([a-zA-Z])/g,
                                            "$1 $2",
                                          ); // numbers to letters
                                      }

                                      // Clean up multiple spaces and trim
                                      processedLabel = processedLabel
                                        .replace(/\s+/g, " ")
                                        .trim();

                                      return (
                                        <Badge
                                          key={`${observation.id}-label-${idx}`}
                                          variant="outline"
                                          className="text-xs px-2 py-1 border border-gray-300 bg-white hover:bg-gray-100 transition-colors"
                                        >
                                          {processedLabel}
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                )}

                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span className="font-medium">Created by:</span>
                                  <span>{observation.user_email || `User ${observation.user_id.slice(0, 8)}...`}</span>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calendar className="h-4 w-4" />
                                  <span>
                                    {formatDate(
                                      observation.taken_at ||
                                        observation.created_at,
                                    )}
                                  </span>
                                </div>

                                {observation.latitude != null &&
                                  observation.longitude != null && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <MapPin className="h-4 w-4" />
                                      <span>
                                        {observation.latitude.toFixed(6)},{" "}
                                        {observation.longitude.toFixed(6)}
                                      </span>
                                    </div>
                                  )}

                                {observation.anchor_x != null &&
                                  observation.anchor_y != null &&
                                  !(observation.anchor_x === 0 && observation.anchor_y === 0) && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="h-4 w-4" />
                                    <span className="font-medium">
                                      Plan Anchor:
                                    </span>
                                    <span>
                                      {`${observation.anchor_x.toFixed(6)}, ${observation.anchor_y.toFixed(6)}`}
                                    </span>
                                  </div>
                                )}

                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  {t("noObservationsFound")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons - Absolutely positioned at bottom right */}
      {selectedObservations.size > 0 && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
          <Button
            onClick={() => setSelectedObservations(new Set())}
            variant="secondary"
            size="lg"
            className="shadow-lg hover:shadow-xl transition-all"
          >
            {t("clearSelection")}
          </Button>
          <Button
            onClick={handleDownloadPhotos}
            variant="outline"
            size="lg"
            className="shadow-lg hover:shadow-xl transition-all"
          >
            <Download className="h-4 w-4 mr-2" />
            {language === "de" ? "Fotos herunterladen" : "Download Photos"} ({selectedObservations.size})
          </Button>
          <Button
            onClick={handleGenerateReport}
            size="lg"
            className="shadow-lg hover:shadow-xl transition-all"
          >
            {t("generateReportSelected").replace(
              "{count}",
              selectedObservations.size.toString(),
            )}
          </Button>
        </div>
      )}

      {!isLoading && (
        <Footer />
      )}
    </main>
  );
}
