import { supabase } from '@/integrations/supabase/client';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export interface UploadResult {
  url: string;
  path: string;
}

export class ImageUploadError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ImageUploadError';
  }
}

export async function uploadEventBanner(
  file: File,
  eventId: string
): Promise<UploadResult> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new ImageUploadError(
      `File size must be less than 2MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      'FILE_TOO_LARGE'
    );
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new ImageUploadError(
      `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`,
      'INVALID_FILE_TYPE'
    );
  }

  const supabaseClient = supabase;
  
  // Generate unique file name
  const fileExt = file.name.split('.').pop();
  const fileName = `${eventId}-${Date.now()}.${fileExt}`;
  const filePath = `banners/${fileName}`;

  // Try to upload file
  const { data, error } = await supabaseClient.storage
    .from('event-banners')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    // If bucket doesn't exist, try to create it first
    if (error.message.includes('bucket not found') || error.message.includes('does not exist')) {
      try {
        // Create the bucket (without policies for now)
        const { error: createError } = await supabaseClient.storage.createBucket('event-banners', {
          public: true
        });
        
        if (createError) {
          throw new ImageUploadError(
            `Failed to create storage bucket: ${createError.message}. Please run the simple-setup.sql script first.`,
            'BUCKET_CREATE_FAILED'
          );
        }

        // Try uploading again after creating bucket
        const { data: retryData, error: retryError } = await supabaseClient.storage
          .from('event-banners')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (retryError) {
          throw new ImageUploadError(
            `Failed to upload image after creating bucket: ${retryError.message}`,
            'UPLOAD_FAILED'
          );
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseClient.storage
          .from('event-banners')
          .getPublicUrl(retryData.path);

        return {
          url: publicUrl,
          path: retryData.path
        };
      } catch (createErr) {
        throw new ImageUploadError(
          `Storage setup needed. Please run simple-setup.sql in Supabase SQL Editor first.`,
          'SETUP_REQUIRED'
        );
      }
    } else {
      throw new ImageUploadError(
        `Failed to upload image: ${error.message}`,
        'UPLOAD_FAILED'
      );
    }
  }

  // Get public URL
  const { data: { publicUrl } } = supabaseClient.storage
    .from('event-banners')
    .getPublicUrl(data.path);

  return {
    url: publicUrl,
    path: data.path
  };
}

export async function deleteEventBanner(filePath: string): Promise<void> {
  const supabaseClient = supabase;
  
  const { error } = await supabaseClient.storage
    .from('event-banners')
    .remove([filePath]);

  if (error) {
    throw new ImageUploadError(
      `Failed to delete image: ${error.message}`,
      'DELETE_FAILED'
    );
  }
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than 2MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
    };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`
    };
  }

  return { valid: true };
}

export function extractBannerPathFromUrl(bannerUrl: string): string | null {
  if (!bannerUrl) return null;
  
  try {
    const url = new URL(bannerUrl);
    const pathParts = url.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];
    return `banners/${fileName}`;
  } catch (error) {
    return null;
  }
}

export async function deleteEventBannerByUrl(bannerUrl: string): Promise<void> {
  const filePath = extractBannerPathFromUrl(bannerUrl);
  if (!filePath) return;
  
  await deleteEventBanner(filePath);
}
