import { Request, Response } from 'express';
import { AmenitiesModel } from '../models/amenities.model';

// GET /api/amenities - Lấy danh sách tất cả amenities
export const getAllAmenities = async (req: Request, res: Response) => {
  try {
    const amenities = await AmenitiesModel.getAllAmenities();
    res.status(200).json({
      success: true,
      data: amenities,
      count: amenities.length,
    });
  } catch (error: any) {
    console.error('Error fetching amenities:', error);
    res.status(500).json({ error: 'Lỗi server!', details: error.message });
  }
};

// GET /api/amenities/:id - Lấy amenity theo ID
export const getAmenityById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const amenity = await AmenitiesModel.getAmenityById(parseInt(id));

    if (!amenity) {
      return res.status(404).json({ success: false, message: 'アメニティが見つかりません' });
    }

    res.status(200).json({ success: true, data: amenity });
  } catch (error: any) {
    console.error('Error fetching amenity:', error);
    res.status(500).json({ error: 'Lỗi server!', details: error.message });
  }
};
