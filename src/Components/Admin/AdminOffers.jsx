import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAdminAuthenticated } from "../../utils/adminAuth";
import {
  createOffer,
  deleteOffer,
  getAdminOffers,
  updateOffer,
} from "../../utils/offerStorage";
import AdminModal from "./AdminModal";
import "./AdminStyles.css";

const CATEGORY_OPTIONS = [
  "Festive Offer",
  "Last Minute Offer",
  "Special Deal",
  "Bank Offer",
  "Promo Code",
];

const APPLICABLE_OPTIONS = ["All", "Movie", "Event", "Sport", "Activity"];

const emptyForm = {
  title: "",
  code: "",
  description: "",
  category: "Festive Offer",
  discountType: "percentage",
  discountValue: 20,
  maxDiscount: 150,
  minOrderAmount: 250,
  applicableFor: "All",
  validFrom: new Date().toISOString().slice(0, 10),
  validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  isActive: true,
  badgeText: "FESTIVE SPECIAL",
  termsText: "Valid on select bookings.\nCannot be combined with other offers.\nApplicable once per user.",
};

function AdminOffers() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryTab, setActiveCategoryTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
  const [currentOfferId, setCurrentOfferId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal
  const [deleteCandidate, setDeleteCandidate] = useState(null);

  // Toast alert
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadOffers = async () => {
    setLoading(true);
    try {
      const data = await getAdminOffers();
      setOffers(data || []);
    } catch {
      showToast("Unable to load latest offers from backend.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate("/admin/login");
      return;
    }
    loadOffers();
  }, [navigate]);

  // Handle Tab Switch
  const filteredOffers = useMemo(() => {
    let list = [...offers];

    if (activeCategoryTab !== "All") {
      if (activeCategoryTab === "Active") {
        list = list.filter((o) => o.isActive);
      } else if (activeCategoryTab === "Inactive") {
        list = list.filter((o) => !o.isActive);
      } else {
        list = list.filter((o) => o.category === activeCategoryTab);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (o) =>
          (o.title || "").toLowerCase().includes(q) ||
          (o.code || "").toLowerCase().includes(q) ||
          (o.description || "").toLowerCase().includes(q) ||
          (o.category || "").toLowerCase().includes(q)
      );
    }

    if (sortBy === "newest") {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === "discountHigh") {
      list.sort((a, b) => Number(b.discountValue || 0) - Number(a.discountValue || 0));
    } else if (sortBy === "codeAsc") {
      list.sort((a, b) => (a.code || "").localeCompare(b.code || ""));
    }

    return list;
  }, [offers, activeCategoryTab, searchQuery, sortBy]);

  // Stat computations
  const stats = useMemo(() => {
    const total = offers.length;
    const active = offers.filter((o) => o.isActive).length;
    const festive = offers.filter((o) => o.category === "Festive Offer").length;
    const lastMinute = offers.filter((o) => o.category === "Last Minute Offer").length;
    return { total, active, festive, lastMinute };
  }, [offers]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode("create");
    setCurrentOfferId(null);
    setFormData(emptyForm);
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (offer) => {
    setModalMode("edit");
    setCurrentOfferId(offer.id || offer._id);
    setFormData({
      title: offer.title || "",
      code: offer.code || "",
      description: offer.description || "",
      category: offer.category || "Festive Offer",
      discountType: offer.discountType || "percentage",
      discountValue: offer.discountValue !== undefined ? offer.discountValue : 20,
      maxDiscount: offer.maxDiscount !== undefined ? offer.maxDiscount : 150,
      minOrderAmount: offer.minOrderAmount !== undefined ? offer.minOrderAmount : 250,
      applicableFor: offer.applicableFor || "All",
      validFrom: offer.validFrom ? new Date(offer.validFrom).toISOString().slice(0, 10) : "",
      validUntil: offer.validUntil ? new Date(offer.validUntil).toISOString().slice(0, 10) : "",
      isActive: offer.isActive !== false,
      badgeText: offer.badgeText || "SPECIAL OFFER",
      termsText: Array.isArray(offer.terms) ? offer.terms.join("\n") : (offer.terms || ""),
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Toggle Active Status directly from table
  const handleToggleActive = async (offer) => {
    const id = offer.id || offer._id;
    const nextStatus = !offer.isActive;
    try {
      await updateOffer(id, { isActive: nextStatus });
      setOffers((prev) =>
        prev.map((o) => (o.id === id || o._id === id ? { ...o, isActive: nextStatus } : o))
      );
      showToast(`Offer '${offer.code}' is now ${nextStatus ? "Active" : "Inactive"}.`);
    } catch {
      showToast("Failed to update status.", "error");
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = "Offer title is required.";
    if (!formData.code.trim()) {
      errors.code = "Coupon code is required.";
    } else if (!/^[A-Z0-9_-]{3,20}$/i.test(formData.code.trim())) {
      errors.code = "Code must be 3-20 letters/numbers (e.g. FESTIVE25).";
    }

    if (formData.discountValue === "" || isNaN(formData.discountValue) || Number(formData.discountValue) <= 0) {
      errors.discountValue = "Discount value must be greater than 0.";
    }

    if (formData.discountType === "percentage" && Number(formData.discountValue) > 100) {
      errors.discountValue = "Percentage discount cannot exceed 100%.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit modal form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const parsedTerms = formData.termsText
      ? formData.termsText.split("\n").map((t) => t.trim()).filter(Boolean)
      : [];

    const payload = {
      title: formData.title.trim(),
      code: formData.code.trim().toUpperCase(),
      description: formData.description.trim(),
      category: formData.category,
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue),
      maxDiscount: formData.discountType === "percentage" ? Number(formData.maxDiscount || 0) : 0,
      minOrderAmount: Number(formData.minOrderAmount || 0),
      applicableFor: formData.applicableFor,
      validFrom: formData.validFrom ? new Date(formData.validFrom) : new Date(),
      validUntil: formData.validUntil ? new Date(formData.validUntil) : null,
      isActive: Boolean(formData.isActive),
      badgeText: formData.badgeText.trim() || "SPECIAL DEAL",
      terms: parsedTerms,
    };

    try {
      if (modalMode === "create") {
        const created = await createOffer(payload);
        setOffers((prev) => [created, ...prev.filter((o) => (o.code || "").toUpperCase() !== created.code)]);
        showToast(`Offer '${payload.code}' created successfully!`);
      } else {
        const updated = await updateOffer(currentOfferId, payload);
        setOffers((prev) =>
          prev.map((o) => (o.id === currentOfferId || o._id === currentOfferId ? { ...o, ...updated } : o))
        );
        showToast(`Offer '${payload.code}' updated successfully!`);
      }
      setIsModalOpen(false);
    } catch (err) {
      showToast(err?.message || "Operation failed. Please check your data.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Offer
  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    const id = deleteCandidate.id || deleteCandidate._id;
    try {
      await deleteOffer(id);
      setOffers((prev) => prev.filter((o) => o.id !== id && o._id !== id));
      showToast(`Offer '${deleteCandidate.code}' deleted.`);
      setDeleteCandidate(null);
    } catch {
      showToast("Failed to delete offer.", "error");
    }
  };

  return (
    <div className="admin-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 9999,
            padding: "14px 22px",
            borderRadius: "10px",
            background: toastMessage.type === "error" ? "#ef4444" : "#10b981",
            color: "#ffffff",
            fontWeight: 600,
            fontSize: "14px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            animation: "slideInRight 0.3s ease",
          }}
        >
          {toastMessage.message}
        </div>
      )}

      {/* Top Header */}
      <div className="admin-card" style={{ marginBottom: "20px" }}>
        <div className="admin-card-header" style={{ borderBottom: "none", paddingBottom: "0", marginBottom: "0" }}>
          <div className="admin-card-title-group">
            <h2>Offers & Discounts Management</h2>
            <p>
              Create and manage festive promotions, last-minute discounts, coupon promo codes, and automated checkout deductions.
            </p>
          </div>
          <div className="admin-header-actions">
            <button type="button" className="admin-btn admin-btn-primary" onClick={handleOpenCreate}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Create New Offer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="admin-stats-grid" style={{ marginBottom: "24px" }}>
        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-label">Total Offers</span>
            <strong className="admin-stat-value">{stats.total}</strong>
            <span className="admin-stat-desc">Catalog promotions</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-label">Active & Live</span>
            <strong className="admin-stat-value" style={{ color: "var(--admin-success)" }}>
              {stats.active}
            </strong>
            <span className="admin-stat-desc">Ready for checkout</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-label">Festive Offers</span>
            <strong className="admin-stat-value" style={{ color: "#e11d48" }}>
              {stats.festive}
            </strong>
            <span className="admin-stat-desc">Diwali, Navratri, Holi</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-label">Last Minute Rush</span>
            <strong className="admin-stat-value" style={{ color: "#d97706" }}>
              {stats.lastMinute}
            </strong>
            <span className="admin-stat-desc">Instant booking savings</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="admin-card">
        {/* Filter Tabs & Search Bar */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "20px" }}>
          {/* Category Tabs */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {["All", "Festive Offer", "Last Minute Offer", "Special Deal", "Bank Offer", "Active", "Inactive"].map((tab) => (
              <button
                key={tab}
                type="button"
                className={`admin-btn ${activeCategoryTab === tab ? "admin-btn-primary" : "admin-btn-outline"}`}
                style={{
                  padding: "8px 14px",
                  fontSize: "13px",
                  borderRadius: "20px",
                  fontWeight: activeCategoryTab === tab ? 700 : 500,
                }}
                onClick={() => setActiveCategoryTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search & Sort Controls */}
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div style={{ position: "relative", minWidth: "220px" }}>
              <input
                type="text"
                placeholder="Search offer or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 14px 8px 36px",
                  borderRadius: "8px",
                  border: "1px solid var(--admin-border-base)",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid var(--admin-border-base)",
                fontSize: "13px",
                background: "#ffffff",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="newest">Newest First</option>
              <option value="discountHigh">Highest Discount</option>
              <option value="codeAsc">Code (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
            <p>Loading offers...</p>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: "0 auto 12px", opacity: 0.6 }}>
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            <h3>No offers found</h3>
            <p style={{ fontSize: "14px", marginTop: "4px" }}>
              {searchQuery ? "Try refining your search query." : "Click 'Create New Offer' to add your first promotion."}
            </p>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Coupon Code</th>
                  <th>Offer Details</th>
                  <th>Discount Rule</th>
                  <th>Category / Scope</th>
                  <th>Validity</th>
                  <th>Live Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOffers.map((offer) => {
                  const isExpired = offer.validUntil && new Date(offer.validUntil) < new Date();
                  return (
                    <tr key={offer.id || offer._id}>
                      {/* Code Column */}
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontWeight: 800,
                              fontSize: "14px",
                              color: "#0f172a",
                              background: "#f1f5f9",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              display: "inline-block",
                              letterSpacing: "0.5px",
                              border: "1px dashed #cbd5e1",
                            }}
                          >
                            {offer.code}
                          </span>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              color: offer.category === "Festive Offer" ? "#f84464" : offer.category === "Last Minute Offer" ? "#d97706" : "#475569",
                            }}
                          >
                            {offer.badgeText || offer.category}
                          </span>
                        </div>
                      </td>

                      {/* Title & Desc */}
                      <td>
                        <strong style={{ display: "block", color: "#0f172a", fontSize: "14px" }}>
                          {offer.title}
                        </strong>
                        <span style={{ fontSize: "12px", color: "#64748b", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {offer.description || "No description provided."}
                        </span>
                      </td>

                      {/* Discount Rule */}
                      <td>
                        <div style={{ fontSize: "13px" }}>
                          <strong style={{ color: "#059669", fontSize: "14px" }}>
                            {offer.discountType === "flat"
                              ? `₹${offer.discountValue} FLAT OFF`
                              : `${offer.discountValue}% OFF`}
                          </strong>
                          {offer.discountType === "percentage" && offer.maxDiscount > 0 && (
                            <div style={{ fontSize: "11px", color: "#64748b" }}>
                              Max Cap: ₹{offer.maxDiscount}
                            </div>
                          )}
                          <div style={{ fontSize: "11px", color: "#64748b" }}>
                            Min Order: ₹{offer.minOrderAmount || 0}
                          </div>
                        </div>
                      </td>

                      {/* Applicable Category */}
                      <td>
                        <span className="admin-badge admin-badge-info" style={{ fontSize: "11px", padding: "3px 8px" }}>
                          {offer.category}
                        </span>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "3px" }}>
                          Valid on: <strong>{offer.applicableFor || "All"}</strong>
                        </div>
                      </td>

                      {/* Validity */}
                      <td>
                        <div style={{ fontSize: "12px", color: isExpired ? "#dc2626" : "#334155" }}>
                          {offer.validUntil ? (
                            <>
                              <div>Until: {new Date(offer.validUntil).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
                              {isExpired && <span style={{ color: "#dc2626", fontWeight: 700, fontSize: "11px" }}>EXPIRED</span>}
                            </>
                          ) : (
                            <span>No Expiry</span>
                          )}
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(offer)}
                          style={{
                            border: "none",
                            background: offer.isActive ? "#ecfdf5" : "#f1f5f9",
                            color: offer.isActive ? "#059669" : "#64748b",
                            padding: "4px 10px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: offer.isActive ? "#10b981" : "#94a3b8",
                            }}
                          />
                          {offer.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "8px" }}>
                          <button
                            type="button"
                            className="admin-btn admin-btn-outline"
                            style={{ padding: "6px 10px", fontSize: "12px" }}
                            onClick={() => handleOpenEdit(offer)}
                            title="Edit Offer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn-danger"
                            style={{ padding: "6px 10px", fontSize: "12px" }}
                            onClick={() => setDeleteCandidate(offer)}
                            title="Delete Offer"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Offer Modal */}
      {isModalOpen && (
        <AdminModal
          title={modalMode === "create" ? "Create New Offer / Discount" : `Edit Offer: ${formData.code}`}
          onClose={() => setIsModalOpen(false)}
        >
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Title & Code */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="admin-form-group">
                <label className="admin-form-label">
                  Offer Title <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="e.g. Festive Diwali Dhamaka"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
                {formErrors.title && <span style={{ color: "#ef4444", fontSize: "12px" }}>{formErrors.title}</span>}
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">
                  Coupon Code <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="e.g. FESTIVE25"
                  style={{ textTransform: "uppercase", fontWeight: 700 }}
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
                {formErrors.code && <span style={{ color: "#ef4444", fontSize: "12px" }}>{formErrors.code}</span>}
              </div>
            </div>

            {/* Category & Badge */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Offer Category</label>
                <select
                  className="admin-form-select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Badge Ribbon Text</label>
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="e.g. FESTIVE SPECIAL, LAST MINUTE"
                  value={formData.badgeText}
                  onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                />
              </div>
            </div>

            {/* Discount Type & Value */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Discount Type</label>
                <select
                  className="admin-form-select"
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat Amount (₹)</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">
                  Discount Value <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="admin-form-input"
                  placeholder={formData.discountType === "percentage" ? "e.g. 25 (%)" : "e.g. 100 (₹)"}
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                />
                {formErrors.discountValue && (
                  <span style={{ color: "#ef4444", fontSize: "12px" }}>{formErrors.discountValue}</span>
                )}
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">
                  {formData.discountType === "percentage" ? "Max Cap (₹)" : "N/A"}
                </label>
                <input
                  type="number"
                  min="0"
                  className="admin-form-input"
                  disabled={formData.discountType === "flat"}
                  placeholder="e.g. 150"
                  value={formData.maxDiscount}
                  onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                />
              </div>
            </div>

            {/* Min Order & Applicable Category */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Min Booking Total (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="admin-form-input"
                  placeholder="e.g. 250"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Applicable Entertainment Type</label>
                <select
                  className="admin-form-select"
                  value={formData.applicableFor}
                  onChange={(e) => setFormData({ ...formData, applicableFor: e.target.value })}
                >
                  {APPLICABLE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === "All" ? "All Categories (Movies, Events, Sports, Activities)" : `${opt} Only`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Validity Dates */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Start Date</label>
                <input
                  type="date"
                  className="admin-form-input"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Expiry Date</label>
                <input
                  type="date"
                  className="admin-form-input"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                />
              </div>
            </div>

            {/* Description */}
            <div className="admin-form-group">
              <label className="admin-form-label">Description / Summary</label>
              <input
                type="text"
                className="admin-form-input"
                placeholder="Short teaser shown to user on offers page & checkout"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Terms & Conditions */}
            <div className="admin-form-group">
              <label className="admin-form-label">Terms & Conditions (One per line)</label>
              <textarea
                rows="3"
                className="admin-form-textarea"
                placeholder="Enter rules for this offer..."
                value={formData.termsText}
                onChange={(e) => setFormData({ ...formData, termsText: e.target.value })}
              />
            </div>

            {/* Active Toggle Switch */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
              <input
                type="checkbox"
                id="offer-active-checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                style={{ width: "18px", height: "18px", accentColor: "var(--admin-red-primary)", cursor: "pointer" }}
              />
              <label htmlFor="offer-active-checkbox" style={{ fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                Active & Available for checkout discount
              </label>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : modalMode === "create" ? "Create Offer" : "Save Changes"}
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <AdminModal
          title="Confirm Offer Deletion"
          onClose={() => setDeleteCandidate(null)}
        >
          <div style={{ padding: "8px 0" }}>
            <p style={{ fontSize: "15px", color: "#334155", lineHeight: "1.6" }}>
              Are you sure you want to permanently delete the offer{" "}
              <strong>{deleteCandidate.code}</strong> ({deleteCandidate.title})?
            </p>
            <p style={{ fontSize: "13px", color: "#ef4444", marginTop: "8px" }}>
              Users will no longer be able to use or apply this coupon discount code during checkout.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => setDeleteCandidate(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={confirmDelete}
              >
                Yes, Delete Offer
              </button>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}

export default AdminOffers;
