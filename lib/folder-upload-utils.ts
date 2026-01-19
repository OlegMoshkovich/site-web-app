// Utility functions for folder upload feature
import imageCompression from 'browser-image-compression';
import { createClient } from '@/lib/supabase/client';
import type {
  FileWithProgress,
  CompressionQuality,
  CompressionPreset,
  COMPRESSION_PRESETS,
  COMPRESSION_OPTIONS
} from '@/types/upload';

// Image MIME types we accept
const ACCEPTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp'
];

/**
 * Recursively extract all files from a dropped folder structure
 * Uses the FileSystem API (webkitGetAsEntry) to traverse directories
 */
export async function extractFilesFromFolder(
  dataTransfer: DataTransfer
): Promise<File[]> {
  const files: File[] = [];
  const items = Array.from(dataTransfer.items);

  // Process each dropped item
  for (const item of items) {
    if (item.kind === 'file') {
      const entry = item.webkitGetAsEntry?.();

      if (entry) {
        await traverseFileTree(entry, files);
      } else {
        // Fallback for browsers that don't support webkitGetAsEntry
        const file = item.getAsFile();
        if (file && validateImageFile(file)) {
          files.push(file);
        }
      }
    }
  }

  return files;
}

/**
 * Recursively traverse a file system entry
 */
async function traverseFileTree(
  entry: FileSystemEntry,
  files: File[]
): Promise<void> {
  if (entry.isFile) {
    const fileEntry = entry as FileSystemFileEntry;
    const file = await getFileFromEntry(fileEntry);
    if (file && validateImageFile(file)) {
      files.push(file);
    }
  } else if (entry.isDirectory) {
    const dirEntry = entry as FileSystemDirectoryEntry;
    const reader = dirEntry.createReader();
    const entries = await readAllEntries(reader);

    // Recursively process each entry in the directory
    for (const childEntry of entries) {
      await traverseFileTree(childEntry, files);
    }
  }
}

/**
 * Get a File object from a FileSystemFileEntry
 */
function getFileFromEntry(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => {
    entry.file(resolve, reject);
  });
}

/**
 * Read all entries from a directory reader
 * (may require multiple calls due to browser limitations)
 */
function readAllEntries(
  reader: FileSystemDirectoryReader
): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    const entries: FileSystemEntry[] = [];

    function readEntries() {
      reader.readEntries(
        (results) => {
          if (results.length === 0) {
            // Done reading
            resolve(entries);
          } else {
            entries.push(...results);
            // Continue reading (browser may return results in chunks)
            readEntries();
          }
        },
        reject
      );
    }

    readEntries();
  });
}

/**
 * Validate if a file is an accepted image type
 */
export function validateImageFile(file: File): boolean {
  return ACCEPTED_IMAGE_TYPES.includes(file.type.toLowerCase());
}

/**
 * Compress a single image file
 */
export async function compressImage(
  file: File,
  preset: CompressionPreset
): Promise<File> {
  console.log('compressImage called', { fileName: file.name, originalSize: file.size, preset });

  try {
    const options = {
      maxSizeMB: preset.maxSizeMB,
      maxWidthOrHeight: 4096, // Max dimension
      useWebWorker: true,
      preserveExif: true,
      initialQuality: preset.quality,
      fileType: 'image/jpeg' as const
    };

    console.log('Starting compression with options:', options);
    const compressedFile = await imageCompression(file, options);
    console.log('Compression complete', {
      originalSize: file.size,
      compressedSize: compressedFile.size,
      reduction: `${Math.round((1 - compressedFile.size / file.size) * 100)}%`
    });
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw new Error(`Failed to compress ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload a single file to Supabase storage
 */
export async function uploadFileToStorage(
  file: File,
  userId: string,
  retries = 2
): Promise<{ url: string; signedUrl: string; path: string }> {
  console.log('uploadFileToStorage called', { fileName: file.name, fileSize: file.size, userId });

  const supabase = createClient();

  // Generate unique filename
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 9);
  const extension = 'jpg'; // All images are compressed to JPEG
  const fileName = `photo_${timestamp}_${randomId}.${extension}`;
  const filePath = `${userId}/uploads/${fileName}`;

  console.log('Generated file path:', filePath);

  let lastError: Error | null = null;

  // Retry logic
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`Upload attempt ${attempt + 1}/${retries + 1}`);

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('photos')
        .upload(filePath, file, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) {
        console.error('Supabase storage upload error:', error);
        throw error;
      }

      console.log('Upload successful, data:', data);

      // Generate signed URL (1 year expiration)
      const { data: signedData, error: signedError } = await supabase.storage
        .from('photos')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365);

      if (signedError) throw signedError;

      const publicUrl = supabase.storage
        .from('photos')
        .getPublicUrl(filePath).data.publicUrl;

      return {
        url: publicUrl,
        signedUrl: signedData.signedUrl,
        path: filePath
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Upload failed');

      if (attempt < retries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Upload failed after retries');
}

/**
 * Create observation records in the database for uploaded files
 */
export async function createObservations(
  uploads: Array<{
    signedUrl: string;
    path: string;
    fileName: string;
  }>,
  userId: string,
  siteId: string | null
): Promise<void> {
  console.log('createObservations called', { uploadsCount: uploads.length, userId, siteId });

  const supabase = createClient();

  // Create minimal observation records - only include columns that definitely exist
  const observations = uploads.map(upload => ({
    user_id: userId,
    photo_url: upload.path,
    ...(siteId && { site_id: siteId }) // Only include site_id if it's provided
  }));

  console.log('Inserting observations:', observations);

  const { error } = await supabase
    .from('observations')
    .insert(observations);

  if (error) {
    console.error('Error creating observations:', error);
    throw new Error('Failed to create observations in database');
  }

  console.log('Observations created successfully');
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Calculate compression percentage
 */
export function calculateCompressionPercentage(
  originalSize: number,
  compressedSize: number
): number {
  if (originalSize === 0) return 0;
  return Math.round(((originalSize - compressedSize) / originalSize) * 100);
}

/**
 * Generate a unique ID for a file
 */
export function generateFileId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
