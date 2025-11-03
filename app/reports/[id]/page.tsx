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
  Info,
  ArrowRight,
  X,
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
  const [showInfoModal, setShowInfoModal] = useState(false);
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top navigation bar */}
      <nav className="sticky top-0 z-20 w-full flex justify-center h-16 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="w-full flex justify-between items-center px-2 sm:px-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="text-lg font-semibold">
              Simple Site
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Language selector */}
            <select
              value="en"
              onChange={() => {}} // Add empty handler to fix React warning
              className="h-8 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 text-sm font-medium transition-colors rounded"
              title="Change Language"
            >
              <option value="en">EN</option>
              <option value="de">DE</option>
            </select>
            
            <button
              onClick={() => setShowInfoModal(true)}
              className="h-8 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 text-sm font-medium transition-colors rounded flex items-center gap-1"
            >
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">Info</span>
            </button>
            <button
              onClick={() => router.push('/')}
              className="h-8 w-8 p-0 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 transition-colors rounded flex items-center justify-center"
              title="Go to Home"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center">
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

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Simple Site Mobile App</h2>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 space-y-6">
              <div>
                <p className="text-gray-600 mb-4">Essential for collecting observations in the field</p>
                
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-gray-700">Take photos and add notes on-site</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-gray-700">GPS location tracking</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-gray-700">Automatic sync with your sites</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Web vs Mobile:</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Web Portal:</h4>
                    <p className="text-gray-600 text-sm">View team observations, generate reports, and manage settings</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">Mobile App:</h4>
                    <p className="text-gray-600 text-sm">Required for collecting observations in the field</p>
                  </div>
                </div>
              </div>
              
              {/* App Store Button */}
              <div className="text-center">
                <div className="inline-block bg-black text-white px-4 py-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">Available on the</span>
                  </div>
                  <div className="text-lg font-semibold">App Store</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}