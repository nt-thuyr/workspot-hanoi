import { Router } from 'express';
import { login, register } from '../controllers/auth.controller';
import { verifyToken, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// ==========================================
// API PUBLIC (Không cần token)
// ==========================================
router.post('/login', login);
router.post('/register', register);

// ==========================================
// API TEST PHÂN QUYỀN (Yêu cầu token)
// ==========================================

// Route chỉ dành cho Người dùng (Ví dụ: Đặt chỗ)
router.post(
    '/user-booking',
    verifyToken,
    requireRole('japanese_user'),
    (req, res) => {
        res.json({ message: 'Chào người dùng, bạn có thể đặt chỗ!' });
    }
);

// Route chỉ dành cho Chủ quán (Ví dụ: Quản lý quán)
router.get(
    '/owner-dashboard',
    verifyToken,
    requireRole('cafe_owner'),
    (req, res) => {
        res.json({ message: 'Chào chủ quán, đây là dữ liệu Dashboard của bạn!' });
    }
);

export default router;