import express from 'express';
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getMyNotifications,
  markMyNotificationAsRead,
} from '../controllers/notification.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = express.Router();

// ── Token-based routes (dùng bởi NotificationDropdown frontend) ──────────
// GET  /api/notifications        → lấy thông báo của user hiện tại qua token
// PUT  /api/notifications/:id/read → đánh dấu đã đọc qua token
router.get('/', verifyToken, getMyNotifications);
router.put('/:id/read', verifyToken, markMyNotificationAsRead);

// ── UserId-based routes (legacy / admin) ─────────────────────────────────
router.get('/user/:userId', verifyToken, getUserNotifications);
router.get('/user/:userId/unread-count', verifyToken, getUnreadCount);
router.put('/:id/mark-as-read', verifyToken, markAsRead);
router.put('/user/:userId/mark-all-as-read', verifyToken, markAllAsRead);
router.delete('/:id', verifyToken, deleteNotification);
router.delete('/user/:userId', verifyToken, deleteAllNotifications);

export default router;
