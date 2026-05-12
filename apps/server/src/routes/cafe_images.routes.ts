import { Router } from 'express';
import { createCafeImage, getCafeImages, deleteCafeImage } from '../controllers/cafe_images.controller';

const router = Router();

// POST /api/cafes/:cafeId/images - Upload ảnh (owner)
router.post('/:cafeId/images', createCafeImage);

// GET /api/cafes/:cafeId/images - Lấy ảnh của café
router.get('/:cafeId/images', getCafeImages);

// DELETE /api/cafes/images/:imageId - Xóa ảnh (owner)
router.delete('/images/:imageId', deleteCafeImage);

export default router;
