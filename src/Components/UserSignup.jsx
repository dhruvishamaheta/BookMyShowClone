import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  clearCurrentUser,
  getCurrentUser,
  registerUser,
  loginWithGoogle,
} from "../utils/userStorage";
import {
  initializeGoogleSignIn,
  openGoogleOAuthPopup,
} from "../utils/googleAuth";
import {
  evaluatePasswordStrength,
  isValidEmail,
  isValidIndianMobile,
  isValidName,
} from "../utils/formValidation";
import logo from "../assets/logo.png";
import "./UserAuth.css";

function UserSignup() {
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    gender: "Female",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    mobile: false,
    password: false,
    confirmPassword: false,
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [serverSuccess, setServerSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Google OAuth state
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const currentUser = getCurrentUser();

  // Initialize official Google Identity Services button on mount
  useEffect(() => {
    let isMounted = true;

    const setupGoogleGsi = async () => {
      if (!googleButtonRef.current) return;
      try {
        await initializeGoogleSignIn({
          containerElement: googleButtonRef.current,
          onSuccess: (result) => {
            if (!isMounted) return;
            setServerSuccess(result.message || `Welcome, ${result.user?.name || "User"}! Account created with Google. A welcome email has been sent to your inbox.`);
            setTimeout(() => {
              navigate("/", { replace: true });
            }, 1200);
          },
          onError: (err) => {
            if (!isMounted) return;
            console.warn("Google GSI button notice:", err?.message);
          },
        });
      } catch (err) {
        console.warn("Could not auto-render Google GSI button:", err);
      }
    };

    setupGoogleGsi();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleRealGoogleSignup = async () => {
    setIsGoogleLoading(true);
    setServerError("");
    setServerSuccess("");

    try {
      await openGoogleOAuthPopup({
        onSuccess: (result) => {
          setServerSuccess(
            result.message || `Welcome, ${result.user?.name || "User"}! Signed up successfully with Google. A welcome email has been sent to your inbox.`
          );
          setTimeout(() => {
            navigate("/", { replace: true });
          }, 1200);
        },
        onError: (err) => {
          console.error("Google OAuth error:", err);
          const msg = err?.message || "";
          if (msg.includes("popup_closed_by_user") || msg.includes("access_denied")) {
            setServerError("Google sign-in was cancelled.");
          } else {
            setServerError(
              "Google sign-in encountered an issue. Please verify your Google account and try again."
            );
          }
        },
      });
    } catch (err) {
      console.error("Google popup error:", err);
      setServerError("Unable to open Google sign-in window. Please check your popup blocker.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const validateField = (name, value, currentForm = form) => {
    let error = "";
    const clean = (value || "").trim();

    if (name === "name") {
      if (!clean) {
        error = "Full name is required.";
      } else if (!isValidName(clean)) {
        error = "Please enter a valid name (at least 2 letters, alphabets only).";
      }
    }

    if (name === "email") {
      if (!clean) {
        error = "Email address is required.";
      } else if (!isValidEmail(clean)) {
        error = "Please enter a valid email address.";
      }
    }

    if (name === "mobile") {
      if (!clean) {
        error = "Mobile number is required.";
      } else if (!isValidIndianMobile(clean)) {
        error = "Please enter a valid 10-digit mobile number.";
      }
    }

    if (name === "password") {
      if (!value) {
        error = "Password is required.";
      } else if (value.length < 6) {
        error = "Password must be at least 6 characters long.";
      }
    }

    if (name === "confirmPassword") {
      if (!value) {
        error = "Please confirm your password.";
      } else if (value !== currentForm.password) {
        error = "Passwords do not match.";
      }
    }

    return error;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, form[field], form);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleChange = (field) => (e) => {
    let val = e.target.value;
    if (field === "mobile") {
      val = val.replace(/\D/g, "").slice(0, 10);
    }

    const updatedForm = { ...form, [field]: val };
    setForm(updatedForm);
    setServerError("");

    if (touched[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: validateField(field, val, updatedForm),
      }));
    }

    if (field === "password" && touched.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: validateField("confirmPassword", form.confirmPassword, updatedForm),
      }));
    }
  };

  const validateAll = () => {
    const newErrors = {};
    Object.keys(form).forEach((key) => {
      const err = validateField(key, form[key], form);
      if (err) newErrors[key] = err;
    });

    if (!agreeTerms) {
      newErrors.terms = "You must accept the Terms of Service to continue.";
    }

    setErrors(newErrors);
    setTouched({
      name: true,
      email: true,
      mobile: true,
      password: true,
      confirmPassword: true,
    });

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setServerSuccess("");

    if (!validateAll()) return;

    setIsSubmitting(true);

    try {
      const usernameGenerated =
        form.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "") + Math.floor(100 + Math.random() * 900);

      const result = await registerUser({
        name: form.name.trim(),
        username: usernameGenerated,
        email: form.email.trim().toLowerCase(),
        mobile: form.mobile.trim(),
        gender: form.gender,
        password: form.password,
      });

      if (result.error) {
        setServerError(result.error);
        return;
      }

      setServerSuccess(
        result.message || "Account created successfully! A welcome email has been sent to your inbox."
      );
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 1200);
    } catch {
      setServerError("Unable to complete registration. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordStrength = evaluatePasswordStrength(form.password);

  const isFieldValid = (field) => {
    return touched[field] && !errors[field] && form[field] && form[field].length > 0;
  };

  return (
    <div className="auth-viewport">
      <div className="auth-container signup-width">
        {/* Brand Bar */}
        <div className="auth-brand-section">
          <Link to="/" className="auth-brand-logo">
            <img src={logo} alt="BookMyShow" />
          </Link>
          <h1 className="auth-title">Create an Account</h1>
          <p className="auth-subtitle">Unlock personalized recommendations, discounts & easy ticket booking</p>
        </div>

        {/* Tab Navigation */}
        <div className="auth-tabs-wrap">
          <button
            type="button"
            className="auth-tab-btn"
            onClick={() => navigate("/login")}
          >
            Sign In
          </button>
          <button type="button" className="auth-tab-btn active">
            Register
          </button>
        </div>

        {/* Form Card */}
        <div className="auth-card">
          {currentUser && (
            <div className="auth-session-banner">
              <div>
                <span className="session-label">Currently logged in as</span>
                <strong className="session-name">
                  {currentUser.name || currentUser.username || currentUser.email}
                </strong>
              </div>
              <div className="session-actions">
                <button
                  type="button"
                  onClick={() => {
                    clearCurrentUser();
                    window.location.reload();
                  }}
                  className="session-switch-btn"
                >
                  Switch
                </button>
                <Link to="/" className="session-home-btn">
                  Continue →
                </Link>
              </div>
            </div>
          )}

          {serverError && (
            <div className="auth-toast error">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{serverError}</span>
            </div>
          )}

          {serverSuccess && (
            <div className="auth-toast success">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>{serverSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="auth-form-body">
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="reg-name" className="form-label">
                Full Name <span className="label-req">*</span>
              </label>
              <div className={`input-shell ${errors.name && touched.name ? "is-invalid" : ""} ${isFieldValid("name") ? "is-valid" : ""}`}>
                <span className="input-prefix-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  id="reg-name"
                  type="text"
                  value={form.name}
                  onChange={handleChange("name")}
                  onBlur={() => handleBlur("name")}
                  placeholder="e.g. John Doe"
                  autoComplete="name"
                  className="form-control"
                />
                {isFieldValid("name") && (
                  <span className="input-success-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#10b981" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </div>
              {errors.name && touched.name && <div className="form-error-msg">{errors.name}</div>}
            </div>

            {/* Email Address */}
            <div className="form-group">
              <label htmlFor="reg-email" className="form-label">
                Email Address <span className="label-req">*</span>
              </label>
              <div className={`input-shell ${errors.email && touched.email ? "is-invalid" : ""} ${isFieldValid("email") ? "is-valid" : ""}`}>
                <span className="input-prefix-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input
                  id="reg-email"
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  onBlur={() => handleBlur("email")}
                  placeholder="john.doe@example.com"
                  autoComplete="email"
                  className="form-control"
                />
                {isFieldValid("email") && (
                  <span className="input-success-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#10b981" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </div>
              {errors.email && touched.email && <div className="form-error-msg">{errors.email}</div>}
            </div>

            {/* Mobile Number */}
            <div className="form-group">
              <label htmlFor="reg-mobile" className="form-label">
                Mobile Number <span className="label-req">*</span>
              </label>
              <div className={`input-shell is-phone-input ${errors.mobile && touched.mobile ? "is-invalid" : ""} ${isFieldValid("mobile") ? "is-valid" : ""}`}>
                <span className="phone-country-tag">🇮🇳 +91</span>
                <input
                  id="reg-mobile"
                  type="tel"
                  maxLength={10}
                  value={form.mobile}
                  onChange={handleChange("mobile")}
                  onBlur={() => handleBlur("mobile")}
                  placeholder="9876543210"
                  autoComplete="tel-national"
                  className="form-control"
                />
                {isFieldValid("mobile") && (
                  <span className="input-success-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#10b981" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </div>
              {errors.mobile && touched.mobile && <div className="form-error-msg">{errors.mobile}</div>}
            </div>

            {/* Gender Selection */}
            <div className="form-group">
              <label className="form-label">Gender (Optional)</label>
              <div className="gender-selector-row">
                {["Female", "Male", "Other"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    className={`gender-chip ${form.gender === g ? "selected" : ""}`}
                    onClick={() => setForm((prev) => ({ ...prev, gender: g }))}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="reg-password" className="form-label">
                Password <span className="label-req">*</span>
              </label>
              <div className={`input-shell ${errors.password && touched.password ? "is-invalid" : ""} ${isFieldValid("password") ? "is-valid" : ""}`}>
                <span className="input-prefix-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange("password")}
                  onBlur={() => handleBlur("password")}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  className="form-control"
                />
                <button
                  type="button"
                  className="password-reveal-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
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

              {form.password && (
                <div className="password-meter-wrap">
                  <div className="password-meter-bar">
                    <div
                      className="password-meter-progress"
                      style={{
                        width: `${(passwordStrength.score / 5) * 100}%`,
                        backgroundColor: passwordStrength.color,
                      }}
                    />
                  </div>
                  <span
                    className="password-meter-label"
                    style={{ color: passwordStrength.color }}
                  >
                    Strength: {passwordStrength.label}
                  </span>
                </div>
              )}

              {errors.password && touched.password && (
                <div className="form-error-msg">{errors.password}</div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="reg-confirm-password" className="form-label">
                Confirm Password <span className="label-req">*</span>
              </label>
              <div className={`input-shell ${errors.confirmPassword && touched.confirmPassword ? "is-invalid" : ""} ${isFieldValid("confirmPassword") ? "is-valid" : ""}`}>
                <span className="input-prefix-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </span>
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={handleChange("confirmPassword")}
                  onBlur={() => handleBlur("confirmPassword")}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  className="form-control"
                />
                <button
                  type="button"
                  className="password-reveal-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
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
              {errors.confirmPassword && touched.confirmPassword && (
                <div className="form-error-msg">{errors.confirmPassword}</div>
              )}
            </div>

            {/* Terms checkbox */}
            <div className="form-options-row">
              <label className="form-check-label">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => {
                    setAgreeTerms(e.target.checked);
                    if (errors.terms) setErrors((prev) => ({ ...prev, terms: undefined }));
                  }}
                />
                <span>
                  I agree to the <a href="#terms" onClick={(e) => e.preventDefault()}>Terms of Service</a> & <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
                </span>
              </label>
              {errors.terms && <div className="form-error-msg">{errors.terms}</div>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-primary-auth"
              disabled={isSubmitting || isGoogleLoading}
            >
              {isSubmitting ? (
                <span className="btn-spinner-wrap">
                  <span className="auth-spinner"></span>
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Social / Quick Login Separator */}
          <div className="auth-separator">
            <span>OR CONTINUE WITH</span>
          </div>

          {/* Real Google GSI Button Mount Area */}
          <div className="google-official-btn-wrap">
            <div
              id="google-signup-btn-box"
              ref={googleButtonRef}
              style={{ width: "100%", display: "flex", justifyContent: "center" }}
            />
          </div>

          {/* Direct Google OAuth Popup Button */}
          <button
            type="button"
            className="btn-google-login"
            onClick={handleRealGoogleSignup}
            disabled={isSubmitting || isGoogleLoading}
          >
            <svg className="google-icon-svg" viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>
              {isGoogleLoading ? "Connecting to Google..." : "Sign up with Google"}
            </span>
          </button>

          <div className="auth-footer-note">
            Already have an account?{" "}
            <Link to="/login" className="auth-accent-link">
              Sign In
            </Link>
          </div>
        </div>

        {/* Back navigation */}
        <div className="auth-back-link-box">
          <Link to="/" className="auth-back-link">
            ← Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

export default UserSignup;
