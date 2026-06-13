import { Request, Response } from 'express';
import { FavoriteModel } from '../models/favorite.model';
import { AuthRequest } from '../middlewares/auth.middleware';

// POST /api/favorites - Thêm café vào yêu thích
export const addToFavorites = async (req: AuthRequest, res: Response) => {
  try {
    const { cafe_id } = req.body;
    const user_id = req.user?.id;

    if (!user_id || !cafe_id) {
      return res.status(400).json({
        success: false,
        message: 'ユーザーIDまたはカフェIDが不足しています',
      });
    }

    // Check if already favorited
    const isFav = await FavoriteModel.isFavorite(user_id, cafe_id);
    if (isFav) {
      return res.status(400).json({
        success: false,
        message: 'このカフェは既にお気に入りに登録されています',
      });
    }

    const favorite = await FavoriteModel.addToFavorites(user_id, cafe_id);

    res.status(201).json({ success: true, data: favorite });
  } catch (error: any) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({ error: 'サーバーエラー!', details: error.message });
  }
};

// DELETE /api/favorites/:cafeId - Xoá café khỏi yêu thích
export const removeFromFavorites = async (req: AuthRequest, res: Response) => {
  try {
    const { cafeId } = req.params as { cafeId: string };
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'ユーザーIDが不足しています',
      });
    }

    await FavoriteModel.removeFromFavorites(user_id, cafeId);

    res.status(200).json({
      success: true,
      message: 'お気に入りから削除されました',
    });
  } catch (error: any) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({ error: 'サーバーエラー!', details: error.message });
  }
};

// GET /api/favorites/user/:userId - Lấy danh sách yêu thích của user
export const getUserFavorites = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params as { userId: string };
    const authUserId = req.user?.id;

    if (authUserId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'アクセス権限がありません',
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const { data, count } = await FavoriteModel.getUserFavorites(userId, page, limit);

    res.status(200).json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching user favorites:', error);
    res.status(500).json({ error: 'サーバーエラー!', details: error.message });
  }
};

// GET /api/favorites/user/:userId/check/:cafeId - Check nếu user đã like café
export const checkIsFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, cafeId } = req.params as { userId: string; cafeId: string };
    const authUserId = req.user?.id;

    if (authUserId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'アクセス権限がありません',
      });
    }

    const isFav = await FavoriteModel.isFavorite(userId, cafeId);

    res.status(200).json({
      success: true,
      isFavorite: isFav,
    });
  } catch (error: any) {
    console.error('Error checking favorite:', error);
    res.status(500).json({ error: 'サーバーエラー!', details: error.message });
  }
};
