import { supabase } from '../config/supabase';

export class NotificationModel {
  // Tạo một thông báo mới
  static async createNotification(input: {
    user_id: string;
    title: string;
    content: string;
    is_read?: boolean;
  }) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: input.user_id,
        title: input.title,
        content: input.content,
        is_read: input.is_read ?? false,
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  // Lấy danh sách thông báo của user (paginated)
  static async getUserNotifications(userId: string, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    // Get total count
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get paginated notifications
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, count };
  }

  // Lấy số lượng thông báo chưa đọc
  static async getUnreadCount(userId: string) {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  }

  // Đánh dấu một thông báo là đã đọc
  static async markAsRead(notificationId: number) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  // Đánh dấu tất cả thông báo của user là đã đọc
  static async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return { success: true };
  }

  // Xoá một thông báo
  static async deleteNotification(notificationId: number) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
    return { success: true };
  }

  // Xoá tất cả thông báo của user
  static async deleteAllNotifications(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  }
}
