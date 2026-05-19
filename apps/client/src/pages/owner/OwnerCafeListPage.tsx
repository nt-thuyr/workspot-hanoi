import { useEffect, useMemo, useState, type FC } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TopNavBar } from "../../components/TopNavBar";
import "./OwnerCafeListPage.css";

type ReservationStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

type ReservationFilter = "all" | "PENDING" | "APPROVED" | "REJECTED";

interface CafeSummary {
  id: string;
  name: string;
  address: string;
}

interface ReservationItem {
  id: string;
  res_date: string;
  res_time: string;
  num_guests: number;
  status: ReservationStatus;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface ReviewItem {
  id: number;
  rating: number;
  comment: string | null;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

const STATUS_FILTERS: Array<{ key: ReservationFilter; label: string }> = [
  { key: "all", label: "すべて" },
  { key: "PENDING", label: "未承認" },
  { key: "APPROVED", label: "承認済み" },
  { key: "REJECTED", label: "拒否" },
];

const STATUS_LABELS: Record<ReservationStatus, string> = {
  PENDING: "保留中",
  APPROVED: "確認済み",
  REJECTED: "拒否",
  CANCELLED: "キャンセル",
};

const OwnerCafeListPage: FC = () => {
  const navigate = useNavigate();
  const ownerId = localStorage.getItem("user_id");
  const [cafes, setCafes] = useState<CafeSummary[]>([]);
  const [selectedCafeId, setSelectedCafeId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<ReservationFilter>("all");
  const [isLoadingCafes, setIsLoadingCafes] = useState(true);
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (!ownerId) {
      navigate("/login");
      return;
    }

    const loadCafes = async () => {
      setIsLoadingCafes(true);
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(
          `http://localhost:3000/api/cafes/owner/${ownerId}?page=1&limit=0`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }
        );
        const result = await response.json();
        if (result.success) {
          const data = Array.isArray(result.data) ? result.data : [];
          setCafes(data);
          if (data.length > 0) {
            setSelectedCafeId((prev) => prev || data[0].id);
          }
        } else {
          setCafes([]);
        }
      } catch (error) {
        console.error("Failed to load cafes", error);
        setCafes([]);
      } finally {
        setIsLoadingCafes(false);
      }
    };

    loadCafes();
  }, [ownerId, navigate]);

  useEffect(() => {
    if (!ownerId || !selectedCafeId) {
      setReservations([]);
      setReviews([]);
      return;
    }

    const loadReservations = async () => {
      setIsLoadingReservations(true);
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(
          `http://localhost:3000/api/reservations/cafe/${selectedCafeId}?owner_id=${ownerId}&page=1&limit=0`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }
        );
        const result = await response.json();
        if (result.success) {
          setReservations(Array.isArray(result.data) ? result.data : []);
        } else {
          setReservations([]);
        }
      } catch (error) {
        console.error("Failed to load reservations", error);
        setReservations([]);
      } finally {
        setIsLoadingReservations(false);
      }
    };

    const loadReviews = async () => {
      setIsLoadingReviews(true);
      try {
        const response = await fetch(`http://localhost:3000/api/reviews/cafe/${selectedCafeId}`);
        const result = await response.json();
        if (result.success) {
          setReviews(Array.isArray(result.data) ? result.data : []);
        } else {
          setReviews([]);
        }
      } catch (error) {
        console.error("Failed to load reviews", error);
        setReviews([]);
      } finally {
        setIsLoadingReviews(false);
      }
    };

    loadReservations();
    loadReviews();
  }, [ownerId, selectedCafeId]);

  const filteredCafes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return cafes;
    return cafes.filter((cafe) => cafe.name.toLowerCase().includes(term));
  }, [cafes, searchTerm]);

  const selectedCafe = useMemo(
    () => cafes.find((cafe) => cafe.id === selectedCafeId) || null,
    [cafes, selectedCafeId],
  );

  const filteredReservations = useMemo(() => {
    if (activeFilter === "all") return reservations;
    return reservations.filter((item) => item.status === activeFilter);
  }, [activeFilter, reservations]);

  const formatDate = (rawDate: string) => {
    if (!rawDate) return "--";
    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return rawDate;
    return date.toLocaleDateString("ja-JP");
  };

  const formatTime = (rawTime: string) => {
    if (!rawTime) return "--";
    return rawTime.slice(0, 5);
  };

  const handleStatusUpdate = async (reservationId: string, status: "APPROVED" | "REJECTED") => {
    if (!ownerId) return;
    setActionLoadingId(reservationId);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`http://localhost:3000/api/reservations/${reservationId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status, owner_id: ownerId }),
      });
      const result = await response.json();
      if (result.success) {
        setReservations((prev) =>
          prev.map((item) =>
            item.id === reservationId ? { ...item, status } : item,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to update status", error);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteCafe = async () => {
    if (!selectedCafeId) return;
    const confirmed = window.confirm("このカフェを削除しますか？");
    if (!confirmed) return;
    try {
      const response = await fetch(`http://localhost:3000/api/cafes/${selectedCafeId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        setCafes((prev) => prev.filter((cafe) => cafe.id !== selectedCafeId));
        setSelectedCafeId((prev) => {
          const nextCafe = cafes.find((cafe) => cafe.id !== prev);
          return nextCafe?.id || null;
        });
      }
    } catch (error) {
      console.error("Failed to delete cafe", error);
    }
  };

  return (
    <div className="owner-cafes">
      <TopNavBar mode="owner" activeTab="cafes" />

      <main className="cafes-shell">
        <section className="cafes-rail">
          <div className="rail-header">
            <h2>マイカフェ</h2>
            <button className="rail-add" onClick={() => navigate("/cafes/register")}>
              +
            </button>
          </div>

          <label className="rail-search">
            <span>🔍</span>
            <input
              type="text"
              placeholder="カフェを検索..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>

          <div className="rail-list">
            {isLoadingCafes ? (
              <div className="rail-empty">読み込み中...</div>
            ) : filteredCafes.length === 0 ? (
              <div className="rail-empty">カフェが見つかりません</div>
            ) : (
              filteredCafes.map((cafe) => (
                <button
                  key={cafe.id}
                  className={`rail-item ${selectedCafeId === cafe.id ? "active" : ""}`}
                  onClick={() => setSelectedCafeId(cafe.id)}
                >
                  <div className="rail-thumb">
                    <span>{cafe.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="rail-meta">
                    <span className="rail-name">{cafe.name}</span>
                    <span className="rail-address">{cafe.address}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="cafes-main">
          <div className="card cafe-detail">
            <div className="detail-header">
              <div>
                <span className="main-label">選択中</span>
                <h1>{selectedCafe?.name || "カフェを選択してください"}</h1>
              </div>
              <div className="main-actions">
                {selectedCafe?.id && (
                  <Link className="icon-button" to={`/cafes/edit/${selectedCafe.id}`} aria-label="edit">
                    ✎
                  </Link>
                )}
                <button className="icon-button danger" onClick={handleDeleteCafe} aria-label="delete">
                  🗑
                </button>
              </div>
            </div>

            <div className="detail-body">
              <div className="detail-column detail-panel">
                <div className="panel-header">
                  <div className="panel-title">
                    <span className="panel-icon">🗓️</span>
                    <h2>最近の予約</h2>
                  </div>
                  <div className="panel-tabs">
                    {STATUS_FILTERS.map((filter) => (
                      <button
                        key={filter.key}
                        className={filter.key === activeFilter ? "active" : ""}
                        onClick={() => setActiveFilter(filter.key)}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="panel-body">
                  {isLoadingReservations ? (
                    <div className="panel-empty">予約を読み込み中...</div>
                  ) : filteredReservations.length === 0 ? (
                    <div className="panel-empty">予約はまだありません</div>
                  ) : (
                    filteredReservations.map((item) => (
                      <div key={item.id} className="reservation-row">
                        <div className="reservation-profile">
                          <div className="profile-avatar">
                            {item.profiles?.avatar_url ? (
                              <img src={item.profiles.avatar_url} alt={item.profiles.full_name || "guest"} />
                            ) : (
                              <span>
                                {(item.profiles?.full_name || "U").charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="profile-name">{item.profiles?.full_name || "ゲスト"}</div>
                            <div className="profile-meta">
                              {formatDate(item.res_date)} · {formatTime(item.res_time)} · {item.num_guests}名
                            </div>
                          </div>
                        </div>
                        <div className="reservation-actions">
                          <span className={`status-chip status-${item.status.toLowerCase()}`}>
                            {STATUS_LABELS[item.status]}
                          </span>
                          {item.status === "PENDING" && (
                            <div className="action-group">
                              <button
                                className="action-btn approve"
                                disabled={actionLoadingId === item.id}
                                onClick={() => handleStatusUpdate(item.id, "APPROVED")}
                              >
                                承認
                              </button>
                              <button
                                className="action-btn reject"
                                disabled={actionLoadingId === item.id}
                                onClick={() => handleStatusUpdate(item.id, "REJECTED")}
                              >
                                拒否
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="detail-column detail-panel">
                <div className="panel-header">
                  <div className="panel-title">
                    <span className="panel-icon">⭐</span>
                    <h2>カフェレビュー</h2>
                  </div>
                </div>

                <div className="panel-body">
                  {isLoadingReviews ? (
                    <div className="panel-empty">レビューを読み込み中...</div>
                  ) : reviews.length === 0 ? (
                    <div className="panel-empty">レビューはまだありません</div>
                  ) : (
                    reviews.slice(0, 3).map((review) => (
                      <div key={review.id} className="review-card">
                        <div className="review-header">
                          <div className="review-avatar">
                            {review.profiles?.avatar_url ? (
                              <img src={review.profiles.avatar_url} alt={review.profiles?.full_name || "reviewer"} />
                            ) : (
                              <span>
                                {(review.profiles?.full_name || "U").charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="review-name">{review.profiles?.full_name || "ゲスト"}</div>
                            <div className="review-stars">
                              {"★".repeat(review.rating)}
                              {"☆".repeat(Math.max(0, 5 - review.rating))}
                            </div>
                          </div>
                        </div>
                        <p className="review-comment">{review.comment || "コメントはありません"}</p>
                        <button
                          className="review-media"
                          type="button"
                          onClick={() => setPreviewImage("https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=900")}
                        >
                          <span>画像を見る</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {previewImage && (
        <button className="image-modal" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="Review" />
        </button>
      )}
    </div>
  );
};

export default OwnerCafeListPage;
