import { supabase } from './src/config/supabase';
import * as fs from 'fs';

async function testUpload() {
  console.log('[Test] Starting Supabase connection test...');
  
  try {
    // Test 1: Get bucket list
    console.log('[Test] Listing buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('[Test] Error listing buckets:', bucketsError);
    } else {
      console.log('[Test] Available buckets:', buckets?.map((b: any) => ({ name: b.name, public: b.public })));
    }

    // Test 2: Try uploading a small test file
    console.log('[Test] Creating test file buffer...');
    const testBuffer = Buffer.from('test content 123');
    
    console.log('[Test] Uploading test file to cafe-images/test-upload.txt...');
    const { data, error } = await supabase.storage
      .from('cafe-images')
      .upload('test-upload-' + Date.now() + '.txt', testBuffer, {
        contentType: 'text/plain',
        upsert: false,
      });

    if (error) {
      console.error('[Test] Upload error:', error);
    } else {
      console.log('[Test] Upload success:', data);
    }

    // Test 3: Get public URL
    console.log('[Test] Getting public URL...');
    const { data: publicData } = supabase.storage
      .from('cafe-images')
      .getPublicUrl('test-upload.txt');
    
    console.log('[Test] Public URL:', publicData);
    
  } catch (error: any) {
    console.error('[Test] Exception:', error.message, error.stack);
  }
}

testUpload();
