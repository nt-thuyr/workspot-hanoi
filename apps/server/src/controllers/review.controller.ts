import { Request, Response } from 'express';
import { CafeModel } from '../models/cafe.model';
import { NotificationModel } from '../models/notification.model';
import { ProfileModel } from '../models/profile.model';
import { ReviewModel, ReviewImagesModel } from '../models/review.model';
import { uploadImageToSupabase } from '../utils/imageUpload';
import { AuthRequest } from '../middlewares/auth.middleware';

// POST /api/reviews - Viết review (user)
export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const { cafe_id, rating, comment } = req.body;

    // Use authenticated user id from token (ignore client-sent user_id for security)
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!cafe_id || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: '必須項目が不足しているか、評価が無効です（1〜5）',
      });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: 'レビューコメントは必須です',
      });
    }

    const review = await ReviewModel.createReview(user_id, cafe_id, rating, comment.trim());

    try {
      const [profile, cafe] = await Promise.all([
        ProfileModel.getProfile(user_id).catch(() => null),
        CafeModel.getCafeOwnerInfo(cafe_id).catch(() => null),
      ]);

      if (cafe?.owner_id) {
        const reviewerName = profile?.full_name || 'お客様';
        // Lấy đoạn trích 30 ký tự đầu tiên của comment, thêm "..." nếu dài hơn
        const commentSnippet = comment.trim().length > 30
          ? comment.trim().slice(0, 30) + '...'
          : comment.trim();
        await NotificationModel.createNotification({
          user_id: cafe.owner_id,
          title: `${reviewerName}がレビューを投稿しました`,
          content: `${cafe.name || 'カフェ名未設定'}・${rating}★・${commentSnippet}`,
        });
      }
    } catch (notificationError) {
      console.error('Failed to create review notification:', notificationError);
    }

    res.status(201).json({ success: true, data: review });
  } catch (error: any) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'サーバーエラー!', details: error.message });
  }
};

// GET /api/reviews/cafe/:cafeId - Lấy reviews của café
export const getCafeReviews = async (req: Request, res: Response) => {
  try {
    const { cafeId } = req.params as { cafeId: string };
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const { data, count } = await ReviewModel.getCafeReviews(cafeId, page, limit);

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
    console.error('Error fetching cafe reviews:', error);
    res.status(500).json({ error: 'サーバーエラー!', details: error.message });
  }
};

// GET /api/reviews/user/:userId - Lấy reviews của user
export const getUserReviews = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params as { userId: string };
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const { data, count } = await ReviewModel.getUserReviews(userId, page, limit);

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
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ error: 'サーバーエラー!', details: error.message });
  }
};

// POST /api/reviews/:reviewId/images - Thêm ảnh cho review (user)
export const createReviewImage = async (req: AuthRequest, res: Response) => {
  try {
    const { reviewId } = req.params as { reviewId: string };
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Check ownership
    // Note: A better way would be a direct query, but let's use supabase directly here
    const { supabase } = await import('../config/supabase.js');
    const { data: existingReview, error: fetchError } = await supabase
      .from('reviews')
      .select('user_id')
      .eq('id', reviewId)
      .single();

    if (fetchError || !existingReview) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (existingReview.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'You can only upload images to your own reviews' });
    }

    // Check if files were uploaded via multer
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      console.log(`[createReviewImage] Uploading ${files.length} images to Supabase...`);
      const createdImages = [];
      for (const file of files) {
        const imageUrl = await uploadImageToSupabase(file, 'cafe-images', 'reviews');
        const imageRecord = await ReviewImagesModel.createReviewImage(parseInt(reviewId), imageUrl);
        createdImages.push(imageRecord);
      }
      return res.status(201).json({ success: true, data: createdImages });
    }

    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: '画像URLまたはファイルが不足しています',
      });
    }

    const image = await ReviewImagesModel.createReviewImage(parseInt(reviewId), imageUrl);

    res.status(201).json({ success: true, data: image });
  } catch (error: any) {
    console.error('Error creating review image:', error);
    res.status(500).json({ error: 'サーバーエラー!', details: error.message });
  }
};

// GET /api/reviews/:reviewId/images - Lấy ảnh của review
export const getReviewImages = async (req: AuthRequest, res: Response) => {
  try {
    const { reviewId } = req.params as { reviewId: string };
    const images = await ReviewImagesModel.getReviewImages(parseInt(reviewId));

    res.status(200).json({
      success: true,
      data: images,
      count: images.length,
    });
  } catch (error: any) {
    console.error('Error fetching review images:', error);
    res.status(500).json({ error: 'サーバーエラー!', details: error.message });
  }
};

// DELETE /api/reviews/:reviewId - Xóa review (chỉ chủ sở hữu)
export const deleteReview = async (req: AuthRequest, res: Response) => {
  try {
    const { reviewId } = req.params as { reviewId: string };
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const result = await ReviewModel.deleteReview(parseInt(reviewId), userId);

    if (!result.success) {
      if (result.reason === 'not_found') {
        return res.status(404).json({ success: false, message: 'Review not found' });
      }
      if (result.reason === 'forbidden') {
        return res.status(403).json({ success: false, message: 'You can only delete your own reviews' });
      }
    }

    res.status(200).json({ success: true, message: 'Review deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'サーバーエラー!', details: error.message });
  }
};
