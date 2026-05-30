import { FC, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
// @ts-ignore
import "./TopNavBar.css";
import { NotificationDropdown } from "./NotificationDropdown";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface TopNavBarProps {
  mode: "guest" | "owner";
  activeTab: string;
}

export const TopNavBar: FC<TopNavBarProps> = ({ mode, activeTab }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>(
    localStorage.getItem("user_avatar_url") || "",
  );
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    const handleAvatarUpdated = () => {
      setAvatarUrl(localStorage.getItem("user_avatar_url") || "");
    };
    window.addEventListener("avatarUpdated", handleAvatarUpdated);

    // Fetch latest profile to keep in sync
    const userId = localStorage.getItem("user_id");
    if (userId) {
      fetch(`${API_BASE_URL}/api/profiles/${userId}`)
        .then((res) => res.json())
        .then((result) => {
          if (result.success && result.data?.avatar_url) {
            localStorage.setItem("user_avatar_url", result.data.avatar_url);
            setAvatarUrl(result.data.avatar_url);
          }
        })
        .catch((err) =>
          console.error("Error fetching profile in TopNavBar:", err),
        );
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("avatarUpdated", handleAvatarUpdated);
    };
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("画像サイズは5MB以下にしてください。");
      return;
    }

    const userId = localStorage.getItem("user_id");
    const accessToken = localStorage.getItem("access_token");
    if (!userId || !accessToken) return;

    const formData = new FormData();
    formData.append("avatar", file);

    const toastId = toast.loading("アバターを更新中...");
    try {
      const res = await fetch(`${API_BASE_URL}/api/profiles/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const result = await res.json();
      if (result.success && result.data?.avatar_url) {
        const newAvatarUrl = result.data.avatar_url;
        localStorage.setItem("user_avatar_url", newAvatarUrl);
        setAvatarUrl(newAvatarUrl);
        // Sync with other pages (e.g. ReviewHistoryPage)
        window.dispatchEvent(new Event("avatarUpdated"));
        toast.success("アバターを変更しました！", { id: toastId });
      } else {
        toast.error(result.message || "アバターの更新に失敗しました。", {
          id: toastId,
        });
      }
    } catch (err) {
      console.error("Error uploading avatar:", err);
      toast.error("サーバーエラーが発生しました。", { id: toastId });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_avatar_url");
    window.location.href = "/login";
  };

  return (
    <nav className="top-nav">
      {/* Logo */}
      <Link
        to={mode === "guest" ? "/" : "/dashboard"}
        className="nav-logo"
        id="nav-logo"
      >
        <span className="nav-logo__text">WorkSpot HaNoi</span>
      </Link>

      {/* Menu */}
      <div className="nav-menu">
        {mode === "guest" ? (
          <>
            <Link
              to="/"
              id="menu-home"
              className={`nav-link ${activeTab === "home" ? "nav-link--active" : ""}`}
            >
              ホーム
            </Link>
            <Link
              to="/history"
              id="menu-booking"
              className={`nav-link ${activeTab === "history" || activeTab === "booking" ? "nav-link--active" : ""}`}
            >
              予約
            </Link>
            <Link
              to="/my-reviews"
              id="menu-reviews"
              className={`nav-link ${activeTab === "reviews" ? "nav-link--active" : ""}`}
            >
              レビュー
            </Link>
          </>
        ) : (
          <>
            <Link
              to="/dashboard"
              id="nav-dashboard"
              className={`nav-link ${activeTab === "dashboard" ? "nav-link--active" : ""}`}
            >
              ダッシュボード
            </Link>
            <Link
              to="/cafes"
              id="nav-cafe-list"
              className={`nav-link ${activeTab === "cafes" ? "nav-link--active" : ""}`}
            >
              カフェ一覧
            </Link>
            <Link
              to="/cafes/register"
              id="nav-new"
              className={`nav-link ${activeTab === "register" ? "nav-link--active" : ""}`}
            >
              新規作成
            </Link>
          </>
        )}
      </div>

      {/* Right Side */}
      {!localStorage.getItem("access_token") ? (
        <div className="nav-auth">
          <Link to="/login" id="nav-login" className="nav-btn-login">
            ログイン
          </Link>
          <Link to="/register" id="nav-register" className="nav-btn-register">
            新規登録
          </Link>
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
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="nav-avatar-img"
                  />
                ) : (
                  (() => {
                    const name = localStorage.getItem("user_name");
                    return name && name.length > 0
                      ? name.charAt(0).toUpperCase()
                      : "U";
                  })()
                )}
              </div>
              <span>{localStorage.getItem("user_name") || "ユーザー"}</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {isDropdownOpen && (
              <div className="profile-dropdown">
                <div className="dropdown-header">
                  <div className="dropdown-avatar-wrap">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="dropdown-avatar-img"
                      />
                    ) : (
                      <div className="dropdown-avatar-placeholder">
                        {(localStorage.getItem("user_name") || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                    <div
                      className="dropdown-avatar-camera"
                      onClick={() => fileInputRef.current?.click()}
                      title="アバターを変更"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        width="12"
                        height="12"
                      >
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  </div>
                  <span className="dropdown-name">
                    {localStorage.getItem("user_name") || "ユーザー"}
                  </span>
                  <span className="dropdown-email">
                    {localStorage.getItem("user_email") || "user@example.com"}
                  </span>
                </div>
                <div className="dropdown-divider" />
                <button
                  className="dropdown-item dropdown-item--danger"
                  onClick={handleLogout}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
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
