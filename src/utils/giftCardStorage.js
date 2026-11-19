import {
  applyGiftCardPaymentApi,
  checkGiftCardBalanceApi,
  createGiftCardApi,
  deleteGiftCardApi,
  getAdminGiftCardsApi,
  getGiftCardsApi,
  updateGiftCardApi,
} from "./api";

const GIFT_CARDS_STORAGE_KEY = "bookmyshow_admin_giftcards";

export const DEFAULT_GIFT_CARDS = [
  {
    id: "giftcard-movie-buff-500",
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
    validFrom: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "giftcard-festive-joy-1000",
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
    validFrom: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "giftcard-vip-executive-2000",
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
    validFrom: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
    createdAt: new Date().toISOString(),
  },
];

function readLocalGiftCards() {
  if (typeof window === "undefined") return DEFAULT_GIFT_CARDS;
  try {
    const raw = localStorage.getItem(GIFT_CARDS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(GIFT_CARDS_STORAGE_KEY, JSON.stringify(DEFAULT_GIFT_CARDS));
      return DEFAULT_GIFT_CARDS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_GIFT_CARDS;
  } catch {
    return DEFAULT_GIFT_CARDS;
  }
}

function writeLocalGiftCards(cards) {
  if (typeof window === "undefined") return cards;
  try {
    localStorage.setItem(GIFT_CARDS_STORAGE_KEY, JSON.stringify(cards));
    window.dispatchEvent(new CustomEvent("giftCardsUpdated", { detail: cards }));
  } catch {
    // ignore
  }
  return cards;
}

// Admin: Get all gift cards
export async function getAllGiftCardsAdmin() {
  try {
    const data = await getAdminGiftCardsApi();
    if (Array.isArray(data) && data.length > 0) {
      writeLocalGiftCards(data);
      return data;
    }
    return readLocalGiftCards();
  } catch {
    return readLocalGiftCards();
  }
}

// User: Get active gift cards (assigned to user or open)
export async function getUserGiftCards(userEmail = "") {
  const cleanEmail = String(userEmail || "").trim().toLowerCase();
  try {
    const data = await getGiftCardsApi({ recipientEmail: cleanEmail });
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch {
    // fallback to local
  }

  const all = readLocalGiftCards();
  if (!cleanEmail) {
    return all.filter((c) => !c.recipientEmail && c.status === "active");
  }
  return all.filter(
    (c) =>
      (!c.recipientEmail || c.recipientEmail.toLowerCase() === cleanEmail) &&
      c.status === "active"
  );
}

// Admin: Create Gift Card
export async function createGiftCard(cardData) {
  const cleanCode = String(cardData.code || `BMS-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`).trim().toUpperCase();
  const cleanPin = String(cardData.pin || Math.floor(1000 + Math.random() * 9000)).trim();
  const amount = Number(cardData.amount) || 500;

  const payload = {
    ...cardData,
    code: cleanCode,
    pin: cleanPin,
    amount,
    balance: amount,
    recipientEmail: cardData.recipientEmail ? String(cardData.recipientEmail).trim().toLowerCase() : "",
    recipientName: cardData.recipientName || "",
    recipientUserId: cardData.recipientUserId || "",
    senderName: cardData.senderName || "BookMyShow Admin",
    message: cardData.message || "Enjoy unlimited entertainment with BookMyShow!",
    category: cardData.category || "Movies",
    themeColor: cardData.themeColor || "ruby",
    validFrom: cardData.validFrom || new Date().toISOString(),
    expiryDate: cardData.expiryDate || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    status: cardData.status || "active",
  };

  try {
    const res = await createGiftCardApi(payload);
    if (res?.giftCard) {
      const current = readLocalGiftCards();
      writeLocalGiftCards([res.giftCard, ...current.filter((c) => c.code !== cleanCode)]);
      return res.giftCard;
    }
  } catch (err) {
    console.warn("Backend createGiftCardApi failed, saving locally:", err?.message);
  }

  // Local fallback
  const localCard = {
    ...payload,
    id: `giftcard-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const current = readLocalGiftCards();
  writeLocalGiftCards([localCard, ...current]);
  return localCard;
}

// Admin: Update Gift Card
export async function updateGiftCard(id, updates) {
  try {
    const res = await updateGiftCardApi(id, updates);
    if (res?.giftCard) {
      const current = readLocalGiftCards();
      writeLocalGiftCards(current.map((c) => (c.id === id || c._id === id ? res.giftCard : c)));
      return res.giftCard;
    }
  } catch (err) {
    console.warn("Backend updateGiftCardApi failed, updating locally:", err?.message);
  }

  const current = readLocalGiftCards();
  const index = current.findIndex((c) => c.id === id || c._id === id);
  if (index !== -1) {
    const updated = { ...current[index], ...updates };
    current[index] = updated;
    writeLocalGiftCards(current);
    return updated;
  }
  return null;
}

// Admin: Delete Gift Card
export async function deleteGiftCard(id) {
  try {
    await deleteGiftCardApi(id);
  } catch (err) {
    console.warn("Backend deleteGiftCardApi failed, deleting locally:", err?.message);
  }

  const current = readLocalGiftCards();
  const next = current.filter((c) => c.id !== id && c._id !== id);
  writeLocalGiftCards(next);
  return true;
}

// User: Check Gift Card Balance & Validity
export async function checkGiftCardBalance(code, pin) {
  const cleanCode = String(code || "").trim().toUpperCase();
  const cleanPin = String(pin || "").trim();

  if (!cleanCode || !cleanPin) {
    return { ok: false, message: "Please provide both Voucher Code and PIN." };
  }

  try {
    const res = await checkGiftCardBalanceApi({ code: cleanCode, pin: cleanPin });
    if (res?.ok) return res;
  } catch {
    // fallback to local check
  }

  const cards = readLocalGiftCards();
  const found = cards.find((c) => c.code.toUpperCase() === cleanCode);
  if (!found) {
    return { ok: false, message: `Gift Card '${cleanCode}' does not exist.` };
  }
  if (found.pin !== cleanPin) {
    return { ok: false, message: "Invalid PIN for this Gift Card." };
  }
  if (found.status === "disabled") {
    return { ok: false, message: "This Gift Card is currently disabled." };
  }
  if (found.expiryDate && new Date(found.expiryDate) < new Date()) {
    return { ok: false, message: "This Gift Card has expired." };
  }
  if (found.balance <= 0 || found.status === "redeemed") {
    return { ok: false, message: "This Gift Card has already been redeemed (Balance: ₹0)." };
  }

  return {
    ok: true,
    valid: true,
    giftCard: found,
    message: `Gift Card verified! Available Balance: ₹${found.balance}`,
  };
}

// Checkout / User: Apply Gift Card towards payment
export async function applyGiftCardPayment({ code, pin, amount, user }) {
  const cleanCode = String(code || "").trim().toUpperCase();
  const cleanPin = String(pin || "").trim();
  const orderAmount = Number(amount) || 0;

  try {
    const res = await applyGiftCardPaymentApi({
      code: cleanCode,
      pin: cleanPin,
      amount: orderAmount,
      userId: user?.id || user?._id || "",
      userEmail: user?.email || "",
      userName: user?.name || user?.username || "",
    });
    if (res?.ok) {
      // Sync local copy
      const cards = readLocalGiftCards();
      const updated = cards.map((c) =>
        c.code.toUpperCase() === cleanCode
          ? {
              ...c,
              balance: res.cardBalance,
              status: res.cardBalance <= 0 ? "redeemed" : c.status,
            }
          : c
      );
      writeLocalGiftCards(updated);
      return res;
    }
  } catch {
    // fallback
  }

  // Local fallback payment application
  const cards = readLocalGiftCards();
  const found = cards.find((c) => c.code.toUpperCase() === cleanCode);
  if (!found) return { ok: false, message: "Gift Card not found." };
  if (found.pin !== cleanPin) return { ok: false, message: "Incorrect PIN." };
  if (found.status === "disabled") return { ok: false, message: "Gift Card is disabled." };
  if (found.expiryDate && new Date(found.expiryDate) < new Date()) return { ok: false, message: "Gift Card has expired." };
  if (found.balance <= 0) return { ok: false, message: "Gift Card has ₹0 balance." };

  const deduction = Math.min(found.balance, orderAmount);
  const newBalance = found.balance - deduction;
  const remainingToPay = Math.max(0, orderAmount - deduction);

  found.balance = newBalance;
  if (newBalance <= 0) {
    found.status = "redeemed";
    found.redeemedBy = {
      userId: user?.id || user?._id || "",
      userEmail: user?.email || "",
      userName: user?.name || user?.username || "",
      redeemedAt: new Date().toISOString(),
    };
  }
  writeLocalGiftCards(cards);

  return {
    ok: true,
    deduction,
    remainingToPay,
    cardBalance: newBalance,
    cardCode: found.code,
    message: `₹${deduction} applied from Gift Card '${found.code}'. Remaining balance: ₹${newBalance}.`,
  };
}

