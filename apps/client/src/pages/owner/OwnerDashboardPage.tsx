import { useEffect, useState, type FC } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TopNavBar } from "../../components/TopNavBar";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./OwnerDashboardPage.css";

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

// Fallback images for carousel & menu highlights
const DEFAULT_CAROUSEL_IMAGES = [
  "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800",
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800",
  "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800",
];

const DEFAULT_MENU_IMAGES = [
  "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500", // Coffee cup
  "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500", // Croissant
  "https://images.unsplash.com/photo-1534778101976-62847782c213?w=500", // Matcha green tea cake
];

// Leaflet Cafe Pin Marker Icon
const cafeMarkerIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2776/2776067.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const OwnerDashboardPage: FC = () => {
  const navigate = useNavigate();
  const ownerId = localStorage.getItem("user_id");
  const [cafes, setCafes] = useState<OwnerCafe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [carouselIndices, setCarouselIndices] = useState<Record<string, number>>({});

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
          `http://localhost:3000/api/cafes/owner/${ownerId}?page=1&limit=0`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }
        );
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          const rawCafes = result.data;
          
          const enrichedCafes = await Promise.all(rawCafes.map(async (cafe: OwnerCafe) => {
            try {
              const [detailRes, resRes, revRes] = await Promise.all([
                fetch(`http://localhost:3000/api/cafes/${cafe.id}`),
                fetch(`http://localhost:3000/api/reservations/cafe/${cafe.id}?owner_id=${ownerId}&page=1&limit=0`, {
                  headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                }),
                fetch(`http://localhost:3000/api/reviews/cafe/${cafe.id}`)
              ]);
              
              const detailData = await detailRes.json();
              const resData = await resRes.json();
              const revData = await revRes.json();
              
              const fullCafe = detailData.success ? detailData.data : cafe;
              
              return {
                ...cafe,
                ...fullCafe,
                reservations: resData.success && Array.isArray(resData.data) ? resData.data : [],
                reviews: revData.success && Array.isArray(revData.data) ? revData.data : []
              };
            } catch (err) {
              console.error("Error enriching cafe details", err);
              return cafe;
            }
          }));

          setCafes(enrichedCafes);
          
          // Initialize active index for each cafe's carousel to 0
          const indices: Record<string, number> = {};
          enrichedCafes.forEach((cafe: OwnerCafe) => {
            indices[cafe.id] = 0;
          });
          setCarouselIndices(indices);
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
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeInMinutes = currentHours * 60 + currentMinutes;

    const oParts = openTime.split(":").map(Number);
    const cParts = closeTime.split(":").map(Number);
    if (oParts.length < 2 || cParts.length < 2) return false;

    const oHours = oParts[0] ?? 0;
    const oMinutes = oParts[1] ?? 0;
    const cHours = cParts[0] ?? 0;
    const cMinutes = cParts[1] ?? 0;

    const openTimeInMinutes = oHours * 60 + oMinutes;
    const closeTimeInMinutes = cHours * 60 + cMinutes;

    return currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes <= closeTimeInMinutes;
  };

  const handlePrevSlide = (cafeId: string, totalSlides: number) => {
    setCarouselIndices((prev) => {
      const current = prev[cafeId] ?? 0;
      return {
        ...prev,
        [cafeId]: (current - 1 + totalSlides) % totalSlides,
      };
    });
  };

  const handleNextSlide = (cafeId: string, totalSlides: number) => {
    setCarouselIndices((prev) => {
      const current = prev[cafeId] ?? 0;
      return {
        ...prev,
        [cafeId]: (current + 1) % totalSlides,
      };
    });
  };

  const handleSelectDot = (cafeId: string, index: number) => {
    setCarouselIndices((prev) => ({
      ...prev,
      [cafeId]: index,
    }));
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
            <p>新しくカフェを登録して、ワークスペースの管理を開始しましょう。</p>
            <Link to="/cafes/register" className="register-first-btn">
              最初のカフェを登録する
            </Link>
          </div>
        ) : (
          <div className="dashboard-cards-container">
            {cafes.map((cafe) => {
              // Extract interior photos for main carousel
              const interiorPhotos = (cafe.cafe_images || [])
                .filter((img) => img.image_type !== "MENU")
                .map((img) => img.image_url);
              
              const carouselImages = interiorPhotos.length > 0 ? interiorPhotos : DEFAULT_CAROUSEL_IMAGES;
              const activeSlide = carouselIndices[cafe.id] || 0;

              // Extract menu photos for thumbnails
              const menuPhotos = (cafe.cafe_images || [])
                .filter((img) => img.image_type === "MENU")
                .map((img) => img.image_url);

              // Map amenities tags
              const standardTags = (cafe.cafe_amenities || [])
                .map((amenity) => tagMap[amenity.amenity_id])
                .filter(Boolean);
              
              const allTags = [...standardTags, ...(cafe.custom_tags || [])];

              // Calculate average reviews & rating
              const ratings = (cafe.reviews || []).map((r) => r.rating);
              const avgRating = ratings.length > 0 
                ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) 
                : "0.0";
              const reviewCount = ratings.length;

              // Calculate total reservations count
              const reservationCount = cafe.reservations?.length || 0;

              // Check if currently open
              const isOpen = checkIsOpen(cafe.open_time, cafe.close_time);

              return (
                <div key={cafe.id} className="cafe-dashboard-card">
                  {/* Card Header */}
                  <div className="card-header">
                    <div className="header-left">
                      <div className="name-row">
                        <h2 className="cafe-name">{cafe.name}</h2>
                        <span className={`status-tag ${isOpen ? "status-tag--open" : "status-tag--closed"}`}>
                          {isOpen ? "営業中" : "閉店中"}
                        </span>
                      </div>
                      <div className="meta-row address-row" title={cafe.address}>
                        <svg className="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span>{cafe.address}</span>
                      </div>
                      <div className="meta-row hours-row">
                        <svg className="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>営業時間 {cafe.open_time.slice(0, 5)} - {cafe.close_time.slice(0, 5)}</span>
                      </div>
                      <div className="features-tags">
                        {allTags.map((tag, idx) => (
                          <span key={idx} className="feature-pill">{tag}</span>
                        ))}
                      </div>
                    </div>

                    <div className="header-right">
                      <Link to={`/cafes/edit/${cafe.id}`} className="edit-info-btn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                        カフェ情報の編集
                      </Link>
                    </div>
                  </div>

                  {/* Card Content Grid */}
                  <div className="card-grid">
                    {/* Media Block (Carousel + Stacked Thumbnails) */}
                    <div className="media-block">
                      <div className="carousel-container">
                        <div className="carousel-wrapper">
                          <img 
                            src={carouselImages[activeSlide]} 
                            alt={`${cafe.name} view`} 
                            className="carousel-image"
                          />
                          <div className="carousel-counter">
                            {activeSlide + 1} / {carouselImages.length}
                          </div>
                          {carouselImages.length > 1 && (
                            <>
                              <button 
                                className="carousel-arrow carousel-arrow--prev"
                                onClick={() => handlePrevSlide(cafe.id, carouselImages.length)}
                              >
                                ‹
                              </button>
                              <button 
                                className="carousel-arrow carousel-arrow--next"
                                onClick={() => handleNextSlide(cafe.id, carouselImages.length)}
                              >
                                ›
                              </button>
                              <div className="carousel-dots">
                                {carouselImages.map((_, dotIdx) => (
                                  <button
                                    key={dotIdx}
                                    className={`carousel-dot ${dotIdx === activeSlide ? "carousel-dot--active" : ""}`}
                                    onClick={() => handleSelectDot(cafe.id, dotIdx)}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {menuPhotos.length > 0 && (
                        <div className="thumbnails-container">
                          {menuPhotos.slice(0, 3).map((thumbUrl, tIdx) => {
                            const isLast = tIdx === 2;
                            const hasMore = menuPhotos.length > 3;
                            return (
                              <div key={tIdx} className="thumbnail-wrapper" style={{ position: "relative" }}>
                                <img src={thumbUrl} alt="Menu highlight" className="thumbnail-img" />
                                {isLast && hasMore && (
                                  <div style={{
                                    position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", fontWeight: "bold"
                                  }}>
                                    +{menuPhotos.length - 3}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Stats & Map Block */}
                    <div className="stats-map-block">
                      {/* Stats Row */}
                      <div className="stats-row">
                        <div className="stat-card">
                          <div className="stat-icon-box res-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            </svg>
                          </div>
                          <div className="stat-details">
                            <span className="stat-label">総予約数</span>
                            <span className="stat-value">{reservationCount}</span>
                          </div>
                        </div>

                        <div className="stat-card">
                          <div className="stat-icon-box rate-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="star-svg">
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                          </div>
                          <div className="stat-details">
                            <span className="stat-label">総合評価</span>
                            <div className="rating-row">
                              <span className="stat-value">{avgRating}</span>
                              <span className="rating-max">/ 5.0</span>
                            </div>
                            <span className="review-link">{reviewCount} Reviews</span>
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
                          <Marker position={[cafe.lat, cafe.lng]} icon={cafeMarkerIcon}>
                            <Popup autoPan={false} keepInView={true}>
                              <div className="map-popup-text">{cafe.address}</div>
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
    </div>
  );
};

export default OwnerDashboardPage;
