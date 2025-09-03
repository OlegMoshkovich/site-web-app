"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Printer, Download, FileText } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { translations, type Language } from "@/lib/translations";
import jsPDF from 'jspdf';
import { Document, Paragraph, ImageRun, TextRun, HeadingLevel, AlignmentType, Packer } from 'docx';
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
  const [language, setLanguage] = useState<Language>('en');
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
                 background: #ffffff; 
                 padding: 4px 8px; 
                 margin: 2px; 
                 font-size: 11px; 
                 color: #333; 
                 border: 1px solid #ccc;
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
              .label { display: inline-block; background: #ffffff; padding: 4px 8px; margin: 2px; font-size: 12px; color: #333; border: 1px solid #ccc; }
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
             <h1>${t('report')}</h1>
             <p>${new Date().toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US')}</p>
           </div>
          <div class="grid">
            ${observations.map((observation) => {
              const note = observation.note || t('noDescription');

              return `
                <div class="observation">
                  ${observation.signedUrl 
                    ? `<img src="${observation.signedUrl}" alt="Observation photo" class="photo" />`
                    : `<div class="no-photo"><span class="no-photo-text">${t('noPhotoAvailable')}</span></div>`
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
  }, [observations, t, language]);

  const handleDownloadPDF = useCallback(async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Add title
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text(t('report'), pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Add date
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const dateText = new Date().toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US');
      pdf.text(dateText, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;

      // Add plan overview if there are observations with anchors
      const observationsWithAnchors = observations.filter(obs => 
        (obs.plan_anchor && 
         typeof obs.plan_anchor === 'object' && 
         'x' in obs.plan_anchor && 
         'y' in obs.plan_anchor) ||
        (obs.anchor_x !== null && obs.anchor_y !== null)
      );

      if (observationsWithAnchors.length > 0) {
        // Group by plan
        const planGroups = new Map<string, Array<{x: number, y: number, index: number}>>();
        let globalIndex = 0;
        
        observationsWithAnchors.forEach((obs) => {
          const obsPlan = obs.plan || 'plan1';
          let anchor = null;
          
          if (obs.plan_anchor && typeof obs.plan_anchor === 'object' && 'x' in obs.plan_anchor && 'y' in obs.plan_anchor) {
            anchor = { x: Number(obs.plan_anchor.x), y: Number(obs.plan_anchor.y) };
          } else if (obs.anchor_x !== null && obs.anchor_y !== null) {
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
              
              const img = new Image();
              img.crossOrigin = 'anonymous';
              await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
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

      // Process each observation
      for (let i = 0; i < observations.length; i++) {
        const observation = observations[i];
        
        // Check if we need a new page
        if (yPosition > pageHeight - 60) {
          pdf.addPage();
          yPosition = margin;
        }

        // Add observation number
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Observation ${i + 1}`, margin, yPosition);
        yPosition += 10;

        // Add note
        if (observation.note) {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          const noteLines = pdf.splitTextToSize(observation.note, pageWidth - 2 * margin);
          pdf.text(noteLines, margin, yPosition);
          yPosition += noteLines.length * 5 + 5;
        }

        // Add labels
        if (observation.labels && observation.labels.length > 0) {
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'italic');
          pdf.text('Labels: ' + observation.labels.join(', '), margin, yPosition);
          yPosition += 10;
        }

        // Add plan if available
        if (observation.plan) {
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          pdf.text('Plan: ' + observation.plan, margin, yPosition);
          yPosition += 8;
        }

        // Add GPS coordinates
        if (observation.gps_lat && observation.gps_lng) {
          pdf.setFontSize(9);
          pdf.text(`GPS: ${observation.gps_lat.toFixed(6)}, ${observation.gps_lng.toFixed(6)}`, margin, yPosition);
          yPosition += 8;
        }

        // Add plan anchor coordinates
        if (observation.plan_anchor && typeof observation.plan_anchor === 'object' && 'x' in observation.plan_anchor && 'y' in observation.plan_anchor) {
          pdf.setFontSize(9);
          pdf.text(`Plan Anchor: ${Number(observation.plan_anchor.x).toFixed(6)}, ${Number(observation.plan_anchor.y).toFixed(6)}`, margin, yPosition);
          yPosition += 8;
        }

        // Add photo if available
        if (observation.signedUrl) {
          try {
            const img = new Image();
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
            const imgWidth = 80;
            const imgHeight = (img.height / img.width) * imgWidth;
            
            // Check if image fits on current page
            if (yPosition + imgHeight > pageHeight - margin) {
              pdf.addPage();
              yPosition = margin;
            }
            
            pdf.addImage(imgData, 'JPEG', margin, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 10;
          } catch (error) {
            console.error('Error adding image to PDF:', error);
          }
        }

        yPosition += 10; // Space between observations
      }

      // Save the PDF
      pdf.save(`report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  }, [observations, t, language]);

  const handleDownloadWord = useCallback(async () => {
    try {
      const children = [];

      // Add title
      children.push(
        new Paragraph({
          children: [new TextRun({ text: t('report'), bold: true, size: 32 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        })
      );

      // Add date
      children.push(
        new Paragraph({
          children: [new TextRun({ text: new Date().toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US'), size: 20 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 }
        })
      );

      // Add plan overview if there are observations with anchors
      const observationsWithAnchors = observations.filter(obs => 
        (obs.plan_anchor && 
         typeof obs.plan_anchor === 'object' && 
         'x' in obs.plan_anchor && 
         'y' in obs.plan_anchor) ||
        (obs.anchor_x !== null && obs.anchor_y !== null)
      );

      if (observationsWithAnchors.length > 0) {
        // Group by plan
        const planGroups = new Map<string, Array<{x: number, y: number, index: number}>>();
        let globalIndex = 0;
        
        observationsWithAnchors.forEach((obs) => {
          const obsPlan = obs.plan || 'plan1';
          let anchor = null;
          
          if (obs.plan_anchor && typeof obs.plan_anchor === 'object' && 'x' in obs.plan_anchor && 'y' in obs.plan_anchor) {
            anchor = { x: Number(obs.plan_anchor.x), y: Number(obs.plan_anchor.y) };
          } else if (obs.anchor_x !== null && obs.anchor_y !== null) {
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
          children.push(
            new Paragraph({
              children: [new TextRun({ text: 'Plan Overview', bold: true, size: 28 })],
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 300 }
            })
          );

          for (const [planName, anchors] of planGroups) {
            // Add plan title
            children.push(
              new Paragraph({
                children: [new TextRun({ text: `${planName} (${anchors.length} anchor${anchors.length !== 1 ? 's' : ''})`, bold: true, size: 20 })],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 200 }
              })
            );

            // Add plan image with anchors
            try {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              canvas.width = 320;
              canvas.height = 280;
              
              const img = new Image();
              img.crossOrigin = 'anonymous';
              await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
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
              
              // Convert canvas to blob and add to document
              const planImageBlob = await new Promise<Blob>((resolve) => {
                canvas.toBlob((blob) => resolve(blob!), 'image/png');
              });
              
              const arrayBuffer = await planImageBlob.arrayBuffer();
              
              children.push(
                new Paragraph({
                  children: [
                    new ImageRun({
                      data: arrayBuffer,
                      transformation: {
                        width: 320, // Match the original canvas width
                        height: 220  // Reduced height for better document layout
                      },
                      type: 'png'
                    })
                  ],
                  spacing: { after: 400 }
                })
              );
            } catch (error) {
              console.error('Error adding plan to Word doc:', error);
              children.push(
                new Paragraph({
                  children: [new TextRun({ text: `[Plan ${planName} could not be loaded]`, size: 16, italics: true })],
                  spacing: { after: 200 }
                })
              );
            }
          }
        }
      }

      // Process each observation
      for (let i = 0; i < observations.length; i++) {
        const observation = observations[i];

        // Observation heading
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `Observation ${i + 1}`, bold: true, size: 24 })],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
          })
        );

        // Add photo first if available
        if (observation.signedUrl) {
          try {
            console.log('Fetching image from:', observation.signedUrl);
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
              children.push(
                new Paragraph({
                  children: [
                    new ImageRun({
                      data: arrayBuffer,
                      transformation: {
                        width: 400,
                        height: 300
                      },
                      type: 'png'
                    })
                  ],
                  spacing: { after: 200 }
                })
              );
            } else {
              console.warn('Empty image buffer for observation:', observation.id);
              // Add placeholder text instead of image
              children.push(
                new Paragraph({
                  children: [new TextRun({ text: '[Image not available]', size: 16, italics: true })],
                  spacing: { after: 200 }
                })
              );
            }
          } catch (imageError) {
            console.error('Error adding image to Word doc:', imageError);
            // Add placeholder text instead of breaking the entire document
            children.push(
              new Paragraph({
                children: [new TextRun({ text: '[Image could not be loaded]', size: 16, italics: true })],
                spacing: { after: 200 }
              })
            );
          }
        }

        // Add note
        if (observation.note) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: observation.note, size: 20 })],
              spacing: { after: 200 }
            })
          );
        }

        // Add labels
        if (observation.labels && observation.labels.length > 0) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: 'Labels: ' + observation.labels.join(', '), size: 18, italics: true })],
              spacing: { after: 150 }
            })
          );
        }

        // Add plan
        if (observation.plan) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: 'Plan: ' + observation.plan, size: 18 })],
              spacing: { after: 150 }
            })
          );
        }

        // Add GPS coordinates
        if (observation.gps_lat && observation.gps_lng) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `GPS: ${observation.gps_lat.toFixed(6)}, ${observation.gps_lng.toFixed(6)}`, size: 18 })],
              spacing: { after: 150 }
            })
          );
        }

        // Add plan anchor coordinates
        if (observation.plan_anchor && typeof observation.plan_anchor === 'object' && 'x' in observation.plan_anchor && 'y' in observation.plan_anchor) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `Plan Anchor: ${Number(observation.plan_anchor.x).toFixed(6)}, ${Number(observation.plan_anchor.y).toFixed(6)}`, size: 18 })],
              spacing: { after: 150 }
            })
          );
        }

        // Add spacing between observations
        children.push(
          new Paragraph({
            children: [new TextRun({ text: '', size: 20 })],
            spacing: { after: 400 }
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
  }, [observations, t, language]);

  // Helper function to get anchor point (same as PlanDisplayWidget)
  const getAnchorPoint = (item: any) => {
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
          <h1 className="text-3xl font-bold">Report</h1>
          <p className="text-muted-foreground">
            {observations.length} observation{observations.length !== 1 ? 's' : ''} selected
          </p>
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
