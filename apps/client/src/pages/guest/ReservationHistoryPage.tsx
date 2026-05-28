import { useState, useEffect, type FC } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { TopNavBar } from "../../components/TopNavBar";
import "./ReservationHistoryPage.css";

// Định nghĩa cấu trúc dữ liệu Lịch sử đặt chỗ
interface ReservationInfo {
    id: number;
    cafeId: number;
    cafeName: string;
    cafeAddress?: string;
    imageUrl?: string;
    reservationDate: string;   // yyyy-mm-dd
    timeSlot: string;          // "09:00 AM"
    seatNumber: string;
    status: "pending" | "approved" | "rejected" | "cancelled" | "completed";
    approvalStatus?: "pending" | "approved" | "rejected";
    timeCategory?: "upcoming" | "past";
    createdAt: string;
    amount: number;
}

interface ReviewCafeInfo {
    id: string;
    name: string;
    address?: string;
    avg_rating?: number;
    cafe_images?: Array<{ image_url: string }>;
}

interface ReviewInfo {
    id: number;
    user_id: string;
    cafe_id: string;
    rating: number;
    comment: string;
    created_at: string;
    cafes?: ReviewCafeInfo;
}



// Tùy chọn sắp xếp (khu vực 12)
const SORT_OPTIONS = [
    { key: "name", label: "店名" },           // Tên quán
    { key: "date_desc", label: "日付（新しい順）" }, // Ngày mới nhất
    { key: "date_asc", label: "日付（古い順）" },  // Ngày cũ nhất
];

// Component Modal Xác nhận Hủy đặt chỗ
function CancelModal({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
    return (
        <div className="rhp-modal-overlay" onClick={onClose} id="modal-cancel-overlay">
            <div className="rhp-modal-box" onClick={(e) => e.stopPropagation()} id="modal-cancel-box">
                <div className="rhp-modal-icon" id="modal-calendar-icon">
                    <div className="rhp-modal-icon-circle" id="modal-calendar-circle">
                        <svg width="34" height="34" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* Calendar sheet outline */}
                            <rect x="5" y="8" width="22" height="19" rx="3" fill="none" stroke="#48382c" strokeWidth="2.2" />
                            {/* Horizontal dividing line */}
                            <line x1="5" y1="14" x2="27" y2="14" stroke="#48382c" strokeWidth="2.2" />
                            {/* Two spiral rings */}
                            <rect x="9" y="3" width="2.5" height="7" rx="1.2" fill="#48382c" />
                            <rect x="20" y="3" width="2.5" height="7" rx="1.2" fill="#48382c" />
                            {/* Inner cross 'X' inside box */}
                            <rect x="11" y="17" width="10" height="7" rx="1" fill="none" stroke="#48382c" strokeWidth="1.8" />
                            <line x1="13.5" y1="19.5" x2="18.5" y2="21.5" stroke="#48382c" strokeWidth="1.8" strokeLinecap="round" />
                            <line x1="18.5" y1="19.5" x2="13.5" y2="21.5" stroke="#48382c" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                    </div>
                </div>
                <h3 className="rhp-modal-title">予約をキャンセルしますか？</h3>
                <p className="rhp-modal-desc">
                    本当にこの予約をキャンセルしてもよろしいですか？<br />
                    <span className="rhp-modal-warn">キャンセルすると元に戻すことはできません。</span>
                </p>
                <div className="rhp-modal-actions">
                    <button onClick={onClose} className="rhp-modal-btn rhp-modal-btn--back" id="modal-btn-back">
                        戻る
                    </button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        className="rhp-modal-btn rhp-modal-btn--confirm"
                        id="modal-btn-confirm"
                    >
                        キャンセルする
                    </button>
                </div>
            </div>
        </div>
    );
}

