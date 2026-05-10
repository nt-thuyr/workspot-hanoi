import { FC } from "react";
import { Link } from "react-router-dom";
// @ts-ignore
import "./TopNavBar.css";

interface TopNavBarProps {
  mode: "guest" | "owner";
  activeTab: string;
}

export const TopNavBar: FC<TopNavBarProps> = ({ mode, activeTab }) => {
  return (
    <nav className="top-nav">
      {/* Logo */}
      <Link to={mode === "guest" ? "/" : "/dashboard"} className="nav-logo" id="nav-logo">
        <div className="nav-logo__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
            <line x1="6" y1="1" x2="6" y2="4" />
            <line x1="10" y1="1" x2="10" y2="4" />
            <line x1="14" y1="1" x2="14" y2="4" />
          </svg>
        </div>
        <span className="nav-logo__text">WorkSpot HaNoi</span>
      </Link>

      {/* Menu */}
      <div className="nav-menu">
        {mode === "guest" ? (
          <>
            <Link to="/" id="menu-home" className={`nav-link ${activeTab === "home" ? "nav-link--active" : ""}`}>ホーム</Link>
            <Link to="/booking" id="menu-booking" className={`nav-link ${activeTab === "booking" ? "nav-link--active" : ""}`}>予約</Link>
            <Link to="/reviews" id="menu-reviews" className={`nav-link ${activeTab === "reviews" ? "nav-link--active" : ""}`}>レビュー</Link>
          </>
        ) : (
          <>
            <Link to="/dashboard" id="nav-dashboard" className={`nav-link ${activeTab === "dashboard" ? "nav-link--active" : ""}`}>ダッシュボード</Link>
            <Link to="/cafes" id="nav-cafe-list" className={`nav-link ${activeTab === "cafes" ? "nav-link--active" : ""}`}>カフェ一覧</Link>
            <Link to="/cafes/register" id="nav-new" className={`nav-link ${activeTab === "register" ? "nav-link--active" : ""}`}>新規作成</Link>
          </>
        )}
      </div>

      {/* Right Side */}
      {mode === "guest" ? (
        <div className="nav-auth">
          <Link to="/login" id="nav-login" className="nav-btn-login">ログイン</Link>
          <Link to="/register" id="nav-register" className="nav-btn-register">新規登録</Link>
        </div>
      ) : (
        <div className="nav-right">
          <button id="nav-notifications" className="nav-icon-btn" title="通知">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="nav-badge">2</span>
          </button>
          <button id="user-profile" className="nav-profile-btn">
            <div className="nav-avatar">T</div>
            <span>Thao</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      )}
    </nav>
  );
};
