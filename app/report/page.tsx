"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Download, FileText, Edit3, Check, X, Trash2, Save } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { translations, type Language, useLanguage } from "@/lib/translations";
import jsPDF from 'jspdf';
import { Document, Paragraph, ImageRun, TextRun, Packer, Table, TableRow, TableCell, WidthType, VerticalAlign } from 'docx';
import { saveAs } from 'file-saver';
import PlanDisplayWidget from '@/components/plan-display-widget';

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
  const { language, setLanguage } = useLanguage();
  
  // Display toggles
  const [displaySettings, setDisplaySettings] = useState({
    photo: true,
    note: true,
    labels: true,
    gps: true
  });
  
  // Edit state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteValue, setEditNoteValue] = useState<string>('');
  
  // Save report state
  const [isSaving, setIsSaving] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  
  const searchParams = useSearchParams();
  
  // Helper function to get translated text
  const t = useCallback((key: keyof typeof translations.en) => {
    const value = translations[language][key];
    return typeof value === 'string' ? value : '';
  }, [language]);
  
  // Memoize the selected IDs to prevent unnecessary re-renders
  const memoizedSelectedIds = useMemo(() => {
    try {
      if (!searchParams) {
        console.warn('Search params not available yet');
        return [];
      }
      
      // Check for direct observation IDs
      const ids = searchParams.get('ids');
      if (ids) {
        return ids.split(',').filter(id => id.trim());
      }
      
      // If no direct IDs, this will be handled by loadReportData
      return [];
    } catch (err) {
      console.error('Error parsing search params:', err);
      return [];
    }
  }, [searchParams]);

  // Check if we're loading from a saved report
  const reportId = searchParams?.get('reportId');
  
  // Create supabase client only once
  const supabase = useMemo(() => createClient(), []);

  const normalizePath = (v?: string | null) =>
    (v ?? "").trim().replace(/^\/+/, "") || null;

  // Handle note editing
  const handleEditNote = useCallback((observationId: string, currentNote: string) => {
    setEditingNoteId(observationId);
    setEditNoteValue(currentNote || '');
  }, []);

  const handleSaveNote = useCallback(async (observationId: string) => {
    try {
      const { error } = await supabase
        .from('observations')
        .update({ note: editNoteValue })
        .eq('id', observationId);

      if (error) {
        console.error('Error updating note:', error);
        alert('Error updating note. Please try again.');
        return;
      }

      // Update local state
      setObservations(prev => prev.map(obs => 
        obs.id === observationId 
          ? { ...obs, note: editNoteValue }
          : obs
      ));
      
      setEditingNoteId(null);
      setEditNoteValue('');
    } catch (error) {
      console.error('Error updating note:', error);
      alert('Error updating note. Please try again.');
    }
  }, [supabase, editNoteValue]);

  const handleCancelEdit = useCallback(() => {
    setEditingNoteId(null);
    setEditNoteValue('');
  }, []);

  // Handle observation deletion with confirmation
  const handleDeleteObservation = useCallback(async (observationId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent any parent click handlers
    
    // Show confirmation dialog
    const confirmed = window.confirm('Are you sure you want to delete this observation? This action cannot be undone.');
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('observations')
        .delete()
        .eq('id', observationId);

      if (error) {
        console.error('Error deleting observation:', error);
        alert('Error deleting observation. Please try again.');
        return;
      }

      // Remove from local state
      setObservations(prev => prev.filter(obs => obs.id !== observationId));

      console.log(`Observation ${observationId} deleted successfully`);
    } catch (error) {
      console.error('Error deleting observation:', error);
      alert('Error deleting observation. Please try again.');
    }
  }, [supabase]);

  const handleDownloadPDF = useCallback(async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Header section with professional styling
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('INSPECTION REPORT', margin, yPosition);
      yPosition += 10;
      
      // Project details
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Site Inspection Documentation', margin, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const dateText = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      pdf.text(`Date: ${dateText}`, margin, yPosition);
      yPosition += 6;
      
      pdf.text(`Total Observations: ${observations.length}`, margin, yPosition);
      yPosition += 6;
      
      // Add a separator line
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 15;


      // Add plan overview if there are observations with meaningful anchors (not 0,0)
      const observationsWithAnchors = observations.filter(obs => 
        (obs.plan_anchor && 
         typeof obs.plan_anchor === 'object' && 
         'x' in obs.plan_anchor && 
         'y' in obs.plan_anchor &&
         !(Number(obs.plan_anchor.x) === 0 && Number(obs.plan_anchor.y) === 0)) ||
        (obs.anchor_x !== null && obs.anchor_y !== null &&
         !(obs.anchor_x === 0 && obs.anchor_y === 0))
      );

      if (observationsWithAnchors.length > 0) {
        // Group by plan
        const planGroups = new Map<string, Array<{x: number, y: number, index: number}>>();
        let globalIndex = 0;
        
        observationsWithAnchors.forEach((obs) => {
          let obsPlan = obs.plan || 'plan1';
          
          // Check if plan looks like a UUID - skip these plans
          if (obsPlan.includes('-') && obsPlan.length > 30) {
            console.log('Plan appears to be a UUID:', obsPlan, 'skipping plan display');
            return; // Skip this observation for plan overview
          } else {
            obsPlan = obsPlan.replace(/[^a-zA-Z0-9]/g, '');
          }
          
          let anchor = null;
          
          if (obs.plan_anchor && typeof obs.plan_anchor === 'object' && 'x' in obs.plan_anchor && 'y' in obs.plan_anchor &&
              !(Number(obs.plan_anchor.x) === 0 && Number(obs.plan_anchor.y) === 0)) {
            anchor = { x: Number(obs.plan_anchor.x), y: Number(obs.plan_anchor.y) };
          } else if (obs.anchor_x !== null && obs.anchor_y !== null && !(obs.anchor_x === 0 && obs.anchor_y === 0)) {
            anchor = { x: obs.anchor_x, y: obs.anchor_y };
          }
          
          if (anchor) {
            if (!planGroups.has(obsPlan)) {
              planGroups.set(obsPlan, []);
            }
            globalIndex++;
            planGroups.get(obsPlan)!.push({ ...anchor, index: globalIndex });
          }
        });

        // Add plan overview section
        if (planGroups.size > 0) {
          pdf.setFontSize(18);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Plan Overview', margin, yPosition);
          yPosition += 15;

          for (const [planName, anchors] of planGroups) {
            console.log(`Processing plan: ${planName} with ${anchors.length} anchors`);
            
            // Check if we need a new page
            if (yPosition > pageHeight - 80) {
              pdf.addPage();
              yPosition = margin;
            }

            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`${planName} (${anchors.length} anchor${anchors.length !== 1 ? 's' : ''})`, margin, yPosition);
            yPosition += 10;

            // Add plan image
            try {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              canvas.width = 320;
              canvas.height = 280;
              
              const img = new window.Image();
              img.crossOrigin = 'anonymous';
              await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = (error) => {
                  console.error(`Failed to load plan image: /plans/${planName}.png`, error);
                  reject(error);
                };
                img.src = `/plans/${planName}.png`;
              });

              // Clear canvas with white background and use object-contain behavior
              if (ctx) {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, 320, 280);
                
                // Calculate aspect ratios for object-contain behavior
                const imgAspect = img.width / img.height;
                const canvasAspect = 320 / 280;
                
                let drawWidth, drawHeight, offsetX, offsetY;
                
                if (imgAspect > canvasAspect) {
                  drawWidth = 320;
                  drawHeight = 320 / imgAspect;
                  offsetX = 0;
                  offsetY = (280 - drawHeight) / 2;
                } else {
                  drawHeight = 280;
                  drawWidth = 280 * imgAspect;
                  offsetX = (320 - drawWidth) / 2;
                  offsetY = 0;
                }
                
                // Draw the plan image with object-contain behavior
                ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
                
                // Draw anchors on the canvas
                anchors.forEach((anchor) => {
                  const x = anchor.x * 320;
                  const y = anchor.y * 280;
                  
                  // Draw black circle with white border
                  ctx.beginPath();
                  ctx.arc(x, y, 8, 0, 2 * Math.PI);
                  ctx.fillStyle = 'black';
                  ctx.fill();
                  ctx.strokeStyle = 'white';
                  ctx.lineWidth = 2;
                  ctx.stroke();
                  
                  // Draw white number
                  ctx.fillStyle = 'white';
                  ctx.font = 'bold 10px Arial';
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillText(anchor.index.toString(), x, y);
                });
              }
              
              const planImageData = canvas.toDataURL('image/jpeg', 0.8);
              const planWidth = 130;
              const planHeight = 100; // Increased height for better visibility
              
              // Check if image fits on current page
              if (yPosition + planHeight > pageHeight - margin) {
                pdf.addPage();
                yPosition = margin;
              }
              
              pdf.addImage(planImageData, 'JPEG', margin, yPosition, planWidth, planHeight);
              yPosition += planHeight + 15;
            } catch (error) {
              console.error('Error adding plan to PDF:', error);
              yPosition += 10;
            }
          }
          
          yPosition += 10; // Extra space after plans
        }
      }

      // Process each observation with professional numbering
      for (let i = 0; i < observations.length; i++) {
        const observation = observations[i];
        const observationNumber = i + 1;
        
        // Check if we need a new page (reserve more space for content)
        if (yPosition > pageHeight - 120) {
          pdf.addPage();
          yPosition = margin;
          
          // Add page header for continuation
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Inspection Report (continued) - Page ${pdf.internal.getNumberOfPages()}`, margin, yPosition);
          yPosition += 15;
        }

        // Create a simple table-like layout with photo on left, text on right
        if (displaySettings.photo && observation.signedUrl) {
          try {
            // Load and process the image
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = observation.signedUrl!;
            });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            
            const imgData = canvas.toDataURL('image/jpeg', 0.7);
            
            // Image dimensions and positioning
            const imgWidth = 60;
            const imgHeight = (img.height / img.width) * imgWidth;
            const textStartX = margin + imgWidth + 10; // Text starts after image + gap
            const textWidth = pageWidth - textStartX - margin;
            
            // Check if this observation fits on current page
            const estimatedHeight = Math.max(imgHeight, 40); // Minimum height for text
            if (yPosition + estimatedHeight > pageHeight - margin) {
              pdf.addPage();
              yPosition = margin;
            }
            
            // Draw border around the entire row
            pdf.setDrawColor(200, 200, 200);
            pdf.setLineWidth(0.5);
            const rowHeight = Math.max(imgHeight + 10, 50);
            pdf.rect(margin, yPosition, pageWidth - 2 * margin, rowHeight);
            
            // Add the image
            pdf.addImage(imgData, 'JPEG', margin + 5, yPosition + 5, imgWidth, imgHeight);
            
            // Add text content in the right column
            let textY = yPosition + 10;
            
            // Add observation number and category
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`${observationNumber}`, margin + 5, yPosition - 3);
            
            // Add category/type if available from labels
            const category = observation.labels && observation.labels.length > 0 ? observation.labels[0] : 'Observation';
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`Kategorie: ${category}`, textStartX, textY);
            textY += 7;
            
            // Add timestamp
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            const timestamp = new Date(observation.photo_date || observation.created_at).toLocaleDateString('de-DE') + ' ' + 
                             new Date(observation.photo_date || observation.created_at).toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'});
            pdf.text(`Foto 1 von 1`, textStartX, textY);
            textY += 5;
            pdf.text(timestamp, textStartX, textY);
            textY += 10;
            
            // Add note
            if (displaySettings.note && observation.note) {
              pdf.setFontSize(11);
              pdf.setFont('helvetica', 'bold');
              const noteLines = pdf.splitTextToSize(observation.note, textWidth);
              pdf.text(noteLines, textStartX, textY);
              textY += noteLines.length * 6 + 5;
            }
            
            // Add labels
            if (displaySettings.labels && observation.labels && observation.labels.length > 0) {
              pdf.setFontSize(10);
              pdf.setFont('helvetica', 'normal');
              const labelText = 'Labels: ' + observation.labels.join(', ');
              const labelLines = pdf.splitTextToSize(labelText, textWidth);
              pdf.text(labelLines, textStartX, textY);
              textY += labelLines.length * 5 + 3;
            }
            
            // Add GPS coordinates
            if (displaySettings.gps && observation.gps_lat && observation.gps_lng) {
              pdf.setFontSize(10);
              pdf.setFont('helvetica', 'normal');
              const gpsText = `GPS: ${observation.gps_lat.toFixed(6)}, ${observation.gps_lng.toFixed(6)}`;
              pdf.text(gpsText, textStartX, textY);
              textY += 5;
            }
            
            yPosition += rowHeight + 10; // Move to next row with spacing
            
          } catch (error) {
            console.error('Error adding observation to PDF:', error);
            // Fallback: just add text without image
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            if (observation.note) {
              const noteLines = pdf.splitTextToSize(observation.note, pageWidth - 2 * margin);
              pdf.text(noteLines, margin, yPosition);
              yPosition += noteLines.length * 6 + 10;
            }
          }
        } else {
          // No photo: just add text content
          if (displaySettings.note && observation.note) {
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            const noteLines = pdf.splitTextToSize(observation.note, pageWidth - 2 * margin);
            pdf.text(noteLines, margin, yPosition);
            yPosition += noteLines.length * 6 + 5;
          }
          
          if (displaySettings.labels && observation.labels && observation.labels.length > 0) {
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.text('Labels: ' + observation.labels.join(', '), margin, yPosition);
            yPosition += 8;
          }
          
          if (displaySettings.gps && observation.gps_lat && observation.gps_lng) {
            pdf.setFontSize(10);
            pdf.text(`GPS: ${observation.gps_lat.toFixed(6)}, ${observation.gps_lng.toFixed(6)}`, margin, yPosition);
            yPosition += 8;
          }
          
          yPosition += 15; // Space between observations
        }
      }

      // Add footer to all pages
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        
        // Footer line
        pdf.setLineWidth(0.5);
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
        
        // Footer text
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Site Inspection Report', margin, pageHeight - 12);
        pdf.text(`${i}/${totalPages}`, pageWidth - margin - 10, pageHeight - 12);
      }

      // Save the PDF
      pdf.save(`inspection-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  }, [observations, t, language, displaySettings]);

  const handleDownloadWord = useCallback(async () => {
    try {
      
      const children = [];

      // Add title
      children.push(
        new Paragraph({
          children: [new TextRun({ text: t('report'), size: 32, font: 'Arial' })],
          // alignment: AlignmentType.CENTER,
          // spacing: { after: 300 }
        })
      );

      // Add date
      children.push(
        new Paragraph({
          children: [new TextRun({ text: new Date().toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US'), size: 20, font: 'Arial' })],
          // alignment: AlignmentType.CENTER,
        })
      );

      // Add spacing after date (3 empty lines)
      children.push(
        new Paragraph({
          children: [new TextRun({ text: '' })],
        })
      );
      children.push(
        new Paragraph({
          children: [new TextRun({ text: '' })],
        })
      );
      children.push(
        new Paragraph({
          children: [new TextRun({ text: '' })],
        })
      );

      // // Add plan overview if there are observations with meaningful anchors (not 0,0)
      // const observationsWithAnchors = observations.filter(obs => 
      //   (obs.plan_anchor && 
      //    typeof obs.plan_anchor === 'object' && 
      //    'x' in obs.plan_anchor && 
      //    'y' in obs.plan_anchor &&
      //    !(Number(obs.plan_anchor.x) === 0 && Number(obs.plan_anchor.y) === 0)) ||
      //   (obs.anchor_x !== null && obs.anchor_y !== null &&
      //    !(obs.anchor_x === 0 && obs.anchor_y === 0))
      // );

      // if (observationsWithAnchors.length > 0) {
      //   // Group by plan
      //   const planGroups = new Map<string, Array<{x: number, y: number, index: number}>>();
      //   let globalIndex = 0;
        
      //   observationsWithAnchors.forEach((obs) => {
      //     const obsPlan = obs.plan || 'plan1';
      //     let anchor = null;
          
      //     if (obs.plan_anchor && typeof obs.plan_anchor === 'object' && 'x' in obs.plan_anchor && 'y' in obs.plan_anchor &&
      //         !(Number(obs.plan_anchor.x) === 0 && Number(obs.plan_anchor.y) === 0)) {
      //       anchor = { x: Number(obs.plan_anchor.x), y: Number(obs.plan_anchor.y) };
      //     } else if (obs.anchor_x !== null && obs.anchor_y !== null && !(obs.anchor_x === 0 && obs.anchor_y === 0)) {
      //       anchor = { x: obs.anchor_x, y: obs.anchor_y };
      //     }
          
      //     if (anchor) {
      //       if (!planGroups.has(obsPlan)) {
      //         planGroups.set(obsPlan, []);
      //       }
      //       globalIndex++;
      //       planGroups.get(obsPlan)!.push({ ...anchor, index: globalIndex });
      //     }
      //   });

      //   // Add plan overview section
      //   if (planGroups.size > 0) {
      //     children.push(
      //       new Paragraph({
      //         children: [new TextRun({ text: 'Plan Overview',  size: 20 })],
  
      //         spacing: { before: 200 }
      //       })
      //     );

      //     for (const [planName, anchors] of planGroups) {
      //       // Add plan title
      //       children.push(
      //         new Paragraph({
      //           children: [new TextRun({ text: `${planName} (${anchors.length} anchor${anchors.length !== 1 ? 's' : ''})`,  size: 20 })],
      //           // heading: HeadingLevel.HEADING_2,
      //           // spacing: { before: 100, after: 100 }
      //         })
      //       );

      //       // Add plan image with anchors
      //       try {
      //         const canvas = document.createElement('canvas');
      //         const ctx = canvas.getContext('2d');
      //         canvas.width = 320;
      //         canvas.height = 220;
              
      //         const img = new window.Image();
      //         img.crossOrigin = 'anonymous';
      //         await new Promise((resolve, reject) => {
      //           img.onload = resolve;
      //           img.onerror = reject;
      //           img.src = `/plans/${planName}.png`;
      //         });

      //         // Clear canvas with white background and use object-contain behavior
      //         if (ctx) {
      //           ctx.fillStyle = 'white';
      //           ctx.fillRect(0, 0, 320, 280);
                
      //           // Calculate aspect ratios for object-contain behavior
      //           const imgAspect = img.width / img.height;
      //           const canvasAspect = 320 / 280;
                
      //           let drawWidth, drawHeight, offsetX, offsetY;
                
      //           if (imgAspect > canvasAspect) {
      //             drawWidth = 320;
      //             drawHeight = 320 / imgAspect;
      //             offsetX = 0;
      //             offsetY = (280 - drawHeight) / 2;
      //           } else {
      //             drawHeight = 280;
      //             drawWidth = 280 * imgAspect;
      //             offsetX = (320 - drawWidth) / 2;
      //             offsetY = 0;
      //           }
                
      //           // Draw the plan image with object-contain behavior
      //           ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
                
      //           // Draw anchors on the canvas
      //           anchors.forEach((anchor) => {
      //             const x = anchor.x * 320;
      //             const y = anchor.y * 280;
                  
      //             // Draw black circle with white border
      //             ctx.beginPath();
      //             ctx.arc(x, y, 8, 0, 2 * Math.PI);
      //             ctx.fillStyle = 'black';
      //             ctx.fill();
      //             ctx.strokeStyle = 'white';
      //             ctx.lineWidth = 2;
      //             ctx.stroke();
                  
      //             // Draw white number
      //             ctx.fillStyle = 'white';
      //             ctx.font = 'bold 10px Arial';
      //             ctx.textAlign = 'center';
      //             ctx.textBaseline = 'middle';
      //             ctx.fillText(anchor.index.toString(), x, y);
      //           });
      //         }
              
      //         // Convert canvas to blob and add to document
      //         const planImageBlob = await new Promise<Blob>((resolve) => {
      //           canvas.toBlob((blob) => resolve(blob!), 'image/png');
      //         });
              
      //         const arrayBuffer = await planImageBlob.arrayBuffer();
              
      //         children.push(
      //           new Paragraph({
      //             children: [
      //               new ImageRun({
      //                 data: arrayBuffer,
      //                 transformation: {
      //                   width: 320*1.5, // Match the original canvas width
      //                   height: 220*1.5  // Reduced height for better document layout
      //                 },
      //                 type: 'png'
      //               })
      //             ],
      //             // spacing: { after: 100 }
      //           })
      //         );
      //       } catch (error) {
      //         console.error('Error adding plan to Word doc:', error);
      //         children.push(
      //           new Paragraph({
      //             children: [new TextRun({ text: `[Plan ${planName} could not be loaded]`, size: 16, italics: true })],
      //             // spacing: { after: 100 }
      //           })
      //         );
      //       }
      //     }
      //   }
      // }

      // Process each observation
      for (let i = 0; i < observations.length; i++) {
        const observation = observations[i];
        

        // // Observation heading
        // children.push(
        //   new Paragraph({
        //     children: [new TextRun({ text: `Observation ${i + 1}`, size: 20 })],
        //     // heading: HeadingLevel.HEADING_2,
        //     // spacing: { before: 100, after: 100 }
        //   })
        // );

        // Create content for text column
        const textContent = [];
        
        // Add note (if enabled)
        if (displaySettings.note && observation.note) {
          textContent.push(
            new Paragraph({
              children: [new TextRun({ text: observation.note, size: 20, font: 'Arial' })],
              // spacing: { after: 100 }
            })
          );
        }

        // Add labels (if enabled)
        if (displaySettings.labels && observation.labels && observation.labels.length > 0) {
          textContent.push(
            new Paragraph({
              children: [new TextRun({ text: 'Labels: ' + observation.labels.join(', '), size: 20, font: 'Arial' })],
              // spacing: { after: 100 }
            })
          );
        }


        // Add GPS coordinates (if enabled)
        if (displaySettings.gps && observation.gps_lat && observation.gps_lng) {
          textContent.push(
            new Paragraph({
              children: [new TextRun({ text: `GPS: ${observation.gps_lat.toFixed(6)}, ${observation.gps_lng.toFixed(6)}`, size: 20, font: 'Arial' })],
              // spacing: { after: 100 }
            })
          );
        }



        // Create layout based on whether photo is enabled and available
        if (displaySettings.photo && observation.signedUrl) {
          try {
            console.log('Fetching image from:', observation.signedUrl);
            
            // Create an image element to get dimensions
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            
            // Load the image to get its natural dimensions
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = observation.signedUrl!;
            });
            
            console.log('Image dimensions:', { width: img.width, height: img.height });
            
            // Fetch the image data
            const response = await fetch(observation.signedUrl, {
              method: 'GET',
              mode: 'cors',
              headers: {
                'Accept': 'image/*'
              }
            });
            
            if (!response.ok) {
              throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            console.log('Image buffer size:', arrayBuffer.byteLength);
            
            if (arrayBuffer.byteLength > 0) {
              // Calculate dynamic dimensions maintaining aspect ratio (smaller for table layout)
              const maxWidth = 250; // Smaller max width for table cell
              const maxHeight = 200; // Smaller max height for table cell
              
              let targetWidth = img.width;
              let targetHeight = img.height;
              
              // Scale down if image is too large
              if (targetWidth > maxWidth || targetHeight > maxHeight) {
                const widthRatio = maxWidth / targetWidth;
                const heightRatio = maxHeight / targetHeight;
                const scale = Math.min(widthRatio, heightRatio);
                
                targetWidth = Math.round(targetWidth * scale);
                targetHeight = Math.round(targetHeight * scale);
              }
              
              console.log('Calculated dimensions for Word doc:', { width: targetWidth, height: targetHeight });
              
              // Create table with image and text side by side
              const observationTable = new Table({
                width: {
                  size: 100,
                  type: WidthType.PERCENTAGE,
                },
                columnWidths: [3000, 6000], // Fixed widths in twentieths of a point (3000/20 = 150pt, 6000/20 = 300pt)
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [
                          new Paragraph({
                            children: [
                              new ImageRun({
                                data: arrayBuffer,
                                transformation: {
                                  width: targetWidth,
                                  height: targetHeight
                                },
                                type: 'png'
                              })
                            ]
                          })
                        ],
                        verticalAlign: VerticalAlign.TOP,
                        width: {
                          size: 3000,
                          type: WidthType.DXA,
                        },
                        margins: {
                          top: 100,
                          bottom: 100,
                          left: 100,
                          right: 200,
                        },
                      }),
                      new TableCell({
                        children: textContent.length > 0 ? textContent : [
                          new Paragraph({
                            children: [new TextRun({ text: 'No additional information', size: 20, italics: true, font: 'Arial' })],
                          })
                        ],
                        verticalAlign: VerticalAlign.TOP,
                        width: {
                          size: 6000,
                          type: WidthType.DXA,
                        },
                        margins: {
                          top: 100,
                          bottom: 100,
                          left: 200,
                          right: 100,
                        },
                      }),
                    ],
                  }),
                ],
              });
              
              children.push(observationTable);
              
            } else {
              console.warn('Empty image buffer for observation:', observation.id);
              // Add only text content if no image
              children.push(...textContent);
            }
          } catch (imageError) {
            console.error('Error adding image to Word doc:', imageError);
            // Add only text content if image fails
            children.push(...textContent);
          }
        } else if (textContent.length > 0) {
          // No image, but we have text content - add it directly
          children.push(...textContent);
        }
        // If no image and no text content, skip this observation entirely

        // Add spacing between observations
        children.push(
          new Paragraph({
            children: [new TextRun({ text: '', size: 20 })],
            spacing: { after: 200 }
          })
        );
      }

      const doc = new Document({
        sections: [{
          properties: {},
          children: children
        }]
      });

      const buffer = await Packer.toBuffer(doc);
      // Convert Buffer to Uint8Array for Blob compatibility
      const uint8Array = new Uint8Array(buffer);
      saveAs(new Blob([uint8Array.buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), `report-${new Date().toISOString().split('T')[0]}.docx`);
    } catch (error) {
      console.error('Error generating Word document:', error);
      alert('Error generating Word document. Please try again.');
    }
  }, [observations, t, language, displaySettings]);

  const handleSaveReport = useCallback(async () => {
    if (!reportTitle.trim()) {
      alert('Please enter a title for the report');
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to save reports');
        return;
      }

      // Create the report
      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .insert({
          user_id: user.id,
          title: reportTitle,
          description: reportDescription || null,
          settings: {
            displaySettings,
            language,
            selectedIds: memoizedSelectedIds
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
      const reportObservations = observations.map(obs => ({
        report_id: reportData.id,
        observation_id: obs.id
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
      
      // Redirect to reports page
      window.location.href = '/reports';
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Error saving report. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [reportTitle, reportDescription, displaySettings, language, memoizedSelectedIds, observations, supabase]);

  // Helper function to get anchor point (same as PlanDisplayWidget)
  const getAnchorPoint = (item: ObservationWithUrl) => {
    if (item.plan_anchor && 
        typeof item.plan_anchor === 'object' && 
        item.plan_anchor.x !== null && 
        item.plan_anchor.x !== undefined && 
        item.plan_anchor.y !== null && 
        item.plan_anchor.y !== undefined &&
        !(item.plan_anchor.x === 0 && item.plan_anchor.y === 0)) {
      return { x: item.plan_anchor.x, y: item.plan_anchor.y };
    }
    
    if (item.anchor_x !== null && 
        item.anchor_x !== undefined && 
        item.anchor_y !== null && 
        item.anchor_y !== undefined &&
        !(item.anchor_x === 0 && item.anchor_y === 0)) {
      return { x: item.anchor_x, y: item.anchor_y };
    }
    
    return null;
  };

  // Create the same anchor data structure as PlanDisplayWidget
  const anchorData = useMemo(() => {
    const planMap = new Map<string, Array<{ observationId: string; index: number }>>();
    let globalIndex = 0;
    
    observations.forEach((obs) => {
      const anchor = getAnchorPoint(obs);
      const obsPlan = obs.plan || 'plan1';
      
      if (anchor && obsPlan) {
        if (!planMap.has(obsPlan)) {
          planMap.set(obsPlan, []);
        }
        globalIndex++;
        planMap.get(obsPlan)!.push({
          observationId: obs.id,
          index: globalIndex
        });
      }
    });
    
    // Create a flat map of observation ID to index
    const anchorIndexMap = new Map<string, number>();
    planMap.forEach((anchors) => {
      anchors.forEach(({ observationId, index }) => {
        anchorIndexMap.set(observationId, index);
      });
    });
    
    return {
      hasAnchors: anchorIndexMap.size > 0,
      anchorIndexMap
    };
  }, [observations]);

  const fetchFromSavedReport = useCallback(async (reportId: string) => {
    try {
      // First, get the observation IDs for this report
      const { data: reportObsData, error: reportObsError } = await supabase
        .from('report_observations')
        .select('observation_id')
        .eq('report_id', reportId);

      if (reportObsError) {
        console.error('Error fetching report observations:', reportObsError);
        setError(`Error loading report: ${reportObsError.message}`);
        return [];
      }

      if (!reportObsData || reportObsData.length === 0) {
        setError("No observations found in this report.");
        return [];
      }

      // Extract observation IDs
      const observationIds = reportObsData.map(item => item.observation_id);

      // Fetch the actual observations
      const { data: obsData, error: obsError } = await supabase
        .from("observations")
        .select("*")
        .in("id", observationIds)
        .order("created_at", { ascending: false });

      if (obsError) {
        console.error("Error fetching observations:", obsError);
        setError(`Error loading observations: ${obsError.message}`);
        return [];
      }

      return (obsData ?? []) as Observation[];
    } catch (e) {
      console.error("Error in fetchFromSavedReport:", e);
      setError("An unexpected error occurred while loading the report.");
      return [];
    }
  }, [supabase]);

  const fetchSelectedObservations = useCallback(async () => {
    let baseObservations: Observation[] = [];

    // Check if we're loading from a saved report
    if (reportId) {
      baseObservations = await fetchFromSavedReport(reportId);
    } else if (memoizedSelectedIds && memoizedSelectedIds.length > 0) {
      // Fetch the selected observations directly
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
      baseObservations = (obsData ?? []) as Observation[];
    } else {
      setError("No observations selected. Please go back and select some observations first.");
      setIsLoading(false);
      setIsInitialized(true);
      return;
    }

    if (baseObservations.length === 0) {
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

      // Create signed URLs for each photo
      const withUrls: ObservationWithUrl[] = await Promise.all(
        baseObservations.map(async (o) => {
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
  }, [memoizedSelectedIds, supabase, isInitialized, reportId, fetchFromSavedReport]);

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
                {/* Display Toggles */}
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    { key: 'photo', label: 'Photo' },
                    { key: 'note', label: 'Note' },
                    { key: 'labels', label: 'Labels' },
                    { key: 'gps', label: 'GPS' }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={displaySettings[key as keyof typeof displaySettings]}
                        onChange={(e) => setDisplaySettings(prev => ({
                          ...prev,
                          [key]: e.target.checked
                        }))}
                        className="w-3 h-3 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
                
                {/* Language Selector */}
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">EN</option>
                  <option value="de">DE</option>
                </select>
                
                {/* Action Buttons - Disabled during loading */}
                <div className="flex flex-col gap-2">
                  <Button
                    disabled
                    variant="outline"
                    className="opacity-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button
                    disabled
                    variant="outline"
                    className="opacity-50"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Word
                  </Button>
                </div>
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
              
              {/* Action Buttons - Disabled during error */}
              <div className="flex flex-col gap-2">
                <Button
                  disabled
                  variant="outline"
                  className="opacity-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button
                  disabled
                  variant="outline"
                  className="opacity-50"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Word
                </Button>
              </div>
            </div>
            <h1 className="text-3xl font-bold">{t('report')}</h1>
            <p className="text-muted-foreground">
              {t('errorLoadingReport')}
            </p>
          </div>
          
          <div className="text-center py-20">
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
      <style jsx>{`
        .observation {
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .photo {
          width: 100%;
          height: 200px;
          object-fit: cover;
        }
        .no-photo {
          width: 100%;
          height: 200px;
          background: #f5f5f5;
          border: 2px dashed #ddd;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .no-photo-text {
          color: #999;
          font-size: 14px;
        }
        .note {
          padding: 15px;
          font-size: 14px;
          color: #333;
          line-height: 1.4;
        }
      `}</style>
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
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => setShowSaveDialog(true)}
                className="transition-all"
                variant="default"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Report
              </Button>
              <Button
                onClick={handleDownloadPDF}
                className="transition-all"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button
                onClick={handleDownloadWord}
                className="transition-all"
                variant="outline"
              >
                <FileText className="h-4 w-4 mr-2" />
                Word
              </Button>
            </div>
          </div>
          <h1 className="text-3xl font-bold">INSPECTION REPORT</h1>
          <h2 className="text-xl font-semibold text-gray-700 mt-2">Site Inspection Documentation</h2>
          <div className="mt-4 space-y-1 text-sm text-gray-600">
            <p>Date: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: '2-digit', 
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
            <p>Total Observations: {observations.length}</p>
          </div>
          
          {/* Display Toggles */}
          <div className="flex flex-wrap gap-3 mt-4 mb-2">
            {[
              { key: 'photo', label: 'Photo' },
              { key: 'note', label: 'Note' },
              { key: 'labels', label: 'Labels' },
              { key: 'gps', label: 'GPS' }
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-1 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={displaySettings[key as keyof typeof displaySettings]}
                  onChange={(e) => setDisplaySettings(prev => ({
                    ...prev,
                    [key]: e.target.checked
                  }))}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Plan Display Widget - Show if any observations have anchors */}
        {anchorData.hasAnchors && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Plan Overview</h2>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <PlanDisplayWidget
                observations={observations}
                plan="plan1"
              />
            </div>
          </div>
        )}

        {/* Photos in a row */}
        {observations.length > 0 ? (
          <div key="observations-content" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {observations.map((observation) => {
                const anchorNumber = anchorData.anchorIndexMap.get(observation.id);
                return (
                  <div key={observation.id} className="observation relative">
                    {/* Anchor number indicator */}
                    {anchorNumber && (
                      <div className="absolute top-2 left-2 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold z-10 shadow-md">
                        {anchorNumber}
                      </div>
                    )}
                    {displaySettings.photo && (
                      <div className="relative group/photo">
                        {observation.signedUrl ? (
                          <Image
                            src={observation.signedUrl}
                            alt={`Photo for ${observation.plan ?? "observation"}`}
                            width={400}
                            height={200}
                            className="photo"
                            style={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="no-photo">
                            <span className="no-photo-text">No photo available</span>
                          </div>
                        )}
                        
                        {/* Delete button positioned over photo */}
                        <button
                          onClick={(e) => handleDeleteObservation(observation.id, e)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg"
                          title="Delete observation"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    
                    {/* Display observation details */}
                    <div className="p-4 space-y-2">
                      {displaySettings.note && (
                        <div className="relative group">
                          {editingNoteId === observation.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={editNoteValue}
                                onChange={(e) => setEditNoteValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                    e.preventDefault();
                                    handleSaveNote(observation.id);
                                  }
                                  if (e.key === 'Escape') {
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
                                    onClick={() => handleSaveNote(observation.id)}
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
                            <div className="flex items-start justify-between gap-2">
                              <div className="note flex-1">{observation.note || t('noDescription')}</div>
                              <button
                                onClick={() => handleEditNote(observation.id, observation.note || '')}
                                className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 text-gray-500 hover:text-blue-600 transition-all"
                                title="Edit note"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {displaySettings.labels && observation.labels && observation.labels.length > 0 && (
                        <div className="flex flex-wrap gap-2">
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
                              <span key={idx} className="inline-block px-2 py-1 text-xs bg-gray-100 border border-gray-300 text-gray-700 rounded">
                                {processedLabel}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      
                      
                      {displaySettings.gps && observation.gps_lat && observation.gps_lng && (
                        <div className="text-sm text-gray-600">
                          <strong>GPS:</strong> {observation.gps_lat.toFixed(6)}, {observation.gps_lng.toFixed(6)}
                        </div>
                      )}
                      
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No observations found.</p>
          </div>
        )}
      </div>
      
      {/* Save Report Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center">
        <div className="w-full max-w-7xl p-5">
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">Loading report...</p>
          </div>
        </div>
      </div>
    }>
      <ReportPageContent />
    </Suspense>
  );
}
