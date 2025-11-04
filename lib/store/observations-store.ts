import { create } from 'zustand';
import { fetchObservationDates, downloadPhoto, fetchCollaborativeObservationsByTimeRange } from '@/lib/supabase/api';

export interface Observation {
  id: string;
  user_id: string;
  site_id: string | null;
  created_at: string;
  updated_at: string;
  photo_url: string | null;
  note: string | null;
  anchor_x: number | null;
  anchor_y: number | null;
  labels: string[] | null;
  latitude: number | null;
  longitude: number | null;
  taken_at: string | null;
}

export interface ObservationWithUrl extends Observation {
  signedUrl: string | null;
  sites?: { name: string } | null; // Site information from join
  profiles?: { email: string } | null; // User profile information from join
  user_email?: string; // User email from the query
}

export interface ObservationWithPhoto extends Observation {
  dataUrl: string | null;
}

interface ObservationsState {
  // State
  observations: ObservationWithUrl[];
  observationsWithPhotos: ObservationWithPhoto[];
  observationDates: string[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  dayOffset: number;
  error: string | null;
  availableLabels: string[];
  currentUserId: string | null;
  
  // Actions
  setObservations: (observations: ObservationWithUrl[]) => void;
  addObservations: (observations: ObservationWithUrl[]) => void;
  setPhotos: (photos: ObservationWithPhoto[]) => void;
  setObservationDates: (dates: string[]) => void;
  setLoading: (loading: boolean) => void;
  setLoadingMore: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  setDayOffset: (offset: number) => void;
  setError: (error: string | null) => void;
  setAvailableLabels: (labels: string[]) => void;
  
  // Async actions
  fetchInitialObservations: (userId: string) => Promise<void>;
  loadMoreObservations: (userId: string, type: 'day' | 'week' | 'month') => Promise<void>;
  fetchDates: (userId: string) => Promise<void>;
  processPhotos: () => Promise<void>;
  
  // Utility actions
  clearStore: () => void;
}

export const useObservationsStore = create<ObservationsState>((set, get) => ({
  // Initial state
  observations: [],
  observationsWithPhotos: [],
  observationDates: [],
  isLoading: false,
  isLoadingMore: false,
  hasMore: true,
  dayOffset: 0,
  error: null,
  availableLabels: [],
  currentUserId: null,
  
  // Basic setters
  setObservations: (observations) => set({ observations }),
  addObservations: (newObservations) => set((state) => ({ 
    observations: [...state.observations, ...newObservations] 
  })),
  setPhotos: (photos) => set({ observationsWithPhotos: photos }),
  setObservationDates: (dates) => set({ observationDates: dates }),
  setLoading: (loading) => set({ isLoading: loading }),
  setLoadingMore: (loading) => set({ isLoadingMore: loading }),
  setHasMore: (hasMore) => set({ hasMore }),
  setDayOffset: (offset) => set({ dayOffset: offset }),
  setError: (error) => set({ error }),
  setAvailableLabels: (labels) => set({ availableLabels: labels }),
  
  // Async actions
  fetchInitialObservations: async (userId: string) => {
    const currentState = get();
    
    // Don't refetch if we already have observations for the same user
    if (currentState.observations.length > 0 && currentState.currentUserId === userId) {
      console.log('Skipping fetch - observations already loaded for this user');
      return;
    }
    
    // If user changed, clear existing data
    if (currentState.currentUserId && currentState.currentUserId !== userId) {
      console.log('User changed, clearing existing observations');
      set({
        observations: [],
        observationsWithPhotos: [],
        availableLabels: [],
        hasMore: true,
        dayOffset: 0,
        error: null,
      });
    }
    
    try {
      set({ isLoading: true, error: null, dayOffset: 0 });
      
      // Fetch initial 3 days of observations
      const result = await fetchCollaborativeObservationsByTimeRange(userId, {
        type: 'days',
        count: 3,
        offset: 0
      });
      const { observations: baseObservations, hasMore } = result;
      
      // Generate signed URLs
      const { getSignedPhotoUrl } = await import('@/lib/supabase/api');
      const withUrls: ObservationWithUrl[] = await Promise.all(
        baseObservations.map(async (o) => {
          const signedUrl = o.photo_url
            ? await getSignedPhotoUrl(o.photo_url, 3600)
            : null;
          return { ...o, signedUrl };
        })
      );
      
      // Extract labels
      const allLabels = new Set<string>();
      withUrls.forEach(obs => {
        if (obs.labels) {
          obs.labels.forEach(label => {
            if (label && label.trim()) {
              allLabels.add(label.trim());
            }
          });
        }
      });
      
      set({ 
        observations: withUrls, 
        hasMore,
        availableLabels: Array.from(allLabels).sort(),
        currentUserId: userId,
        dayOffset: 3,
        isLoading: false 
      });
    } catch (error) {
      console.error('Error in fetchInitialObservations:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch observations',
        isLoading: false 
      });
    }
  },

  loadMoreObservations: async (userId: string, type: 'day' | 'week' | 'month') => {
    const { isLoadingMore, hasMore, dayOffset } = get();
    
    if (isLoadingMore || !hasMore) {
      return;
    }
    
    try {
      set({ isLoadingMore: true, error: null });
      
      let timeRange;
      let newOffset;
      
      switch (type) {
        case 'day':
          timeRange = { type: 'days' as const, count: 1, offset: dayOffset };
          newOffset = dayOffset + 1;
          break;
        case 'week':
          timeRange = { type: 'days' as const, count: 7, offset: dayOffset };
          newOffset = dayOffset + 7;
          break;
        case 'month':
          timeRange = { type: 'days' as const, count: 30, offset: dayOffset };
          newOffset = dayOffset + 30;
          break;
      }
      
      const result = await fetchCollaborativeObservationsByTimeRange(userId, timeRange);
      const { observations: newObservations, hasMore: hasMoreData } = result;
      
      // Generate signed URLs for new observations
      const { getSignedPhotoUrl } = await import('@/lib/supabase/api');
      const withUrls: ObservationWithUrl[] = await Promise.all(
        newObservations.map(async (o) => {
          const signedUrl = o.photo_url
            ? await getSignedPhotoUrl(o.photo_url, 3600)
            : null;
          return { ...o, signedUrl };
        })
      );
      
      // Update labels
      const currentLabels = new Set(get().availableLabels);
      withUrls.forEach(obs => {
        if (obs.labels) {
          obs.labels.forEach(label => {
            if (label && label.trim()) {
              currentLabels.add(label.trim());
            }
          });
        }
      });
      
      set((state) => ({ 
        observations: [...state.observations, ...withUrls],
        hasMore: hasMoreData,
        dayOffset: newOffset,
        availableLabels: Array.from(currentLabels).sort(),
        isLoadingMore: false 
      }));
    } catch (error) {
      console.error('loadMoreObservations error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load more observations',
        isLoadingMore: false 
      });
    }
  },
  
  fetchDates: async (userId: string) => {
    try {
      const dates = await fetchObservationDates(userId);
      set({ observationDates: dates });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch dates'
      });
    }
  },
  
  processPhotos: async () => {
    const { observations } = get();
    if (!observations.length) return;
    
    try {
      set({ isLoading: true });
      
      const observationsWithPhotos: ObservationWithPhoto[] = [];
      const failedPhotos: string[] = [];
      
      // Log all photo URLs first to see the pattern
      const photoUrls = observations
        .filter(obs => obs.photo_url)
        .map(obs => obs.photo_url);

        console.log('photoUrls', photoUrls);
      
      
      // Process photos sequentially to avoid stack overflow
      for (const observation of observations) {
      
        if (observation.photo_url) {
          try {
            // Simple download without timeout - the downloadPhoto function already handles errors gracefully
            const fileData = await downloadPhoto(observation.photo_url);
            // console.log('fileData from process photo', fileData);
            
            if (fileData) {
              // Convert to data URL
              const arrayBuffer = await fileData.arrayBuffer();
              const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
              const mimeType = fileData.type || 'image/jpeg';
              const dataUrl = `data:${mimeType};base64,${base64}`;
              console.log('dataUrl from process photo', dataUrl);
              
              observationsWithPhotos.push({ ...observation, dataUrl });
              console.log(`Successfully processed photo for observation ${observation.id}`);
            } else {
              console.log(`No file data for observation ${observation.id} - photo: ${observation.photo_url}`);
              failedPhotos.push(observation.photo_url);
              observationsWithPhotos.push({ ...observation, dataUrl: null });
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorType = error instanceof Error ? error.constructor.name : typeof error;
            console.error(`Failed to process photo for observation ${observation.id}:`, {
              photoUrl: observation.photo_url,
              errorType,
              errorMessage,
              fullError: error
            });
            failedPhotos.push(observation.photo_url);
            // Don't throw, just continue with next observation
            observationsWithPhotos.push({ ...observation, dataUrl: null });
          }
        } else {
          observationsWithPhotos.push({ ...observation, dataUrl: null });
        }
      }
      
      console.log(`Finished processing photos. Total: ${observationsWithPhotos.length}`);
      if (failedPhotos.length > 0) {
        console.log(`Failed photos:`, failedPhotos);
      }
      
      set({ observationsWithPhotos, isLoading: false });
    } catch (error) {
      console.error('Error in processPhotos:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to process photos',
        isLoading: false 
      });
    }
  },
  
  // Utility actions
  clearStore: () => set({
    observations: [],
    observationsWithPhotos: [],
    observationDates: [],
    isLoading: false,
    isLoadingMore: false,
    hasMore: true,
    dayOffset: 0,
    error: null,
    availableLabels: [],
    currentUserId: null,
  }),
}));
