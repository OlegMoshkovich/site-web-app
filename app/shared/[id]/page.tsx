import { notFound } from 'next/navigation';
import { fetchSharedObservation, getSignedPhotoUrl } from '@/lib/supabase/api';
import { SharedPhotoViewer } from '@/components/shared-photo-viewer';

interface SharedPhotoPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SharedPhotoPage({ params }: SharedPhotoPageProps) {
  const { id } = await params;

  // Fetch the observation
  const observation = await fetchSharedObservation(id);
  
  if (!observation || !observation.photo_url) {
    notFound();
  }

  // Get signed URL for the photo
  const signedUrl = await getSignedPhotoUrl(observation.photo_url, 3600);
  
  if (!signedUrl) {
    notFound();
  }

  return (
    <SharedPhotoViewer
      observation={observation}
      imageUrl={signedUrl}
    />
  );
}

// Generate metadata for better sharing
export async function generateMetadata({ params }: SharedPhotoPageProps) {
  const { id } = await params;
  const observation = await fetchSharedObservation(id);
  
  if (!observation) {
    return {
      title: 'Photo not found',
    };
  }

  const date = new Date(observation.taken_at || observation.created_at).toLocaleDateString('en-GB');
  
  return {
    title: `Shared Photo - ${date}`,
    description: observation.note || `Photo taken on ${date}`,
  };
}