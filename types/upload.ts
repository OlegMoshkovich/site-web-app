// Type definitions for folder upload feature

export type CompressionQuality = 'low' | 'medium' | 'high';

export type UploadStatus = 'pending' | 'compressing' | 'uploading' | 'completed' | 'error';

export interface FileWithProgress {
  file: File;
  id: string; // Unique identifier for tracking
  originalSize: number;
  compressedSize?: number;
  compressedFile?: File;
  status: UploadStatus;
  error?: string;
  uploadedUrl?: string;
}

export interface CompressionPreset {
  quality: number;
  maxSizeMB: number;
  label: string;
  description: string;
}

export interface UploadSummary {
  total: number;
  success: number;
  failed: number;
  skipped: number;
}

export const COMPRESSION_PRESETS: Record<CompressionQuality, CompressionPreset> = {
  low: {
    quality: 0.6,
    maxSizeMB: 0.5,
    label: 'Low (60%)',
    description: 'Smallest file size'
  },
  medium: {
    quality: 0.8,
    maxSizeMB: 1,
    label: 'Medium (80%)',
    description: 'Balanced quality and size'
  },
  high: {
    quality: 0.9,
    maxSizeMB: 2,
    label: 'High (90%)',
    description: 'Best quality'
  }
};

export const COMPRESSION_OPTIONS = {
  useWebWorker: true,        // Non-blocking compression
  preserveExif: true,         // Keep photo metadata
  fileType: 'image/jpeg'      // Standardize format for consistency
};
