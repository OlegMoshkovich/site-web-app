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
    e.preventDefault();
    e.stopPropagation();

    setIsDragOver(false);
    setDragCounter(0);

    if (!e.dataTransfer) return;

    try {
      // Extract all files from the dropped items (including folders)
      const files = await extractFilesFromFolder(e.dataTransfer);

      // Filter for valid image files
      const imageFiles = files.filter(validateImageFile);

      if (imageFiles.length > 0) {
        onFilesDropped(imageFiles);
      } else {
        // Show alert if no valid images found
        alert('No valid image files found. Please drop folders or files containing PNG, JPG, JPEG, or WebP images.');
      }
    } catch (error) {
      console.error('Error processing dropped files:', error);
      alert('Error processing dropped files. Please try again.');
    }
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
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center"
      style={{ pointerEvents: 'none' }}
    >
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md mx-4 border-4 border-dashed border-blue-500">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <FolderUp className="h-16 w-16 text-blue-500" />
            <Upload className="h-8 w-8 text-blue-600 absolute -bottom-1 -right-1" />
          </div>
          <div className="text-center">
            <p className="text-xl font-semibold text-gray-900 mb-2">
              Drop folder to upload images
            </p>
            <p className="text-sm text-gray-600">
              All images in the folder will be extracted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
