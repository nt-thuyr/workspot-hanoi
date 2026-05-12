import { Router, Request, Response } from 'express';
import {
  getHomeCafes,
  getCafeDetail,
  getCafesByOwner,
  createCafe,
  updateCafe,
  deleteCafe,
  getMapCafes,
} from '../controllers/cafe.controller';

const router = Router();

// ━━━ READ ━━━

// GET /api/cafes - Danh sách quán (có pagination)
router.get('/', getHomeCafes);

// GET /api/cafes/map - Danh sách quán trên bản đồ (có filter)
router.get('/map', getMapCafes);

// GET /api/cafes/:id - Chi tiết quán
router.get('/:id', getCafeDetail);

// GET /api/cafes/owner/:ownerId - Danh sách quán của owner
router.get('/owner/:ownerId', getCafesByOwner);

// ━━━ CREATE ━━━

// POST /api/cafes - Tạo quán mới (owner)
router.post('/', createCafe);

// ━━━ UPDATE ━━━

// PUT /api/cafes/:id - Cập nhật quán (owner)
router.put('/:id', updateCafe);

// ━━━ DELETE ━━━

// DELETE /api/cafes/:id - Xóa quán (owner)
router.delete('/:id', deleteCafe);

export default router;