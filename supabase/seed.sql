-- 0. TẠO TÀI KHOẢN TRONG AUTH.USERS (Bổ sung phần này lên đầu)
-- Việc này giúp vượt qua ràng buộc Foreign Key của bảng profiles
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, instance_id)
VALUES
(
    '00000000-0000-0000-0000-000000000001', 'sato@example.com', 
    crypt('password123', gen_salt('bf')), now(), 
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '00000000-0000-0000-0000-000000000000'
),
(
    '00000000-0000-0000-0000-000000000002', 'tanaka@example.com', 
    crypt('password123', gen_salt('bf')), now(), 
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '00000000-0000-0000-0000-000000000000'
),
(
    '00000000-0000-0000-0000-000000000003', 'dungowner@example.com', 
    crypt('password123', gen_salt('bf')), now(), 
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '00000000-0000-0000-0000-000000000000'
)
ON CONFLICT (id) DO NOTHING;

-- 1. ROLES (Giữ nguyên)
INSERT INTO public.roles (id, role_name) VALUES 
(1, 'RESERVATION_REQUESTER'), (2, 'CAFE_OWNER'), (3, 'GUEST')
ON CONFLICT (id) DO NOTHING;

-- 2. PROFILES (Bây giờ sẽ chạy ngon vì ID đã tồn tại ở bước 0)
INSERT INTO public.profiles (id, role_id, full_name, avatar_url) VALUES 
('00000000-0000-0000-0000-000000000001', 1, 'Sato Kenji', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sato'),
('00000000-0000-0000-0000-000000000002', 1, 'Tanaka Hana', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hana'),
('00000000-0000-0000-0000-000000000003', 2, 'Nguyen Van Dung', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dung')
ON CONFLICT (id) DO NOTHING;


-- 3. AMENITIES
INSERT INTO public.amenities (id, name_ja, name_vi) VALUES 
(1, '高速Wi-Fi', 'Wi-Fi tốc độ cao'), (2, 'コンセントあり', 'Có ổ cắm điện'),
(3, '静かな環境', 'Môi trường yên tĩnh'), (4, '禁煙', 'Không hút thuốc')
ON CONFLICT (id) DO NOTHING;

-- 4. CAFES
INSERT INTO public.cafes (id, owner_id, name, address, lat, lng, wifi_speed, quiet_level, open_time, close_time, description_ja) VALUES 
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000003', 'The Velvet Bean', '12 Tran Hung Dao, Hanoi', 21.0285, 105.8542, 'NORMAL', 'NORMAL', '08:00:00', '22:00:00', '静かで集中できる空間です。'),
('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000003', 'The Brew Archive', 'Kim Ma, Ba Dinh, Hanoi', 21.0300, 105.8190, 'NORMAL', 'NORMAL', '07:30:00', '21:00:00', 'プロフェッショナルな環境。')
ON CONFLICT (id) DO NOTHING;

-- 5. CAFE_AMENITIES
INSERT INTO public.cafe_amenities (cafe_id, amenity_id) VALUES 
('11111111-1111-1111-1111-111111111111', 1), ('11111111-1111-1111-1111-111111111111', 2),
('22222222-2222-2222-2222-222222222222', 1)
ON CONFLICT DO NOTHING;

-- 6. CAFE_IMAGES (Bảng mới bổ sung)
INSERT INTO public.cafe_images (cafe_id, image_url, image_type) VALUES 
('11111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1554118811-1e0d58224f24', 'INTERIOR'),
('22222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085', 'INTERIOR')
ON CONFLICT DO NOTHING;

-- 7. REVIEWS
INSERT INTO public.reviews (id, user_id, cafe_id, rating, comment) VALUES 
(1, '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 5, 'とても静かで仕事がはかどります。')
ON CONFLICT (id) DO NOTHING;

-- 8. REVIEW_IMAGES (Bảng mới bổ sung)
INSERT INTO public.review_images (review_id, image_url) VALUES 
(1, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93')
ON CONFLICT DO NOTHING;

-- 9. RESERVATIONS
INSERT INTO public.reservations (user_id, cafe_id, res_date, res_time, num_guests, status) VALUES 
('00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '2026-05-15', '14:30:00', 2, 'PENDING')
ON CONFLICT DO NOTHING;

-- 10. FAVORITES
INSERT INTO public.favorites (user_id, cafe_id) VALUES 
('00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

-- 11. NOTIFICATIONS
INSERT INTO public.notifications (user_id, title, content) VALUES 
('00000000-0000-0000-0000-000000000001', '予約確認', '予約が完了しました。'),
('00000000-0000-0000-0000-000000000001', 'お気に入り通知', 'Cafe Lâmが営業を開始しました。'),
('00000000-0000-0000-0000-000000000002', '予約リマインダー', '明日Cafe Đinhの予約があります。'),
('00000000-0000-0000-0000-000000000005', '新着レビュー', 'あなたのレビューがCafe Giảngに投稿されました。')
ON CONFLICT DO NOTHING;

-- ============================================================
-- PHẦN BỔ SUNG: Thêm dữ liệu demo phong phú hơn
-- ============================================================

-- 12. THÊM TÀI KHOẢN AUTH.USERS (thêm 1 chủ quán + 1 người dùng Nhật)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, instance_id)
VALUES
(
    '00000000-0000-0000-0000-000000000004', 'lanowner@example.com',
    crypt('password123', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '00000000-0000-0000-0000-000000000000'
),
(
    '00000000-0000-0000-0000-000000000005', 'yamada@example.com',
    crypt('password123', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '00000000-0000-0000-0000-000000000000'
)
ON CONFLICT (id) DO NOTHING;

-- 13. THÊM PROFILES
INSERT INTO public.profiles (id, role_id, full_name, avatar_url) VALUES
('00000000-0000-0000-0000-000000000004', 2, 'Nguyen Thi Lan', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lan'),
('00000000-0000-0000-0000-000000000005', 1, 'Yamada Taro', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yamada')
ON CONFLICT (id) DO NOTHING;

-- 14. THÊM AMENITIES
INSERT INTO public.amenities (id, name_ja, name_vi) VALUES
(5, '個室あり', 'Có phòng riêng'),
(6, 'エアコン', 'Điều hòa nhiệt độ'),
(7, 'テラス席', 'Chỗ ngồi ngoài trời'),
(8, 'ペット可', 'Cho phép thú cưng')
ON CONFLICT (id) DO NOTHING;

-- 15. THÊM CAFES (5 quán cà phê nổi tiếng Hà Nội)
INSERT INTO public.cafes (id, owner_id, name, address, lat, lng, wifi_speed, quiet_level, open_time, close_time, description_ja) VALUES
('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000004', 'Cafe Giảng', '39 Nguyễn Hữu Huân, Hoàn Kiếm, Hà Nội', 21.0333, 105.8550, 'SLOW', 'NORMAL', '07:00:00', '22:30:00', '名物のエッグコーヒーで有名な歴史あるカフェ。1946年創業。')
,('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000003', 'Cafe Đinh', '12 Đinh Tiên Hoàng, Hoàn Kiếm, Hà Nội', 21.0340, 105.8530, 'FAST', 'QUIET', '07:30:00', '23:00:00', 'ホアンキエム湖を見渡せる絶好のロケーション。静かで集中できる。')
,('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000004', 'Cafe Nhĩ', '19 Nguyễn Siêu, Hoàn Kiếm, Hà Nội', 21.0310, 105.8600, 'FAST', 'QUIET', '08:00:00', '22:00:00', '静かな路地に隠れた隠れ家カフェ。WiFi高速。')
,('66666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000003', 'Cafe Phố Cổ', '38 Hàng Bè, Hoàn Kiếm, Hà Nội', 21.0335, 105.8580, 'NORMAL', 'NORMAL', '06:30:00', '23:30:00', '古い街並みを眺めながらコーヒーを楽しめる。')
,('77777777-7777-7777-7777-777777777777', '00000000-0000-0000-0000-000000000005', 'Cafe Lâm', '60 Nguyễn Hữu Huân, Hoàn Kiếm, Hà Nội', 21.0338, 105.8560, 'FAST', 'QUIET', '07:00:00', '22:00:00', '静かで落ち着いた雰囲気のカフェ。リモートワークに最適。')
ON CONFLICT (id) DO NOTHING;

-- 16. THÊM CAFE_AMENITIES
INSERT INTO public.cafe_amenities (cafe_id, amenity_id) VALUES
('33333333-3333-3333-3333-333333333333', 1), ('33333333-3333-3333-3333-333333333333', 6),
('44444444-4444-4444-4444-444444444444', 1), ('44444444-4444-4444-4444-444444444444', 2), ('44444444-4444-4444-4444-444444444444', 3),
('55555555-5555-5555-5555-555555555555', 1), ('55555555-5555-5555-5555-555555555555', 2), ('55555555-5555-5555-5555-555555555555', 3), ('55555555-5555-5555-5555-555555555555', 5),
('66666666-6666-6666-6666-666666666666', 1), ('66666666-6666-6666-6666-666666666666', 7),
('77777777-7777-7777-7777-777777777777', 1), ('77777777-7777-7777-7777-777777777777', 2), ('77777777-7777-7777-7777-777777777777', 3), ('77777777-7777-7777-7777-777777777777', 5), ('77777777-7777-7777-7777-777777777777', 6)
ON CONFLICT DO NOTHING;

-- 17. THÊM CAFE_IMAGES
INSERT INTO public.cafe_images (cafe_id, image_url, image_type) VALUES
('33333333-3333-3333-3333-333333333333', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb', 'INTERIOR'),
('33333333-3333-3333-3333-333333333333', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085', 'FOOD'),
('44444444-4444-4444-4444-444444444444', 'https://images.unsplash.com/photo-1445116572660-236099ec97a0', 'INTERIOR'),
('44444444-4444-4444-4444-444444444444', 'https://images.unsplash.com/photo-1511920170033-f8396924c348', 'FOOD'),
('55555555-5555-5555-5555-555555555555', 'https://images.unsplash.com/photo-1554118811-1e0d58224f24', 'INTERIOR'),
('66666666-6666-6666-6666-666666666666', 'https://images.unsplash.com/photo-1453614512568-c4024d13c247', 'INTERIOR'),
('77777777-7777-7777-7777-777777777777', 'https://images.unsplash.com/photo-1521017432531-fbd92d768814', 'INTERIOR'),
('77777777-7777-7777-7777-777777777777', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93', 'FOOD')
ON CONFLICT DO NOTHING;

-- 18. THÊM REVIEWS
INSERT INTO public.reviews (id, user_id, cafe_id, rating, comment) VALUES
(2, '00000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 5, 'エッグコーヒーが絶品！歴史を感じる素敵な空間です。'),
(3, '00000000-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444444', 4, '湖の眺めが素晴らしい。WiFiも快適。'),
(4, '00000000-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555555', 5, 'とても静かで仕事に集中できます。個室もあって便利。'),
(5, '00000000-0000-0000-0000-000000000001', '66666666-6666-6666-6666-666666666666', 4, '古い街並みを眺めながらのコーヒーは格別。'),
(6, '00000000-0000-0000-0000-000000000005', '77777777-7777-7777-7777-777777777777', 5, 'リモートワークに最適な環境。電源もWiFiも完璧。'),
(7, '00000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 3, '普通のカフェ。特に可もなく不可もなく。'),
(8, '00000000-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', 4, 'プロフェッショナルな雰囲気で仕事がはかどります。')
ON CONFLICT (id) DO NOTHING;

-- 19. THÊM REVIEW_IMAGES
INSERT INTO public.review_images (review_id, image_url) VALUES
(2, 'https://images.unsplash.com/photo-1511920170033-f8396924c348'),
(3, 'https://images.unsplash.com/photo-1445116572660-236099ec97a0'),
(4, 'https://images.unsplash.com/photo-1521017432531-fbd92d768814'),
(6, 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb')
ON CONFLICT DO NOTHING;

-- 20. THÊM RESERVATIONS
INSERT INTO public.reservations (user_id, cafe_id, res_date, res_time, num_guests, status) VALUES
('00000000-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444444', '2026-06-10', '10:00:00', 1, 'PENDING'),
('00000000-0000-0000-0000-000000000005', '77777777-7777-7777-7777-777777777777', '2026-06-12', '14:00:00', 3, 'CONFIRMED'),
('00000000-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555555', '2026-06-15', '09:00:00', 1, 'PENDING')
ON CONFLICT DO NOTHING;

-- 21. THÊM FAVORITES
INSERT INTO public.favorites (user_id, cafe_id) VALUES
('00000000-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444444'),
('00000000-0000-0000-0000-000000000005', '77777777-7777-7777-7777-777777777777'),
('00000000-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555555'),
('00000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333')
ON CONFLICT DO NOTHING;