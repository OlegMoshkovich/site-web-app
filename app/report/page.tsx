"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { translations, type Language } from "@/lib/translations";

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

function ReportPageContent() {
  const [observations, setObservations] = useState<ObservationWithUrl[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const searchParams = useSearchParams();
  
  // Helper function to get translated text
  const t = (key: keyof typeof translations.en) => {
    const value = translations[language][key];
    return typeof value === 'string' ? value : '';
  };
  
  // Memoize the selected IDs to prevent unnecessary re-renders
  const memoizedSelectedIds = useMemo(() => {
    try {
      if (!searchParams) {
        console.warn('Search params not available yet');
        return [];
      }
      const ids = searchParams.get('ids');
      if (!ids) {
        return [];
      }
      return ids.split(',').filter(id => id.trim());
    } catch (err) {
      console.error('Error parsing search params:', err);
      return [];
    }
  }, [searchParams]);
  
  // Create supabase client only once
  const supabase = useMemo(() => createClient(), []);

  const normalizePath = (v?: string | null) =>
    (v ?? "").trim().replace(/^\/+/, "") || null;



  const handleCreateGoogleDoc = useCallback(async () => {
    console.log('🚀 handleCreateGoogleDoc called');
    
    try {
      // Prepare data for Zapier webhook
      const currentDate = new Date().toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US');
      
      // Format observations as text
      const observationsText = observations.map((observation, index) => {
        const note = observation.note || t('noDescription');
        const labels = observation.labels?.length ? observation.labels.join(', ') : t('noLabels');
        const photoLine = observation.signedUrl ? `\nPhoto: ${observation.signedUrl}` : '';
        
        return `${index + 1}. ${note}\nLabels: ${labels}${photoLine}\n---`;
      }).join('\n\n');
      
      const contentText = `${t('report')} - ${currentDate}
Generated on: ${currentDate}

Total Observations: ${observations.length}

OBSERVATIONS:

${observationsText}

End of Report`;

      const docData = {
        title: `${t('report')} - ${currentDate}`,
        date: currentDate,
        total_observations: observations.length,
        content: contentText
      };

      console.log('📝 Document data prepared:', docData);

      // Show loading state
      const button = document.querySelector('[data-create-doc-btn]') as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.textContent = 'Creating Google Doc...';
      }

      // Send data to our API route which forwards to Zapier
      console.log('📡 Making API call to /api/create-google-doc');
      const response = await fetch('/api/create-google-doc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(docData)
      });

      console.log('📨 API response status:', response.status);
      console.log('📨 API response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create Google Doc');
      }

      const result = await response.json();
      
      // If the API returns a document URL from Zapier, open it
      if (result.data?.document_url) {
        window.open(result.data.document_url, '_blank');
        alert('Google Doc created successfully! Opening in new tab.');
      } else {
        alert('Google Doc creation initiated! Check your Google Drive in a few moments.');
      }

    } catch (error) {
      console.error('Error creating Google Doc:', error);
      alert('Failed to create Google Doc. Please try again.');
    } finally {
      // Reset button state
      const button = document.querySelector('[data-create-doc-btn]') as HTMLButtonElement;
      if (button) {
        button.disabled = false;
        button.textContent = t('createGoogleDoc');
      }
    }
  }, [observations, t, language]);

  const fetchSelectedObservations = useCallback(async () => {
    if (!memoizedSelectedIds || memoizedSelectedIds.length === 0) {
      setError("No observations selected. Please go back and select some observations first.");
      setIsLoading(false);
      setIsInitialized(true);
      return;
    }

    try {
      // Only set loading if we haven't initialized yet
      if (!isInitialized) {
        setIsLoading(true);
      }
      setError(null);

      // Fetch the selected observations
      const { data: obsData, error: obsError } = await supabase
        .from("observations")
        .select("*")
        .in("id", memoizedSelectedIds)
        .order("created_at", { ascending: false });

      if (obsError) {
        console.error("Error fetching observations:", obsError);
        setError(`Error loading observations: ${obsError.message}`);
        setIsLoading(false);
        setIsInitialized(true);
        return;
      }

      const base = (obsData ?? []) as Observation[];

      // Create signed URLs for each photo
      const withUrls: ObservationWithUrl[] = await Promise.all(
        base.map(async (o) => {
          const signedUrl = o.photo_url
            ? await (async (filenameOrPath: string, expiresIn = 3600): Promise<string | null> => {
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
              })(o.photo_url, 3600)
            : null;
          return { ...o, signedUrl };
        })
      );

      setObservations(withUrls);
      setIsLoading(false);
      setIsInitialized(true);
    } catch (e) {
      console.error("Error in fetchSelectedObservations:", e);
      setError("An unexpected error occurred.");
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [memoizedSelectedIds, supabase, isInitialized]);

  useEffect(() => {
    // Only fetch once when component mounts
    if (!isInitialized) {
      fetchSelectedObservations();
    }
  }, [fetchSelectedObservations, isInitialized]);

  // Show loading state inline to prevent layout shifts
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center">
        <div className="w-full max-w-7xl p-5">
          {/* Header - Always visible */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <Link 
                href="/" 
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                {t('backToObservations')}
              </Link>
              
              <div className="flex items-center gap-3">
                {/* Language Selector */}
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">EN</option>
                  <option value="de">DE</option>
                </select>
                
                {/* Create Google Doc Button - Disabled during loading */}
                <Button
                  disabled
                  variant="secondary"
                  className="opacity-50"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Create Google Doc
                </Button>
              </div>
            </div>
            <h1 className="text-3xl font-bold">{t('report')}</h1>
            <p className="text-muted-foreground">
              {t('loadingSelectedObservations')}
            </p>
          </div>
          
          {/* Loading skeleton that matches the final layout */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: Math.min(memoizedSelectedIds.length, 8) }).map((_, index) => (
                <div key={index} className="bg-gray-100 rounded-lg overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state inline to prevent layout shifts
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center">
        <div className="w-full max-w-7xl p-5">
          {/* Header - Always visible */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <Link 
                href="/" 
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                {t('backToObservations')}
              </Link>
              
              {/* Create Google Doc Button - Disabled during error */}
              <Button
                disabled
                variant="secondary"
                className="opacity-50"
              >
                <FileText className="h-4 w-4 mr-2" />
                Create Google Doc
              </Button>
            </div>
            <h1 className="text-3xl font-bold">{t('report')}</h1>
            <p className="text-muted-foreground">
              {t('errorLoadingReport')}
            </p>
          </div>
          
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-600 font-medium">{error}</p>
              {memoizedSelectedIds.length > 0 ? (
                <Button 
                  onClick={() => {
                    setError(null);
                    setIsLoading(true);
                    setIsInitialized(false);
                    fetchSelectedObservations();
                  }}
                  variant="destructive"
                  className="mt-4"
                >
                  {t('tryAgain')}
                </Button>
              ) : (
                <Button asChild className="mt-4">
                  <Link href="/">
                    {t('goBackToObservations')}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center">
      <div className="w-full max-w-7xl p-5">
        {/* Header - Stable section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Observations
            </Link>
            
            {/* Create Google Doc Button */}
            <Button
              onClick={handleCreateGoogleDoc}
              data-create-doc-btn
              className="shadow-lg hover:shadow-xl transition-all"
            >
              <FileText className="h-4 w-4 mr-2" />
              Create Google Doc
            </Button>
          </div>
          <h1 className="text-3xl font-bold">Report</h1>
          <p className="text-muted-foreground">
            {observations.length} observation{observations.length !== 1 ? 's' : ''} selected • Click "Create Google Doc" to generate a shareable document
          </p>
        </div>

        {/* Photos in a row */}
        {observations.length > 0 ? (
          <div key="observations-content" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {observations.map((observation) => {
                return (
                  <div key={observation.id} className="observation">
                    {observation.signedUrl ? (
                      <img
                        src={observation.signedUrl}
                        alt={`Photo for ${observation.plan ?? "observation"}`}
                        className="photo"
                        loading="lazy"
                      />
                    ) : (
                      <div className="no-photo">
                        <span className="no-photo-text">No photo available</span>
                      </div>
                    )}
                                            <div className="note">{observation.note || t('noDescription')}</div>
                    {observation.labels && observation.labels.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-2 border border-gray-200 bg-gray-50">
                        {observation.labels.map((label, idx) => {
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
                            <span key={idx} className="inline-block px-2 py-1 text-xs bg-white border border-gray-300 text-gray-700">
                              {processedLabel}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No observations found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center">
        <div className="w-full max-w-7xl p-5">
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">Loading report...</p>
          </div>
        </div>
      </div>
    }>
      <ReportPageContent />
    </Suspense>
  );
}
