import { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordResetApi } from "../utils/authApi";
import { isValidEmail } from "../utils/formValidation";
import logo from "../assets/logo.png";
import "./UserAuth.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (val) => {
    const clean = val.trim();
    if (!clean) return "Please enter your email address.";
    if (!isValidEmail(clean)) return "Please enter a valid email address.";
    return "";
  };

  const handleBlur = () => {
    setTouched(true);
    setFieldError(validate(email));
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    setStatus({ type: "", message: "" });
    if (touched) {
      setFieldError(validate(val));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched(true);
    const err = validate(email);
    setFieldError(err);
    if (err) return;

    setIsSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      const response = await requestPasswordResetApi({ email: email.trim() });
      setStatus({
        type: "success",
        message: response?.message || "Password reset link sent! Please check your inbox.",
      });
      setEmail("");
      setTouched(false);
    } catch {
      setStatus({
        type: "success",
        message: "If an account exists with this email, a password reset link has been sent.",
      });
      setEmail("");
      setTouched(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEmailValid = touched && !fieldError && email.trim().length > 0;

  return (
    <div className="auth-viewport">
      <div className="auth-container">
        <div className="auth-brand-section">
          <Link to="/" className="auth-brand-logo">
            <img src={logo} alt="BookMyShow" />
          </Link>
          <h1 className="auth-title">Forgot Password</h1>
          <p className="auth-subtitle">Enter your registered email and we&apos;ll send you instructions to reset your password</p>
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
              <label htmlFor="forgot-email" className="form-label">
                Registered Email Address
              </label>
              <div className={`input-shell ${fieldError && touched ? "is-invalid" : ""} ${isEmailValid ? "is-valid" : ""}`}>
                <span className="input-prefix-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter your email address"
                  autoComplete="email"
                  className="form-control"
                />
                {isEmailValid && (
                  <span className="input-success-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#10b981" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </div>
              {fieldError && touched && <div className="form-error-msg">{fieldError}</div>}
            </div>

            <button
              type="submit"
              className="btn-primary-auth"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="btn-spinner-wrap">
                  <span className="auth-spinner"></span>
                  Sending reset link...
                </span>
              ) : (
                "Send Reset Instructions"
              )}
            </button>
          </form>

          <div className="auth-separator">
            <span>OR</span>
          </div>

          <div className="auth-social-buttons">
            <Link to="/otp-verification" className="btn-social-sso">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
              Verify with Mobile OTP
            </Link>
          </div>

          <div className="auth-footer-note">
            Remember your password?{" "}
            <Link to="/login" className="auth-accent-link">
              Sign In
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

export default ForgotPassword;
