"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, User, Image as ImageIcon, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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

export default function ReportPage() {
  const [observations, setObservations] = useState<ObservationWithUrl[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const searchParams = useSearchParams();
  const selectedIds = searchParams.get('ids')?.split(',') || [];
  
  // Memoize the selected IDs to prevent unnecessary re-renders
  const memoizedSelectedIds = useMemo(() => selectedIds, [selectedIds]);
  
  // Create supabase client only once
  const supabase = useMemo(() => createClient(), []);

  const normalizePath = (v?: string | null) =>
    (v ?? "").trim().replace(/^\/+/, "") || null;

  const getSignedPhotoUrl = async (filenameOrPath: string, expiresIn = 3600): Promise<string | null> => {
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
  };

  const fetchSelectedObservations = useCallback(async () => {
    if (memoizedSelectedIds.length === 0) {
      setError("No observations selected");
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
            ? await getSignedPhotoUrl(o.photo_url, 3600)
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
            <div className="flex items-center gap-4 mb-4">
              <Link 
                href="/" 
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Observations
              </Link>
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
            <div className="flex items-center gap-4 mb-4">
              <Link 
                href="/" 
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Observations
              </Link>
            </div>
            <h1 className="text-3xl font-bold">Report</h1>
            <p className="text-muted-foreground">
              Error loading report
            </p>
          </div>
          
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-600 font-medium">{error}</p>
              <button 
                onClick={() => {
                  setError(null);
                  setIsLoading(true);
                  setIsInitialized(false);
                  fetchSelectedObservations();
                }}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
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
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Observations
            </Link>
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
                const hasPhoto = Boolean(observation.signedUrl);
                const labels = observation.labels ?? [];

                return (
                    <img
                    key={observation.id}
                          src={observation.signedUrl as string}
                          alt={`Photo for ${observation.plan ?? "observation"}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                  
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
