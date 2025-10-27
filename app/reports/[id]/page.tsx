"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { formatDate } from "@/lib/utils";
import Image from "next/image";

interface Report {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  settings: Record<string, unknown>;
}

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
  anchor_x: number | null;
  anchor_y: number | null;
  photo_date: string | null;
  created_at: string;
  taken_at: string | null;
  latitude: number | null;
  longitude: number | null;
  site_id: string | null;
}

interface ObservationWithUrl extends Observation {
  signedUrl: string | null;
}

const BUCKET = "photos";

const normalizePath = (v?: string | null) =>
  (v ?? "").trim().replace(/^\/+/, "") || null;

export default function ReportDetailPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [observations, setObservations] = useState<ObservationWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const reportId = params.id as string;

  useEffect(() => {
    const fetchReportAndObservations = async () => {
    try {
      setLoading(true);
      
      // Fetch report details
      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (reportError) {
        console.error('Error fetching report:', reportError);
        router.push('/reports');
        return;
      }

      setReport(reportData);

      // First, get the observation IDs for this report
      const { data: reportObsData, error: reportObsError } = await supabase
        .from('report_observations')
        .select('observation_id')
        .eq('report_id', reportId);

      if (reportObsError) {
        console.error('Error fetching report observations:', reportObsError);
        return;
      }

      if (!reportObsData || reportObsData.length === 0) {
        setObservations([]);
        return;
      }

      // Extract observation IDs
      const observationIds = reportObsData.map((item: { observation_id: string }) => item.observation_id);

      // Fetch the actual observations
      const { data: observationsData, error: obsError } = await supabase
        .from('observations')
        .select('*')
        .in('id', observationIds);

      if (obsError) {
        console.error('Error fetching observations:', obsError);
        return;
      }
      
      const observationsWithUrls: ObservationWithUrl[] = await Promise.all(
        observationsData.map(async (obs: Observation) => {
          let signedUrl = null;
          if (obs.photo_url) {
            try {
              const normalizedPath = normalizePath(obs.photo_url);
              if (normalizedPath) {
                const { data: urlData } = await supabase.storage
                  .from(BUCKET)
                  .createSignedUrl(normalizedPath, 3600);
                signedUrl = urlData?.signedUrl || null;
              }
            } catch (error) {
              console.error(`Error getting signed URL for ${obs.photo_url}:`, error);
            }
          }
          
          return {
            ...obs,
            signedUrl
          };
        })
      );

      setObservations(observationsWithUrls);
    } catch (error) {
      console.error('Error fetching report and observations:', error);
    } finally {
      setLoading(false);
    }
    };

    fetchReportAndObservations();
  }, [reportId, router, supabase]);


  const processLabel = (label: string) => {
    const cleanLabel = label.trim();
    let processedLabel = cleanLabel;

    if (cleanLabel.includes(" ")) {
      processedLabel = cleanLabel;
    } else if (cleanLabel.includes("_")) {
      processedLabel = cleanLabel.replace(/_/g, " ");
    } else if (cleanLabel.includes("-")) {
      processedLabel = cleanLabel.replace(/-/g, " ");
    } else {
      processedLabel = cleanLabel
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
        .replace(/([a-z])([0-9])/g, "$1 $2")
        .replace(/([0-9])([a-zA-Z])/g, "$1 $2");
    }

    return processedLabel.replace(/\s+/g, " ").trim();
  };


  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center">
        <div className="flex-1 w-full flex flex-col gap-0 items-center">
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading report...</div>
          </div>
        </div>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="min-h-screen flex flex-col items-center">
        <div className="flex-1 w-full flex flex-col gap-0 items-center">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Report not found</h3>
            <p className="text-gray-500 mb-4">The report you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
            <Button onClick={() => router.push('/reports')} variant="outline">
              Back to Reports
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center print:min-h-0">
      <div className="flex-1 w-full flex flex-col gap-0 items-center">
        {/* Main content */}
        <div className="flex-1 flex flex-col gap-6 max-w-4xl px-3 sm:px-5 py-6 w-full print:max-w-none print:px-4 print:py-2">
          {/* Report Info Card */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="mb-3">{report.title}</CardTitle>
                {report.description && (
                  <CardDescription className="text-black text-sm" style={{ fontSize: '14px' }}>{report.description}</CardDescription>
                )}
              </div>
            </CardHeader>
            <CardContent>
              
              {/* All unique labels */}
              {(() => {
                const allLabels = observations.flatMap(obs => obs.labels || []);
                const uniqueLabels = [...new Set(allLabels)];
                if (uniqueLabels.length > 0) {
                  return (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium text-gray-900 mb-2">Categories</h4>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {uniqueLabels.map((label, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {processLabel(label)}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex justify-end">
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Created {formatDate(report.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </CardContent>
          </Card>

          {/* Observations */}
          {observations.length > 0 ? (
            <div className="space-y-4">
              <div className="grid gap-4 print:gap-2">
                {observations.map((observation, index) => (
                  <Card key={observation.id} className="overflow-hidden print:break-inside-avoid p-0">
                    <div className="flex flex-col lg:flex-row print:flex-row">
                      {/* Image */}
                      {observation.signedUrl && (
                        <div className="flex-shrink-0 relative bg-transparent border border-gray-200" style={{ width: '320px' }}>
                          <Image
                            src={observation.signedUrl}
                            alt="Observation"
                            width={400}
                            height={300}
                            className="w-full h-auto object-contain"
                            style={{ maxHeight: '280px' }}
                          />
                          {/* Photo number overlay */}
                          <div className="absolute top-0 left-0 w-8 h-8 bg-black text-white flex items-center justify-center text-sm font-bold shadow-md">
                            {index + 1}
                          </div>
                        </div>
                      )}
                      
                      {/* Content */}
                      <div className="flex-1">
                        <CardHeader className="pb-3 print:pb-2">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              {observation.note && (
                                <CardTitle className="text-lg print:text-base">{observation.note}</CardTitle>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pt-0 print:pt-0">
                          <div className="space-y-3 print:space-y-2">
                            {/* Labels */}
                            {observation.labels && observation.labels.length > 0 && (
                              <div className="space-y-1">
                                <div className="flex flex-wrap gap-1">
                                  {observation.labels.map((label, idx) => (
                                    <Badge
                                      key={`${observation.id}-label-${idx}`}
                                      variant="outline"
                                      className="text-xs px-1.5 py-0.5"
                                    >
                                      {processLabel(label)}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Date */}
                            <div className="text-xs text-gray-500 mt-auto">
                              {formatDate(observation.taken_at || observation.created_at)}
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No observations found in this report.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}