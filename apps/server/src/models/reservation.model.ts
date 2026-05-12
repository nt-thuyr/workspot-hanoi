import { supabase } from '../config/supabase';

export class ReservationModel {
  // CREATE - Đặt chỗ
  static async createReservation(userId: string, cafeId: string, resDate: string, resTime: string, numGuests: number = 1) {
    const { data, error } = await supabase
      .from('reservations')
      .insert({
        user_id: userId,
        cafe_id: cafeId,
        res_date: resDate,
        res_time: resTime,
        num_guests: numGuests,
        status: 'PENDING',
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // READ - Lấy danh sách đặt chỗ của user
  static async getUserReservations(userId: string, page: number = 1, limit: number = 10) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('reservations')
      .select('*, cafes(id, name, address)', { count: 'exact' })
      .eq('user_id', userId)
      .order('res_date', { ascending: false })
      .range(from, to);
    
    if (error) throw error;
    return { data, count };
  }

  // READ - Lấy danh sách đặt chỗ của quán (owner)
  static async getCafeReservations(cafeId: string, page: number = 1, limit: number = 10) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('reservations')
      .select('*, profiles(id, full_name, avatar_url)', { count: 'exact' })
      .eq('cafe_id', cafeId)
      .order('res_date', { ascending: false })
      .range(from, to);
    
    if (error) throw error;
    return { data, count };
  }

  // UPDATE - Cập nhật status (owner duyệt/từ chối)
  static async updateReservationStatus(reservationId: string, status: string) {
    const { data, error } = await supabase
      .from('reservations')
      .update({ status })
      .eq('id', reservationId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // HELPER - Kiểm tra owner của café
  static async isOwner(cafeId: string, ownerId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('cafes')
      .select('owner_id')
      .eq('id', cafeId)
      .single();
    
    if (error) return false;
    return data?.owner_id === ownerId;
  }

  // HELPER - Lấy cafe_id từ reservation
  static async getCafeIdFromReservation(reservationId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('reservations')
      .select('cafe_id')
      .eq('id', reservationId)
      .single();
    
    if (error) return null;
    return data?.cafe_id || null;
  }
}
