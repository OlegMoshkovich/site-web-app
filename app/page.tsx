"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, User, Image as ImageIcon } from "lucide-react";
import { AuthButtonClient } from "@/components/auth-button-client";
import { useRouter } from "next/navigation";

interface Observation {
  id: string;
  plan: string | null;
  labels: string[] | null;
  user_id: string;
  note: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  photo_url: string | null;
  plan_url: string | null;
  plan_anchor: Record<string, unknown> | null;
  photo_date: string | null;
  created_at: string;
}

interface ObservationWithUrl extends Observation {
  signedUrl: string | null;
}

const BUCKET = "photos";

export default function Home() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [observations, setObservations] = useState<ObservationWithUrl[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedObservations, setSelectedObservations] = useState<Set<string>>(new Set());
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const normalizePath = (v?: string | null) =>
    (v ?? "").trim().replace(/^\/+/, "") || null;

  const getSignedPhotoUrl = useCallback(
    async (filenameOrPath: string, expiresIn = 3600): Promise<string | null> => {
      const key = normalizePath(filenameOrPath);
      if (!key) return null;
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

  const handleGenerateReport = useCallback(() => {
    if (selectedObservations.size === 0) return;
    
    const selectedIds = Array.from(selectedObservations);
    const queryString = selectedIds.join(',');
    
    // Navigate to the report page with selected observation IDs
    router.push(`/report?ids=${queryString}`);
  }, [selectedObservations, router]);

  const handleSelectByDateRange = useCallback(() => {
    if (!startDate || !endDate) return;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Find observations within the date range
    const observationsInRange = observations.filter(observation => {
      const observationDate = new Date(observation.photo_date || observation.created_at);
      return observationDate >= start && observationDate <= end;
    });
    
    // Select all observations in the range
    const observationIds = observationsInRange.map(obs => obs.id);
    setSelectedObservations(new Set(observationIds));
  }, [startDate, endDate, observations]);

  const handleSelectByDateRangeWithDates = useCallback((start: string, end: string) => {
    if (!start || !end) return;
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // Find observations within the date range
    const observationsInRange = observations.filter(observation => {
      const observationDate = new Date(observation.photo_date || observation.created_at);
      return observationDate >= startDate && observationDate <= endDate;
    });
    
    // Select all observations in the range
    const observationIds = observationsInRange.map(obs => obs.id);
    setSelectedObservations(new Set(observationIds));
  }, [observations]);

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

  const getAvailableDateRange = useCallback(() => {
    if (observations.length === 0) return { min: '', max: '' };
    
    const dates = observations.map(obs => new Date(obs.photo_date || obs.created_at));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    return {
      min: minDate.toISOString().split('T')[0],
      max: maxDate.toISOString().split('T')[0]
    };
  }, [observations]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 1) Auth
        const { data: authData, error: userError } = await supabase.auth.getUser();
        if (userError || !authData.user) {
          setUser(null);
          setIsLoading(false);
          return;
        }
        setUser(authData.user);

        // 2) Fetch observations for current user (newest first)
        const { data: obsData, error: obsError } = await supabase
          .from("observations")
          .select("*")
          .eq("user_id", authData.user.id)
          .order("created_at", { ascending: false });

        if (obsError) {
          console.error("Error fetching observations:", obsError);
          setError(`Error loading observations: ${obsError.message}`);
          setIsLoading(false);
          return;
        }

        const base = (obsData ?? []) as Observation[];

        // 3) In parallel, create signed URLs for each photo (bucket is private)
        const withUrls: ObservationWithUrl[] = await Promise.all(
          base.map(async (o) => {
            const signedUrl = o.photo_url
              ? await getSignedPhotoUrl(o.photo_url, 3600) // 1 hour
              : null;
            return { ...o, signedUrl };
          })
        );

        setObservations(withUrls);
        setIsLoading(false);
      } catch (e) {
        console.error("Error in fetchData:", e);
        setError("An unexpected error occurred.");
        setIsLoading(false);
      }
    };

    fetchData();
  }, [supabase, getSignedPhotoUrl]);

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-4 items-center">
        <nav className="sticky top-0 z-20 w-full flex justify-center h-16 bg-white/95 backdrop-blur-sm border-b border-gray-200">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-3 sm:px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              SIMPLE SITE
            </div>
            <AuthButtonClient />
          </div>
        </nav>

          <div className="flex-1 flex flex-col gap-0 max-w-5xl p-1 sm:p-3 md:p-4 bg-gray-50/30" >
            <div className="w-full">   
              {!user ? (
                // Show Hero when not logged in
                <div className="text-center py-12">
                  <h1 className="text-lg ">welcome to simple site</h1>
                  <p className="text-muted-foreground text-sm">please sign in</p>
                </div>
              ) : isLoading ? (
                <div className="text-center py-12">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                </div>
              ) : error ? (
                <div className="text-red-500">{error}</div>
              ) : observations.length > 0 ? (
                <div className="space-y-8">
                  {/* Date Range Selection */}
                  <div className="sticky top-16 z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-white/95 backdrop-blur-sm shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <label htmlFor="startDate" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                          Start:
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
                          className="px-3 py-1 text-sm border focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-auto"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <label htmlFor="endDate" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                          End:
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
                          className="px-3 py-1 text-sm border focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-auto"
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
                          {startDate && endDate ? 'Clear' : 'Select Range'}
                        </Button>
                        <Button
                          onClick={handleSelectAll}
                          size="sm"
                          variant="outline"
                          className="w-full sm:w-auto"
                        >
                          {selectedObservations.size === observations.length ? 'Unselect All' : 'Select All'}
                        </Button>
                      </div>
                    </div>
                    <div className="text-muted-foreground text-sm text-center sm:text-right">
                      {selectedObservations.size > 0 
                        ? `${selectedObservations.size} observation${selectedObservations.size !== 1 ? 's' : ''} selected`
                        : "Click on observations to select them."
                      }
                    </div>
                  </div>
                  

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
                            {new Date(dateKey).toLocaleDateString('en-US', {
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
                                    <img
                                      src={observation.signedUrl as string}
                                      alt={`Photo for ${observation.plan ?? "observation"}`}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
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
                                    {observation.note || "No description available"}
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

                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <User className="h-4 w-4" />
                                    <span>User ID: {observation.user_id.slice(0, 8)}...</span>
                                  </div>

                                  {observation.plan_url && (
                                    <div className="pt-2">
                                      <a
                                        href={observation.plan_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                                      >
                                        View Plan
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
                  <p className="text-muted-foreground text-lg">No observations found.</p>
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
            Clear Selection
          </Button>
          <Button
            onClick={handleGenerateReport}
            size="lg"
            className="shadow-lg hover:shadow-xl transition-all"
          >
            Generate Report ({selectedObservations.size} selected)
          </Button>
        </div>
      )}
    </main>
  );
}
