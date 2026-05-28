import { Router } from 'express';
import multer from 'multer';
import { getProfile, updateProfile } from '../controllers/profile.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only JPEG, PNG, and WebP are allowed`));
    }
  },
});

const router = Router();

// GET /api/profiles/:userId - Lấy profile
router.get('/:userId', getProfile);

// PUT /api/profiles/:userId - Cập nhật profile
router.put('/:userId', verifyToken, upload.single('avatar'), updateProfile);

export default router;
