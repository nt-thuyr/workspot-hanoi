import { supabase } from '../config/supabase';
import * as path from 'path';

/**
 * Upload ảnh lên Supabase Storage
 * @param file - File object từ multer
 * @param bucket - Tên bucket (ví dụ: 'cafe-images')
 * @param folder - Thư mục trong bucket (ví dụ: 'covers', 'menus')
 * @returns URL công khai của ảnh
 */
export async function uploadImageToSupabase(
  file: Express.Multer.File,
  bucket: string = 'cafe-images',
  folder: string = 'uploads'
): Promise<string> {
  if (!file) {
    throw new Error('No file provided');
  }

  try {
    console.log(`[Upload] Starting upload for file: ${file.originalname} (${file.size} bytes)`);
    console.log(`[Upload] File buffer exists: ${!!file.buffer}, Buffer size: ${file.buffer?.length}`);
    console.log(`[Upload] MIME type: ${file.mimetype}`);

    // Tạo tên file unique
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const extension = path.extname(file.originalname);
    const basename = path.basename(file.originalname, extension);
    const filename = `${folder}/${timestamp}-${randomId}-${basename}${extension}`;

    console.log(`[Upload] Uploading to bucket='${bucket}', path='${filename}'`);

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('[Upload Error] Full error:', JSON.stringify(error, null, 2));
      console.error('[Upload Error] Status:', error.status);
      console.error('[Upload Error] Message:', error.message);
      throw new Error(`Upload failed: ${error.message}`);
    }

    console.log(`[Upload] File uploaded successfully to ${filename}`);

    // Lấy public URL
    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filename);

    const publicUrl = publicData.publicUrl;
    console.log(`[Upload] Public URL: ${publicUrl}`);

    return publicUrl;
  } catch (error: any) {
    console.error('[Upload Exception] Full error:', error);
    console.error('[Upload Exception] Stack:', error.stack);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

/**
 * Upload multiple images
 */
export async function uploadMultipleImages(
  files: Express.Multer.File[],
  bucket: string = 'cafe-images',
  folder: string = 'uploads'
): Promise<string[]> {
  const urls: string[] = [];

  for (const file of files) {
    const url = await uploadImageToSupabase(file, bucket, folder);
    urls.push(url);
  }

  return urls;
}
