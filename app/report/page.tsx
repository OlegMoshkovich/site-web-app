"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

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
  const searchParams = useSearchParams();
  
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



  const handlePrint = useCallback(() => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print this report');
      return;
    }

    // Generate the print content
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Report</title>
          <style>
                         @media print {
               body { 
                 margin: 0; 
                 padding: 0; 
                 font-family: Arial, sans-serif; 
                 -webkit-print-color-adjust: exact;
                 color-adjust: exact;
               }
               .header { 
                 text-align: center; 
                 margin: 0 0 20px 0; 
                 padding: 20px 0; 
                 border-bottom: 2px solid #333; 
               }
               .header h1 { 
                 font-size: 28px; 
                 margin: 0 0 15px 0; 
                 color: #000; 
                 font-weight: bold;
               }
               .header p { 
                 font-size: 16px; 
                 margin: 0; 
                 color: #333; 
                 font-weight: 500;
               }
               .grid { 
                 display: grid; 
                 grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
                 gap: 15px; 
                 margin-top: 20px; 
               }
               .observation { 
                 border: 1px solid #ccc; 
                 padding: 12px; 
                 border-radius: 6px; 
                 page-break-inside: avoid; 
                 background: white;
               }
               .photo { 
                 width: 100%; 
                 height: 180px; 
                 object-fit: cover; 
                 border-radius: 4px; 
                 margin-bottom: 12px; 
                 border: 1px solid #eee;
               }
               .no-photo { 
                 width: 100%; 
                 height: 180px; 
                 background: #f8f8f8; 
                 border: 2px dashed #ddd; 
                 border-radius: 4px; 
                 display: flex; 
                 align-items: center; 
                 justify-content: center; 
                 margin-bottom: 12px; 
               }
               .no-photo-text { 
                 color: #999; 
                 font-size: 14px; 
               }
               .note { 
                 font-size: 14px; 
                 margin-bottom: 12px; 
                 color: #000; 
                 line-height: 1.4; 
                 font-weight: 500;
               }
               .labels { 
                 margin-bottom: 12px; 
               }
               .label { 
                 display: inline-block; 
                 background: #f0f0f0; 
                 padding: 3px 8px; 
                 margin: 2px; 
                 border-radius: 3px; 
                 font-size: 11px; 
                 color: #555; 
                 border: 1px solid #ddd;
               }
               @page { 
                 margin: 1.5cm; 
                 size: A4;
               }
               /* Hide browser elements */
               @page :first {
                 margin-top: 0;
               }
               @page :left {
                 margin-left: 1.5cm;
               }
               @page :right {
                 margin-right: 1.5cm;
               }
               /* Additional print optimizations */
               * {
                 -webkit-print-color-adjust: exact !important;
                 color-adjust: exact !important;
               }
               /* Ensure clean page breaks */
               .observation:nth-child(4n) {
                 page-break-after: always;
               }
               /* Hide any potential browser elements */
               body::before,
               body::after {
                 display: none !important;
               }
               /* Ensure no browser UI elements show */
               html {
                 background: white !important;
               }
               /* Remove any default browser margins */
               * {
                 box-sizing: border-box;
               }
               /* Ensure clean text rendering */
               h1, p, span, div {
                 text-rendering: optimizeLegibility;
                 -webkit-font-smoothing: antialiased;
               }
             }
            @media screen {
              body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; background: white; padding: 20px; border-radius: 8px; }
              .header h1 { font-size: 24px; margin: 0 0 10px 0; color: #333; }
              .header p { font-size: 14px; margin: 0; color: #666; }
              .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 20px; }
              .observation { border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .photo { width: 100%; height: 200px; object-fit: cover; border-radius: 4px; margin-bottom: 15px; }
              .no-photo { width: 100%; height: 200px; background: #f5f5f5; border: 2px dashed #ddd; border-radius: 4px; display: flex; align-items: center; justify-content: center; margin-bottom: 15px; }
              .no-photo-text { color: #999; font-size: 14px; }
              .note { font-size: 14px; margin-bottom: 15px; color: #333; line-height: 1.4; }
              .labels { margin-bottom: 15px; }
              .label { display: inline-block; background: #f0f0f0; padding: 4px 8px; margin: 2px; border-radius: 4px; font-size: 12px; color: #666; }
              .metadata { font-size: 12px; color: #666; }
              .metadata-item { margin-bottom: 5px; }
              .metadata-icon { display: inline-block; width: 12px; margin-right: 5px; }
              .print-button { position: fixed; top: 20px; right: 20px; background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 16px; }
              .print-button:hover { background: #0056b3; }
            }
          </style>
        </head>
        <body>
          
                     <div class="header">
             <h1>Report</h1>
             <p>${new Date().toLocaleDateString()}</p>
           </div>
          <div class="grid">
            ${observations.map((observation) => {
              const note = observation.note || 'No description available';

              return `
                <div class="observation">
                  ${observation.signedUrl 
                    ? `<img src="${observation.signedUrl}" alt="Observation photo" class="photo" />`
                    : `<div class="no-photo"><span class="no-photo-text">No photo available</span></div>`
                  }
                  <div class="note">${note}</div>
                  ${observation.labels && observation.labels.length > 0 
                    ? `<div class="labels">${observation.labels.map((label: string) => `<span class="label">${label}</span>`).join('')}</div>`
                    : ''
                  }
                </div>
              `;
            }).join('')}
          </div>
        </body>
      </html>
    `;

    // Write content to the new window
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for images to load before printing
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 1000);
    };
  }, [observations]);

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
                Back to Observations
              </Link>
              
              {/* Print Button - Disabled during loading */}
              <Button
                disabled
                variant="secondary"
                className="opacity-50"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Report
              </Button>
            </div>
            <h1 className="text-3xl font-bold">Report</h1>
            <p className="text-muted-foreground">
              Loading selected observations...
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
                Back to Observations
              </Link>
              
              {/* Print Button - Disabled during error */}
              <Button
                disabled
                variant="secondary"
                className="opacity-50"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Report
              </Button>
            </div>
            <h1 className="text-3xl font-bold">Report</h1>
            <p className="text-muted-foreground">
              Error loading report
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
                  Try Again
                </Button>
              ) : (
                <Button asChild className="mt-4">
                  <Link href="/">
                    Go Back to Observations
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
            
            {/* Print Button */}
            <Button
              onClick={handlePrint}
              className="shadow-lg hover:shadow-xl transition-all"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Report
            </Button>
          </div>
          <h1 className="text-3xl font-bold">Report</h1>
          <p className="text-muted-foreground">
            {observations.length} observation{observations.length !== 1 ? 's' : ''} selected
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
                    <div className="note">{observation.note || 'No description available'}</div>
                    {observation.labels && observation.labels.length > 0 && (
                      <div className="labels">
                        {observation.labels.map((label, idx) => (
                          <span key={idx} className="label">{label}</span>
                        ))}
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
