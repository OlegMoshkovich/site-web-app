"use client";

import { useState, useCallback, useEffect } from 'react';
import { Upload, FolderUp } from 'lucide-react';
import { extractFilesFromFolder, validateImageFile } from '@/lib/folder-upload-utils';

interface FolderUploadDropZoneProps {
  onFilesDropped: (files: File[]) => void;
}

export function FolderUploadDropZone({ onFilesDropped }: FolderUploadDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setDragCounter(prev => prev + 1);
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setDragCounter(prev => {
      const newCounter = prev - 1;
      if (newCounter === 0) {
        setIsDragOver(false);
      }
      return newCounter;
    });
  }, []);

  const handleDrop = useCallback(async (e: DragEvent) => {
    console.log('\n\n========================================');
    console.log('=== DROP EVENT STARTED ===');
    console.log('========================================\n');
    e.preventDefault();
    e.stopPropagation();

    setIsDragOver(false);
    setDragCounter(0);

    if (!e.dataTransfer) {
      console.warn('No dataTransfer object in drop event');
      return;
    }

    console.log('DataTransfer details:', {
      itemsCount: e.dataTransfer.items?.length || 0,
      filesCount: e.dataTransfer.files?.length || 0,
      items: Array.from(e.dataTransfer.items || []).map((item, i) => ({
        index: i,
        kind: item.kind,
        type: item.type
      })),
      files: Array.from(e.dataTransfer.files || []).map((file, i) => ({
        index: i,
        name: file.name,
        type: file.type,
        size: file.size
      }))
    });

    try {
      // Extract all files from the dropped items (including folders)
      console.log('\nCalling extractFilesFromFolder with dataTransfer containing', e.dataTransfer.items?.length || 0, 'items...');
      const files = await extractFilesFromFolder(e.dataTransfer);
      console.log(`\nextractFilesFromFolder returned ${files.length} files`);
      console.log('Returned file names:', files.map((f, i) => `${i}: ${f.name}`));

      // Filter for valid image files
      console.log('\nFiltering for valid image files...');
      const imageFiles = files.filter(validateImageFile);
      console.log(`After validation: ${imageFiles.length} valid image files (out of ${files.length} total)`);
      console.log('Valid image file names:', imageFiles.map((f, i) => `${i}: ${f.name}`));

      if (imageFiles.length > 0) {
        console.log(`\nCalling onFilesDropped callback with ${imageFiles.length} files...`);
        console.log('Files being passed to callback:', imageFiles.map(f => f.name));
        onFilesDropped(imageFiles);
        console.log('onFilesDropped callback completed');
      } else {
        // Show alert if no valid images found
        console.warn('No valid image files found after filtering');
        alert('No valid image files found. Please drop folders or files containing PNG, JPG, JPEG, or WebP images.');
      }
    } catch (error) {
      console.error('Error processing dropped files:', error);
      alert('Error processing dropped files. Please try again.');
    }
    console.log('\n========================================');
    console.log('=== DROP EVENT COMPLETED ===');
    console.log('========================================\n\n');
  }, [onFilesDropped]);

  useEffect(() => {
    // Add event listeners to the document
    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);

    // Cleanup
    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('drop', handleDrop);
    };
  }, [handleDragEnter, handleDragOver, handleDragLeave, handleDrop]);

  if (!isDragOver) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      style={{ pointerEvents: 'none' }}
    >
      <div className="mx-4 max-w-md rounded-lg border-4 border-dashed border-primary bg-card p-8 text-card-foreground shadow-xl">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <FolderUp className="h-16 w-16 text-primary" />
            <Upload className="absolute -bottom-1 -right-1 h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <p className="mb-2 text-xl font-semibold text-foreground">
              Drop folder to upload images
            </p>
            <p className="text-sm text-muted-foreground">
              All images in the folder will be extracted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
