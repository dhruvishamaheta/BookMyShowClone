import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAllOffers } from "../utils/offerStorage";
import "./Offers.css";

const CATEGORY_TABS = [
  { label: "All Deals", value: "All" },
  { label: "Festive Offers", value: "Festive Offer" },
  { label: "Last Minute Deals", value: "Last Minute Offer" },
  { label: "Special Deals", value: "Special Deal" },
  { label: "Bank & Wallet", value: "Bank Offer" },
  { label: "Promo Codes", value: "Promo Code" },
];

function Offers() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [copiedCode, setCopiedCode] = useState(null);
  const [expandedTerms, setExpandedTerms] = useState({});

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchOffers = async () => {
      setLoading(true);
      try {
        const data = await getAllOffers();
        setOffers(data || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  const handleCopyCode = (code) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const toggleTerms = (id) => {
    setExpandedTerms((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredOffers = offers.filter((o) => {
    if (!o.isActive) return false;
    if (activeTab === "All") return true;
    return o.category === activeTab;
  });

  return (
    <div className="offers-page-wrapper">
      {/* Hero Section */}
      <section className="offers-hero-section">
        <div className="offers-hero-container">
          <div className="offers-hero-content">
            <span className="offers-badge-pill">🔥 Exclusive Entertainment Deals</span>
            <h1 className="offers-hero-title">
              Offers, Festive Deals & <span className="highlight-text">Instant Discounts</span>
            </h1>
            <p className="offers-hero-subtitle">
              Enjoy massive savings on Movie tickets, Stand-up Comedy shows, Live Concerts, Sports tournaments, and fun Activities with BookMyShow verified promo codes!
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="offers-main-container">
        {/* Category Tabs */}
        <div className="offers-filter-bar">
          <div className="offers-tabs-scroll">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={`offers-tab-btn ${activeTab === tab.value ? "active" : ""}`}
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Offers Grid */}
        {loading ? (
          <div className="offers-loading-state">
            <div className="offers-spinner" />
            <p>Loading latest exclusive offers...</p>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="offers-empty-state">
            <div className="empty-icon">🎟️</div>
            <h3>No active offers in this category right now</h3>
            <p>Check back soon for new festive offers and last-minute rush deals!</p>
            <button
              type="button"
              className="offers-explore-btn"
              onClick={() => setActiveTab("All")}
            >
              View All Deals
            </button>
          </div>
        ) : (
          <div className="offers-grid">
            {filteredOffers.map((offer) => {
              const offerId = offer.id || offer._id;
              const isCopied = copiedCode === offer.code;
              const isTermsOpen = expandedTerms[offerId];

              return (
                <div key={offerId} className="offer-card">
                  {/* Card Top Banner Ribbon */}
                  <div className={`offer-ribbon-tag tag-${offer.category.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}>
                    {offer.badgeText || offer.category}
                  </div>

                  <div className="offer-card-body">
                    {/* Discount Value Badge */}
                    <div className="offer-discount-headline">
                      {offer.discountType === "flat" ? (
                        <span className="discount-large">FLAT ₹{offer.discountValue} OFF</span>
                      ) : (
                        <span className="discount-large">{offer.discountValue}% OFF</span>
                      )}
                      {offer.discountType === "percentage" && offer.maxDiscount > 0 && (
                        <span className="discount-subtext">Up to ₹{offer.maxDiscount}</span>
                      )}
                    </div>

                    <h3 className="offer-title">{offer.title}</h3>
                    <p className="offer-desc">{offer.description}</p>

                    {/* Rule Highlights */}
                    <div className="offer-meta-chips">
                      <span className="meta-chip">
                        🎯 Valid on: <strong>{offer.applicableFor || "All Categories"}</strong>
                      </span>
                      {offer.minOrderAmount > 0 && (
                        <span className="meta-chip">
                          💳 Min Order: <strong>₹{offer.minOrderAmount}</strong>
                        </span>
                      )}
                    </div>

                    {/* Code & Copy Box */}
                    <div className="offer-code-container">
                      <div className="code-chip">
                        <span className="code-label">CODE:</span>
                        <strong className="code-text">{offer.code}</strong>
                      </div>
                      <button
                        type="button"
                        className={`copy-code-btn ${isCopied ? "copied" : ""}`}
                        onClick={() => handleCopyCode(offer.code)}
                        title="Copy promo code"
                      >
                        {isCopied ? "Copied! ✓" : "Copy Code"}
                      </button>
                    </div>

                    {/* Validity & Terms Toggle */}
                    <div className="offer-card-footer">
                      <div className="validity-text">
                        {offer.validUntil ? (
                          <>Valid till {new Date(offer.validUntil).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</>
                        ) : (
                          <>Limited Period Offer</>
                        )}
                      </div>

                      <button
                        type="button"
                        className="terms-toggle-btn"
                        onClick={() => toggleTerms(offerId)}
                      >
                        {isTermsOpen ? "Hide Terms ▲" : "View Terms ▼"}
                      </button>
                    </div>

                    {/* Collapsible Terms */}
                    {isTermsOpen && (
                      <div className="offer-terms-dropdown">
                        <strong>Terms & Conditions:</strong>
                        <ul>
                          {Array.isArray(offer.terms) && offer.terms.length > 0 ? (
                            offer.terms.map((term, idx) => <li key={idx}>{term}</li>)
                          ) : (
                            <li>Applicable on checkout for eligible shows.</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Action CTA */}
                    <button
                      type="button"
                      className="offer-apply-now-btn"
                      onClick={() => {
                        handleCopyCode(offer.code);
                        if (offer.applicableFor === "Movie") {
                          navigate("/movies");
                        } else if (offer.applicableFor === "Event") {
                          navigate("/events");
                        } else if (offer.applicableFor === "Sport") {
                          navigate("/sports");
                        } else if (offer.applicableFor === "Activity") {
                          navigate("/activity");
                        } else {
                          navigate("/movies");
                        }
                      }}
                    >
                      <span>Apply on Booking</span>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* How to Redeem Step Cards */}
        <section className="offers-how-it-works">
          <h2 className="how-title">How to Redeem Offers & Discounts</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h4>Select Your Show</h4>
              <p>Pick your favorite movie, concert, sports game, or weekend amusement activity.</p>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <h4>Apply Code at Checkout</h4>
              <p>On the final Payment page, select or enter your coupon code (e.g. <code>FESTIVE25</code> or <code>LASTMIN100</code>).</p>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <h4>Get Instant Price Reduction</h4>
              <p>The discount amount is automatically deducted from your Grand Total before payment!</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Offers;
