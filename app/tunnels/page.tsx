"use client";

/* eslint-disable @typescript-eslint/no-unused-vars */

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
  ZoomIn,
} from "lucide-react";
// Authentication component
import { AuthButtonClient } from "@/components/auth-button-client";
// Footer component
import { Footer } from "@/components/footer";
// Photo modal component
import { PhotoModal } from "@/components/photo-modal";
// Next.js router for navigation
import { useRouter } from "next/navigation";
// Next.js Image component for optimized images
import Image from "next/image";
// Next.js Link component for navigation
import Link from "next/link";
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
export default function Tunnels() {
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
  // Loading state for loading more observations
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  // Whether there are more observations to load
  const [hasMore, setHasMore] = useState(false);
  // Current week offset for pagination
  const [weekOffset, setWeekOffset] = useState(0);
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
  // Photo modal state for tunnel photos
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{src: string, alt: string} | null>(null);

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

  // ===== PHOTO MODAL FUNCTIONALITY =====
  const handleOpenPhotoModal = useCallback((photo: {src: string, alt: string}) => {
    setSelectedPhoto(photo);
    setPhotoModalOpen(true);
  }, []);

  const handleClosePhotoModal = useCallback(() => {
    setPhotoModalOpen(false);
    setSelectedPhoto(null);
  }, []);




  // ===== DATA FETCHING =====
  // Main effect that runs when the component mounts to fetch user data and observations
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setWeekOffset(0);
        setHasMore(false);

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

        // Step 2: Fetch first week of observations with collaboration permissions
        let base: Observation[];
        let hasMoreData = false;
        try {
          const { fetchCollaborativeObservationsByWeek } = await import("@/lib/supabase/api");
          const result = await fetchCollaborativeObservationsByWeek(authData.user.id, 1, 0);
          base = result.observations;
          hasMoreData = result.hasMore;
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
        setHasMore(hasMoreData);
        
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
          setWeekOffset(0);
          setHasMore(false);
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
              <Link 
                href="/" 
                className="text-lg font-semibold text-gray-900 hover:text-gray-700 transition-colors"
              >
                {user ? "Tunnels" : t("siteTitle")}
              </Link>
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
            <div className="text-center py-20
               sm:py-12">
                <h1 className="text-4xl sm:text-7xl md:text-8xl lg:text-6xl font-bold text-gray-900 mb-8">
                  {t("welcomeTitle")}
                </h1>
                {/* <p className="text-muted-foreground text-sm">{t('pleaseSignIn')}</p> */}

                {/* Tunnel Photos Gallery */}
                <div className="mt-8 max-w-4xl mx-auto">
                  <div className="grid grid-cols-2 gap-4 md:gap-6">
                    {[
                      { src: "/tunnels/15.PNG", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/1.JPG", alt: "Tunnel Construction Site 1" },               
                      { src: "/tunnels/2.jpg", alt: "Tunnel Construction Site 2" },
                      { src: "/tunnels/10.jpg", alt: "Tunnel Construction Site 10" },
                      { src: "/tunnels/8.jpg", alt: "Tunnel Construction Site 8" },
                      { src: "/tunnels/4.JPG", alt: "Tunnel Construction Site 4" },
                      { src: "/tunnels/3.JPG", alt: "Tunnel Construction Site 3" },
                      { src: "/tunnels/17.jpg", alt: "Tunnel Construction Site 11" },    
                      { src: "/tunnels/9.jpg", alt: "Tunnel Construction Site 9" },
                      { src: "/tunnels/7.jpg", alt: "Tunnel Construction Site 7" },     
                      { src: "/tunnels/14.PNG", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/12.JPG", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/13.PNG", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/5.JPG", alt: "Tunnel Construction Site 5" },
                      { src: "/tunnels/6.JPG", alt: "Tunnel Construction Site 6" },
                      { src: "/tunnels/11.jpg", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/22.png", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/21.png", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/23.png", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/24.png", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/25.png", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/26.png", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/27.png", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/28.png", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/29.png", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/30.png", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/31.png", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/32.png", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/33.jpg", alt: "Tunnel Construction Site 11" },
                      { src: "/tunnels/34.jpg", alt: "Tunnel Construction Site 11" },


              
                    ].map((photo, index) => (
                      <div 
                        key={index} 
                        className="relative overflow-hidden rounded-none shadow-lg bg-gray-100 aspect-[4/3] cursor-pointer"
                        onClick={() => handleOpenPhotoModal(photo)}
                      >
                        <Image
                          src={photo.src}
                          alt={photo.alt}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>

   
      {!isLoading && (
        <Footer />
      )}

      {/* Simple Photo Modal */}
      {photoModalOpen && selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-75"
            onClick={handleClosePhotoModal}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-none max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Close Button */}
            <button
              onClick={handleClosePhotoModal}
              className="absolute top-4 right-4 z-10 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-none p-2 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            {/* Image */}
            <div className="relative">
              <Image
                src={selectedPhoto.src}
                alt={selectedPhoto.alt}
                width={800}
                height={600}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}

    </main>
  );
}