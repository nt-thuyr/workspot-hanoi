import { Request, Response } from 'express';
import { CafeModel } from '../models/cafe.model';
import { NotificationModel } from '../models/notification.model';
import { ReservationModel } from '../models/reservation.model';
import { sendReservationStatusEmail } from '../utils/email.service';

const parseTimeToMinutes = (time: string) => {
  const [hoursStr = '', minutesStr = ''] = String(time).split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const isTimeWithinCafeHours = (time: string, openTime: string, closeTime: string) => {
  const target = parseTimeToMinutes(time);
  const open = parseTimeToMinutes(openTime);
  const close = parseTimeToMinutes(closeTime);

  if (target == null || open == null || close == null) return false;

  if (open <= close) {
    return target >= open && target <= close;
  }

  return target >= open || target <= close;
};

const buildReservationDateTime = (resDate: string, resTime: string) => {
  const combined = `${resDate}T${resTime.length === 5 ? `${resTime}:00` : resTime}`;
  return new Date(combined);
};

// POST /api/reservations - Đặt chỗ (user)
export const createReservation = async (req: Request, res: Response) => {
  try {
    const user_id = (req as any).user?.id;
    const { cafe_id, res_date, res_time, num_guests = 1, guest_name } = req.body;

    if (!user_id || !cafe_id || !res_date || !res_time || !guest_name) {
      return res.status(400).json({
        success: false,
        message: '必要な項目が不足しています。',
      });
    }

    const guestName = typeof guest_name === 'string' ? guest_name.trim() : '';
    if (!guestName) {
      return res.status(400).json({
        success: false,
        message: '氏名が無効です。',
      });
    }


    const guests = typeof num_guests === 'string' ? parseInt(num_guests, 10) : num_guests;
    if (!Number.isInteger(guests) || guests <= 0) {
      return res.status(400).json({
        success: false,
        message: '人数が無効です。',
      });
    }

    const resDate = new Date(res_date);
    if (Number.isNaN(resDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: '予約日が無効です。',
      });
    }

    const timePattern = /^\d{2}:\d{2}(:\d{2})?$/;
    if (!timePattern.test(String(res_time))) {
      return res.status(400).json({
        success: false,
        message: '予約時間が無効です。',
      });
    }

    const cafe = await CafeModel.getCafeOwnerInfo(cafe_id);
    if (!cafe) {
      return res.status(404).json({
        success: false,
        message: 'カフェが見つかりません。',
      });
    }

    const now = new Date();
    const bookingDateTime = buildReservationDateTime(res_date, res_time);
    if (Number.isNaN(bookingDateTime.getTime())) {
      return res.status(400).json({
        success: false,
        message: '予約日時が無効です。',
      });
    }

    if (bookingDateTime.getTime() < now.getTime()) {
      return res.status(400).json({
        success: false,
        message: '過去の日時には予約できません。',
      });
    }

    if (!cafe.open_time || !cafe.close_time) {
      return res.status(400).json({
        success: false,
        message: '営業時間が設定されていません。',
      });
    }

    if (!isTimeWithinCafeHours(res_time, cafe.open_time, cafe.close_time)) {
      return res.status(400).json({
        success: false,
        message: `予約時間は営業時間内（${cafe.open_time.slice(0, 5)}〜${cafe.close_time.slice(0, 5)}）で指定してください。`,
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
    res.status(500).json({ error: 'サーバーエラー', details: error.message });
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
    res.status(500).json({ error: 'サーバーエラー', details: error.message });
  }
};

export const getHistory = async (req: Request, res: Response) => {
  try {
    // Lấy user_id từ request (Đã được Middleware auth giải mã từ Token)
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'ログインしてください。' });
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
        seatNumber: String(item.num_guests || 1),
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
    console.error('履歴取得APIエラー:', error);
    return res.status(500).json({ success: false, message: '内部サーバーエラー' });
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
        message: 'ログインしてください。',
      });
    }

    const isOwner = await ReservationModel.isOwner(cafeId, ownerId);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'このカフェの予約を閲覧する権限がありません',
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
    res.status(500).json({ error: 'サーバーエラー', details: error.message });
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
        message: 'ステータスが無効です。',
      });
    }

    // Lấy cafeId từ reservation
    const cafeId = await ReservationModel.getCafeIdFromReservation(id);
    if (!cafeId) {
      return res.status(404).json({
        success: false,
        message: '予約が見つかりません',
      });
    }

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: 'ログインしてください。',
      });
    }

    // Kiểm tra owner
    const isOwner = await ReservationModel.isOwner(cafeId, ownerId);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'この予約を更新する権限がありません',
      });
    }

    const reservation = await ReservationModel.updateReservationStatus(id, status);

    // Gửi email và thông báo nếu status là APPROVED hoặc REJECTED
    if (status === 'APPROVED' || status === 'REJECTED') {
      let details;
      try {
        details = await ReservationModel.getReservationWithDetails(id);
      } catch (err) {
        console.error('Failed to get reservation details for notification/email:', err);
      }

      if (details) {
        // 1. Gửi email
        if (details.email) {
          try {
            await sendReservationStatusEmail({
              to: details.email,
              guestName: details.guest_name || details.profiles?.full_name || 'Guest',
              cafeName: details.cafes?.name || 'WorkSpot Cafe',
              date: details.res_date || '',
              time: details.res_time || '',
              status: status === 'APPROVED' ? 'CONFIRMED' : 'CANCELLED',
            });
            console.log(`[Email] Sent ${status} email to: ${details.email}`);
          } catch (emailErr) {
            console.error('[Email] Failed to send reservation email:', emailErr);
          }
        } else {
          console.warn(`[Email] Skipped: no email found for reservation ${id}`);
        }

        // 2. Tạo thông báo (Notification)
        if (details.user_id) {
          try {
            const statusLabel = status === 'APPROVED' ? '承認されました' : '却下されました';
            await NotificationModel.createNotification({
              user_id: details.user_id,
              title: `予約が${statusLabel}`,
              content: `${details.cafes?.name || 'カフェ名未設定'}・${details.res_date || ''}・${details.res_time || ''}`.trim(),
            });
          } catch (notifErr) {
            console.error('Failed to create reservation status notification:', notifErr);
          }
        }
      }
    }

    res.status(200).json({ success: true, data: reservation });
  } catch (error: any) {
    console.error('Error updating reservation status:', error);
    res.status(500).json({ error: 'サーバーエラー', details: error.message });
  }
};

// PATCH /api/reservations/:id/cancel - Hủy đặt chỗ (guest)
export const cancelReservationByUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'ログインしてください。' });
    }

    const reservationUserId = await ReservationModel.getUserIdFromReservation(id);
    if (!reservationUserId) {
      return res.status(404).json({ success: false, message: '予約が存在しません' });
    }

    if (reservationUserId !== userId) {
      return res.status(403).json({ success: false, message: 'この予約をキャンセルする権限がありません' });
    }

    const reservation = await ReservationModel.updateReservationStatus(id, 'CANCELLED');

    res.status(200).json({ success: true, message: '予約がキャンセルされました', data: reservation });
  } catch (error: any) {
    console.error('Error cancelling reservation:', error);
    res.status(500).json({ error: 'サーバーエラー', details: error.message });
  }
};
