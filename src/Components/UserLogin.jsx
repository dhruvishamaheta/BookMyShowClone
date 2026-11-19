import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  clearCurrentUser,
  getCurrentUser,
  loginUser,
  loginWithGoogle,
  sendRealMobileOtp,
  verifyRealMobileOtp,
} from "../utils/userStorage";
import {
  openGoogleOAuthPopup,
} from "../utils/googleAuth";
import { loginAdmin } from "../utils/adminAuth";
import { isValidEmail, isValidIndianMobile } from "../utils/formValidation";
import logo from "../assets/logo.png";
import "./UserAuth.css";

// Helper to ensure server errors never render ugly raw HTML
function formatErrorMessage(msg) {
  if (!msg) return "";
  const str = String(msg);
  if (str.includes("Cannot POST") || str.includes("<!DOCTYPE") || str.includes("<pre>")) {
    return "Backend server is not running or needs a restart. Please restart your backend terminal.";
  }
  return str.replace(/<[^>]*>?/gm, "").trim();
}

function UserLogin() {
  const navigate = useNavigate();

  // Login Mode Tab: "mobile" (OTP) | "password"
  const [loginMethod, setLoginMethod] = useState("mobile");

  // Mobile OTP States
  const [mobileNumber, setMobileNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(45);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Password Login States
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem("bms_remember_me") !== "false";
  });

  const [touched, setTouched] = useState({ identifier: false, password: false, mobile: false, otp: false });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [serverSuccess, setServerSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Google OAuth State
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const currentUser = getCurrentUser();

  // OTP Countdown timer
  useEffect(() => {
    let timerInterval = null;
    if (isOtpSent && otpTimer > 0) {
      timerInterval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      setCanResendOtp(true);
    }
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [isOtpSent, otpTimer]);

  // -------------------------------------------------------------
  // Real Mobile OTP Handlers
  // -------------------------------------------------------------
  const handleMobileNumberChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, "").slice(0, 10);
    setMobileNumber(rawVal);
    setServerError("");
    if (errors.mobile) {
      setErrors((prev) => ({ ...prev, mobile: "" }));
    }
  };

  const handleSendMobileOtp = async (e) => {
    if (e) e.preventDefault();
    setServerError("");
    setServerSuccess("");

    if (!isValidIndianMobile(mobileNumber)) {
      setErrors((prev) => ({ ...prev, mobile: "Please enter a valid 10-digit Indian mobile number." }));
      return;
    }

    setIsSendingOtp(true);

    try {
      const result = await sendRealMobileOtp({ mobile: mobileNumber });
      if (!result.success) {
        setServerError(formatErrorMessage(result.error || "Failed to dispatch SMS OTP. Please check your number."));
        setIsSendingOtp(false);
        return;
      }

      setIsOtpSent(true);
      setOtpTimer(45);
      setCanResendOtp(false);
      setServerSuccess(result.message || `Verification code sent to +91 ${mobileNumber} via SMS!`);
    } catch (err) {
      setServerError(formatErrorMessage(err.message || "Unable to connect to backend server. Please restart backend."));
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyMobileOtp = async (e) => {
    if (e) e.preventDefault();
    setServerError("");
    setServerSuccess("");

    const cleanOtp = otpCode.trim();
    if (!cleanOtp) {
      setErrors((prev) => ({ ...prev, otp: "Please enter the 6-digit OTP code received on your phone." }));
      return;
    }

    if (cleanOtp.length !== 6) {
      setErrors((prev) => ({ ...prev, otp: "OTP must be exactly 6 digits." }));
      return;
    }

    setIsVerifyingOtp(true);

    try {
      const result = await verifyRealMobileOtp({ mobile: mobileNumber, otp: cleanOtp });
      if (result.error) {
        setServerError(formatErrorMessage(result.error));
        setIsVerifyingOtp(false);
        return;
      }

      // Trigger profile update popup for mobile login
      sessionStorage.setItem("bms_show_profile_popup", "true");
      try {
        window.dispatchEvent(new CustomEvent("triggerProfileUpdateModal", { detail: result.user }));
      } catch {
        // ignore
      }

      setServerSuccess(result.message || `Welcome! Signed in successfully with +91 ${mobileNumber}`);
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 500);
    } catch (err) {
      setServerError(formatErrorMessage(err.message || "Failed to verify mobile OTP. Please try again."));
      setIsVerifyingOtp(false);
    }
  };

  const handleResetMobile = () => {
    setIsOtpSent(false);
    setOtpCode("");
    setServerError("");
    setServerSuccess("");
  };

  // -------------------------------------------------------------
  // Password Login Handlers
  // -------------------------------------------------------------
  const validateField = (name, value) => {
    let error = "";
    if (name === "identifier") {
      const clean = value.trim();
      if (!clean) {
        error = "Please enter your email, mobile number, or username.";
      } else if (clean.includes("@") && !isValidEmail(clean)) {
        error = "Please enter a valid email address.";
      } else if (/^\d+$/.test(clean) && !isValidIndianMobile(clean)) {
        error = "Mobile number must be a valid 10-digit number.";
      } else if (clean.length < 3) {
        error = "Username must be at least 3 characters.";
      }
    }

    if (name === "password") {
      if (!value) {
        error = "Please enter your password.";
      } else if (value.length < 4) {
        error = "Password must be at least 4 characters.";
      }
    }

    return error;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const val = field === "identifier" ? identifier : password;
    const err = validateField(field, val);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleIdentifierChange = (e) => {
    const val = e.target.value;
    setIdentifier(val);
    setServerError("");
    if (touched.identifier) {
      setErrors((prev) => ({ ...prev, identifier: validateField("identifier", val) }));
    }
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    setServerError("");
    if (touched.password) {
      setErrors((prev) => ({ ...prev, password: validateField("password", val) }));
    }
  };

  const validateAll = () => {
    const idErr = validateField("identifier", identifier);
    const passErr = validateField("password", password);
    const allErrors = { identifier: idErr, password: passErr };
    setErrors(allErrors);
    setTouched({ identifier: true, password: true });
    return !idErr && !passErr;
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    setServerError("");
    setServerSuccess("");

    if (!validateAll()) return;

    setIsSubmitting(true);
    localStorage.setItem("bms_remember_me", rememberMe ? "true" : "false");

    try {
      const cleanInput = identifier.trim();
      const cleanPassword = password.trim();

      // Check admin credentials
      const isPotentialAdmin =
        cleanInput.toLowerCase() === "admin" ||
        cleanInput.toLowerCase() === "admin@example.com" ||
        cleanInput.toLowerCase() === "admin@bookmyshow.com";

      if (isPotentialAdmin) {
        const adminResult = await loginAdmin({
          username: cleanInput,
          password: cleanPassword,
        });

        if (adminResult?.success) {
          setServerSuccess("Admin access authorized! Opening Admin Portal...");
          setTimeout(() => {
            navigate("/admin", { replace: true });
          }, 500);
          return;
        }
      }

      // Standard user login
      const result = await loginUser({
        username: cleanInput,
        email: cleanInput,
        password: cleanPassword,
      });

      if (result.error) {
        const adminResult = await loginAdmin({
          username: cleanInput,
          password: cleanPassword,
        });

        if (adminResult?.success) {
          setServerSuccess("Admin access authorized! Opening Admin Portal...");
          setTimeout(() => {
            navigate("/admin", { replace: true });
          }, 500);
          return;
        }

        setServerError(formatErrorMessage(result.error));
        return;
      }

      setServerSuccess(result.message || "Signed in successfully! A welcome confirmation email has been sent to your email.");
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 800);
    } catch (err) {
      setServerError(formatErrorMessage(err.message || "Unable to connect. Please check your network and try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // Google Login Handlers
  // -------------------------------------------------------------
  const handleRealGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setServerError("");
    setServerSuccess("");

    try {
      await openGoogleOAuthPopup({
        onSuccess: (result) => {
          setServerSuccess(
            result.message || `Welcome back, ${result.user?.name || "User"}! A welcome email has been sent to your inbox.`
          );
          setTimeout(() => {
            navigate("/", { replace: true });
          }, 800);
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

  const isIdentifierValid = touched.identifier && !errors.identifier && identifier.trim().length > 0;
  const isPasswordValid = touched.password && !errors.password && password.length >= 4;

  return (
    <div className="auth-viewport">
      <div className="auth-container">
        {/* Brand Bar */}
        <div className="auth-brand-section">
          <Link to="/" className="auth-brand-logo">
            <img src={logo} alt="BookMyShow" />
          </Link>
          <h1 className="auth-title">Get Started</h1>
          <p className="auth-subtitle">Sign in to book movies, concerts, sports & events</p>
        </div>

        {/* Tab Navigation (Sign In / Register) */}
        <div className="auth-tabs-wrap">
          <button type="button" className="auth-tab-btn active">
            Sign In
          </button>
          <button
            type="button"
            className="auth-tab-btn"
            onClick={() => navigate("/signup")}
          >
            Register
          </button>
        </div>

        {/* Main Card */}
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

          {/* Feedback Toasts */}
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

          {/* Login Method Sub-Tabs (Mobile Number / Password) */}
          <div className="auth-tabs-wrap login-subtabs">
            <button
              type="button"
              className={`auth-tab-btn ${loginMethod === "mobile" ? "active" : ""}`}
              onClick={() => {
                setLoginMethod("mobile");
                setServerError("");
              }}
            >
              📱 Mobile Number
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${loginMethod === "password" ? "active" : ""}`}
              onClick={() => {
                setLoginMethod("password");
                setServerError("");
              }}
            >
              🔑 Password Login
            </button>
          </div>

          {/* ========================================================= */}
          {/* TAB 1: REAL MOBILE NUMBER OTP LOGIN                       */}
          {/* ========================================================= */}
          {loginMethod === "mobile" && (
            <div className="mobile-login-section">
              {!isOtpSent ? (
                <form onSubmit={handleSendMobileOtp} noValidate className="auth-form-body">
                  <div className="form-group">
                    <label htmlFor="mobile-input" className="form-label">
                      Mobile Number <span className="label-req">*</span>
                    </label>
                    <div className={`input-shell is-phone-input ${errors.mobile ? "is-invalid" : ""}`}>
                      <span className="phone-country-tag">🇮🇳 +91</span>
                      <input
                        id="mobile-input"
                        type="tel"
                        maxLength={10}
                        value={mobileNumber}
                        onChange={handleMobileNumberChange}
                        placeholder="Enter 10-digit mobile number"
                        autoComplete="tel-national"
                        className="form-control"
                        autoFocus
                      />
                    </div>
                    {errors.mobile && <div className="form-error-msg">{errors.mobile}</div>}
                    <div className="form-input-helper-note">
                      We'll send a 6-digit SMS OTP code to verify your mobile phone.
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary-auth"
                    disabled={isSendingOtp || mobileNumber.length !== 10}
                  >
                    {isSendingOtp ? (
                      <span className="btn-spinner-wrap">
                        <span className="auth-spinner"></span>
                        Sending SMS OTP...
                      </span>
                    ) : (
                      "Continue"
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyMobileOtp} noValidate className="auth-form-body">
                  <div className="otp-target-header">
                    <div className="otp-target-info">
                      <span>SMS OTP sent to</span>
                      <strong>+91 {mobileNumber}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetMobile}
                      className="otp-edit-mobile-btn"
                    >
                      Edit Number
                    </button>
                  </div>

                  <div className="form-group">
                    <div className="form-label-row">
                      <label htmlFor="otp-input" className="form-label">
                        Enter 6-Digit OTP <span className="label-req">*</span>
                      </label>
                      <span style={{ fontSize: "11.5px", color: "#64748b" }}>
                        Check Phone SMS
                      </span>
                    </div>

                    <div className={`input-shell ${errors.otp ? "is-invalid" : ""}`}>
                      <span className="input-prefix-icon">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </span>
                      <input
                        id="otp-input"
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                          setOtpCode(val);
                          setErrors((prev) => ({ ...prev, otp: "" }));
                        }}
                        placeholder="• • • • • •"
                        className="form-control otp-form-control"
                        autoFocus
                      />
                    </div>
                    {errors.otp && <div className="form-error-msg">{errors.otp}</div>}
                    <div className="form-input-helper-note">
                      Enter the 6-digit code received on your mobile phone via SMS.
                    </div>
                  </div>

                  {/* Resend Timer */}
                  <div className="otp-resend-row">
                    {canResendOtp ? (
                      <button
                        type="button"
                        onClick={handleSendMobileOtp}
                        className="otp-resend-active-btn"
                      >
                        Resend SMS OTP
                      </button>
                    ) : (
                      <span className="otp-timer-text">
                        Resend OTP in <strong>00:{otpTimer < 10 ? `0${otpTimer}` : otpTimer}</strong>
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn-primary-auth"
                    disabled={isVerifyingOtp || otpCode.length !== 6}
                  >
                    {isVerifyingOtp ? (
                      <span className="btn-spinner-wrap">
                        <span className="auth-spinner"></span>
                        Verifying & Signing In...
                      </span>
                    ) : (
                      "Verify & Sign In"
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: PASSWORD LOGIN                                     */}
          {/* ========================================================= */}
          {loginMethod === "password" && (
            <form onSubmit={handleSubmitPassword} noValidate className="auth-form-body">
              {/* Email / Mobile / Username */}
              <div className="form-group">
                <label htmlFor="login-identifier" className="form-label">
                  Email, Mobile or Username
                </label>
                <div className={`input-shell ${errors.identifier && touched.identifier ? "is-invalid" : ""} ${isIdentifierValid ? "is-valid" : ""}`}>
                  <span className="input-prefix-icon">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    id="login-identifier"
                    type="text"
                    value={identifier}
                    onChange={handleIdentifierChange}
                    onBlur={() => handleBlur("identifier")}
                    placeholder="Enter email, username or mobile"
                    autoComplete="username"
                    className="form-control"
                  />
                  {isIdentifierValid && (
                    <span className="input-success-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#10b981" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  )}
                </div>
                {errors.identifier && touched.identifier && (
                  <div className="form-error-msg">{errors.identifier}</div>
                )}
              </div>

              {/* Password */}
              <div className="form-group">
                <div className="form-label-row">
                  <label htmlFor="login-password" className="form-label">
                    Password
                  </label>
                  <Link to="/forgot-password" tabIndex={3} className="form-forgot-link">
                    Forgot Password?
                  </Link>
                </div>
                <div className={`input-shell ${errors.password && touched.password ? "is-invalid" : ""} ${isPasswordValid ? "is-valid" : ""}`}>
                  <span className="input-prefix-icon">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePasswordChange}
                    onBlur={() => handleBlur("password")}
                    placeholder="Enter your password"
                    autoComplete="current-password"
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
                {errors.password && touched.password && (
                  <div className="form-error-msg">{errors.password}</div>
                )}
              </div>

              {/* Remember Me */}
              <div className="form-options-row">
                <label className="form-check-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
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
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          )}

          {/* ========================================================= */}
          {/* BOTTOM SECTION: GOOGLE LOGIN                              */}
          {/* ========================================================= */}
          <div className="auth-separator">
            <span>OR CONTINUE WITH</span>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            className="btn-google-login"
            onClick={handleRealGoogleLogin}
            disabled={isSubmitting || isGoogleLoading || isVerifyingOtp}
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
              {isGoogleLoading ? "Connecting to Google..." : "Continue with Google"}
            </span>
          </button>

          <div className="auth-terms-disclaimer">
            I agree to the <Link to="/terms">Terms & Conditions</Link> & <Link to="/privacy">Privacy Policy</Link>
          </div>

          <div className="auth-footer-note">
            New to BookMyShow?{" "}
            <Link to="/signup" className="auth-accent-link">
              Create an account
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

export default UserLogin;
