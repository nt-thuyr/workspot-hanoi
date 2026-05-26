import { FC, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { TopNavBar } from "../../components/TopNavBar";
import "./ReviewPage.css";

interface ReviewImage {
  id: number;
  image_url: string;
}

interface ReviewProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface Review {
  id: number;
  user_id: string;
  cafe_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles?: ReviewProfile;
  review_images?: ReviewImage[];
}

// Lightbox state
interface LightboxState {
  images: string[];
  index: number;
}

const ReviewPage: FC = () => {
  const [searchParams] = useSearchParams();
  const cafeId = searchParams.get("cafeId");
  const navigate = useNavigate();

  const [cafeName, setCafeName] = useState("WorkSpot HaNoi");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // "idle" | "success" | "error"
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  // Form states
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("highest"); // highest, newest, lowest

  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState<{ rating?: string; comment?: string }>({});

  // Lightbox
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth info
  const accessToken = localStorage.getItem("access_token");
  const userName = localStorage.getItem("user_name") || "ゲスト";
  const userAvatarUrl = localStorage.getItem("user_avatar_url");
  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    if (!accessToken) {
      toast.error("レビューを書くにはログインが必要です。");
      navigate("/login");
      return;
    }

    if (!cafeId) {
      toast.error("カフェが選択されていません。");
      navigate("/");
      return;
    }

    const fetchCafeData = async () => {
      try {
        setIsLoading(true);
        const cafeRes = await fetch(`http://localhost:3000/api/cafes/${cafeId}`);
        const cafeData = await cafeRes.json();
        if (cafeData.success && cafeData.data) {
          setCafeName(cafeData.data.name);
        }

        const reviewsRes = await fetch(`http://localhost:3000/api/reviews/cafe/${cafeId}`);
        const reviewsData = await reviewsRes.json();
        if (reviewsData.success) {
          setReviews(reviewsData.data || []);
        }
      } catch (err) {
        console.error("Error fetching review page data:", err);
        toast.error("データの読み込みに失敗しました。");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCafeData();
  }, [cafeId, accessToken]);

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      filePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [filePreviews]);

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

  const openLightbox = (images: string[], startIndex: number) => {
    setLightbox({ images, index: startIndex });
  };

  // Handle file select (max 3 images)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const totalAfterAdd = selectedFiles.length + filesArray.length;

      if (totalAfterAdd > 3) {
        toast.error("画像は最大3枚までアップロードできます。");
        const allowed = filesArray.slice(0, 3 - selectedFiles.length);
        if (allowed.length === 0) return;
        setSelectedFiles((prev) => [...prev, ...allowed]);
        const newPreviews = allowed.map((file) => URL.createObjectURL(file));
        setFilePreviews((prev) => [...prev, ...newPreviews]);
        return;
      }

      setSelectedFiles((prev) => [...prev, ...filesArray]);
      const newPreviews = filesArray.map((file) => URL.createObjectURL(file));
      setFilePreviews((prev) => [...prev, ...newPreviews]);
    }
    e.target.value = "";
  };

  // Remove a selected file
  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => {
      const preview = prev[index];
      if (preview) URL.revokeObjectURL(preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Submit review form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields at once, show inline errors
    const errors: { rating?: string; comment?: string } = {};
    if (rating === 0) errors.rating = "★ 評価を選択してください";
    if (!comment.trim()) errors.comment = "レビュー内容を入力してください";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitStatus("error");
      setTimeout(() => setSubmitStatus("idle"), 3000);
      return;
    }

    setFieldErrors({});

    try {
      setIsSubmitting(true);
      setSubmitStatus("idle");

      const reviewResponse = await fetch("http://localhost:3000/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          cafe_id: cafeId,
          rating,
          comment: comment.trim(),
        }),
      });

      const reviewResult = await reviewResponse.json();

      if (!reviewResponse.ok || !reviewResult.success) {
        throw new Error(reviewResult.message || "レビューの投稿に失敗しました。");
      }

      const reviewId = reviewResult.data.id;

      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach((file) => {
          formData.append("images", file);
        });

        const uploadResponse = await fetch(`http://localhost:3000/api/reviews/${reviewId}/images`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        });

        const uploadResult = await uploadResponse.json();
        console.log("[Review Upload] Status:", uploadResponse.status, "Result:", uploadResult);
        if (!uploadResponse.ok || !uploadResult.success) {
          const errorMsg = uploadResult.message || uploadResult.error || "サーバーエラー";
          toast(`レビューは投稿されましたが、画像のアップロードに失敗しました: ${errorMsg}`, { icon: "⚠️" });
        }
      }

      // Success state
      setSubmitStatus("success");
      toast.success("レビューを投稿しました！");


      // Reset form
      setRating(0);
      setComment("");
      setSelectedFiles([]);
      setFilePreviews([]);

      // Re-fetch reviews
      const reviewsRes = await fetch(`http://localhost:3000/api/reviews/cafe/${cafeId}`);
      const reviewsData = await reviewsRes.json();
      if (reviewsData.success) {
        setReviews(reviewsData.data || []);
      }

      // Reset button state after 3s
      setTimeout(() => setSubmitStatus("idle"), 3000);
    } catch (err: any) {
      console.error("Error submitting review:", err);
      setSubmitStatus("error");
      toast.error(err.message || "レビューの投稿中にエラーが発生しました。");

      // Reset button state after 3s
      setTimeout(() => setSubmitStatus("idle"), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatJapaneseDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    } catch {
      return dateString;
    }
  };

  // Get sorted reviews, always putting current user's review first
  const getSortedReviews = () => {
    const userReviews = reviews.filter((r) => r.user_id === userId);
    const otherReviews = reviews.filter((r) => r.user_id !== userId);

    const sortFn = (a: Review, b: Review) => {
      if (sortBy === "highest") return b.rating - a.rating;
      if (sortBy === "lowest") return a.rating - b.rating;
      if (sortBy === "newest")
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return 0;
    };

    return [...userReviews.sort(sortFn), ...otherReviews.sort(sortFn)];
  };

  const sortedReviews = getSortedReviews();

  // Submit button appearance
  const getSubmitBtnClass = () => {
    if (submitStatus === "success") return "submit-review-btn submit-review-btn--success";
    if (submitStatus === "error") return "submit-review-btn submit-review-btn--error";
    return "submit-review-btn";
  };

  const getSubmitBtnLabel = () => {
    if (isSubmitting) return "投稿中...";
    if (submitStatus === "success") return "レビューを投稿済み ✓";
    if (submitStatus === "error") return "投稿失敗 ✕";
    return "レビューを投稿する";
  };

  return (
    <div className="review-page-root">
      <TopNavBar mode="guest" activeTab="home" />

      {isLoading ? (
        <div className="review-loading">
          <div className="spinner"></div>
          <p>データを読み込んでいます...</p>
        </div>
      ) : (
        <div className="review-container">
          {/* LEFT PANEL: Write Review Form */}
          <div className="review-form-panel">
            <div className="form-header">
              {/* Back button → cafe detail on HomePage */}
              <button
                className="back-btn"
                title="カフェ詳細に戻る"
                onClick={() => navigate(`/?cafeId=${cafeId}`)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
              <div>
                <h1 className="form-title">レビューを書く</h1>
                <p className="form-subtitle">{cafeName} での体験をシェアしましょう</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="review-form">
              {/* Profile Card */}
              <div className="user-profile-row">
                <div className="user-avatar-circle">
                  {userAvatarUrl ? (
                    <img src={userAvatarUrl} alt={userName} className="user-avatar-img" />
                  ) : (
                    userName.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="user-name-text">{userName}</span>
              </div>

              {/* Star Rating Select */}
              <div className="form-group">
                <label className="input-label">評価 *</label>
                <div className={`star-rating-selector${fieldErrors.rating ? " star-rating-selector--error" : ""}`}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = hoverRating >= star || (!hoverRating && rating >= star);
                    return (
                      <button
                        type="button"
                        key={star}
                        className="star-selector-btn"
                        onClick={() => {
                          setRating(star);
                          if (fieldErrors.rating) setFieldErrors((prev) => ({ ...prev, rating: undefined }));
                        }}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill={isFilled ? "#eab308" : "none"}
                          stroke={isFilled ? "#eab308" : "#cbd5e1"}
                          strokeWidth="2"
                          width="32"
                          height="32"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
                {fieldErrors.rating && (
                  <span className="field-error-msg">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {fieldErrors.rating}
                  </span>
                )}
              </div>

              {/* Review Text content */}
              <div className="form-group">
                <label className="input-label">レビュー内容 *</label>
                <textarea
                  className={`review-textarea${fieldErrors.comment ? " review-textarea--error" : ""}`}
                  placeholder="コーヒーはいかがでしたか？作業しやすい場所でしたか？"
                  value={comment}
                  onChange={(e) => {
                    setComment(e.target.value);
                    if (fieldErrors.comment && e.target.value.trim())
                      setFieldErrors((prev) => ({ ...prev, comment: undefined }));
                  }}
                  rows={6}
                />
                {fieldErrors.comment && (
                  <span className="field-error-msg">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {fieldErrors.comment}
                  </span>
                )}
              </div>

              {/* Photos attachment */}
              <div className="form-group">
                <label className="input-label">写真</label>
                <div className="photo-upload-container">
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden-file-input"
                    onChange={handleFileChange}
                  />

                  {selectedFiles.length < 3 && (
                    <button
                      type="button"
                      className="add-photo-box"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                      <span>写真を追加</span>
                    </button>
                  )}

                  {filePreviews.map((url, index) => (
                    <div key={index} className="photo-preview-wrapper">
                      <img src={url} alt="selected preview" className="photo-preview-img" />
                      <button
                        type="button"
                        className="remove-preview-btn"
                        onClick={() => handleRemoveFile(index)}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className={getSubmitBtnClass()}
                disabled={isSubmitting}
              >
                {getSubmitBtnLabel()}
              </button>
            </form>
          </div>

          {/* RIGHT PANEL: Cafe Reviews List */}
          <div className="review-list-panel">
            <div className="list-header">
              <h2 className="list-title">レビュー一覧</h2>
              <div className="sort-selector-wrapper">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-dropdown"
                >
                  <option value="highest">評価の高い順</option>
                  <option value="newest">新着順</option>
                  <option value="lowest">評価の低い順</option>
                </select>
              </div>
            </div>

            <div className="reviews-list-container">
              {sortedReviews.length === 0 ? (
                <div className="empty-reviews">
                  <p>このカフェにはまだレビューがありません。最初のレビューを投稿してみましょう！</p>
                </div>
              ) : (
                sortedReviews.map((rev, idx) => {
                  const isCurrentUser = rev.user_id === userId;
                  const allImages = (rev.review_images || []).map((img) => img.image_url);

                  return (
                    <div
                      key={rev.id}
                      className={`review-card${isCurrentUser ? " review-card--mine" : ""}`}
                    >
                      {/* "Your review" badge */}
                      {isCurrentUser && (
                        <div className="my-review-badge">
                          <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
                            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-1 14.414-3.707-3.707 1.414-1.414L11 13.586l5.293-5.293 1.414 1.414z" />
                          </svg>
                          あなたのレビュー
                        </div>
                      )}

                      {/* Card Header Profile info */}
                      <div className="card-profile-row">
                        <div className="card-avatar">
                          {rev.profiles?.avatar_url ? (
                            <img
                              src={rev.profiles.avatar_url}
                              alt={rev.profiles.full_name || "User"}
                              className="avatar-img"
                            />
                          ) : (
                            <div className="avatar-placeholder">
                              {(rev.profiles?.full_name || "G").charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="profile-text-details">
                          <span className="profile-name">{rev.profiles?.full_name || "ユーザー"}</span>
                          <span className="review-date">{formatJapaneseDate(rev.created_at)}</span>
                        </div>
                      </div>

                      {/* Stars Rating row */}
                      <div className="card-stars-row">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`card-star ${star <= rev.rating ? "card-star--filled" : "card-star--empty"}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>

                      {/* Review text content */}
                      <p className="card-comment-text">{rev.comment}</p>

                      {/* Images gallery with lightbox */}
                      {allImages.length > 0 && (
                        <div className="card-images-gallery">
                          {allImages.map((imgUrl, imgIdx) => (
                            <div
                              key={imgIdx}
                              className="gallery-img-wrapper"
                              onClick={() => openLightbox(allImages, imgIdx)}
                            >
                              <img
                                src={imgUrl}
                                alt={`Review image ${imgIdx + 1}`}
                                className="gallery-img"
                              />
                              {/* Zoom icon overlay */}
                              <div className="gallery-img-overlay">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                  <circle cx="11" cy="11" r="8" />
                                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                  <line x1="11" y1="8" x2="11" y2="14" />
                                  <line x1="8" y1="11" x2="14" y2="11" />
                                </svg>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Image Slider */}
      {lightbox && (
        <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button className="lightbox-close" onClick={() => setLightbox(null)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Prev button */}
            {lightbox.images.length > 1 && (
              <button
                className="lightbox-nav lightbox-nav--prev"
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
            />

            {/* Next button */}
            {lightbox.images.length > 1 && (
              <button
                className="lightbox-nav lightbox-nav--next"
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

export default ReviewPage;
