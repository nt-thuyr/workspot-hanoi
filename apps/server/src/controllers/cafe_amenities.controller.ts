import { Request, Response } from 'express';
import { CafeAmenitiesModel } from '../models/cafe_amenities.model';

// POST /api/cafes/:cafeId/amenities - Gán amenity (owner)
export const createCafeAmenity = async (req: Request, res: Response) => {
  try {
    const { cafeId } = req.params as { cafeId: string };
    const { amenityId, owner_id } = req.body;

    if (!amenityId) {
      return res.status(400).json({
        success: false,
        message: 'アメニティIDが不足しています',
      });
    }

    // Kiểm tra owner
    const isOwner = await CafeAmenitiesModel.isOwner(cafeId, owner_id);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'このカフェにアメニティを追加する権限がありません',
      });
    }

    const amenity = await CafeAmenitiesModel.createCafeAmenity(cafeId, amenityId);

    res.status(201).json({ success: true, data: amenity });
  } catch (error: any) {
    console.error('Error creating cafe amenity:', error);
    res.status(500).json({ error: 'Lỗi server!', details: error.message });
  }
};

// GET /api/cafes/:cafeId/amenities - Lấy amenities của café
export const getCafeAmenities = async (req: Request, res: Response) => {
  try {
    const { cafeId } = req.params as { cafeId: string };
    const amenities = await CafeAmenitiesModel.getCafeAmenities(cafeId);

    res.status(200).json({
      success: true,
      data: amenities,
      count: amenities.length,
    });
  } catch (error: any) {
    console.error('Error fetching cafe amenities:', error);
    res.status(500).json({ error: 'Lỗi server!', details: error.message });
  }
};

// DELETE /api/cafes/:cafeId/amenities/:amenityId - Bỏ amenity (owner)
export const deleteCafeAmenity = async (req: Request, res: Response) => {
  try {
    const { cafeId, amenityId } = req.params as { cafeId: string; amenityId: string };
    const { owner_id } = req.body;

    // Kiểm tra owner
    const isOwner = await CafeAmenitiesModel.isOwner(cafeId, owner_id);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'このカフェのアメニティを削除する権限がありません',
      });
    }

    await CafeAmenitiesModel.deleteCafeAmenity(cafeId, parseInt(amenityId));

    res.status(200).json({ success: true, message: 'Tiện ích đã bị xóa' });
  } catch (error: any) {
    console.error('Error deleting cafe amenity:', error);
    res.status(500).json({ error: 'Lỗi server!', details: error.message });
  }
};
