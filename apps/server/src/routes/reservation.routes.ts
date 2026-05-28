import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
import {
  createReservation,
  getUserReservations,
  getCafeReservations,
  updateReservationStatus,
  getHistory,
  cancelReservationByUser,
} from '../controllers/reservation.controller';

const router = Router();

// POST /api/reservations - Đặt chỗ (user, verifyToken để lấy user_id)
router.post('/', verifyToken, createReservation);

// GET /api/reservations/history - Lấy lịch sử đặt chỗ của user đang đăng nhập
// ⚠️ Phải khai báo TRƯỚC /:id/cancel để tránh Express hiểu "history" là một :id
router.get('/history', verifyToken, getHistory);

// GET /api/reservations/user/:userId - Lấy danh sách đặt chỗ của user (by userId)
router.get('/user/:userId', verifyToken, getUserReservations);

// GET /api/reservations/cafe/:cafeId - Lấy danh sách đặt chỗ của quán (owner)
router.get('/cafe/:cafeId', verifyToken, getCafeReservations);

// PATCH /api/reservations/:id/cancel - Hủy đặt chỗ (guest tự hủy)
router.patch('/:id/cancel', verifyToken, cancelReservationByUser);

// PUT /api/reservations/:id/status - Cập nhật status (owner duyệt/từ chối)
router.put('/:id/status', verifyToken, updateReservationStatus);

export default router;
