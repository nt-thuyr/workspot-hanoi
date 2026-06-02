import { useEffect, useState, type FC } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TopNavBar } from "../../components/TopNavBar";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./OwnerDashboardPage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface CafeImage {
  image_url: string;
  image_type: string;
}

interface CafeAmenity {
  amenity_id: number;
}

interface Review {
  rating: number;
}

interface Reservation {
  id: string;
}

interface OwnerCafe {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  open_time: string;
  close_time: string;
  cafe_images?: CafeImage[];
  cafe_amenities?: CafeAmenity[];
  reviews?: Review[];
  reservations?: Reservation[];
  custom_tags?: string[];
}

const tagMap: Record<number, string> = {
  1: "高速Wi-Fi",
  2: "コンセント",
  3: "静か",
  4: "禁煙",
  5: "エアコン",
  6: "ペット可",
  7: "駐車場",
  8: "テラス席",
  9: "飲食可",
  10: "プロジェクター",
  11: "会議室",
  12: "24時間営業",
};

// Fallback image for carousel when no photos uploaded
const DEFAULT_CAROUSEL_IMAGES = [
  "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800",
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800",
  "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800",
];

// Leaflet Cafe Pin Marker Icon (custom SVG — no dark ring)
const cafeMarkerIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:36px;height:36px;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    background:linear-gradient(135deg,#614734,#3d2210);
    border:2.5px solid #fff;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 3px 10px rgba(0,0,0,0.28);
  ">
    <svg style="transform:rotate(45deg)" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="15" height="15">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
      <line x1="6" y1="1" x2="6" y2="4"/>
      <line x1="10" y1="1" x2="10" y2="4"/>
      <line x1="14" y1="1" x2="14" y2="4"/>
    </svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -38],
});

