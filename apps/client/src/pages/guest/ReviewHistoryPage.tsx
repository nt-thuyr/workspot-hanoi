import { FC, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { TopNavBar } from "../../components/TopNavBar";
import "./ReviewHistoryPage.css";

interface ReviewImage {
  id: number;
  image_url: string;
}

interface CafeInfo {
  id: string;
  name: string;
  address?: string;
  avg_rating?: number;
  cafe_images?: Array<{ image_url: string }>;
}

interface UserReview {
  id: number;
  user_id: string;
  cafe_id: string;
  rating: number;
  comment: string;
  created_at: string;
  cafes?: CafeInfo;
  review_images?: ReviewImage[];
}

// ── Delete confirmation modal ──────────────────────────────
function DeleteModal({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="rh-modal-overlay" onClick={onClose}>
      <div className="rh-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="rh-modal-icon">🗑️</div>
        <h3 className="rh-modal-title">レビューを削除しますか？</h3>
        <p className="rh-modal-desc">
          このレビューを削除してもよろしいですか？<br />
          <span className="rh-modal-warn">削除すると元に戻すことはできません。</span>
        </p>
        <div className="rh-modal-actions">
          <button className="rh-modal-btn rh-modal-btn--back" onClick={onClose} id="rh-modal-back">
            戻る
          </button>
          <button
            className="rh-modal-btn rh-modal-btn--danger"
            onClick={() => { onConfirm(); onClose(); }}
            id="rh-modal-confirm-delete"
          >
            削除する
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Star display ───────────────────────────────────────────
function StarRow({ rating }: { rating: number }) {
  return (
    <div className="rh-stars">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={`rh-star ${s <= rating ? "rh-star--filled" : "rh-star--empty"}`}>★</span>
      ))}
    </div>
  );
}

// ── Date format ────────────────────────────────────────────
function fmtDate(iso: string) {
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  } catch { return iso; }
}

// ── Main Page ──────────────────────────────────────────────
const ReviewHistoryPage: FC = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const accessToken = localStorage.getItem("access_token");
  const userId      = localStorage.getItem("user_id");
  const userName    = localStorage.getItem("user_name") || "ゲスト";
  const avatarUrl   = localStorage.getItem("user_avatar_url");

  // ── Fetch user reviews ──
  const fetchReviews = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const res  = await fetch(`http://localhost:3000/api/reviews/user/${userId}`);
      const json = await res.json();
      if (json.success) {
        setReviews(json.data || []);
      } else {
        console.error("Failed to fetch user reviews:", json.message);
        setReviews([]);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
      toast.error("レビューの読み込みに失敗しました。");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!accessToken) {
      toast.error("ログインが必要です。");
      navigate("/login");
      return;
    }
    fetchReviews();
  }, [accessToken, fetchReviews, navigate]);

  // ── Delete review ──
  const executeDelete = async () => {
    if (!deleteTargetId) return;
    const toastId = toast.loading("削除処理中...");
    try {
      const res  = await fetch(`http://localhost:3000/api/reviews/${deleteTargetId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();
      if (json.success) {
        toast.success("レビューを削除しました。", { id: toastId });
        fetchReviews();
      } else {
        toast.error(json.message || "削除に失敗しました。", { id: toastId });
      }
    } catch {
      toast.error("サーバーエラーが発生しました。", { id: toastId });
    } finally {
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="rh-root">
      <TopNavBar mode="guest" activeTab="reviews" />

      <div className="rh-body">

        {/* ── LEFT SIDEBAR: user profile ── */}
        <aside className="rh-sidebar">
          <div className="rh-profile-card">
            {/* Avatar with camera overlay */}
            <div className="rh-avatar-wrap" id="user-avatar-wrap">
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName} className="rh-avatar-img" />
              ) : (
                <div className="rh-avatar-placeholder">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Camera icon (decorative — No.8 in mockup) */}
              <div className="rh-avatar-camera" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
            </div>

            {/* Username */}
            <p className="rh-username" id="rh-username">{userName}</p>

            {/* Stats */}
            <div className="rh-stats">
              <div className="rh-stat-item">
                <span className="rh-stat-num">{reviews.length}</span>
                <span className="rh-stat-label">レビュー</span>
              </div>
              {reviews.length > 0 && (
                <div className="rh-stat-item">
                  <span className="rh-stat-num">
                    {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
                  </span>
                  <span className="rh-stat-label">平均評価</span>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ── RIGHT: review timeline ── */}
        <main className="rh-main">
          <h1 className="rh-page-title" id="rh-page-title">レビュータイムライン</h1>

          {loading ? (
            <div className="rh-state-box" id="rh-loading">
              <div className="rh-spinner" />
              <p>読み込み中...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="rh-state-box" id="rh-empty">
              <span className="rh-empty-icon">📝</span>
              <p className="rh-empty-text">まだレビューがありません。</p>
              <p className="rh-empty-sub">カフェを訪問して最初のレビューを書きましょう！</p>
            </div>
          ) : (
            <div className="rh-timeline" id="rh-timeline">
              {reviews.map((rev) => (
                <article key={rev.id} className="rh-card" id={`rh-card-${rev.id}`}>

                  {/* Cafe info header */}
                  <div className="rh-card-header">
                    <div className="rh-cafe-info">
                      <h2
                        className="rh-cafe-name"
                        id={`rh-cafe-name-${rev.id}`}
                        onClick={() => navigate(`/?cafeId=${rev.cafe_id}`)}
                      >
                        {rev.cafes?.name || "カフェ"}
                      </h2>
                      {rev.cafes?.address && (
                        <p className="rh-cafe-address" id={`rh-cafe-addr-${rev.id}`}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          {rev.cafes.address}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Star rating row */}
                  <StarRow rating={rev.rating} />

                  {/* Review text */}
                  <p className="rh-comment" id={`rh-comment-${rev.id}`}>{rev.comment}</p>

                  {/* Image gallery */}
                  {rev.review_images && rev.review_images.length > 0 && (
                    <div className="rh-gallery" id={`rh-gallery-${rev.id}`}>
                      {rev.review_images.map((img) => (
                        <div
                          key={img.id}
                          className="rh-gallery-item"
                          onClick={() => window.open(img.image_url, "_blank")}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === "Enter" && window.open(img.image_url, "_blank")}
                        >
                          <img src={img.image_url} alt="Review photo" className="rh-gallery-img" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer: date + delete */}
                  <div className="rh-card-footer">
                    <span className="rh-date" id={`rh-date-${rev.id}`}>{fmtDate(rev.created_at)}</span>
                    <button
                      id={`rh-delete-${rev.id}`}
                      className="rh-delete-btn"
                      title="レビューを削除"
                      onClick={() => setDeleteTargetId(rev.id)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Delete confirmation modal */}
      {deleteTargetId && (
        <DeleteModal
          onConfirm={executeDelete}
          onClose={() => setDeleteTargetId(null)}
        />
      )}
    </div>
  );
};

export default ReviewHistoryPage;
