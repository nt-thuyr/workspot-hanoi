import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { login, register } from '../controllers/auth.controller';
import { verifyToken, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// ── Rate Limiters ──────────────────────────────────────────────────────
// Giới hạn đăng ký: tối đa 5 tài khoản/IP mỗi 15 phút
const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 phút
    limit: 50,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        success: false,
        message: '登録回数が上限を超えました。15分後に再度お試しください。',
    },
});

// Giới hạn đăng nhập: tối đa 10 lần/IP mỗi 15 phút (chống brute force)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 phút
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        success: false,
        message: 'ログイン失敗回数が上限を超えました。15分後に再度お試しください。',
    },
});

// ==========================================
// API PUBLIC (Không cần token)
// ==========================================
router.post('/login', loginLimiter, login);
router.post('/register', registerLimiter, register);

// ==========================================
// API TEST PHÂN QUYỀN (Yêu cầu token)
// ==========================================

// Route chỉ dành cho Người dùng (Ví dụ: Đặt chỗ)
router.post(
    '/user-booking',
    verifyToken,
    requireRole('japanese_user'),
    (req, res) => {
        res.json({ message: '予約が可能です。' });
    }
);

// Route chỉ dành cho Chủ quán (Ví dụ: Quản lý quán)
router.get(
    '/owner-dashboard',
    verifyToken,
    requireRole('cafe_owner'),
    (req, res) => {
        res.json({ message: 'ダッシュボードデータです。' });
    }
);

export default router;