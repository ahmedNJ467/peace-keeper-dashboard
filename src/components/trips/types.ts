
import { TripStatus, TripType, DisplayTrip } from "@/lib/types/trip";

export interface TripMessageData {
  id: string;
  trip_id: string;
  sender_type: 'admin' | 'driver' | 'client';
  sender_name: string;
  message: string;
  timestamp: string;
  is_read: boolean;
  attachment_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TripAssignmentData {
  id: string;
  trip_id: string;
  driver_id: string;
  assigned_at: string;
  status: 'pending' | 'accepted' | 'rejected';
  driver_rating?: number;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  drivers?: {
    name?: string;
    avatar_url?: string;
  };
  driver_name?: string;
  driver_avatar?: string;
}

// Add a utility function to upload trip attachments
export async function uploadTripAttachment(file: File, tripId: string): Promise<string | null> {
  if (!file) return null;
  
  try {
    // Reuse the driver upload function but customize for trip attachments
    const bucketName = 'trip-attachments';
    const fileType = 'attachment';
    return await uploadTripFile(file, bucketName, tripId, fileType);
  } catch (error) {
    console.error("Error uploading trip attachment:", error);
    return null;
  }
}

// Add a function to upload trip-related files
export async function uploadTripFile(file: File, bucket: string, tripId: string, fileType: string): Promise<string | null> {
  if (!file) return null;

  const fileExt = file.name.split('.').pop();
  const fileName = `${tripId}-${fileType}-${Date.now()}.${fileExt}`;

  try {
    const { supabase } = await import("@/integrations/supabase/client");
    
    // Check if bucket exists, create if it doesn't
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === bucket);
    
    if (!bucketExists) {
      await supabase.storage.createBucket(bucket, {
        public: true
      });
    }

    // Upload the file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('File operation error:', error);
    throw error;
  }
}
