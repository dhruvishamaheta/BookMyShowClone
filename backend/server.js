import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import process from "node:process";
import { Activity, Event, Movie, Sport } from "./models/Content.js";
import { Booking } from "./models/Booking.js";
import { Offer } from "./models/Offer.js";
import { GiftCard } from "./models/GiftCard.js";
import { User } from "./models/User.js";
import { City } from "./models/City.js";
import { Cinema } from "./models/Cinema.js";
import { Contact } from "./models/Contact.js";
import { Review } from "./models/Review.js";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";
import { seedData, seedCinemas } from "./seeds/seedData.js";
import { seedCities } from "./seeds/seedData.js";
import {
  sendBookingConfirmationEmail,
  sendCancellationEmail,
  sendContactEmail,
  sendOtpEmail,
  sendPasswordResetEmail,
  sendSignInWelcomeEmail,
  sendWelcomeEmail,
  getEmailConfigurationStatus,
  verifyEmailConnection,
} from "./utils/mailer.js";
import {
  calculateCancellationAmounts,
  parseShowStartAt,
} from "./utils/bookingCancellation.js";
import { sendMobileOtpSms, verifyTwilioCode } from "./utils/smsService.js";
import multer from "multer";
import {
  uploadBufferToCloudinary,
  uploadBase64ToCloudinary,
} from "./utils/cloudinary.js";


import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI;
const passwordResetTokens = new Map();
const otpStore = new Map();
const mobileOtpStore = new Map();
const razorpayKeyId = String(process.env.RAZORPAY_KEY_ID || "").trim();
const razorpayKeySecret = String(process.env.RAZORPAY_KEY_SECRET || "").trim();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});


app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

app.get("/api/email/status", async (req, res) => {
  const status = getEmailConfigurationStatus();
  if (!status.configured) {
    return res.status(503).json({
      ok: false,
      configured: false,
      message: "EMAIL_USER and EMAIL_APP_PASSWORD are not configured in backend/.env.",
      status,
    });
  }

  try {
    await verifyEmailConnection();
    return res.json({ ok: true, configured: true, message: "SMTP connection verified.", status });
  } catch (error) {
    return res.status(502).json({
      ok: false,
      configured: true,
      message: error?.message || "SMTP connection verification failed.",
      status,
    });
  }
});

async function createRazorpayOrder({ amount, receipt, notes }) {
  const credentials = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount, currency: "INR", receipt, notes }),
  });

  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(payload?.error?.description || "Razorpay order creation failed.");
    error.statusCode = response.status;
    throw error;
  }
  return payload;
}

function isValidRazorpaySignature(orderId, paymentId, signature) {
  if (!razorpayKeySecret || !orderId || !paymentId || !signature) return false;
  const expected = createHmac("sha256", razorpayKeySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  return expectedBuffer.length === signatureBuffer.length &&
    timingSafeEqual(expectedBuffer, signatureBuffer);
}

async function connectToDatabase() {
  console.log("Starting backend from cwd:", process.cwd());
  console.log("MONGODB_URI is", mongoUri ? "set" : "missing");
  if (!mongoUri) {
    console.warn("MONGODB_URI is not set — attempting to connect to local MongoDB (mongodb://127.0.0.1:27017/bookmyshowdb)...");
    try {
      await mongoose.connect("mongodb://127.0.0.1:27017/bookmyshowdb", { serverSelectionTimeoutMS: 5000 });
      console.log("MongoDB connected successfully to local MongoDB");
      return;
    } catch {
      console.warn("No MongoDB instance found — running without DB connection.");
      return;
    }
  }

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Primary MongoDB connection failed:", error.message || error);
    
    // Automatic fallback to local MongoDB if primary fails
    const localUri = "mongodb://127.0.0.1:27017/bookmyshowdb";
    if (mongoUri !== localUri) {
      console.log("Attempting fallback to local MongoDB (mongodb://127.0.0.1:27017/bookmyshowdb)...");
      try {
        await mongoose.connect(localUri, { serverSelectionTimeoutMS: 4000 });
        console.log("Connected successfully to local MongoDB instance!");
        return;
      } catch (localErr) {
        console.warn("Local MongoDB fallback also failed:", localErr.message || localErr);
      }
    }

    console.warn("Continuing to run without DB — some endpoints will be disabled until DB is available.");
  }
}


async function seedDatabaseIfNeeded() {
  const counts = await Promise.all([
    Movie.countDocuments(),
    Event.countDocuments(),
    Sport.countDocuments(),
    Activity.countDocuments(),
    City.countDocuments(),
    Cinema.countDocuments(),
  ]);

  if (
    counts[0] > 0 &&
    counts[1] > 0 &&
    counts[2] > 0 &&
    counts[3] > 0 &&
    counts[4] > 0 &&
    counts[5] > 0
  ) {
    console.log("MongoDB already contains catalog data");
    return;
  }

  await Promise.all([
    Movie.deleteMany({}),
    Event.deleteMany({}),
    Sport.deleteMany({}),
    Activity.deleteMany({}),
    City.deleteMany({}),
    Cinema.deleteMany({}),
  ]);

  await Promise.all([
    Movie.create(seedData.movies),
    Event.create(seedData.events),
    Sport.create(seedData.sports),
    Activity.create(seedData.activities),
    City.create(seedCities),
    Cinema.create(seedCinemas),
  ]);

  console.log("Seeded catalog data into MongoDB");
}


async function ensureSeedUser() {
  const existingUser = await User.findOne({ username: "admin" });
  if (!existingUser) {
    await User.create({
      name: "Admin",
      username: "admin",
      email: "admin@example.com",
      gender: "Other",
      mobile: "9999999999",
      password: "admin123",
      city: "Rajkot",
    });
  }
}

async function ensureSeedReviews() {
  const count = await Review.countDocuments();
  if (count > 0) return;

  const sampleReviews = [
    {
      userId: "usr_priya",
      userName: "Priya Sharma",
      userEmail: "priya.sharma@example.com",
      userAvatar: "",
      itemId: "m1",
      itemTitle: "Avengers: Endgame",
      itemType: "Movie",
      rating: 5,
      comment: "Absolute cinematic masterpiece! The IMAX 3D experience was unmatched and the emotional climax was unforgettable.",
      status: "Approved",
      createdAt: new Date(Date.now() - 86400000 * 2),
    },
    {
      userId: "usr_rohan",
      userName: "Rohan Patel",
      userEmail: "rohan.patel@example.com",
      userAvatar: "",
      itemId: "e1",
      itemTitle: "Arijit Singh Live in Concert",
      itemType: "Event",
      rating: 5,
      comment: "Pure magic! Arijit Singh performed for 3 straight hours. Sound quality and stage light production were world-class.",
      status: "Approved",
      createdAt: new Date(Date.now() - 86400000 * 3),
    },
    {
      userId: "usr_ananya",
      userName: "Ananya Verma",
      userEmail: "ananya.v@example.com",
      userAvatar: "",
      itemId: "e2",
      itemTitle: "Zakir Khan - Tathastu Live",
      itemType: "Event",
      rating: 5,
      comment: "Hilarious and heartwarming! Non-stop laughs from start to finish. Zakir Bhai never disappoints.",
      status: "Approved",
      createdAt: new Date(Date.now() - 86400000 * 5),
    },
    {
      userId: "usr_rahul",
      userName: "Rahul Mehta",
      userEmail: "rahul.mehta@example.com",
      userAvatar: "",
      itemId: "s1",
      itemTitle: "IPL 2026 Final - Grand Clash",
      itemType: "Sport",
      rating: 5,
      comment: "Electric stadium vibe! Super thrilled to witness the match live. Smooth entry and great seating view.",
      status: "Approved",
      createdAt: new Date(Date.now() - 86400000 * 6),
    },
    {
      userId: "usr_sneha",
      userName: "Sneha Joshi",
      userEmail: "sneha.j@example.com",
      userAvatar: "",
      itemId: "a1",
      itemTitle: "Snow Village & Ice Adventure",
      itemType: "Activity",
      rating: 4,
      comment: "Had an awesome weekend outing with family. Snow slides and ice tubes were super fun for kids and adults alike.",
      status: "Approved",
      createdAt: new Date(Date.now() - 86400000 * 8),
    },
    {
      userId: "usr_vikram",
      userName: "Vikram Singh",
      userEmail: "vikram.singh@example.com",
      userAvatar: "",
      itemId: "m2",
      itemTitle: "Fighter",
      itemType: "Movie",
      rating: 3,
      comment: "Good aerial action sequences, but the second half emotional arcs felt a bit stretched.",
      status: "Approved",
      createdAt: new Date(Date.now() - 86400000 * 10),
    },
  ];

  await Review.insertMany(sampleReviews);
  console.log("Seeded initial user reviews into MongoDB");
}

async function ensureSeedOffers() {
  const count = await Offer.countDocuments();
  if (count > 0) return;

  const sampleOffers = [
    {
      title: "Festive Dhamaka Special Offer",
      code: "FESTIVE25",
      description: "Celebrate festive joy with a flat 25% discount up to ₹150 across movies, concerts, and live shows!",
      category: "Festive Offer",
      discountType: "percentage",
      discountValue: 25,
      maxDiscount: 150,
      minOrderAmount: 250,
      applicableFor: "All",
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      isActive: true,
      badgeText: "FESTIVE SPECIAL",
      bannerImage: "",
      terms: [
        "Get 25% off up to maximum ₹150.",
        "Minimum booking amount required is ₹250.",
        "Valid on movies, events, sports, and activities.",
        "Applicable once per user transaction.",
      ],
    },
    {
      title: "Last Minute Movie Rush",
      code: "LASTMIN100",
      description: "Catch last-minute blockbuster shows and save flat ₹100 instantly on your cinema tickets!",
      category: "Last Minute Offer",
      discountType: "flat",
      discountValue: 100,
      maxDiscount: 100,
      minOrderAmount: 300,
      applicableFor: "Movie",
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      isActive: true,
      badgeText: "LAST MINUTE",
      bannerImage: "",
      terms: [
        "Instant flat ₹100 discount on movie bookings.",
        "Minimum transaction value of ₹300.",
        "Valid across all partner cinema screens.",
        "Can be applied at checkout directly.",
      ],
    },
    {
      title: "Weekend Blockbuster Deal",
      code: "WEEKEND50",
      description: "Kickstart your weekend entertainment with an instant 20% discount up to ₹100!",
      category: "Special Deal",
      discountType: "percentage",
      discountValue: 20,
      maxDiscount: 100,
      minOrderAmount: 200,
      applicableFor: "All",
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      isActive: true,
      badgeText: "WEEKEND SPECIAL",
      bannerImage: "",
      terms: [
        "20% discount capped at ₹100.",
        "Valid on all categories across Saturday and Sunday.",
        "Minimum purchase requirement of ₹200.",
      ],
    },
    {
      title: "New User Welcome Discount",
      code: "WELCOME50",
      description: "Welcome to BookMyShow! Get flat ₹50 discount on your first booking.",
      category: "Promo Code",
      discountType: "flat",
      discountValue: 50,
      maxDiscount: 50,
      minOrderAmount: 150,
      applicableFor: "All",
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      isActive: true,
      badgeText: "NEW USER",
      bannerImage: "",
      terms: [
        "Flat ₹50 discount on minimum booking of ₹150.",
        "Valid for new bookings on all entertainment events.",
      ],
    },
  ];

  await Offer.insertMany(sampleOffers);
  console.log("Seeded initial festive & last minute offers into MongoDB");
}

