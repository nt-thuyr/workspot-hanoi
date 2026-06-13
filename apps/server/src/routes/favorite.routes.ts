import express from 'express';
import {
  addToFavorites,
  removeFromFavorites,
  getUserFavorites,
  checkIsFavorite,
} from '../controllers/favorite.controller';

import { verifyToken } from '../middlewares/auth.middleware';

const router = express.Router();

router.post('/', verifyToken, addToFavorites); // POST /api/favorites
router.delete('/:cafeId', verifyToken, removeFromFavorites); // DELETE /api/favorites/:cafeId
router.get('/user/:userId', verifyToken, getUserFavorites); // GET /api/favorites/user/:userId
router.get('/user/:userId/check/:cafeId', verifyToken, checkIsFavorite); // GET /api/favorites/user/:userId/check/:cafeId

export default router;
