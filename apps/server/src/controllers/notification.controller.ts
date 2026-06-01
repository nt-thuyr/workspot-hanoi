import { Request, Response } from 'express';
import { NotificationModel } from '../models/notification.model';

// ── Token-based (frontend convenience) ───────────────────────────────────

// GET /api/notifications — Lấy thông báo của user hiện tại từ token
export const getMyNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'ログインしてください。' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const { data, count } = await NotificationModel.getUserNotifications(userId, page, limit);

    return res.status(200).json({ success: true, data, total: count });
  } catch (error: any) {
    console.error('Error fetching my notifications:', error);
    return res.status(500).json({ error: 'Lỗi server!', details: error.message });
  }
};

// PUT /api/notifications/:id/read — Đánh dấu đã đọc từ token
export const markMyNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const notification = await NotificationModel.markAsRead(parseInt(id));
    return res.status(200).json({ success: true, data: notification });
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ error: 'Lỗi server!', details: error.message });
  }
};

// ── UserId-based (legacy) ─────────────────────────────────────────────────

// GET /api/notifications/user/:userId - Lấy danh sách thông báo
export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params as { userId: string };
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const { data, count } = await NotificationModel.getUserNotifications(userId, page, limit);

    res.status(200).json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Lỗi server!', details: error.message });
  }
};

// GET /api/notifications/user/:userId/unread-count
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params as { userId: string };
    const unreadCount = await NotificationModel.getUnreadCount(userId);
    res.status(200).json({ success: true, unreadCount });
  } catch (error: any) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Lỗi server!', details: error.message });
  }
};

// PUT /api/notifications/:id/mark-as-read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const notification = await NotificationModel.markAsRead(parseInt(id));
    res.status(200).json({ success: true, data: notification });
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Lỗi server!', details: error.message });
  }
};

// PUT /api/notifications/user/:userId/mark-all-as-read
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params as { userId: string };
    await NotificationModel.markAllAsRead(userId);
    res.status(200).json({ success: true, message: 'Đã đánh dấu tất cả thông báo là đã đọc' });
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Lỗi server!', details: error.message });
  }
};

// DELETE /api/notifications/:id
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    await NotificationModel.deleteNotification(parseInt(id));
    res.status(200).json({ success: true, message: 'Đã xoá thông báo' });
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Lỗi server!', details: error.message });
  }
};

// DELETE /api/notifications/user/:userId
export const deleteAllNotifications = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params as { userId: string };
    await NotificationModel.deleteAllNotifications(userId);
    res.status(200).json({ success: true, message: 'Đã xoá tất cả thông báo' });
  } catch (error: any) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({ error: 'Lỗi server!', details: error.message });
  }
};
