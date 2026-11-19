import {
  createOfferApi,
  deleteOfferApi,
  getAdminOffersApi,
  getOffersApi,
  updateOfferApi,
  validateOfferCodeApi,
} from "./api";

const OFFERS_STORAGE_KEY = "bookmyshow_admin_offers";

export const DEFAULT_OFFERS = [
  {
    id: "offer-festive-dhamaka",
    title: "Festive Dhamaka Special Offer",
    code: "FESTIVE25",
    description: "Celebrate festive joy with a flat 25% discount up to ₹150 across movies, concerts, and live shows!",
    category: "Festive Offer",
    discountType: "percentage",
    discountValue: 25,
    maxDiscount: 150,
    minOrderAmount: 200,
    applicableFor: "All",
    validFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    badgeText: "FESTIVE SPECIAL",
    bannerImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
    terms: [
      "Get 25% off up to maximum ₹150.",
      "Minimum booking amount required is ₹200.",
      "Valid on movies, events, sports, and activities.",
      "Applicable once per user transaction.",
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: "offer-last-minute-rush",
    title: "Last Minute Movie Rush",
    code: "LASTMIN100",
    description: "Catch last-minute blockbuster shows and save flat ₹100 instantly on your cinema tickets!",
    category: "Last Minute Offer",
    discountType: "flat",
    discountValue: 100,
    maxDiscount: 100,
    minOrderAmount: 250,
    applicableFor: "Movie",
    validFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    badgeText: "LAST MINUTE",
    bannerImage: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80",
    terms: [
      "Instant flat ₹100 discount on movie bookings.",
      "Minimum transaction value of ₹250.",
      "Valid across all partner cinema screens.",
      "Can be applied at checkout directly.",
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: "offer-weekend-blockbuster",
    title: "Weekend Blockbuster Deal",
    code: "WEEKEND50",
    description: "Kickstart your weekend entertainment with an instant 20% discount up to ₹100!",
    category: "Special Deal",
    discountType: "percentage",
    discountValue: 20,
    maxDiscount: 100,
    minOrderAmount: 150,
    applicableFor: "All",
    validFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    badgeText: "WEEKEND SPECIAL",
    bannerImage: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80",
    terms: [
      "20% discount capped at ₹100.",
      "Valid on all categories across Saturday and Sunday.",
      "Minimum purchase requirement of ₹150.",
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: "offer-welcome-new-user",
    title: "New User Welcome Discount",
    code: "WELCOME50",
    description: "Welcome to BookMyShow! Get flat ₹50 discount on your booking.",
    category: "Promo Code",
    discountType: "flat",
    discountValue: 50,
    maxDiscount: 50,
    minOrderAmount: 100,
    applicableFor: "All",
    validFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    badgeText: "NEW USER",
    bannerImage: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&auto=format&fit=crop&q=80",
    terms: [
      "Flat ₹50 discount on minimum booking of ₹100.",
      "Valid for bookings on all entertainment categories.",
    ],
    createdAt: new Date().toISOString(),
  },
];

const isBrowser = () => typeof window !== "undefined";

export function getStoredOffers() {
  if (!isBrowser()) return DEFAULT_OFFERS;
  try {
    const raw = localStorage.getItem(OFFERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(DEFAULT_OFFERS));
      return DEFAULT_OFFERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_OFFERS;
  } catch {
    return DEFAULT_OFFERS;
  }
}

export function saveStoredOffers(offers) {
  if (!isBrowser()) return offers;
  localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(offers));
  try {
    window.dispatchEvent(new CustomEvent("offersUpdated", { detail: offers }));
  } catch {
    // ignore
  }
  return offers;
}

export async function getAllOffers(params = {}) {
  try {
    const serverOffers = await getOffersApi(params);
    if (Array.isArray(serverOffers) && serverOffers.length > 0) {
      saveStoredOffers(serverOffers);
      return serverOffers;
    }
  } catch {
    // fallback to local
  }

  const local = getStoredOffers();
  const now = new Date();
  return local.filter((o) => {
    if (!o.isActive) return false;
    if (o.validUntil && new Date(o.validUntil) < now) return false;
    if (params.category && params.category !== "All" && o.category !== params.category) return false;
    if (params.type && params.type !== "All" && o.applicableFor !== "All" && o.applicableFor !== params.type) return false;
    return true;
  });
}

export async function getAdminOffers() {
  try {
    const serverOffers = await getAdminOffersApi();
    if (Array.isArray(serverOffers) && serverOffers.length > 0) {
      saveStoredOffers(serverOffers);
      return serverOffers;
    }
  } catch {
    // fallback to local
  }
  return getStoredOffers();
}

export async function createOffer(offerData) {
  const newOffer = {
    ...offerData,
    id: offerData.id || `offer-${Date.now()}`,
    code: String(offerData.code || "").trim().toUpperCase(),
    createdAt: new Date().toISOString(),
    isActive: offerData.isActive !== false,
  };

  try {
    const response = await createOfferApi(newOffer);
    if (response?.offer) {
      const current = getStoredOffers();
      const updated = [response.offer, ...current.filter((o) => o.id !== response.offer.id)];
      saveStoredOffers(updated);
      return response.offer;
    }
  } catch {
    // Local fallback
  }

  const current = getStoredOffers();
  const updated = [newOffer, ...current.filter((o) => o.code !== newOffer.code)];
  saveStoredOffers(updated);
  return newOffer;
}

export async function updateOffer(id, updates) {
  try {
    const response = await updateOfferApi(id, updates);
    if (response?.offer) {
      const current = getStoredOffers();
      const updated = current.map((o) => (o.id === id || o._id === id ? { ...o, ...response.offer } : o));
      saveStoredOffers(updated);
      return response.offer;
    }
  } catch {
    // Local fallback
  }

  const current = getStoredOffers();
  const updated = current.map((o) => (o.id === id || o._id === id ? { ...o, ...updates } : o));
  saveStoredOffers(updated);
  return updated.find((o) => o.id === id || o._id === id);
}

export async function deleteOffer(id) {
  try {
    await deleteOfferApi(id);
  } catch {
    // Local fallback
  }

  const current = getStoredOffers();
  const updated = current.filter((o) => o.id !== id && o._id !== id);
  saveStoredOffers(updated);
  return true;
}

export async function validateAndApplyCoupon({ code, amount, category }) {
  const cleanCode = String(code || "").trim().toUpperCase();
  const numAmount = Number(amount) || 0;

  if (!cleanCode) {
    return { ok: false, message: "Please enter a valid coupon code." };
  }

  // 1. Try server verification
  try {
    const result = await validateOfferCodeApi({ code: cleanCode, amount: numAmount, category });
    if (result && (result.valid || result.ok)) {
      return result;
    }
  } catch {
    // Server offline or endpoint unreachable -> smoothly fallback to local verification
  }

  // 2. Local fallback validation
  const allOffers = getStoredOffers();
  const offer = allOffers.find(
    (o) => (o.code || "").toUpperCase() === cleanCode && (o.isActive !== false)
  );

  if (!offer) {
    return {
      ok: false,
      message: `Coupon code '${cleanCode}' is invalid. Please try FESTIVE25, WELCOME50, WEEKEND50, or LASTMIN100.`,
    };
  }

  const now = new Date();
  if (offer.validUntil && new Date(offer.validUntil) < now) {
    return { ok: false, message: `Offer '${offer.code}' has expired.` };
  }
  if (offer.validFrom && new Date(offer.validFrom) > now) {
    return { ok: false, message: `Offer '${offer.code}' is not yet active.` };
  }

  const minRequired = Number(offer.minOrderAmount) || 0;
  if (numAmount < minRequired) {
    return {
      ok: false,
      message: `Minimum order amount of ₹${minRequired} is required for coupon '${offer.code}' (Current total: ₹${numAmount.toFixed(2)}).`,
    };
  }

  if (offer.applicableFor && offer.applicableFor !== "All" && category && category !== "All") {
    const offerCat = String(offer.applicableFor).toLowerCase().replace(/s$/, "");
    const currentCat = String(category).toLowerCase().replace(/s$/, "");
    if (offerCat !== currentCat) {
      return {
        ok: false,
        message: `This coupon is valid only for ${offer.applicableFor} bookings.`,
      };
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

  return {
    ok: true,
    valid: true,
    offer,
    discountAmount,
    originalAmount: numAmount,
    finalPayable,
    message: `🎉 '${offer.code}' applied successfully! You saved ₹${discountAmount}.`,
  };
}
