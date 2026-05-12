import { Request, Response } from 'express';
import { CafeModel } from '../models/cafe.model';

// --- UTILS TÍNH TOÁN KHOẢNG CÁCH ---
const deg2rad = (deg: number) => deg * (Math.PI / 180);

const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Bán kính trái đất tính bằng km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// --- UTILS KIỂM TRA GIỜ MỞ CỬA ---
const checkIsOpen = (openTime: string, closeTime: string) => {
    if (!openTime || !closeTime) return false;
    const now = new Date();
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return currentTimeStr >= openTime && currentTimeStr <= closeTime;
};

// ━━━ READ ━━━

// GET /api/cafes - Lấy danh sách quán (có pagination)
export const getHomeCafes = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const { data, count } = await CafeModel.getHomeCafes(page, limit);

        res.status(200).json({
            success: true,
            data,
            pagination: {
                page,
                limit,
                total: count,
                pages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error: any) {
        console.error('Error fetching cafes:', error);
        res.status(500).json({ error: 'Lỗi server!', details: error.message });
    }
};

// GET /api/cafes/:id - Lấy chi tiết quán
export const getCafeDetail = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const cafe = await CafeModel.getCafeDetail(id);

        if (!cafe) {
            return res.status(404).json({ success: false, message: 'Quán không tồn tại' });
        }

        res.status(200).json({ success: true, data: cafe });
    } catch (error: any) {
        console.error('Error fetching cafe detail:', error);
        res.status(500).json({ error: 'Lỗi server!', details: error.message });
    }
};

// GET /api/cafes/owner/:ownerId - Lấy danh sách quán của owner
export const getCafesByOwner = async (req: Request, res: Response) => {
    try {
        const { ownerId } = req.params as { ownerId: string };
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const { data, count } = await CafeModel.getCafesByOwner(ownerId, page, limit);

        res.status(200).json({
            success: true,
            data,
            pagination: {
                page,
                limit,
                total: count,
                pages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error: any) {
        console.error('Error fetching owner cafes:', error);
        res.status(500).json({ error: 'Lỗi server!', details: error.message });
    }
};

// ━━━ CREATE ━━━

// POST /api/cafes - Tạo quán mới (owner)
export const createCafe = async (req: Request, res: Response) => {
    try {
        const { name, address, lat, lng, wifi_speed, quiet_level, open_time, close_time, description_ja, owner_id } = req.body;

        // Validate required fields
        if (!name || !address || !lat || !lng || !owner_id) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
            });
        }

        const cafe = await CafeModel.createCafe({
            name,
            address,
            lat,
            lng,
            wifi_speed,
            quiet_level,
            open_time,
            close_time,
            description_ja,
            owner_id,
        });

        res.status(201).json({ success: true, data: cafe });
    } catch (error: any) {
        console.error('Error creating cafe:', error);
        res.status(500).json({ error: 'Lỗi server!', details: error.message });
    }
};

// ━━━ UPDATE ━━━

// PUT /api/cafes/:id - Cập nhật quán (owner)
export const updateCafe = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const { owner_id, ...updates } = req.body;

        // Kiểm tra owner
        const isOwner = await CafeModel.isOwner(id, owner_id);
        if (!isOwner) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền sửa quán này',
            });
        }

        const cafe = await CafeModel.updateCafeInfo(id, updates);

        res.status(200).json({ success: true, data: cafe });
    } catch (error: any) {
        console.error('Error updating cafe:', error);
        res.status(500).json({ error: 'Lỗi server!', details: error.message });
    }
};

// ━━━ DELETE ━━━

// DELETE /api/cafes/:id - Xóa quán (owner)
export const deleteCafe = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const { owner_id } = req.body;

        // Kiểm tra owner
        const isOwner = await CafeModel.isOwner(id, owner_id);
        if (!isOwner) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xóa quán này',
            });
        }

        await CafeModel.deleteCafe(id);

        res.status(200).json({ success: true, message: 'Quán đã bị xóa' });
    } catch (error: any) {
        console.error('Error deleting cafe:', error);
        res.status(500).json({ error: 'Lỗi server!', details: error.message });
    }
};

// --- CONTROLLER API BẢN ĐỒ ---
export const getMapCafes = async (req: Request, res: Response) => {
    try {
        const { lat, lng, hasWifi, isQuiet, isOpen, maxDistance } = req.query;

        // 1. Fetch toàn bộ dữ liệu từ Supabase
        const allCafes = await CafeModel.getAllCafes();
        if (!allCafes) {
            return res.status(200).json({ success: true, count: 0, data: [] });
        }

        let filteredCafes = [...allCafes];

        // 2. Lọc theo trạng thái Đang mở cửa (営業中)
        if (isOpen === 'true') {
            filteredCafes = filteredCafes.filter((cafe) =>
                checkIsOpen(cafe.open_time, cafe.close_time)
            );
        }

        // 3. Lọc theo Wi-Fi (高速Wi-Fi) và Yên tĩnh (静か)
        if (hasWifi === 'true') {
            filteredCafes = filteredCafes.filter((cafe) => cafe.tags?.includes('Fast Wi-Fi'));
        }
        if (isQuiet === 'true') {
            filteredCafes = filteredCafes.filter((cafe) => cafe.tags?.includes('Quiet'));
        }

        // 4. Tính khoảng cách (Haversine) nếu có tọa độ của User
        if (lat && lng) {
            const userLat = parseFloat(lat as string);
            const userLng = parseFloat(lng as string);
            const radiusKm = maxDistance ? parseFloat(maxDistance as string) : 5; // Mặc định 5km

            // Map để thêm thuộc tính distance
            filteredCafes = filteredCafes.map((cafe) => {
                const distance = getDistanceFromLatLonInKm(userLat, userLng, cafe.lat, cafe.lng);
                return { ...cafe, distance };
            });

            // Lọc các quán nằm trong bán kính cho phép
            filteredCafes = filteredCafes.filter((cafe) => cafe.distance <= radiusKm);

            // Sắp xếp ưu tiên quán gần nhất
            filteredCafes.sort((a, b) => a.distance - b.distance);
        }

        // 5. Format lại dữ liệu trả về Frontend
        const responseData = filteredCafes.map((cafe) => ({
            id: cafe.id,
            name: cafe.name,
            location: { lat: cafe.lat, lng: cafe.lng },
            rating: cafe.rating || 0,
            reviewCount: cafe.review_count || 0,
            tags: cafe.tags || [],
            imageUrl: cafe.image_url,
            isOpenNow: checkIsOpen(cafe.open_time, cafe.close_time),
            distance: cafe.distance ? parseFloat(cafe.distance.toFixed(1)) : null,
        }));

        res.status(200).json({
            success: true,
            count: responseData.length,
            data: responseData,
        });
    } catch (error: any) {
        console.error('Lỗi API Map:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ', details: error.message });
    }
};