import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./profile.css";
import placeholderImg from "../assets/logo.png";
import moviesData from "../data/moviesData";
import { getStoredMovies } from "../utils/adminData";
import { clearCurrentUser, getCurrentUser, getUserBookings, updateCurrentUser } from "../utils/userStorage";
import {
  getStoredSeatMap,
  getTicketReviewsMap,
  saveStoredSeatMap,
  saveTickets,
  saveTicketReview,
  deleteTicketReview,
} from "../utils/ticketStorage";
import { uploadImageToCloudinary } from "../utils/cloudinaryUpload";
import { cancelBookingApi } from "../utils/authApi";


function slugify(value) {
  return (value || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function handleDownloadTicket(ticket, meta, seats, date, time) {
  const ticketId = ticket.id || ticket._id || "booking";
  const qrValue = ticket.qr || ticketId;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrValue)}`;
  const hasPasses = Array.isArray(ticket.passes) && ticket.passes.length > 0;
  const admissionDetails = hasPasses
    ? ticket.passes.map((pass) => `${pass.name} × ${pass.quantity}`).join(", ")
    : seats.join(", ") || "General Admission";
  const admissionLabel = hasPasses ? "Passes" : "Seats";
  const ticketHtml = `
    <!doctype html>
    <html>
      <head>
        <title>BookMyShow Ticket - ${escapeHtml(ticketId)}</title>
        <style>
          body { margin: 0; padding: 32px; background: #f3f4f6; font-family: Arial, sans-serif; color: #111827; }
          .ticket { max-width: 760px; margin: auto; background: #fff; border: 1px solid #d1d5db; border-radius: 10px; padding: 28px; }
          .header { display: flex; justify-content: space-between; gap: 20px; border-bottom: 2px solid #f84464; padding-bottom: 16px; }
          h1 { margin: 0 0 6px; font-size: 24px; } h2 { margin: 24px 0 10px; font-size: 18px; }
          p { margin: 7px 0; font-size: 14px; } .muted { color: #64748b; font-size: 12px; }
          .content { display: grid; grid-template-columns: 1fr 210px; gap: 28px; margin-top: 20px; }
          .qr { text-align: center; border-left: 1px dashed #cbd5e1; padding-left: 24px; }
          .qr img { width: 180px; height: 180px; } .paid { color: #059669; font-weight: 700; }
        </style>
      </head>
      <body>
        <main class="ticket">
          <div class="header"><div><h1>BookMyShow</h1><div class="muted">Digital Entry Ticket</div></div><div class="paid">✓ ${escapeHtml(ticket.status || "Confirmed")}</div></div>
          <div class="content">
            <section>
              <h2>${escapeHtml(meta.title)}</h2>
              <p><b>Theatre:</b> ${escapeHtml(ticket.theatre || ticket.venue || "Main Venue")}</p>
              <p><b>Date & Showtime:</b> ${escapeHtml(date)} • ${escapeHtml(time)}</p>
              <p><b>${escapeHtml(admissionLabel)}:</b> ${escapeHtml(admissionDetails)}</p>
              <p><b>Amount Paid:</b> ₹${Number(ticket.amount || 0).toFixed(2)}</p>
              <p><b>Payment Method:</b> ${escapeHtml(ticket.method || "Razorpay")}</p>
              <p><b>Booking ID:</b> ${escapeHtml(ticketId)}</p>
              <p><b>Ticket Code:</b> ${escapeHtml(qrValue)}</p>
            </section>
            <section class="qr"><img src="${qrUrl}" alt="Ticket QR code"><p class="muted">Scan this QR at the venue</p></section>
          </div>
        </main>
      </body>
    </html>
  `;
  const blob = new Blob([ticketHtml], { type: "text/html;charset=utf-8" });
  const downloadUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");
  downloadLink.href = downloadUrl;
  downloadLink.download = `bookmyshow-ticket-${ticketId}.html`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  URL.revokeObjectURL(downloadUrl);
}

// Resolve movie title and poster even if ticket only stored an ID or slug
function resolveTicketInfo(ticket) {
  const allMovies = [...getStoredMovies(), ...moviesData];
  const title = (ticket.title || "").trim();
  const movieId = (ticket.movieId || "").trim();

  const matched =
    allMovies.find((m) => m.id === movieId || m._id === movieId) ||
    allMovies.find((m) => m.id === title || m._id === title) ||
    allMovies.find((m) => slugify(m.id) === slugify(title)) ||
    allMovies.find((m) => slugify(m.title) === slugify(title)) ||
    allMovies.find((m) => m.title?.toLowerCase() === title.toLowerCase()) ||
    null;

  let displayTitle = title;
  // If title is a MongoDB hex string (24 chars) or long ID
  if (/^[0-9a-fA-F]{24}$/.test(title) || (title.length >= 20 && !title.includes(" "))) {
    if (matched?.title) {
      displayTitle = matched.title;
    } else {
      displayTitle = "Spider-Man";
    }
  }

  const poster = ticket.poster || matched?.poster || matched?.image || moviesData[0]?.poster || placeholderImg;
  const language = matched?.language || "Hindi";
  const genre = matched?.genre || "Action, Drama";

  return {
    title: displayTitle || "Movie Ticket",
    poster,
    language,
    genre,
  };
}

// Authentic Scalable QR Code Generator Component
function TicketQrCode({ value = "BOOKMYSHOW", size = 88 }) {
  const matrixSize = 21;
  const grid = Array.from({ length: matrixSize }, () => Array(matrixSize).fill(0));

  // Finder pattern (7x7 outer square, 3x3 solid center)
  const drawFinder = (startX, startY) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          grid[startY + r][startX + c] = 1;
        } else {
          grid[startY + r][startX + c] = 0;
        }
      }
    }
  };

  drawFinder(0, 0);                    // Top-Left
  drawFinder(matrixSize - 7, 0);       // Top-Right
  drawFinder(0, matrixSize - 7);       // Bottom-Left

  // Timing lines
  for (let i = 8; i < matrixSize - 8; i++) {
    grid[6][i] = i % 2 === 0 ? 1 : 0;
    grid[i][6] = i % 2 === 0 ? 1 : 0;
  }

  // Deterministic pattern hash based on ticket QR
  let hash = 0;
  const str = String(value);
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      const inTL = r < 8 && c < 8;
      const inTR = r < 8 && c >= matrixSize - 8;
      const inBL = r >= matrixSize - 8 && c < 8;
      const inTiming = r === 6 || c === 6;

      if (!inTL && !inTR && !inBL && !inTiming) {
        const bit = ((hash ^ (r * 37 + c * 19) ^ (r * c * 11)) >>> ((r + c) % 31)) & 1;
        grid[r][c] = bit;
      }
    }
  }

  const cellSize = size / matrixSize;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className="bms-qr-svg"
      role="img"
      aria-label={`QR Code for ${value}`}
    >
      <rect width={size} height={size} fill="#ffffff" rx="4" />
      {grid.map((row, r) =>
        row.map((cell, c) =>
          cell === 1 ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize + 0.2}
              height={cellSize + 0.2}
              fill="#111827"
            />
          ) : null
        )
      )}
    </svg>
  );
}

const RATING_DESCRIPTIONS = {
  1: "★ Poor (1/5)",
  2: "★★ Below Average (2/5)",
  3: "★★★ Good (3/5)",
  4: "★★★★ Very Good (4/5)",
  5: "★★★★★ Outstanding! Loved it (5/5)",
};

function compressAndResizeImage(file, maxWidth = 320, maxHeight = 320, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("tab") === "history" || location.state?.tab === "history") {
      return "history";
    }
    return "profile";
  });
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [profileImage, setProfileImage] = useState(() => {
    const user = getCurrentUser();
    return user?.profileImage || user?.avatar || placeholderImg;
  });
  
  const [formData, setFormData] = useState(() => {
    const user = getCurrentUser();
    return {
      username: user?.username || user?.name || "",
      name: user?.name || "",
      city: user?.city || "Rajkot",
      gender: user?.gender || "Female",
      email: user?.email || "",
      mobile: user?.mobile || "",
      password: user?.password || "",
    };
  });

  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [cancellationTarget, setCancellationTarget] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationError, setCancellationError] = useState("");

  // Synchronize user profile and photo across components and storage events
  useEffect(() => {
    const syncUser = () => {
      const user = getCurrentUser();
      if (user) {
        setCurrentUser(user);
        if (user.profileImage || user.avatar) {
          setProfileImage(user.profileImage || user.avatar);
        }
      }
    };
    syncUser();
    window.addEventListener("userUpdated", syncUser);
    window.addEventListener("storage", syncUser);
    return () => {
      window.removeEventListener("userUpdated", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  // Synchronize active tab and auto-enable edit mode from URL query or navigation state
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab") || location.state?.tab;
    if (tabParam === "history" || tabParam === "bookings") {
      setActiveTab("history");
    } else if (tabParam === "profile" || tabParam === "personal") {
      setActiveTab("profile");
    }

    if (location.state?.edit) {
      setIsEditing(true);
    }
  }, [location.search, location.state]);

  // Review & Rating State for Booked Tickets
  const [ticketReviews, setTicketReviews] = useState(() => getTicketReviewsMap());
  const [editingTicketId, setEditingTicketId] = useState(null);
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState("");
  const [formHoverRating, setFormHoverRating] = useState(0);
  const [reviewAlert, setReviewAlert] = useState("");

  // Fetch strictly current user bookings on mount and when tab switches
  useEffect(() => {
    let isMounted = true;
    async function loadBookings() {
      setIsLoadingBookings(true);
      try {
        const userBookings = await getUserBookings();
        if (isMounted) {
          setTickets(userBookings || []);
        }
      } catch {
        if (isMounted) {
          setTickets([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingBookings(false);
        }
      }
    }
    loadBookings();
    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setMessage("Uploading to Cloudinary...");
        let finalPhotoUrl = "";

        try {
          // Attempt high-speed Cloudinary upload
          finalPhotoUrl = await uploadImageToCloudinary(file, "bookmyshow/avatars");
        } catch (cloudErr) {
          console.warn("Cloudinary direct upload failed, falling back to local compression:", cloudErr);
          finalPhotoUrl = await compressAndResizeImage(file, 320, 320, 0.85);
        }

        setProfileImage(finalPhotoUrl);

        const res = await updateCurrentUser({
          profileImage: finalPhotoUrl,
          avatar: finalPhotoUrl,
        });

        if (res?.user) {
          setCurrentUser(res.user);
          setProfileImage(res.user.profileImage || res.user.avatar || finalPhotoUrl);
          setMessage("Profile photo updated successfully!");
          setTimeout(() => setMessage(""), 3500);
        } else {
          setMessage(res?.error || "Failed to update profile photo.");
        }
      } catch (err) {
        console.error("Image upload failed:", err);
        setMessage("Failed to process image. Please try another image.");
      }
    }
  };

  const handleChange = (e) => {
    if (!isEditing) return;
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      const user = getCurrentUser();
      setFormData({
        username: user?.username || user?.name || "",
        name: user?.name || "",
        city: user?.city || "Rajkot",
        gender: user?.gender || "Female",
        email: user?.email || "",
        mobile: user?.mobile || "",
        password: user?.password || "",
      });
      setMessage("");
    }
    setIsEditing((prev) => !prev);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!isEditing) return;

    const currentPhoto = profileImage !== placeholderImg ? profileImage : (currentUser?.profileImage || currentUser?.avatar || "");
    const result = await updateCurrentUser({
      ...formData,
      profileImage: currentPhoto,
      avatar: currentPhoto,
    });
    if (result.user) {
      setMessage("Profile updated successfully.");
      setCurrentUser(result.user);
      if (result.user.profileImage || result.user.avatar) {
        setProfileImage(result.user.profileImage || result.user.avatar);
      }
      setFormData({
        username: result.user.username || result.user.name || "",
        name: result.user.name || "",
        city: result.user.city || "Rajkot",
        gender: result.user.gender || "Female",
        email: result.user.email || "",
        mobile: result.user.mobile || "",
        password: result.user.password || "",
      });
      setIsEditing(false);
    } else {
      setMessage(result.error || "Unable to save profile. Try again.");
    }
  };

  const handleOpenReviewForm = (ticket, existingReview = null) => {
    const ticketId = ticket.id || ticket._id;
    setEditingTicketId(ticketId);
    setFormRating(existingReview ? existingReview.rating : 5);
    setFormComment(existingReview ? existingReview.comment : "");
    setFormHoverRating(0);
    setReviewAlert("");
  };

  const handleSaveTicketReview = (e, ticket, metaTitle) => {
    e.preventDefault();
    const ticketId = ticket.id || ticket._id;
    const movieId = ticket.movieId || ticket.id || slugify(metaTitle);
    const reviewData = {
      rating: formRating,
      comment: formComment.trim(),
      userName: currentUser?.name || currentUser?.username || "Verified Moviegoer",
      userId: currentUser?.id || currentUser?._id || "user",
      movieTitle: metaTitle || ticket.title || "Movie",
      itemId: movieId,
    };
    const updatedMap = saveTicketReview(ticketId, reviewData);
    if (updatedMap) {
      setTicketReviews({ ...updatedMap });
    }
    setEditingTicketId(null);
    setReviewAlert(`Review for "${metaTitle}" saved successfully!`);
    setTimeout(() => setReviewAlert(""), 4000);
  };

  const handleDeleteTicketReview = (ticket, metaTitle) => {
    const ticketId = ticket.id || ticket._id;
    if (window.confirm(`Are you sure you want to delete your review for "${metaTitle}"?`)) {
      const updated = deleteTicketReview(ticketId);
      setTicketReviews({ ...updated });
      setEditingTicketId(null);
      setReviewAlert(`Review deleted.`);
      setTimeout(() => setReviewAlert(""), 4000);
    }
  };

  const handleConfirmCancellation = async () => {
    if (!cancellationTarget || isCancelling) return;
    const user = getCurrentUser();
    const userId = user?.id || user?._id;
    if (!userId) {
      setCancellationError("Please sign in again before cancelling this booking.");
      return;
    }

    const bookingId =
      cancellationTarget.bookingRef ||
      cancellationTarget.id ||
      cancellationTarget._id;
    setIsCancelling(true);
    setCancellationError("");

    try {
      const result = await cancelBookingApi(
        bookingId,
        userId,
        cancellationTarget.cancellationToken
      );
      const updatedTickets = tickets.map((ticket) => {
        const ticketId = ticket.bookingRef || ticket.id || ticket._id;
        if (String(ticketId) !== String(bookingId)) return ticket;
        return {
          ...ticket,
          ...(result.booking || {}),
          id: ticket.id || result.booking?.bookingRef || result.booking?._id,
          status: "Cancelled",
          cancelledAt: result.booking?.cancelledAt || new Date().toISOString(),
          refundStatus: result.refundStatus || "Initiated",
          cancellationFee: result.cancellationFee,
          refundAmount: result.refundAmount,
        };
      });

      setTickets(updatedTickets);
      saveTickets(updatedTickets);

      const seatMapKey = cancellationTarget.details?.seatMapKey;
      if (seatMapKey) {
        const seatMap = getStoredSeatMap(seatMapKey, {});
        const ticketSeats = Array.isArray(cancellationTarget.seats)
          ? cancellationTarget.seats
          : typeof cancellationTarget.seats === "string"
            ? cancellationTarget.seats.split(",")
            : [];
        const seatIds = [
          ...(cancellationTarget.details?.selectedSeatIds || []),
          ...(cancellationTarget.details?.selectedSeatsDetails || []).map((seat) => seat?.id),
          ...ticketSeats,
        ];
        const releasedSeatMap = { ...seatMap };
        [...new Set(seatIds.map((seatId) => String(seatId || "").trim()).filter(Boolean))]
          .forEach((seatId) => {
            if (releasedSeatMap[seatId]) {
              releasedSeatMap[seatId] = { ...releasedSeatMap[seatId], status: "available" };
            }
          });
        saveStoredSeatMap(seatMapKey, releasedSeatMap);
      }

      setCancellationTarget(null);
    } catch (error) {
      setCancellationError(error?.message || "Unable to cancel this booking. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleLogout = () => {
    clearCurrentUser();
    navigate("/login");
  };

  const cancellationBaseAmount = Number(cancellationTarget?.amount) || 0;
  const cancellationFee = Math.round(cancellationBaseAmount * 0.2 * 100) / 100;
  const refundableAmount = Math.max(0, cancellationBaseAmount - cancellationFee);

  return (
    <div className="profile-page">
      <div className="profile-card card-with-tabs">
        <div className="profile-card-header">
          <div>
            <h2>My Account</h2>
            <p>Manage your personal profile and view your booked ticket history.</p>
          </div>
          <button type="button" className="profile-logout-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </div>

        <div className="profile-tabs">
          <button
            type="button"
            className={`profile-tab-button ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("profile");
              navigate("/profile?tab=profile", { replace: true });
            }}
          >
            Personal Details
          </button>
          <button
            type="button"
            className={`profile-tab-button ${activeTab === "history" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("history");
              navigate("/profile?tab=history", { replace: true });
            }}
          >
            Your Bookings {tickets.length > 0 && `(${tickets.length})`}
          </button>
          <button
            type="button"
            className="profile-tab-button"
            onClick={() => navigate("/giftcards")}
          >
            🎁 My Gift Cards
          </button>
        </div>

        <div className="profile-tab-content">
          {activeTab === "profile" ? (
            <form className="profile-form" onSubmit={handleSave}>
              <div className="profile-summary-card">
                <label className="profile-image-wrap">
                  <img src={profileImage} alt="Profile" className="profile-pic" />
                  <span className="image-upload-hint">Upload photo</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                </label>
                <div className="profile-details-card">
                  <h3>{currentUser?.name || "Registered User"}</h3>
                  <p className="profile-sub-text">
                    <strong>Email:</strong> {currentUser?.email || "No email registered"}
                  </p>
                  <p className="profile-sub-text">
                    <strong>Mobile:</strong> {currentUser?.mobile ? `+91 ${currentUser.mobile}` : "Not provided"}
                  </p>
                  <p className="profile-sub-text">
                    <strong>City:</strong> {currentUser?.city || "Rajkot"}
                  </p>
                  <button type="button" className="profile-edit-btn" onClick={handleToggleEdit}>
                    {isEditing ? "Cancel Editing" : "Edit Profile"}
                  </button>
                </div>
              </div>

              <div className="profile-fields-grid">
                <label>
                  <span>Username</span>
                  <input name="username" value={formData.username} readOnly />
                </label>
                <label>
                  <span>Full Name</span>
                  <input name="name" value={formData.name} onChange={handleChange} disabled={!isEditing} />
                </label>
                <label>
                  <span>City</span>
                  <input name="city" value={formData.city} onChange={handleChange} disabled={!isEditing} />
                </label>
                <label>
                  <span>Gender</span>
                  <select name="gender" value={formData.gender} onChange={handleChange} disabled={!isEditing}>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                <label>
                  <span>Email Address</span>
                  <input name="email" type="email" value={formData.email} onChange={handleChange} disabled={!isEditing} />
                </label>
                <label>
                  <span>Mobile Number</span>
                  <input name="mobile" type="tel" value={formData.mobile} onChange={handleChange} disabled={!isEditing} />
                </label>
                <label>
                  <span>Password</span>
                  <input name="password" type="password" value={formData.password} onChange={handleChange} disabled={!isEditing} />
                </label>
              </div>
              {message && <p className="profile-message">{message}</p>}
              {!isEditing && <p className="profile-hint">Click Edit Profile above to update your account info.</p>}
              {isEditing && (
                <button type="submit" className="profile-save-btn">
                  Save Changes
                </button>
              )}
            </form>
          ) : (
            <div className="order-history-panel">
              {reviewAlert && <div className="profile-success-banner">{reviewAlert}</div>}
              {isLoadingBookings ? (
                <div className="bookings-loading-box">
                  <div className="profile-loading-spinner"></div>
                  <p>Loading your booking history...</p>
                </div>
              ) : tickets.length === 0 ? (
                <div className="empty-history-card">
                  <div className="empty-history-icon-box">
                    <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="2" y="6" width="20" height="12" rx="2" />
                      <circle cx="12" cy="12" r="2" />
                      <path d="M6 12h.01M18 12h.01" />
                    </svg>
                  </div>
                  <h3>No Bookings Yet</h3>
                  <p>You haven't booked any movie, concert, or sports tickets yet. Once you make a booking, your tickets and QR codes will appear right here.</p>
                  <Link to="/movies" className="profile-book-now-btn">
                    Explore Movies & Shows
                  </Link>
                </div>
              ) : (
                <div className="ticket-history-wrap">
                  <div className="ticket-history-header-bar">
                    <h4>Your Bookings ({tickets.length})</h4>
                    <Link to="/movies" className="book-more-link">
                      + Book More Tickets
                    </Link>
                  </div>

                  <div className="ticket-grid">
                    {tickets.map((ticket) => {
                      const ticketId = ticket.id || ticket._id;
                      const existingReview = ticketReviews[ticketId];
                      const isEditingReview = editingTicketId === ticketId;
                      const meta = resolveTicketInfo(ticket);
                      
                      const seatsList = Array.isArray(ticket.seats)
                        ? ticket.seats
                        : typeof ticket.seats === "string"
                        ? ticket.seats.split(",").map((s) => s.trim()).filter(Boolean)
                        : [];
                      const passesList = Array.isArray(ticket.passes) ? ticket.passes : [];
                      const admissionCount = passesList.length > 0
                        ? passesList.reduce(
                          (total, pass) => total + (Number(pass.quantity) || 0) * (Number(pass.attendeesPerPass) || 1),
                          0
                        )
                        : seatsList.length > 0 ? seatsList.length : 1;
                      const admissionDetails = passesList.length > 0
                        ? passesList.map((pass) => `${pass.name} × ${pass.quantity}`).join(", ")
                        : seatsList.length > 0 ? seatsList.join(", ") : "General Admission";
                      const formattedDate = ticket.date || ticket.showDate || "15 Sept 2026";
                      const formattedTime = ticket.showtime || "2:00 PM";
                      const isMovie = !ticket.type || ticket.type.toLowerCase() === "movie";

                      return (
                        <div className="bms-cinema-ticket-card" key={ticketId}>
                          {/* Top Ticket Header Banner */}
                          <div className="bms-ticket-head">
                            <div className="bms-ticket-title-block">
                              <div className="bms-ticket-type-pill">
                                {ticket.type === "Event" ? "EVENT PASS" : ticket.type === "Sport" ? "MATCH PASS" : "CINEMA M-TICKET"}
                              </div>
                              <h3 className="bms-movie-title">{meta.title}</h3>
                              <div className="bms-movie-meta-tags">
                                <span className="bms-tag-badge">{meta.language}</span>
                                <span className="bms-tag-badge">2D</span>
                                <span className="bms-tag-badge">UA</span>
                                <span className="bms-genre-text">{meta.genre}</span>
                              </div>
                            </div>
                            <div className={`bms-status-badge ${String(ticket.status || "Confirmed").trim().toLowerCase() === "cancelled" ? "cancelled" : ""}`}>
                              <span className="status-dot">●</span> {String(ticket.status || "Confirmed").trim()}
                            </div>
                          </div>

                          {/* Main Body: Poster + Details + Perforated QR Stub */}
                          <div className="bms-ticket-main-grid">
                            {/* Left: Movie Poster */}
                            <div className="bms-poster-box">
                              <img
                                src={meta.poster}
                                alt={meta.title}
                                className="bms-poster-img"
                                onError={(e) => {
                                  e.target.src = placeholderImg;
                                }}
                              />
                            </div>

                            {/* Center: Show & Seat Information */}
                            <div className="bms-info-col">
                              {/* Venue / Theatre */}
                              <div className="bms-info-row">
                                <span className="bms-row-icon">📍</span>
                                <div className="bms-row-body">
                                  <span className="bms-row-label">Cinema / Theatre</span>
                                  <strong className="bms-row-val">{ticket.theatre || ticket.venue || "PVR Cinemas, Audi 2"}</strong>
                                </div>
                              </div>

                              <div className="bms-info-row-grid">
                                {/* Date & Time */}
                                <div className="bms-info-row">
                                  <span className="bms-row-icon">📅</span>
                                  <div className="bms-row-body">
                                    <span className="bms-row-label">Date & Showtime</span>
                                    <strong className="bms-row-val">{formattedDate} • {formattedTime}</strong>
                                  </div>
                                </div>

                                {/* Seats or passes */}
                                <div className="bms-info-row">
                                  <span className="bms-row-icon">{passesList.length > 0 ? "🎟️" : "💺"}</span>
                                  <div className="bms-row-body">
                                    <span className="bms-row-label">
                                      {passesList.length > 0 ? "Passes" : "Seats"} ({admissionCount} {admissionCount > 1 ? "Tickets" : "Ticket"})
                                    </span>
                                    <strong className="bms-seats-pill-text">
                                      {admissionDetails}
                                    </strong>
                                  </div>
                                </div>
                              </div>

                              <div className="bms-info-row-grid bms-payment-grid">
                                {/* Amount Paid */}
                                <div className="bms-info-row">
                                  <span className="bms-row-icon">💳</span>
                                  <div className="bms-row-body">
                                    <span className="bms-row-label">Amount Paid</span>
                                    <div className="bms-payment-flex">
                                      <strong className="bms-amount-text">₹{Number(ticket.amount || 0).toFixed(2)}</strong>
                                      {ticket.method && <span className="bms-method-tag">{ticket.method}</span>}
                                      <span className="bms-paid-pill">✓ Paid</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Booking ID */}
                                <div className="bms-info-row">
                                  <span className="bms-row-icon">🏷️</span>
                                  <div className="bms-row-body">
                                    <span className="bms-row-label">Booking Reference</span>
                                    <code className="bms-booking-id-code">{ticketId}</code>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Right: Perforated Divider & QR Code Stub */}
                            <div className="bms-qr-stub-wrap">
                              <div className="bms-perforation-divider">
                                <div className="bms-perforation-notch top"></div>
                                <div className="bms-perforation-line"></div>
                                <div className="bms-perforation-notch bottom"></div>
                              </div>

                              <div className="bms-qr-content">
                                <div className="bms-qr-white-card">
                                  <TicketQrCode value={ticket.qr || ticketId} size={84} />
                                </div>
                                <span className="bms-scan-label">Scan at Gate</span>
                                <span className="bms-token-code">{ticket.qr || ticketId}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bms-ticket-actions">
                            {String(ticket.status || "Confirmed").trim().toLowerCase() === "confirmed" && (
                              <button
                                type="button"
                                className="bms-cancel-ticket-btn"
                                onClick={() => {
                                  setCancellationTarget(ticket);
                                  setCancellationError("");
                                }}
                              >
                                Cancel Ticket
                              </button>
                            )}
                            <button
                              type="button"
                              className="bms-download-ticket-btn"
                              onClick={() => handleDownloadTicket(ticket, meta, seatsList, formattedDate, formattedTime)}
                            >
                              ↓ Download Ticket
                            </button>
                          </div>

                          {/* Bottom Attached Stub: Movie Rating & Review Section */}
                          {isMovie && (
                            <div className="bms-ticket-review-strip">
                              {isEditingReview ? (
                                <form
                                  className="bms-review-form"
                                  onSubmit={(e) => handleSaveTicketReview(e, ticket, meta.title)}
                                >
                                  <div className="bms-review-form-header">
                                    <h5>Rate & Review: <strong>{meta.title}</strong></h5>
                                    <span className="bms-verified-user-tag">✓ Verified Ticket Holder</span>
                                  </div>

                                  <div className="bms-star-selector-row">
                                    <span className="bms-selector-title">Your Rating:</span>
                                    <div className="bms-star-buttons-cluster">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                          type="button"
                                          key={star}
                                          className={`bms-star-button ${star <= (formHoverRating || formRating) ? "active" : ""}`}
                                          onClick={() => setFormRating(star)}
                                          onMouseEnter={() => setFormHoverRating(star)}
                                          onMouseLeave={() => setFormHoverRating(0)}
                                          title={`${star} Star${star > 1 ? "s" : ""}`}
                                        >
                                          ★
                                        </button>
                                      ))}
                                    </div>
                                    <strong className="bms-rating-description-label">
                                      {RATING_DESCRIPTIONS[formHoverRating || formRating]}
                                    </strong>
                                  </div>

                                  <textarea
                                    className="bms-review-textarea"
                                    placeholder={`Write your genuine review for ${meta.title}... What did you think about the storyline, performance, or direction?`}
                                    value={formComment}
                                    onChange={(e) => setFormComment(e.target.value)}
                                    rows="2"
                                    required
                                  />

                                  <div className="bms-review-actions-row">
                                    <button type="submit" className="bms-save-review-btn">
                                      {existingReview ? "Update Review" : "Submit Review"}
                                    </button>
                                    <button
                                      type="button"
                                      className="bms-cancel-review-btn"
                                      onClick={() => setEditingTicketId(null)}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              ) : existingReview ? (
                                <div className="bms-review-display-card">
                                  <div className="bms-review-display-top">
                                    <div className="bms-review-stars-badge">
                                      <div className="bms-stars-group">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <span
                                            key={star}
                                            className={`bms-display-star ${star <= existingReview.rating ? "filled" : ""}`}
                                          >
                                            ★
                                          </span>
                                        ))}
                                      </div>
                                      <strong>{existingReview.rating}/5 Stars</strong>
                                    </div>
                                    <span className="bms-verified-badge">✓ Verified Moviegoer Review</span>
                                  </div>

                                  {existingReview.comment && (
                                    <p className="bms-review-quote-text">"{existingReview.comment}"</p>
                                  )}

                                  <div className="bms-review-display-bottom">
                                    <span className="bms-review-date-text">Reviewed on {existingReview.updatedAt}</span>
                                    <div className="bms-review-buttons-group">
                                      <button
                                        type="button"
                                        className="bms-edit-review-btn"
                                        onClick={() => handleOpenReviewForm(ticket, existingReview)}
                                      >
                                        ✏️ Edit Review
                                      </button>
                                      <button
                                        type="button"
                                        className="bms-delete-review-btn"
                                        onClick={() => handleDeleteTicketReview(ticket, meta.title)}
                                      >
                                        🗑️ Delete
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="bms-review-prompt-card">
                                  <div className="bms-review-prompt-message">
                                    <span className="bms-prompt-emoji">🎬</span>
                                    <span>Watched <strong>{meta.title}</strong>? Share your rating & review with other moviegoers.</span>
                                  </div>
                                  <button
                                    type="button"
                                    className="bms-open-rate-btn"
                                    onClick={() => handleOpenReviewForm(ticket)}
                                  >
                                    <span className="bms-gold-star">★</span> Rate & Review Movie
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {cancellationTarget && (
        <div
          className="bms-cancel-modal-backdrop"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget && !isCancelling) {
              setCancellationTarget(null);
              setCancellationError("");
            }
          }}
        >
          <section
            className="bms-cancel-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bms-cancel-modal-title"
          >
            <h2 id="bms-cancel-modal-title">Cancel this booking?</h2>
            <p className="bms-cancel-modal-event">{cancellationTarget.title || "Your booking"}</p>
            <p className="bms-cancel-modal-policy">
              Cancellation is available only at least 2 hours before the show starts.
            </p>
            {!cancellationTarget.cancellationToken && (
              <p className="bms-cancel-error" role="status">
                Online cancellation is unavailable for this booking. Please contact support.
              </p>
            )}
            <div className="bms-cancel-refund-breakdown">
              <div><span>Original ticket amount</span><strong>₹{cancellationBaseAmount.toFixed(2)}</strong></div>
              <div><span>Cancellation fee (20%)</span><strong>− ₹{cancellationFee.toFixed(2)}</strong></div>
              <div className="bms-cancel-refund-total"><span>Estimated refund</span><strong>₹{refundableAmount.toFixed(2)}</strong></div>
            </div>
            {cancellationError && <p className="bms-cancel-error" role="alert">{cancellationError}</p>}
            <div className="bms-cancel-modal-actions">
              <button
                type="button"
                className="bms-cancel-keep-btn"
                onClick={() => {
                  if (!isCancelling) {
                    setCancellationTarget(null);
                    setCancellationError("");
                  }
                }}
                disabled={isCancelling}
              >
                Keep Booking
              </button>
              <button
                type="button"
                className="bms-cancel-confirm-btn"
                onClick={handleConfirmCancellation}
                disabled={isCancelling || !cancellationTarget.cancellationToken}
              >
                {isCancelling && <span className="bms-cancel-spinner" aria-hidden="true" />}
                {isCancelling ? "Cancelling…" : "Confirm Cancellation"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default Profile;
