"use client";

// Force dynamic rendering to ensure fresh data on each request
export const dynamic = 'force-dynamic';

// React hooks for state management and side effects
import { useEffect, useState, useCallback } from "react";
// Supabase client for database operations
import { createClient } from "@/lib/supabase/client";
// Utility function for formatting dates
import { formatDate } from "@/lib/utils";
// UI components from shadcn/ui
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// Lucide React icons
import { Calendar, MapPin, Image as ImageIcon } from "lucide-react";
// Authentication component
import { AuthButtonClient } from "@/components/auth-button-client";
// Next.js router for navigation
import { useRouter } from "next/navigation";
// Next.js Image component for optimized images
import Image from "next/image";
// Translation system
import { translations, type Language } from "@/lib/translations";

// Core observation data structure from Supabase database
interface Observation {
  id: string;                    // Unique identifier for the observation
  plan: string | null;           // Plan name/identifier this observation belongs to
  labels: string[] | null;       // Array of tags/labels for categorization
  user_id: string;               // ID of the user who created this observation
  note: string | null;           // Text description/notes about the observation
  gps_lat: number | null;        // GPS latitude coordinate
  gps_lng: number | null;        // GPS longitude coordinate
  photo_url: string | null;      // Storage path to the photo file
  plan_url: string | null;       // URL to view the associated plan
  plan_anchor: Record<string, unknown> | null; // Position coordinates on the plan
  photo_date: string | null;     // When the photo was taken
  created_at: string;            // When the observation was created in the system
}

// Extended observation with signed URL for secure photo access
interface ObservationWithUrl extends Observation {
  signedUrl: string | null;      // Temporary signed URL for viewing the photo
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
  const [selectedObservations, setSelectedObservations] = useState<Set<string>>(new Set());
  // Date range selection for filtering observations
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  // Current language for internationalization
  const [language, setLanguage] = useState<Language>('en');
  // Toggle state for showing/hiding the date selector
  const [showDateSelector, setShowDateSelector] = useState<boolean>(false);

  // ===== UTILITY FUNCTIONS =====
  // Helper function to get translated text based on current language
  const t = useCallback((key: keyof typeof translations.en) => {
    const value = translations[language][key];
    return typeof value === 'string' ? value : '';
  }, [language]);

  // Clean up file paths by removing leading slashes and empty strings
  const normalizePath = (v?: string | null) =>
    (v ?? "").trim().replace(/^\/+/, "") || null;

  // ===== PHOTO MANAGEMENT =====
  // Generate a temporary signed URL for viewing a photo from Supabase storage
  // This is necessary because photos are stored privately and need authentication
  const getSignedPhotoUrl = useCallback(
    async (filenameOrPath: string, expiresIn = 3600): Promise<string | null> => {
      // Clean up the file path
      const key = normalizePath(filenameOrPath);
      if (!key) return null;
      
      // Request a signed URL from Supabase storage
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(key, expiresIn);
      
      if (error) {
        console.error("createSignedUrl error", { key, error });
        return null;
      }
      
      return data.signedUrl;
    },
    [supabase]
  );

  // ===== ACTION HANDLERS =====
  // Navigate to the report generation page with selected observations
  const handleGenerateReport = useCallback(() => {
    if (selectedObservations.size === 0) return;
    
    // Convert selected observation IDs to a comma-separated string
    const selectedIds = Array.from(selectedObservations);
    const queryString = selectedIds.join(',');
    
    // Navigate to the report page with selected observation IDs as URL parameters
    router.push(`/report?ids=${queryString}`);
  }, [selectedObservations, router]);

  // ===== DATE RANGE SELECTION =====
  // Filter and select observations within a specific date range
  const handleSelectByDateRangeWithDates = useCallback((start: string, end: string) => {
    if (!start || !end) return;
    
    // Normalize dates to start and end of day to ensure we capture all observations
    // This prevents missing observations that might fall on boundary dates
    const startDate = new Date(start + 'T00:00:00');    // Start of the start date
    const endDate = new Date(end + 'T23:59:59.999');    // End of the end date
    
    console.log('Date range selection:', { start, end, startDate, endDate });
    
    // Filter observations to find those within the selected date range
    const observationsInRange = observations.filter(observation => {
      // Use photo_date if available, otherwise fall back to created_at
      const observationDate = new Date(observation.photo_date || observation.created_at);
      const isInRange = observationDate >= startDate && observationDate <= endDate;
      
      // Debug logging for boundary cases to help troubleshoot date selection issues
      if (observationDate.toDateString() === startDate.toDateString() || 
          observationDate.toDateString() === endDate.toDateString()) {
        console.log('Boundary observation:', {
          id: observation.id,
          date: observationDate,
          isInRange,
          photo_date: observation.photo_date,
          created_at: observation.created_at
        });
      }
      
      return isInRange;
    });
    
    console.log(`Found ${observationsInRange.length} observations in date range ${start} to ${end}`);
    
    // Select all observations that fall within the date range
    const observationIds = observationsInRange.map(obs => obs.id);
    setSelectedObservations(new Set(observationIds));
  }, [observations]);

