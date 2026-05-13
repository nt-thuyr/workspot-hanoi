import { useState, useEffect, type FC, useCallback } from "react";
import { Link } from "react-router-dom";
import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api";
import { TopNavBar } from "../../components/TopNavBar";
import "./HomePage.css";

// Khớp với cấu trúc dữ liệu Backend trả về
interface CafeInfo {
  id: number;
  name: string;
  location: { lat: number; lng: number };
  rating: number;
  reviewCount: number;
  isOpenNow: boolean;
  tags: string[];
  distance: number | null;
  imageUrl?: string;
}

const FILTER_CHIPS = ["近くの店", "営業中", "高評価"];
const POPULAR_TAGS = ["Fast Wi-Fi", "Quiet", "コンセント", "エアコン", "テラス席"];

// Cấu hình kích thước và trung tâm mặc định của Bản đồ (Hà Nội)
const mapContainerStyle = { width: "100%", height: "100%" };
const centerHanoi = { lat: 21.028511, lng: 105.804817 };
const mapOptions = {
  disableDefaultUI: true, // Ẩn các nút rườm rà mặc định của Google Maps
  zoomControl: false,
};

function StarRating({ value }: { value: number }) {
  return (
    <span className="star-rating">
      {"★".repeat(Math.floor(value))}
      {"☆".repeat(5 - Math.floor(value))}
      <span className="star-value">{value.toFixed(1)}</span>
    </span>
  );
}

const HomePage: FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [activeTags, setActiveTags] = useState<string[]>([]);

  // State lưu dữ liệu từ API
  const [cafes, setCafes] = useState<CafeInfo[]>([]);
  const [selectedCafe, setSelectedCafe] = useState<CafeInfo | null>(null);

  // Load Google Maps API
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map: google.maps.Map) {
    setMap(null);
  }, []);

  // 1. Hàm gọi API Backend lấy danh sách quán Cafe
  const fetchCafes = async () => {
    try {
      // Xây dựng Query Params dựa trên bộ lọc
      const params = new URLSearchParams();
      if (activeFilters.includes("営業中")) params.append("isOpen", "true");
      if (activeTags.includes("Fast Wi-Fi")) params.append("hasWifi", "true");
      if (activeTags.includes("Quiet")) params.append("isQuiet", "true");

      // Mặc định lấy vị trí Hà Nội làm gốc nếu chưa có GPS thật
      params.append("lat", centerHanoi.lat.toString());
      params.append("lng", centerHanoi.lng.toString());

      // Gọi API Backend mà bạn đã tạo ở bước trước
      const response = await fetch(`http://localhost:3000/api/cafes/map?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setCafes(result.data);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách Cafe:", error);
    }
  };

  // 2. Tự động gọi API mỗi khi bộ lọc (Filter/Tags) thay đổi
  useEffect(() => {
    fetchCafes();
  }, [activeFilters, activeTags]);

  const toggleFilter = (f: string) =>
    setActiveFilters((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);

  const toggleTag = (t: string) =>
    setActiveTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  // Nút di chuyển bản đồ về vị trí hiện tại
  const handlePanToCurrent = () => {
    if (map) {
      map.panTo(centerHanoi);
      map.setZoom(14);
    }
  };

  return (
    <div className="home-root">
      {/* ── NAVBAR ── */}
      <TopNavBar mode="guest" activeTab="home" />

      {/* ── MAIN CONTENT ── */}
      <div className="home-main">
        {/* ── SIDEBAR ── */}
        <aside className="home-sidebar">
          <div className="sidebar-hero">
            <h1 className="sidebar-hero__title">理想のワークスペース</h1>
            <p className="sidebar-hero__sub">厳選されたカフェスペース</p>
          </div>

          <div className="sidebar-search">
            {/* ... (Giữ nguyên Search Bar của bạn) ... */}
            <input
              id="search-bar"
              className="search-input"
              type="text"
              placeholder="キーワードやタグで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-chips">
            {FILTER_CHIPS.map((f) => (
              <button
                key={f}
                className={`filter-chip${activeFilters.includes(f) ? " filter-chip--active" : ""}`}
                onClick={() => toggleFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="sidebar-tags">
            <p className="sidebar-tags__title">人気のあるタグ</p>
            <div className="tag-list">
              {POPULAR_TAGS.map((tag) => (
                <button
                  key={tag}
                  className={`search-tag${activeTags.includes(tag) ? " search-tag--active" : ""}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── MAP AREA ── */}
        <div className="map-area" id="main-map">
          <div className="map-inner">

            {/* Tích hợp Google Maps */}
            {isLoaded ? (
              // @ts-ignore: Bỏ qua lỗi type mismatch của thư viện Google Maps với React 18
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={centerHanoi}
                zoom={14}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={mapOptions}
              >
                {/* Render Ghim (Markers) từ API trả về */}
                {cafes.map((cafe) => {
                  // Fallback if location is undefined
                  if (!cafe.location || !cafe.location.lat || !cafe.location.lng) {
                    return null;
                  }
                  return (
                    <MarkerF
                      key={cafe.id}
                      position={{ lat: cafe.location.lat, lng: cafe.location.lng }}
                      onClick={() => setSelectedCafe(cafe)}
                      icon={{
                        url: cafe.imageUrl || "https://cdn-icons-png.flaticon.com/512/2776/2776067.png",

                        // Thu nhỏ ảnh lại thành kích thước 40x40 pixel cho vừa vặn với bản đồ
                        scaledSize: new window.google.maps.Size(40, 40),
                      }}
                    />
                  );
                })}
              </GoogleMap>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <p>Bản đồ đang tải...</p>
              </div>
            )}

            {/* Lớp phủ Info Card cho Cafe được chọn */}
            <div className="map-overlay">
              {selectedCafe && (
                <div
                  className="info-card"
                  style={{
                    position: "absolute",
                    bottom: "24px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 10,
                  }}
                >
                  <div className="info-card__header">
                    <span className={`info-card__status ${selectedCafe.isOpenNow ? 'info-card__status--open' : 'info-card__status--closed'}`}>
                      {selectedCafe.isOpenNow ? "営業中" : "閉店中"}
                    </span>
                    <button className="info-card__close" onClick={() => setSelectedCafe(null)}>✕</button>
                  </div>
                  <p className="info-card__name">{selectedCafe.name}</p>
                  <div className="info-card__meta">
                    <StarRating value={selectedCafe.rating} />
                    <span className="info-card__dist">{selectedCafe.distance ? `${selectedCafe.distance} km` : ""}</span>
                  </div>
                  <div className="info-card__tags">
                    {selectedCafe.tags.slice(0, 3).map((t) => (
                      <span key={t} className="info-card__tag">{t}</span>
                    ))}
                  </div>
                  <button className="info-card__btn">詳細を見る →</button>
                </div>
              )}
            </div>
          </div>

          {/* Map controls */}
          <div className="map-controls">
            <button className="map-ctrl-btn" title="ズームイン" onClick={() => map?.setZoom((map.getZoom() || 14) + 1)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <button className="map-ctrl-btn" title="ズームアウト" onClick={() => map?.setZoom((map.getZoom() || 14) - 1)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <button className="map-ctrl-btn map-ctrl-btn--location" title="現在地へ" onClick={handlePanToCurrent}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="3" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;