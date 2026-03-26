import { create } from 'zustand';
import { fetchObservationDates, downloadPhoto, fetchCollaborativeObservationsByTimeRange } from '@/lib/supabase/api';
import { getLabelsForSite, type Label } from '@/lib/labels';

const BATCH_SIZE = 20;

// Generates signed URLs in batches, calling onBatch after each one completes.
// Fire-and-forget: callers don't need to await this.
async function fillSignedUrls(
  items: Array<{ id: string; photo_url: string | null }>,
  onBatch: (updates: Array<{ id: string; signedUrl: string | null }>) => void
): Promise<void> {
  const { getSignedPhotoUrl } = await import('@/lib/supabase/api');
  const photoItems = items.filter(o => o.photo_url);
  for (let i = 0; i < photoItems.length; i += BATCH_SIZE) {
    const batch = photoItems.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (o) => ({
        id: o.id,
        signedUrl: await getSignedPhotoUrl(o.photo_url!, 3600).catch(() => null),
      }))
    );
    onBatch(results);
  }
}

export interface Observation {
  id: string;
  user_id: string;
  site_id: string | null;
  site_name: string | null;
  created_at: string;
  photo_url: string | null;
  note: string | null;
  plan: string | null;
  plan_url: string | null;
  plan_anchor: { x: number; y: number } | null;
  labels: string[] | null;
  gps_lat: number | null;
  gps_lng: number | null;
  photo_date: string | null;
  taken_at: string | null;
}

export interface ObservationWithUrl extends Observation {
  signedUrl: string | null;
  sites?: { name: string; logo_url?: string | null } | null;
  profiles?: { email: string } | null;
  user_email?: string;
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
  siteLabels: Map<string, Label[]>; // Map of site_id -> Label[]
  currentUserId: string | null;
  lastFetchedAt: number;
  searchResults: ObservationWithUrl[];
  isSearching: boolean;

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
  setSiteLabels: (siteId: string, labels: Label[]) => void;
  fetchSiteLabels: (siteId: string, userId: string) => Promise<void>;

  // Async actions
  fetchInitialObservations: (userId: string) => Promise<void>;
  loadMoreObservations: (userId: string, type: 'day' | 'week' | 'month') => Promise<void>;
  fetchDates: (userId: string) => Promise<void>;
  processPhotos: () => Promise<void>;
  performSearch: (userId: string, query: string) => Promise<void>;

  // Utility actions
  clearStore: () => void;
  clearSearch: () => void;
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
  siteLabels: new Map(),
  currentUserId: null,
  lastFetchedAt: 0,
  searchResults: [],
  isSearching: false,
  
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
  setSiteLabels: (siteId, labels) => set((state) => {
    const newSiteLabels = new Map(state.siteLabels);
    newSiteLabels.set(siteId, labels);
    return { siteLabels: newSiteLabels };
  }),
  fetchSiteLabels: async (siteId, userId) => {
    try {
      const labels = await getLabelsForSite(siteId, userId);
      const currentState = get();
      const newSiteLabels = new Map(currentState.siteLabels);
      newSiteLabels.set(siteId, labels);
      set({ siteLabels: newSiteLabels });
    } catch (error) {
      console.error('Error fetching site labels:', error);
    }
  },
  