const OwnerDashboardPage: FC = () => {
  const navigate = useNavigate();
  const ownerId = localStorage.getItem("user_id");
  const [cafes, setCafes] = useState<OwnerCafe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number>(0);

  useEffect(() => {
    const userRole = localStorage.getItem("user_role");
    if (!ownerId || userRole !== "cafe_owner") {
      navigate("/");
      return;
    }

    const fetchOwnerCafes = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(
          `${API_BASE_URL}/api/cafes/owner/${ownerId}?page=1&limit=0`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          },
        );
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          const rawCafes = result.data;

          const enrichedCafes = await Promise.all(
            rawCafes.map(async (cafe: OwnerCafe) => {
              try {
                const [resRes, revRes] = await Promise.all([
                  fetch(
                    `${API_BASE_URL}/api/reservations/cafe/${cafe.id}?owner_id=${ownerId}&page=1&limit=0`,
                    {
                      headers: token
                        ? { Authorization: `Bearer ${token}` }
                        : undefined,
                    },
                  ),
                  fetch(`${API_BASE_URL}/api/reviews/cafe/${cafe.id}`),
                ]);

                const resData = await resRes.json();
                const revData = await revRes.json();

                return {
                  ...cafe,
                  reservations:
                    resData.success && Array.isArray(resData.data)
                      ? resData.data
                      : [],
                  reviews:
                    revData.success && Array.isArray(revData.data)
                      ? revData.data
                      : [],
                };
              } catch (err) {
                console.error("Error enriching cafe details", err);
                return cafe;
              }
            }),
          );

          setCafes(enrichedCafes);

        }
      } catch (error) {
        console.error("Failed to load owner dashboard cafes", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOwnerCafes();
  }, [ownerId, navigate]);

  const checkIsOpen = (openTime?: string, closeTime?: string) => {
    if (!openTime || !closeTime) return false;
    const now = new Date();
    // Chuyển giờ sang múi giờ VN
    const vnTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const currentHours = vnTime.getHours();
    const currentMinutes = vnTime.getMinutes();
    const currentTimeInMinutes = currentHours * 60 + currentMinutes;

    const oParts = openTime.split(":").map(Number);
    const cParts = closeTime.split(":").map(Number);

    const oHours = oParts[0] || 0;
    const oMinutes = oParts[1] || 0;
    const cHours = cParts[0] || 0;
    const cMinutes = cParts[1] || 0;

    const openTimeInMinutes = oHours * 60 + oMinutes;
    const closeTimeInMinutes = cHours * 60 + cMinutes;

    if (openTimeInMinutes <= closeTimeInMinutes) {
      return currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes <= closeTimeInMinutes;
    } else {
      // Quán mở qua đêm
      return currentTimeInMinutes >= openTimeInMinutes || currentTimeInMinutes <= closeTimeInMinutes;
    }
  };

  return (
    <div className="owner-dashboard">
      <TopNavBar mode="owner" activeTab="dashboard" />

      <main className="dashboard-shell">
        <section className="dashboard-header-section">
          <h1 className="dashboard-title">ダッシュボード</h1>
          <p className="dashboard-subtitle">
            WorkSpot HaNoiパートナー向け管理ポータル — {cafes.length}件のカフェ
          </p>
        </section>

        {isLoading ? (
          <div className="dashboard-loading">
            <div className="spinner"></div>
            <p>読み込み中...</p>
          </div>
        ) : cafes.length === 0 ? (
          <div className="dashboard-empty-state">
            <div className="empty-icon">☕</div>
            <h3>登録されたカフェがありません</h3>
            <p>
              新しくカフェを登録して、ワークスペースの管理を開始しましょう。
            </p>
            <Link to="/cafes/register" className="register-first-btn">
              最初のカフェを登録する
            </Link>
          </div>
        ) : (
          <div className="dashboard-cards-container">
            {cafes.map((cafe) => {
              // Extract uploaded photos for main carousel (exclude menu images)
              const allUploadedPhotos = (cafe.cafe_images || [])
                .filter((img) => img.image_type !== "MENU")
                .map((img) => img.image_url);

              const mainImage = allUploadedPhotos[0] || DEFAULT_CAROUSEL_IMAGES[0] || "";

              // Extract menu photos for highlights
              const menuPhotos = (cafe.cafe_images || [])
                .filter((img) => img.image_type === "MENU")
                .map((img) => img.image_url);
              const menuHighlightImages = menuPhotos.slice(0, 3);

              // Map amenities tags
              const standardTags = (cafe.cafe_amenities || [])
                .map((amenity) => tagMap[amenity.amenity_id])
                .filter(Boolean);

              const allTags = [...standardTags, ...(cafe.custom_tags || [])];

              // Calculate average reviews & rating
              const ratings = (cafe.reviews || []).map((r) => r.rating);
              const avgRating =
                ratings.length > 0
                  ? (
                    ratings.reduce((a, b) => a + b, 0) / ratings.length
                  ).toFixed(1)
                  : "0.0";
              const reviewCount = ratings.length;

              // Calculate total reservations count
              const reservationCount = cafe.reservations?.length || 0;

              // Check if currently open
              const isOpen = checkIsOpen(cafe.open_time, cafe.close_time);

              return (
                <div
                  key={cafe.id}
                  className="cafe-dashboard-card"
                  onClick={() => navigate(`/cafes?cafeId=${cafe.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Card Header */}
                  <div className="card-header">
                    <div className="header-left">
                      <div className="name-row">
                        <h2 className="cafe-name">{cafe.name}</h2>
                        <span
                          className={`status-tag ${isOpen ? "status-tag--open" : "status-tag--closed"}`}
                        >
                          {isOpen ? "営業中" : "閉店中"}
                        </span>
                      </div>
                      <div
                        className="meta-row address-row"
                        title={cafe.address}
                      >
                        <svg
                          className="meta-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span>{cafe.address}</span>
                      </div>
                      <div className="meta-row hours-row">
                        <svg
                          className="meta-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>
                          営業時間 {cafe.open_time.slice(0, 5)} -{" "}
                          {cafe.close_time.slice(0, 5)}
                        </span>
                      </div>
                      <div className="features-tags">
                        {allTags.map((tag, idx) => (
                          <span key={idx} className="feature-pill">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="header-right">
                      <Link
                        to={`/cafes/edit/${cafe.id}`}
                        className="edit-info-btn"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                        カフェ情報の編集
                      </Link>
                    </div>
                  </div>

                  {/* Card Content Grid */}
                  <div className="card-grid">
                    {/* Media Block (Main Image + Stacked Thumbnails) */}
                    <div className="media-block">
                      <div className="carousel-container">
                        <div className="carousel-wrapper">
                          <img
                            src={mainImage}
                            alt={`${cafe.name} view`}
                            className="carousel-image"
                            onClick={() => {
                              setPreviewImages([mainImage!]);
                              setPreviewIndex(0);
                            }}
                            style={{ cursor: "pointer" }}
                          />
                        </div>
                      </div>

                      {menuPhotos.length > 0 && (
                        <div className="thumbnails-container">
                          {menuHighlightImages.map((thumbUrl: string, tIdx: number) => (
                            <div
                              key={tIdx}
                              className="thumbnail-wrapper"
                              style={{
                                position: "relative",
                                cursor: "pointer",
                              }}
                              onClick={() => {
                                setPreviewImages(menuPhotos);
                                const idx = menuPhotos.indexOf(thumbUrl);
                                setPreviewIndex(idx >= 0 ? idx : 0);
                              }}
                            >
                              <img
                                src={thumbUrl}
                                alt="Menu highlight"
                                className="thumbnail-img"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Stats & Map Block */}
                    <div className="stats-map-block">
                      {/* Stats Row */}
                      <div className="stats-row">
                        <div className="stat-card">
                          <div className="stat-icon-box res-icon">
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            </svg>
                          </div>
                          <div className="stat-details">
                            <span className="stat-label">総予約数</span>
                            <span className="stat-value">
                              {reservationCount}
                            </span>
                          </div>
                        </div>

                        <div className="stat-card">
                          <div className="stat-icon-box rate-icon">
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="star-svg"
                            >
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                          </div>
                          <div className="stat-details">
                            <span className="stat-label">総合評価</span>
                            <div className="rating-row">
                              <span className="stat-value">{avgRating}</span>
                              <span className="rating-max">/ 5.0</span>
                            </div>
                            <span className="review-link">
                              {reviewCount} Reviews
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Map Container */}
                      <div className="map-widget-container">
                        <MapContainer
                          center={[cafe.lat, cafe.lng]}
                          zoom={15}
                          scrollWheelZoom={false}
                          zoomControl={false}
                          style={{ height: "100%", width: "100%" }}
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <Marker
                            position={[cafe.lat, cafe.lng]}
                            icon={cafeMarkerIcon}
                          >
                            <Popup autoPan={false} keepInView={true}>
                              <div className="map-popup-text">
                                {cafe.address}
                              </div>
                            </Popup>
                          </Marker>
                        </MapContainer>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {previewImages.length > 0 && (
        <div
          className="image-modal-overlay"
          onClick={() => setPreviewImages([])}
        >
          <div
            className="image-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="image-modal-close"
              onClick={() => setPreviewImages([])}
            >
              ✕
            </button>

            <div className="image-modal-body">
              <img
                src={previewImages[previewIndex]}
                alt="Preview zoom"
                className="image-modal-img"
              />

              {previewImages.length > 1 && (
                <>
                  <button
                    className="modal-arrow modal-arrow--prev"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewIndex(
                        (prev) =>
                          (prev - 1 + previewImages.length) %
                          previewImages.length,
                      );
                    }}
                  >
                    ‹
                  </button>
                  <button
                    className="modal-arrow modal-arrow--next"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewIndex(
                        (prev) => (prev + 1) % previewImages.length,
                      );
                    }}
                  >
                    ›
                  </button>

                  <div className="modal-counter">
                    {previewIndex + 1} / {previewImages.length}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboardPage;
