/**
 * BookMyShow Form Validation Utilities
 * Production-ready validation functions with realistic regex & sanitization.
 */

// Email regex according to HTML5 and standard web RFC rules
export const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email.trim());
};

// Indian standard mobile number validation (10 digits starting with 6-9)
export const isValidIndianMobile = (mobile) => {
  if (!mobile || typeof mobile !== "string") return false;
  const cleaned = mobile.replace(/\D/g, "");
  return /^[6-9]\d{9}$/.test(cleaned);
};

// Name validation: 2 to 50 characters, only letters, spaces, and hyphens/dots
export const isValidName = (name) => {
  if (!name || typeof name !== "string") return false;
  const trimmed = name.trim();
  return trimmed.length >= 2 && /^[a-zA-Z\s.'-]+$/.test(trimmed);
};

// Password strength evaluator (returns score 0-4 and label)
export const evaluatePasswordStrength = (password) => {
  if (!password) return { score: 0, label: "", color: "#e2e8f0" };

  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 0.5;
  if (/[^A-Za-z0-9]/.test(password)) score += 0.5;

  const finalScore = Math.min(4, Math.floor(score));

  switch (finalScore) {
    case 1:
      return { score: 1, label: "Weak", color: "#ef4444" };
    case 2:
      return { score: 2, label: "Fair", color: "#f59e0b" };
    case 3:
      return { score: 3, label: "Good", color: "#3b82f6" };
    case 4:
      return { score: 4, label: "Strong", color: "#10b981" };
    default:
      return { score: 0, label: "Too Short", color: "#ef4444" };
  }
};
