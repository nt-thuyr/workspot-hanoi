import { useState, useEffect, type FC, useCallback } from "react";
import { Link } from "react-router-dom";
// 1. Import Leaflet và CSS (Bắt buộc phải có CSS để bản đồ không bị vỡ)
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { TopNavBar } from "../../components/TopNavBar";
import "./HomePage.css";

// 2. Cấu hình Icon cho ghim (Marker) — dùng divIcon giống SearchPage
const createCafeIcon = (selected = false) => {
  const cls = selected ? 'map-pin map-pin--selected' : 'map-pin';
  return L.divIcon({
    className: '',
    html: `<div class="${cls}">
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M18.5 9.5A6.5 6.5 0 0 0 5.5 9.5c0 4.5 6.5 11 6.5 11S18.5 14 18.5 9.5z"/>
        <circle cx="12" cy="9.5" r="2.5" fill="white"/>
      </svg>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -42],
  });
};

const createCurrentLocationIcon = () =>
  L.divIcon({
    className: "",
    html: `<div class="current-pin">
      <div class="current-pin__pulse"></div>
      <div class="current-pin__dot"></div>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

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
      if (searchQuery.trim()) params.append("keyword", searchQuery.trim());

      params.append("lat", centerHanoi[0].toString());
      params.append("lng", centerHanoi[1].toString());
      params.append("maxDistance", "30"); //bán kính tìm kiếm 30km

      // Khớp với cổng backend bạn đã khai báo trong apps/server/.env
      const url = `http://localhost:3000/api/cafes/map?${params.toString()}`;
      console.log('[HomePage] Fetching cafes from:', url);

      const response = await fetch(url);
      const result = await response.json();

      console.log('[HomePage] API Response:', result);

      if (result.success) {
        console.log('[HomePage] Cafes loaded:', result.data?.length || 0);
        setCafes(result.data);
      } else {
        console.error('[HomePage] API failed:', result.message);
      }
    } catch (error) {
      console.error("[HomePage] Error fetching cafes:", error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCafes();
    }, 400); // 400ms debounce
    return () => clearTimeout(timer);
  }, [activeFilters, activeTags, searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCafes();
  };

  const toggleFilter = (f: string) =>
    setActiveFilters((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);

  const toggleTag = (t: string) =>
    setActiveTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const handleSelectCafe = useCallback((cafe: CafeInfo) => {
    setSelectedCafe(cafe);
    if (map) {
      map.flyTo([cafe.location.lat, cafe.location.lng], 15, { animate: true, duration: 0.6 });
    }
  }, [map]);

  const handlePanToCurrent = () => {
    if (map) {
      map.flyTo(centerHanoi, 14, { animate: true });
    }
  };

  return (
    <div className="home-root">
      <TopNavBar mode="guest" activeTab="home" />

      <div className="home-main">
        <aside className="home-sidebar" id="search-sidebar">
          <div className="sidebar-hero">
            <h1 className="sidebar-hero__title">理想のワークスペース</h1>
            <p className="sidebar-hero__sub">厳選されたカフェスペース</p>
          </div>

          <form className="sidebar-search" onSubmit={handleSearchSubmit}>
            <svg
              className="search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              width="15"
              height="15"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              id="search-bar"
              className="search-input"
              type="text"
              placeholder="キーワードやタグで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

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

          {/* Hiển thị số lượng kết quả và danh sách quán */}
          {cafes.length > 0 ? (
            <div className="search-results-section mt-4 flex-1 overflow-y-auto pr-2 pb-4">
              <div className="text-sm text-gray-600 mb-4 font-medium">
                <span className="font-bold text-[#614734]">「{searchQuery || "すべて"}」</span>
                {" で "}
                <span className="font-bold text-[#614734]">{cafes.length}件</span>
                {" のカフェが見つかりました"}
              </div>
              
              <div className="flex flex-col gap-4">
                {cafes.map((cafe) => {
                  const isSelected = selectedCafe?.id === cafe.id;
                  return (
                    <div
                      key={cafe.id}
                      className={`bg-white rounded-xl p-4 cursor-pointer transition-all border-2 ${
                        isSelected 
                          ? "border-[#614734] shadow-md transform scale-[1.02]" 
                          : "border-transparent shadow-sm hover:shadow-md hover:border-[#614734]/30"
                      }`}
                      onClick={() => handleSelectCafe(cafe)}
                    >
                      <div className="flex gap-4">
                        <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 relative bg-gray-100">
                          {cafe.imageUrl ? (
                            <img src={cafe.imageUrl} alt={cafe.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                              </svg>
                            </div>
                          )}
                          <div className={`absolute top-1.5 left-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            cafe.isOpenNow ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}>
                            {cafe.isOpenNow ? "営業中" : "閉店中"}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <div>
                            <h3 className="font-bold text-[#3d2c20] text-base truncate" title={cafe.name}>{cafe.name}</h3>
                            <div className="flex items-center gap-2 mt-1 text-xs">
                              <StarRating value={cafe.rating} />
                              <span className="text-gray-400">({cafe.reviewCount})</span>
                            </div>
                          </div>
                          
                          <div className="space-y-1 mt-2 text-xs text-gray-500">
                            <div className="flex items-center gap-1.5 truncate">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12" className="text-[#614734]">
                                <path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" />
                                <path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><circle cx="12" cy="20" r="1" fill="currentColor" />
                              </svg>
                              <span className="truncate">{cafe.tags?.[0] || "Wi-Fi"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12" className="text-gray-400">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                              </svg>
                              <span className="truncate">
                                {cafe.distance ? `${cafe.distance}km先` : ""}
                                {(cafe as any).address ? ` • ${(cafe as any).address.split(',').pop()?.trim()}` : ""}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="sidebar-tags mt-4">
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
          )}
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

              {/* ⑨ Current Location Marker */}
              <Marker
                position={centerHanoi}
                icon={createCurrentLocationIcon()}
              />

              {/* Render các quán Cafe dưới dạng ghim */}
              {cafes.map((cafe) => {
                if (!cafe.location?.lat || !cafe.location?.lng) return null;

                return (
                  <Marker
                    key={cafe.id}
                    position={[Number(cafe.location.lat), Number(cafe.location.lng)]}
                    icon={createCafeIcon(selectedCafe?.id === cafe.id)}
                    eventHandlers={{
                      click: () => handleSelectCafe(cafe),
                    }}
                  >
                    <Popup className="cafe-popup" closeButton={false}>
                      <div className="popup-inner">
                        <div className="popup-header">
                          <p className="popup-name">{cafe.name}</p>
                          <span className={`popup-badge ${cafe.isOpenNow ? "popup-badge--open" : "popup-badge--closed"}`}>
                            {cafe.isOpenNow ? "営業中" : "閉店中"}
                          </span>
                        </div>
                        <StarRating value={cafe.rating} />
                        <div className="popup-row">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                            <path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" />
                            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><circle cx="12" cy="20" r="1" fill="currentColor" />
                          </svg>
                          {cafe.tags?.[0] ?? "Wi-Fi"}
                        </div>
                        <div className="popup-row popup-dist">
                          {cafe.distance ? `${cafe.distance} km` : ""}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            {/* KHU VỰC ĐANG XEM — bottom-center */}
            <div className="location-card" id="location-info-card">
              <span className="location-card__label">現在表示中</span>
              <span className="location-card__name">Ba Dinh, Ha Noi</span>
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