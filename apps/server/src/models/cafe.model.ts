import { supabase } from '../config/supabase';
import { Cafe } from '@workspot-hanoi/shared';

export class CafeModel {
  // ━━━ READ ━━━
  
  // Cho Trang chủ: Lấy danh sách quán kèm tiện ích (có pagination)
  static async getHomeCafes(page: number = 1, limit: number = 10) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data, error, count } = await supabase
      .from('cafes')
      .select('*', { count: 'exact' })
      .range(from, to);
    
    if (error) throw error;
    return { data, count };
  }

  // Lấy TOÀN BỘ quán để xử lý logic trên Bản đồ
  static async getAllCafes() {
    const { data, error } = await supabase
      .from('cafes')
      .select('*');
    if (error) throw error;
    return data;
  }

  // Lấy chi tiết quán với amenities
  static async getCafeDetail(id: string) {
    const { data: cafe, error: cafeError } = await supabase
      .from('cafes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (cafeError) throw cafeError;
    if (!cafe) return null;

    // Lấy amenities của quán
    const { data: amenities, error: amenitiesError } = await supabase
      .from('cafe_amenities')
      .select('amenity_id, amenities(name_ja, name_vi)')
      .eq('cafe_id', id);
    
    if (amenitiesError) throw amenitiesError;

    return { ...cafe, amenities };
  }

  // Lấy toàn bộ quán của owner (với pagination)
  static async getCafesByOwner(ownerId: string, page: number = 1, limit: number = 10) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('cafes')
      .select('*', { count: 'exact' })
      .eq('owner_id', ownerId)
      .range(from, to);
    
    if (error) throw error;
    return { data, count };
  }

  // ━━━ CREATE ━━━
  
  // Tạo quán mới
  static async createCafe(cafe: Partial<Cafe>) {
    const { data, error } = await supabase
      .from('cafes')
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
      .from('cafes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // ━━━ DELETE ━━━
  
  // Xóa quán (chỉ owner)
  static async deleteCafe(id: string) {
    const { error } = await supabase
      .from('cafes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  // ━━━ HELPER ━━━
  
  // Kiểm tra owner quán
  static async isOwner(cafeId: string, ownerId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('cafes')
      .select('owner_id')
      .eq('id', cafeId)
      .single();
    
    if (error) return false;
    return data?.owner_id === ownerId;
  }
}