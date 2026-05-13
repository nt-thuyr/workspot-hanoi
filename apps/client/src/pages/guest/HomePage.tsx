import { useState, useEffect, type FC, useCallback } from "react";
import { Link } from "react-router-dom";
// 1. Import Leaflet và CSS (Bắt buộc phải có CSS để bản đồ không bị vỡ)
import { MapContainer, TileLayer, Marker, useMapEvents, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { TopNavBar } from "../../components/TopNavBar";
import "./HomePage.css";

// 2. Cấu hình Icon cho ghim (Marker)
// Leaflet cần định nghĩa Icon rõ ràng vì nó không có icon mặc định sẵn như Google
const createCafeIcon = (imageUrl?: string) => {
  return new L.Icon({
    iconUrl: imageUrl || "https://cdn-icons-png.flaticon.com/512/2776/2776067.png",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
    className: "custom-marker-icon"
  });
};

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
const centerHanoi: [number, number] = [21.028511, 105.804817];

function StarRating({ value }: { value: number }) {
  return (
    <span className="star-rating">
      {"★".repeat(Math.floor(value))}
      {"☆".repeat(5 - Math.floor(value))}
      <span className="star-value">{value.toFixed(1)}</span>
    </span>
  );
}

// Component hỗ trợ bắt sự kiện click lên vùng trống của bản đồ
function MapEventsHandler({ onMapClick }: { onMapClick: () => void }) {
  useMapEvents({
    click() {
      onMapClick();
    },
  });
  return null;
}

const HomePage: FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [cafes, setCafes] = useState<CafeInfo[]>([]);
  const [selectedCafe, setSelectedCafe] = useState<CafeInfo | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);

  // 3. Gọi API lấy dữ liệu từ Backend
  const fetchCafes = async () => {
    try {
      const params = new URLSearchParams();
      if (activeFilters.includes("営業中")) params.append("isOpen", "true");
      if (activeTags.includes("Fast Wi-Fi")) params.append("hasWifi", "true");
      if (activeTags.includes("Quiet")) params.append("isQuiet", "true");

      params.append("lat", centerHanoi[0].toString());
      params.append("lng", centerHanoi[1].toString());
      params.append("maxDistance", "30"); //bán kính tìm kiếm 30km

      // Khớp với cổng backend bạn đã khai báo trong apps/server/.env
      const response = await fetch(`http://localhost:3000/api/cafes/map?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setCafes(result.data);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách Cafe:", error);
    }
  };

  useEffect(() => {
    fetchCafes();
  }, [activeFilters, activeTags]);

  const toggleFilter = (f: string) =>
    setActiveFilters((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);

  const toggleTag = (t: string) =>
    setActiveTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const handlePanToCurrent = () => {
    if (map) {
      map.flyTo(centerHanoi, 14);
    }
  };

  return (
    <div className="home-root">
      <TopNavBar mode="guest" activeTab="home" />

      <div className="home-main">
        <aside className="home-sidebar">
          <div className="sidebar-hero">
            <h1 className="sidebar-hero__title">理想のワークスペース</h1>
            <p className="sidebar-hero__sub">厳選されたカフェスペース</p>
          </div>

          <div className="sidebar-search">
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

        <div className="map-area" id="main-map">
          <div className="map-inner" style={{ height: "100%", width: "100%" }}>

            {/* 4. RENDER BẢN ĐỒ OPENSTREETMAP */}
            <MapContainer
              center={centerHanoi}
              zoom={14}
              scrollWheelZoom={true}
              style={{ height: "100%", width: "100%" }}
              zoomControl={false}
              ref={setMap}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapEventsHandler onMapClick={() => setSelectedCafe(null)} />

              {/* Render các quán Cafe dưới dạng ghim */}
              {cafes.map((cafe) => {
                if (!cafe.location?.lat || !cafe.location?.lng) return null;

                return (
                  <Marker
                    key={cafe.id}
                    position={[Number(cafe.location.lat), Number(cafe.location.lng)]}
                    icon={createCafeIcon(cafe.imageUrl)}
                    eventHandlers={{
                      click: () => setSelectedCafe(cafe),
                    }}
                  />
                );
              })}
            </MapContainer>

            {/* Lớp phủ Info Card */}
            <div className="map-overlay">
              {selectedCafe && (
                <div className="info-card" style={{ position: "absolute", bottom: "24px", left: "50%", transform: "translateX(-50%)", zIndex: 1000 }}>
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

          <div className="map-controls" style={{ zIndex: 1000 }}>
            <button className="map-ctrl-btn" onClick={() => map?.zoomIn()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <button className="map-ctrl-btn" onClick={() => map?.zoomOut()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <button className="map-ctrl-btn map-ctrl-btn--location" onClick={handlePanToCurrent}>
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