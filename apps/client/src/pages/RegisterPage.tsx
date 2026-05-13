import { useState, type FC, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LocationSelector } from "../components/LocationSelector";
import "./RegisterPage.css";

type Role = "cafe_owner" | "japanese_user";

const RegisterPage: FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>("cafe_owner");
  const [errorMsg, setErrorMsg] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setFormData({ ...formData, latitude: lat, longitude: lng });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(""); // Reset lỗi khi submit

    if (!formData.latitude || !formData.longitude) {
      setErrorMsg("Vui lòng chọn vị trí của bạn trên bản đồ.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: selectedRole,
          latitude: formData.latitude,
          longitude: formData.longitude,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.message || "Lỗi đăng ký không xác định");
        return;
      }

      alert(data.message || "Đăng ký thành công! Vui lòng đăng nhập.");
      navigate("/login");
    } catch (error) {
      console.error("Error during registration:", error);
      setErrorMsg("Lỗi kết nối đến máy chủ. Vui lòng thử lại.");
    }
  };

  return (
    <div className="register-root">
      {/* ===== LEFT PANEL — ảnh nền + logo + mô tả (15, 16, 17) ===== */}
      <div className="register-left">
        <div className="register-left__overlay" />

        {/* Logo (16) */}
        <div className="register-logo">
          <div className="register-logo__icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path
                d="M6 8h20v2H6zM8 12h16c0 6-2 10-8 12C10 22 8 18 8 12z"
                fill="white"
                opacity="0.9"
              />
              <path
                d="M22 10c0-2 2-3 4-2v4c-2 1-4 0-4-2z"
                fill="white"
                opacity="0.7"
              />
            </svg>
          </div>
          <span className="register-logo__text">
            WorkSpot<br />HaNoi
          </span>
        </div>

        {/* Mô tả (17) */}
        <div className="register-left__bottom">
          <p className="register-left__desc">
            街の中心で、あなただけの特別な居場所を見つけよう。<br />
            深い集中とこだわりのコーヒーのための、厳選された空間。
          </p>
          <div className="register-left__dots">
            <span className="dot dot--active" />
            <span className="dot" />
            <span className="dot" />
          </div>
        </div>
      </div>

      {/* ===== RIGHT PANEL — form đăng ký ===== */}
      <div className="register-right">
        <div className="register-form-wrapper">

          {/* Tiêu đề biểu mẫu (1) */}
          <h1 className="register-title">アカウントを作成</h1>

          {/* Tiêu đề phụ (2) */}
          <p className="register-subtitle">
            今日から理想のワークスペースを見つける旅を始めましょう。
          </p>

          <form className="register-form" onSubmit={handleSubmit}>

            {/* Họ tên (3, 4) */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">
                {/* (3) */}
                氏名
              </label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                {/* (4) */}
                <input
                  id="reg-name"
                  className="form-input"
                  type="text"
                  name="name"
                  placeholder="名前を入力"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email (5, 6) */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">
                {/* (5) */}
                メールアドレス
              </label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
                {/* (6) */}
                <input
                  id="reg-email"
                  className="form-input"
                  type="email"
                  name="email"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Mật khẩu (7, 8, 9) */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">
                {/* (7) */}
                パスワード
              </label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                {/* (8) */}
                <input
                  id="reg-password"
                  className="form-input"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                {/* (9) icon ẩn/hiện mật khẩu */}
                <button
                  type="button"
                  id="toggle-password"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Chọn vai trò (10, 11, 12) */}
            <div className="form-group">
              {/* (10) */}
              <label className="form-label">あなたの役割を選択</label>
              <div className="role-selector">
                {/* (11) Chủ quán */}
                <button
                  type="button"
                  id="role-cafe-owner"
                  className={`role-btn${selectedRole === "cafe_owner" ? " role-btn--active" : ""}`}
                  onClick={() => setSelectedRole("cafe_owner")}
                >
                  <span className="role-btn__icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 8h20v2H6zM8 12h16c0 6-2 10-8 12C10 22 8 18 8 12z" />
                    </svg>
                  </span>
                  カフェオーナー
                </button>
                {/* (12) Người dùng */}
                <button
                  type="button"
                  id="role-japanese-user"
                  className={`role-btn${selectedRole === "japanese_user" ? " role-btn--active" : ""}`}
                  onClick={() => setSelectedRole("japanese_user")}
                >
                  <span className="role-btn__icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  日本人ユーザー
                </button>
              </div>
            </div>

            {/* Hiển thị lỗi nếu có */}
            {errorMsg && (
              <p style={{ color: "#ef4444", fontSize: "14px", marginTop: "10px", marginBottom: "10px", textAlign: "center", fontWeight: 500 }}>
                {errorMsg}
              </p>
            )}

            {/* Nút Đăng ký (13) */}
            <button type="submit" id="register-submit" className="register-submit-btn">
              新規登録 (Đăng ký)
            </button>
          </form>

          {/* Link Đăng nhập (14) */}
          <p className="register-login-link">
            すでにアカウントをお持ちですか？{" "}
            <Link to="/login" id="goto-login">ログイン</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
