import { useState, useEffect, useMemo, useRef, type FC } from 'react';
import './NotificationDropdown.css';

interface NotificationItem {
    id: string | number;
    title?: string;
    content?: string;
    message?: string;
    is_read: boolean;
    created_at: string;
    type?: string;
    cafe_name?: string;
    cafeName?: string;
    res_date?: string;
    res_time?: string;
    num_guests?: number;
    guest_name?: string;
    rating?: number;
    comment?: string;
}

const VISIBLE_LIMIT = 10;

const getRelativeTime = (createdAt: string) => {
    const created = new Date(createdAt);
    if (Number.isNaN(created.getTime())) {
        return '';
    }

    const diffMs = Date.now() - created.getTime();
    const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'たった今';
    if (diffMinutes < 60) return `${diffMinutes}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;

    return created.toLocaleDateString('vi-VN');
};

const inferNotificationKind = (item: NotificationItem) => {
    const text = `${item.title ?? ''} ${item.content ?? item.message ?? ''}`.toLowerCase();

    if (/review|レビュー|đánh giá|rating|star|sao/.test(text)) {
        return 'review';
    }

    if (/予約|đặt chỗ|booking|reservation|guest_name|num_guests|res_date|res_time/.test(text)) {
        return 'reservation';
    }

    return 'general';
};

const extractRating = (item: NotificationItem) => {
    if (typeof item.rating === 'number') {
        return item.rating;
    }

    const text = `${item.content ?? ''} ${item.title ?? ''}`;
    const match = text.match(/(?:^|\s)([1-5](?:\.\d)?)\s*(?:\/\s*5|sao|star|stars|★|☆|⭐)/i);
    if (match?.[1]) {
        return Math.max(1, Math.min(5, Math.round(Number(match[1]))));
    }

    const unicodeStars = text.match(/[★☆⭐]/g);
    if (unicodeStars?.length) {
        return Math.max(1, Math.min(5, unicodeStars.filter((char) => char === '★' || char === '⭐').length));
    }

    return undefined;
};

const formatStars = (rating?: number) => {
    if (!rating) return '☆☆☆☆☆';
    return '★'.repeat(Math.max(1, Math.min(5, rating))) + '☆'.repeat(Math.max(0, 5 - rating));
};

const parseNotificationContent = (content: string) => {
    const parts = content.split('・').map((part) => part.trim()).filter(Boolean);
    return {
        cafeName: parts[0] || '',
        meta: parts.slice(1).join('・'),
        comment: parts.slice(2).join('・'),
        ratingText: parts[1] || '',
    };
};

export const NotificationDropdown: FC = () => {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const token = localStorage.getItem("access_token");

    // Đếm số lượng tin nhắn chưa đọc để làm huy hiệu badge báo đỏ
    const unreadCount = notifications.filter(n => !n.is_read).length;
    const visibleNotifications = useMemo(
        () => notifications.slice(0, showAll ? notifications.length : VISIBLE_LIMIT),
        [notifications, showAll]
    );

    // Gọi API lấy danh sách thông báo từ Supabase thông qua tầng Server
    const fetchNotifications = async () => {
        if (!token) return;
        try {
            // Giả định route BE lấy danh sách thông báo của tài khoản hiện tại
            const response = await fetch("http://localhost:3000/api/notifications", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setNotifications(result.data || []);
            }
        } catch (error) {
            console.error("Lỗi khi tải thông báo hệ thống:", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Đóng dropdown khi click ra ngoài vùng hiển thị
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [token]);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        const refreshTimer = window.setInterval(() => {
            fetchNotifications();
        }, 60000);

        return () => window.clearInterval(refreshTimer);
    }, [isOpen, token]);

    // Đánh dấu một thông báo cụ thể là đã đọc
    const markAsRead = async (id: string, isRead: boolean) => {
        if (isRead || !token) return;
        try {
            const response = await fetch(`http://localhost:3000/api/notifications/${id}/read`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setNotifications(prev =>
                    prev.map(n => String(n.id) === id ? { ...n, is_read: true } : n)
                );
            }
        } catch (error) {
            console.error("Không thể cập nhật trạng thái thông báo:", error);
        }
    };

    const renderNotificationCard = (item: NotificationItem) => {
        const kind = inferNotificationKind(item);
        const isUnread = !item.is_read;
        const title = item.title?.trim() || (kind === 'review' ? 'レビュー投稿のお知らせ' : '予約申請のお知らせ');
        const content = item.content?.trim() || item.message?.trim() || '';
        const parsedContent = parseNotificationContent(content);
        const cafeName = item.cafe_name || item.cafeName || parsedContent.cafeName || 'カフェ名未設定';
        const timeLabel = getRelativeTime(item.created_at);
        const rating = extractRating(item);
        const reservationDetails = [item.res_date, item.res_time, item.num_guests ? `${item.num_guests}名` : null]
            .filter(Boolean)
            .join(' • ');

        if (kind === 'review') {
            return (
                <div className={`noti-item-card noti-item-card--review ${isUnread ? 'noti-unread' : ''}`}>
                    <div className="noti-icon-badge noti-icon-badge--review">
                        <span className="material-symbols-outlined">rate_review</span>
                    </div>

                    <div className="noti-item-body">
                        <div className="noti-item-topline">
                            <p className="noti-item-title">{title}</p>
                            <span className="noti-item-time">{timeLabel}</span>
                        </div>
                        <p className="noti-item-cafe"><strong>{cafeName}</strong></p>
                        <div className="noti-rating-row" aria-label="rating">
                            <span className="noti-rating-stars">{formatStars(rating)}</span>
                            <span className="noti-rating-score">{rating ? `${rating}/5` : '1〜5段階'}</span>
                        </div>
                        {parsedContent.comment && <p className="noti-item-preview">{parsedContent.comment}</p>}
                    </div>

                    {isUnread && <span className="noti-item-dot" aria-hidden="true" />}
                </div>
            );
        }

        return (
            <div className={`noti-item-card noti-item-card--reservation ${isUnread ? 'noti-unread' : ''}`}>
                <div className="noti-icon-badge noti-icon-badge--reservation">
                    <span className="material-symbols-outlined">event_available</span>
                </div>

                <div className="noti-item-body">
                    <div className="noti-item-topline">
                        <p className="noti-item-title">{title}</p>
                        <span className="noti-item-time">{timeLabel}</span>
                    </div>
                    <p className="noti-item-cafe"><strong>{cafeName}</strong></p>
                    <p className="noti-item-details">
                        {reservationDetails || parsedContent.meta || content}
                    </p>
                </div>

                {isUnread && <span className="noti-item-dot" aria-hidden="true" />}
            </div>
        );
    };

    return (
        <div className="notification-wrapper" ref={dropdownRef}>
            {/* Nút Chuông báo hiệu */}
            <button
                className="noti-bell-btn"
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) {
                        setShowAll(false);
                    }
                }}
                title="通知 / Thông báo"
                type="button"
            >
                <span className="material-symbols-outlined bell-icon">notifications</span>
                {unreadCount > 0 && <span className="noti-badge-count">{unreadCount}</span>}
            </button>

            {/* Menu thả xuống Dropdown */}
            {isOpen && (
                <div className="noti-dropdown-box">
                    <div className="noti-dropdown-header">
                        <div>
                            <h3>通知</h3>
                            <p>Thông báo</p>
                        </div>
                        <span className="noti-unread-count">{unreadCount}件未読</span>
                    </div>

                    <div className="noti-dropdown-list">
                        {notifications.length === 0 ? (
                            <div className="noti-empty-state">
                                <p>Không có thông báo nào.</p>
                            </div>
                        ) : (
                            visibleNotifications.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    className="noti-item-button"
                                    onClick={() => markAsRead(String(item.id), item.is_read)}
                                >
                                    {renderNotificationCard(item)}
                                </button>
                            ))
                        )}
                    </div>

                    {notifications.length > VISIBLE_LIMIT && !showAll && (
                        <button
                            type="button"
                            className="noti-more-btn"
                            onClick={() => setShowAll(true)}
                        >
                            すべての通知を見る
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};