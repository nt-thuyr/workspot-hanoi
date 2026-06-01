import {
  useState,
  useEffect,
  type FC,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Link } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TopNavBar } from "../../components/TopNavBar";
import "./SearchPage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// ── Types ────────────────────────────────────────────────────
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
  address: string;
  wifi: "高速Wi-Fi" | "無料Wi-Fi" | "なし";
  district: string;
}

// ── Constants ────────────────────────────────────────────────
const FILTER_CHIPS = ["近くの店", "営業中", "高評価"];
const centerHanoi: [number, number] = [21.0056, 105.8433];


// ── Icon Factory ────────────────────────────────────────────
const createCafeIcon = (selected = false) =>
  L.divIcon({
    className: "",
    html: `<div class="map-pin ${selected ? "map-pin--selected" : ""}">
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M18.5 9.5A6.5 6.5 0 0 0 5.5 9.5c0 4.5 6.5 11 6.5 11S18.5 14 18.5 9.5z"/>
        <circle cx="12" cy="9.5" r="2.5" fill="white"/>
      </svg>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -42],
  });

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

// ── Sub-components ───────────────────────────────────────────
function StarRating({ value }: { value: number }) {
  return (
    <span className="star-row">
      <span className="stars">
        {"★".repeat(Math.floor(value))}
        {"☆".repeat(5 - Math.floor(value))}
      </span>
      <span className="star-num">{value.toFixed(1)}</span>
    </span>
  );
}

function MapEventsHandler({ onMapClick }: { onMapClick: () => void }) {
  useMapEvents({ click: onMapClick });
  return null;
}

// ── Main Component ───────────────────────────────────────────
const SearchPage: FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [cafes, setCafes] = useState<CafeInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCafe, setSelectedCafe] = useState<CafeInfo | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [mapZoom, setMapZoom] = useState(14);
  const listRef = useRef<HTMLDivElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const autoSelectNextFetchRef = useRef(false);

  const [userCoords, setUserCoords] = useState<[number, number]>(centerHanoi);
  const [locationName, setLocationName] = useState("Hai Bà Trưng, Hà Nội");

  // Search suggestions
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 1) return [];
    const seen = new Set<string>();
    const results: { label: string; type: "cafe" | "district" }[] = [];
    cafes.forEach((c) => {
      if (c.name.toLowerCase().includes(q) && !seen.has(c.name)) {
        seen.add(c.name);
        results.push({ label: c.name, type: "cafe" });
      }
      if (c.district.toLowerCase().includes(q) && !seen.has(c.district)) {
        seen.add(c.district);
        results.push({ label: c.district, type: "district" });
      }
    });
    return results.slice(0, 6);
  }, [searchQuery, cafes]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lấy GPS người dùng khi mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log(
            "[SearchPage] GPS successfully retrieved:",
            latitude,
            longitude,
          );
          setUserCoords([latitude, longitude]);
        },
        (error) => {
          console.warn(
            "[SearchPage] GPS error, falling back to HUST B1:",
            error,
          );
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
      );
    }
  }, []);

  // Xoay bản đồ tới vị trí người dùng khi có GPS mới
  useEffect(() => {
    if (map && userCoords !== centerHanoi) {
      map.setView(userCoords, 14);
    }
  }, [map, userCoords]);

  // Sync zoom level state with map events
  useEffect(() => {
    if (!map) return;
    const onZoomEnd = () => setMapZoom(map.getZoom());
    map.on("zoomend", onZoomEnd);
    return () => { map.off("zoomend", onZoomEnd); };
  }, [map]);

  // Chuyển đổi tọa độ sang địa chỉ
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1&language=vi`,
      );
      if (response.ok) {
        const data = await response.json();
        const addr = data.address || {};
        const district =
          addr.suburb ||
          addr.city_district ||
          addr.district ||
          addr.county ||
          "";
        const city = addr.city || addr.town || addr.province || "Hà Nội";
        if (district) {
          setLocationName(`${district}, ${city}`);
        } else {
          setLocationName(city);
        }
      }
    } catch (error) {
      console.error("[SearchPage] Error reverse geocoding:", error);
    }
  };

  useEffect(() => {
    reverseGeocode(userCoords[0], userCoords[1]);
  }, [userCoords]);

  // Công thức Haversine để tính khoảng cách giữa 2 điểm tọa độ (km)
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Tự động gọi API
  const fetchCafes = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (activeFilters.includes("営業中")) params.append("isOpen", "true");
      if (activeFilters.includes("高評価")) params.append("minRating", "4");
      if (searchQuery.trim()) params.append("keyword", searchQuery.trim());
      
      params.append("lat", userCoords[0].toString());
      params.append("lng", userCoords[1].toString());
      
      if (activeFilters.includes("近くの店")) {
        params.append("maxDistance", "10");
      } else {
        params.append("maxDistance", "30");
      }

      const response = await fetch(`${API_BASE_URL}/api/cafes/map?${params.toString()}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const mapped = result.data.map((c: any) => ({
          id: c.id,
          name: c.name,
          location: { lat: Number(c.lat), lng: Number(c.lng) },
          rating: c.avg_rating || 0,
          reviewCount: c.review_count || 0,
          isOpenNow: Boolean(c.isOpenNow),
          tags: c.custom_tags || [],
          distance: c.distance ? Number(c.distance.toFixed(1)) : null,
          imageUrl: c.images?.[0]?.image_url,
          address: c.address || "",
          wifi: c.cafe_amenities?.some((a: any) => a.amenities?.name_ja?.includes("Wi-Fi")) ? "高速Wi-Fi" : "なし",
          district: c.address ? c.address.split(",").slice(-2, -1)[0]?.trim() || "Hà Nội" : "Hà Nội"
        }));
        setCafes(mapped);
        setIsLoading(false);

        if (autoSelectNextFetchRef.current) {
          autoSelectNextFetchRef.current = false;
          if (mapped.length > 0 && map) {
            setSelectedCafe(mapped[0]);
            map.flyTo([mapped[0].location.lat, mapped[0].location.lng], 15, { animate: true, duration: 0.6 });
            
            // Cuộn danh sách đến kết quả đầu tiên
            if (listRef.current) {
               const firstCard = listRef.current.querySelector('.cafe-card');
               if (firstCard) firstCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          } else {
            setSelectedCafe(null);
          }
        }
      }
    } catch (error) {
      console.error("[SearchPage] Error fetching cafes:", error);
      setIsLoading(false);
    }
  }, [searchQuery, activeFilters, userCoords, map]);

  // Debounce 400ms khi gõ từ khoá
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCafes();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Gọi ngay khi filter hoặc vị trí thay đổi
  useEffect(() => {
    fetchCafes();
  }, [activeFilters, userCoords]);

  // Filter cafes based on local state (just for immediate responsiveness while API re-fetches)
  const filteredCafes = cafes;

  const toggleFilter = (f: string) =>
    setActiveFilters((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f],
    );

  const handleSelectCafe = useCallback(
    (cafe: CafeInfo) => {
      setSelectedCafe(cafe);
      if (map) {
        map.flyTo([cafe.location.lat, cafe.location.lng], 15, {
          animate: true,
          duration: 0.6,
        });
      }
    },
    [map],
  );

  const handlePanToCurrent = () => {
    if (map) map.flyTo(userCoords, 14, { animate: true });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    autoSelectNextFetchRef.current = true;
    fetchCafes();
  };

  const handleSelectSuggestion = (label: string) => {
    setSearchQuery(label);
    setShowSuggestions(false);
  };

  return (
    <div className="search-root" id="search-page">
      {/* ① Service Logo + ② Home Menu + ③ Booking Menu + ④ Review Menu + ⑤ Login + ⑥ Register */}
      <TopNavBar mode="guest" activeTab="home" />

      <div className="search-body">
        {/* ══════════ LEFT SIDEBAR ══════════ */}
        <aside className="search-sidebar" id="search-sidebar">
          {/* ⑮ Sidebar Title */}
          <div className="sidebar-header" id="sidebar-title">
            <h2 className="sidebar-title">理想のワークスペース</h2>
            <p className="sidebar-subtitle">厳選されたカフェスペース</p>
          </div>

          {/* ⑯ Search Bar */}
          <form
            className="sidebar-search-wrap"
            onSubmit={handleSearch}
            id="search-bar"
          >
            <div className="search-field-wrap" ref={searchWrapRef}>
              <div className="search-field">
                <svg
                  className="search-icon-inner"
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
                  id="search-input"
                  className="search-input"
                  type="text"
                  placeholder="カフェ名・エリアで検索..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  autoComplete="off"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="search-clear"
                    onClick={() => { setSearchQuery(""); setShowSuggestions(false); }}
                    id="search-clear-btn"
                  >
                    ✕
                  </button>
                )}
              </div>
              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <ul className="search-suggestions" id="search-suggestions">
                  {suggestions.map((s, i) => (
                    <li
                      key={i}
                      className="search-suggestion-item"
                      onMouseDown={() => handleSelectSuggestion(s.label)}
                    >
                      <span className="suggestion-icon">
                        {s.type === "cafe" ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                            <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                            <line x1="6" y1="1" x2="6" y2="4" />
                            <line x1="10" y1="1" x2="10" y2="4" />
                            <line x1="14" y1="1" x2="14" y2="4" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                        )}
                      </span>
                      <span className="suggestion-label">{s.label}</span>
                      <span className="suggestion-type">
                        {s.type === "cafe" ? "カフェ" : "エリア"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </form>

          {/* ⑰ Filter Tags */}
          <div className="filter-row" id="filter-tags">
            {FILTER_CHIPS.map((f) => (
              <button
                key={f}
                id={`filter-${f}`}
                className={`filter-tag${activeFilters.includes(f) ? " filter-tag--on" : ""}`}
                onClick={() => toggleFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          {/* ⑱ Result Count */}
          <div className="result-count" id="search-result-count">
            {isLoading ? (
              <span className="result-count__text">検索中...</span>
            ) : (
              <>
                <span className="result-count__keyword">
                  「{searchQuery || "すべて"}」
                </span>
                <span className="result-count__text"> で </span>
                <span className="result-count__num">{filteredCafes.length}件</span>
                <span className="result-count__text">
                  {" "}
                  のカフェが見つかりました
                </span>
              </>
            )}
          </div>

          {/* ⑲ + ⑳ Cafe Cards List */}
          <div className="cafe-list" ref={listRef} id="cafe-list">
            {filteredCafes.length === 0 ? (
              <div className="cafe-list__empty">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  width="40"
                  height="40"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <p>結果が見つかりません</p>
              </div>
            ) : (
              filteredCafes.map((cafe, idx) => {
                const isSelected = selectedCafe?.id === cafe.id;
                return (
                  <div
                    key={cafe.id}
                    /* ⑲ Selected card / ⑳ Normal list item */
                    id={isSelected ? "cafe-card-selected" : `cafe-card-${idx}`}
                    className={`cafe-card${isSelected ? " cafe-card--selected" : ""}`}
                    onClick={() => handleSelectCafe(cafe)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSelectCafe(cafe)
                    }
                  >
                    {/* Thumbnail */}
                    <div className="cafe-card__thumb">
                      {cafe.imageUrl ? (
                        <img
                          src={cafe.imageUrl}
                          alt={cafe.name}
                          loading="lazy"
                        />
                      ) : (
                        <div className="cafe-card__thumb-placeholder">☕</div>
                      )}
                      <span
                        className={`cafe-badge ${cafe.isOpenNow ? "cafe-badge--open" : "cafe-badge--closed"}`}
                      >
                        {cafe.isOpenNow ? "営業中" : "閉店中"}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="cafe-card__info">
                      <div className="cafe-card__name-row">
                        <span className="cafe-card__name">{cafe.name}</span>
                      </div>
                      <div className="cafe-card__meta">
                        <StarRating value={cafe.rating} />
                        <span className="cafe-card__wifi">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            width="11"
                            height="11"
                          >
                            <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                            <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                            <circle cx="12" cy="20" r="1" fill="currentColor" />
                          </svg>
                          {cafe.wifi}
                        </span>
                      </div>
                      <div className="cafe-card__dist">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          width="11"
                          height="11"
                        >
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {cafe.distance} km先 • {cafe.district}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="cafe-card__arrow">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          width="14"
                          height="14"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ══════════ MAP AREA ══════════ */}
        <div className="map-area" id="main-map">
          {/* ⑦ Main Map */}
          <MapContainer
            center={userCoords}
            zoom={14}
            minZoom={8}
            scrollWheelZoom
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
            ref={setMap}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapEventsHandler onMapClick={() => setSelectedCafe(null)} />

            {/* ⑨ Current Location Marker */}
            <Marker position={userCoords} icon={createCurrentLocationIcon()} />

            {/* ⑩ Cafe Pins */}
            {filteredCafes.map((cafe) => (
              <Marker
                key={cafe.id}
                position={[cafe.location.lat, cafe.location.lng]}
                icon={createCafeIcon(selectedCafe?.id === cafe.id)}
                eventHandlers={{
                  click: (e) => {
                    L.DomEvent.stopPropagation(e as any);
                    handleSelectCafe(cafe);
                  },
                }}
              >
                {/* ⑧ Cafe Info Popup tại ghim */}
                <Popup className="cafe-popup" closeButton={false}>
                  <div className="popup-inner">
                    <div className="popup-header">
                      <p className="popup-name">{cafe.name}</p>
                      <span
                        className={`popup-badge ${cafe.isOpenNow ? "popup-badge--open" : "popup-badge--closed"}`}
                      >
                        {cafe.isOpenNow ? "営業中" : "閉店中"}
                      </span>
                    </div>
                    <StarRating value={cafe.rating} />
                    <div className="popup-row">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        width="12"
                        height="12"
                      >
                        <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                        <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                        <circle cx="12" cy="20" r="1" fill="currentColor" />
                      </svg>
                      {cafe.wifi}
                    </div>
                    <div className="popup-row popup-dist">
                      {cafe.distance} km先 • {cafe.district}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* ⑭ KHU VỰC ĐANG XEM — bottom-center */}
          <div className="location-card" id="location-info-card">
            <span className="location-card__label">現在表示中</span>
            <span className="location-card__name">{locationName}</span>
          </div>

          {/* Map controls ⑪ ⑫ ⑬ */}
          <div
            className="map-controls"
            id="map-controls"
            style={{ zIndex: 1000 }}
          >
            {/* ①② Zoom In */}
            <button
              id="zoom-in-btn"
              className="map-ctrl-btn"
              title="ズームイン"
              onClick={() => map?.zoomIn()}
              disabled={!map || mapZoom >= (map?.getMaxZoom?.() ?? 18)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                width="18"
                height="18"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            {/* ②③ Zoom Out */}
            <button
              id="zoom-out-btn"
              className="map-ctrl-btn"
              title="ズームアウト"
              onClick={() => map?.zoomOut()}
              disabled={!map || mapZoom <= (map?.getMinZoom?.() ?? 1)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                width="18"
                height="18"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            {/* ⑬ Return to Current Location */}
            <button
              id="current-location-btn"
              className="map-ctrl-btn map-ctrl-btn--location"
              title="現在地に戻る"
              onClick={handlePanToCurrent}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                width="18"
                height="18"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
