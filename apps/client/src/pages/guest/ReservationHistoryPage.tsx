import { useState, useEffect, type FC } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
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

// Component Hộp thoại Xác nhận Hủy
function CancelModal({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-icon">🗓️</div>
                <h3 className="modal-title">予約をキャンセルしますか？</h3>
                <p className="modal-subtitle">Bạn có chắc chắn muốn hủy đặt chỗ?</p>
                <p className="modal-warning">
                    本当にこの予約をキャンセルしてもよろしいですか？<br />
                    <span>キャンセルすると元に戻すことはできません。</span>
                </p>
                <div className="modal-actions">
                    <button onClick={onClose} className="btn-modal-cancel">戻る / Quay lại</button>
                    <button onClick={() => { onConfirm(); onClose(); }} className="btn-modal-confirm">キャンセルする / Hủy</button>
                </div>
            </div>
        </div>
    );
}

const ReservationHistoryPage: FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<string>("all");
    const [reservations, setReservations] = useState<ReservationInfo[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);

    // Lấy trạng thái đăng nhập
    const isLoggedIn = !!localStorage.getItem("access_token");
    const userRole = localStorage.getItem("user_role");
    const navMode = isLoggedIn && userRole === 'cafe_owner' ? 'owner' : 'guest';

    // Gọi API Backend lấy danh sách lịch sử đặt chỗ
    const fetchReservationHistory = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("access_token");

            if (!token) {
                setReservations([]);
                setLoading(false);
                return;
            }

            // Gọi lên route api của tầng server
            const response = await fetch("http://localhost:3000/api/reservations/history", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            
            const result = await response.json();

            if (result.success) {
                setReservations(result.data); // Dữ liệu thật từ DB
            } else {
                console.error("Lấy lịch sử thất bại:", result.message);
                setReservations([]); 
            }
        } catch (error) {
            console.error("Lỗi khi tải lịch sử đặt chỗ:", error);
            setReservations([]);
        } finally {
            setLoading(false);
        }
    };

    // Logic Hủy Đặt Chỗ
    const executeCancel = async () => {
        if (!cancelTargetId) return;
        try {
            const toastId = toast.loading("キャンセル処理中...");
            const response = await fetch(`http://localhost:3000/api/reservations/${cancelTargetId}/cancel`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("access_token")}`
                }
            });
            const result = await response.json();

            if (result.success) {
                toast.success("予約をキャンセルしました。", { id: toastId });
                fetchReservationHistory();
            } else {
                toast.error(result.message || "キャンセルに失敗しました。", { id: toastId });
            }
        } catch (error) {
            toast.error("サーバーエラーが発生しました。");
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
                                            <button 
                                                className="res-action-btn res-btn--danger"
                                                onClick={() => setCancelTargetId(item.id)}
                                            >
                                                予約キャンセル
                                            </button>
                                        )}

                                        {item.status === "completed" && (
                                            <button 
                                                className="res-action-btn res-btn--primary"
                                                onClick={() => toast("レビュー機能は開発中です！", { icon: '✍️' })}
                                            >
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

            {/* Modal Hủy Đặt chỗ */}
            {cancelTargetId && (
                <CancelModal
                    onConfirm={executeCancel}
                    onClose={() => setCancelTargetId(null)}
                />
            )}
        </div>
    );
};

export default ReservationHistoryPage;