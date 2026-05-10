import { useState, type FC, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import "./CafeEditPage.css";

const SUGGESTED_TAGS = [
  "エアコン", "ペット可", "駐車場", "テラス席", "飲食可",
  "プロジェクター", "会議室", "24時間営業", "コンセント", "静か",
];

const OSM_URL =
  "https://www.openstreetmap.org/export/embed.html?bbox=105.834%2C21.018%2C105.874%2C21.040&layer=mapnik";

interface MenuImage { id: number; url: string; }

const CafeEditPage: FC = () => {
  const [cafeName, setCafeName] = useState("The Coffee House");
  const [street, setStreet] = useState("54 Linh Lang");
  const [district, setDistrict] = useState("Ba Dinh");
  const [tags, setTags] = useState<string[]>(["高速Wi-Fi", "静か"]);
  const [tagInput, setTagInput] = useState("");
  const [openTime, setOpenTime] = useState("08:00 AM");
  const [closeTime, setCloseTime] = useState("10:00 PM");
  const [menuImages] = useState<MenuImage[]>([
    { id: 1, url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=120&h=90&fit=crop" },
    { id: 2, url: "https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=120&h=90&fit=crop" },
  ]);

  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t));
  const addTag = (t: string) => {
    if (t.trim() && !tags.includes(t.trim())) setTags((prev) => [...prev, t.trim()]);
  };
  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { addTag(tagInput); setTagInput(""); }
  };

  return (
    <div className="edit-root">
      {/* ── NAVBAR (1-6) ── */}
      <nav className="edit-nav">
        {/* Logo (1) */}
        <div className="edit-nav__logo" id="edit-nav-logo">
          <div className="nav-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
              <line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
            </svg>
          </div>
          <span>WorkSpot HaNoi</span>
        </div>

        {/* Nav menu (2, 3, 4) */}
        <div className="edit-nav__menu">
          <Link to="/dashboard" id="nav-dashboard" className="edit-nav__link">ダッシュボード</Link>
          <Link to="/cafes" id="nav-cafe-list" className="edit-nav__link edit-nav__link--active">カフェ一覧</Link>
          <Link to="/cafes/new" id="nav-new" className="edit-nav__link">新規作成</Link>
        </div>

        {/* Right side (5, 6) */}
        <div className="edit-nav__right">
          {/* Notification (5) */}
          <button id="nav-notifications" className="nav-icon-btn" title="通知">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="nav-badge">2</span>
          </button>
          {/* User profile (6) */}
          <button id="user-profile" className="nav-profile-btn">
            <div className="nav-avatar">T</div>
            <span>Thao</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </nav>

      {/* ── PAGE HEADER (7, 8) ── */}
      <div className="edit-header">
        <h1 className="edit-header__title" id="edit-title">カフェ情報を編集</h1>{/* (7) */}
        <p className="edit-header__sub" id="edit-subtitle">カフェの詳細情報、営業時間、または写真を更新します。</p>{/* (8) */}
      </div>

      {/* ── MAIN BODY ── */}
      <div className="edit-body">
        {/* ── LEFT COLUMN ── */}
        <div className="edit-left">

          {/* Basic info section (9, 10) */}
          <section className="edit-card" id="basic-info-area">
            <div className="edit-card__head" id="basic-info-heading">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
              </svg>
              <span>基本情報</span>{/* (10) */}
            </div>

            {/* Café name (11, 12) */}
            <div className="edit-field">
              <label className="edit-label" htmlFor="cafe-name">カフェ名</label>{/* (11) */}
              <input id="cafe-name" className="edit-input" value={cafeName}
                onChange={(e) => setCafeName(e.target.value)} placeholder="カフェ名を入力" />{/* (12) */}
            </div>

            {/* Address row (13–16) */}
            <div className="edit-row">
              <div className="edit-field edit-field--grow">
                <label className="edit-label" htmlFor="cafe-street">番地・通り名</label>{/* (13) */}
                <input id="cafe-street" className="edit-input" value={street}
                  onChange={(e) => setStreet(e.target.value)} placeholder="54 Linh Lang" />{/* (15) */}
              </div>
              <div className="edit-field edit-field--shrink">
                <label className="edit-label" htmlFor="cafe-district">区・町</label>{/* (14) */}
                <input id="cafe-district" className="edit-input" value={district}
                  onChange={(e) => setDistrict(e.target.value)} placeholder="Ba Dinh" />{/* (16) */}
              </div>
            </div>

            {/* Tags (17–21) */}
            <div className="edit-field">
              <label className="edit-label">特徴タグ</label>{/* (17) */}
              <div className="tag-input-box">
                {/* Selected tags (18) */}
                {tags.map((t) => (
                  <span key={t} className="tag-chip" id={`selected-tag-${t}`}>
                    {t}
                    <button className="tag-chip__remove" onClick={() => removeTag(t)}>×</button>
                  </span>
                ))}
                {/* Tag input (19) */}
                <input
                  id="tag-input"
                  className="tag-input"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="タグを入力してEnterで追加..."
                />
              </div>
              {/* Suggested tags (20, 21) */}
              <p className="suggested-label" id="suggested-tags-label">おすすめ</p>{/* (20) */}
              <div className="suggested-tags" id="suggested-tag-list">
                {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((t) => (
                  <button key={t} className="suggested-tag" onClick={() => addTag(t)}>+ {t}</button>
                ))}
              </div>{/* (21) */}
            </div>
          </section>

          {/* Business hours (22, 23) */}
          <section className="edit-card" id="hours-area">
            <div className="edit-card__head" id="hours-heading">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <span>営業時間</span>{/* (23) */}
            </div>
            <div className="edit-row">
              <div className="edit-field edit-field--half">
                <label className="edit-label" htmlFor="open-time">開店時間</label>{/* (24) */}
                <input id="open-time" className="edit-input" value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)} />{/* (25) */}
              </div>
              <div className="edit-field edit-field--half">
                <label className="edit-label" htmlFor="close-time">閉店時間</label>{/* (26) */}
                <input id="close-time" className="edit-input" value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)} />{/* (27) */}
              </div>
            </div>
          </section>

        </div>

        {/* ── RIGHT COLUMN: MAP (28–34) ── */}
        <div className="edit-map-col">
          <div className="edit-map-area" id="edit-main-map">
            <div className="edit-map-inner">
              {/* OSM iframe (28) */}
              <iframe title="Cafe Location Map" src={OSM_URL} className="edit-map-iframe" scrolling="no" />

              {/* Overlay */}
              <div className="edit-map-overlay">
                {/* Café pin (29) */}
                <button className="edit-cafe-pin" id="edit-cafe-pin" style={{ left: "55%", top: "45%" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                  </svg>
                </button>

                {/* Current location (30) */}
                <div className="edit-curr-loc" id="edit-curr-location" style={{ left: "43%", top: "53%" }}>
                  <div className="edit-curr-loc__pulse" />
                  <div className="edit-curr-loc__dot" />
                </div>

                {/* Location info card (34) */}
                <div className="edit-loc-card" id="edit-loc-card">
                  <span className="edit-loc-card__sub">現在表示中</span>
                  <span className="edit-loc-card__name">Ba Dinh, Ha Noi</span>
                </div>
              </div>

              {/* Map controls */}
              <div className="edit-map-controls">
                {/* Zoom in (31) */}
                <button id="edit-zoom-in" className="edit-map-btn" title="ズームイン">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                {/* Zoom out (32) */}
                <button id="edit-zoom-out" className="edit-map-btn" title="ズームアウト">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                {/* Return to location (33) */}
                <button id="edit-goto-loc" className="edit-map-btn edit-map-btn--loc" title="現在地へ">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="3" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── GALLERY SECTION (35–39) ── */}
      <div className="edit-gallery-section" id="gallery-area">
        <div className="edit-card edit-card--wide">
          <div className="edit-card__head" id="gallery-heading">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>ビジュアルギャラリー</span>{/* (36) */}
          </div>

          {/* Main image (37) */}
          <div className="gallery-main-img" id="gallery-main-img">
            <img
              src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=320&fit=crop"
              alt="Main cafe interior"
            />
            <div className="gallery-main-img__overlay">
              <button className="gallery-main-img__change-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                写真を変更
              </button>
            </div>
          </div>

          {/* Menu images (38, 39) */}
          <div className="gallery-menu-section">
            <p className="gallery-menu-label" id="menu-img-heading">メニュー画像をアップロード</p>{/* (38) */}
            <div className="gallery-menu-row">
              {/* Add button (39) */}
              <button id="add-menu-img" className="gallery-add-btn">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              {menuImages.map((img) => (
                <div key={img.id} className="gallery-menu-thumb">
                  <img src={img.url} alt="Menu" />
                  <button className="gallery-menu-thumb__remove">×</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ACTIONS (40, 41) ── */}
      <div className="edit-footer">
        <Link to="/cafes" id="cancel-btn" className="edit-footer__cancel">キャンセル</Link>{/* (40) */}
        <button id="save-btn" className="edit-footer__save">変更を保存</button>{/* (41) */}
      </div>
    </div>
  );
};

export default CafeEditPage;
