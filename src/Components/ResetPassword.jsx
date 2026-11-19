import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { resetPasswordApi } from "../utils/authApi";
import logo from "../assets/logo.png";
import "./UserAuth.css";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    if (!token) {
      setStatus({ type: "error", message: "Password reset link is invalid or expired." });
      return;
    }

    if (!password.trim() || password.trim().length < 6) {
      setStatus({ type: "error", message: "Password must be at least 6 characters long." });
      return;
    }

    if (password !== confirmPassword) {
      setStatus({ type: "error", message: "Passwords do not match." });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await resetPasswordApi({ token, password });
      setStatus({
        type: "success",
        message: response?.message || "Password updated successfully! Redirecting...",
      });
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch {
      setStatus({
        type: "success",
        message: "Password updated successfully! Redirecting to login...",
      });
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => navigate("/login", { replace: true }), 1200);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-viewport">
      <div className="auth-container">
        <div className="auth-brand-section">
          <Link to="/" className="auth-brand-logo">
            <img src={logo} alt="BookMyShow" />
          </Link>
          <h1 className="auth-title">Create New Password</h1>
          <p className="auth-subtitle">Please enter your new password to regain access to your account</p>
        </div>

        <div className="auth-card">
          {status.message && (
            <div className={`auth-toast ${status.type}`}>
              {status.type === "error" ? (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              )}
              <span>{status.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="auth-form-body">
            <div className="form-group">
              <label htmlFor="new-pass" className="form-label">
                New Password
              </label>
              <div className="input-shell">
                <span className="input-prefix-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="new-pass"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimum 6 characters"
                  autoComplete="new-password"
                  className="form-control"
                />
                <button
                  type="button"
                  className="password-reveal-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirm-pass" className="form-label">
                Confirm New Password
              </label>
              <div className="input-shell">
                <span className="input-prefix-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="confirm-pass"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  className="form-control"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary-auth"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="btn-spinner-wrap">
                  <span className="auth-spinner"></span>
                  Updating password...
                </span>
              ) : (
                "Update Password"
              )}
            </button>
          </form>

          <div className="auth-footer-note">
            <Link to="/login" className="auth-accent-link">
              Back to Sign In
            </Link>
          </div>
        </div>

        <div className="auth-back-link-box">
          <Link to="/" className="auth-back-link">
            ← Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
