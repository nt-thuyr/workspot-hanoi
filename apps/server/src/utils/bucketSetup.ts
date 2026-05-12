import { supabase } from '../config/supabase';

/**
 * Ensure bucket exists, create if not
 */
export async function ensureBucketExists(bucketName: string) {
  try {
    console.log(`[Bucket] Checking if bucket "${bucketName}" exists...`);

    // Try to list files in bucket
    const { data, error } = await supabase.storage.from(bucketName).list('', {
      limit: 1,
    });

    if (error) {
      if (error.message.includes('not found')) {
        console.log(`[Bucket] Bucket "${bucketName}" not found. Creating...`);

        // Create bucket
        const { data: createData, error: createError } = await supabase.storage.createBucket(
          bucketName,
          {
            public: true, // Make bucket public so files are accessible
          }
        );

        if (createError) {
          console.error(`[Bucket] Error creating bucket:`, createError);
          throw createError;
        }

        console.log(`[Bucket] Bucket "${bucketName}" created successfully`);
        return true;
      } else {
        console.error(`[Bucket] Error checking bucket:`, error);
        throw error;
      }
    }

    console.log(`[Bucket] Bucket "${bucketName}" exists`);
    return true;
  } catch (error: any) {
    console.error(`[Bucket] Fatal error:`, error);
    throw error;
  }
}
