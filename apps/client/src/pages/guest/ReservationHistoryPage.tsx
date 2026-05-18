import { useState, useEffect, type FC } from "react";
import { useNavigate } from "react-router-dom";
import { TopNavBar } from "../../components/TopNavBar";
import "./ReservationHistoryPage.css";

// Định nghĩa cấu trúc dữ liệu Lịch sử đặt chỗ (Khớp với các trường từ reservation.model.ts)
interface ReservationInfo {
    id: number;
    cafeId: number;
    cafeName: string;
    imageUrl?: string;
    reservationDate: string;
    timeSlot: string; // Ví dụ: "09:00 - 12:00"
    seatNumber: string;
    status: "upcoming" | "completed" | "cancelled";
    createdAt: string;
    amount: number;
}

// Các tab bộ lọc bằng tiếng Nhật đúng theo đặc tả yêu cầu
const TABS = [
    { key: "all", label: "すべて" },          // Tất cả
    { key: "upcoming", label: "予約中" },     // Sắp tới / Đang đặt
    { key: "completed", label: "利用完了" },   // Đã hoàn thành
    { key: "cancelled", label: "キャンセル済" } // Đã hủy
];

const ReservationHistoryPage: FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<string>("all");
    const [reservations, setReservations] = useState<ReservationInfo[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // Lấy trạng thái đăng nhập
    const isLoggedIn = !!localStorage.getItem("access_token");
    const userRole = localStorage.getItem("user_role");
    const navMode = isLoggedIn && userRole === 'cafe_owner' ? 'owner' : 'guest';

    // Gọi API Backend lấy danh sách lịch sử đặt chỗ
    const fetchReservationHistory = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("access_token");

            // Gọi lên route api của tầng server
            const response = await fetch("http://localhost:3000/api/reservations/history", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const result = await response.json();

            if (result.success) {
                setReservations(result.data);
            } else {
                // Dữ liệu mẫu (Mock data) dự phòng nếu backend của nhóm chưa seed dữ liệu lịch sử
                setReservations([
                    {
                        id: 1,
                        cafeId: 101,
                        cafeName: "Cerenote Coffee",
                        imageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500",
                        reservationDate: "2026/05/20",
                        timeSlot: "09:00 - 12:00",
                        seatNumber: "A-04 (コンセント席)",
                        status: "upcoming",
                        createdAt: "2026/05/15",
                        amount: 50000
                    },
                    {
                        id: 2,
                        cafeId: 102,
                        cafeName: "Xofa Café & Bistro",
                        imageUrl: "https://images.unsplash.com/photo-1498804103079-a6351b050096?w=500",
                        reservationDate: "2026/05/10",
                        timeSlot: "14:00 - 18:00",
                        seatNumber: "B-12 (ソファー席)",
                        status: "completed",
                        createdAt: "2026/05/09",
                        amount: 75000
                    },
                    {
                        id: 3,
                        cafeId: 103,
                        cafeName: "Kafeville",
                        imageUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500",
                        reservationDate: "2026/05/01",
                        timeSlot: "08:00 - 11:00",
                        seatNumber: "C-02 (窓際席)",
                        status: "cancelled",
                        createdAt: "2026/04/30",
                        amount: 40000
                    }
                ]);
            }
        } catch (error) {
            console.error("Lỗi khi tải lịch sử đặt chỗ:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReservationHistory();
    }, []);

    // Lọc danh sách theo Tab đang chọn
    const filteredReservations = reservations.filter((item) => {
        if (activeTab === "all") return true;
        return item.status === activeTab;
    });

    // Hàm hiển thị Badge trạng thái tương ứng
    const renderStatusBadge = (status: string) => {
        switch (status) {
            case "upcoming":
                return <span className="res-badge res-badge--upcoming">予約確定</span>;
            case "completed":
                return <span className="res-badge res-badge--completed">利用完了</span>;
            case "cancelled":
                return <span className="res-badge res-badge--cancelled">キャンセル済</span>;
            default:
                return null;
        }
    };

    // Định dạng tiền tệ VND sang chuỗi hiển thị
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
    };

    return (
        <div className="history-root">
            {/* THANH NAVBAR */}
            <TopNavBar mode={navMode} activeTab="history" />

            {/* NỘI DUNG CHÍNH */}
            <main className="history-container">
                <header className="history-header">
                    <h1 className="history-title">予約履歴</h1>
                    <p className="history-subtitle">これまでのワークスペースの予約・利用履歴を確認できます。</p>
                </header>

                {/* CÁC TAB BỘ LỌC */}
                <div className="history-tabs">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            className={`history-tab-btn ${activeTab === tab.key ? "history-tab-btn--active" : ""}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* DANH SÁCH LỊCH SỬ */}
                {loading ? (
                    <div className="history-state-view">
                        <p>読み込み中...</p>
                    </div>
                ) : filteredReservations.length === 0 ? (
                    <div className="history-state-view">
                        <span className="material-symbols-outlined empty-icon">calendar_today</span>
                        <p className="empty-text">該当する予約履歴が見つかりません。</p>
                    </div>
                ) : (
                    <div className="reservation-list">
                        {filteredReservations.map((item) => (
                            <div key={item.id} className="reservation-card">
                                <div className="res-card-main">
                                    {/* Ảnh quán cafe */}
                                    <div className="res-image-wrapper">
                                        <img
                                            src={item.imageUrl || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500"}
                                            alt={item.cafeName}
                                            className="res-cafe-img"
                                        />
                                    </div>

                                    {/* Thông tin chi tiết lịch đặt */}
                                    <div className="res-info-content">
                                        <div className="res-info-top">
                                            <h2 className="res-cafe-name">{item.cafeName}</h2>
                                            {renderStatusBadge(item.status)}
                                        </div>

                                        <div className="res-details-grid">
                                            <div className="res-detail-item">
                                                <span className="material-symbols-outlined detail-icon">event</span>
                                                <span className="detail-text"><strong>利用制限日:</strong> {item.reservationDate}</span>
                                            </div>
                                            <div className="res-detail-item">
                                                <span className="material-symbols-outlined detail-icon">schedule</span>
                                                <span className="detail-text"><strong>時間帯:</strong> {item.timeSlot}</span>
                                            </div>
                                            <div className="res-detail-item">
                                                <span className="material-symbols-outlined detail-icon">chair</span>
                                                <span className="detail-text"><strong>座席番号:</strong> {item.seatNumber}</span>
                                            </div>
                                            <div className="res-detail-item">
                                                <span className="material-symbols-outlined detail-icon">payments</span>
                                                <span className="detail-text"><strong>料金:</strong> {formatCurrency(item.amount)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Các nút hành động phía dưới thẻ */}
                                <div className="res-card-actions">
                                    <span className="res-created-date">予約日: {item.createdAt}</span>
                                    <div className="res-btn-group">
                                        <button
                                            className="res-action-btn res-btn--secondary"
                                            onClick={() => navigate(`/cafes/${item.cafeId}`)}
                                        >
                                            店舗詳細
                                        </button>

                                        {item.status === "upcoming" && (
                                            <button className="res-action-btn res-btn--danger">
                                                予約キャンセル
                                            </button>
                                        )}

                                        {item.status === "completed" && (
                                            <button className="res-action-btn res-btn--primary">
                                                レビューを書く
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default ReservationHistoryPage;