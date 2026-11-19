/**
 * Real Google Authentication Service using Google Identity Services (GSI)
 * Official Google SDK documentation: https://developers.google.com/identity/gsi/web
 */

import { loginWithGoogle } from "./userStorage";

export const DEFAULT_GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "1084887349940-u7f6i8h1l4km2ndsk5k8c80h7e8m249p.apps.googleusercontent.com";

const STORAGE_CLIENT_ID_KEY = "bms_custom_google_client_id";

/**
 * Get current Google Client ID from env, localStorage or default
 */
export function getGoogleClientId() {
  if (typeof window !== "undefined") {
    const custom = localStorage.getItem(STORAGE_CLIENT_ID_KEY);
    if (custom && custom.trim().length > 10) return custom.trim();
  }
  return (
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    DEFAULT_GOOGLE_CLIENT_ID
  );
}

/**
 * Save user custom Google Client ID
 */
export function setGoogleClientId(clientId) {
  if (typeof window !== "undefined") {
    if (!clientId) {
      localStorage.removeItem(STORAGE_CLIENT_ID_KEY);
    } else {
      localStorage.setItem(STORAGE_CLIENT_ID_KEY, clientId.trim());
    }
  }
}

/**
 * Decode JWT credential returned by Google Identity Services
 */
export function decodeGoogleJwt(token) {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to parse Google JWT credential:", error);
    return null;
  }
}

/**
 * Ensure Google Identity Services script is loaded in document
 */
export function loadGoogleGsiScript() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("No window"));
    if (window.google?.accounts?.id) {
      return resolve(window.google);
    }

    const existingScript = document.getElementById("google-gsi-client");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.google));
      existingScript.addEventListener("error", (e) => reject(e));
      return;
    }

    const script = document.createElement("script");
    script.id = "google-gsi-client";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      resolve(window.google);
    };
    script.onerror = (err) => {
      reject(err);
    };
    document.head.appendChild(script);
  });
}

/**
 * Initialize Google Identity Services on a button container
 */
export async function initializeGoogleSignIn({
  containerElement,
  onSuccess,
  onError,
  clientId = getGoogleClientId(),
}) {
  try {
    const google = await loadGoogleGsiScript();

    if (!google || !google.accounts || !google.accounts.id) {
      throw new Error("Google Identity Services failed to load.");
    }

    google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        if (!response?.credential) {
          if (onError) onError(new Error("No credential received from Google."));
          return;
        }

        const decoded = decodeGoogleJwt(response.credential);
        if (!decoded || !decoded.email) {
          if (onError) onError(new Error("Could not decode Google user profile."));
          return;
        }

        try {
          const authResult = await loginWithGoogle({
            name: decoded.name || decoded.given_name || decoded.email.split("@")[0],
            email: decoded.email,
            avatar: decoded.picture || "",
            googleId: decoded.sub || `gid-${Date.now()}`,
          });

          if (onSuccess) {
            onSuccess({
              user: authResult.user,
              rawGoogleProfile: decoded,
              message: authResult.message,
            });
          }
        } catch (authErr) {
          if (onError) onError(authErr);
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    if (containerElement) {
      containerElement.innerHTML = "";
      google.accounts.id.renderButton(containerElement, {
        theme: "outline",
        size: "large",
        type: "standard",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: 380,
      });
    }

    return true;
  } catch (err) {
    console.error("Error initializing Google Identity Services:", err);
    if (onError) onError(err);
    return false;
  }
}

/**
 * Direct OAuth2 Token Flow Popup (Alternative real Google popup with accounts.google.com)
 */
export function openGoogleOAuthPopup({
  clientId = getGoogleClientId(),
  onSuccess,
  onError,
}) {
  return new Promise((resolve, reject) => {
    void (async () => {
      try {
        const google = await loadGoogleGsiScript();
        if (!google?.accounts?.oauth2) {
          throw new Error("Google OAuth2 client is not available.");
        }

        const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "email profile openid",
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            const err = new Error(tokenResponse.error_description || tokenResponse.error);
            if (onError) onError(err);
            reject(err);
            return;
          }

          try {
            // Fetch real userinfo from Google's API endpoint with the access token
            const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });
            const userInfo = await res.json();

            if (!userInfo || !userInfo.email) {
              throw new Error("Failed to fetch Google profile information.");
            }

            const authResult = await loginWithGoogle({
              name: userInfo.name || userInfo.given_name || userInfo.email.split("@")[0],
              email: userInfo.email,
              avatar: userInfo.picture || "",
              googleId: userInfo.sub || `gid-${Date.now()}`,
            });

            if (onSuccess) {
              onSuccess({
                user: authResult.user,
                rawGoogleProfile: userInfo,
                message: authResult.message,
              });
            }
            resolve(authResult);
          } catch (e) {
            if (onError) onError(e);
            reject(e);
          }
        },
      });

        client.requestAccessToken({ prompt: "select_account" });
      } catch (err) {
        if (onError) onError(err);
        reject(err);
      }
    })();
  });
}
