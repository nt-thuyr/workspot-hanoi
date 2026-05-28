import express from 'express';
import {
  addToFavorites,
  removeFromFavorites,
  getUserFavorites,
  checkIsFavorite,
} from '../controllers/favorite.controller';

const router = express.Router();

router.post('/', addToFavorites); // POST /api/favorites
router.delete('/:cafeId', removeFromFavorites); // DELETE /api/favorites/:cafeId
router.get('/user/:userId', getUserFavorites); // GET /api/favorites/user/:userId
router.get('/user/:userId/check/:cafeId', checkIsFavorite); // GET /api/favorites/user/:userId/check/:cafeId

export default router;
