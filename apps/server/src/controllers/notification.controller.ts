import { Request, Response } from 'express';
import { NotificationModel } from '../models/notification.model';

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

// GET /api/notifications/user/:userId/unread-count - Lấy số lượng thông báo chưa đọc
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params as { userId: string };
    const unreadCount = await NotificationModel.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error: any) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Lỗi server!', details: error.message });
  }
};

// PUT /api/notifications/:id/mark-as-read - Đánh dấu thông báo là đã đọc
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const notification = await NotificationModel.markAsRead(parseInt(id));

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Lỗi server!', details: error.message });
  }
};

// PUT /api/notifications/user/:userId/mark-all-as-read - Đánh dấu tất cả thông báo là đã đọc
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params as { userId: string };
    await NotificationModel.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: 'Đã đánh dấu tất cả thông báo là đã đọc',
    });
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Lỗi server!', details: error.message });
  }
};

// DELETE /api/notifications/:id - Xoá một thông báo
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    await NotificationModel.deleteNotification(parseInt(id));

    res.status(200).json({
      success: true,
      message: 'Đã xoá thông báo',
    });
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Lỗi server!', details: error.message });
  }
};

// DELETE /api/notifications/user/:userId - Xoá tất cả thông báo của user
export const deleteAllNotifications = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params as { userId: string };
    await NotificationModel.deleteAllNotifications(userId);

    res.status(200).json({
      success: true,
      message: 'Đã xoá tất cả thông báo',
    });
  } catch (error: any) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({ error: 'Lỗi server!', details: error.message });
  }
};
