import { Document, Paragraph, ImageRun, TextRun, Packer, AlignmentType } from 'docx';

interface ObservationForExport {
  id: string;
  note: string | null;
  labels: string[] | null;
  photo_date: string | null;
  created_at: string;
  taken_at: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  signedUrl?: string | null;
  sites?: { name: string; logo_url?: string | null } | null;
}

interface ReportData {
  title?: string | null;
  description?: string | null;
  ersteller?: string | null;
  baustelle?: string | null;
  created_at?: string;
}

interface DisplaySettings {
  photo: boolean;
  note: boolean;
  labels: boolean;
  gps: boolean;
}

export async function generateWordReport(
  observations: ObservationForExport[],
  reportData: ReportData | null,
  displaySettings: DisplaySettings
): Promise<Blob> {
  const children = [];
  
  // Add title
  children.push(
    new Paragraph({
      children: [new TextRun({ 
        text: reportData?.title || 'INSPECTION REPORT', 
        size: 24, 
        font: 'Arial',
        bold: true
      })],
      spacing: { after: 300 }
    })
  );
  children.push(new Paragraph({}));
  
  // Add description if available
  if (reportData?.description) {
    children.push(
      new Paragraph({
        children: [new TextRun({ 
          text: reportData.description, 
          size: 24, 
          font: 'Arial' 
        })],
        spacing: { after: 200 }
      })
    );
  }
  children.push(new Paragraph({}));
  
  // Add metadata
  children.push(
    new Paragraph({
      children: [new TextRun({ 
        text: `Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 
        size: 20, 
        font: 'Arial' 
      })],
      spacing: { after: 100 }
    })
  );
  
  if (reportData?.ersteller) {
    children.push(
      new Paragraph({
        children: [new TextRun({ 
          text: `Ersteller: ${reportData.ersteller}`, 
          size: 20, 
          font: 'Arial' 
        })],
        spacing: { after: 100 }
      })
    );
  }
  
  if (reportData?.baustelle) {
    children.push(
      new Paragraph({
        children: [new TextRun({ 
          text: `Baustelle: ${reportData.baustelle}`, 
          size: 20, 
          font: 'Arial' 
        })],
        spacing: { after: 100 }
      })
    );
  }
  
  children.push(new Paragraph({}));
  children.push(new Paragraph({}));
  children.push(new Paragraph({}));
  // Process each observation
  for (let i = 0; i < observations.length; i++) {
    const observation = observations[i];
    
    // Observation header
    children.push(
      new Paragraph({
        children: [new TextRun({ 
          text: `Beobachtung ${i + 1}`,
          size: 20,
          font: 'Arial',
        })],
        spacing: { before: 200, after: 200 }
      })
    );
    
    // Add note if enabled and available
    if (displaySettings.note && observation.note) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Beschreibung: ', font: 'Arial', size: 20, bold: true }),
            new TextRun({ text: observation.note, font: 'Arial', size: 20 })
          ],
          spacing: { after: 150 }
        })
      );
    }
    
    // Add labels if enabled and available
    if (displaySettings.labels && observation.labels && observation.labels.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Bereiche: ', font: 'Arial',  size: 20 }),
            new TextRun({ text: observation.labels.join(', '), font: 'Arial', size: 20 })
          ],
          spacing: { after: 150 }
        })
      );
    }
    
    // Add timestamp
    const timestamp = new Date(observation.taken_at || observation.photo_date || observation.created_at).toLocaleDateString('de-DE') + 
                     ' ' + new Date(observation.taken_at || observation.photo_date || observation.created_at).toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'});
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Aufgenommen am: ', font: 'Arial', size: 20 }),
          new TextRun({ text: timestamp, font: 'Arial', size: 20 })
        ],
        spacing: { after: 150 }
      })
    );
    
    
    // Add photo if enabled and available
    if (displaySettings.photo && observation.signedUrl) {
      try {
        // Load image and convert to base64
        const response = await fetch(observation.signedUrl);
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        children.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: uint8Array,
                transformation: {
                  width: 400,
                  height: 300,
                },
                type: 'jpg'
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 }
          })
        );
      } catch (error) {
        console.error('Error adding image to Word document:', error);
        // Add placeholder text if image fails to load
        children.push(
          new Paragraph({
            children: [new TextRun({ 
              text: '[Bild konnte nicht geladen werden]', 
              font: 'Arial', 
              size: 20,
              italics: true
            })],
            spacing: { after: 200 }
          })
        );
      }
    }
    
    // Add separator between observations (except for the last one)
    if (i < observations.length - 1) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: '', font: 'Arial' })],
          spacing: { after: 400 }
        })
      );
    }
  }
  
  // Create the document
  const doc = new Document({
    sections: [{
      properties: {},
      children: children,
    }],
  });
  
  // Generate and return the blob
  const buffer = await Packer.toBuffer(doc);
  return new Blob([new Uint8Array(buffer)], { 
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
  });
}

export function downloadWordDocument(blob: Blob, filename?: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `report-${new Date().toISOString().split('T')[0]}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}