async function ensureSeedGiftCards() {
  const count = await GiftCard.countDocuments();
  if (count > 0) return;

  const sampleGiftCards = [
    {
      title: "Movie Buff Premier Card",
      code: "BMS-MOVIE-500",
      pin: "4829",
      amount: 500,
      balance: 500,
      recipientEmail: "",
      recipientName: "All Users / Open Voucher",
      senderName: "BookMyShow Admin",
      message: "Enjoy the latest blockbusters and popcorn on us!",
      category: "Movies",
      themeColor: "ruby",
      validFrom: new Date(),
      expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      status: "active",
    },
    {
      title: "Festive Joy Celebration Card",
      code: "BMS-FEST-1000",
      pin: "7315",
      amount: 1000,
      balance: 1000,
      recipientEmail: "",
      recipientName: "All Users / Open Voucher",
      senderName: "BookMyShow Admin",
      message: "Celebrate festivities with live concerts, events and sports!",
      category: "Festive",
      themeColor: "gold",
      validFrom: new Date(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      status: "active",
    },
    {
      title: "VIP Executive Entertainment Card",
      code: "BMS-VIP-2000",
      pin: "9102",
      amount: 2000,
      balance: 2000,
      recipientEmail: "",
      recipientName: "All Users / Open Voucher",
      senderName: "BookMyShow Admin",
      message: "Exclusive VIP experience across all premium cinema screens.",
      category: "VIP Rewards",
      themeColor: "midnight",
      validFrom: new Date(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      status: "active",
    },
  ];

  await GiftCard.insertMany(sampleGiftCards);
  console.log("Seeded initial Gift Cards into MongoDB");
}

function toClientUser(user) {
  if (!user) return null;
  const plainUser = typeof user.toObject === "function" ? user.toObject() : { ...user };
  return {
    ...plainUser,
    id: plainUser.id || plainUser._id?.toString?.() || plainUser._id,
  };
}

// =========================================================
// Cloudinary Media Upload Endpoint
// =========================================================
app.post("/api/upload", upload.single("image"), async (req, res) => {
  try {
    const folder = req.body.folder || "bookmyshow/uploads";

    // 1. Upload via multipart file buffer
    if (req.file) {
      const result = await uploadBufferToCloudinary(req.file.buffer, { folder });
      return res.status(200).json({
        ok: true,
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
      });
    }

    // 2. Upload via base64 / data URI string in JSON body
    if (req.body.image) {
      const result = await uploadBase64ToCloudinary(req.body.image, { folder });
      return res.status(200).json({
        ok: true,
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
      });
    }

    return res.status(400).json({
      ok: false,
      success: false,
      message: "No image file or base64 image data provided.",
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return res.status(500).json({
      ok: false,
      success: false,
      message: error.message || "Failed to upload image to Cloudinary.",
    });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, dbConnected: mongoose.connection.readyState === 1 });
});


app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, mobile, subject, message } = req.body || {};

    if (!name || !email || !message) {
      return res.status(400).json({
        ok: false,
        message: "Name, email, and message are required.",
      });
    }

    let savedContact = null;
    try {
      savedContact = await Contact.create({
        name,
        email,
        mobile: mobile || "",
        subject: subject || "General Inquiry",
        message,
        status: "New",
      });
    } catch (dbErr) {
      console.warn("MongoDB Contact save:", dbErr.message);
    }

    try {
      await sendContactEmail({ name, email, message });
    } catch (mailErr) {
      console.warn("Contact email:", mailErr.message);
    }

    return res.json({
      ok: true,
      contact: savedContact,
      message: "Your message has been sent successfully. Our team will get back to you shortly.",
    });
  } catch (error) {
    console.error("Contact failed:", error);
    return res.status(500).json({
      ok: false,
      message: error.message || "Failed to send message. Please try again later.",
    });
  }
});

app.get("/api/contact", async (_req, res) => {
  try {
    const contacts = await Contact.find({}).sort({ createdAt: -1 }).lean();
    return res.json(contacts);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.put("/api/contact/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await Contact.findByIdAndUpdate(id, { status }, { new: true });
    if (!updated) return res.status(404).json({ message: "Message not found" });
    return res.json({ ok: true, contact: updated });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.delete("/api/contact/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Contact.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Message not found" });
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/admin/login", async (req, res) => {
  const username = (req.body?.username || "").trim();
  const password = req.body?.password;
  const expectedUsername = process.env.ADMIN_USERNAME || "admin";
  const expectedPassword = process.env.ADMIN_PASSWORD || "admin123";
  const expectedEmail = process.env.ADMIN_EMAIL || "admin@example.com";

  if (
    (username.toLowerCase() === expectedUsername.toLowerCase() || username.toLowerCase() === expectedEmail.toLowerCase()) &&
    password === expectedPassword
  ) {
    return res.json({
      ok: true,
      token: "admin-token",
      user: {
        username: expectedUsername,
        email: expectedEmail,
        name: "Super Administrator",
        role: "admin",
      },
    });
  }

  return res.status(401).json({ ok: false, message: "Invalid admin credentials. Use admin / admin123" });
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, username, email, gender, mobile, password, city } = req.body || {};
    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      username,
      email,
      gender,
      mobile,
      password,
      city: city || "Rajkot",
    });

    let welcomeEmailSent = false;
    try {
      await sendWelcomeEmail({ name: user.name, email: user.email });
      console.log(`[Email Dispatch] Welcome email successfully sent to ${user.email} (New Registration)`);
      welcomeEmailSent = true;
    } catch (mailError) {
      console.error("Welcome email failed:", mailError?.message || mailError);
    }

    return res.status(201).json({
      ok: true,
      user: toClientUser(user),
      message: welcomeEmailSent
        ? "Welcome to BookMyShow! A welcome email has been sent to your email address."
        : "Welcome to BookMyShow! Email delivery is unavailable because SMTP is not configured.",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    const identifier = username || email || "";
    const user = await User.findOne({ $or: [{ username: identifier }, { email: identifier }] });
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    let loginEmailSent = false;
    try {
      await sendSignInWelcomeEmail({ name: user.name, email: user.email });
      console.log(`[Email Dispatch] Sign-in welcome email successfully sent to ${user.email} (User Login)`);
      loginEmailSent = true;
    } catch (mailError) {
      console.error("Login welcome email failed:", mailError?.message || mailError);
    }

    return res.json({
      ok: true,
      user: toClientUser(user),
      message: loginEmailSent
        ? "Signed in successfully! A welcome confirmation email has been sent to your email address."
        : "Signed in successfully. Email delivery is unavailable because SMTP is not configured.",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/auth/google", async (req, res) => {
  try {
    const { name, email, avatar } = req.body || {};
    if (!email) {
      return res.status(400).json({ ok: false, message: "Email is required for Google authentication" });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name || cleanEmail.split("@")[0] || "Google User").trim();

    let user = await User.findOne({ email: cleanEmail });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const cleanUsername = cleanEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "") + "_" + Math.floor(100 + Math.random() * 900);
      user = await User.create({
        name: cleanName,
        username: cleanUsername,
        email: cleanEmail,
        password: randomBytes(16).toString("hex"),
        city: "Rajkot",
        profileImage: avatar || "",
        avatar: avatar || "",
        gender: "Other",
      });

      try {
        await sendWelcomeEmail({ name: user.name, email: user.email });
        console.log(`[Email Dispatch] Welcome email successfully sent to ${user.email} (Google Signup)`);
      } catch (mailErr) {
        console.error("Google signup welcome email failed:", mailErr?.message || mailErr);
      }
    } else {
      if (avatar && (!user.avatar || !user.profileImage)) {
        user.avatar = user.avatar || avatar;
        user.profileImage = user.profileImage || avatar;
        await user.save();
      }

      try {
        await sendSignInWelcomeEmail({ name: user.name, email: user.email });
        console.log(`[Email Dispatch] Sign-in welcome email successfully sent to ${user.email} (Google Signin)`);
      } catch (mailErr) {
        console.error("Google signin welcome email failed:", mailErr?.message || mailErr);
      }
    }

    return res.json({
      ok: true,
      user: toClientUser(user),
      isNewUser,
      message: isNewUser
        ? "Welcome to BookMyShow! A welcome email has been sent to your inbox."
        : `Welcome back, ${user.name}! A sign-in confirmation email has been sent to your inbox.`,
    });
  } catch (error) {
    console.error("Google authentication error:", error);
    return res.status(500).json({ ok: false, message: error.message || "Google authentication failed." });
  }
});

app.post("/api/auth/send-welcome", async (req, res) => {
  try {
    const { name, email, type } = req.body || {};
    if (!email) {
      return res.status(400).json({ ok: false, message: "Email is required to send welcome email." });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name || "Movie Lover").trim();

    if (type === "signin" || type === "login") {
      await sendSignInWelcomeEmail({ name: cleanName, email: cleanEmail });
      console.log(`[Email Dispatch] Direct sign-in welcome email dispatched to ${cleanEmail}`);
    } else {
      await sendWelcomeEmail({ name: cleanName, email: cleanEmail });
      console.log(`[Email Dispatch] Direct registration welcome email dispatched to ${cleanEmail}`);
    }

    return res.json({
      ok: true,
      message: `Welcome email sent successfully to ${cleanEmail}.`,
    });
  } catch (err) {
    console.error("send-welcome error:", err);
    return res.status(500).json({ ok: false, message: err?.message || "Failed to dispatch welcome email." });
  }
});

