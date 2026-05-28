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
router.get('/user/:userId', getUserNotifications);
router.get('/user/:userId/unread-count', getUnreadCount);
router.put('/:id/mark-as-read', markAsRead);
router.put('/user/:userId/mark-all-as-read', markAllAsRead);
router.delete('/:id', deleteNotification);
router.delete('/user/:userId', deleteAllNotifications);

export default router;
