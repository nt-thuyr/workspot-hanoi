import express from 'express';
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from '../controllers/notification.controller';

const router = express.Router();

router.get('/user/:userId', getUserNotifications); // GET /api/notifications/user/:userId
router.get('/user/:userId/unread-count', getUnreadCount); // GET /api/notifications/user/:userId/unread-count
router.put('/:id/mark-as-read', markAsRead); // PUT /api/notifications/:id/mark-as-read
router.put('/user/:userId/mark-all-as-read', markAllAsRead); // PUT /api/notifications/user/:userId/mark-all-as-read
router.delete('/:id', deleteNotification); // DELETE /api/notifications/:id
router.delete('/user/:userId', deleteAllNotifications); // DELETE /api/notifications/user/:userId

export default router;