  const handleSelectByDateRange = useCallback(() => {
    if (!startDate || !endDate) return;
    
    // Use the improved date range function
    handleSelectByDateRangeWithDates(startDate, endDate);
  }, [startDate, endDate, handleSelectByDateRangeWithDates]);

  const handleClearDateRange = useCallback(() => {
    setStartDate('');
    setEndDate('');
    setSelectedObservations(new Set());
  }, []);

  const handleSelectAll = useCallback(() => {
    const allIds = observations.map(obs => obs.id);
    
    // If all observations are already selected, unselect all
    if (selectedObservations.size === allIds.length) {
      setSelectedObservations(new Set());
    } else {
      // Otherwise, select all observations
      setSelectedObservations(new Set(allIds));
    }
  }, [observations, selectedObservations]);

  // ===== UTILITY FUNCTIONS =====
  // Calculate the minimum and maximum dates available in the observations
  // This is used to set the min/max values for date input fields
  const getAvailableDateRange = useCallback(() => {
    if (observations.length === 0) return { min: '', max: '' };
    
    // Extract all dates from observations (photo_date or created_at)
    const dates = observations.map(obs => new Date(obs.photo_date || obs.created_at));
    // Find the earliest and latest dates
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Return dates in YYYY-MM-DD format for HTML date inputs
    return {
      min: minDate.toISOString().split('T')[0],  // Earliest available date
      max: maxDate.toISOString().split('T')[0]   // Latest available date
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
        const { data: authData, error: userError } = await supabase.auth.getUser();
        if (userError || !authData.user) {
          setUser(null);
          setIsLoading(false);
          return;
        }
        setUser(authData.user);

        // Step 2: Fetch observations for the current user (newest first)
        const { data: obsData, error: obsError } = await supabase
          .from("observations")
          .select("*")
          .eq("user_id", authData.user.id)
          .order("created_at", { ascending: false });

        if (obsError) {
          console.error("Error fetching observations:", obsError);
          setError(`${t('errorLoading')} ${obsError.message}`);
          setIsLoading(false);
          return;
        }

        const base = (obsData ?? []) as Observation[];

        // Step 3: Generate signed URLs for each photo in parallel
        // This is necessary because photos are stored privately in Supabase
        const withUrls: ObservationWithUrl[] = await Promise.all(
          base.map(async (o) => {
            const signedUrl = o.photo_url
              ? await getSignedPhotoUrl(o.photo_url, 3600) // 1 hour expiration
              : null;
            return { ...o, signedUrl };
          })
        );

        setObservations(withUrls);
        setIsLoading(false);
      } catch (e) {
        console.error("Error in fetchData:", e);
        setError(t('unexpectedError'));
        setIsLoading(false);
      }
    };

    fetchData();
  }, [supabase, getSignedPhotoUrl, t]);

  // ===== MAIN RENDER =====
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-4 items-center">
        {/* Top navigation bar with site title, language selector, and auth */}
        <nav className="sticky top-0 z-20 w-full flex justify-center h-16 bg-white/95 backdrop-blur-sm border-b border-gray-200">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-3 sm:px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              {t('siteTitle')}
            </div>
              <div className="flex items-center gap-3">
                {/* Toggle button for date selector */}
                <div className="flex items-center gap-2">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    className="text-sm border-0 bg-transparent focus:outline-none focus:ring-0 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <option value="en">EN</option>
                    <option value="de">DE</option>
                  </select>
                </div>
                {user && (
                  <Button
                    onClick={() => setShowDateSelector(!showDateSelector)}
                    variant="outline"
                    size="sm"
                    className="text-xs px-2 py-1 h-8 border-gray-300"
                  >
                    {showDateSelector ? 'Hide Filter' : 'Show Filter'}
                  </Button>
                )}
                
                <AuthButtonClient />
              </div>
          </div>
        </nav>

                  {/* Main content area with responsive padding */}
        <div className="flex-1 flex flex-col gap-0 max-w-5xl p-1 sm:p-3 md:p-4 bg-gray-50/30" >
          <div className="w-full">   
            {/* Conditional rendering based on app state */}
            {!user ? (
              // Show welcome message when user is not logged in
              <div className="text-center py-12">
                <h1 className="text-lg ">{t('welcomeTitle')}</h1>
                <p className="text-muted-foreground text-sm">{t('pleaseSignIn')}</p>
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
                    <div className="sticky top-16 z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-0 sm:p-4 bg-white/95 backdrop-blur-sm shadow-sm">
                    <div className="flex flex-row items-start gap-3 sm:gap-4">
                      <div className="flex flex-row items-center gap-2">
                        <label htmlFor="startDate" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                          {t('start')}
                        </label>
                        <input
                          type="date"
                          id="startDate"
                          value={startDate}
                          onChange={(e) => {
                            const newStartDate = e.target.value;
                            setStartDate(newStartDate);
                            
                            // Auto-trigger selection when both dates are set
                            if (newStartDate && endDate) {
                              handleSelectByDateRangeWithDates(newStartDate, endDate);
                            }
                          }}
                          min={getAvailableDateRange().min}
                          max={endDate || getAvailableDateRange().max}
                          className="px-3 py-1 text-sm border focus:outline-none focus:ring-primary w-24 sm:w-auto"
                        />
                      </div>
                      <div className="flex flex-row items-center gap-2">
                        <label htmlFor="endDate" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                          {t('end')}
                        </label>
                        <input
                          type="date"
                          id="endDate"
                          value={endDate}
                          onChange={(e) => {
                            const newEndDate = e.target.value;
                            setEndDate(newEndDate);
                            
                            // Auto-trigger selection when both dates are set
                            if (startDate && newEndDate) {
                              handleSelectByDateRangeWithDates(startDate, newEndDate);
                            }
                          }}
                          min={startDate || getAvailableDateRange().min}
                          max={getAvailableDateRange().max}
                          className="px-3 py-1 text-sm border focus:outline-none focus:ring-primary w-24 sm:w-auto"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                        <Button
                          onClick={startDate && endDate ? handleClearDateRange : handleSelectByDateRange}
                          disabled={!startDate || !endDate}
                          size="sm"
                          variant="outline"
                          className="w-full sm:w-auto"
                        >
                          {startDate && endDate ? t('clear') : t('selectRange')}
                        </Button>
                        <Button
                          onClick={handleSelectAll}
                          size="sm"
                          variant="outline"
                          className="w-full sm:w-auto"
                        >
                          {selectedObservations.size === observations.length ? t('unselectAll') : t('selectAll')}
                        </Button>
                      </div>
                    </div>
                    <div className="text-muted-foreground text-sm text-center sm:text-right">
                      {selectedObservations.size > 0 
                        ? `${selectedObservations.size} ${t('observationsSelected')}`
                        : t('clickToSelect')
                      }
                    </div>
                    </div>
                  )}
                  

                  {(() => {
                    // Group observations by date
                    const groupedObservations = observations.reduce((groups, observation) => {
                      const date = observation.photo_date || observation.created_at;
                      const dateKey = new Date(date).toDateString();
                      
                      if (!groups[dateKey]) {
                        groups[dateKey] = [];
                      }
                      groups[dateKey].push(observation);
                      return groups;
                    }, {} as Record<string, typeof observations>);

                    // Sort dates in descending order (newest first)
                    const sortedDates = Object.keys(groupedObservations).sort((a, b) => 
                      new Date(b).getTime() - new Date(a).getTime()
                    );
                   

                    return sortedDates.map((dateKey) => (
                      <div key={dateKey} className="space-y-4">
                        {/* Date Header */}
                        <div className="border-b border-gray-200 pb-1">
                                                           <div className="text-sm ">
                                   {new Date(dateKey).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
                                     weekday: 'long',
                                     year: 'numeric',
                                     month: 'long',
                                     day: 'numeric'
                                   }).toUpperCase()}
                                 </div>
        </div>

                        {/* Observations for this date */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                          {groupedObservations[dateKey].map((observation) => {
                            const hasPhoto = Boolean(observation.signedUrl);
                            const labels = observation.labels ?? [];

                            return (
                              <Card 
                                key={observation.id} 
                                className={`overflow-hidden hover:shadow-lg transition-all cursor-pointer group ${
                                  selectedObservations.has(observation.id)
                                    ? 'ring-2 ring-primary shadow-lg scale-102 bg-primary/5' 
                                    : 'hover:bg-muted/50'
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
                                {hasPhoto ? (
                                  <div className="relative h-48 sm:h-56 md:h-64 w-full">
                                    <Image
                                      src={observation.signedUrl as string}
                                      alt={`Photo for ${observation.plan ?? "observation"}`}
                                      fill
                                      className="object-cover"
                                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                                    />
                                  </div>
                                ) : (
                                  <div className="h-48 sm:h-56 md:h-64 w-full bg-gray-100 flex items-center justify-center">
                                    <div className="text-center text-gray-500">
                                      <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                                      <p className="text-sm">No photo available</p>
                                      {observation.photo_url && (
                                        <p className="text-xs text-gray-400 mt-1">
                                          Path: {normalizePath(observation.photo_url)}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}

                                <CardHeader>
                                  <CardDescription className={`line-clamp-2 ${!observation.note ? 'text-muted-foreground italic' : ''}`}>
                                    {observation.note || t('noDescription')}
                                  </CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-3">
                                  {labels && labels.length > 0 && (
                                    <div className="flex flex-wrap gap-3 p-3 border border-gray-200 bg-gray-50">
                                      {labels.map((label, idx) => {
                                        // Clean up the label - remove extra spaces and split if it's concatenated
                                        const cleanLabel = label.trim();
                                        
                                        // More aggressive splitting for concatenated strings
                                        let processedLabel = cleanLabel;
                                        
                                        // First, try to split by common separators
                                        if (cleanLabel.includes(' ')) {
                                          processedLabel = cleanLabel;
                                        } else if (cleanLabel.includes('_')) {
                                          processedLabel = cleanLabel.replace(/_/g, ' ');
                                        } else if (cleanLabel.includes('-')) {
                                          processedLabel = cleanLabel.replace(/-/g, ' ');
                                        } else {
                                          // Split camelCase and PascalCase more aggressively
                                          processedLabel = cleanLabel
                                            .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase
                                            .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // PascalCase
                                            .replace(/([a-z])([0-9])/g, '$1 $2') // letters to numbers
                                            .replace(/([0-9])([a-zA-Z])/g, '$1 $2'); // numbers to letters
                                        }
                                        
                                        // Clean up multiple spaces and trim
                                        processedLabel = processedLabel.replace(/\s+/g, ' ').trim();
                                        
                                        return (
                                          <Badge key={`${observation.id}-label-${idx}`} variant="outline" className="text-xs px-3 py-1 border-2 bg-white hover:bg-gray-100 transition-colors">
                                            {processedLabel}
                                          </Badge>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {observation.plan && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <span className="font-medium">Plan:</span>
                                      <span>{observation.plan}</span>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>{formatDate(observation.photo_date || observation.created_at)}</span>
                                  </div>

                                  {observation.gps_lat != null && observation.gps_lng != null && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <MapPin className="h-4 w-4" />
                                      <span>
                                        {observation.gps_lat.toFixed(6)}, {observation.gps_lng.toFixed(6)}
                                      </span>
                                    </div>
                                  )}

                                  {observation.plan_anchor && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <MapPin className="h-4 w-4" />
                                      <span className="font-medium">Plan Anchor:</span>
                                      <span>
                                        {typeof observation.plan_anchor === 'object' && observation.plan_anchor !== null && 'x' in observation.plan_anchor && 'y' in observation.plan_anchor
                                          ? `${Number(observation.plan_anchor.x).toFixed(6)}, ${Number(observation.plan_anchor.y).toFixed(6)}`
                                          : JSON.stringify(observation.plan_anchor)
                                        }
                                      </span>
                                    </div>
                                  )}


                                  {observation.plan_url && (
                                    <div className="pt-2">
                                      <a
                                        href={observation.plan_url}
              target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                                      >
                                        {t('viewPlan')}
                                      </a>
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
                  <p className="text-muted-foreground text-lg">{t('noObservationsFound')}</p>
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
            {t('clearSelection')}
          </Button>
          <Button
            onClick={handleGenerateReport}
            size="lg"
            className="shadow-lg hover:shadow-xl transition-all"
          >
            {t('generateReportSelected').replace('{count}', selectedObservations.size.toString())}
          </Button>
        </div>
      )}
    </main>
  );
}