  // Async actions
  fetchInitialObservations: async (userId: string) => {
    const currentState = get();
    
    // Don't refetch if we already have fresh data for the same user (within 30 seconds)
    const STALE_AFTER_MS = 30_000;
    if (
      currentState.observations.length > 0 &&
      currentState.currentUserId === userId &&
      Date.now() - currentState.lastFetchedAt < STALE_AFTER_MS
    ) {
      return;
    }
    
    // If user changed, clear existing data
    if (currentState.currentUserId && currentState.currentUserId !== userId) {
      set({
        observations: [],
        observationsWithPhotos: [],
        availableLabels: [],
        siteLabels: new Map(),
        hasMore: true,
        dayOffset: 0,
        error: null,
      });
    }
    
    try {
      set({ isLoading: true, error: null, dayOffset: 0 });

      const result = await fetchCollaborativeObservationsByTimeRange(userId, {
        type: 'days',
        count: 30,
        offset: 0
      });
      const { observations: baseObservations, hasMore } = result;

      // Extract labels
      const allLabels = new Set<string>();
      baseObservations.forEach(obs => {
        obs.labels?.forEach(label => { if (label?.trim()) allLabels.add(label.trim()); });
      });

      // Fetch site labels for all unique sites
      const uniqueSiteIds = new Set<string>(baseObservations.map(o => o.site_id).filter(Boolean) as string[]);
      const siteLabelsMap = new Map<string, Label[]>();
      await Promise.all(
        Array.from(uniqueSiteIds).map(async (siteId) => {
          try { siteLabelsMap.set(siteId, await getLabelsForSite(siteId, userId)); }
          catch (error) { console.error(`Error fetching labels for site ${siteId}:`, error); }
        })
      );

      // Show observations immediately — don't block on URL generation
      set({
        observations: baseObservations.map(o => ({ ...o, signedUrl: null })),
        hasMore,
        availableLabels: Array.from(allLabels).sort(),
        siteLabels: siteLabelsMap,
        currentUserId: userId,
        lastFetchedAt: Date.now(),
        dayOffset: 30,
        isLoading: false,
      });

      // Fill signed URLs in the background
      fillSignedUrls(baseObservations, (updates) => {
        set((state) => ({
          observations: state.observations.map(obs => {
            const r = updates.find(u => u.id === obs.id);
            return r ? { ...obs, signedUrl: r.signedUrl } : obs;
          }),
        }));
      });
    } catch (error) {
      console.error('Error in fetchInitialObservations:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch observations',
        isLoading: false,
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

      // Update labels from new observations
      const currentLabels = new Set(get().availableLabels);
      newObservations.forEach(obs => {
        obs.labels?.forEach(label => { if (label?.trim()) currentLabels.add(label.trim()); });
      });

      // Fetch site labels for any new sites
      const currentState = get();
      const existingSiteIds = new Set(currentState.siteLabels.keys());
      const newSiteIds = new Set<string>(
        newObservations.map(o => o.site_id).filter(id => id && !existingSiteIds.has(id)) as string[]
      );
      const newSiteLabelsMap = new Map(currentState.siteLabels);
      await Promise.all(
        Array.from(newSiteIds).map(async (siteId) => {
          try { newSiteLabelsMap.set(siteId, await getLabelsForSite(siteId, userId)); }
          catch (error) { console.error(`Error fetching labels for site ${siteId}:`, error); }
        })
      );

      // Append observations immediately — don't block on URL generation
      set((state) => ({
        observations: [...state.observations, ...newObservations.map(o => ({ ...o, signedUrl: null }))],
        hasMore: hasMoreData,
        dayOffset: newOffset,
        availableLabels: Array.from(currentLabels).sort(),
        siteLabels: newSiteLabelsMap,
        isLoadingMore: false,
      }));

      // Fill signed URLs in the background
      fillSignedUrls(newObservations, (updates) => {
        set((state) => ({
          observations: state.observations.map(obs => {
            const r = updates.find(u => u.id === obs.id);
            return r ? { ...obs, signedUrl: r.signedUrl } : obs;
          }),
        }));
      });
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
      
      // Process photos sequentially to avoid stack overflow
      for (const observation of observations) {
      
        if (observation.photo_url) {
          try {
            // Simple download without timeout - the downloadPhoto function already handles errors gracefully
            const fileData = await downloadPhoto(observation.photo_url);
            
            if (fileData) {
              // Convert to data URL
              const arrayBuffer = await fileData.arrayBuffer();
              const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
              const mimeType = fileData.type || 'image/jpeg';
              const dataUrl = `data:${mimeType};base64,${base64}`;
              
              observationsWithPhotos.push({ ...observation, dataUrl });
            } else {
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
      
      
      set({ observationsWithPhotos, isLoading: false });
    } catch (error) {
      console.error('Error in processPhotos:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to process photos',
        isLoading: false 
      });
    }
  },
  
  performSearch: async (userId: string, query: string) => {
    if (!query.trim()) {
      set({ searchResults: [], isSearching: false });
      return;
    }
    set({ isSearching: true });
    try {
      const { searchObservationsInDB } = await import('@/lib/supabase/api');
      const results = await searchObservationsInDB(userId, query);

      // Show results immediately — don't block on URL generation
      set({ searchResults: results.map(o => ({ ...o, signedUrl: null })), isSearching: false });

      // Fill signed URLs in the background
      fillSignedUrls(results, (updates) => {
        set((state) => ({
          searchResults: state.searchResults.map(obs => {
            const r = updates.find(u => u.id === obs.id);
            return r ? { ...obs, signedUrl: r.signedUrl } : obs;
          }),
        }));
      });
    } catch (error) {
      console.error('Search error:', error);
      set({ isSearching: false });
    }
  },

  // Utility actions
  clearSearch: () => set({ searchResults: [], isSearching: false }),

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
    siteLabels: new Map(),
    currentUserId: null,
    lastFetchedAt: 0,
    searchResults: [],
    isSearching: false,
  }),
}));
