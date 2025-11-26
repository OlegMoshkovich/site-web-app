"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  Info,
  X,
  Download,
  ZoomIn,
  ZoomOut,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import jsPDF from 'jspdf';
import { useRouter, useParams } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { generateWordReport, downloadWordDocument } from "@/lib/wordExport";
import Image from "next/image";

interface Report {
  id: string;
  title: string;
  description: string | null;
  ersteller?: string | null;
  baustelle?: string | null;
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
  sites?: { name: string; logo_url?: string | null } | null;
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingWord, setIsGeneratingWord] = useState(false);
  
  // Photo modal state
  const [selectedPhoto, setSelectedPhoto] = useState<ObservationWithUrl | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const reportId = params.id as string;

  // Photo modal handlers
  const openPhotoModal = (observation: ObservationWithUrl) => {
    setSelectedPhoto(observation);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const closePhotoModal = () => {
    setSelectedPhoto(null);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Zoom and pan handlers
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.01;
    const newScale = Math.min(Math.max(0.5, scale + delta), 3);
    setScale(newScale);
  }, [scale]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [scale, position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const zoomIn = useCallback(() => {
    const newScale = Math.min(scale * 1.3, 3);
    setScale(newScale);
  }, [scale]);

  const zoomOut = useCallback(() => {
    const newScale = Math.max(scale / 1.3, 0.5);
    setScale(newScale);
    if (newScale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  // Mouse and touch event listeners for modal
  useEffect(() => {
    if (!selectedPhoto) return;
    
    const container = imageContainerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      container.removeEventListener('wheel', handleWheel);
      if (isDragging) {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      }
    };
  }, [selectedPhoto, handleWheel, isDragging, handleMouseMove, handleMouseUp]);

  // Handler functions for report actions

  const handleExportReport = async () => {
    try {
      setIsGeneratingPDF(true);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Header section with professional styling and logo
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const reportTitle = report?.title || 'INSPECTION REPORT';
      
      // Calculate available width for text (account for logo space)
      const logoWidth = 30;
      const logoSpace = 45; // Logo width + some margin
      const maxTextWidth = pageWidth - 2 * margin - logoSpace;
      
      // Split title if it's too long to avoid logo overlap
      const titleLines = pdf.splitTextToSize(reportTitle, maxTextWidth);
      pdf.text(titleLines, margin, yPosition);
      yPosition += titleLines.length * 7; // Adjust for multiple lines
      
      // Add site logo in top-right corner if available
      if (observations.length > 0 && observations[0].sites?.logo_url) {
        try {
          const logoImg = new window.Image();
          logoImg.crossOrigin = 'anonymous';
          await new Promise((resolve, reject) => {
            logoImg.onload = resolve;
            logoImg.onerror = reject;
            logoImg.src = observations[0].sites!.logo_url!;
          });

          const logoCanvas = document.createElement('canvas');
          const logoCtx = logoCanvas.getContext('2d');
          logoCanvas.width = logoImg.width;
          logoCanvas.height = logoImg.height;
          logoCtx?.drawImage(logoImg, 0, 0);
          
          const logoData = logoCanvas.toDataURL('image/jpeg', 0.8);
          
          // Position logo in top-right
          const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
          pdf.addImage(logoData, 'JPEG', pageWidth - margin - logoWidth, margin - 5, logoWidth, logoHeight);
        } catch (error) {
          console.error('Error adding site logo to PDF header:', error);
        }
      }
      
      yPosition += 3;
      
      // Project details
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const reportDescription = report?.description || 'Baustelleninspektion Dokumentation';
      
      // Split description if it's too long to avoid logo overlap
      const descriptionLines = pdf.splitTextToSize(reportDescription, maxTextWidth);
      pdf.text(descriptionLines, margin, yPosition);
      yPosition += descriptionLines.length * 5; // Adjust for multiple lines
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      // Add Ersteller if available
      if (report?.ersteller) {
        pdf.text(`Ersteller: ${report.ersteller}`, margin, yPosition);
        yPosition += 5;
      }
      
      // Add Baustelle if available
      if (report?.baustelle) {
        pdf.text(`Baustelle: ${report.baustelle}`, margin, yPosition);
        yPosition += 5;
      }
      
      const dateText = new Date().toLocaleDateString('de-DE', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).replace(/(\d{2})\.(\d{2})\.(\d{4}), (\d{2}):(\d{2})/, '$1.$2.$3 $4:$5 Uhr');
      const datumLabel = `Datum: ${dateText}`;
      pdf.text(datumLabel, margin, yPosition);
      yPosition += 6;
      
      // Add a horizontal separator line under the header
      pdf.setLineWidth(0.3);
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;

      // Process each observation
      for (let i = 0; i < observations.length; i++) {
        const observation = observations[i];
        
        // Check if we need a new page - adjusted for 2 observations per page
        if (yPosition > pageHeight - 120) {
          pdf.addPage();
          yPosition = 10; // 20px from top of page
        }

        // Add observation content
        if (observation.signedUrl) {
          try {
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = observation.signedUrl!;
            });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Aggressive scaling for smaller PDF file size
            // Target around 400px max dimension to significantly reduce file size
            const maxDimension = 400;
            const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            
            if (ctx) {
              // Use medium quality smoothing to reduce processing overhead
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'medium';
              
              // Create rounded rectangle clipping path
              const radius = Math.round(10 * scale); // Scale radius proportionally
              ctx.beginPath();
              ctx.roundRect(0, 0, canvas.width, canvas.height, radius);
              ctx.clip();
              
              // Draw the scaled image with rounded corners
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            }
            
            const imgData = canvas.toDataURL('image/jpeg', 0.4);
            
            // Calculate image dimensions for PDF - increased size for 2 per page
            const imgWidth = 80;
            const imgHeight = (img.height / img.width) * imgWidth;
            
            // Add image
            pdf.addImage(imgData, 'JPEG', margin, yPosition, imgWidth, imgHeight);
            
            // Add logo overlay on photo if available
            if (observation.sites?.logo_url) {
              try {
                const logoImg = new window.Image();
                logoImg.crossOrigin = 'anonymous';
                await new Promise((resolve, reject) => {
                  logoImg.onload = resolve;
                  logoImg.onerror = reject;
                  logoImg.src = observation.sites!.logo_url!;
                });

                const logoCanvas = document.createElement('canvas');
                const logoCtx = logoCanvas.getContext('2d');
                // Scale down logo to reduce file size
                const logoMaxSize = 100;
                const logoScale = Math.min(1, logoMaxSize / Math.max(logoImg.width, logoImg.height));
                logoCanvas.width = Math.round(logoImg.width * logoScale);
                logoCanvas.height = Math.round(logoImg.height * logoScale);
                if (logoCtx) {
                  logoCtx.globalAlpha = 0.5; // Set 50% transparency
                  logoCtx.drawImage(logoImg, 0, 0, logoCanvas.width, logoCanvas.height);
                }
                
                const logoData = logoCanvas.toDataURL('image/jpeg', 0.4); // Use JPEG instead of PNG for smaller size
                
                // Position logo on top-left of photo
                const photoLogoWidth = 12; // Double the size from 6 to 12
                const photoLogoHeight = (logoImg.height / logoImg.width) * photoLogoWidth;
                pdf.addImage(logoData, 'JPEG', margin + 2, yPosition + 2, photoLogoWidth, photoLogoHeight);
              } catch (error) {
                console.error('Error adding logo overlay to photo:', error);
              }
            }
            
            // Add text content next to image
            const textStartX = margin + imgWidth + 10;
            const textWidth = pageWidth - textStartX - margin;
            let textY = yPosition + 5;
            
            // Add category if available from labels
            const category = observation.labels && observation.labels.length > 0 ? observation.labels[0] : 'Observation';
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Gebäude: ${category}`, textStartX, textY);
            textY += 5;
            
            // Add timestamp
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            const timestamp = new Date(observation.taken_at || observation.created_at).toLocaleDateString('de-DE') + ' ' + 
                             new Date(observation.taken_at || observation.created_at).toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'});
            pdf.text(`Aufgenommen am: ${timestamp}`, textStartX, textY);
            textY += 5;

            // Add labels
            if (observation.labels && observation.labels.length > 0) {
              pdf.setFontSize(10);
              pdf.setFont('helvetica', 'normal');
              const labelText = 'Bereich: ' + observation.labels.join(', ');
              const labelLines = pdf.splitTextToSize(labelText, textWidth);
              pdf.text(labelLines, textStartX, textY);
              textY += labelLines.length * 4 + 5;
            }
            
            // Add note
            if (observation.note) {
              pdf.setFontSize(10);
              pdf.setFont('helvetica', 'normal');
              const noteLines = pdf.splitTextToSize(observation.note, textWidth);
              pdf.text(noteLines, textStartX, textY);
              textY += noteLines.length * 5 + 2;
            }
            
  
            
            yPosition += Math.max(imgHeight, textY - yPosition) + 15;
            
          } catch (error) {
            console.error('Error adding observation to PDF:', error);
            // Fallback: just add text without image
            if (observation.note) {
              pdf.setFontSize(10);
              pdf.setFont('helvetica', 'normal');
              pdf.text(`${i + 1}. ${observation.note}`, margin, yPosition);
              yPosition += 8;
            }
            
            if (observation.labels && observation.labels.length > 0) {
              pdf.setFontSize(10);
              pdf.setFont('helvetica', 'normal');
              pdf.text('Bereich: ' + observation.labels.join(', '), margin, yPosition);
              yPosition += 8;
            }
            
            yPosition += 8;
          }
        }
      }

      // Add footer to all pages
      const totalPages = (pdf.internal as unknown as { getNumberOfPages(): number }).getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        
        // Footer line
        pdf.setLineWidth(0.1);
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
        
        // Footer text (page numbers only)
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Seite ${i}/${totalPages}`, pageWidth - margin - 10, pageHeight - 12);
      }

      // Save the PDF
      const filename = report?.title ? `${report.title.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf` : `report-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleExportWord = async () => {
    try {
      setIsGeneratingWord(true);
      
      // Prepare report data
      const reportData = {
        title: report?.title,
        description: report?.description,
        ersteller: report?.ersteller,
        baustelle: report?.baustelle,
        created_at: report?.created_at
      };
      
      // Display settings - for now we'll include everything
      const displaySettings = {
        photo: true,
        note: true,
        labels: true,
        gps: true
      };
      
      // Generate Word document
      const blob = await generateWordReport(observations, reportData, displaySettings);
      
      // Download the document
      const filename = report?.title 
        ? `${report.title.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.docx`
        : `report-${new Date().toISOString().split('T')[0]}.docx`;
      
      downloadWordDocument(blob, filename);
      
    } catch (error) {
      console.error('Error generating Word document:', error);
      alert('Error generating Word document. Please try again.');
    } finally {
      setIsGeneratingWord(false);
    }
  };

  // Check authentication status
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);
      } catch (error) {
        console.error('Error getting user:', error);
        setIsAuthenticated(false);
      }
    };

    getUser();

    // Listen for auth changes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    const fetchReportAndObservations = async () => {
    try {
      setLoading(true);
      
      // Fetch report details
      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .select('id, title, description, ersteller, baustelle, created_at, updated_at, settings')
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
        .select(`
          *,
          sites(name, logo_url)
        `)
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
            <button 
              onClick={() => router.push('/')}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            >
              <Image
                src="/images/banner_logo.png"
                alt="Site Logo"
                width={120}
                height={32}
                className="w-auto object-contain lg:h-6 h-5"
              />
            </button>
            {isAuthenticated && (
              <button 
                onClick={() => router.push('/reports')}
                className="hover:bg-gray-100 transition-colors p-1 rounded ml-4"
                title="Back to Reports"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExportReport}
              variant="outline"
              size="sm"
              className="h-8 px-3 transition-all"
              title="Download PDF Report"
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="hidden sm:inline ml-1">
                {isGeneratingPDF ? 'Generating...' : 'PDF'}
              </span>
            </Button>
            <Button
              onClick={handleExportWord}
              variant="outline"
              size="sm"
              className="h-8 px-3 transition-all hidden sm:inline-flex"
              title="Download Word Report"
              disabled={isGeneratingWord}
            >
              {isGeneratingWord ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="hidden sm:inline ml-1">
                {isGeneratingWord ? 'Generating...' : 'Word'}
              </span>
            </Button>
            <Button
              onClick={() => setShowInfoModal(true)}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 transition-all"
              title="Info"
            >
              <Info className="h-4 w-4" />
            </Button>
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
              {/* Title and Logo on same line */}
              <div className="flex justify-between items-center mb-4">
                <CardTitle className="flex-1">{report.title}</CardTitle>
                {/* Site Logo */}
                {observations.length > 0 && observations[0].sites?.logo_url && (
                  <div className="flex-shrink-0">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2">
                      <img 
                        src={observations[0].sites.logo_url} 
                        alt={`${observations[0].sites.name} logo`}
                        className="h-10 sm:h-12 w-auto object-contain rounded"
                      />
                    </div>
                  </div>
                )}
              </div>
              {/* Description in separate container below, full width */}
              {report.description && (
                <div className="mt-3">
                  <CardDescription className="text-black text-sm pb-3" style={{ fontSize: '14px' }}>{report.description}</CardDescription>
                </div>
              )}
              <div className="flex justify-start">
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          {/* <Calendar className="h-4 w-4" /> */}
                          <span>Erstellt {formatDate(report.created_at)}</span>
                        </div>
                      </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              {/* All unique labels */}
              {(() => {
                const allLabels = observations.flatMap(obs => obs.labels || []);
                const uniqueLabels = [...new Set(allLabels)];
                if (uniqueLabels.length > 0) {
                  return (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Kategorien</h4>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {uniqueLabels.map((label, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {processLabel(label)}
                          </Badge>
                        ))}
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
                    <div className="flex flex-col lg:flex-row print:flex-row items-center lg:items-stretch print:items-stretch">
                      {/* Image */}
                      {observation.signedUrl && (
                        <div 
                          className="flex-shrink-0 relative bg-transparent cursor-pointer w-80 lg:w-80 lg:border lg:border-gray-200"
                          onClick={() => openPhotoModal(observation)}
                        >
                          <Image
                            src={observation.signedUrl}
                            alt="Observation"
                            width={400}
                            height={300}
                            className="w-full h-auto object-contain hover:opacity-90 transition-opacity"
                            style={{ maxHeight: '280px' }}
                          />
                          {/* Photo number overlay */}
                          <div className="absolute top-0 left-0 w-8 h-8 bg-black text-white flex items-center justify-center text-sm font-bold shadow-md">
                            {index + 1}
                          </div>
                          {/* Site Logo overlay on each photo */}
                          {observation.sites?.logo_url && (
                            <div className="absolute bottom-2 right-2 z-10">
                              <div className="rounded-lg p-1.5 opacity-80">
                                <img 
                                  src={observation.sites.logo_url} 
                                  alt={`${observation.sites.name} logo`}
                                  className="h-6 w-auto object-contain rounded opacity-90"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Content */}
                      <div className="flex-1 w-full lg:w-auto">
                        {/* Always show CardHeader for consistent layout */}
                        <CardHeader className="pb-3 print:pb-2">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 w-full">
                              {observation.note ? (
                                <CardTitle className="text-lg print:text-base">{observation.note}</CardTitle>
                              ) : (
                                <CardTitle className="text-lg print:text-base text-gray-600">
                                  Observation {index + 1}
                                </CardTitle>
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
                <p className="text-gray-600 mb-4">Unverzichtbar für das Sammeln von Beobachtungen vor Ort</p>
                
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-gray-700">Fotos aufnehmen und Notizen vor Ort hinzufügen</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-gray-700">GPS-Standortverfolgung</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-gray-700">Automatische Synchronisation mit Ihren Standorten</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Web vs Mobile:</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Web Portal:</h4>
                    <p className="text-gray-600 text-sm">Team-Beobachtungen anzeigen, Berichte erstellen und Einstellungen verwalten</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">Mobile App:</h4>
                    <p className="text-gray-600 text-sm">Erforderlich für das Sammeln von Beobachtungen vor Ort</p>
                  </div>
                </div>
              </div>
              
              {/* App Store Button */}
              <div className="text-center">
                <a 
                  href="https://apps.apple.com/us/app/simple-site/id6749160249"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block hover:opacity-80 transition-opacity"
                >
                  <Image
                    src="/app_screens/available-app-store.png"
                    alt="Available on the App Store"
                    width={180}
                    height={60}
                    className="mx-auto"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && selectedPhoto.signedUrl && (
        <div className="fixed inset-0 bg-white backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full h-full max-w-7xl max-h-full flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-white/95 backdrop-blur-sm border-b border-gray-200">
              <div className="text-gray-900">
                <h3 className="text-lg font-semibold">
                  {selectedPhoto.note || `Observation ${observations.findIndex(obs => obs.id === selectedPhoto.id) + 1}`}
                </h3>
                <p className="text-sm text-gray-600">
                  {new Date(selectedPhoto.taken_at || selectedPhoto.created_at).toLocaleDateString('de-DE')}
                </p>
              </div>
              <button
                onClick={closePhotoModal}
                className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Image Container */}
            <div 
              ref={imageContainerRef}
              className="flex-1 relative bg-gray-100 overflow-hidden"
              style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
            >
              {/* Zoom Controls */}
              <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
                <button
                  onClick={zoomIn}
                  className="bg-white/90 hover:bg-white text-gray-700 p-2 transition-colors rounded shadow-lg border border-gray-200"
                  disabled={scale >= 3}
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  onClick={zoomOut}
                  className="bg-white/90 hover:bg-white text-gray-700 p-2 transition-colors rounded shadow-lg border border-gray-200"
                  disabled={scale <= 0.5}
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                {scale !== 1 && (
                  <button
                    onClick={resetZoom}
                    className="bg-white/90 hover:bg-white text-gray-700 px-2 py-1 text-xs transition-colors rounded shadow-lg border border-gray-200"
                  >
                    1:1
                  </button>
                )}
              </div>

              {/* Zoom indicator */}
              {scale !== 1 && (
                <div className="absolute bottom-4 right-4 z-30 bg-white/90 text-gray-700 px-2 py-1 text-xs rounded shadow-lg border border-gray-200">
                  {Math.round(scale * 100)}%
                </div>
              )}

              {/* Site logo overlay */}
              {selectedPhoto.sites?.logo_url && (
                <div className="absolute top-4 left-4 z-30">
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-gray-200">
                    <img 
                      src={selectedPhoto.sites.logo_url} 
                      alt={`${selectedPhoto.sites.name} logo`}
                      className="w-12 h-12 object-contain rounded"
                    />
                  </div>
                </div>
              )}
              
              {/* Zoomable/Pannable Image Container */}
              <div
                className="absolute inset-0 transition-transform duration-200 ease-out"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transformOrigin: 'center center'
                }}
                onMouseDown={handleMouseDown}
              >
                <Image
                  src={selectedPhoto.signedUrl}
                  alt="Observation"
                  fill
                  className="object-contain select-none"
                  sizes="100vw"
                  draggable={false}
                />
              </div>
            </div>

            {/* Bottom Info Panel */}
            <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4 max-h-32 overflow-y-auto">
              <div className="space-y-2">
                {selectedPhoto.labels && selectedPhoto.labels.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Labels</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedPhoto.labels.map((label, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 border border-gray-300 bg-gray-50 rounded"
                        >
                          {processLabel(label)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedPhoto.note && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Note</h4>
                    <p className="text-sm text-gray-700">{selectedPhoto.note}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}