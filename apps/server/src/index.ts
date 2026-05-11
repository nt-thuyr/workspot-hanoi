import express from 'express';
import cors from 'cors';
import { CafeModel } from './models/cafe.model';
import authRoutes from './routes/auth.routes';
import cafeRoutes from './routes/cafe.routes';

const app = express();
app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
  res.send('Chào Liêm! Backend WorkSpot HaNoi đã sẵn sàng phục vụ khách Nhật!');
});
// API đăng nhập và phân quyền
app.use('/api/auth', authRoutes);
app.use('/api/cafes', cafeRoutes);
// API lấy danh sách quán cafe cho Trang chủ
app.get('/api/cafes', async (req, res) => {
  try {
    const cafes = await CafeModel.getHomeCafes();
    res.json(cafes);
  } catch (error) {
    console.error('Error fetching cafes:', error);
    res.status(500).json({ error: 'Lỗi server rồi Liêm ơi!', details: (error as any).message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Backend WorkSpot HaNoi đang chạy tại http://localhost:${PORT}`);
});