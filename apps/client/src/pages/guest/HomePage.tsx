import { useState, type FC } from "react";
import { Link } from "react-router-dom";
import { TopNavBar } from "../../components/TopNavBar";
import "./HomePage.css";

interface CafeInfo {
  id: number;
  name: string;
  address: string;
  rating: number;
  status: "open" | "closed";
  tags: string[];
  distance: string;
  x: number;
  y: number;
}

const CAFES: CafeInfo[] = [
  { id: 1, name: "The Note Coffee", address: "64 Lương Văn Can, Hoàn Kiếm", rating: 4.5, status: "open", tags: ["速度Wi-Fi", "コンセント", "静か"], distance: "0.3km", x: 37, y: 34 },
  { id: 2, name: "Cộng Cà Phê", address: "152 Triệu Việt Vương, Hai Bà Trưng", rating: 4.3, status: "open", tags: ["速度Wi-Fi", "エアコン"], distance: "0.8km", x: 56, y: 50 },
  { id: 3, name: "Tranquil Books & Coffee", address: "5 Nguyễn Quang Bích, Hoàn Kiếm", rating: 4.7, status: "open", tags: ["静か", "コンセント"], distance: "0.5km", x: 29, y: 53 },
  { id: 4, name: "Kafé Giang", address: "39 Nguyễn Hữu Huân, Hoàn Kiếm", rating: 4.4, status: "closed", tags: ["速度Wi-Fi", "テラス席"], distance: "1.1km", x: 48, y: 22 },
  { id: 5, name: "Highlands Coffee", address: "1 Đinh Tiên Hoàng, Hoàn Kiếm", rating: 4.1, status: "open", tags: ["エアコン", "速度Wi-Fi"], distance: "1.5km", x: 67, y: 17 },
  { id: 6, name: "The Workshop Coffee", address: "27 Trần Nhân Tông, Hai Bà Trưng", rating: 4.6, status: "open", tags: ["速度Wi-Fi", "コンセント", "エアコン"], distance: "1.2km", x: 44, y: 63 },
  { id: 7, name: "Loading T Cafe", address: "8 Chân Cầm, Hoàn Kiếm", rating: 4.2, status: "closed", tags: ["静か", "テラス席"], distance: "1.8km", x: 20, y: 74 },
  { id: 8, name: "Hanoi Social Club", address: "6 Hội Vũ, Hoàn Kiếm", rating: 4.8, status: "open", tags: ["速度Wi-Fi", "コンセント", "静か", "エアコン"], distance: "0.9km", x: 61, y: 74 },
];

const FILTER_CHIPS = ["近くの店", "営業中", "高評価"];
const POPULAR_TAGS = ["速度Wi-Fi", "静か", "コンセント", "エアコン", "テラス席"];
const OSM_URL =
  "https://www.openstreetmap.org/export/embed.html?bbox=105.834%2C21.018%2C105.874%2C21.040&layer=mapnik";

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
  const [selectedCafe, setSelectedCafe] = useState<CafeInfo | null>(null);

  const toggleFilter = (f: string) =>
    setActiveFilters((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );

  const toggleTag = (t: string) =>
    setActiveTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );

  return (
    <div className="home-root">
      {/* ── NAVBAR (1-6) ── */}
      <TopNavBar mode="guest" activeTab="home" />

      {/* ── MAIN CONTENT ── */}
      <div className="home-main">
        {/* ── SIDEBAR ── */}
        <aside className="home-sidebar">
          {/* Slogan (7) */}
          <div className="sidebar-hero">
            <h1 className="sidebar-hero__title">理想のワークスペース</h1>
            <p className="sidebar-hero__sub">厳選されたカフェスペース</p>
          </div>

          {/* Search bar (8) */}
          <div className="sidebar-search">
            <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              id="search-bar"
              className="search-input"
              type="text"
              placeholder="キーワードやタグで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter chips (9) */}
          <div className="filter-chips" id="filter-chips">
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

          {/* Popular tags title (17) */}
          <div className="sidebar-tags">
            <p className="sidebar-tags__title" id="popular-tags-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              人気のあるタグ
            </p>
            {/* Search tags (18) */}
            <div className="tag-list">
              {POPULAR_TAGS.map((tag) => (
                <button
                  key={tag}
                  id={`tag-${tag}`}
                  className={`search-tag${activeTags.includes(tag) ? " search-tag--active" : ""}`}
                  onClick={() => toggleTag(tag)}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── MAP AREA (10-16) ── */}
        <div className="map-area" id="main-map">
          <div className="map-inner">
            {/* OSM iframe (10) */}
            <iframe
              title="WorkSpot HaNoi Map"
              src={OSM_URL}
              className="map-iframe"
              scrolling="no"
            />

          {/* Pin overlay */}
          <div className="map-overlay">
            {/* Café pins (11) */}
            {CAFES.map((cafe) => (
              <button
                key={cafe.id}
                id={`cafe-pin-${cafe.id}`}
                className={`cafe-pin${selectedCafe?.id === cafe.id ? " cafe-pin--selected" : ""}`}
                style={{ left: `${cafe.x}%`, top: `${cafe.y}%` }}
                onClick={() => setSelectedCafe(cafe.id === selectedCafe?.id ? null : cafe)}
                title={cafe.name}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                </svg>
              </button>
            ))}

            {/* Current location marker (12) */}
            <div className="current-location" id="current-location" style={{ left: "27%", top: "54%" }}>
              <div className="current-location__pulse" />
              <div className="current-location__dot" />
            </div>

            {/* Info card (13) */}
            {selectedCafe && (
              <div
                className="info-card"
                id="info-card"
                style={{
                  left: selectedCafe.x > 60 ? `${selectedCafe.x - 32}%` : `${selectedCafe.x + 2}%`,
                  top: selectedCafe.y > 60 ? `${selectedCafe.y - 40}%` : `${selectedCafe.y + 6}%`,
                }}
              >
                <div className="info-card__header">
                  <span className={`info-card__status info-card__status--${selectedCafe.status}`}>
                    {selectedCafe.status === "open" ? "営業中" : "閉店中"}
                  </span>
                  <button className="info-card__close" onClick={() => setSelectedCafe(null)}>✕</button>
                </div>
                <p className="info-card__name">{selectedCafe.name}</p>
                <p className="info-card__address">{selectedCafe.address}</p>
                <div className="info-card__meta">
                  <StarRating value={selectedCafe.rating} />
                  <span className="info-card__dist">{selectedCafe.distance}</span>
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
            {/* Zoom in (14) */}
            <button id="zoom-in" className="map-ctrl-btn" title="ズームイン">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            {/* Zoom out (15) */}
            <button id="zoom-out" className="map-ctrl-btn" title="ズームアウト">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            {/* Return to location (16) */}
            <button id="goto-location" className="map-ctrl-btn map-ctrl-btn--location" title="現在地へ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
              </svg>
            </button>
          </div>

          {/* Location label (13) */}
          {!selectedCafe && (
            <div className="map-location-label" id="location-label">
              <span className="map-location-label__sub">現在表示中</span>
              <span className="map-location-label__name">Ba Dinh, Ha Noi</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
