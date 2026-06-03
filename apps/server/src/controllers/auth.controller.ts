import { Request, Response } from 'express';
import { supabase, supabaseAuth } from '../config/supabase';

const mapSupabaseAuthError = (error: any): string => {
  const message = error?.message || '';

  const errorMap: Record<string, string> = {
    'User already registered': 'このメールアドレスは既に登録されています',
    'Password should be at least 6 characters': 'パスワードは6文字以上で入力してください',
  };

  if (message.includes('Invalid email') || message.includes('Unable to validate')) {
    return '有効なメールアドレスを入力してください';
  }

  return errorMap[message] || 'アカウント作成中にエラーが発生しました。もう一度お試しください。';
};

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
            return res.status(400).json({ success: false, message: 'メールアドレスとパスワードを入力してください' });
        }

        // Dùng supabaseAuth (client riêng) để tránh user session ghi đè lên supabase admin client
        const { data, error } = await supabaseAuth.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return res.status(401).json({ success: false, message: 'メールアドレスまたはパスワードが正しくありません' });
        }

        // supabase admin client を使用してプロファイルを取得する (service_role、RLSの影響を受けない)
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', data.user.id)
            .single();

        res.status(200).json({
            success: true,
            message: 'ログインに成功しました',
            data: {
                session: data.session,
                user: {
                    id: data.user.id,
                    email: data.user.email,
                    role: data.user.user_metadata?.role || 'japanese_user',
                    full_name: profile?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'ユーザー',
                    avatar_url: profile?.avatar_url || null
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'サーバーエラーが発生しました' });
    }
};

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name, role, latitude, longitude } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'メールアドレス、パスワード、役割をすべて入力してください。',
            });
        }

        if (!isRegisterRole(role)) {
            return res.status(400).json({
                success: false,
                message: '無効な役割です。japanese_user または cafe_owner のみ受け付けます。',
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const fullName = typeof name === 'string' ? name.trim() : '';

        // supabase admin client を使用する — このクライアントで signInWithPassword を絶対に呼び出さないこと
        // Profile sẽ được tạo tự động qua Supabase trigger on_auth_user_created
        const { data, error } = await supabase.auth.admin.createUser({
            email: normalizedEmail,
            password,
            email_confirm: true,
            user_metadata: {
                name: fullName || null,
                role,
                latitude: latitude || null,
                longitude: longitude || null,
            }
        });

        if (error || !data.user) {
            return res.status(400).json({
                success: false,
                message: mapSupabaseAuthError(error),
            });
        }

        res.status(201).json({
            success: true,
            message: '登録に成功しました！ログインしてください。',
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
        res.status(500).json({ success: false, message: 'サーバー内部エラーが発生しました。' });
    }
};