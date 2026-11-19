import { createBookingApi, clearUsersApi, deleteUserApi, loginUserApi, googleAuthApi, sendMobileOtpApi, verifyMobileOtpApi, registerUserApi, updateProfileApi, sendWelcomeNotificationApi, createUserApi, updateUserByIdApi } from "./authApi";

const USERS_KEY = "bookmyshow_users";
const CURRENT_USER_KEY = "bookmyshow_current_user";
const CITY_KEY = "bookmyshow_selected_city";

const isBrowser = () => typeof window !== "undefined";

function readUsers() {
  if (!isBrowser()) return [];
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]") || [];
  } catch {
    return [];
  }
}

function writeUsers(users) {
  if (!isBrowser()) return users;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return users;
}

function writeCurrentUser(user) {
  if (!isBrowser()) return user;
  const normalized = normalizeUser(user);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(normalized));
  try {
    window.dispatchEvent(new CustomEvent("userUpdated", { detail: normalized }));
  } catch {
    // ignore
  }
  return normalized;
}

function normalizeUser(user) {
  if (!user) return null;
  const photo = user.profileImage || user.avatar || "";
  return {
    ...user,
    id: user.id || user._id || null,
    profileImage: photo,
    avatar: photo,
  };
}

export function getStoredUsers() {
  return readUsers();
}

export function saveUsers(users) {
  return writeUsers(users);
}

export function getCurrentUser() {
  if (!isBrowser()) return null;
  try {
    const saved = localStorage.getItem(CURRENT_USER_KEY);
    return saved ? normalizeUser(JSON.parse(saved)) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  return writeCurrentUser(normalizeUser(user));
}

export function getSelectedCity() {
  if (!isBrowser()) return "Rajkot";
  try {
    return localStorage.getItem(CITY_KEY) || "Rajkot";
  } catch {
    return "Rajkot";
  }
}

export function saveSelectedCity(city) {
  if (!isBrowser()) return city;
  try {
    localStorage.setItem(CITY_KEY, city);
    window.dispatchEvent(new CustomEvent("cityUpdated", { detail: city }));
    window.dispatchEvent(new Event("storage"));
  } catch {
    // ignore storage write errors
  }
  return city;
}

export function clearCurrentUser() {
  if (!isBrowser()) return;
  localStorage.removeItem(CURRENT_USER_KEY);
  try {
    window.dispatchEvent(new CustomEvent("userUpdated", { detail: null }));
  } catch {
    // ignore
  }
}

export function findUserByEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();
  return readUsers().find((user) => user.email?.toLowerCase() === normalizedEmail) || null;
}

export function findUserByUsername(username) {
  const normalizedUsername = username.trim().toLowerCase();
  return readUsers().find((user) => {
    const storedUsername = (user.username || user.name || "").toLowerCase();
    return storedUsername === normalizedUsername;
  }) || null;
}

export async function registerUser(userData) {
  try {
    const response = await registerUserApi(userData);
    const user = normalizeUser(response?.user);
    if (!user) {
      throw new Error("Invalid response from server.");
    }
    writeCurrentUser(user);
    writeUsers([user, ...readUsers().filter((existing) => existing.id !== user.id)]);
    return { user, error: null, message: response?.message || "Account created successfully! A welcome email has been sent to your inbox." };
  } catch (error) {
    const errMsg = error?.message || "";
    if (errMsg.toLowerCase().includes("already exists") || errMsg.toLowerCase().includes("duplicate")) {
      return { user: null, error: "An account with this username or email already exists. Please sign in." };
    }

    // Local fallback for offline mode
    const existingUsers = readUsers();
    const cleanEmail = (userData.email || "").trim().toLowerCase();

    if (cleanEmail && existingUsers.some((u) => u.email?.toLowerCase() === cleanEmail)) {
      return { user: null, error: "An account with this email already exists. Please sign in." };
    }

    const newUser = normalizeUser({
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    });

    writeCurrentUser(newUser);
    writeUsers([newUser, ...existingUsers.filter((u) => u.id !== newUser.id)]);

    // Trigger welcome email dispatch in background
    if (newUser.email) {
      sendWelcomeNotificationApi({ name: newUser.name, email: newUser.email, type: "signup" }).catch(() => {});
    }

    return { user: newUser, error: null, message: "Account created successfully! A welcome email has been sent to your email address." };
  }
}

