import { useState, useEffect, useRef, type FC } from 'react';
import './NotificationDropdown.css';

interface NotificationItem {
    id: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

export const NotificationDropdown: FC = () => {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const token = localStorage.getItem("access_token");

    // Đếm số lượng tin nhắn chưa đọc để làm huy hiệu badge báo đỏ
    const unreadCount = notifications.filter(n => !n.is_read).length;

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
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [token]);

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
                    prev.map(n => n.id === id ? { ...n, is_read: true } : n)
                );
            }
        } catch (error) {
            console.error("Không thể cập nhật trạng thái thông báo:", error);
        }
    };

    return (
        <div className="notification-wrapper" ref={dropdownRef}>
            {/* Nút Chuông báo hiệu */}
            <button className="noti-bell-btn" onClick={() => setIsOpen(!isOpen)} title="お知らせ / Thông báo">
                <span className="material-symbols-outlined bell-icon">notifications</span>
                {unreadCount > 0 && <span className="noti-badge-count">{unreadCount}</span>}
            </button>

            {/* Menu thả xuống Dropdown */}
            {isOpen && (
                <div className="noti-dropdown-box">
                    <div className="noti-dropdown-header">
                        <h3>お知らせ / Thông báo</h3>
                    </div>

                    <div className="noti-dropdown-list">
                        {notifications.length === 0 ? (
                            <div className="noti-empty-state">
                                <p>通知はありません / Không có thông báo nào.</p>
                            </div>
                        ) : (
                            notifications.map((item) => (
                                <div
                                    key={item.id}
                                    className={`noti-item-card ${!item.is_read ? 'noti-unread' : ''}`}
                                    onClick={() => markAsRead(item.id, item.is_read)}
                                >
                                    <div className="noti-item-dot"></div>
                                    <div className="noti-item-body">
                                        <h4 className="noti-item-title">{item.title}</h4>
                                        <p className="noti-item-message">{item.message}</p>
                                        <span className="noti-item-time">
                                            {new Date(item.created_at).toLocaleDateString('ja-JP')} {new Date(item.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};