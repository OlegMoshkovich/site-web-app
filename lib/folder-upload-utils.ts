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
  console.log('=== extractFilesFromFolder: Starting extraction ===');
  const files: File[] = [];
  const items = Array.from(dataTransfer.items);

  console.log(`extractFilesFromFolder: Processing ${items.length} items from dataTransfer`);
  console.log('extractFilesFromFolder: Item types:', items.map((item, i) => ({
    index: i,
    kind: item.kind,
    type: item.type
  })));

  // Check if webkitGetAsEntry is supported
  const supportsFileSystemAPI = items.length > 0 && typeof items[0].webkitGetAsEntry === 'function';
  console.log(`extractFilesFromFolder: FileSystem API supported: ${supportsFileSystemAPI}`);

  if (supportsFileSystemAPI) {
    // Use FileSystem API for better folder traversal
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`\n--- Processing item ${i + 1}/${items.length} ---`);
      console.log(`extractFilesFromFolder: Item ${i + 1} details:`, {
        kind: item.kind,
        type: item.type
      });

      // Skip items that are strings (URLs, text)
      if (item.kind === 'string') {
        console.log(`extractFilesFromFolder: Item ${i + 1} is a string (not a file), skipping`);
        continue;
      }

      // Try to process as a file using FileSystem API
      const entry = item.webkitGetAsEntry?.();

      if (entry) {
        console.log(`extractFilesFromFolder: Item ${i + 1} has entry:`, {
          name: entry.name,
          isFile: entry.isFile,
          isDirectory: entry.isDirectory,
          fullPath: entry.fullPath
        });
        console.log(`extractFilesFromFolder: About to traverse item ${i + 1}, files array currently has ${files.length} files`);
        await traverseFileTree(entry, files);
        console.log(`extractFilesFromFolder: After traversing item ${i + 1}, files array now has ${files.length} files`);
      } else {
        console.warn(`extractFilesFromFolder: webkitGetAsEntry() returned null for item ${i + 1}`);
      }
    }
  } else {
    // Fallback for browsers that don't support FileSystem API
    console.log('extractFilesFromFolder: Using fallback getAsFile() method for all items');
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`\n--- Processing item ${i + 1}/${items.length} with fallback ---`);

      if (item.kind !== 'file') {
        console.log(`extractFilesFromFolder: Item ${i + 1} kind is not 'file' (kind: ${item.kind}), skipping`);
        continue;
      }

      const file = item.getAsFile();
      if (file) {
        console.log(`extractFilesFromFolder: Got file via getAsFile():`, {
          name: file.name,
          type: file.type,
          size: file.size
        });
        if (validateImageFile(file)) {
          console.log(`extractFilesFromFolder: File "${file.name}" is valid, adding to array (current count: ${files.length})`);
          files.push(file);
          console.log(`extractFilesFromFolder: Files array now has ${files.length} files`);
        } else {
          console.log(`extractFilesFromFolder: File "${file.name}" is NOT valid (type: ${file.type})`);
        }
      } else {
        console.warn(`extractFilesFromFolder: getAsFile() returned null for item ${i + 1}`);
      }
    }
  }

  console.log(`\n=== extractFilesFromFolder: Extraction complete ===`);
  console.log(`extractFilesFromFolder: Total files extracted: ${files.length}`);
  console.log(`extractFilesFromFolder: File names:`, files.map(f => f.name));
  return files;
}

/**
 * Recursively traverse a file system entry
 */
async function traverseFileTree(
  entry: FileSystemEntry,
  files: File[]
): Promise<void> {
  console.log(`traverseFileTree: Processing entry "${entry.name}"`, {
    isFile: entry.isFile,
    isDirectory: entry.isDirectory,
    fullPath: entry.fullPath
  });

  if (entry.isFile) {
    const fileEntry = entry as FileSystemFileEntry;
    console.log(`traverseFileTree: Getting file from entry "${entry.name}"`);
    const file = await getFileFromEntry(fileEntry);
    console.log(`traverseFileTree: Got file "${file.name}"`, {
      type: file.type,
      size: file.size
    });

    if (file && validateImageFile(file)) {
      console.log(`traverseFileTree: File "${file.name}" is valid, adding to array (current count: ${files.length})`);
      files.push(file);
      console.log(`traverseFileTree: Files array now has ${files.length} files`);
    } else {
      console.log(`traverseFileTree: File "${file.name}" is NOT valid (type: ${file.type})`);
    }
  } else if (entry.isDirectory) {
    console.log(`traverseFileTree: Entry "${entry.name}" is a directory, reading entries...`);
    const dirEntry = entry as FileSystemDirectoryEntry;
    const reader = dirEntry.createReader();
    const entries = await readAllEntries(reader);
    console.log(`traverseFileTree: Directory "${entry.name}" has ${entries.length} entries`);

    // Recursively process each entry in the directory
    for (let i = 0; i < entries.length; i++) {
      const childEntry = entries[i];
      console.log(`traverseFileTree: Processing child ${i + 1}/${entries.length} in directory "${entry.name}"`);
      await traverseFileTree(childEntry, files);
    }
    console.log(`traverseFileTree: Finished processing directory "${entry.name}", files array has ${files.length} files`);
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
  siteId: string | null,
  labels: string[] | null = null
): Promise<void> {
  console.log('createObservations called', { uploadsCount: uploads.length, userId, siteId, labels });

  const supabase = createClient();

  // Create minimal observation records - only include columns that definitely exist
  const observations = uploads.map(upload => ({
    user_id: userId,
    photo_url: upload.path,
    ...(siteId && { site_id: siteId }), // Only include site_id if it's provided
    ...(labels && labels.length > 0 && { labels }) // Only include labels if provided
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
