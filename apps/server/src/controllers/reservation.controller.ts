import { Request, Response } from 'express';
import { CafeModel } from '../models/cafe.model';
import { NotificationModel } from '../models/notification.model';
import { ReservationModel } from '../models/reservation.model';
import { sendReservationStatusEmail } from '../utils/email.service';

// POST /api/reservations - Đặt chỗ (user)
export const createReservation = async (req: Request, res: Response) => {
  try {
    const user_id = (req as any).user?.id;
    const { cafe_id, res_date, res_time, num_guests = 1, guest_name } = req.body;

    if (!user_id || !cafe_id || !res_date || !res_time || !guest_name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const guestName = typeof guest_name === 'string' ? guest_name.trim() : '';
    if (!guestName) {
      return res.status(400).json({
        success: false,
        message: 'Invalid guest_name',
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
      guests,
      guestName
    );

    try {
      const cafe = await CafeModel.getCafeOwnerInfo(cafe_id);
      if (cafe?.owner_id) {
        await NotificationModel.createNotification({
          user_id: cafe.owner_id,
          title: `${guestName}が予約を申請しました`,
          content: `${cafe.name || 'カフェ名未設定'}・${res_date}・${res_time}・${guests}名`,
        });
      }
    } catch (notificationError) {
      console.error('Failed to create reservation notification:', notificationError);
    }

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
    const limitRaw = parseInt(req.query.limit as string);
    const limit = Number.isNaN(limitRaw) ? 10 : limitRaw;

    const { data, count } = await ReservationModel.getUserReservations(userId, page, limit);

    res.status(200).json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count,
        pages: limit > 0 ? Math.ceil((count || 0) / limit) : 1,
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

      // Lấy ảnh đầu tiên từ bảng cafe_images (array)
      const cafeImages: any[] = Array.isArray(cafeInfo.cafe_images) ? cafeInfo.cafe_images : [];
      const firstImage = cafeImages.length > 0 ? cafeImages[0].image_url : null;

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
        cafeAddress: cafeInfo.address || '',
        imageUrl: firstImage || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500",
        reservationDate: resDate.toISOString().slice(0, 10).replace(/-/g, '/'),
        timeSlot: timeSlot,
        seatNumber: 'フリー席 (Chỗ ngồi tự do)',
        status: mappedStatus,
        approvalStatus: item.status, // "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"
        createdAt: createdDate.toISOString().slice(0, 10).replace(/-/g, '/'),
        amount: 0
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
    const ownerIdFromToken = (req as any).user?.id as string | undefined;
    const ownerIdFromQuery = req.query.owner_id as string | undefined;
    const ownerId = ownerIdFromToken || ownerIdFromQuery;
    const page = parseInt(req.query.page as string) || 1;
    const limitRaw = parseInt(req.query.limit as string);
    const limit = Number.isNaN(limitRaw) ? 10 : limitRaw;

    // Kiểm tra owner
    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập.',
      });
    }

    const isOwner = await ReservationModel.isOwner(cafeId, ownerId);
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
        pages: limit > 0 ? Math.ceil((count || 0) / limit) : 1,
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
    const ownerIdFromToken = (req as any).user?.id as string | undefined;
    const ownerId = ownerIdFromToken || owner_id;

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

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập.',
      });
    }

    // Kiểm tra owner
    const isOwner = await ReservationModel.isOwner(cafeId, ownerId);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật đơn đặt chỗ này',
      });
    }

    const reservation = await ReservationModel.updateReservationStatus(id, status);

    // Gửi email thông báo nếu status là APPROVED hoặc REJECTED
    if (status === 'APPROVED' || status === 'REJECTED') {
      try {
        const details = await ReservationModel.getReservationWithDetails(id);
        if (details?.email) {
          await sendReservationStatusEmail({
            to: details.email,                                  // email từ auth.users
            guestName: details.guest_name || details.profiles?.full_name || 'Guest',
            cafeName: details.cafes?.name || 'WorkSpot Cafe',
            date: details.res_date || '',
            time: details.res_time || '',
            status: status === 'APPROVED' ? 'CONFIRMED' : 'CANCELLED',
          });
          console.log(`[Email] Sent ${status} email to: ${details.email}`);
        } else {
          console.warn(`[Email] Skipped: no email found for reservation ${id}`);
        }

        if (details?.user_id) {
          const statusLabel = status === 'APPROVED' ? '承認されました' : '却下されました';
          await NotificationModel.createNotification({
            user_id: details.user_id,
            title: `予約が${statusLabel}`,
            content: `${details.cafes?.name || 'カフェ名未設定'}・${details.res_date || ''}・${details.res_time || ''}`.trim(),
          });
        }
      } catch (emailErr) {
        // Không block response nếu email lỗi
        console.error('[Email] Failed to send reservation email:', emailErr);
      }
    }

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
