import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.routes';
import cafeRoutes from './routes/cafe.routes';
import amenitiesRoutes from './routes/amenities.routes';
import cafeImagesRoutes from './routes/cafe_images.routes';
import cafeAmenitiesRoutes from './routes/cafe_amenities.routes';
import profileRoutes from './routes/profile.routes';
import reservationRoutes from './routes/reservation.routes';
import reviewRoutes from './routes/review.routes';
import favoriteRoutes from './routes/favorite.routes';
import notificationRoutes from './routes/notification.routes';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Chào Liêm! Backend WorkSpot HaNoi đã sẵn sàng phục vụ khách Nhật!');
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/cafes', cafeRoutes);
app.use('/api/amenities', amenitiesRoutes);
app.use('/api/cafes', cafeImagesRoutes);
app.use('/api/cafes', cafeAmenitiesRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/notifications', notificationRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend WorkSpot HaNoi đang chạy tại http://localhost:${PORT}`);
});