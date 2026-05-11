import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

// Mở rộng interface Request của Express để chứa thông tin user
export interface AuthRequest extends Request {
    user?: any;
}

// 1. Middleware kiểm tra Token hợp lệ (Authentication)
export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Lấy token từ header "Bearer <token>"

        if (!token) {
            return res.status(401).json({ success: false, message: 'Không tìm thấy Token xác thực' });
        }

        // Xác thực token bằng Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
        }

        // Gắn thông tin user vào request để các API sau sử dụng
        req.user = user;
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi xác thực máy chủ' });
    }
};

// 2. Middleware kiểm tra Vai trò (Authorization)
export const requireRole = (requiredRole: 'japanese_user' | 'cafe_owner') => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        // Giả định role được lưu trong user_metadata khi người dùng đăng ký
        const userRole = req.user?.user_metadata?.role;

        if (userRole !== requiredRole) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: Bạn không có quyền truy cập vào tài nguyên này'
            });
        }

        next();
    };
};