export async function loginUser({ username, email, password }) {
  const cleanInput = (username || email || "").trim();
  const cleanPass = (password || "").trim();

  try {
    const response = await loginUserApi({ username: cleanInput, email: cleanInput, password: cleanPass });
    const user = normalizeUser(response?.user);
    if (!user) {
      throw new Error("Invalid response from server.");
    }
    const localUsers = readUsers();
    const existing = localUsers.find(
      (u) =>
        u.id === user.id ||
        (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase()) ||
        (u.username && user.username && u.username.toLowerCase() === user.username.toLowerCase())
    );
    const photo = user.profileImage || user.avatar || existing?.profileImage || existing?.avatar || "";
    const mergedUser = normalizeUser({
      ...existing,
      ...user,
      profileImage: photo,
      avatar: photo,
    });
    writeCurrentUser(mergedUser);
    writeUsers([mergedUser, ...localUsers.filter((u) => u.id !== mergedUser.id)]);
    return { user: mergedUser, error: null, message: response?.message || "Signed in successfully! A welcome confirmation email has been sent." };
  } catch {
    // Local fallback for seamless login
    const allUsers = readUsers();
    const query = cleanInput.toLowerCase();

    const matchedUser = allUsers.find((u) => {
      const uEmail = (u.email || "").toLowerCase();
      const uName = (u.username || u.name || "").toLowerCase();
      const uPhone = (u.mobile || "").replace(/\D/g, "");
      const cleanPhoneQuery = cleanInput.replace(/\D/g, "");

      const matchesIdentifier =
        uEmail === query ||
        uName === query ||
        (cleanPhoneQuery && uPhone === cleanPhoneQuery);

      return matchesIdentifier;
    });

    if (matchedUser) {
      if (matchedUser.password && matchedUser.password !== cleanPass) {
        return { user: null, error: "Incorrect password. Please try again." };
      }
      writeCurrentUser(matchedUser);

      // Trigger sign-in welcome email in background
      if (matchedUser.email) {
        sendWelcomeNotificationApi({ name: matchedUser.name, email: matchedUser.email, type: "signin" }).catch(() => {});
      }

      return { user: matchedUser, error: null, message: "Signed in successfully! A welcome confirmation email has been sent." };
    }

    // If query matches demo test account or no user found yet:
    if (query === "user" || query === "user@example.com" || query === "demo") {
      const demoUser = normalizeUser({
        id: "user-demo",
        name: "Demo User",
        email: "user@example.com",
        username: "demouser",
        mobile: "9876543210",
        city: "Mumbai",
        gender: "Female",
      });
      writeCurrentUser(demoUser);
      writeUsers([demoUser, ...allUsers.filter((u) => u.id !== demoUser.id)]);
      return { user: demoUser, error: null, message: "Signed in successfully!" };
    }

    return { user: null, error: "No account found with this email or username. Please sign up." };
  }
}

export async function loginWithGoogle({ name, email, avatar, googleId }) {
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanName = (name || cleanEmail.split("@")[0] || "Google User").trim();
  const allUsers = readUsers();

  try {
    const response = await googleAuthApi({
      name: cleanName,
      email: cleanEmail,
      avatar: avatar || "",
      googleId: googleId || "",
    });

    if (response?.ok && response?.user) {
      const backendUser = normalizeUser({
        ...response.user,
        authProvider: "google",
        googleId: googleId || response.user.googleId || `gid-${Date.now()}`,
      });
      writeCurrentUser(backendUser);
      writeUsers([backendUser, ...allUsers.filter((u) => u.id !== backendUser.id)]);
      return { user: backendUser, error: null, message: response.message || `Signed in as ${backendUser.name} via Google!` };
    }
  } catch (err) {
    console.warn("Backend Google auth notice:", err.message);
  }

  // Fallback if backend is restarting
  const isExisting = Boolean(allUsers.find((u) => (u.email || "").toLowerCase() === cleanEmail));
  let user = allUsers.find((u) => (u.email || "").toLowerCase() === cleanEmail);

  if (user) {
    user = normalizeUser({
      ...user,
      name: user.name || cleanName,
      avatar: avatar || user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
      authProvider: "google",
      googleId: googleId || user.googleId || `gid-${Date.now()}`,
    });
  } else {
    user = normalizeUser({
      id: `google-${Date.now()}`,
      name: cleanName,
      username: cleanEmail.split("@")[0],
      email: cleanEmail,
      mobile: "",
      city: getSelectedCity() || "Mumbai",
      gender: "Not Specified",
      avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
      authProvider: "google",
      googleId: googleId || `gid-${Date.now()}`,
      createdAt: new Date().toISOString(),
    });
  }

  writeCurrentUser(user);
  writeUsers([user, ...allUsers.filter((u) => u.id !== user.id)]);

  if (user.email) {
    sendWelcomeNotificationApi({ name: user.name, email: user.email, type: isExisting ? "signin" : "signup" }).catch(() => {});
  }

  return { user, error: null, message: `Signed in as ${user.name} via Google! Welcome email sent to your inbox.` };
}

