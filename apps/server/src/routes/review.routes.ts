import express from 'express';
import multer from 'multer';
import {
  createReview,
  getCafeReviews,
  getUserReviews,
  createReviewImage,
  getReviewImages,
} from '../controllers/review.controller';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
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
router.post('/', createReview); // POST /api/reviews
router.get('/cafe/:cafeId', getCafeReviews); // GET /api/reviews/cafe/:cafeId
router.get('/user/:userId', getUserReviews); // GET /api/reviews/user/:userId

// Review Images
router.post(
  '/:reviewId/images',
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    upload.array('images')(req, res, (err: any) => {
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
