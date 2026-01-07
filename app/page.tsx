"use client";

// Force dynamic rendering to ensure fresh data on each request
export const dynamic = "force-dynamic";

// React hooks for state management and side effects
import { useEffect, useState, useCallback, Suspense } from "react";
// Supabase client for database operations
import { createClient } from "@/lib/supabase/client";
// UI components from shadcn/ui
// Note: Card components removed as they're no longer used in grid view
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
// Lucide React icons
import {
  Trash2,
  Search,
  Filter,
  Download,
  Settings,
  Tag,
  ZoomIn,
  FileText,
  Info,
} from "lucide-react";
// Authentication component
import { AuthButtonClient } from "@/components/auth-button-client";
// Footer component
import { Footer } from "@/components/footer";
// Photo modal component
import { PhotoModal } from "@/components/photo-modal";
// Claude chat component
import { ClaudeChat } from "@/components/claude-chat";
// User manual carousel component
import { UserManualCarousel } from "@/components/user-manual-carousel";
// Next.js router for navigation
import { useRouter } from "next/navigation";
// Next.js Image component for optimized images
import Image from "next/image";
// Translation system
import { translations, useLanguage } from "@/lib/translations";
// Layout constants
import { getNavbarClasses, getContentClasses } from "@/lib/layout-constants";
// Zustand store for observations
import { useObservationsStore } from "@/lib/store/observations-store";
// API functions
import { getSignedPhotoUrl } from "@/lib/supabase/api";
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
  user_email?: string; // User email from the query
}

// Note: BUCKET constant moved to API layer

