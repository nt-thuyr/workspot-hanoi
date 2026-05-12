import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/profile.controller';

const router = Router();

// GET /api/profiles/:userId - Lấy profile
router.get('/:userId', getProfile);

// PUT /api/profiles/:userId - Cập nhật profile
router.put('/:userId', updateProfile);

export default router;
