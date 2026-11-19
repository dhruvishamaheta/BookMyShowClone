import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser } from "../utils/userStorage";
import { checkGiftCardBalance, getUserGiftCards } from "../utils/giftCardStorage";
import "./GiftCards.css";

const THEME_STYLES = {
  ruby: { bg: "linear-gradient(135deg, #e11d48 0%, #9f1239 100%)", text: "#ffffff" },
  gold: { bg: "linear-gradient(135deg, #d97706 0%, #92400e 100%)", text: "#ffffff" },
  emerald: { bg: "linear-gradient(135deg, #059669 0%, #065f46 100%)", text: "#ffffff" },
  indigo: { bg: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)", text: "#ffffff" },
  sunset: { bg: "linear-gradient(135deg, #ea580c 0%, #9a3412 100%)", text: "#ffffff" },
  midnight: { bg: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", text: "#ffffff" },
};

function GiftCards() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [activeTab, setActiveTab] = useState("my-cards"); // "my-cards" | "explore" | "check-balance"

  // User's cards
  const [myCards, setMyCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [revealedPins, setRevealedPins] = useState({});
  const [copiedCode, setCopiedCode] = useState(null);

  // Check balance form
  const [checkCode, setCheckCode] = useState("");
  const [checkPin, setCheckPin] = useState("");
  const [checking, setChecking] = useState(false);
  const [balanceResult, setBalanceResult] = useState(null);
  const [balanceError, setBalanceError] = useState("");

  // Sync user
  useEffect(() => {
    window.scrollTo(0, 0);
    const sync = () => setCurrentUser(getCurrentUser());
    window.addEventListener("userUpdated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("userUpdated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // Fetch gift cards assigned to this user
  useEffect(() => {
    let cancelled = false;
    const loadUserCards = async () => {
      setLoadingCards(true);
      try {
        const email = currentUser?.email || "";
        const data = await getUserGiftCards(email);
        if (!cancelled) {
          setMyCards(data || []);
        }
      } catch {
        if (!cancelled) setMyCards([]);
      } finally {
        if (!cancelled) setLoadingCards(false);
      }
    };

    loadUserCards();
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  const togglePinReveal = (cardId) => {
    setRevealedPins((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const handleCopyCode = (code) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCheckBalance = async (e) => {
    e.preventDefault();
    setBalanceResult(null);
    setBalanceError("");

    if (!checkCode.trim() || !checkPin.trim()) {
      setBalanceError("Please enter both Voucher Code and PIN.");
      return;
    }

    setChecking(true);
    try {
      const result = await checkGiftCardBalance(checkCode.trim(), checkPin.trim());
      if (result?.ok && result.giftCard) {
        setBalanceResult(result.giftCard);
      } else {
        setBalanceError(result?.message || "Invalid voucher code or PIN.");
      }
    } catch (err) {
      setBalanceError(err?.message || "Unable to check gift card balance.");
    } finally {
      setChecking(false);
    }
  };

  // Sample explore cards
  const exploreCatalog = [
    {
      title: "Movie Lover Premier Voucher",
      theme: "ruby",
      category: "Movies",
      amount: 500,
      desc: "Perfect for cinema buffs! Valid on all blockbuster movies across 3000+ screens.",
    },
    {
      title: "Festive Joy Celebrations",
      theme: "gold",
      category: "Festive",
      amount: 1000,
      desc: "Celebrate Diwali, Christmas & New Year with concerts, live events and cinema tickets.",
    },
    {
      title: "VIP Executive Experience",
      theme: "midnight",
      category: "VIP Rewards",
      amount: 2000,
      desc: "Premium recliners, IMAX, 4DX and special lounge access voucher.",
    },
    {
      title: "Live Sports & Stadium Pass",
      theme: "emerald",
      category: "Celebration",
      amount: 1500,
      desc: "Catch live IPL, football matches, and arena sports tournaments in your city.",
    },
  ];

  return (
    <div className="giftcards-page">
      {/* Hero Banner Section */}
      <section className="giftcards-hero">
        <div className="giftcards-hero-container">
          <div className="giftcards-hero-content">
            <span className="giftcards-badge-pill">🎁 BookMyShow Gift Cards</span>
            <h1 className="giftcards-hero-title">
              The Gift of <span className="highlight-text">Live Entertainment</span>
            </h1>
            <p className="giftcards-hero-subtitle">
              Enjoy movies, stand-up comedy, sports, music festivals, and adventure activities with verified digital gift cards provided to you.
            </p>

            <div className="giftcards-hero-stats">
              <div className="hero-stat-item">
                <strong>Instant</strong>
                <span>Redemption</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat-item">
                <strong>100%</strong>
                <span>Secure Checkout</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat-item">
                <strong>3000+</strong>
                <span>Cinema Screens</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="giftcards-container">
        {/* Navigation Tabs */}
        <div className="giftcards-tabs-wrapper">
          <button
            type="button"
            className={`giftcards-tab-btn ${activeTab === "my-cards" ? "active" : ""}`}
            onClick={() => setActiveTab("my-cards")}
          >
            <span>💳 My Gift Cards</span>
            {currentUser && myCards.length > 0 && (
              <span className="giftcards-tab-count">{myCards.length}</span>
            )}
          </button>
          <button
            type="button"
            className={`giftcards-tab-btn ${activeTab === "check-balance" ? "active" : ""}`}
            onClick={() => setActiveTab("check-balance")}
          >
            <span>🔍 Check Balance & Redeem</span>
          </button>
          <button
            type="button"
            className={`giftcards-tab-btn ${activeTab === "explore" ? "active" : ""}`}
            onClick={() => setActiveTab("explore")}
          >
            <span>✨ Explore Gift Cards</span>
          </button>
        </div>

        {/* TAB 1: MY GIFT CARDS */}
        {activeTab === "my-cards" && (
          <div className="giftcards-tab-content">
            {!currentUser ? (
              <div className="giftcards-login-card">
                <div className="login-card-icon">🔐</div>
                <h3>Sign in to view your Gift Cards</h3>
                <p>
                  Any Gift Cards provided to you by BookMyShow Admin will automatically appear here once you sign in with your registered account.
                </p>
                <div className="login-card-actions">
                  <button
                    type="button"
                    className="giftcards-btn giftcards-btn-primary"
                    onClick={() => navigate("/login")}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    className="giftcards-btn giftcards-btn-secondary"
                    onClick={() => navigate("/signup")}
                  >
                    Create Account
                  </button>
                </div>
              </div>
            ) : loadingCards ? (
              <div className="giftcards-loading-state">
                <div className="giftcards-spinner" />
                <p>Fetching your Gift Cards...</p>
              </div>
            ) : myCards.length === 0 ? (
              <div className="giftcards-empty-card">
                <div className="empty-card-icon">🎟️</div>
                <h3>No Gift Cards Assigned Yet</h3>
                <p>
                  You do not have any active gift cards assigned to <strong>{currentUser.email}</strong> right now.
                </p>
                <p className="empty-subtext">
                  Have an open voucher code and PIN? Use the <strong>"Check Balance & Redeem"</strong> tab to check and redeem it on checkout!
                </p>
                <button
                  type="button"
                  className="giftcards-btn giftcards-btn-primary"
                  onClick={() => setActiveTab("check-balance")}
                >
                  Redeem Gift Card
                </button>
              </div>
            ) : (
              <div>
                <div className="mycards-header-bar">
                  <div>
                    <h2>Your Gift Cards ({myCards.length})</h2>
                    <p>These gift cards are active on your account and ready to be used at checkout.</p>
                  </div>
                </div>

                <div className="giftcards-grid">
                  {myCards.map((card) => {
                    const cardId = card.id || card._id;
                    const theme = THEME_STYLES[card.themeColor] || THEME_STYLES.ruby;
                    const isPinRevealed = Boolean(revealedPins[cardId]);
                    const isCopied = copiedCode === card.code;
                    const balance = card.balance !== undefined ? card.balance : card.amount;
                    const isExpired = card.expiryDate && new Date(card.expiryDate) < new Date();

                    return (
                      <div key={cardId} className="giftcard-voucher-card">
                        {/* 3D Card Graphic */}
                        <div
                          className="voucher-graphic"
                          style={{ background: theme.bg, color: theme.text }}
                        >
                          <div className="voucher-graphic-header">
                            <span className="voucher-brand">BookMyShow</span>
                            <span className="voucher-pill">{card.category || "Gift Card"}</span>
                          </div>

                          <div className="voucher-graphic-body">
                            <h3 className="voucher-title">{card.title}</h3>
                            <div className="voucher-amount-display">
                              <span className="currency">₹</span>
                              <span className="num">{Number(balance).toLocaleString()}</span>
                            </div>
                            <span className="voucher-balance-sub">
                              Initial Value: ₹{Number(card.amount).toLocaleString()}
                            </span>
                          </div>

                          <div className="voucher-graphic-footer">
                            <div className="voucher-code-chip">
                              <span className="label">VOUCHER:</span>
                              <code>{card.code}</code>
                            </div>
                            <div className="voucher-pin-chip">
                              <span className="label">PIN:</span>
                              <strong>{isPinRevealed ? card.pin : "••••"}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Card Info and Actions */}
                        <div className="voucher-meta-box">
                          {card.message && (
                            <p className="voucher-message">
                              <em>"{card.message}"</em>
                            </p>
                          )}

                          <div className="voucher-meta-row">
                            <span className="meta-name">Provided By:</span>
                            <span className="meta-val">{card.senderName || "BookMyShow Admin"}</span>
                          </div>

                          <div className="voucher-meta-row">
                            <span className="meta-name">Valid Until:</span>
                            <span className={`meta-val ${isExpired ? "text-danger" : ""}`}>
                              {card.expiryDate
                                ? new Date(card.expiryDate).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "No Expiry"}
                              {isExpired && " (Expired)"}
                            </span>
                          </div>

                          <div className="voucher-meta-row">
                            <span className="meta-name">Status:</span>
                            <span className={`status-pill ${card.status}`}>
                              {card.status === "active" ? "Available to Spend" : card.status}
                            </span>
                          </div>

                          {/* Quick Actions */}
                          <div className="voucher-btn-group">
                            <button
                              type="button"
                              className="action-btn action-btn-secondary"
                              onClick={() => togglePinReveal(cardId)}
                            >
                              {isPinRevealed ? "🙈 Hide PIN" : "👁️ Reveal PIN"}
                            </button>

                            <button
                              type="button"
                              className={`action-btn ${isCopied ? "action-btn-success" : "action-btn-secondary"}`}
                              onClick={() => handleCopyCode(card.code)}
                            >
                              {isCopied ? "✓ Code Copied!" : "📋 Copy Code"}
                            </button>

                            <button
                              type="button"
                              className="action-btn action-btn-primary"
                              onClick={() => navigate("/movies")}
                            >
                              🎬 Book Ticket
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CHECK BALANCE & REDEEM */}
        {activeTab === "check-balance" && (
          <div className="giftcards-tab-content">
            <div className="balance-checker-container">
              <div className="balance-checker-card">
                <div className="checker-header">
                  <h2>Check Gift Card Balance</h2>
                  <p>Enter your 16-character voucher code and 4-digit security PIN to verify available balance.</p>
                </div>

                <form onSubmit={handleCheckBalance} className="checker-form">
                  <div className="checker-form-group">
                    <label>Voucher Code</label>
                    <input
                      type="text"
                      placeholder="e.g. BMS-GIFT-ABCD-1234"
                      value={checkCode}
                      onChange={(e) => setCheckCode(e.target.value.toUpperCase())}
                      className="checker-input"
                    />
                  </div>

                  <div className="checker-form-group">
                    <label>Security PIN</label>
                    <input
                      type="password"
                      maxLength="6"
                      placeholder="e.g. 1234"
                      value={checkPin}
                      onChange={(e) => setCheckPin(e.target.value)}
                      className="checker-input"
                    />
                  </div>

                  {balanceError && (
                    <div className="checker-alert checker-alert-error">
                      ⚠️ {balanceError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="giftcards-btn giftcards-btn-primary full-width"
                    disabled={checking}
                  >
                    {checking ? "Verifying Card..." : "Check Available Balance"}
                  </button>
                </form>

                {/* Verified Card Result */}
                {balanceResult && (
                  <div className="verified-result-box">
                    <div className="result-success-badge">
                      ✓ Gift Card Verified & Active!
                    </div>

                    <div className="verified-card-summary">
                      <div className="verified-title-row">
                        <h3>{balanceResult.title}</h3>
                        <span className="verified-balance-big">
                          ₹{Number(balanceResult.balance).toLocaleString()}
                        </span>
                      </div>
                      <p className="verified-code-row">
                        Code: <code>{balanceResult.code}</code> • Face Value: ₹{balanceResult.amount}
                      </p>
                      <p className="verified-expiry">
                        Valid till:{" "}
                        <strong>
                          {new Date(balanceResult.expiryDate).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </strong>
                      </p>

                      <div className="verified-actions">
                        <button
                          type="button"
                          className="giftcards-btn giftcards-btn-secondary"
                          onClick={() => handleCopyCode(balanceResult.code)}
                        >
                          {copiedCode === balanceResult.code ? "✓ Code Copied!" : "📋 Copy Code"}
                        </button>
                        <button
                          type="button"
                          className="giftcards-btn giftcards-btn-primary"
                          onClick={() => navigate("/movies")}
                        >
                          Book Ticket Now
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions Guide */}
              <div className="checker-guide-box">
                <h3>How to use your Gift Card:</h3>
                <ol className="checker-steps-list">
                  <li>
                    <strong>Find your entertainment:</strong> Pick your favourite Movie, Concert, Standup Comedy, or Sport.
                  </li>
                  <li>
                    <strong>Proceed to Payment:</strong> On the checkout screen, click on <strong>"Pay with Gift Card"</strong>.
                  </li>
                  <li>
                    <strong>Instant Deduction:</strong> Enter your Voucher Code & PIN. The card balance will be deducted immediately!
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EXPLORE GIFT CARDS */}
        {activeTab === "explore" && (
          <div className="giftcards-tab-content">
            <div className="explore-header">
              <h2>Gift Card Denominations & Occasions</h2>
              <p>Explore our wide range of entertainment gift cards provided by BookMyShow.</p>
            </div>

            <div className="giftcards-grid">
              {exploreCatalog.map((card, idx) => {
                const theme = THEME_STYLES[card.theme] || THEME_STYLES.ruby;
                return (
                  <div key={idx} className="giftcard-voucher-card">
                    <div
                      className="voucher-graphic"
                      style={{ background: theme.bg, color: theme.text }}
                    >
                      <div className="voucher-graphic-header">
                        <span className="voucher-brand">BookMyShow</span>
                        <span className="voucher-pill">{card.category}</span>
                      </div>

                      <div className="voucher-graphic-body">
                        <h3 className="voucher-title">{card.title}</h3>
                        <div className="voucher-amount-display">
                          <span className="currency">₹</span>
                          <span className="num">{card.amount.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="voucher-graphic-footer">
                        <span>Digital Voucher Card</span>
                        <span>Multi-screen Access</span>
                      </div>
                    </div>

                    <div className="voucher-meta-box">
                      <p className="voucher-message">{card.desc}</p>
                      <div className="voucher-btn-group">
                        <button
                          type="button"
                          className="action-btn action-btn-primary"
                          onClick={() => setActiveTab("check-balance")}
                        >
                          Redeem Voucher
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GiftCards;

