import { Router } from 'express';
import { createCafeAmenity, getCafeAmenities, deleteCafeAmenity } from '../controllers/cafe_amenities.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/cafes/:cafeId/amenities - Gán amenity (owner)
router.post('/:cafeId/amenities', verifyToken, createCafeAmenity);

// GET /api/cafes/:cafeId/amenities - Lấy amenities của café
router.get('/:cafeId/amenities', getCafeAmenities);

// DELETE /api/cafes/:cafeId/amenities/:amenityId - Bỏ amenity (owner)
router.delete('/:cafeId/amenities/:amenityId', verifyToken, deleteCafeAmenity);

export default router;
