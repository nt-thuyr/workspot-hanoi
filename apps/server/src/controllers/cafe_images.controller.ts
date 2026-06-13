import { Request, Response } from 'express';
import { CafeImagesModel } from '../models/cafe_images.model';
import { CafeModel } from '../models/cafe.model';
import { AuthRequest } from '../middlewares/auth.middleware';

// POST /api/cafes/:cafeId/images - Upload ảnh (owner)
export const createCafeImage = async (req: AuthRequest, res: Response) => {
  try {
    const { cafeId } = req.params as { cafeId: string };
    const { imageUrl, imageType = 'INTERIOR' } = req.body;
    const owner_id = req.user?.id;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: '画像URLが不足しています',
      });
    }

    if (!owner_id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Kiểm tra owner
    const isOwner = await CafeModel.isOwner(cafeId, owner_id);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'このカフェに画像をアップロードする権限がありません',
      });
    }

    const image = await CafeImagesModel.createCafeImage(cafeId, imageUrl, imageType);

    res.status(201).json({ success: true, data: image });
  } catch (error: any) {
    console.error('Error creating cafe image:', error);
    res.status(500).json({ error: 'サーバーエラー!', details: error.message });
  }
};

// GET /api/cafes/:cafeId/images - Lấy ảnh của café
export const getCafeImages = async (req: Request, res: Response) => {
  try {
    const { cafeId } = req.params as { cafeId: string };
    const images = await CafeImagesModel.getCafeImages(cafeId);

    res.status(200).json({
      success: true,
      data: images,
      count: images.length,
    });
  } catch (error: any) {
    console.error('Error fetching cafe images:', error);
    res.status(500).json({ error: 'サーバーエラー!', details: error.message });
  }
};

// DELETE /api/cafes/images/:imageId - Xóa ảnh (owner)
export const deleteCafeImage = async (req: AuthRequest, res: Response) => {
  try {
    const { imageId } = req.params as { imageId: string };
    const owner_id = req.user?.id;

    if (!owner_id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Kiểm tra owner
    const isOwner = await CafeImagesModel.isOwner(parseInt(imageId), owner_id);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'この画像を削除する権限がありません',
      });
    }

    await CafeImagesModel.deleteCafeImage(parseInt(imageId));

    res.status(200).json({ success: true, message: 'Ảnh đã bị xóa' });
  } catch (error: any) {
    console.error('Error deleting cafe image:', error);
    res.status(500).json({ error: 'サーバーエラー!', details: error.message });
  }
};
