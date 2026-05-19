import { supabase } from '../config/supabase';

export class ReservationModel {
  // CREATE - Đặt chỗ
  static async createReservation(
    userId: string,
    cafeId: string,
    resDate: string,
    resTime: string,
    numGuests: number = 1
  ) {
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
    if (limit <= 0) {
      const { data, error, count } = await supabase
        .from('reservations')
        .select('*, profiles(id, full_name, avatar_url)', { count: 'exact' })
        .eq('cafe_id', cafeId)
        .order('res_date', { ascending: false });

      if (error) throw error;
      return { data, count };
    }

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

  // HELPER - Lấy user_id từ reservation (dùng để xác minh quyền hủy)
  static async getUserIdFromReservation(reservationId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('reservations')
      .select('user_id')
      .eq('id', reservationId)
      .single();

    if (error) return null;
    return data?.user_id || null;
  }

  // HELPER - Lấy đầy đủ thông tin reservation để gửi email
  // Email được lấy từ auth.users qua Admin API (không có trong bảng profiles)
  static async getReservationWithDetails(reservationId: string) {
    // Bước 1: Lấy dữ liệu reservation kèm profile và tên quán
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        id, res_date, res_time, status, user_id,
        profiles ( full_name ),
        cafes ( name )
      `)
      .eq('id', reservationId)
      .single();

    if (error || !data) return null;

    // Bước 2: Lấy email từ auth.users bằng Admin API
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(
      (data as any).user_id
    );

    if (authError || !authUser?.user) return null;

    return {
      ...(data as any),
      email: authUser.user.email || null,
    };
  }

  // Lấy lịch sử đặt chỗ theo userId
  static async getHistoryByUserId(userId: string) {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        id,
        res_date,
        res_time,
        status,
        num_guests,
        created_at,
        cafes (
          id,
          name,
          cafe_images ( image_url )
        )
      `)
      .eq('user_id', userId)
      .order('res_date', { ascending: false }); // Sắp xếp ngày đặt gần nhất lên đầu

    if (error) {
      throw error;
    }
    return data;
  }
}
