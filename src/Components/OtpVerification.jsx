import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sendRealMobileOtp, verifyRealMobileOtp } from "../utils/userStorage";
import { sendOtpApi, verifyOtpApi } from "../utils/authApi";
import { isValidEmail } from "../utils/formValidation";
import logo from "../assets/logo.png";
import "./UserAuth.css";

function OtpVerification() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(45);
  const [canResend, setCanResend] = useState(false);
  const resendAllowed = canResend || timer === 0;

  // Countdown timer
  useEffect(() => {
    let interval = null;
    if (otpSent && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpSent, timer]);

  const isMobileInput = (val) => /^\d{10}$/.test(val.replace(/\D/g, ""));

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const clean = identifier.trim();
    if (!clean) {
      setStatus({ type: "error", message: "Please enter your 10-digit mobile number or email address." });
      return;
    }

    const cleanMobile = clean.replace(/\D/g, "");
    const isMobile = isMobileInput(cleanMobile);

    if (!isMobile && !isValidEmail(clean)) {
      setStatus({ type: "error", message: "Please enter a valid 10-digit Indian mobile number or valid email." });
      return;
    }

    setIsSending(true);
    setStatus({ type: "", message: "" });

    try {
      if (isMobile) {
        const result = await sendRealMobileOtp({ mobile: cleanMobile });
        if (result.success) {
          setStatus({
            type: "success",
            message: result.message || `Verification code sent to +91 ${cleanMobile} via SMS.`,
          });
          setOtpSent(true);
          setTimer(45);
          setCanResend(false);
        } else {
          setStatus({
            type: "error",
            message: result.error || "Failed to send OTP SMS. Please check your number.",
          });
        }
      } else {
        const response = await sendOtpApi({ email: clean });
        setStatus({
          type: "success",
          message: response?.message || "Verification code sent to your email address.",
        });
        setOtpSent(true);
        setTimer(45);
        setCanResend(false);
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: error?.message || "Unable to send OTP. Please try again.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    const cleanInput = identifier.trim();
    const cleanOtp = otp.trim();

    if (!cleanInput || !cleanOtp) {
      setStatus({ type: "error", message: "Both contact number/email and 6-digit OTP are required." });
      return;
    }

    if (cleanOtp.length !== 6) {
      setStatus({ type: "error", message: "OTP must be exactly 6 digits." });
      return;
    }

    setIsVerifying(true);
    setStatus({ type: "", message: "" });

    const cleanMobile = cleanInput.replace(/\D/g, "");
    const isMobile = isMobileInput(cleanMobile);

    try {
      if (isMobile) {
        const result = await verifyRealMobileOtp({ mobile: cleanMobile, otp: cleanOtp });
        if (result.error) {
          setStatus({ type: "error", message: result.error });
          setIsVerifying(false);
          return;
        }

        // Trigger profile update popup for mobile login
        sessionStorage.setItem("bms_show_profile_popup", "true");
        try {
          window.dispatchEvent(new CustomEvent("triggerProfileUpdateModal", { detail: result.user }));
        } catch {
          // ignore
        }

        setStatus({
          type: "success",
          message: result.message || `Welcome! Signed in successfully with +91 ${cleanMobile}`,
        });
        setOtp("");
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 600);
      } else {
        await verifyOtpApi({ email: cleanInput, otp: cleanOtp });
        setStatus({
          type: "success",
          message: "Email verified successfully! Redirecting...",
        });
        setOtp("");
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 600);
      }
    } catch {
      setStatus({
        type: "error",
        message: "Invalid OTP code. Please enter the 6-digit code received on your phone.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="auth-viewport">
      <div className="auth-container">
        <div className="auth-brand-section">
          <Link to="/" className="auth-brand-logo">
            <img src={logo} alt="BookMyShow" />
          </Link>
          <h1 className="auth-title">Mobile OTP Verification</h1>
          <p className="auth-subtitle">Sign in instantly via one-time SMS password on your phone</p>
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

          {!otpSent ? (
            <form onSubmit={handleSendOtp} noValidate className="auth-form-body">
              <div className="form-group">
                <label htmlFor="otp-identifier" className="form-label">
                  Mobile Number or Email <span className="label-req">*</span>
                </label>
                <div className="input-shell is-phone-input">
                  <span className="phone-country-tag">🇮🇳 +91</span>
                  <input
                    id="otp-identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setStatus({ type: "", message: "" });
                    }}
                    placeholder="Enter 10-digit mobile number"
                    className="form-control"
                    autoFocus
                  />
                </div>
                <div className="form-input-helper-note">
                  We'll send a 6-digit SMS verification code to your mobile phone.
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary-auth"
                disabled={isSending || !identifier.trim()}
              >
                {isSending ? (
                  <span className="btn-spinner-wrap">
                    <span className="auth-spinner"></span>
                    Sending OTP...
                  </span>
                ) : (
                  "Send Verification OTP"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} noValidate className="auth-form-body">
              <div className="otp-target-header">
                <div className="otp-target-info">
                  <span>OTP code sent to</span>
                  <strong>{identifier}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                    setStatus({ type: "", message: "" });
                  }}
                  className="otp-edit-mobile-btn"
                >
                  Edit
                </button>
              </div>

              <div className="form-group">
                <div className="form-label-row">
                  <label htmlFor="otp-box" className="form-label">
                    Enter 6-Digit OTP <span className="label-req">*</span>
                  </label>
                  <span style={{ fontSize: "11.5px", color: "#64748b" }}>
                    Check Phone SMS
                  </span>
                </div>
                <div className="input-shell">
                  <span className="input-prefix-icon">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="otp-box"
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                      setStatus({ type: "", message: "" });
                    }}
                    placeholder="• • • • • •"
                    className="form-control otp-form-control"
                    autoFocus
                  />
                </div>
              </div>

              {/* Resend Timer */}
              <div className="otp-resend-row">
                {resendAllowed ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="otp-resend-active-btn"
                  >
                    Resend OTP Code
                  </button>
                ) : (
                  <span className="otp-timer-text">
                    Resend OTP in <strong>00:{timer < 10 ? `0${timer}` : timer}</strong>
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="btn-primary-auth"
                disabled={isVerifying || otp.length !== 6}
              >
                {isVerifying ? (
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

          <div className="auth-footer-note">
            Back to{" "}
            <Link to="/login" className="auth-accent-link">
              Sign In
            </Link>{" "}
            or{" "}
            <Link to="/signup" className="auth-accent-link">
              Register
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

export default OtpVerification;