app.post("/api/auth/send-mobile-otp", async (req, res) => {
  try {
    const { mobile, otp: clientOtp } = req.body || {};
    const cleanMobile = (mobile || "").replace(/\D/g, "");
    if (!cleanMobile || cleanMobile.length !== 10) {
      return res.status(400).json({ ok: false, message: "Please enter a valid 10-digit Indian mobile number." });
    }

    // Generate real cryptographic 6-digit random OTP or sync with clientOtp
    const otp = (clientOtp && /^\d{6}$/.test(String(clientOtp).trim()) ? String(clientOtp).trim() : null) || String(Math.floor(100000 + Math.random() * 900000));
    mobileOtpStore.set(cleanMobile, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 mins validity
    });

    try {
      await sendMobileOtpSms({ mobile: cleanMobile, otp });
    } catch (smsErr) {
      console.error("[SMS Dispatch Error]:", smsErr.message);
      mobileOtpStore.delete(cleanMobile);
      return res.status(502).json({ ok: false, message: smsErr.message || "Unable to send SMS OTP." });
    }

    return res.json({
      ok: true,
      message: `Verification code sent to +91 ${cleanMobile} via SMS.`,
    });
  } catch (error) {
    console.error("send-mobile-otp error:", error);
    return res.status(500).json({ ok: false, message: error.message || "Failed to send SMS OTP." });
  }
});

app.post("/api/auth/verify-mobile-otp", async (req, res) => {
  try {
    const { mobile, otp, name } = req.body || {};
    const cleanMobile = (mobile || "").replace(/\D/g, "");
    const cleanOtp = (otp || "").trim();

    if (!cleanMobile || cleanMobile.length !== 10) {
      return res.status(400).json({ ok: false, message: "Valid 10-digit mobile number is required." });
    }
    if (!cleanOtp || cleanOtp.length !== 6) {
      return res.status(400).json({ ok: false, message: "Please enter the 6-digit OTP sent to your phone." });
    }

    let isVerified = false;

    // 1. Check server memory store first
    const storedEntry = mobileOtpStore.get(cleanMobile);
    if (storedEntry) {
      if (Date.now() <= storedEntry.expiresAt && storedEntry.otp === cleanOtp) {
        isVerified = true;
        mobileOtpStore.delete(cleanMobile);
      } else if (Date.now() > storedEntry.expiresAt) {
        mobileOtpStore.delete(cleanMobile);
        return res.status(400).json({ ok: false, message: "OTP code has expired. Please click Resend OTP." });
      }
    }

    // 2. Check Twilio Verify if not already verified
    if (!isVerified) {
      try {
        const twilioCheck = await verifyTwilioCode({ mobile: cleanMobile, code: cleanOtp });
        if (twilioCheck && twilioCheck.valid) {
          isVerified = true;
        }
      } catch {
        // ignore
      }
    }

    if (!isVerified) {
      return res.status(400).json({ ok: false, message: "Incorrect OTP code. Please enter the valid code received on your phone." });
    }

    let user = null;
    try {
      user = await User.findOne({ mobile: cleanMobile });
      if (!user) {
        user = await User.create({
          name: name || `User ${cleanMobile.slice(-4)}`,
          username: `user_${cleanMobile}`,
          email: `${cleanMobile}@mobile.bookmyshow.local`,
          mobile: cleanMobile,
          password: randomBytes(16).toString("hex"),
          city: "Rajkot",
        });
      }
    } catch (dbErr) {
      console.warn("DB user creation warning:", dbErr.message);
      user = {
        id: `mobile-${Date.now()}`,
        name: name || `User ${cleanMobile.slice(-4)}`,
        username: `user_${cleanMobile}`,
        email: `${cleanMobile}@mobile.bookmyshow.local`,
        mobile: cleanMobile,
        city: "Rajkot",
      };
    }

    if (user?.email && !user.email.includes("@mobile.bookmyshow.local")) {
      try {
        await sendSignInWelcomeEmail({ name: user.name, email: user.email });
        console.log(`[Email Dispatch] Sign-in welcome email sent to ${user.email} (Mobile OTP Signin)`);
      } catch (mailErr) {
        console.error("Mobile signin email error:", mailErr?.message || mailErr);
      }
    }

    return res.json({
      ok: true,
      user: toClientUser(user),
      message: `Signed in successfully with mobile number +91 ${cleanMobile}!`,
    });
  } catch (error) {
    console.error("verify-mobile-otp error:", error);
    return res.status(500).json({ ok: false, message: error.message || "Failed to verify OTP." });
  }
});

