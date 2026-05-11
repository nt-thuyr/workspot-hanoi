import { supabase } from '../config/supabase';
import { Cafe } from '@workspot-hanoi/shared';

export class CafeModel {
  // Cho Trang chủ: Lấy danh sách quán kèm tiện ích [cite: 17]
  static async getHomeCafes() {
    const { data, error } = await supabase
      .from('cafes')
      .select('*')
      .limit(10);
    if (error) throw error;
    return data;
  }
  // Lấy TOÀN BỘ quán để xử lý logic trên Bản đồ
  static async getAllCafes() {
    const { data, error } = await supabase
      .from('cafes')
      .select('*');
    if (error) throw error;
    return data;
  }
  // Cho Chủ quán: Cập nhật thông tin quán [cite: 18, 20]
  static async updateCafeInfo(id: string, updates: Partial<Cafe>) {
    const { data, error } = await supabase
      .from('cafes')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data;
  }
}