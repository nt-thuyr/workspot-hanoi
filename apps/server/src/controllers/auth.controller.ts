import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

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

        // Validate cơ bản
        if (!email || !password || !name) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin (Tên, Email, Mật khẩu).' });
        }

        // Gọi hàm signUp của Supabase, lưu thêm name và role vào user_metadata
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: name,
                    role: role,
                }
            }
        });

        if (error) {
            return res.status(400).json({ success: false, message: error.message });
        }

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công! Vui lòng đăng nhập.',
            data
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server nội bộ khi đăng ký.' });
    }
};