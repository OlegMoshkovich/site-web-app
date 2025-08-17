import { create } from 'zustand';
import { fetchUserObservations, fetchObservationDates, downloadPhoto } from '@/lib/supabase/api';

export interface Observation {
  id: string;
  user_id: string;
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

export interface ObservationWithPhoto extends Observation {
  dataUrl: string | null;
}

interface ObservationsState {
  // State
  observations: Observation[];
  observationsWithPhotos: ObservationWithPhoto[];
  observationDates: string[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setObservations: (observations: Observation[]) => void;
  setPhotos: (photos: ObservationWithPhoto[]) => void;
  setObservationDates: (dates: string[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Async actions
  fetchObservations: (userId: string) => Promise<Observation[]>;
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
  error: null,
  
  // Basic setters
  setObservations: (observations) => set({ observations }),
  setPhotos: (photos) => set({ observationsWithPhotos: photos }),
  setObservationDates: (dates) => set({ observationDates: dates }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  // Async actions
  fetchObservations: async (userId: string): Promise<Observation[]> => {
    try {
      set({ isLoading: true, error: null });
      const observations = await fetchUserObservations(userId);
      set({ observations, isLoading: false });
      return observations; // Return the observations
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch observations',
        isLoading: false 
      });
      return []; // Return empty array on error
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
    error: null,
  }),
}));
