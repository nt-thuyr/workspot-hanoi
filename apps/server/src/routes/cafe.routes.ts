import { Router, Request, Response } from 'express';
import { CafeModel } from '../models/cafe.model';
import { getMapCafes } from '../controllers/cafe.controller';

const router = Router();

// Route lấy danh sách hiển thị trên Bản Đồ (Có filter và tính khoảng cách)
router.get('/map', getMapCafes);

// Route mặc định cho Trang Chủ (Đã có sẵn trong file index gốc, chuyển qua đây cho gọn)
router.get('/', async (req: Request, res: Response) => {
    try {
        const cafes = await CafeModel.getHomeCafes();
        res.json(cafes);
    } catch (error: any) {
        console.error('Error fetching cafes:', error);
        res.status(500).json({ error: 'Lỗi server rồi Liêm ơi!', details: error.message });
    }
});

export default router;