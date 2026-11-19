import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { markSeatsSold, saveTicket } from "../utils/ticketStorage";
import { getCurrentUser, saveUserBooking } from "../utils/userStorage";
import { getAllOffers, validateAndApplyCoupon } from "../utils/offerStorage";
import { applyGiftCardPayment, checkGiftCardBalance } from "../utils/giftCardStorage";
import { createPaymentOrder, verifyPayment } from "../utils/paymentApi";
import "./Payment.css";

function Payment() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    selectedSeats = [],
    selectedPasses = [],
    selectedSeatIds = [],
    selectedSeatsDetails = [],
    seatMapKey,
    seatBooking,
    totalPrice,
    movie,
    event,
    slot,
    sport,
    activity,
    selectedDate,
  } = location.state || {};
  
  const currentCategory = movie ? "Movie" : event ? "Event" : sport ? "Sport" : activity ? "Activity" : "All";
  const baseTotal = Number(totalPrice || 0);
  const gst = baseTotal * 0.18;
  const initialGrandTotal = baseTotal + gst;
  const bookingDate = selectedDate || seatBooking?.selectedDate || sport?.selectedDate || movie?.selectedDate || sport?.date || activity?.date;

  // Coupon and discount states
  const [couponInput, setCouponInput] = useState("");
  const [appliedOffer, setAppliedOffer] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponStatus, setCouponStatus] = useState({ type: "", message: "" });
  const [isValidating, setIsValidating] = useState(false);
  const [availableOffers, setAvailableOffers] = useState([]);
  const [showAllCoupons, setShowAllCoupons] = useState(false);

  // Load active offers
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const offers = await getAllOffers({ type: currentCategory });
        setAvailableOffers(offers || []);
      } catch {
        // ignore
      }
    };
    fetchOffers();
  }, [currentCategory]);

  // Gift Card states
  const [giftCardCode, setGiftCardCode] = useState("");
  const [giftCardPin, setGiftCardPin] = useState("");
  const [appliedGiftCard, setAppliedGiftCard] = useState(null);
  const [giftCardDeduction, setGiftCardDeduction] = useState(0);
  const [giftCardStatus, setGiftCardStatus] = useState({ type: "", message: "" });
  const [isValidatingGiftCard, setIsValidatingGiftCard] = useState(false);
  const [showGiftCardInput, setShowGiftCardInput] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

  const totalAfterDiscount = Math.max(0, initialGrandTotal - discountAmount);
  const finalGrandTotal = Math.max(0, totalAfterDiscount - giftCardDeduction);

  // Handle Apply Gift Card
  const handleApplyGiftCard = async () => {
    const cleanCode = giftCardCode.trim().toUpperCase();
    const cleanPin = giftCardPin.trim();

    if (!cleanCode || !cleanPin) {
      setGiftCardStatus({ type: "error", message: "Please enter both Voucher Code and PIN." });
      return;
    }

    setIsValidatingGiftCard(true);
    setGiftCardStatus({ type: "", message: "" });

    try {
      const res = await checkGiftCardBalance(cleanCode, cleanPin);
      if (res?.ok && res.giftCard) {
        const available = Number(res.giftCard.balance);
        if (available <= 0) {
          setGiftCardStatus({ type: "error", message: "This Gift Card has ₹0 balance remaining." });
          return;
        }
        const deduction = Math.min(available, totalAfterDiscount);
        setAppliedGiftCard({ ...res.giftCard, pin: cleanPin });
        setGiftCardDeduction(deduction);
        setGiftCardStatus({
          type: "success",
          message: `🎁 Gift Card applied! ₹${deduction.toFixed(2)} deducted from card balance.`,
        });
      } else {
        setGiftCardStatus({ type: "error", message: res?.message || "Invalid Gift Card or PIN." });
      }
    } catch (err) {
      setGiftCardStatus({ type: "error", message: err?.message || "Failed to verify Gift Card." });
    } finally {
      setIsValidatingGiftCard(false);
    }
  };

  const handleRemoveGiftCard = () => {
    setAppliedGiftCard(null);
    setGiftCardDeduction(0);
    setGiftCardCode("");
    setGiftCardPin("");
    setGiftCardStatus({ type: "info", message: "Gift Card removed." });
    setTimeout(() => setGiftCardStatus({ type: "", message: "" }), 2500);
  };

  // Handle Apply Coupon
  const handleApplyCoupon = async (codeToApply) => {
    const targetCode = String(codeToApply || couponInput).trim().toUpperCase();
    if (!targetCode) {
      setCouponStatus({ type: "error", message: "Please enter a valid coupon code." });
      return;
    }

    setIsValidating(true);
    setCouponStatus({ type: "", message: "" });

    try {
      const result = await validateAndApplyCoupon({
        code: targetCode,
        amount: initialGrandTotal,
        category: currentCategory,
      });

      if (result && (result.ok || result.valid)) {
        setAppliedOffer(result.offer);
        setDiscountAmount(result.discountAmount);
        setCouponInput(result.offer.code);
        setCouponStatus({
          type: "success",
          message: result.message || `🎉 '${result.offer.code}' applied! You saved ₹${result.discountAmount}.`,
        });
      } else {
        setCouponStatus({
          type: "error",
          message: result?.message || "Invalid or inapplicable coupon code.",
        });
      }
    } catch (err) {
      setCouponStatus({
        type: "error",
        message: err?.message || "Failed to validate coupon code.",
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Remove Coupon
  const handleRemoveCoupon = () => {
    setAppliedOffer(null);
    setDiscountAmount(0);
    setCouponInput("");
    setCouponStatus({
      type: "info",
      message: "Coupon removed.",
    });
    setTimeout(() => setCouponStatus({ type: "", message: "" }), 3000);
  };

  const completeBooking = async (method, paymentDetails = {}) => {
    const user = getCurrentUser();
    const userId = user?.id || user?._id || "user";
    const ticketId = `BMS-${Date.now().toString().slice(-6)}`;
    const bookedSeatDetails = (seatBooking?.seats || selectedSeatsDetails).map((seat) => ({
      ...seat,
      status: "booked",
    }));
    const confirmedSeatBooking = seatBooking
      ? { ...seatBooking, seats: bookedSeatDetails, status: "confirmed" }
      : seatBooking;

    const ticket = {
      id: ticketId,
      userId: userId,
      customerName: user?.name || user?.username || "BookMyShow Customer",
      customerEmail: user?.email || "",
      customerMobile: user?.mobile || "",
      title: movie?.title || event?.title || sport?.title || activity?.title || "Booking",
      movieId: movie?.id || movie?._id || movie?.slug || (movie?.title ? movie.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") : null),
      type: movie ? "Movie" : event ? "Event" : sport ? "Sport" : "Activity",
      theatre: movie?.theatre || slot?.venue || sport?.venue || activity?.location || "Main Venue",
      showtime: movie?.showtime || slot?.time || sport?.date || activity?.time || "Regular",
      poster: movie?.poster || movie?.image || event?.poster || event?.image || sport?.poster || sport?.image || activity?.image || "",
      seats: selectedSeats,
      passes: selectedPasses,
      amount: finalGrandTotal,
      originalAmount: initialGrandTotal,
      discount: discountAmount,
      couponCode: appliedOffer ? appliedOffer.code : "",
      status: "Confirmed",
      date: bookingDate ||
        new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      createdAt: new Date().toISOString(),
      qr: `TKT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      method: finalGrandTotal === 0 && giftCardDeduction > 0 ? "Gift Card" : method,
      paymentId: paymentDetails.paymentId || "",
      paymentOrderId: paymentDetails.orderId || "",
      paymentSignature: paymentDetails.signature || "",
      details: {
        movie,
        event,
        slot,
        selectedDate: bookingDate,
        selectedPasses,
        selectedSeatIds,
        selectedSeatsDetails: bookedSeatDetails,
        seatMapKey,
        seatBooking: confirmedSeatBooking,
        sport,
        activity,
        appliedOffer,
        discountAmount,
        appliedGiftCard,
        giftCardDeduction,
        baseTotal,
        gst,
      },
    };

    if (appliedGiftCard && giftCardDeduction > 0) {
      try {
        await applyGiftCardPayment({
          code: appliedGiftCard.code,
          pin: appliedGiftCard.pin,
          amount: giftCardDeduction,
          user,
        });
      } catch (err) {
        console.warn("Gift card deduction backend error:", err);
      }
    }

    saveTicket(ticket);
    if (seatMapKey) {
      markSeatsSold(seatMapKey, selectedSeatIds);
    }
    const savedBooking = await saveUserBooking(ticket);
    if (savedBooking?.cancellationToken) {
      saveTicket({
        ...ticket,
        bookingRef: savedBooking.bookingRef || ticketId,
        cancellationToken: savedBooking.cancellationToken,
      });
    }
    navigate("/success", {
      state: {
        selectedSeats,
        totalPrice,
        grandTotal: finalGrandTotal,
        originalGrandTotal: initialGrandTotal,
        discountAmount,
        appliedOffer,
        appliedGiftCard,
        giftCardDeduction,
        movie,
        event,
        slot,
        selectedDate: bookingDate,
        selectedPasses,
        sport,
        activity,
        ticket,
      },
    });
  };

  const handlePayment = async (method) => {
    if (finalGrandTotal === 0 && giftCardDeduction > 0) {
      await completeBooking("Gift Card");
      return;
    }

    if (!window.Razorpay) {
      setPaymentStatus("Payment checkout could not be loaded. Please refresh and try again.");
      return;
    }

    setPaymentStatus("Preparing secure payment...");
    try {
      const receipt = `bms_${Date.now()}`;
      const orderResponse = await createPaymentOrder({
        amount: finalGrandTotal,
        receipt,
        bookingType: currentCategory,
      });

      await new Promise((resolve, reject) => {
        const razorpay = new window.Razorpay({
          key: orderResponse.keyId,
          amount: orderResponse.order.amount,
          currency: orderResponse.order.currency,
          name: "BookMyShow",
          description: "Secure booking payment",
          order_id: orderResponse.order.id,
          prefill: {
            name: getCurrentUser()?.name || "",
            email: getCurrentUser()?.email || "",
            contact: getCurrentUser()?.mobile || "",
          },
          theme: { color: "#f84464" },
          handler: async (response) => {
            try {
              setIsVerifyingPayment(true);
              setPaymentStatus("Payment checked. Confirming your booking...");
              await verifyPayment(response);
              await completeBooking(method, {
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature,
              });
              resolve();
            } catch (error) {
              setIsVerifyingPayment(false);
              reject(error);
            }
          },
          modal: { ondismiss: () => reject(new Error("Payment was cancelled.")) },
        });
        razorpay.open();
      });
    } catch (error) {
      setIsVerifyingPayment(false);
      setPaymentStatus(error?.message || "Payment failed. Your booking was not confirmed.");
    }
  };

  return (
    <div className="payment-page">
      {isVerifyingPayment && (
        <div className="payment-verification-overlay" role="status" aria-live="polite">
          <div className="payment-verification-modal">
            <div className="payment-loader" />
            <h3>Checking payment</h3>
            <p>Your payment was received. We are securely verifying it and creating your ticket.</p>
            <span>Please do not refresh or close this page.</span>
          </div>
        </div>
      )}
      <div className="payment-card">
        <p className="section-kicker">Payment & Checkout</p>
        <h2>Secure Checkout</h2>

        {movie && (
          <div className="detail-card">
            <p><strong>Movie:</strong> {movie.title}</p>
            <p><strong>Theatre:</strong> {movie.theatre}</p>
            <p><strong>Showtime:</strong> {movie.showtime}</p>
          </div>
        )}

        {event && (
          <div className="detail-card">
            <p><strong>Event:</strong> {event.title}</p>
            <p><strong>Venue:</strong> {slot?.venue}</p>
            <p><strong>Time:</strong> {slot?.time}</p>
          </div>
        )}

        {sport && (
          <div className="detail-card">
            <p><strong>Sport:</strong> {sport.title}</p>
            <p><strong>Venue:</strong> {sport.venue}</p>
            <p><strong>Date:</strong> {bookingDate || "Date to be announced"}</p>
          </div>
        )}

        {activity && (
          <div className="detail-card">
            <p><strong>Activity:</strong> {activity.title}</p>
            <p><strong>Location:</strong> {activity.location}</p>
            <p><strong>Time:</strong> {activity.time}</p>
          </div>
        )}

        {/* Offers & Discounts Promo Box */}
        <div className="payment-offers-section">
          <div className="offers-section-header">
            <div className="offers-header-title">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#f84464" strokeWidth="2.5">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              <strong>Apply Promo Code / Festive Offers</strong>
            </div>
            {availableOffers.length > 0 && (
              <span className="offers-count-badge">
                {availableOffers.length} available
              </span>
            )}
          </div>

          {/* Coupon Input Form */}
          <div className="coupon-input-group">
            <input
              type="text"
              className="coupon-text-input"
              placeholder="Enter coupon code (e.g. FESTIVE25)"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              disabled={Boolean(appliedOffer) || isValidating}
            />
            {appliedOffer ? (
              <button
                type="button"
                className="coupon-remove-btn"
                onClick={handleRemoveCoupon}
              >
                Remove
              </button>
            ) : (
              <button
                type="button"
                className="coupon-apply-btn"
                onClick={() => handleApplyCoupon(couponInput)}
                disabled={isValidating || !couponInput.trim()}
              >
                {isValidating ? "Verifying..." : "Apply"}
              </button>
            )}
          </div>

          {/* Feedback Banner */}
          {couponStatus.message && (
            <div className={`coupon-status-alert alert-${couponStatus.type}`}>
              {couponStatus.type === "success" && "✓ "}
              {couponStatus.type === "error" && "⚠ "}
              {couponStatus.message}
            </div>
          )}

          {/* Quick Select Available Offers */}
          {!appliedOffer && availableOffers.length > 0 && (
            <div className="quick-offers-list">
              <div className="quick-offers-header">
                <small>Select from popular deals:</small>
                {availableOffers.length > 2 && (
                  <button
                    type="button"
                    className="toggle-all-coupons-btn"
                    onClick={() => setShowAllCoupons(!showAllCoupons)}
                  >
                    {showAllCoupons ? "Show Less" : "View All"}
                  </button>
                )}
              </div>

              <div className="available-coupons-scroll">
                {(showAllCoupons ? availableOffers : availableOffers.slice(0, 2)).map((offer) => {
                  const isEligible = initialGrandTotal >= (offer.minOrderAmount || 0);
                  return (
                    <div key={offer.id || offer._id} className={`quick-coupon-item ${!isEligible ? "ineligible" : ""}`}>
                      <div className="coupon-info">
                        <div className="coupon-code-badge">
                          <code>{offer.code}</code>
                          <span className="coupon-ribbon">{offer.badgeText || offer.category}</span>
                        </div>
                        <p className="coupon-desc-short">{offer.description}</p>
                        {offer.minOrderAmount > 0 && (
                          <span className="coupon-min-order">
                            Min Order: ₹{offer.minOrderAmount}
                            {!isEligible && ` (Add ₹${(offer.minOrderAmount - initialGrandTotal).toFixed(0)} more)`}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="quick-apply-btn"
                        onClick={() => handleApplyCoupon(offer.code)}
                        disabled={!isEligible || isValidating}
                      >
                        {isEligible ? "APPLY" : "LOCKED"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Pricing Summary Breakdown */}
        <div className="detail-card pricing-breakdown-card">
          {selectedPasses.length > 0 ? (
            <div className="selected-pass-summary">
              <strong>Passes:</strong>
              {selectedPasses.map((pass) => (
                <p key={pass.id}>
                  {pass.name} × {pass.quantity} · ₹{pass.totalPrice.toLocaleString("en-IN")}
                </p>
              ))}
            </div>
          ) : (
            <p><strong>Seats:</strong> {selectedSeats.join(", ") || "General Admission"}</p>
          )}
          <div className="pricing-row">
            <span>Base Total:</span>
            <span>₹{baseTotal.toFixed(2)}</span>
          </div>
          <div className="pricing-row">
            <span>Convenience Fee / GST (18%):</span>
            <span>₹{gst.toFixed(2)}</span>
          </div>

          {/* Discount Deduction Line Item */}
          {discountAmount > 0 && (
            <div className="pricing-row discount-row">
              <span className="discount-label">
                🎁 Offer Discount ({appliedOffer?.code}):
              </span>
              <span className="discount-amount">
                - ₹{discountAmount.toFixed(2)}
              </span>
            </div>
          )}

          {/* Gift Card Deduction Line Item */}
          {giftCardDeduction > 0 && (
            <div className="pricing-row discount-row" style={{ color: "#059669" }}>
              <span className="discount-label" style={{ color: "#059669" }}>
                💳 Gift Card ({appliedGiftCard?.code}):
              </span>
              <span className="discount-amount" style={{ color: "#059669" }}>
                - ₹{giftCardDeduction.toFixed(2)}
              </span>
            </div>
          )}

          <div className="pricing-divider" />

          <div className="pricing-row grand-total-row">
            <strong>Grand Total:</strong>
            <strong className="final-price-text">₹{finalGrandTotal.toFixed(2)}</strong>
          </div>

          {(discountAmount > 0 || giftCardDeduction > 0) && (
            <div className="total-savings-banner">
              🎉 Total savings on this order: ₹{(discountAmount + giftCardDeduction).toFixed(2)}
            </div>
          )}
        </div>

        {/* Gift Card Section */}
        <div className="coupon-section" style={{ marginTop: "16px", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontWeight: "700", fontSize: "14px", color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
              💳 Have a BookMyShow Gift Card?
            </span>
            {!appliedGiftCard && (
              <button
                type="button"
                className="toggle-all-coupons-btn"
                onClick={() => setShowGiftCardInput(!showGiftCardInput)}
              >
                {showGiftCardInput ? "Cancel" : "+ Apply Gift Card"}
              </button>
            )}
          </div>

          {(showGiftCardInput || appliedGiftCard) && (
            <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              {appliedGiftCard ? (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ color: "#059669", fontSize: "14px" }}>
                      ✓ {appliedGiftCard.title} ({appliedGiftCard.code})
                    </strong>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                      Deducted: ₹{giftCardDeduction.toFixed(2)} | Remaining card balance: ₹{(appliedGiftCard.balance - giftCardDeduction).toFixed(2)}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="coupon-remove-btn"
                    onClick={handleRemoveGiftCard}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: "8px" }}>
                    <input
                      type="text"
                      className="coupon-input"
                      placeholder="Voucher Code (e.g. BMS-GIFT-...)"
                      value={giftCardCode}
                      onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                      disabled={isValidatingGiftCard}
                    />
                    <input
                      type="password"
                      maxLength="6"
                      className="coupon-input"
                      placeholder="PIN"
                      value={giftCardPin}
                      onChange={(e) => setGiftCardPin(e.target.value)}
                      disabled={isValidatingGiftCard}
                    />
                  </div>
                  <button
                    type="button"
                    className="giftcards-btn giftcards-btn-primary"
                    style={{ padding: "10px 16px", fontSize: "13px" }}
                    onClick={handleApplyGiftCard}
                    disabled={isValidatingGiftCard || !giftCardCode.trim() || !giftCardPin.trim()}
                  >
                    {isValidatingGiftCard ? "Verifying Card..." : "Apply Gift Card Balance"}
                  </button>
                </div>
              )}

              {giftCardStatus.message && (
                <div className={`coupon-status-alert alert-${giftCardStatus.type}`} style={{ marginTop: "10px" }}>
                  {giftCardStatus.type === "success" && "✓ "}
                  {giftCardStatus.type === "error" && "⚠ "}
                  {giftCardStatus.message}
                </div>
              )}
            </div>
          )}
        </div>

        <h3>Select Payment Method</h3>
        {paymentStatus && <p className="payment-status" role="status">{paymentStatus}</p>}
        <div className="payment-options">
          {finalGrandTotal === 0 && giftCardDeduction > 0 ? (
            <button
              onClick={() => handlePayment("Gift Card")}
              className="pay-btn"
              style={{ background: "#059669", color: "#ffffff", fontWeight: "800", fontSize: "16px", padding: "14px" }}
            >
              🎉 Pay ₹0.00 & Confirm Booking with Gift Card
            </button>
          ) : (
            <>
              <button onClick={() => handlePayment("UPI")} className="pay-btn">
                Pay with UPI (₹{finalGrandTotal.toFixed(2)})
              </button>
              <button onClick={() => handlePayment("Credit Card")} className="pay-btn">
                Pay with Card (₹{finalGrandTotal.toFixed(2)})
              </button>
              <button onClick={() => handlePayment("Net Banking")} className="pay-btn">
                Pay with Net Banking (₹{finalGrandTotal.toFixed(2)})
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Payment;