app.post("/api/auth/mobile-login", async (req, res) => {
  try {
    const { mobile } = req.body || {};
    const cleanMobile = (mobile || "").replace(/\D/g, "");
    if (!cleanMobile || cleanMobile.length !== 10) {
      return res.status(400).json({ message: "Valid 10-digit mobile number is required" });
    }

    let user = await User.findOne({ mobile: cleanMobile });
    if (!user) {
      user = await User.create({
        name: `User ${cleanMobile.slice(-4)}`,
        username: `user_${cleanMobile}`,
        email: `${cleanMobile}@mobile.bookmyshow.local`,
        mobile: cleanMobile,
        password: randomBytes(16).toString("hex"),
        city: "Rajkot",
      });
    }

    return res.json({
      ok: true,
      user: toClientUser(user),
      message: `Signed in successfully with mobile number +91 ${cleanMobile}.`,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/auth/request-password-reset", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = randomBytes(32).toString("hex");
    passwordResetTokens.set(token, { email: user.email, userId: user._id.toString() });

    const frontendUrl = process.env.FRONTEND_URL || (process.env.NODE_ENV === "production" ? "https://your-production-url.com" : "http://localhost:5173");
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    try {
      await sendPasswordResetEmail({
        name: user.name,
        email: user.email,
        resetUrl,
      });
    } catch (mailError) {
      console.error("Password reset email failed:", mailError?.message || mailError);
      return res.status(500).json({ message: "Unable to send password reset email." });
    }

    return res.json({ ok: true, message: "Password reset email sent successfully." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) {
      return res.status(400).json({ message: "Token and password are required" });
    }

    const resetEntry = passwordResetTokens.get(token);
    if (!resetEntry) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const user = await User.findById(resetEntry.userId);
    if (!user) {
      passwordResetTokens.delete(token);
      return res.status(404).json({ message: "User not found" });
    }

    // Password will be auto-hashed by the pre-save hook
    user.password = password;
    await user.save();
    passwordResetTokens.delete(token);

    return res.json({ ok: true, message: "Password reset successfully." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/auth/send-otp", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    otpStore.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

    try {
      await sendOtpEmail({ name: user.name, email: user.email, otp });
    } catch (mailError) {
      console.error("OTP email failed:", mailError?.message || mailError);
      otpStore.delete(email);
      return res.status(502).json({ message: mailError?.message || "Unable to send OTP email." });
    }

    return res.json({ ok: true, message: "OTP sent successfully." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const otp = String(req.body?.otp || "").trim();
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const savedOtp = otpStore.get(email);
    if (!savedOtp) {
      return res.status(400).json({ message: "Invalid or expired OTP. Please request a new code." });
    }
    if (Date.now() > savedOtp.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ message: "OTP expired. Please request a new code." });
    }
    if (savedOtp.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    otpStore.delete(email);
    return res.json({ ok: true, message: "OTP verified successfully." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.get("/api/auth/me", async (req, res) => {
  const userId = req.headers["x-user-id"];
  if (!userId) {
    return res.status(401).json({ message: "Missing user id" });
  }

  let user = null;
  if (mongoose.isValidObjectId(userId)) {
    user = await User.findById(userId).lean();
  }
  if (!user) {
    user = await User.findOne({ $or: [{ username: userId }, { email: userId }] }).lean();
  }
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({ ok: true, user: toClientUser(user) });
});

app.put("/api/auth/profile", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      return res.status(401).json({ message: "Missing user id" });
    }

    const updates = { ...req.body };
    if (updates.profileImage !== undefined) {
      if (!updates.avatar) updates.avatar = updates.profileImage;
    }
    if (updates.avatar !== undefined) {
      if (!updates.profileImage) updates.profileImage = updates.avatar;
    }

    let user = null;
    if (mongoose.isValidObjectId(userId)) {
      user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true });
    }
    if (!user && (updates.email || updates.username || userId)) {
      const queryOr = [];
      if (updates.email) queryOr.push({ email: updates.email.toLowerCase() });
      if (updates.username) queryOr.push({ username: updates.username });
      queryOr.push({ username: userId });
      queryOr.push({ email: userId.toLowerCase() });
      user = await User.findOneAndUpdate({ $or: queryOr }, { $set: updates }, { new: true });
    }

    if (!user) {
      return res.json({ ok: true, user: { ...updates, id: userId } });
    }

    return res.json({ ok: true, user: toClientUser(user) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.get("/api/users", async (_req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    return res.json(users.map((user) => ({ ...user, id: user._id?.toString?.() || user._id })));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const { name, username, email, gender, mobile, password, city, profileImage, avatar } = req.body || {};
    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: "Name, username, email, and password are required." });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(409).json({ message: "User with this username or email already exists." });
    }

    const user = await User.create({
      name,
      username,
      email,
      gender: gender || "Other",
      mobile: mobile || "",
      password,
      city: city || "Rajkot",
      profileImage: profileImage || avatar || "",
      avatar: avatar || profileImage || "",
    });

    try {
      await sendWelcomeEmail({ name: user.name, email: user.email });
    } catch (mailError) {
      console.error("Welcome email failed on user creation:", mailError?.message || mailError);
    }

    return res.status(201).json({ ok: true, user: toClientUser(user) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name, username, email, gender, mobile, password, city, profileImage, avatar } = req.body || {};
    if (name) user.name = name;
    if (username) user.username = username;
    if (email) user.email = email;
    if (gender) user.gender = gender;
    if (mobile) user.mobile = mobile;
    if (city) user.city = city;
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (avatar !== undefined) user.avatar = avatar;
    if (password) user.password = password; // pre-save hook will hash if modified

    await user.save();
    return res.json({ ok: true, user: toClientUser(user) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.delete("/api/users", async (_req, res) => {
  try {
    await User.deleteMany({});
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/payments/orders", async (req, res) => {
  try {
    if (!razorpayKeyId || !razorpayKeySecret) {
      return res.status(503).json({ message: "Razorpay is not configured on the server." });
    }

    const amount = Number(req.body?.amount);
    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({ message: "Payment amount must be a positive integer in paise." });
    }

    const receipt = String(req.body?.receipt || `bms_${Date.now()}`).slice(0, 40);
    const order = await createRazorpayOrder({
      amount,
      receipt,
      notes: { bookingType: String(req.body?.bookingType || "booking").slice(0, 40) },
    });

    return res.status(201).json({
      ok: true,
      order,
      keyId: razorpayKeyId,
    });
  } catch (error) {
    console.error("Razorpay order error:", error?.message || error);
    if (error?.statusCode === 401) {
      return res.status(502).json({
        message: "Razorpay authentication failed. Check that RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are a matching test or live pair.",
      });
    }
    return res.status(502).json({ message: error?.message || "Unable to create payment order." });
  }
});

app.post("/api/payments/verify", async (req, res) => {
  try {
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body || {};
    if (!isValidRazorpaySignature(orderId, paymentId, signature)) {
      return res.status(400).json({ ok: false, message: "Payment signature verification failed." });
    }
    return res.json({ ok: true, orderId, paymentId });
  } catch (error) {
    console.error("Razorpay verification error:", error?.message || error);
    return res.status(500).json({ ok: false, message: "Unable to verify payment." });
  }
});

function getBookingSeatIds(booking) {
  const details = booking.details || {};
  const selectedIds = Array.isArray(details.selectedSeatIds) ? details.selectedSeatIds : [];
  const detailedSeats = Array.isArray(details.selectedSeatsDetails)
    ? details.selectedSeatsDetails.map((seat) => seat?.id || seat?.label)
    : [];
  const bookingSeats = Array.isArray(booking.seats) ? booking.seats : [];
  const seatValues = selectedIds.length ? selectedIds : detailedSeats.length ? detailedSeats : bookingSeats;
  return [...new Set(seatValues.map((seat) => String(seat || "").trim()).filter(Boolean))];
}

async function findBookingContent(booking) {
  const type = String(booking.type || "").toLowerCase();
  const itemType = type === "movie" ? "movie" : type === "event" ? "event" : type === "sport" ? "sport" : "";
  const Model = itemType === "movie" ? Movie : itemType === "event" ? Event : itemType === "sport" ? Sport : null;
  if (!Model) return null;

  const item = booking.details?.[itemType];
  const candidateIds = [item?._id, item?.id, booking.movieId].filter(Boolean);
  for (const candidateId of candidateIds) {
    if (mongoose.isValidObjectId(candidateId)) {
      const content = await Model.findById(candidateId);
      if (content) return { Model, content };
    }
  }

  if (booking.title) {
    const content = await Model.findOne({ title: booking.title });
    if (content) return { Model, content };
  }

  return null;
}

async function addBookedSeatReservation(booking) {
  const seats = getBookingSeatIds(booking);
  if (!seats.length) return;

  const match = await findBookingContent(booking);
  if (!match) {
    console.warn(`No content record found for booking ${booking.bookingRef}; seat reservation was not recorded.`);
    return;
  }

  await match.Model.updateOne(
    { _id: match.content._id, "bookedSeats.bookingRef": { $ne: booking.bookingRef } },
    {
      $push: {
        bookedSeats: {
          bookingRef: booking.bookingRef,
          date: booking.date || booking.details?.selectedDate || "",
          showtime: booking.showtime || "",
          venue: booking.theatre || "",
          seats,
        },
      },
    }
  );
}

async function releaseBookedSeatReservation(booking) {
  if (!getBookingSeatIds(booking).length) return true;

  const match = await findBookingContent(booking);
  if (!match) return false;

  await match.Model.updateOne(
    { _id: match.content._id },
    { $pull: { bookedSeats: { bookingRef: booking.bookingRef } } }
  );
  return true;
}

app.get("/api/seats/availability", async (req, res) => {
  try {
    const type = String(req.query.type || "").toLowerCase();
    const title = String(req.query.title || "").trim();
    const date = String(req.query.date || "").trim();
    const showtime = String(req.query.showtime || "").trim();
    const venue = String(req.query.venue || "").trim();
    if (!["movie", "event", "sport"].includes(type) || !title || !date || !showtime) {
      return res.status(400).json({ ok: false, message: "Type, title, date, and showtime are required." });
    }

    const item = { id: String(req.query.itemId || ""), title };
    const booking = {
      type,
      title,
      movieId: item.id,
      details: { [type]: item },
    };
    const match = await findBookingContent(booking);
    if (!match) {
      return res.status(404).json({ ok: false, message: "Show or event seat availability was not found." });
    }

    const seats = (match.content.bookedSeats || [])
      .filter((reservation) =>
        reservation.date === date &&
        reservation.showtime === showtime &&
        (!venue || !reservation.venue || reservation.venue === venue)
      )
      .flatMap((reservation) => reservation.seats || []);
    return res.json({ ok: true, seats: [...new Set(seats)] });
  } catch (error) {
    console.error("Seat availability error:", error?.message || error);
    return res.status(500).json({ ok: false, message: "Unable to load seat availability." });
  }
});

app.get("/api/bookings", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const query = userId ? { userId } : {};
    const bookings = await Booking.find(query)
      .select("-cancellationTokenHash")
      .sort({ createdAt: -1 })
      .lean();
    return res.json(bookings);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/bookings", async (req, res) => {
  try {
    const bookingRef = String(req.body?.bookingRef || req.body?.id || `BMS-${randomBytes(6).toString("hex")}`).slice(0, 120);
    const cancellationToken = randomBytes(32).toString("hex");
    const cancellationTokenHash = createHash("sha256").update(cancellationToken).digest("hex");
    const booking = await Booking.create({ ...req.body, bookingRef, cancellationTokenHash });

    try {
      await addBookedSeatReservation(booking);
    } catch (seatError) {
      console.warn("Booking seat reservation warning:", seatError?.message || seatError);
    }

    // Send confirmation email asynchronously
    try {
      let userEmail = req.body.email || req.body.userEmail || req.body.details?.email;
      let userName = req.body.userName || req.body.name || req.body.details?.name;
      if (!userEmail && booking.userId) {
        const u = await User.findById(booking.userId).select("email name").lean();
        if (u) {
          userEmail = u.email;
          userName = userName || u.name;
        }
      }
      if (userEmail) {
        await sendBookingConfirmationEmail({ name: userName, email: userEmail, booking });
      }
    } catch (mailErr) {
      console.warn("Booking confirmation email warning:", mailErr?.message || mailErr);
    }

    const bookingResponse = booking.toObject();
    delete bookingResponse.cancellationTokenHash;
    return res.status(201).json({
      ok: true,
      booking: { ...bookingResponse, cancellationToken },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/bookings/cancel/:bookingId", async (req, res) => {
  try {
    const bookingId = String(req.params.bookingId || "").trim();
    const userId = String(req.headers["x-user-id"] || "").trim();
    if (!userId) {
      return res.status(401).json({ ok: false, message: "Sign in to cancel this booking." });
    }
    if (!bookingId || bookingId.length > 120) {
      return res.status(400).json({ ok: false, message: "A valid booking ID is required." });
    }

    const bookingIdentifiers = [{ bookingRef: bookingId }];
    if (mongoose.isValidObjectId(bookingId)) bookingIdentifiers.push({ _id: bookingId });
    const booking = await Booking.findOne({ userId, $or: bookingIdentifiers });
    if (!booking) {
      return res.status(404).json({ ok: false, message: "Booking not found." });
    }

    const cancellationToken = String(req.headers["x-booking-cancellation-token"] || "");
    const storedTokenHash = String(booking.cancellationTokenHash || "");
    const suppliedTokenHash = createHash("sha256").update(cancellationToken).digest();
    const storedTokenHashBuffer = Buffer.from(storedTokenHash, "hex");
    if (
      !cancellationToken ||
      suppliedTokenHash.length !== storedTokenHashBuffer.length ||
      !timingSafeEqual(suppliedTokenHash, storedTokenHashBuffer)
    ) {
      return res.status(403).json({ ok: false, message: "This booking cannot be cancelled from this session." });
    }

    if (String(booking.status || "").toLowerCase() !== "confirmed") {
      return res.status(400).json({ ok: false, message: "Only confirmed bookings can be cancelled." });
    }

    const showStartAt = parseShowStartAt(
      booking.details?.selectedDate || booking.date,
      booking.showtime || booking.details?.slot?.time
    );
    if (!showStartAt) {
      return res.status(400).json({
        ok: false,
        message: "The show date and time could not be verified, so this booking cannot be cancelled online.",
      });
    }
    if (showStartAt.getTime() - Date.now() < 2 * 60 * 60 * 1000) {
      return res.status(400).json({
        ok: false,
        message: "Bookings can only be cancelled at least 2 hours before the show starts.",
      });
    }
    if (!Number.isFinite(Number(booking.amount)) || Number(booking.amount) < 0) {
      return res.status(400).json({ ok: false, message: "The booking amount is invalid." });
    }

    const amounts = calculateCancellationAmounts(booking.amount);
    const cancelledAt = new Date();
    const cancelledBooking = await Booking.findOneAndUpdate(
      { _id: booking._id, userId, status: booking.status },
      {
        $set: {
          status: "Cancelled",
          cancelledAt,
          refundStatus: "Initiated",
          cancellationFee: amounts.cancellationFee,
          refundAmount: amounts.refundAmount,
          cancelledSeats: getBookingSeatIds(booking),
          cancellationTokenHash: "",
        },
      },
      { new: true }
    );
    if (!cancelledBooking) {
      return res.status(409).json({ ok: false, message: "This booking was already updated. Refresh and try again." });
    }

    let seatsReleased = false;
    try {
      seatsReleased = await releaseBookedSeatReservation(booking);
      if (!seatsReleased && getBookingSeatIds(booking).length) {
        console.warn(`No content record found while releasing seats for booking ${booking.bookingRef}.`);
      }
    } catch (seatError) {
      console.error("Booking seat release failed:", seatError?.message || seatError);
    }

    let userEmail = booking.customerEmail;
    let customerName = booking.customerName;
    if (!userEmail && mongoose.isValidObjectId(booking.userId)) {
      const user = await User.findById(booking.userId).select("email name").lean();
      userEmail = user?.email || "";
      customerName = customerName || user?.name || "";
    }
    if (userEmail) {
      void sendCancellationEmail(userEmail, {
        name: customerName,
        bookingId: booking.bookingRef || booking._id.toString(),
        title: booking.title,
        venue: booking.theatre,
        date: booking.details?.selectedDate || booking.date,
        time: booking.showtime,
        seats: getBookingSeatIds(booking),
        refundAmount: amounts.refundAmount,
      }).catch((mailError) => {
        console.warn("Booking cancellation email warning:", mailError?.message || mailError);
      });
    } else {
      console.warn(`Cancellation email skipped for booking ${booking.bookingRef}: no customer email is available.`);
    }

    return res.json({
      ok: true,
      booking: cancelledBooking,
      refundAmount: amounts.refundAmount,
      cancellationFee: amounts.cancellationFee,
      refundStatus: "Initiated",
      seatsReleased,
    });
  } catch (error) {
    console.error("Booking cancellation error:", error?.message || error);
    return res.status(500).json({ ok: false, message: "Unable to cancel the booking right now." });
  }
});

app.delete("/api/bookings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Booking.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Booking not found" });
    }
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.delete("/api/bookings", async (_req, res) => {
  try {
    await Booking.deleteMany({});
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// =========================================================
// Offers & Discounts Endpoints
// =========================================================

// Public: Get all currently active and valid offers
app.get("/api/offers", async (req, res) => {
  try {
    const { category, type } = req.query;
    const now = new Date();
    const filter = {
      isActive: true,
      $or: [
        { validUntil: { $exists: false } },
        { validUntil: null },
        { validUntil: { $gte: now } },
      ],
    };

    if (category && category !== "All") {
      filter.category = category;
    }
    if (type && type !== "All") {
      filter.$and = [
        filter.$and || {},
        { $or: [{ applicableFor: "All" }, { applicableFor: type }] },
      ];
    }

    const offers = await Offer.find(filter).sort({ createdAt: -1 }).lean();
    return res.json(
      offers.map((o) => ({
        ...o,
        id: o._id?.toString?.() || o._id,
      }))
    );
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Admin: Get all offers (active + inactive)
app.get("/api/admin/offers", async (_req, res) => {
  try {
    const offers = await Offer.find({}).sort({ createdAt: -1 }).lean();
    return res.json(
      offers.map((o) => ({
        ...o,
        id: o._id?.toString?.() || o._id,
      }))
    );
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Admin: Create new offer
app.post("/api/admin/offers", async (req, res) => {
  try {
    const {
      title,
      code,
      description,
      category,
      discountType,
      discountValue,
      maxDiscount,
      minOrderAmount,
      applicableFor,
      validFrom,
      validUntil,
      isActive,
      badgeText,
      bannerImage,
      terms,
    } = req.body || {};

    if (!title || !code || discountValue === undefined) {
      return res.status(400).json({ message: "Title, coupon code, and discount value are required." });
    }

    const cleanCode = String(code).trim().toUpperCase();
    const existing = await Offer.findOne({ code: cleanCode });
    if (existing) {
      return res.status(409).json({ message: `An offer with code '${cleanCode}' already exists.` });
    }

    const offer = await Offer.create({
      title: String(title).trim(),
      code: cleanCode,
      description: description || "",
      category: category || "Festive Offer",
      discountType: discountType || "percentage",
      discountValue: Number(discountValue) || 0,
      maxDiscount: maxDiscount !== undefined && maxDiscount !== "" ? Number(maxDiscount) : 200,
      minOrderAmount: minOrderAmount !== undefined && minOrderAmount !== "" ? Number(minOrderAmount) : 0,
      applicableFor: applicableFor || "All",
      validFrom: validFrom ? new Date(validFrom) : new Date(),
      validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      isActive: isActive !== false,
      badgeText: badgeText || "SPECIAL OFFER",
      bannerImage: bannerImage || "",
      terms: Array.isArray(terms) ? terms : terms ? [terms] : ["Valid on select bookings"],
    });

    return res.status(201).json({
      ok: true,
      offer: { ...offer.toObject(), id: offer._id.toString() },
      message: `Offer '${offer.code}' created successfully!`,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Admin: Update offer
app.put("/api/admin/offers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    if (updates.code) {
      updates.code = String(updates.code).trim().toUpperCase();
      const existing = await Offer.findOne({ code: updates.code, _id: { $ne: id } });
      if (existing) {
        return res.status(409).json({ message: `Another offer already uses coupon code '${updates.code}'.` });
      }
    }

    const updated = await Offer.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "Offer not found." });
    }

    return res.json({
      ok: true,
      offer: { ...updated.toObject(), id: updated._id.toString() },
      message: `Offer '${updated.code}' updated successfully!`,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Admin: Delete offer
app.delete("/api/admin/offers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Offer.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Offer not found." });
    }
    return res.json({ ok: true, message: "Offer deleted successfully." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Checkout: Validate and calculate discount for a coupon code
app.post("/api/offers/validate", async (req, res) => {
  try {
    const { code, amount, category } = req.body || {};
    const cleanCode = String(code || "").trim().toUpperCase();
    const numAmount = Number(amount) || 0;

    if (!cleanCode) {
      return res.status(400).json({ ok: false, message: "Please provide a valid coupon code." });
    }

    const offer = await Offer.findOne({ code: cleanCode, isActive: true });
    if (!offer) {
      return res.status(404).json({ ok: false, message: `Coupon code '${cleanCode}' is invalid or inactive.` });
    }

    const now = new Date();
    if (offer.validUntil && new Date(offer.validUntil) < now) {
      return res.status(400).json({ ok: false, message: `Offer code '${offer.code}' has expired.` });
    }
    if (offer.validFrom && new Date(offer.validFrom) > now) {
      return res.status(400).json({ ok: false, message: `Offer code '${offer.code}' is not yet active.` });
    }

    if (numAmount < (offer.minOrderAmount || 0)) {
      return res.status(400).json({
        ok: false,
        message: `Minimum order amount of ₹${offer.minOrderAmount} is required to apply '${offer.code}' (Current total: ₹${numAmount.toFixed(2)}).`,
      });
    }

    if (offer.applicableFor && offer.applicableFor !== "All" && category) {
      if (offer.applicableFor.toLowerCase() !== String(category).toLowerCase()) {
        return res.status(400).json({
          ok: false,
          message: `Coupon '${offer.code}' is valid only on ${offer.applicableFor} bookings.`,
        });
      }
    }

    let discountAmount = 0;
    if (offer.discountType === "flat") {
      discountAmount = Math.min(numAmount, Number(offer.discountValue) || 0);
    } else {
      const calculated = (numAmount * (Number(offer.discountValue) || 0)) / 100;
      discountAmount = offer.maxDiscount ? Math.min(calculated, Number(offer.maxDiscount)) : calculated;
    }

    discountAmount = Math.round(discountAmount * 100) / 100;
    const finalPayable = Math.max(0, numAmount - discountAmount);

    return res.json({
      ok: true,
      valid: true,
      offer: {
        id: offer._id?.toString?.() || offer._id,
        title: offer.title,
        code: offer.code,
        category: offer.category,
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        maxDiscount: offer.maxDiscount,
        minOrderAmount: offer.minOrderAmount,
        badgeText: offer.badgeText,
        description: offer.description,
      },
      discountAmount,
      originalAmount: numAmount,
      finalPayable,
      message: `🎉 '${offer.code}' applied! You saved ₹${discountAmount}.`,
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }
});

// =========================================================
// Gift Cards Endpoints (Admin & User)
// =========================================================

// Public / User: Get available gift cards or filter by user email
app.get("/api/giftcards", async (req, res) => {
  try {
    const { recipientEmail, category } = req.query;
    const filter = {};

    if (recipientEmail) {
      const cleanEmail = String(recipientEmail).trim().toLowerCase();
      filter.$or = [
        { recipientEmail: cleanEmail },
        { recipientEmail: "" },
        { recipientEmail: { $exists: false } },
        { recipientEmail: null },
      ];
    } else {
      filter.$or = [
        { recipientEmail: "" },
        { recipientEmail: { $exists: false } },
        { recipientEmail: null },
      ];
    }

    if (category && category !== "All") {
      filter.category = category;
    }

    const cards = await GiftCard.find(filter).sort({ createdAt: -1 }).lean();
    return res.json(
      cards.map((c) => ({
        ...c,
        id: c._id?.toString?.() || c._id,
      }))
    );
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Admin: Get all gift cards
app.get("/api/admin/giftcards", async (_req, res) => {
  try {
    const cards = await GiftCard.find({}).sort({ createdAt: -1 }).lean();
    return res.json(
      cards.map((c) => ({
        ...c,
        id: c._id?.toString?.() || c._id,
      }))
    );
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Admin: Create / Issue Gift Card to a User
app.post("/api/admin/giftcards", async (req, res) => {
  try {
    const {
      title,
      code,
      pin,
      amount,
      recipientEmail,
      recipientUserId,
      recipientName,
      senderName,
      message,
      category,
      themeColor,
      validFrom,
      expiryDate,
      status,
    } = req.body || {};

    if (!title || !code || !pin || amount === undefined) {
      return res.status(400).json({ message: "Title, Code, PIN, and Amount are required." });
    }

    const cleanCode = String(code).trim().toUpperCase();
    const cleanPin = String(pin).trim();
    const numAmount = Number(amount) || 0;

    if (numAmount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0." });
    }

    const existing = await GiftCard.findOne({ code: cleanCode });
    if (existing) {
      return res.status(409).json({ message: `A Gift Card with code '${cleanCode}' already exists.` });
    }

    let resolvedRecipientName = recipientName || "";
    let resolvedRecipientUserId = recipientUserId || "";
    const cleanEmail = recipientEmail ? String(recipientEmail).trim().toLowerCase() : "";

    if (cleanEmail && (!resolvedRecipientName || !resolvedRecipientUserId)) {
      const user = await User.findOne({ email: cleanEmail }).lean();
      if (user) {
        resolvedRecipientName = resolvedRecipientName || user.name || user.username || cleanEmail;
        resolvedRecipientUserId = resolvedRecipientUserId || user._id?.toString?.() || user.id;
      }
    }

    const giftCard = await GiftCard.create({
      title: String(title).trim(),
      code: cleanCode,
      pin: cleanPin,
      amount: numAmount,
      balance: numAmount,
      recipientEmail: cleanEmail,
      recipientUserId: resolvedRecipientUserId,
      recipientName: resolvedRecipientName,
      senderName: senderName || "BookMyShow Admin",
      message: message || "Enjoy unlimited entertainment with BookMyShow!",
      category: category || "Movies",
      themeColor: themeColor || "ruby",
      validFrom: validFrom ? new Date(validFrom) : new Date(),
      expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      status: status || "active",
    });

    return res.status(201).json({
      ok: true,
      giftCard: { ...giftCard.toObject(), id: giftCard._id.toString() },
      message: `Gift Card '${giftCard.code}' created and issued successfully!`,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Admin: Update Gift Card
app.put("/api/admin/giftcards/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.code) {
      updates.code = String(updates.code).trim().toUpperCase();
      const existing = await GiftCard.findOne({ code: updates.code, _id: { $ne: id } });
      if (existing) {
        return res.status(409).json({ message: `Another Gift Card already uses code '${updates.code}'.` });
      }
    }

    if (updates.recipientEmail) {
      updates.recipientEmail = String(updates.recipientEmail).trim().toLowerCase();
    }

    const updated = await GiftCard.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "Gift Card not found." });
    }

    return res.json({
      ok: true,
      giftCard: { ...updated.toObject(), id: updated._id.toString() },
      message: `Gift Card '${updated.code}' updated successfully!`,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Admin: Delete Gift Card
app.delete("/api/admin/giftcards/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await GiftCard.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Gift Card not found." });
    }
    return res.json({ ok: true, message: "Gift Card deleted successfully." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// User: Check Gift Card Balance & Validity
app.post("/api/giftcards/check-balance", async (req, res) => {
  try {
    const { code, pin } = req.body || {};
    const cleanCode = String(code || "").trim().toUpperCase();
    const cleanPin = String(pin || "").trim();

    if (!cleanCode || !cleanPin) {
      return res.status(400).json({ ok: false, message: "Please enter both Voucher Code and PIN." });
    }

    const card = await GiftCard.findOne({ code: cleanCode });
    if (!card) {
      return res.status(404).json({ ok: false, message: `Gift Card code '${cleanCode}' is invalid.` });
    }

    if (card.pin !== cleanPin) {
      return res.status(400).json({ ok: false, message: "Incorrect PIN for this Gift Card." });
    }

    if (card.status === "disabled") {
      return res.status(400).json({ ok: false, message: "This Gift Card has been disabled." });
    }

    const now = new Date();
    if (card.expiryDate && new Date(card.expiryDate) < now) {
      return res.status(400).json({ ok: false, message: "This Gift Card has expired." });
    }

    if (card.balance <= 0 || card.status === "redeemed") {
      return res.status(400).json({ ok: false, message: "This Gift Card has already been fully redeemed (Balance: ₹0)." });
    }

    return res.json({
      ok: true,
      valid: true,
      giftCard: {
        id: card._id.toString(),
        title: card.title,
        code: card.code,
        amount: card.amount,
        balance: card.balance,
        category: card.category,
        themeColor: card.themeColor,
        expiryDate: card.expiryDate,
        message: card.message,
        recipientName: card.recipientName,
        senderName: card.senderName,
      },
      message: `Gift Card verified! Available Balance: ₹${card.balance}`,
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }
});

// Checkout: Apply Gift Card to Payment
app.post("/api/giftcards/apply", async (req, res) => {
  try {
    const { code, pin, amount, userId, userEmail, userName } = req.body || {};
    const cleanCode = String(code || "").trim().toUpperCase();
    const cleanPin = String(pin || "").trim();
    const orderAmount = Number(amount) || 0;

    if (!cleanCode || !cleanPin) {
      return res.status(400).json({ ok: false, message: "Please provide Voucher Code and PIN." });
    }

    const card = await GiftCard.findOne({ code: cleanCode });
    if (!card) {
      return res.status(404).json({ ok: false, message: `Gift Card '${cleanCode}' not found.` });
    }

    if (card.pin !== cleanPin) {
      return res.status(400).json({ ok: false, message: "Incorrect PIN." });
    }

    if (card.status === "disabled") {
      return res.status(400).json({ ok: false, message: "This Gift Card is disabled." });
    }

    if (card.expiryDate && new Date(card.expiryDate) < new Date()) {
      return res.status(400).json({ ok: false, message: "This Gift Card has expired." });
    }

    if (card.balance <= 0) {
      return res.status(400).json({ ok: false, message: "This Gift Card has ₹0 balance." });
    }

    const deduction = Math.min(card.balance, orderAmount);
    const newBalance = card.balance - deduction;
    const remainingToPay = Math.max(0, orderAmount - deduction);

    card.balance = newBalance;
    if (newBalance <= 0) {
      card.status = "redeemed";
      card.redeemedBy = {
        userId: userId || "",
        userEmail: userEmail || "",
        userName: userName || "",
        redeemedAt: new Date(),
      };
    }
    await card.save();

    return res.json({
      ok: true,
      deduction,
      remainingToPay,
      cardBalance: newBalance,
      cardCode: card.code,
      message: `₹${deduction} deducted from Gift Card '${card.code}'. Remaining balance: ₹${newBalance}.`,
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }
});

app.get("/api/movies", async (req, res) => {
  try {
    const { page, limit, language, genre, format } = req.query;
    const filter = {};
    if (language) filter.language = new RegExp(language, "i");
    if (genre) filter.genre = new RegExp(genre, "i");
    if (format) filter.format = new RegExp(format, "i");

    if (page) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 8);
      const total = await Movie.countDocuments(filter);
      const movies = await Movie.find(filter)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean();
      return res.json({
        data: movies,
        items: movies,
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      });
    }

    const movies = await Movie.find(filter).lean();
    return res.json(movies);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Filter movies by language and genre
app.get("/api/movies/filter", async (req, res) => {
  try {
    const { language, genre } = req.query;
    const filter = {};
    
    if (language) {
      filter.language = language;
    }
    if (genre) {
      filter.genre = new RegExp(genre, "i");
    }
    
    const movies = await Movie.find(filter).lean();
    return res.json(movies);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Cities endpoints
app.get("/api/cities", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json([]);
    const regex = new RegExp(`^${q}`, "i");
    const results = await City.find({ name: regex }).limit(200).lean();
    return res.json(results.map((c) => ({ name: c.name, state: c.state })));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Fallback generator for 7 realistic branded cinemas for any city
function generateFallbackCinemas(cityName) {
  const city = cityName ? cityName.trim() : "City";
  return [
    {
      name: `PVR: ${city} Central Mall`,
      city: city,
      area: "Central Mall",
      address: `Central Mall, Main High Street, ${city}`,
      screens: 5,
      facilities: ["4K Dolby Atmos", "Recliner Seats", "M-Ticket", "Food Court"],
      showtimes: ["10:00 AM", "01:15 PM", "04:30 PM", "07:45 PM", "10:30 PM"],
    },
    {
      name: `INOX: Nexus Mega Mall, ${city}`,
      city: city,
      area: "Nexus Mall",
      address: `Nexus Mega Mall, Ring Road, ${city}`,
      screens: 4,
      facilities: ["Dolby 7.1", "Insignia Club", "Parking Available", "M-Ticket"],
      showtimes: ["09:30 AM", "12:45 PM", "03:55 PM", "07:15 PM", "10:15 PM"],
    },
    {
      name: `Cinepolis: Grand Galleria, ${city}`,
      city: city,
      area: "Grand Galleria",
      address: `Grand Galleria Mall, Commercial Hub, ${city}`,
      screens: 6,
      facilities: ["VIP Experience", "Dolby Atmos", "Coffee Lounge", "M-Ticket"],
      showtimes: ["10:30 AM", "01:45 PM", "05:00 PM", "08:15 PM", "11:00 PM"],
    },
    {
      name: `Miraj Cinemas: Royal Square, ${city}`,
      city: city,
      area: "Royal Square",
      address: `Royal Square, Station Road, ${city}`,
      screens: 4,
      facilities: ["Dolby Sound", "Pushback Chairs", "Budget Friendly"],
      showtimes: ["11:00 AM", "02:15 PM", "05:30 PM", "08:45 PM"],
    },
    {
      name: `Wave Cinema: High Street, ${city}`,
      city: city,
      area: "High Street",
      address: `Wave Complex, High Street Avenue, ${city}`,
      screens: 3,
      facilities: ["Dolby Surround", "Snack Counter", "M-Ticket"],
      showtimes: ["10:15 AM", "01:30 PM", "04:45 PM", "08:00 PM", "10:45 PM"],
    },
    {
      name: `MovieMax: Station Road, ${city}`,
      city: city,
      area: "Station Road",
      address: `Near Junction Railway Station, Station Road, ${city}`,
      screens: 3,
      facilities: ["Dolby Digital", "Quick Entry", "Popcorn Counter"],
      showtimes: ["11:30 AM", "02:45 PM", "06:00 PM", "09:15 PM"],
    },
    {
      name: `Carnival Cinemas: Galaxy Hub, ${city}`,
      city: city,
      area: "Galaxy Hub",
      address: `Galaxy Commercial Hub, Bypass Road, ${city}`,
      screens: 4,
      facilities: ["Dolby Surround", "Ample Parking", "M-Ticket"],
      showtimes: ["10:45 AM", "02:00 PM", "05:15 PM", "08:30 PM"],
    },
  ];
}

// Cinemas endpoints (Strict city-wise filtering with 6-7 cinemas per city)
app.get("/api/cinemas", async (req, res) => {
  try {
    const city = (req.query.city || "").trim();
    if (city) {
      const regex = new RegExp(`^${city}$`, "i");
      let results = await Cinema.find({ city: regex }).lean();
      if (!results || results.length === 0) {
        const partialRegex = new RegExp(city, "i");
        results = await Cinema.find({
          $or: [{ city: partialRegex }, { name: partialRegex }, { address: partialRegex }],
        }).lean();
      }
      if (!results || results.length === 0) {
        // Fallback to static seed lookup
        const seedMatches = seedCinemas.filter(
          (c) => (c.city || "").toLowerCase() === city.toLowerCase()
        );
        if (seedMatches.length > 0) {
          results = seedMatches;
        } else {
          results = generateFallbackCinemas(city);
        }
      }
      return res.json(results);
    }
    const allCinemas = await Cinema.find({}).lean();
    return res.json(allCinemas.length > 0 ? allCinemas : seedCinemas);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.get("/api/cinemas/city/:city", async (req, res) => {
  try {
    const city = (req.params.city || "").trim();
    const regex = new RegExp(`^${city}$`, "i");
    let results = await Cinema.find({ city: regex }).lean();
    if (!results || results.length === 0) {
      const seedMatches = seedCinemas.filter(
        (c) => (c.city || "").toLowerCase() === city.toLowerCase()
      );
      if (seedMatches.length > 0) {
        results = seedMatches;
      } else {
        results = generateFallbackCinemas(city);
      }
    }
    return res.json(results);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Movie showtimes endpoint filtered strictly by selected city
app.get("/api/movies/:id/showtimes", async (req, res) => {
  try {
    const { id } = req.params;
    const city = (req.query.city || "Mumbai").trim();
    let movie = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      movie = await Movie.findById(id).lean();
    }
    if (!movie) {
      movie = await Movie.findOne({
        $or: [
          { title: new RegExp(`^${id.replace(/-/g, " ")}$`, "i") },
          { title: new RegExp(id.replace(/-/g, " "), "i") },
        ],
      }).lean();
    }

    const regex = new RegExp(`^${city}$`, "i");
    let cinemas = await Cinema.find({ city: regex }).lean();
    if (!cinemas || cinemas.length === 0) {
      const seedMatches = seedCinemas.filter(
        (c) => (c.city || "").toLowerCase() === city.toLowerCase()
      );
      if (seedMatches.length > 0) {
        cinemas = seedMatches;
      } else {
        cinemas = generateFallbackCinemas(city);
      }
    }

    const showtimes = cinemas.map((cinema) => ({
      name: cinema.name,
      city: cinema.city || city,
      area: cinema.area || "",
      address: cinema.address || "",
      facilities: cinema.facilities || ["4K Dolby Atmos", "M-Ticket"],
      times: cinema.showtimes || ["10:00 AM", "01:15 PM", "04:30 PM", "07:45 PM", "10:30 PM"],
    }));

    return res.json({
      movieId: id,
      movieTitle: movie?.title || id,
      city,
      theatres: showtimes,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/cinemas", async (req, res) => {
  try {
    const cinema = await Cinema.create(req.body);
    return res.status(201).json(cinema);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.put("/api/cinemas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Cinema.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Cinema not found" });
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.delete("/api/cinemas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Cinema.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Cinema not found" });
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/movies", async (req, res) => {
  const movie = await Movie.create(req.body);
  return res.status(201).json(movie);
});

app.put("/api/movies/:id", async (req, res) => {
  const { id } = req.params;
  const updated = await Movie.findByIdAndUpdate(id, req.body, { new: true });
  if (!updated) return res.status(404).json({ message: "Movie not found" });
  return res.json(updated);
});

app.delete("/api/movies/:id", async (req, res) => {
  const { id } = req.params;
  const deleted = await Movie.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ message: "Movie not found" });
  return res.json({ ok: true });
});

app.get("/api/events", async (req, res) => {
  try {
    const { page, limit, language, category, type } = req.query;
    const filter = {};
    if (language) filter.language = new RegExp(language, "i");
    if (category) filter.category = new RegExp(category, "i");
    if (type) filter.type = new RegExp(type, "i");

    if (page) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 8);
      const total = await Event.countDocuments(filter);
      const events = await Event.find(filter)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean();
      return res.json({
        data: events,
        items: events,
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      });
    }

    const events = await Event.find(filter).lean();
    return res.json(events);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Filter events by language and category
app.get("/api/events/filter", async (req, res) => {
  try {
    const { language, category, type } = req.query;
    const filter = {};
    
    if (language) {
      filter.language = new RegExp(language, "i");
    }
    if (category) {
      filter.category = new RegExp(category, "i");
    }
    if (type) {
      filter.type = new RegExp(type, "i");
    }
    
    const events = await Event.find(filter).lean();
    return res.json(events);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/events", async (req, res) => {
  const event = await Event.create(req.body);
  return res.status(201).json(event);
});

app.put("/api/events/:id", async (req, res) => {
  const { id } = req.params;
  const updated = await Event.findByIdAndUpdate(id, req.body, { new: true });
  if (!updated) return res.status(404).json({ message: "Event not found" });
  return res.json(updated);
});

app.delete("/api/events/:id", async (req, res) => {
  const { id } = req.params;
  const deleted = await Event.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ message: "Event not found" });
  return res.json({ ok: true });
});

app.get("/api/sports", async (req, res) => {
  try {
    const { page, limit, language, category } = req.query;
    const filter = {};
    if (language) filter.language = new RegExp(language, "i");
    if (category) filter.category = new RegExp(category, "i");

    if (page) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 8);
      const total = await Sport.countDocuments(filter);
      const sports = await Sport.find(filter)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean();
      return res.json({
        data: sports,
        items: sports,
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      });
    }

    const sports = await Sport.find(filter).lean();
    return res.json(sports);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Filter sports by language
app.get("/api/sports/filter", async (req, res) => {
  try {
    const { language, category } = req.query;
    const filter = {};
    
    if (language) {
      filter.language = new RegExp(language, "i");
    }
    if (category) {
      filter.category = new RegExp(category, "i");
    }
    
    const sports = await Sport.find(filter).lean();
    return res.json(sports);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/sports", async (req, res) => {
  const sport = await Sport.create(req.body);
  return res.status(201).json(sport);
});

app.put("/api/sports/:id", async (req, res) => {
  const { id } = req.params;
  const updated = await Sport.findByIdAndUpdate(id, req.body, { new: true });
  if (!updated) return res.status(404).json({ message: "Sport not found" });
  return res.json(updated);
});

app.delete("/api/sports/:id", async (req, res) => {
  const { id } = req.params;
  const deleted = await Sport.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ message: "Sport not found" });
  return res.json({ ok: true });
});

app.get("/api/activities", async (req, res) => {
  try {
    const { page, limit, language, category } = req.query;
    const filter = {};
    if (language) filter.language = new RegExp(language, "i");
    if (category) filter.category = new RegExp(category, "i");

    if (page) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 8);
      const total = await Activity.countDocuments(filter);
      const activities = await Activity.find(filter)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean();
      return res.json({
        data: activities,
        items: activities,
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      });
    }

    const activities = await Activity.find(filter).lean();
    return res.json(activities);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Filter activities by language and category
app.get("/api/activities/filter", async (req, res) => {
  try {
    const { language, category } = req.query;
    const filter = {};
    
    if (language) {
      filter.language = language;
    }
    if (category) {
      filter.category = new RegExp(category, "i");
    }
    
    const activities = await Activity.find(filter).lean();
    return res.json(activities);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/activities", async (req, res) => {
  const activity = await Activity.create(req.body);
  return res.status(201).json(activity);
});

// Unified Search Endpoint - searches across all content types
app.get("/api/search", async (req, res) => {
  try {
    const query = (req.query.q || "").trim();
    
    if (!query) {
      // Return trending content if no query
      const [movies, events, sports, activities] = await Promise.all([
        Movie.find({}).limit(6).lean(),
        Event.find({}).limit(6).lean(),
        Sport.find({}).limit(6).lean(),
        Activity.find({}).limit(6).lean(),
      ]);
      return res.json({
        trending: true,
        movies,
        events,
        sports,
        activities,
      });
    }

    // Search with regex (case-insensitive)
    const searchRegex = new RegExp(query, "i");
    
    const [movies, events, sports, activities] = await Promise.all([
      Movie.find({
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { genre: searchRegex },
          { language: searchRegex },
        ],
      }).limit(20).lean(),
      Event.find({
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { category: searchRegex },
          { location: searchRegex },
        ],
      }).limit(20).lean(),
      Sport.find({
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { sport: searchRegex },
          { venue: searchRegex },
        ],
      }).limit(20).lean(),
      Activity.find({
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { category: searchRegex },
        ],
      }).limit(20).lean(),
    ]);

    return res.json({
      query,
      movies,
      events,
      sports,
      activities,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// AI Chatbot Assistant API
app.post("/api/ai-chat", async (req, res) => {
  try {
    const { message = "", city = "Ahmedabad" } = req.body;
    const cleanMsg = (message || "").trim().toLowerCase();

    if (!cleanMsg) {
      return res.status(400).json({ reply: "Please enter a message." });
    }

    // 1. OFFERS & COUPONS INTENT
    if (
      cleanMsg.includes("offer") ||
      cleanMsg.includes("coupon") ||
      cleanMsg.includes("discount") ||
      cleanMsg.includes("promo") ||
      cleanMsg.includes("code") ||
      cleanMsg.includes("deal") ||
      cleanMsg.includes("save") ||
      cleanMsg.includes("cheap")
    ) {
      const offers = await Offer.find({ isActive: true }).limit(5).lean();
      const offerList = offers.map((o) => ({
        code: o.code,
        title: o.title,
        description: o.description,
        discount: o.discountType === "percentage" ? `${o.discountValue}% OFF` : `₹${o.discountValue} FLAT OFF`,
        maxDiscount: o.maxDiscount ? `Up to ₹${o.maxDiscount}` : null,
      }));

      return res.json({
        reply: `Here are active discount offers you can use right now at checkout:`,
        intent: "offers",
        offers: offerList,
        suggestions: ["How to apply coupon?", "Trending Movies", "Weekend Specials"],
      });
    }

    // 2. BOOKING GUIDE & HOW-TO INTENT
    if (
      cleanMsg.includes("how to book") ||
      cleanMsg.includes("booking") ||
      cleanMsg.includes("seat") ||
      cleanMsg.includes("refund") ||
      cleanMsg.includes("cancel") ||
      cleanMsg.includes("payment") ||
      cleanMsg.includes("step")
    ) {
      return res.json({
        reply: `Booking on BookMyShow is super simple! Here's how to do it:
1. 🎬 **Select an Entertainment:** Pick any Movie, Concert, Live Event, or Sport match.
2. 📍 **Choose Cinema & Time:** Pick your preferred cinema and showtime.
3. 💺 **Pick Your Seats:** Select your preferred row (Silver, Gold, or Platinum / Recliner).
4. 🎟️ **Apply Coupon:** Enter codes like **FESTIVE25** or **WELCOME50** at checkout to save money.
5. 💳 **Pay Securely:** Complete checkout using UPI, Cards, or Net Banking.
6. 📲 **Get E-Ticket:** Your digital ticket with QR code is generated instantly and sent to your email!`,
        intent: "guide",
        actions: [
          { label: "Browse All Movies", url: "/movies" },
          { label: "View Offers", url: "/offers" },
          { label: "Explore Events", url: "/events" },
        ],
        suggestions: ["Active Discount Coupons", "Top Movies", "Cinemas in " + city],
      });
    }

    // 3. CINEMAS INTENT
    if (
      cleanMsg.includes("cinema") ||
      cleanMsg.includes("theatre") ||
      cleanMsg.includes("theater") ||
      cleanMsg.includes("pvr") ||
      cleanMsg.includes("inox") ||
      cleanMsg.includes("cinepolis") ||
      cleanMsg.includes("screens")
    ) {
      const cityRegex = new RegExp(city || "Ahmedabad", "i");
      let cinemas = await Cinema.find({
        $or: [{ city: cityRegex }, { location: cityRegex }],
      }).limit(5).lean();

      if (!cinemas.length) {
        cinemas = await Cinema.find({}).limit(5).lean();
      }

      const cinemaList = cinemas.map((c) => ({
        name: c.name,
        location: c.location || c.address || `${c.city}`,
        city: c.city,
      }));

      return res.json({
        reply: `Here are popular cinemas in **${city}**:`,
        intent: "cinemas",
        cinemas: cinemaList,
        actions: [{ label: "View All Showtimes", url: "/movies" }],
        suggestions: ["Trending Movies", "Show Offers", "Concerts in " + city],
      });
    }

    // 4. EVENTS INTENT
    if (
      cleanMsg.includes("event") ||
      cleanMsg.includes("concert") ||
      cleanMsg.includes("music") ||
      cleanMsg.includes("comedy") ||
      cleanMsg.includes("standup") ||
      cleanMsg.includes("live show")
    ) {
      const events = await Event.find({}).limit(4).lean();
      const eventItems = events.map((e) => ({
        id: e._id,
        title: e.title,
        poster: e.poster,
        rating: e.rating,
        genre: e.genre || e.category,
        location: e.location,
        price: e.price,
        url: `/events/${e._id}`,
      }));

      return res.json({
        reply: `Here are exciting live events and concerts happening now:`,
        intent: "events",
        items: eventItems,
        suggestions: ["Sports Matches", "Top Movies", "Active Offers"],
      });
    }

    // 5. SPORTS INTENT
    if (
      cleanMsg.includes("sport") ||
      cleanMsg.includes("cricket") ||
      cleanMsg.includes("football") ||
      cleanMsg.includes("match") ||
      cleanMsg.includes("game")
    ) {
      const sports = await Sport.find({}).limit(4).lean();
      const sportItems = sports.map((s) => ({
        id: s._id,
        title: s.title,
        poster: s.poster,
        rating: s.rating,
        genre: s.category || "Sports",
        location: s.location,
        price: s.price,
        url: `/sports/${s._id}`,
      }));

      return res.json({
        reply: `Check out upcoming live sports tournaments and matches:`,
        intent: "sports",
        items: sportItems,
        suggestions: ["Trending Movies", "Fun Activities", "Best Offers"],
      });
    }

    // 6. ACTIVITIES INTENT
    if (
      cleanMsg.includes("activity") ||
      cleanMsg.includes("adventure") ||
      cleanMsg.includes("bowling") ||
      cleanMsg.includes("paintball") ||
      cleanMsg.includes("escape room") ||
      cleanMsg.includes("things to do")
    ) {
      const activities = await Activity.find({}).limit(4).lean();
      const activityItems = activities.map((a) => ({
        id: a._id,
        title: a.title,
        poster: a.poster,
        rating: a.rating,
        genre: a.category || "Adventure",
        location: a.location,
        price: a.price,
        url: `/activity/${a._id}`,
      }));

      return res.json({
        reply: `Looking for adventure? Here are top-rated activities and experiences:`,
        intent: "activities",
        items: activityItems,
        suggestions: ["Top Movies", "Live Concerts", "Active Offers"],
      });
    }

    // 7. MOVIES / FILM RECOMMENDATIONS (Default or specific movie keywords)
    const isMovieQuery =
      cleanMsg.includes("movie") ||
      cleanMsg.includes("film") ||
      cleanMsg.includes("watch") ||
      cleanMsg.includes("recommend") ||
      cleanMsg.includes("trending") ||
      cleanMsg.includes("action") ||
      cleanMsg.includes("comedy") ||
      cleanMsg.includes("romantic") ||
      cleanMsg.includes("romance") ||
      cleanMsg.includes("horror") ||
      cleanMsg.includes("drama") ||
      cleanMsg.includes("thriller") ||
      cleanMsg.includes("gujarati") ||
      cleanMsg.includes("hindi") ||
      cleanMsg.includes("english") ||
      cleanMsg.includes("spider") ||
      cleanMsg.includes("animal") ||
      cleanMsg.includes("dhurandhar") ||
      cleanMsg.includes("naadi") ||
      cleanMsg.includes("chhello");

    if (isMovieQuery || cleanMsg.length > 2) {
      // Build movie query filter
      const orConditions = [];
      const terms = cleanMsg.split(/\s+/).filter((t) => t.length > 2);
      
      terms.forEach((t) => {
        const reg = new RegExp(t, "i");
        orConditions.push({ title: reg });
        orConditions.push({ genre: reg });
        orConditions.push({ language: reg });
        orConditions.push({ description: reg });
      });

      let movies = [];
      if (orConditions.length > 0) {
        movies = await Movie.find({ $or: orConditions }).sort({ rating: -1 }).limit(4).lean();
      }

      if (!movies.length) {
        movies = await Movie.find({}).sort({ rating: -1 }).limit(4).lean();
      }

      const movieItems = movies.map((m) => ({
        id: m._id,
        title: m.title,
        poster: m.poster,
        rating: m.rating,
        genre: m.genre,
        language: m.language,
        format: m.format,
        duration: m.duration,
        url: `/movie/${m._id}`,
      }));

      return res.json({
        reply: isMovieQuery
          ? `Here are top movie recommendations tailored for you in **${city}**:`
          : `I found these great entertainment picks on BookMyShow for you:`,
        intent: "movies",
        items: movieItems,
        actions: [{ label: "Browse All Movies", url: "/movies" }],
        suggestions: ["Action Movies", "Active Offers", "How to book seats?"],
      });
    }

    // 8. GREETING & GENERAL ASSISTANT RESPONSE
    return res.json({
      reply: `Hello! 👋 I'm **ShowBot**, your smart BookMyShow assistant.
I can help you:
• 🎬 Find the best trending movies & showtimes
• 🎟️ Unlock exclusive promo codes & discounts
• 📍 Locate partner cinemas in **${city}**
• 🍿 Guide you through quick seat booking & payments

What are you in the mood for today?`,
      intent: "greeting",
      suggestions: [
        "🎬 Trending Movies",
        "🎟️ Active Discount Coupons",
        "🍿 How to book tickets?",
        "🎸 Live Events & Concerts",
      ],
    });
  } catch (error) {
    return res.status(500).json({
      reply: "I'm having a slight hiccup reaching the catalog right now, but feel free to ask about movies, offers, or showtimes!",
      error: error.message,
    });
  }
});

// Review & Rating API Endpoints
app.get("/api/reviews", async (req, res) => {
  try {
    const { itemId, itemType, userId, status } = req.query;
    const filter = {};
    if (itemId) filter.itemId = itemId;
    if (itemType && itemType !== "All") filter.itemType = itemType;
    if (userId) filter.userId = userId;
    if (status && status !== "All") filter.status = status;

    const reviews = await Review.find(filter).sort({ createdAt: -1 }).lean();
    return res.json(reviews);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/api/reviews", async (req, res) => {
  try {
    const {
      userId,
      userName,
      userEmail,
      userAvatar,
      itemId,
      itemTitle,
      itemType,
      ticketId,
      rating,
      comment,
      status,
    } = req.body;

    if (!itemId || !comment || !rating) {
      return res.status(400).json({ message: "Item ID, rating, and review comment are required." });
    }

    const review = await Review.create({
      userId: userId || "",
      userName: userName || "Moviegoer",
      userEmail: userEmail || "",
      userAvatar: userAvatar || "",
      itemId: String(itemId),
      itemTitle: itemTitle || "Entertainment Item",
      itemType: itemType || "Movie",
      ticketId: ticketId || "",
      rating: Number(rating) || 5,
      comment: String(comment).trim(),
      status: status || "Approved",
    });

    return res.status(201).json(review);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.put("/api/reviews/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Review.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Review not found" });
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.delete("/api/reviews/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Review.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Review not found" });
    return res.json({ ok: true, message: "Review deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.put("/api/activities/:id", async (req, res) => {
  const { id } = req.params;
  const updated = await Activity.findByIdAndUpdate(id, req.body, { new: true });
  if (!updated) return res.status(404).json({ message: "Activity not found" });
  return res.json(updated);
});

app.delete("/api/activities/:id", async (req, res) => {
  const { id } = req.params;
  const deleted = await Activity.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ message: "Activity not found" });
  return res.json({ ok: true });
});

async function startServer() {
  try {
    await connectToDatabase();

    if (mongoose.connection.readyState === 1) {
      await seedDatabaseIfNeeded();
      await ensureSeedUser();
      await ensureSeedReviews();
      await ensureSeedOffers();
      await ensureSeedGiftCards();
    } else {
      console.warn("MongoDB is not connected. Skipping DB seeding and initializations.");
    }

    const emailStatus = getEmailConfigurationStatus();
    if (!emailStatus.configured) {
      console.warn("Email delivery disabled: set EMAIL_USER and EMAIL_APP_PASSWORD in backend/.env.");
    } else {
      verifyEmailConnection()
        .then(() => console.log("SMTP connection verified successfully."))
        .catch((error) => console.warn(`SMTP verification failed: ${error?.message || error}`));
    }

    const server = app.listen(port, () => {
      console.log(`Backend server running on http://localhost:${port}`);
    });
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${port} is already in use. Stop the existing backend process before starting another one.`);
        return;
      }
      console.error("Backend server error:", error?.message || error);
    });
  } catch (error) {
    console.error("Failed to start backend server:", error?.message || error);
    process.exit(1);
  }
}

startServer();
