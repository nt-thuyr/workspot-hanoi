import { FC, useState, useEffect, useCallback, useRef } from "react";
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

interface LightboxState {
  images: string[];
  index: number;
}

// ── Delete confirmation modal ──────────────────────────────
function DeleteModal({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="rh-modal-overlay" onClick={onClose}>
      <div className="rh-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="rh-modal-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </div>
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

// ── Zoom modal ──────────────────────────────
function AvatarZoomModal({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) {
  return (
    <div className="rh-zoom-modal-overlay" onClick={onClose} id="rh-zoom-overlay">
      <div className="rh-zoom-modal-content" onClick={(e) => e.stopPropagation()}>
        <img src={imageUrl} alt="Zoomed Avatar" className="rh-zoom-modal-img" id="rh-zoom-img" />
        <button className="rh-zoom-modal-close" onClick={onClose} aria-label="Close zoomed avatar" id="rh-zoom-close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="24" height="24">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(localStorage.getItem("user_avatar_url"));
  const [isAvatarZoomed, setIsAvatarZoomed] = useState(false);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  const openLightbox = (images: string[], startIndex: number) => {
    setLightbox({ images, index: startIndex });
  };

  // Keyboard navigation for lightbox
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!lightbox) return;
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") {
        setLightbox((prev) =>
          prev ? { ...prev, index: (prev.index + 1) % prev.images.length } : null
        );
      }
      if (e.key === "ArrowLeft") {
        setLightbox((prev) =>
          prev
            ? { ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length }
            : null
        );
      }
    },
    [lightbox]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const accessToken = localStorage.getItem("access_token");
  const userId      = localStorage.getItem("user_id");
  const userName    = localStorage.getItem("user_name") || "ゲスト";

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("画像サイズは5MB以下にしてください。");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    const toastId = toast.loading("アバターを更新中...");
    try {
      const res = await fetch(`http://localhost:3000/api/profiles/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const result = await res.json();
      if (result.success && result.data?.avatar_url) {
        const newAvatarUrl = result.data.avatar_url;
        localStorage.setItem("user_avatar_url", newAvatarUrl);
        setCurrentAvatarUrl(newAvatarUrl);
        window.dispatchEvent(new Event("avatarUpdated"));
        toast.success("アバターを変更しました！", { id: toastId });
      } else {
        toast.error(result.message || "アバターの更新に失敗しました。", { id: toastId });
      }
    } catch (err) {
      console.error("Error uploading avatar:", err);
      toast.error("サーバーエラーが発生しました。", { id: toastId });
    }
  };

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

  useEffect(() => {
    const handleAvatarUpdated = () => {
      setCurrentAvatarUrl(localStorage.getItem("user_avatar_url"));
    };
    window.addEventListener("avatarUpdated", handleAvatarUpdated);
    return () => {
      window.removeEventListener("avatarUpdated", handleAvatarUpdated);
    };
  }, []);

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
            {/* Avatar wrapper */}
            <div 
              className="rh-avatar-wrap" 
              id="user-avatar-wrap"
              style={{ cursor: currentAvatarUrl ? "zoom-in" : "default" }}
              onClick={() => {
                if (currentAvatarUrl) {
                  setIsAvatarZoomed(true);
                }
              }}
              title={currentAvatarUrl ? "アバターを拡大" : undefined}
            >
              {currentAvatarUrl ? (
                <img src={currentAvatarUrl} alt={userName} className="rh-avatar-img" id="user-avatar-img" />
              ) : (
                <div className="rh-avatar-placeholder">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Camera icon to change avatar */}
              <div 
                className="rh-avatar-camera" 
                style={{ cursor: "pointer" }}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                title="アバターを変更"
                id="rh-avatar-camera-btn"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={handleAvatarChange}
              />
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

                  {/* User profile + Cafe info header */}
                  <div className="rh-card-header">
                    <div className="rh-user-info-group">
                      {currentAvatarUrl ? (
                        <img src={currentAvatarUrl} alt={userName} className="rh-card-avatar" id={`rh-card-avatar-${rev.id}`} />
                      ) : (
                        <div className="rh-card-avatar-placeholder" id={`rh-card-avatar-placeholder-${rev.id}`}>
                          {userName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="rh-user-meta">
                        <span className="rh-card-username" id={`rh-card-username-${rev.id}`}>{userName}</span>
                        <span className="rh-card-date" id={`rh-card-date-${rev.id}`}>{fmtDate(rev.created_at)}</span>
                      </div>
                    </div>
                    {rev.cafes?.name && (
                      <div className="rh-card-cafe-tag" onClick={() => navigate(`/?cafeId=${rev.cafe_id}`)} id={`rh-card-cafe-${rev.id}`} title="カフェを見る">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span>{rev.cafes.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Star rating row */}
                  <StarRow rating={rev.rating} />

                  {/* Review text */}
                  <p className="rh-comment" id={`rh-comment-${rev.id}`}>{rev.comment}</p>

                  {/* Image gallery */}
                  {rev.review_images && rev.review_images.length > 0 && (
                    <div className="rh-gallery" id={`rh-gallery-${rev.id}`}>
                      {rev.review_images.map((img, imgIdx) => {
                        const allImages = rev.review_images!.map(i => i.image_url);
                        return (
                          <div
                            key={img.id}
                            className="rh-gallery-item"
                            onClick={() => openLightbox(allImages, imgIdx)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === "Enter" && openLightbox(allImages, imgIdx)}
                          >
                            <img src={img.image_url} alt="Review photo" className="rh-gallery-img" />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Footer: delete button */}
                  <div className="rh-card-footer">
                    <div style={{ flex: 1 }} />
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

      {/* Avatar zoom modal */}
      {isAvatarZoomed && currentAvatarUrl && (
        <AvatarZoomModal
          imageUrl={currentAvatarUrl}
          onClose={() => setIsAvatarZoomed(false)}
        />
      )}

      {/* Lightbox / Image Slider */}
      {lightbox && (
        <div className="lightbox-overlay" onClick={() => setLightbox(null)} id="review-history-lightbox">
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button className="lightbox-close" onClick={() => setLightbox(null)} id="lightbox-btn-close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Prev button */}
            {lightbox.images.length > 1 && (
              <button
                className="lightbox-nav lightbox-nav--prev"
                id="lightbox-btn-prev"
                onClick={() =>
                  setLightbox((prev) =>
                    prev
                      ? { ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length }
                      : null
                  )
                }
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="24" height="24">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}

            <img
              key={lightbox.index}
              src={lightbox.images[lightbox.index]}
              alt={`Image ${lightbox.index + 1}`}
              className="lightbox-img"
              id="lightbox-current-image"
            />

            {/* Next button */}
            {lightbox.images.length > 1 && (
              <button
                className="lightbox-nav lightbox-nav--next"
                id="lightbox-btn-next"
                onClick={() =>
                  setLightbox((prev) =>
                    prev
                      ? { ...prev, index: (prev.index + 1) % prev.images.length }
                      : null
                  )
                }
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="24" height="24">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}

            {/* Dots indicator */}
            {lightbox.images.length > 1 && (
              <div className="lightbox-dots">
                {lightbox.images.map((_, i) => (
                  <button
                    key={i}
                    className={`lightbox-dot${i === lightbox.index ? " lightbox-dot--active" : ""}`}
                    onClick={() => setLightbox((prev) => prev ? { ...prev, index: i } : null)}
                  />
                ))}
              </div>
            )}

            {/* Counter */}
            {lightbox.images.length > 1 && (
              <div className="lightbox-counter">
                {lightbox.index + 1} / {lightbox.images.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewHistoryPage;
