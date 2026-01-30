"use client";

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Upload,
  AlertCircle
} from 'lucide-react';
import {
  compressImage,
  uploadFileToStorage,
  createObservations,
  formatFileSize,
  calculateCompressionPercentage,
  generateFileId
} from '@/lib/folder-upload-utils';
import type {
  FileWithProgress,
  CompressionQuality,
  UploadSummary
} from '@/types/upload';
import { COMPRESSION_PRESETS } from '@/types/upload';
import { getLabelsForSite, type Label } from '@/lib/labels';

interface FolderUploadModalProps {
  isOpen: boolean;
  files: File[];
  onClose: () => void;
  onUploadComplete: () => void;
  userId: string;
  availableSites: { id: string; name: string }[];
  initialSiteId?: string | null;
}

export function FolderUploadModal({
  isOpen,
  files,
  onClose,
  onUploadComplete,
  userId,
  availableSites,
  initialSiteId
}: FolderUploadModalProps) {
  const [filesWithProgress, setFilesWithProgress] = useState<FileWithProgress[]>([]);
  const [compressionQuality, setCompressionQuality] = useState<CompressionQuality>('medium');
  const [selectedSiteId, setSelectedSiteId] = useState<string>(initialSiteId || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadSummary, setUploadSummary] = useState<UploadSummary | null>(null);
  const [availableLabels, setAvailableLabels] = useState<Label[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [isLoadingLabels, setIsLoadingLabels] = useState(false);

  // Initialize files with progress tracking
  useEffect(() => {
    console.log('\n=== FolderUploadModal: Files initialization useEffect triggered ===');
    console.log('FolderUploadModal: Current state:', {
      filesPropsLength: files.length,
      filesWithProgressLength: filesWithProgress.length,
      filesPropsNames: files.map(f => f.name),
      filesWithProgressNames: filesWithProgress.map(f => f.file.name),
      isOpen
    });

    // Only initialize if modal is open and files are provided
    if (isOpen && files.length > 0) {
      console.log('FolderUploadModal: Condition met - will initialize files with progress tracking');
      console.log('FolderUploadModal: Mapping', files.length, 'files to filesWithProgress');
      const initialized = files.map((file, index) => {
        console.log(`FolderUploadModal: Initializing file ${index + 1}/${files.length}:`, file.name);
        return {
          file,
          id: generateFileId(),
          originalSize: file.size,
          status: 'pending' as const
        };
      });
      console.log('FolderUploadModal: Initialized array has', initialized.length, 'items');
      console.log('FolderUploadModal: Initialized file names:', initialized.map(f => f.file.name));
      console.log('FolderUploadModal: Calling setFilesWithProgress with', initialized.length, 'files');
      setFilesWithProgress(initialized);
      console.log('FolderUploadModal: setFilesWithProgress called');
    } else if (files.length === 0) {
      console.log('FolderUploadModal: No files in props, skipping initialization');
    }
    console.log('=== FolderUploadModal: Files initialization useEffect completed ===\n');
  }, [files, isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    console.log('FolderUploadModal: Modal open state changed', { isOpen });
    if (!isOpen) {
      console.log('FolderUploadModal: Modal closed, resetting state');
      setFilesWithProgress([]);
      setUploadSummary(null);
      setIsProcessing(false);
      setCompressionQuality('medium');
      setSelectedSiteId(initialSiteId || '');
      setAvailableLabels([]);
      setSelectedLabels([]);
      console.log('FolderUploadModal: State reset complete');
    }
  }, [isOpen, initialSiteId]);

  // Fetch labels when site is selected
  useEffect(() => {
    const fetchLabels = async () => {
      if (!selectedSiteId || !userId) {
        setAvailableLabels([]);
        setSelectedLabels([]);
        return;
      }

      setIsLoadingLabels(true);
      try {
        const labels = await getLabelsForSite(selectedSiteId, userId);
        setAvailableLabels(labels);
        setSelectedLabels([]);
      } catch (error) {
        console.error('Error fetching labels:', error);
        setAvailableLabels([]);
      } finally {
        setIsLoadingLabels(false);
      }
    };

    fetchLabels();
  }, [selectedSiteId, userId]);

  const updateFileProgress = useCallback(
    (id: string, updates: Partial<FileWithProgress>) => {
      setFilesWithProgress(prev =>
        prev.map(f => (f.id === id ? { ...f, ...updates } : f))
      );
    },
    []
  );

  const handleCompressionQualityChange = (quality: CompressionQuality) => {
    if (!isProcessing) {
      setCompressionQuality(quality);
    }
  };

  const handleUpload = async () => {
    console.log('handleUpload called', { userId, filesCount: filesWithProgress.length });

    if (!userId || userId === '' || filesWithProgress.length === 0) {
      console.error('Upload aborted: missing userId or no files', { userId, filesCount: filesWithProgress.length });
      alert('Please make sure you are logged in before uploading files.');
      return;
    }

    setIsProcessing(true);
    const preset = COMPRESSION_PRESETS[compressionQuality];

    const summary: UploadSummary = {
      total: filesWithProgress.length,
      success: 0,
      failed: 0,
      skipped: 0
    };

    // Track successful uploads outside the state
    const successfulUploads: Array<{
      signedUrl: string;
      path: string;
      fileName: string;
    }> = [];

    try {
      // Process files in batches of 10
      const BATCH_SIZE = 10;
      for (let i = 0; i < filesWithProgress.length; i += BATCH_SIZE) {
        const batch = filesWithProgress.slice(i, i + BATCH_SIZE);

        // Compress files in parallel within batch
        await Promise.all(
          batch.map(async fileWithProgress => {
            try {
              console.log(`Processing ${fileWithProgress.file.name}...`);

              // Update status to compressing
              updateFileProgress(fileWithProgress.id, { status: 'compressing' });

              // Compress the image
              const compressedFile = await compressImage(
                fileWithProgress.file,
                preset
              );

              console.log(`Compressed ${fileWithProgress.file.name}: ${compressedFile.size} bytes`);

              // Update with compressed file info
              updateFileProgress(fileWithProgress.id, {
                compressedFile,
                compressedSize: compressedFile.size,
                status: 'uploading'
              });

              // Upload to storage
              const { signedUrl, path } = await uploadFileToStorage(
                compressedFile,
                userId
              );

              console.log(`Uploaded ${fileWithProgress.file.name} to ${path}`);

              // Update status to completed
              updateFileProgress(fileWithProgress.id, {
                status: 'completed',
                uploadedUrl: signedUrl
              });

              // Track successful upload
              successfulUploads.push({
                signedUrl,
                path,
                fileName: fileWithProgress.file.name
              });

              summary.success++;
            } catch (error) {
              console.error(`Error processing ${fileWithProgress.file.name}:`, error);
              updateFileProgress(fileWithProgress.id, {
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
              });
              summary.failed++;
            }
          })
        );
      }

      console.log(`Upload complete: ${summary.success} succeeded, ${summary.failed} failed`);

      // Create observations for successfully uploaded files
      if (successfulUploads.length > 0) {
        try {
          console.log(`Creating ${successfulUploads.length} observations...`);
          await createObservations(
            successfulUploads,
            userId,
            selectedSiteId || null,
            selectedLabels.length > 0 ? selectedLabels : null
          );
          console.log('Observations created successfully');
        } catch (error) {
          console.error('Error creating observations:', error);
          // Don't fail the whole operation if database insert fails
        }
      }

      setUploadSummary(summary);

      // Auto-close and refresh if all successful
      if (summary.failed === 0) {
        setTimeout(() => {
          onUploadComplete();
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Upload process error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  // Calculate totals
  const totalOriginalSize = filesWithProgress.reduce(
    (sum, f) => sum + f.originalSize,
    0
  );
  const totalCompressedSize = filesWithProgress.reduce(
    (sum, f) => sum + (f.compressedSize || 0),
    0
  );
  const compressionPercentage = totalCompressedSize > 0
    ? calculateCompressionPercentage(totalOriginalSize, totalCompressedSize)
    : 0;

  // Count by status
  const completedCount = filesWithProgress.filter(f => f.status === 'completed').length;
  const errorCount = filesWithProgress.filter(f => f.status === 'error').length;

  return (
    <Modal isOpen={isOpen} onClose={handleCancel}>
      <div className="p-6 max-w-2xl max-h-[90vh] flex flex-col">
        <h2 className="text-2xl font-bold mb-4 flex-shrink-0">Upload Images</h2>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 -mx-6 px-6">
          {/* Summary */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Files: {filesWithProgress.length}</span>
            <span className="font-medium">
              Original Size: {formatFileSize(totalOriginalSize)}
            </span>
            {totalCompressedSize > 0 && (
              <span className="font-medium text-green-600">
                Compressed: {formatFileSize(totalCompressedSize)} ({compressionPercentage}% saved)
              </span>
            )}
          </div>
        </div>

        {/* File List */}
        <div className="max-h-60 overflow-y-auto mb-4 border rounded-lg">
          <div className="divide-y">
            {filesWithProgress.map(fileWithProgress => (
              <FileRow
                key={fileWithProgress.id}
                fileWithProgress={fileWithProgress}
              />
            ))}
          </div>
        </div>

        {/* Site/Project Selector */}
        {!uploadSummary && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Project (Optional):
            </label>
            <Select
              value={selectedSiteId || 'none'}
              onValueChange={(value) => setSelectedSiteId(value === 'none' ? '' : value)}
              disabled={isProcessing}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="No project selected" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No project</SelectItem>
                {availableSites.map(site => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Associate these images with a project. You can change this later.
            </p>
          </div>
        )}

        {/* Label Selector - shown when site is selected and has labels */}
        {!uploadSummary && selectedSiteId && availableLabels.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Labels (Optional):
            </label>
            {isLoadingLabels ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading labels...
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 p-3 border rounded-lg min-h-[60px] max-h-40 overflow-y-auto">
                  {availableLabels.map(label => {
                    const isSelected = selectedLabels.includes(label.name);
                    return (
                      <Badge
                        key={label.id}
                        variant={isSelected ? 'default' : 'outline'}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-500 hover:bg-blue-600 text-white'
                            : 'hover:bg-gray-100'
                        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => {
                          if (isProcessing) return;
                          setSelectedLabels(prev =>
                            isSelected
                              ? prev.filter(l => l !== label.name)
                              : [...prev, label.name]
                          );
                        }}
                      >
                        {label.name}
                      </Badge>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Click labels to attach them to all uploaded images.
                  {selectedLabels.length > 0 && ` (${selectedLabels.length} selected)`}
                </p>
              </>
            )}
          </div>
        )}

        {/* Compression Quality Selector */}
        {!uploadSummary && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Compression Quality:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(COMPRESSION_PRESETS) as CompressionQuality[]).map(
                quality => {
                  const preset = COMPRESSION_PRESETS[quality];
                  return (
                    <button
                      key={quality}
                      onClick={() => handleCompressionQualityChange(quality)}
                      disabled={isProcessing}
                      className={`p-3 border-2 rounded-lg text-left transition-colors ${
                        compressionQuality === quality
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="font-semibold text-sm">{preset.label}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {preset.description}
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* Upload Summary */}
        {uploadSummary && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-blue-900 mb-1">Upload Complete</p>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>Successfully uploaded: {uploadSummary.success} files</p>
                  {uploadSummary.failed > 0 && (
                    <p className="text-red-600">Failed: {uploadSummary.failed} files</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
        {/* End Scrollable Content */}

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex gap-3 justify-end mt-4 flex-shrink-0">
          <Button
            onClick={handleCancel}
            variant="outline"
            disabled={isProcessing}
          >
            {uploadSummary ? 'Close' : 'Cancel'}
          </Button>
          {!uploadSummary && (
            <Button
              onClick={handleUpload}
              disabled={isProcessing || filesWithProgress.length === 0}
              className="min-w-32"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing... ({completedCount}/{filesWithProgress.length})
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {filesWithProgress.length} Image{filesWithProgress.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

// File row component
function FileRow({ fileWithProgress }: { fileWithProgress: FileWithProgress }) {
  const { file, originalSize, compressedSize, status, error } = fileWithProgress;

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-400" />;
      case 'compressing':
      case 'uploading':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'compressing':
        return 'Compressing...';
      case 'uploading':
        return 'Uploading...';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Failed';
    }
  };

  return (
    <div className="p-3 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">{getStatusIcon()}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" title={file.name}>
            {file.name}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
            <span>{formatFileSize(originalSize)}</span>
            {compressedSize && compressedSize !== originalSize && (
              <>
                <span>→</span>
                <span className="text-green-600 font-medium">
                  {formatFileSize(compressedSize)}
                </span>
              </>
            )}
            <span className="text-gray-400">•</span>
            <span className={
              status === 'error' ? 'text-red-600' :
              status === 'completed' ? 'text-green-600' :
              ''
            }>
              {getStatusText()}
            </span>
          </div>
          {error && (
            <p className="text-xs text-red-600 mt-1 truncate" title={error}>
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
