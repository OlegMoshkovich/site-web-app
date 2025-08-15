import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, User, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface Observation {
  id: string;
  plan: string;
  labels: string[];
  user_id: string;
  note: string;
  gps_lat: number;
  gps_lng: number;
  photo_url: string;
  plan_url: string;
  plan_anchor: Record<string, unknown>;
  photo_date: string;
  created_at: string;
}

interface ObservationWithPhoto extends Observation {
  dataUrl: string | null;
}

// Function to download photo and convert to data URL (same as React Native app)
async function getPhotoDataUrl(photoUrl: string, userId: string, supabase: Awaited<ReturnType<typeof createClient>>): Promise<string | null> {
  if (!photoUrl) return null;
  
  console.log(`Starting download for photo: ${photoUrl}`);
  
  try {
    // Simple download from photos bucket
    const { data, error } = await supabase.storage
      .from('photos')
      .download(photoUrl);
    
    if (error) {
      console.log(`Download failed for ${photoUrl}:`, error.message);
      return null;
    }
    
    if (!data) {
      console.log(`No data for ${photoUrl}`);
      return null;
    }
    
    // Convert to data URL
    const arrayBuffer = await data.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = data.type || 'image/jpeg';
    
    console.log(`Successfully processed ${photoUrl}`);
    return `data:${mimeType};base64,${base64}`;
    
  } catch (error) {
    console.log(`Exception processing ${photoUrl}:`, error);
    return null;
  }
}

export default async function ObservationsPage() {
  const supabase = await createClient();
  
  // Get the current authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Observations</h1>
        <div className="text-red-500">Please log in to view observations.</div>
      </div>
    );
  }
  
  // Only fetch observations for the current user
  const { data: observations, error } = await supabase
    .from('observations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching observations:', error);
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Observations</h1>
        <div className="text-red-500">Error loading observations: {error.message}</div>
      </div>
    );
  }

  // Process photos to get data URLs (same as React Native app)
  const observationsWithPhotos: ObservationWithPhoto[] = [];
  
  for (const observation of observations || []) {
    if (observation.photo_url) {
      try {
        const dataUrl = await getPhotoDataUrl(observation.photo_url, user.id, supabase);
        observationsWithPhotos.push({ ...observation, dataUrl });
      } catch (error) {
        console.log(`Failed to process photo for observation ${observation.id}:`, error);
        observationsWithPhotos.push({ ...observation, dataUrl: null });
      }
    } else {
      observationsWithPhotos.push({ ...observation, dataUrl: null });
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-3xl font-bold mb-8">Observations</h2>
      
      {observationsWithPhotos && observationsWithPhotos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {observationsWithPhotos.map((observation: ObservationWithPhoto) => {
            return (
              <Card key={observation.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {observation.dataUrl ? (
                  <div className="relative h-48 w-full">
                    <Image
                      src={observation.dataUrl}
                      alt={`Photo for ${observation.plan}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    {/* Debug info - remove this after fixing */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1">
                      {observation.photo_url}
                    </div>
                  </div>
                ) : (
                  <div className="h-48 w-full bg-gray-100 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                      <p className="text-sm">No photo available</p>
                      {observation.photo_url && (
                        <p className="text-xs text-gray-400 mt-1">
                          Path: {observation.photo_url}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                <CardHeader>
                  <CardDescription className="line-clamp-2">
                    {observation.note}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {observation.labels && observation.labels.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {observation.labels.map((label, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(observation.photo_date).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {observation.gps_lat && observation.gps_lng && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {observation.gps_lat.toFixed(6)}, {observation.gps_lng.toFixed(6)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>User ID: {observation.user_id.slice(0, 8)}...</span>
                  </div>
                  
                  {observation.plan_url && (
                    <div className="pt-2">
                      <a
                        href={observation.plan_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                      >
                        View Plan
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No observations found.</p>
        </div>
      )}
    </div>
  );
}
