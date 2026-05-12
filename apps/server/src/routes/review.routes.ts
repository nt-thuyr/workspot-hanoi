import express from 'express';
import {
  createReview,
  getCafeReviews,
  getUserReviews,
  createReviewImage,
  getReviewImages,
} from '../controllers/review.controller';

const router = express.Router();

// Reviews
router.post('/', createReview); // POST /api/reviews
router.get('/cafe/:cafeId', getCafeReviews); // GET /api/reviews/cafe/:cafeId
router.get('/user/:userId', getUserReviews); // GET /api/reviews/user/:userId

// Review Images
router.post('/:reviewId/images', createReviewImage); // POST /api/reviews/:reviewId/images
router.get('/:reviewId/images', getReviewImages); // GET /api/reviews/:reviewId/images

export default router;
