import { Request, Response } from 'express';
import { ProfileModel } from '../models/profile.model';
import { uploadImageToSupabase } from '../utils/imageUpload';

// GET /api/profiles/:userId - Lấy profile
export const getProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params as { userId: string };
    const profile = await ProfileModel.getProfile(userId);

    if (!profile) {
      return res.status(404).json({ success: false, message: 'プロフィールが見つかりません' });
    }

    res.status(200).json({ success: true, data: profile });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'サーバーエラー!', details: error.message });
  }
};

// PUT /api/profiles/:userId - Cập nhật profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params as { userId: string };
    const { full_name, avatar_url } = req.body;

    // Kiểm tra quyền - chỉ có thể sửa profile của mình
    const authUserId = (req as any).user?.id; // Giả sử middleware auth set req.user
    if (authUserId && authUserId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'このプロフィールを編集する権限がありません',
      });
    }

    const updates: any = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;

    // Nếu có file được tải lên, thực hiện upload lên Supabase Storage
    if (req.file) {
      try {
        const uploadedUrl = await uploadImageToSupabase(req.file, 'cafe-images', 'avatars');
        updates.avatar_url = uploadedUrl;
      } catch (uploadErr: any) {
        return res.status(400).json({
          success: false,
          message: `アバターをアップロードできません: ${uploadErr.message}`,
        });
      }
    }

    const profile = await ProfileModel.updateProfile(userId, updates);

    res.status(200).json({ success: true, data: profile });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'サーバーエラー!', details: error.message });
  }
};
