import { useState, type FC, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./LoginPage.css";

const LoginPage: FC = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMsg("");

        try {
            const response = await fetch("http://localhost:3000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                localStorage.setItem("access_token", data.data.session.access_token);
                
                const userRole = data.data.user.role;
                localStorage.setItem("user_role", userRole);
                localStorage.setItem("user_name", data.data.user.full_name);
                localStorage.setItem("user_email", data.data.user.email);
                localStorage.setItem("user_id", data.data.user.id);

                if (userRole === "cafe_owner") {
                    navigate("/cafes/edit");
                } else {
                    navigate("/");
                }
            } else {
                setErrorMsg(data.message || "Tài khoản hoặc mật khẩu không đúng.");
            }
        } catch (error) {
            console.error("Lỗi đăng nhập:", error);
            setErrorMsg("Không thể kết nối tới máy chủ.");
        }
    };

    return (
        <div className="login-root">
            {/* ===== LEFT PANEL — ảnh nền + logo + mô tả ===== */}
            <div className="login-left">
                <div className="login-left__overlay" />
                {/* Logo */}
                <div className="login-logo">
                    <span className="login-logo__text">
                        WorkSpot<br />HaNoi
                    </span>
                </div>

                {/* Mô tả */}
                <div className="login-left__bottom">
                    <p className="login-left__desc">
                        ハノイで、あなただけの特別な作業場所を見つけよう。<br />
                        深い集中とこだわりのコーヒーのための、厳選された空間。
                    </p>
                    <div className="login-left__dots">
                        <span className="dot dot--active" />
                        <span className="dot" />
                        <span className="dot" />
                    </div>
                </div>
            </div>

            {/* ===== RIGHT PANEL — form đăng nhập ===== */}
            <div className="login-right">
                <div className="login-form-wrapper">

                    {/* Tiêu đề biểu mẫu */}
                    <h1 className="login-title">お帰りなさい</h1>

                    {/* Tiêu đề phụ */}
                    <p className="login-subtitle">
                        ログインして、最適なワークスペースを見つけましょう。
                    </p>

                    <form className="login-form" onSubmit={handleSubmit}>

                        {/* Email */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="login-email">
                                メールアドレス
                            </label>
                            <div className="input-wrapper">
                                <span className="input-icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="2" y="4" width="20" height="16" rx="2" />
                                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                    </svg>
                                </span>
                                <input
                                    id="login-email"
                                    className="form-input"
                                    type="email"
                                    name="email"
                                    placeholder="example@email.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    autoComplete="email"
                                    required
                                />
                            </div>
                        </div>

                        {/* Mật khẩu */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="login-password">
                                パスワード
                            </label>
                            <div className="input-wrapper">
                                <span className="input-icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                </span>
                                <input
                                    id="login-password"
                                    className="form-input"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="current-password"
                                    required
                                />
                                {/* icon ẩn/hiện mật khẩu */}
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

                        {/* Khung hiển thị báo lỗi */}
                        {errorMsg && (
                            <p style={{ color: "#ef4444", fontSize: "14px", marginTop: "10px", marginBottom: "10px", textAlign: "center", fontWeight: 500 }}>
                                {errorMsg}
                            </p>
                        )}

                        {/* Nút Đăng nhập */}
                        <button type="submit" id="login-submit" className="login-submit-btn">
                            ログイン (Đăng nhập)
                        </button>
                    </form>

                    {/* Link Đăng ký */}
                    <p className="login-register-link">
                        アカウントをお持ちでないですか？{" "}
                        <Link to="/register" id="goto-register">アカウントを作成</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;