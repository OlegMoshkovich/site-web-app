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
  ZoomIn,
  FileText,
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
// Translation system
import { translations, type Language, useLanguage } from "@/lib/translations";
// Zustand store for observations
import { useObservationsStore } from "@/lib/store/observations-store";
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
    fetchInitialObservations,
    loadMoreObservations,
    setObservations,
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
  // Save report modal state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
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
                console.log(`Compressed image from ${(blob.size / 1024).toFixed(1)}KB to ${(compressedBlob.size / 1024).toFixed(1)}KB`);
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
                          console.log(`Fallback compression: ${(blob.size / 1024).toFixed(1)}KB to ${(fallbackBlob.size / 1024).toFixed(1)}KB`);
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

      console.log(`Successfully downloaded ${downloadCount} photos in ZIP file`);
    } catch (error) {
      console.error("Error downloading photos:", error);
      alert("Failed to download photos. Please try again.");
    }
  }, [selectedObservations, observations, compressImageForDownload]);

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

        // Update observations in store
        const updatedObservations = observations.map((obs) =>
          obs.id === observationId ? { ...obs, note: editNoteValue } : obs,
        );
        setObservations(updatedObservations);

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
      setSelectedObservations(new Set()); // Clear selections
      
      // Redirect to reports page
      router.push('/reports');
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Error saving report. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [reportTitle, reportDescription, selectedObservations, language, supabase, router]);

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

        // Remove from store
        const updatedObservations = observations.filter((obs) => obs.id !== observationId);
        setObservations(updatedObservations);

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
  const handleLoadMore = useCallback(async () => {
    if (!user) return;
    await loadMoreObservations(user.id);
  }, [user, loadMoreObservations]);

  // ===== DATA FETCHING =====
  // Main effect that runs when the component mounts to fetch user data and observations
  useEffect(() => {
    console.log('Main useEffect triggered');
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

        // Step 2: Fetch observations using Zustand store
        console.log('About to call fetchInitialObservations for user:', authData.user.id);
        await fetchInitialObservations(authData.user.id);
        console.log('fetchInitialObservations completed');
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
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-0 items-center">
        {/* Top navigation bar with site title, language selector, and auth */}
        <nav className="sticky top-0 z-20 w-full flex justify-center h-16 bg-white/95 backdrop-blur-sm border-b border-gray-200">
          <div className="w-full max-w-5xl flex justify-between items-center px-3 sm:px-5 text-sm">
            <div className="flex items-center gap-2">
              {/* Show "Simple site" title when not logged in */}
              {!user && (
                <div className="text-lg font-semibold">
                  {t("siteTitle")}
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

                  {/* View Mode Toggle */}
                  <button
                    onClick={() =>
                      setViewMode(viewMode === "list" ? "card" : "list")
                    }
                    className="h-8 w-8 px-0 border border-gray-300 transition-colors text-gray-500 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center"
                    title={
                      viewMode === "list"
                        ? t("switchToCardView")
                        : t("switchToListView")
                    }
                  >
                    {viewMode === "list" ? (
                      <Grid3X3 className="h-4 w-4" />
                    ) : (
                      <List className="h-4 w-4" />
                    )}
                  </button>
                </>
              )}
            </div>
            
            {/* Center icon - only show when user is logged in */}
            {user && (
              <div className="absolute left-1/2 transform -translate-x-1/2">
                <div 
                  onClick={() => router.push('/')}
                  className="h-8 w-8 border border-gray-300 bg-white flex items-center justify-center cursor-pointer hover:bg-gray-50" 
                  title={t("home")}
                >
                  <Image
                    src="/images/icon.png"
                    alt="Site Icon"
                    width={24}
                    height={24}
                    className="h-6 w-6"
                  />
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2">              
              {/* Language selector */}
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="h-8 w-8 px-0 text-sm border border-gray-300 bg-white focus:outline-none focus:border-gray-400 cursor-pointer appearance-none text-center"
                style={{ textAlignLast: "center" }}
                title={t("changeLanguage")}
              >
                <option value="en">EN</option>
                <option value="de">DE</option>
              </select>

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

                                  {/* Zoom button for list view */}
                                  {hasPhoto && (
                                    <button
                                      onClick={(e) => handleOpenPhotoModal(observation, e)}
                                      className="absolute bottom-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg"
                                      title="View photo"
                                    >
                                      <ZoomIn className="h-4 w-4" />
                                    </button>
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
                                  {/* Zoom button positioned over photo */}
                                  <button
                                    onClick={(e) => handleOpenPhotoModal(observation, e)}
                                    className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg"
                                    title="View photo"
                                  >
                                    <ZoomIn className="h-5 w-5" />
                                  </button>
                                  
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

                {/* Load More Button */}
                {hasMore && (
                  <div className="flex justify-center py-8">
                    <Button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      variant="outline"
                      size="lg"
                      className="shadow-md hover:shadow-lg transition-all"
                    >
                      {isLoadingMore ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                          {t("loading")}
                        </>
                      ) : (
                        t("loadMore")
                      )}
                    </Button>
                  </div>
                )}
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

      {/* Photo Modal */}
      {selectedPhotoObservation && selectedPhotoObservation.signedUrl && (() => {
        const filteredObservations = getFilteredObservations();
        const photoObservations = filteredObservations.filter(obs => obs.signedUrl);
        const hasPrevious = currentPhotoIndex > 0;
        const hasNext = currentPhotoIndex < photoObservations.length - 1;
        
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
    </main>
  );
}
