import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAdminAuthenticated, loginAdmin } from "../../utils/adminAuth";
import "./AdminStyles.css";

function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAdminAuthenticated()) {
      navigate("/admin");
    }
  }, [navigate]);

  const validate = () => {
    const errs = {};
    if (!username.trim()) {
      errs.username = "Username or Admin Email is required.";
    } else if (username.trim().length < 3) {
      errs.username = "Username must be at least 3 characters.";
    }

    if (!password) {
      errs.password = "Password is required.";
    } else if (password.length < 4) {
      errs.password = "Password must be at least 4 characters.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setGlobalError("");

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const result = await loginAdmin({ username, password });
      if (result?.success) {
        navigate("/admin");
        return;
      }
      setGlobalError(result?.message || "Invalid credentials. Please try again.");
    } catch {
      setGlobalError("Connection issue. Please verify your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-header">
          <div className="admin-brand-text" style={{ marginBottom: "8px" }}>
            <strong style={{ fontSize: "26px", color: "var(--admin-red-primary)" }}>BookMyShow</strong>
          </div>
          <h1>Admin Portal</h1>
          <p>Sign in to manage movies, events, users, and bookings</p>
        </div>

        {globalError && (
          <div className="admin-form-error-banner" style={{ marginBottom: "18px" }}>
            <span>{globalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-form" noValidate>
          <div className="admin-form-group">
            <label className="admin-label" htmlFor="admin-username">
              Username or Email <span className="admin-required-star">*</span>
            </label>
            <input
              id="admin-username"
              type="text"
              className={`admin-input ${errors.username ? "has-error" : ""}`}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (errors.username) setErrors({ ...errors, username: "" });
              }}
              placeholder="Enter username or admin email"
              autoComplete="username"
            />
            {errors.username && (
              <span className="admin-field-error">{errors.username}</span>
            )}
          </div>

          <div className="admin-form-group">
            <label className="admin-label" htmlFor="admin-password">
              Password <span className="admin-required-star">*</span>
            </label>
            <div className="admin-password-wrapper">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                className={`admin-input ${errors.password ? "has-error" : ""}`}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: "" });
                }}
                placeholder="Enter admin password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="admin-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <span className="admin-field-error">{errors.password}</span>
            )}
          </div>

          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            style={{ width: "100%", padding: "12px", marginTop: "6px" }}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing In..." : "Sign In to Admin Portal"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
