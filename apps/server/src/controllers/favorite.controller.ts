import { Request, Response } from 'express';
import { FavoriteModel } from '../models/favorite.model';

// POST /api/favorites - Thêm café vào yêu thích
export const addToFavorites = async (req: Request, res: Response) => {
  try {
    const { user_id, cafe_id } = req.body;

    if (!user_id || !cafe_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing user_id or cafe_id',
      });
    }

    // Check if already favorited
    const isFav = await FavoriteModel.isFavorite(user_id, cafe_id);
    if (isFav) {
      return res.status(400).json({
        success: false,
        message: 'Café này đã trong danh sách yêu thích',
      });
    }

    const favorite = await FavoriteModel.addToFavorites(user_id, cafe_id);

    res.status(201).json({ success: true, data: favorite });
  } catch (error: any) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({ error: 'Lỗi server!', details: error.message });
  }
};

// DELETE /api/favorites/:cafeId - Xoá café khỏi yêu thích
export const removeFromFavorites = async (req: Request, res: Response) => {
  try {
    const { cafeId } = req.params as { cafeId: string };
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing user_id',
      });
    }

    await FavoriteModel.removeFromFavorites(user_id, cafeId);

    res.status(200).json({
      success: true,
      message: 'Đã xoá khỏi danh sách yêu thích',
    });
  } catch (error: any) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({ error: 'Lỗi server!', details: error.message });
  }
};

// GET /api/favorites/user/:userId - Lấy danh sách yêu thích của user
export const getUserFavorites = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params as { userId: string };
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
    res.status(500).json({ error: 'Lỗi server!', details: error.message });
  }
};

// GET /api/favorites/user/:userId/check/:cafeId - Check nếu user đã like café
export const checkIsFavorite = async (req: Request, res: Response) => {
  try {
    const { userId, cafeId } = req.params as { userId: string; cafeId: string };

    const isFav = await FavoriteModel.isFavorite(userId, cafeId);

    res.status(200).json({
      success: true,
      isFavorite: isFav,
    });
  } catch (error: any) {
    console.error('Error checking favorite:', error);
    res.status(500).json({ error: 'Lỗi server!', details: error.message });
  }
};