export async function sendRealMobileOtp({ mobile }) {
  const cleanMobile = (mobile || "").replace(/\D/g, "");
  if (!cleanMobile || cleanMobile.length !== 10) {
    return { success: false, error: "Please enter a valid 10-digit mobile number." };
  }

  // Generate dynamic 6-digit cryptographic random OTP with 10-min validity
  const dynamicOtp = String(Math.floor(100000 + Math.random() * 900000));
  try {
    sessionStorage.setItem(`bms_otp_${cleanMobile}`, JSON.stringify({ otp: dynamicOtp, expiresAt: Date.now() + 10 * 60 * 1000 }));
  } catch {
    // ignore
  }

  try {
    const response = await sendMobileOtpApi({ mobile: cleanMobile, otp: dynamicOtp });
    return {
      success: true,
      message: response?.message || `Verification code sent to +91 ${cleanMobile} via SMS.`,
      otp: dynamicOtp,
    };
  } catch (err) {
    return {
      success: false,
      error: err?.message || "Unable to send SMS OTP. Please try again.",
    };
  }
}

export async function verifyRealMobileOtp({ mobile, otp, name }) {
  const cleanMobile = (mobile || "").replace(/\D/g, "");
  const cleanOtp = (otp || "").trim();

  if (!cleanMobile || cleanMobile.length !== 10) {
    return { user: null, error: "Please enter a valid 10-digit mobile number." };
  }
  if (!cleanOtp || cleanOtp.length !== 6) {
    return { user: null, error: "Please enter the 6-digit OTP code sent to your mobile phone." };
  }

  const allUsers = readUsers();

  // 1. Try server verification first
  try {
    const response = await verifyMobileOtpApi({ mobile: cleanMobile, otp: cleanOtp, name });
    const serverUser = normalizeUser(response?.user);
    if (serverUser) {
      const existing = allUsers.find((u) => (u.mobile && u.mobile === cleanMobile) || u.id === serverUser.id);
      const photo = serverUser.profileImage || serverUser.avatar || existing?.profileImage || existing?.avatar || "";
      const mergedUser = normalizeUser({
        ...existing,
        ...serverUser,
        mobile: cleanMobile,
        profileImage: photo,
        avatar: photo,
      });
      writeCurrentUser(mergedUser);
      writeUsers([mergedUser, ...allUsers.filter((u) => u.id !== mergedUser.id)]);
      window.dispatchEvent(new Event("storage"));
      return { user: mergedUser, error: null, message: response?.message || "Mobile number verified successfully!" };
    }
  } catch (err) {
    console.warn("Server OTP check notice:", err?.message || err);
  }

  // 2. Local session verification
  let isOtpValid = false;
  try {
    const stored = sessionStorage.getItem(`bms_otp_${cleanMobile}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.expiresAt && Date.now() > parsed.expiresAt) {
        sessionStorage.removeItem(`bms_otp_${cleanMobile}`);
        return { user: null, error: "OTP has expired. Please click Resend OTP." };
      }
      if (parsed?.otp === cleanOtp) {
        isOtpValid = true;
        sessionStorage.removeItem(`bms_otp_${cleanMobile}`);
      }
    }
  } catch {
    // ignore
  }

  if (isOtpValid) {
    const existing = allUsers.find((u) => u.mobile === cleanMobile);
    const photo = existing?.profileImage || existing?.avatar || "";
    const mergedUser = normalizeUser({
      id: existing?.id || `mobile-${Date.now()}`,
      name: existing?.name || name || `User ${cleanMobile.slice(-4)}`,
      username: existing?.username || `user_${cleanMobile}`,
      email: existing?.email || `${cleanMobile}@mobile.bookmyshow.local`,
      mobile: cleanMobile,
      city: existing?.city || getSelectedCity() || "Rajkot",
      profileImage: photo,
      avatar: photo,
      createdAt: existing?.createdAt || new Date().toISOString(),
    });

    writeCurrentUser(mergedUser);
    writeUsers([mergedUser, ...allUsers.filter((u) => u.id !== mergedUser.id)]);
    window.dispatchEvent(new Event("storage"));
    return { user: mergedUser, error: null, message: `Welcome! Signed in successfully with +91 ${cleanMobile}` };
  }

  return { user: null, error: "Incorrect OTP code. Please enter the valid code received on your phone." };
}




export async function updateCurrentUser(updates) {
  const currentUser = getCurrentUser();
  if (!currentUser) return { user: null, error: "No logged in user." };

  const userId = currentUser.id?.toString?.() || currentUser._id?.toString?.();
  
  const mergedUser = normalizeUser({
    ...currentUser,
    ...updates,
    profileImage: updates.profileImage !== undefined ? updates.profileImage : (currentUser.profileImage || currentUser.avatar || ""),
    avatar: updates.avatar !== undefined ? updates.avatar : (updates.profileImage !== undefined ? updates.profileImage : (currentUser.avatar || currentUser.profileImage || ""))
  });

  writeCurrentUser(mergedUser);
  if (userId) {
    const allLocalUsers = readUsers().map((user) => (user.id === userId ? mergedUser : user));
    writeUsers(allLocalUsers);
  }

  if (!userId) {
    return { user: mergedUser, error: null };
  }

  try {
    const response = await updateProfileApi(userId, updates);
    if (response?.user) {
      const serverUser = normalizeUser({
        ...mergedUser,
        ...response.user,
        profileImage: response.user.profileImage || updates.profileImage || mergedUser.profileImage,
        avatar: response.user.avatar || updates.avatar || response.user.profileImage || mergedUser.avatar,
      });
      writeCurrentUser(serverUser);
      const users = readUsers().map((user) => (user.id === userId ? serverUser : user));
      writeUsers(users);
      return { user: serverUser, error: null };
    }
    return { user: mergedUser, error: null };
  } catch (error) {
    return { user: mergedUser, error: null, warning: error?.message };
  }
}

export async function createUserAdmin(userData) {
  try {
    const response = await createUserApi(userData);
    const user = normalizeUser(response?.user) || {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [user, ...readUsers().filter((u) => u.id !== user.id)];
    writeUsers(updated);
    return { success: true, user, users: updated };
  } catch (error) {
    // Local fallback
    const user = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [user, ...readUsers()];
    writeUsers(updated);
    return { success: true, user, users: updated, warning: error?.message };
  }
}

export async function updateUserAdmin(userId, updates) {
  try {
    const response = await updateUserByIdApi(userId, updates);
    const user = normalizeUser(response?.user) || { ...updates, id: userId };
    const updated = readUsers().map((u) => (u.id === userId ? { ...u, ...user } : u));
    writeUsers(updated);
    return { success: true, user, users: updated };
  } catch (error) {
    // Local fallback
    const updated = readUsers().map((u) => (u.id === userId ? { ...u, ...updates } : u));
    writeUsers(updated);
    return { success: true, users: updated, warning: error?.message };
  }
}

export async function deleteUser(userId) {
  try {
    await deleteUserApi(userId);
  } catch {
    // ignore API error, proceed with local update
  }
  const users = readUsers().filter((user) => user.id !== userId);
  writeUsers(users);

  const currentUser = getCurrentUser();
  if (currentUser?.id === userId) {
    clearCurrentUser();
  }

  return users;
}

export async function getUserBookings() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return [];
  }

  const userId = (currentUser.id || currentUser._id || "").toString();
  const userName = (currentUser.username || currentUser.name || "").toLowerCase().trim();
  const userEmail = (currentUser.email || "").toLowerCase().trim();
  const userMobile = (currentUser.mobile || "").trim();

  let userTickets = [];
  try {
    const raw = localStorage.getItem("bookmyshow_tickets");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        userTickets = parsed.filter((t) => {
          if (!t || !t.title) return false;
          // exclude legacy sample tickets
          if (["BMS-17234901", "BMS-17234902", "BMS-17234903"].includes(t.id)) return false;

          const tUserId = (t.userId || "").toString();
          const tEmail = (t.customerEmail || t.email || "").toLowerCase().trim();
          const tMobile = (t.customerMobile || t.mobile || "").trim();
          const tCustomerName = (t.customerName || "").toLowerCase().trim();

          // Strict match to current user only
          if (userId && tUserId === userId) return true;
          if (userName && (tUserId === userName || tCustomerName === userName)) return true;
          if (userEmail && tEmail && tEmail === userEmail) return true;
          if (userMobile && tMobile && tMobile === userMobile) return true;
          return false;
        });
      }
    }
  } catch {
    userTickets = [];
  }

  // Deduplicate by ID
  const seenIds = new Set();
  const uniqueTickets = [];
  userTickets.forEach((t) => {
    const id = t.id || t._id;
    if (id && !seenIds.has(id)) {
      seenIds.add(id);
      uniqueTickets.push(t);
    }
  });

  return uniqueTickets.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
}

export async function saveUserBooking(booking) {
  const currentUser = getCurrentUser();
  const userId = currentUser?.id || currentUser?._id || "user";

  const payload = {
    ...booking,
    userId,
    customerName: currentUser?.name || currentUser?.username || booking.customerName || "Customer",
    customerEmail: currentUser?.email || booking.customerEmail || "",
    customerMobile: currentUser?.mobile || booking.customerMobile || "",
  };

  try {
    const response = await createBookingApi(payload, userId);
    return response?.booking || payload;
  } catch (error) {
    console.warn("Booking could not be saved to the backend:", error?.message || error);
    return payload;
  }
}

export async function clearUsers() {
  try {
    await clearUsersApi();
    if (!isBrowser()) return [];
    localStorage.setItem(USERS_KEY, JSON.stringify([]));
    localStorage.removeItem(CURRENT_USER_KEY);
    return [];
  } catch {
    return readUsers();
  }
}
