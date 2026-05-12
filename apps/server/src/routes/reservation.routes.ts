import { Router } from 'express';
import {
  createReservation,
  getUserReservations,
  getCafeReservations,
  updateReservationStatus,
} from '../controllers/reservation.controller';

const router = Router();

// POST /api/reservations - Đặt chỗ (user)
router.post('/', createReservation);

// GET /api/reservations/user/:userId - Lấy danh sách đặt chỗ của user
router.get('/user/:userId', getUserReservations);

// GET /api/reservations/cafe/:cafeId - Lấy danh sách đặt chỗ của quán (owner)
router.get('/cafe/:cafeId', getCafeReservations);

// PUT /api/reservations/:id/status - Cập nhật status (owner)
router.put('/:id/status', updateReservationStatus);

export default router;
