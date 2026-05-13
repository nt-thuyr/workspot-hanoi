const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runSeed() {
  console.log("Seeding remote database...");

  // 1. ROLES
  const { error: rErr } = await supabase.from('roles').upsert([
    { id: 1, role_name: 'RESERVATION_REQUESTER' },
    { id: 2, role_name: 'CAFE_OWNER' },
    { id: 3, role_name: 'GUEST' }
  ], { onConflict: 'id' });
  if (rErr) console.error("Error roles:", rErr.message);

  // 2. USERS & PROFILES
  // Note: Creating auth users requires admin.createUser
  const users = [
    { id: '00000000-0000-0000-0000-000000000001', email: 'sato@example.com', password: 'password123', role_id: 1, full_name: 'Sato Kenji', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sato' },
    { id: '00000000-0000-0000-0000-000000000002', email: 'tanaka@example.com', password: 'password123', role_id: 1, full_name: 'Tanaka Hana', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hana' },
    { id: '00000000-0000-0000-0000-000000000003', email: 'dungowner@example.com', password: 'password123', role_id: 2, full_name: 'Nguyen Van Dung', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dung' }
  ];

  for (const u of users) {
    const { data: userRecord, error: uErr } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true
    });
    
    // If error, it might already exist, which is fine
    let uid = u.id;
    if (userRecord && userRecord.user) {
        uid = userRecord.user.id;
    } else {
        // Try to get the existing user
        const { data: existing } = await supabase.from('profiles').select('id').eq('full_name', u.full_name).single();
        if (existing) uid = existing.id;
    }

    const { error: pErr } = await supabase.from('profiles').upsert([
      { id: uid, role_id: u.role_id, full_name: u.full_name, avatar_url: u.avatar }
    ], { onConflict: 'id' });
    if (pErr) console.error(`Error profile ${u.email}:`, pErr.message);
  }

  // 3. AMENITIES
  const { error: aErr } = await supabase.from('amenities').upsert([
    { id: 1, name_ja: '高速Wi-Fi', name_vi: 'Wi-Fi tốc độ cao' },
    { id: 2, name_ja: 'コンセントあり', name_vi: 'Có ổ cắm điện' },
    { id: 3, name_ja: '静かな環境', name_vi: 'Môi trường yên tĩnh' },
    { id: 4, name_ja: '禁煙', name_vi: 'Không hút thuốc' }
  ], { onConflict: 'id' });
  if (aErr) console.error("Error amenities:", aErr.message);

  // 4. CAFES
  const cafes = [
    { id: '11111111-1111-1111-1111-111111111111', owner_id: '00000000-0000-0000-0000-000000000003', name: 'The Velvet Bean', address: '12 Tran Hung Dao, Hanoi', lat: 21.0285, lng: 105.8542, wifi_speed: 'NORMAL', quiet_level: 'NORMAL', open_time: '08:00:00', close_time: '22:00:00', description_ja: '静かで集中できる空間です。' },
    { id: '22222222-2222-2222-2222-222222222222', owner_id: '00000000-0000-0000-0000-000000000003', name: 'The Brew Archive', address: 'Kim Ma, Ba Dinh, Hanoi', lat: 21.0300, lng: 105.8190, wifi_speed: 'NORMAL', quiet_level: 'NORMAL', open_time: '07:30:00', close_time: '21:00:00', description_ja: 'プロフェッショナルな環境。' }
  ];

  // Try to find the owner id first
  const { data: ownerProfile } = await supabase.from('profiles').select('id').eq('full_name', 'Nguyen Van Dung').single();
  if (ownerProfile) {
      cafes[0].owner_id = ownerProfile.id;
      cafes[1].owner_id = ownerProfile.id;
  }

  const { error: cErr } = await supabase.from('cafes').upsert(cafes, { onConflict: 'id' });
  if (cErr) console.error("Error cafes:", cErr.message);

  // 5. CAFE_AMENITIES
  const { error: caErr } = await supabase.from('cafe_amenities').upsert([
    { cafe_id: '11111111-1111-1111-1111-111111111111', amenity_id: 1 },
    { cafe_id: '11111111-1111-1111-1111-111111111111', amenity_id: 2 },
    { cafe_id: '22222222-2222-2222-2222-222222222222', amenity_id: 1 }
  ], { onConflict: 'cafe_id,amenity_id' });
  if (caErr && !caErr.message.includes('unique')) console.error("Error cafe_amenities:", caErr.message);

  // 6. CAFE_IMAGES
  const { error: ciErr } = await supabase.from('cafe_images').upsert([
    { cafe_id: '11111111-1111-1111-1111-111111111111', image_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24', image_type: 'INTERIOR' },
    { cafe_id: '22222222-2222-2222-2222-222222222222', image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085', image_type: 'INTERIOR' }
  ], { onConflict: 'cafe_id,image_url' });
  if (ciErr && !ciErr.message.includes('unique')) console.error("Error cafe_images:", ciErr.message);

  console.log("✅ Seed completed successfully!");
}

runSeed();
