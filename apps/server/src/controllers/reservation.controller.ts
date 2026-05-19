import { Request, Response } from 'express';
import { ReservationModel } from '../models/reservation.model';

// POST /api/reservations - Đặt chỗ (user)
export const createReservation = async (req: Request, res: Response) => {
  try {
    const user_id = (req as any).user?.id;
    const { cafe_id, res_date, res_time, num_guests = 1 } = req.body;

    if (!user_id || !cafe_id || !res_date || !res_time) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }


    const guests = typeof num_guests === 'string' ? parseInt(num_guests, 10) : num_guests;
    if (!Number.isInteger(guests) || guests <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid num_guests',
      });
    }

    const resDate = new Date(res_date);
    if (Number.isNaN(resDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid res_date',
      });
    }

    const timePattern = /^\d{2}:\d{2}(:\d{2})?$/;
    if (!timePattern.test(String(res_time))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid res_time',
      });
    }

    const reservation = await ReservationModel.createReservation(
      user_id,
      cafe_id,
      res_date,
      res_time,
      guests
    );

    res.status(201).json({ success: true, data: reservation });
  } catch (error: any) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ error: 'Lỗi server!', details: error.message });
  }
};

// GET /api/reservations/user/:userId - Lấy danh sách đặt chỗ của user
export const getUserReservations = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params as { userId: string };
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const { data, count } = await ReservationModel.getUserReservations(userId, page, limit);

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
    console.error('Error fetching user reservations:', error);
    res.status(500).json({ error: 'Lỗi server!', details: error.message });
  }
};

export const getHistory = async (req: Request, res: Response) => {
  try {
    // Lấy user_id từ request (Đã được Middleware auth giải mã từ Token)
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập.' });
    }

    // Gọi Model lấy dữ liệu thô từ Database
    const rawData = await ReservationModel.getHistoryByUserId(userId);

    // Biến đổi dữ liệu khớp với Interface của Frontend
    const formattedData = (rawData || []).map((item: any) => {
      // Xử lý định dạng ngày YYYY/MM/DD
      const resDate = item.res_date ? new Date(item.res_date) : new Date();
      const createdDate = item.created_at ? new Date(item.created_at) : new Date();

      // Xử lý an toàn nếu quán bị xóa
      const cafeInfo = item.cafes || {};

      // Xử lý nối giờ (Sử dụng res_time từ model mới)
      const timeSlot = item.res_time ? item.res_time : '00:00 - 00:00';

      // Xử lý status map với Frontend ("PENDING" -> "upcoming", "APPROVED" -> "completed", "REJECTED/CANCELLED" -> "cancelled")
      let mappedStatus = 'upcoming';
      if (item.status === 'APPROVED') mappedStatus = 'completed';
      else if (item.status === 'REJECTED' || item.status === 'CANCELLED') mappedStatus = 'cancelled';

      return {
        id: item.id,
        cafeId: cafeInfo.id || 0,
        cafeName: cafeInfo.name || 'Quán Cafe đã ẩn',
        imageUrl: cafeInfo.image_url || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500",
        reservationDate: resDate.toISOString().slice(0, 10).replace(/-/g, '/'),
        timeSlot: timeSlot,
        seatNumber: item.seat_number || 'フリー席 (Chỗ ngồi tự do)',
        status: mappedStatus,
        createdAt: createdDate.toISOString().slice(0, 10).replace(/-/g, '/'),
        amount: item.amount || 0
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedData
    });

  } catch (error: any) {
    console.error('Lỗi API Get History:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server nội bộ' });
  }
};

// GET /api/reservations/cafe/:cafeId - Lấy danh sách đặt chỗ của quán (owner)
export const getCafeReservations = async (req: Request, res: Response) => {
  try {
    const { cafeId } = req.params as { cafeId: string };
    const { owner_id } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Kiểm tra owner
    if (!owner_id) {
      return res.status(400).json({
        success: false,
        message: 'owner_id is required',
      });
    }

    const isOwner = await ReservationModel.isOwner(cafeId, owner_id as string);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem đơn đặt chỗ của quán này',
      });
    }

    const { data, count } = await ReservationModel.getCafeReservations(cafeId, page, limit);

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
    console.error('Error fetching cafe reservations:', error);
    res.status(500).json({ error: 'Lỗi server!', details: error.message });
  }
};

// PUT /api/reservations/:id/status - Cập nhật status (owner)
export const updateReservationStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { status, owner_id } = req.body;

    if (!status || !['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    // Lấy cafeId từ reservation
    const cafeId = await ReservationModel.getCafeIdFromReservation(id);
    if (!cafeId) {
      return res.status(404).json({
        success: false,
        message: 'Đơn đặt chỗ không tồn tại',
      });
    }

    // Kiểm tra owner
    const isOwner = await ReservationModel.isOwner(cafeId, owner_id);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật đơn đặt chỗ này',
      });
    }

    const reservation = await ReservationModel.updateReservationStatus(id, status);

    res.status(200).json({ success: true, data: reservation });
  } catch (error: any) {
    console.error('Error updating reservation status:', error);
    res.status(500).json({ error: 'Lỗi server!', details: error.message });
  }
};

// PATCH /api/reservations/:id/cancel - Hủy đặt chỗ (guest)
export const cancelReservationByUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập.' });
    }

    const reservationUserId = await ReservationModel.getUserIdFromReservation(id);
    if (!reservationUserId) {
      return res.status(404).json({ success: false, message: 'Đơn đặt chỗ không tồn tại' });
    }

    if (reservationUserId !== userId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền hủy đơn đặt chỗ này' });
    }

    const reservation = await ReservationModel.updateReservationStatus(id, 'CANCELLED');

    res.status(200).json({ success: true, message: 'Đã hủy thành công', data: reservation });
  } catch (error: any) {
    console.error('Error cancelling reservation:', error);
    res.status(500).json({ error: 'Lỗi server!', details: error.message });
  }
};
