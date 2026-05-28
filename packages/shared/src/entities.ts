// Định nghĩa các Role dựa trên bảng roles [cite: 15]
export enum RoleID {
  RESERVATION_REQUESTER = 1, // Khách Nhật
  CAFE_OWNER = 2,            // Chủ quán
  GUEST = 3                  // Khách vãng lai
}

// 1. Entity cho Người dùng (User Auth) [cite: 15, 17]
export interface Profile {
  id: string; 
  role_id: RoleID;
  full_name: string | null;
  avatar_url: string | null;
}

// 2. Entity cho Quán Cafe (Cafe Management & Home) 
export interface Cafe {
  id: string;
  owner_id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  wifi_speed: 'SLOW' | 'NORMAL' | 'FAST';
  quiet_level: 'NOISY' | 'NORMAL' | 'QUIET' | 'SILENT';
  open_time: string | null;
  close_time: string | null;
  description_ja: string | null;
  avg_rating: number | null;
  custom_tags?: string[] | null;
}