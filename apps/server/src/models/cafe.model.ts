import { supabase } from "../config/supabase";
import { createClient } from "@supabase/supabase-js";
import { Cafe } from "@workspot-hanoi/shared";

export class CafeModel {
  // ━━━ READ ━━━

  // Cho Trang chủ: Lấy danh sách quán kèm tiện ích (có pagination)
  static async getHomeCafes(page: number = 1, limit: number = 10) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from("cafes")
      .select("*", { count: "exact" })
      .range(from, to);

    if (error) throw error;
    return { data, count };
  }

  // Lấy TOÀN BỘ quán để xử lý logic trên Bản đồ
  static async getAllCafes() {
    // Use a dedicated admin client with the service role key to avoid RLS/auth side-effects
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment",
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    const { data, error } = await adminClient
      .from("cafes")
      .select("*, cafe_amenities(amenity_id), cafe_images(image_url, image_type), reviews(rating), reservations(id)");

    if (error) throw error;
    return data;
  }

  // Lấy chi tiết quán với amenities
  static async getCafeDetail(id: string) {
    const { data: cafe, error: cafeError } = await supabase
      .from("cafes")
      .select("*")
      .eq("id", id)
      .single();

    if (cafeError) throw cafeError;
    if (!cafe) return null;

    // Lấy amenities của quán
    const { data: amenities, error: amenitiesError } = await supabase
      .from("cafe_amenities")
      .select("amenity_id, amenities(name_ja, name_vi)")
      .eq("cafe_id", id);

    if (amenitiesError) throw amenitiesError;

    // Lấy images
    const { data: images, error: imagesError } = await supabase
      .from("cafe_images")
      .select("*")
      .eq("cafe_id", id);

    if (imagesError) throw imagesError;

    return { ...cafe, amenities, images };
  }

  // Lấy toàn bộ quán của owner (với pagination)
  static async getCafesByOwner(
    ownerId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const selectQuery = "*, cafe_amenities(amenity_id), cafe_images(image_url, image_type), reviews(rating), reservations(id)";
    
    if (limit <= 0) {
      const { data, error, count } = await supabase
        .from("cafes")
        .select(selectQuery, { count: "exact" })
        .eq("owner_id", ownerId);

      if (error) throw error;
      return { data, count };
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
        .from("cafes")
        .select(selectQuery, { count: "exact" })
        .eq("owner_id", ownerId)
        .range(from, to);

    if (error) throw error;
    return { data, count };
  }

  // ━━━ CREATE ━━━

  // Tạo quán mới
  static async createCafe(cafe: Partial<Cafe>) {
    const { data, error } = await supabase
      .from("cafes")
      .insert(cafe)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ━━━ UPDATE ━━━

  // Cập nhật thông tin quán (chỉ owner)
  static async updateCafeInfo(id: string, updates: Partial<Cafe>) {
    const { data, error } = await supabase
      .from("cafes")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ━━━ DELETE ━━━

  // Xóa quán (chỉ owner)
  static async deleteCafe(id: string) {
    const { error } = await supabase.from("cafes").delete().eq("id", id);

    if (error) throw error;
    return true;
  }

  // ━━━ HELPER ━━━

  // Kiểm tra owner quán
  static async isOwner(cafeId: string, ownerId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("cafes")
      .select("owner_id")
      .eq("id", cafeId)
      .single();

    if (error) return false;
    return data?.owner_id === ownerId;
  }
}
