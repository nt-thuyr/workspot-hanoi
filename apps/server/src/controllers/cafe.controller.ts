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
                checkIsOpen(cafe.open_time, cafe.close_time) // Giả sử schema DB dùng open_time và close_time
            );
        }

        // 3. Lọc theo Wi-Fi (高速Wi-Fi) và Yên tĩnh (静か)
        // Giả sử cột 'tags' trong Supabase là một mảng chuỗi (text[])
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