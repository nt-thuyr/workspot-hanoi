import { Router, Request, Response } from 'express';
import multer from 'multer';
import {
  getHomeCafes,
  getCafeDetail,
  getCafesByOwner,
  createCafe,
  updateCafe,
  deleteCafe,
  getMapCafes,
} from '../controllers/cafe.controller';
import { verifyToken } from '../middlewares/auth.middleware';

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    console.log('[Multer] File received:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      console.log('[Multer] File accepted');
      cb(null, true);
    } else {
      console.log('[Multer] File rejected - invalid MIME type:', file.mimetype);
      cb(new Error(`Invalid file type: ${file.mimetype}. Only JPEG, PNG, and WebP are allowed`));
    }
  },
});

const router = Router();

// ━━━ READ ━━━

// GET /api/cafes - Danh sách quán (có pagination)
router.get('/', getHomeCafes);

// GET /api/cafes/map - Danh sách quán trên bản đồ (có filter)
router.get('/map', getMapCafes);

// GET /api/cafes/:id - Chi tiết quán
router.get('/:id', getCafeDetail);

// GET /api/cafes/owner/:ownerId - Danh sách quán của owner
router.get('/owner/:ownerId', verifyToken, getCafesByOwner);

// ━━━ CREATE ━━━

// POST /api/cafes - Tạo quán mới (owner) - Với file upload
router.post(
  '/',
  verifyToken,
  (req: Request, res: Response, next: any) => {
    upload.fields([
      { name: 'coverImage', maxCount: 1 },
      { name: 'menuImages', maxCount: 10 },
    ])(req, res, (err: any) => {
      if (err) {
        console.error('[Route POST /cafes] Multer error:', err.message);
        return res.status(400).json({
          success: false,
          message: `File upload error: ${err.message}`,
        });
      }
      next();
    });
  },
  createCafe
);

// ━━━ UPDATE ━━━

// PUT /api/cafes/:id - Cập nhật quán (owner)
router.put(
  '/:id',
  verifyToken,
  (req: Request, res: Response, next: any) => {
    upload.fields([
      { name: 'coverImage', maxCount: 1 },
      { name: 'menuImages', maxCount: 10 },
    ])(req, res, (err: any) => {
      if (err) {
        console.error('[Route PUT /cafes] Multer error:', err.message);
        return res.status(400).json({
          success: false,
          message: `File upload error: ${err.message}`,
        });
      }
      next();
    });
  },
  updateCafe
);

// ━━━ DELETE ━━━

// DELETE /api/cafes/:id - Xóa quán (owner)
router.delete('/:id', verifyToken, deleteCafe);

export default router;