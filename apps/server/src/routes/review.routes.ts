import express from 'express';
import multer from 'multer';
import {
  createReview,
  getCafeReviews,
  getUserReviews,
  createReviewImage,
  getReviewImages,
  deleteReview,
} from '../controllers/review.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max per file
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only JPEG, PNG, and WebP are allowed`));
    }
  },
});

const router = express.Router();

// Reviews
router.post('/', verifyToken, createReview); // POST /api/reviews — requires auth
router.get('/cafe/:cafeId', getCafeReviews); // GET /api/reviews/cafe/:cafeId — public
router.get('/user/:userId', getUserReviews); // GET /api/reviews/user/:userId — public
router.delete('/:reviewId', verifyToken, deleteReview); // DELETE /api/reviews/:reviewId — requires auth

// Review Images (max 3 images per review)
router.post(
  '/:reviewId/images',
  verifyToken,
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    upload.array('images', 3)(req, res, (err: any) => {
      if (err) {
        console.error('[Route POST /reviews/:reviewId/images] Multer error:', err.message);
        return res.status(400).json({
          success: false,
          message: `File upload error: ${err.message}`,
        });
      }
      next();
    });
  },
  createReviewImage
);
router.get('/:reviewId/images', getReviewImages); // GET /api/reviews/:reviewId/images

export default router;