// Định dạng ngày từ ISO thành "yyyy/MM/dd"
function formatDate(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}/${mm}/${dd}`;
    } catch {
        return dateStr;
    }
}

const ReservationHistoryPage: FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [sortKey, setSortKey] = useState<string>("date_desc");
    const [reservations, setReservations] = useState<ReservationInfo[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);

    // Kiểm tra trạng thái đăng nhập
    const isLoggedIn = !!localStorage.getItem("access_token");

    // Gọi API lấy danh sách lịch sử đặt chỗ
    const fetchReservationHistory = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("access_token");
            if (!token) {
                setReservations([]);
                setLoading(false);
                return;
            }
            
            // Lấy lịch sử đặt chỗ
            const response = await fetch("http://localhost:3000/api/reservations/history", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const result = await response.json();
            if (result.success) {
                setReservations(result.data);
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

    // Hủy đặt chỗ
    const executeCancel = async () => {
        if (!cancelTargetId) return;
        const toastId = toast.loading("キャンセル処理中...");
        try {
            const response = await fetch(
                `http://localhost:3000/api/reservations/${cancelTargetId}/cancel`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                    },
                }
            );
            const result = await response.json();
            if (result.success) {
                toast.success("予約をキャンセルしました。", { id: toastId });
                fetchReservationHistory();
            } else {
                toast.error(result.message || "キャンセルに失敗しました。", { id: toastId });
            }
        } catch (err) {
            console.error("Lỗi hủy đặt chỗ:", err);
            toast.error("サーバーエラーが発生しました。", { id: toastId });
        } finally {
            setCancelTargetId(null);
        }
    };

    useEffect(() => {
        fetchReservationHistory();
    }, []);

    // Xử lý Lọc và Sắp xếp cho Tab Đặt chỗ (reserved)
    const reservedFiltered = reservations.filter((item) =>
        item.cafeName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const reservedSorted = [...reservedFiltered].sort((a, b) => {
        if (sortKey === "name") return a.cafeName.localeCompare(b.cafeName);
        if (sortKey === "date_asc")
            return new Date(a.reservationDate).getTime() - new Date(b.reservationDate).getTime();
        return new Date(b.reservationDate).getTime() - new Date(a.reservationDate).getTime();
    });

    // Hàm parse ngày và giờ thành đối tượng Date (vẫn giữ lại cho badges nếu cần)
    const parseReservationDateTime = (dateStr: string, timeStr: string): Date => {
        try {
            const normalizedDate = dateStr.replace(/\//g, '-'); // YYYY-MM-DD
            const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
            if (match) {
                let hour = parseInt(match[1] || "0", 10);
                const min = parseInt(match[2] || "0", 10);
                const ampm = (match[3] || "").toUpperCase();
                if (ampm === "PM" && hour < 12) hour += 12;
                if (ampm === "AM" && hour === 12) hour = 0;
                
                const [year = 0, month = 1, day = 1] = normalizedDate.split('-').map(Number);
                return new Date(year, month - 1, day, hour, min);
            }
            
            const hhmmMatch = timeStr.match(/^(\d{1,2}):(\d{2})/);
            if (hhmmMatch) {
                const hour = parseInt(hhmmMatch[1] || "0", 10);
                const min = parseInt(hhmmMatch[2] || "0", 10);
                const [year = 0, month = 1, day = 1] = normalizedDate.split('-').map(Number);
                return new Date(year, month - 1, day, hour, min);
            }

            return new Date(normalizedDate);
        } catch {
            return new Date(dateStr);
        }
    };

    // Badge phê duyệt (số 20 = 拒否済み / 23 = 承認済み / 25 = 未承認 / キャンセル済み)
    const renderApprovalBadge = (item: ReservationInfo) => {
        const appStatus = (item.approvalStatus || (item.status === "completed" ? "approved" : item.status === "cancelled" ? "cancelled" : "pending")).toUpperCase();
        
        if (appStatus === "REJECTED") {
            return <span className="rhp-badge rhp-badge--rejected" id={`badge-rejected-${item.id}`}>拒否済み</span>;
        }
        if (appStatus === "APPROVED") {
            return <span className="rhp-badge rhp-badge--approved" id={`badge-approved-${item.id}`}>承認済み</span>;
        }
        if (appStatus === "PENDING") {
            return <span className="rhp-badge rhp-badge--pending" id={`badge-pending-${item.id}`}>未承認</span>;
        }
        if (appStatus === "CANCELLED") {
            return <span className="rhp-badge rhp-badge--cancelled" id={`badge-cancelled-${item.id}`}>キャンセル済み</span>;
        }
        return null;
    };

    // Badge thời gian (số 21 = 今後の予定 / 24 = 過去の履歴)
    const renderTimeBadge = (item: ReservationInfo) => {
        const appStatus = (item.approvalStatus || (item.status === "completed" ? "approved" : item.status === "cancelled" ? "cancelled" : "pending")).toUpperCase();
        if (appStatus === "CANCELLED") return null;

        const resDateTime = parseReservationDateTime(item.reservationDate, item.timeSlot);
        const isUpcoming = resDateTime.getTime() >= new Date().getTime();
        
        if (isUpcoming) {
            return <span className="rhp-badge rhp-badge--upcoming" id={`badge-upcoming-${item.id}`}>今後の予定</span>;
        }
        return <span className="rhp-badge rhp-badge--past" id={`badge-past-${item.id}`}>過去の履歴</span>;
    };

    // Kiểm tra card có thể hủy hay không (không ở trạng thái hủy/từ chối/quá khứ)
    const canCancel = (item: ReservationInfo) => {
        const appStatus = (item.approvalStatus || "").toUpperCase();
        
        // Đã hủy hoặc bị từ chối thì không thể hủy
        if (appStatus === "CANCELLED" || appStatus === "REJECTED") {
            return false;
        }

        // Kiểm tra xem thời gian đặt chỗ có ở tương lai hay không
        const resDateTime = parseReservationDateTime(item.reservationDate, item.timeSlot);
        const isUpcoming = resDateTime.getTime() >= new Date().getTime();
        
        return isUpcoming;
    };

    return (
        <div className="rhp-root">
            {/* THANH NAVBAR */}
            <TopNavBar mode="guest" activeTab="history" />

            {/* LAYOUT CHÍNH: sidebar trái + nội dung phải */}
            <div className="rhp-body">

                {/* ===== SIDEBAR TRÁI ===== */}
                <aside className="rhp-sidebar">

                    {/* Khu vực 10: Thanh tìm kiếm */}
                    <div className="rhp-sidebar-section">
                        <div className="rhp-search-bar" id="search-bar">
                            <svg className="rhp-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                id="search-input"
                                type="text"
                                className="rhp-search-input"
                                placeholder="施設名で検索"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Khu vực 11-12: Nhãn "並べ替え" + Dropdown sắp xếp */}
                    <div className="rhp-sidebar-section">
                        <p className="rhp-sidebar-label" id="sort-label">並べ替え</p>
                        <div className="rhp-select-wrapper" id="sort-select-wrapper">
                            <select
                                id="sort-select"
                                className="rhp-select"
                                value={sortKey}
                                onChange={(e) => setSortKey(e.target.value)}
                            >
                                {SORT_OPTIONS.map((opt) => (
                                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                                ))}
                            </select>
                            <svg className="rhp-select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </div>
                    </div>
                </aside>

                {/* ===== KHU VỰC PHẢI: Danh sách ===== */}
                <main className="rhp-main" id="reservation-main">

                    {/* Khu vực 13: Tiêu đề */}
                    <h1 className="rhp-page-title" id="page-title">予約の履歴</h1>

                    {/* Khu vực 14: Danh sách thẻ */}
                    {loading ? (
                        <div className="rhp-state-view" id="loading-view">
                            <div className="rhp-spinner" />
                            <p>読み込み中...</p>
                        </div>
                    ) : reservedSorted.length === 0 ? (
                        <div className="rhp-state-view" id="empty-view">
                            <span className="rhp-empty-icon">📅</span>
                            <p className="rhp-empty-text">
                                該当する予約履歴が見つかりません。
                            </p>
                        </div>
                    ) : (
                        <div className="rhp-card-list" id="reservation-card-list">
                            {reservedSorted.map((item) => (
                                <div
                                    key={item.id}
                                    className="rhp-card"
                                    id={`reservation-card-${item.id}`}
                                    onClick={() => navigate(`/?cafeId=${item.cafeId}`)}
                                    style={{ cursor: "pointer" }}
                                >
                                    {/* Khu vực 15: Ảnh cafe */}
                                    <div className="rhp-card-img-wrap" id={`card-img-${item.id}`}>
                                        <img
                                            src={item.imageUrl || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500"}
                                            alt={item.cafeName}
                                            className="rhp-card-img"
                                        />
                                    </div>

                                    {/* Nội dung card */}
                                    <div className="rhp-card-body">

                                        {/* Khu vực 16: Tên cafe */}
                                        <h2 className="rhp-card-name" id={`card-name-${item.id}`}>
                                            {item.cafeName}
                                        </h2>

                                        {/* Khu vực 18: Ngày + giờ badge */}
                                        <div className="rhp-card-datetime" id={`card-datetime-${item.id}`}>
                                            <span className="rhp-datetime-badge">
                                                {formatDate(item.reservationDate)}&nbsp;&nbsp;{item.timeSlot}
                                            </span>
                                        </div>

                                        {/* Khu vực 19: Địa chỉ */}
                                        {item.cafeAddress && (
                                            <div className="rhp-card-address" id={`card-address-${item.id}`}>
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="rhp-addr-icon">
                                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                                    <circle cx="12" cy="10" r="3" />
                                                </svg>
                                                <span>{item.cafeAddress}</span>
                                            </div>
                                        )}

                                        {/* Khu vực 20-25: Badges trạng thái */}
                                        <div className="rhp-card-badges" id={`card-badges-${item.id}`}>
                                            {renderApprovalBadge(item)}
                                            {renderTimeBadge(item)}
                                        </div>
                                    </div>

                                    {/* Khu vực 17: Arrow icon (phải) */}
                                    <div className="rhp-card-right" onClick={(e) => e.stopPropagation()}>

                                        {/* Khu vực 17: Mũi tên điều hướng */}
                                        <svg className="rhp-card-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="9 18 15 12 9 6" />
                                        </svg>

                                        {/* Khu vực 22: Nút hủy đặt chỗ */}
                                        {canCancel(item) && (
                                            <button
                                                id={`btn-cancel-${item.id}`}
                                                className="rhp-btn-cancel"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setCancelTargetId(item.id);
                                                }}
                                            >
                                                <span className="rhp-btn-cancel-x">×</span>
                                                予約をキャンセル
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* Modal Xác nhận Hủy */}
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