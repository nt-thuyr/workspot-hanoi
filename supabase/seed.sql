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
('00000000-0000-0000-0000-000000000001', '予約確認', '予約が完了しました。')
ON CONFLICT DO NOTHING;