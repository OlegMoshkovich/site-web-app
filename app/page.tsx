"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, User, Image as ImageIcon } from "lucide-react";
import { AuthButtonClient } from "@/components/auth-button-client";

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
  const [user, setUser] = useState<any>(null);
  const [observations, setObservations] = useState<ObservationWithUrl[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedObservations, setSelectedObservations] = useState<Set<string>>(new Set());

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
    
    const selectedObs = observations.filter(obs => selectedObservations.has(obs.id));
    
    console.log(`Generating report for ${selectedObs.length} observations:`, selectedObs.map(obs => ({
      id: obs.id,
      note: obs.note,
      photo_url: obs.photo_url,
      date: obs.photo_date || obs.created_at,
      location: obs.gps_lat && obs.gps_lng 
        ? `${obs.gps_lat}, ${obs.gps_lng}` 
        : 'No location data'
    })));
    
    // TODO: Implement actual report generation
    // This could open a modal, navigate to a report page, or trigger an API call
  }, [selectedObservations, observations]);

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
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              Simple site
            </div>
            <AuthButtonClient />
          </div>
        </nav>

          <div className="flex-1 flex flex-col gap-0 max-w-5xl p-5" >
            <div className="w-full">   
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">Loading observations...</p>
                </div>
              ) : error ? (
                <div className="text-red-500">{error}</div>
              ) : observations.length > 0 ? (
                <div className="space-y-8">
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
                        <div className="border-b border-gray-200 pb-2">
                          <div className="text-l ">
                            {new Date(dateKey).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                        
                        {/* Observations for this date */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {groupedObservations[dateKey].map((observation) => {
                            const hasPhoto = Boolean(observation.signedUrl);
                            const labels = observation.labels ?? [];

                            return (
                              <Card 
                                key={observation.id} 
                                className={`overflow-hidden hover:shadow-lg transition-all cursor-pointer ${
                                  selectedObservations.has(observation.id)
                                    ? 'ring-2 ring-blue-500 shadow-lg scale-105' 
                                    : ''
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
                                  <div className="relative h-48 w-full">
                                    <img
                                      src={observation.signedUrl as string}
                                      alt={`Photo for ${observation.plan ?? "observation"}`}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                  </div>
                                ) : (
                                  <div className="h-48 w-full bg-gray-100 flex items-center justify-center">
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
                                  <CardDescription className="line-clamp-2">
                                    {observation.note ?? ""}
                                  </CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-3">
                                  {labels.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                      {labels.map((label, idx) => (
                                        <Badge key={`${observation.id}-label-${idx}`} variant="secondary" className="text-xs">
                                          {label}
                                        </Badge>
                                      ))}
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
          <button
            onClick={() => setSelectedObservations(new Set())}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-lg transition-colors shadow-lg"
          >
            Clear Selection
          </button>
          <button
            onClick={handleGenerateReport}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors shadow-lg"
          >
            Generate Report ({selectedObservations.size} selected)
          </button>
        </div>
      )}
    </main>
  );
}
