import { FC, useState, useEffect, useRef } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
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

const ReviewPage: FC = () => {
  const [searchParams] = useSearchParams();
  const cafeId = searchParams.get("cafeId");
  const navigate = useNavigate();

  const [cafeName, setCafeName] = useState("WorkSpot HaNoi");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("highest"); // highest, newest, lowest

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

    // Fetch cafe name and reviews
    const fetchCafeData = async () => {
      try {
        setIsLoading(true);
        // Fetch cafe name
        const cafeRes = await fetch(`http://localhost:3000/api/cafes/${cafeId}`);
        const cafeData = await cafeRes.json();
        if (cafeData.success && cafeData.data) {
          setCafeName(cafeData.data.name);
        }

        // Fetch reviews
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

  // Handle file select (max 3 images)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const totalAfterAdd = selectedFiles.length + filesArray.length;

      if (totalAfterAdd > 3) {
        toast.error("画像は最大3枚までアップロードできます。");
        // Only add as many as allowed
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
    // Reset file input value so same file can be re-selected
    e.target.value = "";
  };

  // Remove a selected file
  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => {
      const preview = prev[index];
      if (preview) {
        URL.revokeObjectURL(preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Submit review form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("評価（星の数）を選択してください。");
      return;
    }

    if (!comment.trim()) {
      toast.error("レビュー内容を入力してください。");
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Create the review (user_id derived from Bearer token on backend)
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

      // 2. Upload images if selected
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

      toast.success("レビューを投稿しました！");

      // Reset form states
      setRating(0);
      setComment("");
      setSelectedFiles([]);
      setFilePreviews([]);

      // Re-fetch reviews to show the new one
      const reviewsRes = await fetch(`http://localhost:3000/api/reviews/cafe/${cafeId}`);
      const reviewsData = await reviewsRes.json();
      if (reviewsData.success) {
        setReviews(reviewsData.data || []);
      }
    } catch (err: any) {
      console.error("Error submitting review:", err);
      toast.error(err.message || "レビューの投稿中にエラーが発生しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to format date in Japanese locale matching mockup
  const formatJapaneseDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    } catch {
      return dateString;
    }
  };

  // Get sorted reviews
  const getSortedReviews = () => {
    const sorted = [...reviews];
    if (sortBy === "highest") {
      return sorted.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "lowest") {
      return sorted.sort((a, b) => a.rating - b.rating);
    } else if (sortBy === "newest") {
      return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return sorted;
  };

  const sortedReviews = getSortedReviews();

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
              <Link to="/" className="back-btn" title="ホームに戻る">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </Link>
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
                <div className="star-rating-selector">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = hoverRating >= star || (!hoverRating && rating >= star);
                    return (
                      <button
                        type="button"
                        key={star}
                        className="star-selector-btn"
                        onClick={() => setRating(star)}
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
              </div>

              {/* Review Text content */}
              <div className="form-group">
                <label className="input-label">レビュー内容</label>
                <textarea
                  className="review-textarea"
                  placeholder="コーヒーはいかがでしたか？作業しやすい場所でしたか？"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={6}
                />
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
                  
                  {/* Photo add button — hide when 3 images already selected */}
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

                  {/* Previews */}
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
                className="submit-review-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? "投稿しています..." : "レビューを投稿する"}
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
                sortedReviews.map((rev) => (
                  <div key={rev.id} className="review-card">
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

                    {/* Images gallery */}
                    {rev.review_images && rev.review_images.length > 0 && (
                      <div className="card-images-gallery">
                        {rev.review_images.map((img) => (
                          <div key={img.id} className="gallery-img-wrapper">
                            <img
                              src={img.image_url}
                              alt="Review attachment"
                              className="gallery-img"
                              onClick={() => {
                                // Simple lightbox overlay trigger
                                window.open(img.image_url, "_blank");
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewPage;