// Main component for the observations page
export default function Home() {
  // Initialize Supabase client for database operations
  const supabase = createClient();
  // Next.js router for programmatic navigation
  const router = useRouter();

  // ===== STATE MANAGEMENT =====
  // Current authenticated user (null if not logged in)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

  // Zustand store for observations
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
    clearStore
  } = useObservationsStore();
  // Set of selected observation IDs for bulk operations
  const [selectedObservations, setSelectedObservations] = useState<Set<string>>(
    new Set(),
  );
  // Date range selection for filtering observations
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  // Language management with localStorage persistence
  const { language, mounted } = useLanguage();
  // Toggle state for showing/hiding the date selector
  const [showDateSelector, setShowDateSelector] = useState<boolean>(false);
  // Search state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSearchSelector, setShowSearchSelector] = useState<boolean>(false);
  // Label filter state
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [showLabelSelector, setShowLabelSelector] = useState<boolean>(false);
  // Use labels from store
  const availableLabels = storeAvailableLabels;
  // User filter state
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [availableUsers, setAvailableUsers] = useState<{id: string, displayName: string}[]>([]);
  // Site filter state
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [availableSites, setAvailableSites] = useState<{id: string, name: string}[]>([]);
  // Photo modal state
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedPhotoObservation, setSelectedPhotoObservation] = useState<ObservationWithUrl | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(0);
  // Campaign modal state
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignImageLoading, setCampaignImageLoading] = useState(true);
  // Save report modal state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportErsteller, setReportErsteller] = useState('');
  const [reportBaustelle, setReportBaustelle] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // ===== UTILITY FUNCTIONS =====
  // Helper function to get translated text based on current language
  const t = useCallback(
    (key: keyof typeof translations.en) => {
      const value = translations[language][key];
      return typeof value === "string" ? value : "";
    },
    [language],
  );

  // Note: normalizePath function moved to API layer

  // ===== PHOTO MANAGEMENT =====
  // Note: getSignedPhotoUrl is now handled in the Zustand store via the API

  // ===== ACTION HANDLERS =====
  // Show save report dialog for selected observations
  const handleGenerateReport = useCallback(() => {
    if (selectedObservations.size === 0) return;

    // Show the save report dialog
    setShowSaveDialog(true);
  }, [selectedObservations]);

  // Compress image blob for download with multi-pass approach
  const compressImageForDownload = useCallback((blob: Blob, targetSizeKB: number = 50): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      // If it's not an image, return as-is
      if (!blob.type.startsWith('image/')) {
        resolve(blob);
        return;
      }

      // Even if it's small, still compress it to ensure consistency
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = typeof window !== "undefined" ? new window.Image() : null;
        if (!img) {
          reject(new Error("Could not create Image object in this environment"));
          return;
        }

        // Set up timeout to prevent hanging
        const timeout = setTimeout(() => {
          reject(new Error('Image compression timeout'));
        }, 30000);

        img.onload = () => {
          try {
            clearTimeout(timeout);

            // Multi-pass compression: try different dimension sizes
            const compressionPasses = [
              { maxDim: 600, quality: 0.3 },  // Very aggressive first pass
              { maxDim: 500, quality: 0.25 }, // Even more aggressive
              { maxDim: 400, quality: 0.2 },  // Very small
              { maxDim: 300, quality: 0.15 }  // Tiny but readable
            ];

            let passIndex = 0;

            const tryPass = () => {
              if (passIndex >= compressionPasses.length) {
                // If all passes fail, use the tiniest possible version
                canvas.width = 200;
                canvas.height = 200;
                ctx?.drawImage(img, 0, 0, 200, 200);
                canvas.toBlob((finalBlob) => {
                  resolve(finalBlob || blob);
                }, 'image/jpeg', 0.1);
                return;
              }

              const pass = compressionPasses[passIndex];
              let { width, height } = img;

              // Calculate dimensions for this pass
              if (width > height && width > pass.maxDim) {
                height = (height * pass.maxDim) / width;
                width = pass.maxDim;
              } else if (height > pass.maxDim) {
                width = (width * pass.maxDim) / height;
                height = pass.maxDim;
              }

              canvas.width = width;
              canvas.height = height;

              if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
              }

              // Draw image
              ctx.drawImage(img, 0, 0, width, height);

              // Try compression with current pass settings
              canvas.toBlob((compressedBlob) => {
                if (!compressedBlob) {
                  passIndex++;
                  tryPass(); // Try next pass
                  return;
                }

                // If this pass achieves target size, use it
                if (compressedBlob.size <= targetSizeKB * 1024) {
                  resolve(compressedBlob);
                } else {
                  // Try next pass
                  passIndex++;
                  tryPass();
                }
              }, 'image/jpeg', pass.quality);
            };

            tryPass();
          } catch (error) {
            clearTimeout(timeout);
            reject(error);
          }
        };

        img.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Failed to load image for compression'));
        };

        // Set CORS to anonymous to handle cross-origin issues
        img.crossOrigin = 'anonymous';
        img.src = URL.createObjectURL(blob);
      } catch (error) {
        reject(error);
      }
    });
  }, []);

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

            // Try to compress the image for download, fallback to original if it fails
            let finalBlob = blob;
            let extension = blob.type.includes('jpeg') || blob.type.includes('jpg') ? '.jpg' :
                           blob.type.includes('png') ? '.png' : '.jpg';

            try {
              // Attempt compression for images only (target 30KB for very small files)
              if (blob.type.startsWith('image/')) {
                const compressedBlob = await compressImageForDownload(blob, 30);
                finalBlob = compressedBlob;
                extension = '.jpg'; // Compressed images are always JPEG
              }
            } catch (compressionError) {
              console.warn(`Failed to compress image for observation ${obs.id}, attempting basic fallback compression:`, compressionError);

              // Try a simple fallback compression
              try {
                if (blob.type.startsWith('image/')) {
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  const img = typeof window !== "undefined" ? new window.Image() : null;
                  if (!img) throw new Error("Could not create Image object in this environment");

                  await new Promise((resolve, reject) => {
                    img.onload = () => {
                      // Very small dimensions
                      canvas.width = 300;
                      canvas.height = 300;
                      ctx?.drawImage(img, 0, 0, 300, 300);

                      canvas.toBlob((fallbackBlob) => {
                        if (fallbackBlob) {
                          finalBlob = fallbackBlob;
                          extension = '.jpg';
                        }
                        resolve(fallbackBlob);
                      }, 'image/jpeg', 0.1);
                    };
                    img.onerror = reject;
                    img.src = URL.createObjectURL(blob);
                  });
                }
              } catch (fallbackError) {
                console.warn(`Fallback compression also failed for ${obs.id}, using original:`, fallbackError);
                // Keep using the original blob and extension
              }
            }

            // Create a filename based on observation data
            const date = obs.taken_at || obs.created_at;
            const dateStr = new Date(date).toISOString().split('T')[0];
            const site = obs.sites?.name ? `_${obs.sites.name.replace(/[^a-zA-Z0-9]/g, '_')}` : obs.site_id ? `_site_${obs.site_id.slice(0, 8)}` : '';

            const filename = `${dateStr}${site}_${obs.id.slice(0, 8)}${extension}`;

            // Add image to ZIP (compressed or original)
            zip.file(filename, finalBlob);
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

    } catch (error) {
      console.error("Error downloading photos:", error);
      alert("Failed to download photos. Please try again.");
    }
  }, [selectedObservations, observations, compressImageForDownload]);

  // ===== NOTE EDITING =====
  // Note: Note editing is now handled in the PhotoModal component

  // ===== UTILITY FUNCTIONS =====
  const getFilteredObservations = useCallback(() => {
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

    return filteredObservations;
  }, [observations, showDateSelector, startDate, endDate, selectedUserId, selectedSiteId, showSearchSelector, searchQuery, showLabelSelector, selectedLabels]);

  // ===== PHOTO MODAL FUNCTIONALITY =====
  const handleOpenPhotoModal = useCallback((observation: ObservationWithUrl, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card selection

    // Find the index of the clicked observation in the filtered list
    const filteredObservations = getFilteredObservations();
    const photoObservations = filteredObservations.filter(obs => obs.signedUrl);
    const index = photoObservations.findIndex(obs => obs.id === observation.id);

    setCurrentPhotoIndex(index);
    setSelectedPhotoObservation(observation);
    setPhotoModalOpen(true);
  }, [getFilteredObservations]);

  const handleClosePhotoModal = useCallback(() => {
    setPhotoModalOpen(false);
    setSelectedPhotoObservation(null);
    setCurrentPhotoIndex(0);
  }, []);

  const handlePreviousPhoto = useCallback(() => {
    const filteredObservations = getFilteredObservations();
    const photoObservations = filteredObservations.filter(obs => obs.signedUrl);
    if (currentPhotoIndex > 0) {
      const newIndex = currentPhotoIndex - 1;
      setCurrentPhotoIndex(newIndex);
      setSelectedPhotoObservation(photoObservations[newIndex]);
    }
  }, [getFilteredObservations, currentPhotoIndex]);

  const handleNextPhoto = useCallback(() => {
    const filteredObservations = getFilteredObservations();
    const photoObservations = filteredObservations.filter(obs => obs.signedUrl);
    if (currentPhotoIndex < photoObservations.length - 1) {
      const newIndex = currentPhotoIndex + 1;
      setCurrentPhotoIndex(newIndex);
      setSelectedPhotoObservation(photoObservations[newIndex]);
    }
  }, [getFilteredObservations, currentPhotoIndex]);

  // ===== SAVE REPORT FUNCTIONALITY =====
  const handleSaveReport = useCallback(async () => {
    if (!reportTitle.trim()) {
      alert('Please enter a title for the report');
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        alert('You must be logged in to save reports');
        return;
      }

      // Create the report
      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .insert({
          user_id: currentUser.id,
          title: reportTitle,
          description: reportDescription || null,
          ersteller: reportErsteller || null,
          baustelle: reportBaustelle || null,
          report_date: reportDate || null,
          settings: {
            language,
            selectedIds: Array.from(selectedObservations)
          }
        })
        .select()
        .single();

      if (reportError) {
        console.error('Error creating report:', reportError);
        alert('Error saving report. Please try again.');
        return;
      }

      // Create report_observations entries
      const reportObservations = Array.from(selectedObservations).map(obsId => ({
        report_id: reportData.id,
        observation_id: obsId
      }));

      const { error: observationsError } = await supabase
        .from('report_observations')
        .insert(reportObservations);

      if (observationsError) {
        console.error('Error linking observations to report:', observationsError);
        alert('Error saving report observations. Please try again.');
        return;
      }

      alert('Report saved successfully!');
      setShowSaveDialog(false);
      setReportTitle('');
      setReportDescription('');
      setReportErsteller('');
      setReportBaustelle('');
      setReportDate('');
      setSelectedObservations(new Set()); // Clear selections

      // Redirect to reports page
      router.push('/reports');
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Error saving report. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [reportTitle, reportDescription, reportErsteller, reportBaustelle, reportDate, selectedObservations, language, supabase, router]);

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
        // First check ownership
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          alert("You must be logged in to delete observations.");
          return;
        }

        // Get the observation to check ownership
        const observationToDelete = observations.find(obs => obs.id === observationId);
        if (observationToDelete && 'user_id' in observationToDelete && observationToDelete.user_id !== user.id) {
          alert("You can only delete your own observations. This observation was created by another user.");
          return;
        }

        const { error, count } = await supabase
          .from("observations")
          .delete({ count: 'exact' })
          .eq("id", observationId);

        if (error) {
          console.error("Error deleting observation:", error);
          alert("Error deleting observation. Please try again.");
          return;
        }

        if (count === 0) {
          alert("You can only delete your own observations. This observation belongs to another user.");
          return;
        }

        // Remove from store
        const updatedObservations = observations.filter((obs) => obs.id !== observationId);
        setObservations(updatedObservations);

        // Remove from selected observations if it was selected
        setSelectedObservations((prev) => {
          const newSelected = new Set(prev);
          newSelected.delete(observationId);
          return newSelected;
        });
      } catch (error) {
        console.error("Error deleting observation:", error);
        alert("Error deleting observation. Please try again.");
      }
    },
    [supabase, observations, setObservations],
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


  // ===== LOAD MORE FUNCTIONALITY =====
  const handleLoadMore = useCallback(async (type: 'week' | 'month') => {
    if (!user) return;
    await loadMoreObservations(user.id, type);
  }, [user, loadMoreObservations]);

  // ===== REFRESH SIGNED URLS =====
  const refreshSignedUrls = useCallback(async () => {
    if (!observations.length) return;

    try {
      const updatedObservations = await Promise.all(
        observations.map(async (obs) => {
          if (obs.photo_url && obs.photo_url.trim()) {
            try {
              const freshSignedUrl = await getSignedPhotoUrl(obs.photo_url, 3600);
              // Only update if we got a valid signed URL, otherwise keep the existing one
              return { ...obs, signedUrl: freshSignedUrl || obs.signedUrl };
            } catch (err) {
              console.warn(`Failed to refresh signed URL for observation ${obs.id}:`, err);
              // Keep the existing signed URL if refresh fails
              return obs;
            }
          }
          return obs;
        })
      );

      // Only update if we have meaningful changes to prevent unnecessary re-renders
      const hasChanges = updatedObservations.some((obs, index) =>
        obs.signedUrl !== observations[index].signedUrl
      );

      if (hasChanges) {
        setObservations(updatedObservations);
      }
    } catch (error) {
      console.error('Error refreshing signed URLs:', error);
    }
  }, [observations, setObservations]);

  // Refresh signed URLs when observations change
  useEffect(() => {
    if (observations.length > 0) {
      // Only refresh if we have observations with photos but no signed URLs
      const needsRefresh = observations.some(obs =>
        obs.photo_url && obs.photo_url.trim() && !obs.signedUrl
      );

      if (needsRefresh) {
        refreshSignedUrls();
      }
    }
  }, [observations, refreshSignedUrls]);


  // ===== DATA FETCHING =====
  // Main effect that runs when the component mounts to fetch user data and observations
  useEffect(() => {
    const fetchData = async () => {
      try {

        // Step 1: Authenticate the current user
        const { data: authData, error: userError } =
          await supabase.auth.getUser();
        if (userError || !authData.user) {
          setUser(null);
          return;
        }
        setUser(authData.user);

        // Step 1.5: Check if user should see onboarding
        try {
          // Check profiles table for onboarding status first
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', authData.user.id)
            .single();


          // Redirect to onboarding if:
          // 1. Profile doesn't exist, OR
          // 2. Profile exists but onboarding_completed is false
          if (!profile || (profile && !profile.onboarding_completed)) {
            router.push("/onboarding");
            return;
          } else {
          }
        } catch (error) {
          console.warn('Error checking onboarding status, continuing to main app:', error);
        }

        // Step 2: Fetch observations using Zustand store
        await fetchInitialObservations(authData.user.id);
      } catch (e) {
        console.error("Error in fetchData:", e);
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
          clearStore();
          setSelectedObservations(new Set());
        } else if (event === "SIGNED_IN" && session?.user) {
          // Refetch data when user signs in
          fetchData();
        }
      },
    );

    return () => subscription.unsubscribe();
  }, [supabase, t, router, fetchInitialObservations, clearStore]);

  // Extract users and sites when observations change
  useEffect(() => {
    if (observations.length === 0) return;

    // Extract unique users from all observations
    const allUsers = new Map<string, string>();
    observations.forEach(obs => {
      if (obs.user_id) {
        const displayName = obs.user_email || `User ${obs.user_id.slice(0, 8)}...`;
        allUsers.set(obs.user_id, displayName);
      }
    });
    setAvailableUsers(Array.from(allUsers.entries()).map(([id, displayName]) => ({ id, displayName })).sort((a, b) => a.displayName.localeCompare(b.displayName)));

    // Extract unique sites from all observations
    const allSites = new Map<string, string>();
    observations.forEach(obs => {
      if (obs.site_id) {
        const siteName = obs.sites?.name || `Site ${obs.site_id.slice(0, 8)}...`;
        allSites.set(obs.site_id, siteName);
      }
    });
    setAvailableSites(Array.from(allSites.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name)));
  }, [observations]);

  // ===== MAIN RENDER =====
  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen flex flex-col items-center relative">
      {!user && (
        <div className="fixed inset-0 -z-10 bg-black">
          <video
            autoPlay
            muted
            loop
            playsInline
            poster="/images/background.png"
            className="bg-video-fixed"
            onError={(e) => {
              console.error('Video failed to load, using fallback image');
              // Fallback to background image
              const videoElement = e.currentTarget;
              const parent = videoElement.parentElement;
              if (parent) {
                parent.style.backgroundImage = 'url(/images/backgound.png)';
                parent.style.backgroundSize = 'cover';
                parent.style.backgroundPosition = 'center';
                parent.style.backgroundRepeat = 'no-repeat';
                videoElement.style.display = 'none';
              }
            }}
          >
            <source src="/video/background.mp4" type="video/mp4" />
          </video>
        </div>
      )}
      <div className="flex-1 w-full flex flex-col gap-0 items-center">
        {/* Top navigation bar with site title, language selector, and auth */}
        <nav className={getNavbarClasses().container}>
          <div className={getNavbarClasses().content}>
            <div className="flex items-center gap-2">
              {/* Show banner when not logged in */}
              {!user && (
                <div className="h-8 px-2 sm:px-3 bg-transparent flex items-center justify-center rounded">
                  <Image
                    src="/images/banner_logo.png"
                    alt="Site Banner"
                    width={120}
                    height={32}
                    className="h-4 sm:h-6 w-auto max-w-none"
                  />
                </div>
              )}

              {/* Left side controls: Search, Tags, Filter, Grid */}
              {user && (
                <>
                  <Button
                    onClick={() => setShowSearchSelector(!showSearchSelector)}
                    variant="outline"
                    size="sm"
                    className={`h-8 w-8 px-0 text-sm border-gray-300 flex items-center justify-center ${
                      showSearchSelector
                        ? "bg-gray-200 text-gray-700"
                        : "bg-white"
                    }`}
                    title={t("toggleSearch")}
                  >
                    <Search className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={() => setShowLabelSelector(!showLabelSelector)}
                    variant="outline"
                    size="sm"
                    className={`h-8 w-8 px-0 text-sm border-gray-300 flex items-center justify-center ${
                      showLabelSelector
                        ? "bg-gray-200 text-gray-700"
                        : "bg-white"
                    }`}
                    title={t("toggleLabelFilter")}
                  >
                    <Tag className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={() => setShowDateSelector(!showDateSelector)}
                    variant="outline"
                    size="sm"
                    className={`h-8 w-8 px-0 text-sm border-gray-300 flex items-center justify-center ${
                      showDateSelector ? "bg-gray-200 text-gray-700" : "bg-white"
                    }`}
                    title={t("toggleDateFilter")}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>

                </>
              )}
            </div>

            {/* Center banner - only show when user is logged in */}
            {user && (
              <div className="absolute left-1/2 transform -translate-x-1/2 sm:block">
                <div
                  onClick={() => window.location.reload()}
                  className="h-8 px-2 sm:px-3 bg-transparent flex items-center justify-center cursor-pointer hover:opacity-80 rounded"
                  title={t("refreshObservations")}
                >
                  <Image
                    src="/images/banner_logo.png"
                    alt="Site Banner"
                    width={120}
                    height={32}
                    className="h-5 sm:h-6 w-auto max-w-none"
                  />
                </div>
              </div>
            )}


            <div className="flex items-center gap-2">
              {/* Green square button for campaign modal */}
              <button
                onClick={() => {
                  setShowCampaignModal(true);
                  setCampaignImageLoading(true);
                }}
                className="h-6 w-6 bg-[#00FF1A] hover:bg-green-600 mr-2 transition-colors cursor-pointer flex items-center justify-center "
                title="View Campaign"
              >
                <span className="text-white text-xs"></span>
              </button>

              {/* Reports */}
              {user && (
                <Button
                  onClick={() => router.push('/reports')}
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 px-0 text-sm border-gray-300 flex items-center justify-center bg-white hover:bg-gray-100"
                  title={t("reports")}
                >
                  <FileText className="h-4 w-4" />
                </Button>
              )}

              {/* Settings */}
              {user && (
                <Button
                  onClick={() => router.push('/settings')}
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 px-0 text-sm border-gray-300 flex items-center justify-center bg-white hover:bg-gray-100"
                  title={t("settings")}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}

              {/* About - available to all users */}
              {/* <Button
                onClick={() => router.push('/about')}
                variant="outline"
                size="sm"
                className="h-8 w-8 px-0 text-sm border-gray-300 flex items-center justify-center bg-white hover:bg-gray-100"
                title={t("about")}
              >
                <Info className="h-4 w-4" />
              </Button> */}

              <AuthButtonClient />
            </div>
          </div>
        </nav>

        {/* Main content area with responsive padding */}
        <div className={getContentClasses().container}>
          <div className={getContentClasses().inner}>
            {/* Conditional rendering based on app state */}
            {!user ? (
              // Show welcome message when user is not logged in
              <div className="text-center py-8 sm:py-10">
                <h1 className="text-4xl sm:text-7xl md:text-8xl lg:text-6xl font-bold text-white mb-8">
                  {t("welcomeTitle")}
                </h1>

                {/* User Manual Carousel */}
                <div className="mt-8">
                  <div className="flex justify-center">
                    <Suspense fallback={<div className="w-[600px] h-[300px] sm:h-[400px] bg-gray-200 animate-pulse rounded-lg"></div>}>
                      <UserManualCarousel width={600} mobileHeight={300} desktopHeight={400} />
                    </Suspense>
                  </div>

                  {/* App Store Badge */}
                  <div className="h-14 mt-2 flex justify-center o">
                    <a
                      href="https://apps.apple.com/us/app/simple-site/id6749160249"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative transition-opacity hover:opacity-80"
                    >
                      <Image
                        src="/app_screens/available-app-store_1.png"
                        alt="Available on the App Store"
                        width={100}
                        height={30}
                        className="h-10 w-auto object-contain max-w-[300px] rounded-lg"
    
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
                  <div className="sticky top-16 z-10 flex flex-col sm:items-start sm:justify-between gap-3 sm:gap-4 p-2 sm:p-4 bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200">
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
                        <Button
                          onClick={() => handleLoadMore('week')}
                          disabled={isLoadingMore}
                          size="sm"
                          variant="outline"
                          className="flex-1 sm:w-auto text-xs px-2"
                        >
                          {isLoadingMore ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-1"></div>
                              Loading...
                            </>
                          ) : (
                            t('lastWeek')
                          )}
                        </Button>
                        <Button
                          onClick={() => handleLoadMore('month')}
                          disabled={isLoadingMore}
                          size="sm"
                          variant="outline"
                          className="flex-1 sm:w-auto text-xs px-2"
                        >
                          {isLoadingMore ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-1"></div>
                              Loading...
                            </>
                          ) : (
                            t('lastMonth')
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 italic">
                      {t("filteringNote")}
                    </div>
                  </div>
                )}

                {/* Search Input - Conditionally rendered */}
                {showSearchSelector && (
                  <div
                    className="sticky z-10 flex flex-col gap-2 w-full p-4 bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200"
                    style={{ top: showDateSelector ? '140px' : '64px' }}
                  >
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
                  <div
                    className="sticky z-10 flex flex-col gap-3 w-full max-h-80 overflow-y-auto pr-1 p-4 bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200"
                    style={{
                      top: showDateSelector && showSearchSelector ? '240px' :
                           showDateSelector ? '140px' :
                           showSearchSelector ? '164px' : '64px'
                    }}
                  >
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

                  return sortedDates.map((dateKey) => {
                    const observationsForDate = groupedObservations[dateKey];
                    const formattedDate = new Date(dateKey)
                      .toLocaleDateString(
                        language === "de" ? "de-DE" : "en-US",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )
                      .toUpperCase();

                    return (
                      <div key={dateKey} className="space-y-2">
                        {/* Collapsible observations for this date (title = date) */}
                        <Accordion
                          type="single"
                          collapsible
                          defaultValue="observations"
                          className="mt-1"
                        >
                          <AccordionItem value="observations">
                            <AccordionTrigger>
                              {formattedDate} ({observationsForDate.length})
                            </AccordionTrigger>
                            <AccordionContent className="p-0 border-none">
                              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-6 gap-1 sm:gap-2 md:gap-3">
                        {observationsForDate.map((observation, index) => {
                          const hasPhoto = Boolean(observation.signedUrl);
                          const labels = observation.labels ?? [];

                          // Grid view - show only thumbnails
                          return hasPhoto ? (
                            <div key={observation.id} className="w-full">
                              <div
                                className={`relative aspect-square w-full overflow-hidden cursor-pointer group ${
                                  selectedObservations.has(observation.id)
                                    ? "ring-2 ring-blue-500 ring-offset-1"
                                    : ""
                                }`}
                                onClick={() => {
                                  const newSelected = new Set(selectedObservations);
                                  if (newSelected.has(observation.id)) {
                                    newSelected.delete(observation.id);
                                  } else {
                                    newSelected.add(observation.id);
                                  }
                                  setSelectedObservations(newSelected);
                                }}
                            >
                              {/* Enhanced skeleton loading background */}
                              <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-400 border-t-transparent"></div>
                              </div>
                              <Image
                                src={observation.signedUrl as string}
                                alt={`Photo for ${observation.sites?.name || (observation.site_id ? `site ${observation.site_id.slice(0, 8)}` : "observation")}`}
                                fill
                                className="object-cover hover:scale-105 transition-transform duration-200"
                                sizes="(max-width: 480px) 50vw, (max-width: 640px) 25vw, (max-width: 768px) 20vw, (max-width: 1024px) 17vw, 16vw"
                                priority={index < 6} // Prioritize first 6 images per day in tile view
                                onLoad={(e) => {
                                  // Hide skeleton when image loads
                                  const skeleton = e.currentTarget.previousElementSibling as HTMLElement;
                                  if (skeleton) skeleton.style.display = 'none';
                                }}
                              />

                              {/* Timestamp overlay - top of thumbnail */}
                              <div className="absolute top-0 left-0 right-0 bg-black/60 text-white p-1.5 text-xs">
                                <p className="text-center leading-tight">
                                  {new Date(observation.taken_at || observation.created_at).toLocaleDateString('en-GB')} {new Date(observation.taken_at || observation.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                              </div>

                              {/* Zoom button - appears on hover */}
                              <button
                                onClick={(e) => handleOpenPhotoModal(observation, e)}
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 flex items-center justify-center"
                                title="View photo"
                              >
                                <ZoomIn className="h-6 w-6 text-white drop-shadow-lg" />
                              </button>

                              {/* Delete button - appears on hover */}
                              <button
                                onClick={(e) =>
                                  handleDeleteObservation(observation.id, e)
                                }
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white p-1 rounded-full shadow-lg"
                                title="Delete observation"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>

                              {/* Note overlay - bottom of thumbnail */}
                              {observation.note && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-xs">
                                  <p className="line-clamp-2 leading-tight">
                                    {observation.note}
                                  </p>
                                </div>
                              )}

                              {/* Checkbox - bottom-right corner, visible on hover */}
                              <div
                                className={`absolute bottom-1 right-2 z-20 transition-opacity w-5 h-5 flex items-center justify-center ${
                                  selectedObservations.has(observation.id)
                                    ? "opacity-100"
                                    : "opacity-0 group-hover:opacity-100"
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent card selection
                                  const newSelected = new Set(selectedObservations);
                                  if (newSelected.has(observation.id)) {
                                    newSelected.delete(observation.id);
                                  } else {
                                    newSelected.add(observation.id);
                                  }
                                  setSelectedObservations(newSelected);
                                }}
                              >
                                <Checkbox
                                  checked={selectedObservations.has(observation.id)}
                                  onCheckedChange={(checked) => {
                                    const newSelected = new Set(selectedObservations);
                                    if (checked) {
                                      newSelected.add(observation.id);
                                    } else {
                                      newSelected.delete(observation.id);
                                    }
                                    setSelectedObservations(newSelected);
                                }}
                                  className="bg-white border-2 border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 shadow-md w-5 h-5"
                                />
                              </div>
                              </div>

                              {/* Tags under thumbnail */}
                              {labels && labels.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {labels.slice(0, 3).map((label, idx) => {
                                    const processedLabel = processLabel(label);
                                    return (
                                      <Badge
                                        key={`${observation.id}-grid-label-${idx}`}
                                        variant="outline"
                                        className="text-xs px-1.5 py-0.5 border border-gray-300 bg-gray-50 text-gray-600 truncate max-w-20"
                                      >
                                        {processedLabel}
                                      </Badge>
                                    );
                                  })}
                                  {labels.length > 3 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs px-1.5 py-0.5 border border-gray-300 bg-gray-50 text-gray-500"
                                    >
                                      +{labels.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : null;
                        })}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    );
                  });
                })()}

                {/* Load More Buttons */}
                {hasMore && (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <div className="text-sm text-gray-600 mb-2">{t('loadMoreLabel')}</div>
                    <div className="flex flex-wrap justify-center gap-3">
                      <Button
                        onClick={() => handleLoadMore('week')}
                        disabled={isLoadingMore}
                        variant="outline"
                        size="sm"
                        className="shadow-md hover:shadow-lg transition-all"
                      >
                        {isLoadingMore ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2"></div>
                            Loading...
                          </>
                        ) : (
                          t('lastWeek')
                        )}
                      </Button>
                      <Button
                        onClick={() => handleLoadMore('month')}
                        disabled={isLoadingMore}
                        variant="outline"
                        size="sm"
                        className="shadow-md hover:shadow-lg transition-all"
                      >
                        {isLoadingMore ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2"></div>
                            Loading...
                          </>
                        ) : (
                          t('lastMonth')
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Show spinner if we have a user but no observations yet (initial load)
              // Otherwise show no observations message
              user && observations.length === 0 && !error && isLoading ? (
                <div className="text-center py-12">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="space-y-6">
                    <p className="text-muted-foreground text-lg">
                      {t('noObservationsPastTwoDays')}
                    </p>

                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">{t('loadObservationsLongerPeriod')}</p>
                      <div className="flex flex-wrap justify-center gap-3">
                        <Button
                          onClick={() => handleLoadMore('week')}
                          disabled={isLoadingMore}
                          variant="outline"
                          size="sm"
                          className="shadow-md hover:shadow-lg transition-all"
                        >
                          {isLoadingMore ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2"></div>
                              Loading...
                            </>
                          ) : (
                            t('loadPastWeek')
                          )}
                        </Button>
                        <Button
                          onClick={() => handleLoadMore('month')}
                          disabled={isLoadingMore}
                          variant="outline"
                          size="sm"
                          className="shadow-md hover:shadow-lg transition-all"
                        >
                          {isLoadingMore ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2"></div>
                              Loading...
                            </>
                          ) : (
                            t('loadPastMonth')
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}

            {!isLoading && (
              <Footer user={user} textColor="text-white" />
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
            className="hidden md:flex shadow-lg hover:shadow-xl transition-all"
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

      {/* Photo Modal */}
      {selectedPhotoObservation && selectedPhotoObservation.signedUrl && (() => {
        const filteredObservations = getFilteredObservations();
        const photoObservations = filteredObservations.filter(obs => obs.signedUrl);
        const hasPrevious = currentPhotoIndex > 0;
        const hasNext = currentPhotoIndex < photoObservations.length - 1;

        // Get site labels for the current observation
        const currentSiteLabels = selectedPhotoObservation.site_id
          ? (siteLabels.get(selectedPhotoObservation.site_id) || [])
          : [];

        // Fetch labels if not already loaded
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
            hasPrevious={hasPrevious}
            hasNext={hasNext}
            siteLabels={currentSiteLabels}
            onObservationUpdate={(updatedObservation) => {
              // Update the observation in the store
              const updatedObservations = observations.map((obs) =>
                obs.id === updatedObservation.id ? updatedObservation : obs
              );
              setObservations(updatedObservations);

              // Update available labels if labels were changed
              if (updatedObservation.labels) {
                const currentLabels = new Set(storeAvailableLabels);
                updatedObservation.labels.forEach(label => {
                  if (label && label.trim()) {
                    currentLabels.add(label.trim());
                  }
                });
                setAvailableLabels(Array.from(currentLabels).sort());
              }

              // Update the currently selected photo observation if it's the one being edited
              if (selectedPhotoObservation.id === updatedObservation.id) {
                setSelectedPhotoObservation(updatedObservation);
              }
            }}
          />
        );
      })()}

      {/* Save Report Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-none p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Save Report</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="report-title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  id="report-title"
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-gray-400"
                  placeholder="Enter report title"
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="report-baustelle" className="block text-sm font-medium text-gray-700 mb-1">
                  Baustelle
                </label>
                <input
                  id="report-baustelle"
                  type="text"
                  value={reportBaustelle}
                  onChange={(e) => setReportBaustelle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-gray-400"
                  placeholder="Enter construction site"
                />
              </div>
              <div>
                <label htmlFor="report-ersteller" className="block text-sm font-medium text-gray-700 mb-1">
                  Ersteller
                </label>
                <input
                  id="report-ersteller"
                  type="text"
                  value={reportErsteller}
                  onChange={(e) => setReportErsteller(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-gray-400"
                  placeholder="Enter report creator"
                />
              </div>
              <div>
                <label htmlFor="report-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Report Date
                </label>
                <input
                  id="report-date"
                  type="datetime-local"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
              <div>
                <label htmlFor="report-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="report-description"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-gray-400"
                  placeholder="Enter report description (optional)"
                  rows={3}
                />
              </div>

            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                onClick={() => {
                  setShowSaveDialog(false);
                  setReportTitle('');
                  setReportDescription('');
                  setReportErsteller('');
                  setReportBaustelle('');
                  setReportDate('');
                }}
                variant="outline"
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveReport}
                disabled={isSaving || !reportTitle.trim()}
              >
                {isSaving ? 'Saving...' : 'Save Report'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Claude Chat Component */}
      {user && (
        <ClaudeChat
          selectedObservations={selectedObservations}
          allObservations={observations.filter(obs => obs.taken_at !== null).map(obs => ({
            ...obs,
            taken_at: obs.taken_at!
          }))}
          onLoadMoreData={async (period: 'week' | 'month') => {
            await loadMoreObservations(user.id, period);
          }}
        />
      )}

      {/* Campaign Modal */}
      {showCampaignModal && (
        <div 
          className="fixed inset-0 bg-black flex items-center justify-center z-50"
          onClick={() => setShowCampaignModal(false)}
        >
          <div 
            className="bg-black w-full h-full relative flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowCampaignModal(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 text-3xl z-10"
            >
              ×
            </button>
            <div className="flex justify-center items-center w-full h-full p-4 relative">
              {/* Loading spinner */}
              {campaignImageLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
              )}
              
              <Image
                src="/campaign/CloneitToTheMoon.png"
                alt="Cloneit To The Moon Campaign"
                width={1200}
                height={800}
                className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${
                  campaignImageLoading ? 'opacity-0' : 'opacity-100'
                }`}
                onLoad={() => setCampaignImageLoading(false)}
                onError={() => setCampaignImageLoading(false)}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
