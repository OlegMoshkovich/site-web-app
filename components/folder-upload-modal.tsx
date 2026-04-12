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
  extractTakenAtWithFallback,
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
import WebPlanWidget from '@/src/features/WebPlanWidget';

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
  const [pendingAnchor, setPendingAnchor] = useState<{ x: number; y: number } | null>(null);
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);

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
      setPendingAnchor(null);
      setPendingPlanId(null);
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
        setPendingAnchor(null);
        setPendingPlanId(null);
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

    const uploadStartedAt = new Date();

    // Track successful uploads outside the state
    const successfulUploads: Array<{
      signedUrl: string;
      path: string;
      fileName: string;
      takenAt?: string | null;
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
              const takenAt = await extractTakenAtWithFallback(
                fileWithProgress.file,
                uploadStartedAt
              );
              successfulUploads.push({
                signedUrl,
                path,
                fileName: fileWithProgress.file.name,
                takenAt
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
            selectedLabels.length > 0 ? selectedLabels : null,
            pendingAnchor,
            pendingPlanId
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
        <h2 className="mb-4 flex-shrink-0 text-2xl font-bold text-foreground">Upload Images</h2>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 -mx-6 px-6">
          {/* Summary */}
          <div className="mb-4 rounded-lg border border-border bg-muted/40 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium text-foreground">Files: {filesWithProgress.length}</span>
            <span className="font-medium text-foreground">
              Original Size: {formatFileSize(totalOriginalSize)}
            </span>
            {totalCompressedSize > 0 && (
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                Compressed: {formatFileSize(totalCompressedSize)} ({compressionPercentage}% saved)
              </span>
            )}
          </div>
        </div>

        {/* File List */}
        <div className="mb-4 max-h-60 overflow-y-auto rounded-lg border border-border">
          <div className="divide-y divide-border">
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
            <label className="mb-2 block text-sm font-medium text-foreground">
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
            <p className="mt-1 text-xs text-muted-foreground">
              Associate these images with a project. You can change this later.
            </p>
          </div>
        )}

        {/* Label Selector - shown when site is selected and has labels */}
        {!uploadSummary && selectedSiteId && availableLabels.length > 0 && (
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-foreground">
              Labels (Optional):
            </label>
            {isLoadingLabels ? (
              <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading labels...
              </div>
            ) : (
              <>
                <div className="max-h-52 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3">
                  {(() => {
                    const sorted = [...availableLabels].sort((a, b) => a.order_index - b.order_index);
                    const categories = [...new Set(sorted.map(l => l.category))];

                    const labelBtn = (label: typeof sorted[0]) => {
                      const isSelected = selectedLabels.includes(label.name);
                      return (
                        <button
                          key={label.id}
                          disabled={isProcessing}
                          onClick={() => {
                            if (isProcessing) return;
                            setSelectedLabels(prev =>
                              isSelected ? prev.filter(l => l !== label.name) : [...prev, label.name]
                            );
                          }}
                          className={`rounded-md border px-2 py-0.5 text-xs transition-all disabled:cursor-not-allowed disabled:opacity-50
                            ${isSelected
                              ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                              : "border-border bg-muted text-foreground hover:bg-muted/80"
                            }`}
                        >
                          {label.name}
                        </button>
                      );
                    };

                    return (
                      <div className="space-y-3">
                        {categories.map(category => {
                          const catLabels = sorted.filter(l => l.category === category);
                          const parents = catLabels.filter(l => !l.parent_id);
                          const childrenMap = catLabels.reduce<Record<string, typeof sorted>>((acc, l) => {
                            if (l.parent_id) (acc[l.parent_id] ??= []).push(l);
                            return acc;
                          }, {});

                          return (
                            <div key={category}>
                              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{category}</p>
                              <div className="space-y-1">
                                {/* Parents without children — all in one wrapped row */}
                                {parents.filter(p => !childrenMap[p.id]).length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {parents.filter(p => !childrenMap[p.id]).map(p => labelBtn(p))}
                                  </div>
                                )}
                                {/* Parents with children */}
                                {parents.filter(p => childrenMap[p.id]).map(parent => (
                                  <div key={parent.id}>
                                    <div className="flex flex-wrap gap-1">{labelBtn(parent)}</div>
                                    <div className="ml-3 mt-1 flex flex-wrap gap-1 border-l-2 border-border pl-2">
                                      {childrenMap[parent.id].map(child => labelBtn(child))}
                                    </div>
                                  </div>
                                ))}
                                {/* Orphan children */}
                                {catLabels.filter(l => l.parent_id && !parents.find(p => p.id === l.parent_id)).map(l => (
                                  <div key={l.id} className="flex flex-wrap gap-1">{labelBtn(l)}</div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Click labels to attach them to all uploaded images.
                  {selectedLabels.length > 0 && ` (${selectedLabels.length} selected)`}
                </p>
              </>
            )}
          </div>
        )}

        {/* Plan Position */}
        {!uploadSummary && selectedSiteId && (
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-foreground">
              Plan Position (Optional):
            </label>
            <p className="mb-2 text-xs text-muted-foreground">
              Select a plan and click to place an anchor. Applied to all uploaded images.
            </p>
            <WebPlanWidget
              siteId={selectedSiteId}
              userId={userId}
              onAnchorDrop={isProcessing ? undefined : (anchor, planId) => {
                setPendingAnchor(anchor);
                setPendingPlanId(planId);
              }}
              pendingAnchor={pendingAnchor}
            />
            {pendingAnchor && (
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Anchor placed.</p>
                <button
                  onClick={() => { setPendingAnchor(null); setPendingPlanId(null); }}
                  disabled={isProcessing}
                  className="text-xs text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        )}

        {/* Compression Quality Selector */}
        {!uploadSummary && (
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-foreground">
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
                      type="button"
                      className={`rounded-lg border-2 p-3 text-left transition-colors ${
                        compressionQuality === quality
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:border-muted-foreground/30"
                      } ${isProcessing ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                    >
                      <div className="text-sm font-semibold text-foreground">{preset.label}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
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
          <div className="mb-4 rounded-lg border border-primary/25 bg-primary/10 p-4 dark:bg-primary/15">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="flex-1">
                <p className="mb-1 font-semibold text-foreground">Upload Complete</p>
                <div className="space-y-1 text-sm text-foreground/90">
                  <p>Successfully uploaded: {uploadSummary.success} files</p>
                  {uploadSummary.failed > 0 && (
                    <p className="text-destructive">Failed: {uploadSummary.failed} files</p>
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
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'compressing':
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
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
    <div className="p-3 transition-colors hover:bg-muted/50">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">{getStatusIcon()}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground" title={file.name}>
            {file.name}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{formatFileSize(originalSize)}</span>
            {compressedSize && compressedSize !== originalSize && (
              <>
                <span>→</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {formatFileSize(compressedSize)}
                </span>
              </>
            )}
            <span className="text-muted-foreground/60">•</span>
            <span className={
              status === 'error' ? 'text-destructive' :
              status === 'completed' ? 'text-emerald-600 dark:text-emerald-400' :
              'text-muted-foreground'
            }>
              {getStatusText()}
            </span>
          </div>
          {error && (
            <p className="mt-1 truncate text-xs text-destructive" title={error}>
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
