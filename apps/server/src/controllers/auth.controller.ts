import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthModel } from '../models/auth.model';

const ROLE_TO_ROLE_ID = {
    japanese_user: 1,
    cafe_owner: 2,
} as const;

type RegisterRole = keyof typeof ROLE_TO_ROLE_ID;

const isRegisterRole = (role: unknown): role is RegisterRole => {
    return role === 'japanese_user' || role === 'cafe_owner';
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu' });
        }

        // Gọi hàm đăng nhập của Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
        }

        // Trả về session (chứa access_token) và thông tin user
        res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
                session: data.session,
                user: {
                    id: data.user.id,
                    email: data.user.email,
                    role: data.user.user_metadata?.role || 'japanese_user'
                }
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server khi đăng nhập' });
    }
};
export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ email, mật khẩu và vai trò.',
            });
        }

        if (!isRegisterRole(role)) {
            return res.status(400).json({
                success: false,
                message: 'Vai trò không hợp lệ. Chỉ chấp nhận japanese_user hoặc cafe_owner.',
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const fullName = typeof name === 'string' ? name.trim() : '';

        // Dùng Admin API để tạo user với email đã xác thực ngay (không gửi email → tránh rate limit)
        const { data, error } = await supabase.auth.admin.createUser({
            email: normalizedEmail,
            password,
            email_confirm: true,   // ← xác nhận email ngay, không cần gửi mail
            user_metadata: {
                name: fullName || null,
                role,
            }
        });

        if (error || !data.user) {
            return res.status(400).json({
                success: false,
                message: error?.message || 'Không thể tạo tài khoản mới.',
            });
        }

        try {
            await AuthModel.createProfile({
                id: data.user.id,
                role_id: ROLE_TO_ROLE_ID[role],
                full_name: fullName || null,
                avatar_url: null,
            });
        } catch (profileError) {
            await supabase.auth.admin.deleteUser(data.user.id);

            console.error('Error creating profile after sign up:', profileError);
            return res.status(500).json({
                success: false,
                message: 'Đã tạo tài khoản nhưng không thể tạo profile. Vui lòng thử lại.',
            });
        }

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công! Vui lòng đăng nhập.',
            data: {
                user: {
                    id: data.user.id,
                    email: data.user.email,
                    role,
                    full_name: fullName || null,
                },
            },
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server nội bộ khi đăng ký.' });
    }
};