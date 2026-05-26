import { FC, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
// @ts-ignore
import "./TopNavBar.css";
import { NotificationDropdown } from "./NotificationDropdown";

interface TopNavBarProps {
  mode: "guest" | "owner";
  activeTab: string;
}

export const TopNavBar: FC<TopNavBarProps> = ({ mode, activeTab }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_name");
    window.location.href = "/login";
  };

  return (
    <nav className="top-nav">
      {/* Logo */}
      <Link to={mode === "guest" ? "/" : "/dashboard"} className="nav-logo" id="nav-logo">
        <span className="nav-logo__text">WorkSpot HaNoi</span>
      </Link>      {/* Menu */}
      <div className="nav-menu">
        {mode === "guest" ? (
          <>
            <Link to="/" id="menu-home" className={`nav-link ${activeTab === "home" ? "nav-link--active" : ""}`}>ホーム</Link>
            <Link to="/history" id="menu-booking" className={`nav-link ${activeTab === "history" || activeTab === "booking" ? "nav-link--active" : ""}`}>予約</Link>
            <Link to="/my-reviews" id="menu-reviews" className={`nav-link ${activeTab === "reviews" ? "nav-link--active" : ""}`}>レビュー</Link>
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
      {!localStorage.getItem("access_token") ? (
        <div className="nav-auth">
          <Link to="/login" id="nav-login" className="nav-btn-login">ログイン</Link>
          <Link to="/register" id="nav-register" className="nav-btn-register">新規登録</Link>
        </div>
      ) : (
        <div className="nav-right">
          <NotificationDropdown />
          <div className="nav-profile-wrapper" ref={dropdownRef}>
            <button
              id="user-profile"
              className="nav-profile-btn"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className="nav-avatar">
                {(() => {
                  const name = localStorage.getItem("user_name");
                  return name && name.length > 0 ? name.charAt(0).toUpperCase() : "U";
                })()}
              </div>
              <span>{localStorage.getItem("user_name") || "ユーザー"}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {isDropdownOpen && (
              <div className="profile-dropdown">
                <div className="dropdown-header">
                  <span className="dropdown-name">{localStorage.getItem("user_name") || "ユーザー"}</span>
                  <span className="dropdown-email">{localStorage.getItem("user_email") || "user@example.com"}</span>
                </div>
                <div className="dropdown-divider" />
                <button className="dropdown-item dropdown-item--danger" onClick={handleLogout}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  ログアウト
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
