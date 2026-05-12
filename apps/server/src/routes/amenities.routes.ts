import { Router } from 'express';
import { getAllAmenities, getAmenityById } from '../controllers/amenities.controller';

const router = Router();

// GET /api/amenities - Lấy danh sách tất cả amenities
router.get('/', getAllAmenities);

// GET /api/amenities/:id - Lấy amenity theo ID
router.get('/:id', getAmenityById);

export default router;
