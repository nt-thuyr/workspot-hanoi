import { supabase } from '../config/supabase';

export class FavoriteModel {
  // Thêm café vào danh sách yêu thích
  static async addToFavorites(userId: string, cafeId: string) {
    const { data, error } = await supabase
      .from('favorites')
      .insert([{ user_id: userId, cafe_id: cafeId }])
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  // Xoá café khỏi danh sách yêu thích
  static async removeFromFavorites(userId: string, cafeId: string) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('cafe_id', cafeId);

    if (error) throw error;
    return { success: true };
  }

  // Lấy danh sách yêu thích của user (với thông tin café)
  static async getUserFavorites(userId: string, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    // Get total count
    const { count } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get paginated favorites with cafe info
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        id,
        created_at,
        cafes:cafe_id (
          id,
          name,
          address,
          avg_rating,
          image_url,
          owner_id
        )
      `)
      .eq('user_id', userId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, count };
  }

  // Check nếu user đã like café
  static async isFavorite(userId: string, cafeId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('cafe_id', cafeId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return !!data;
  }
}
