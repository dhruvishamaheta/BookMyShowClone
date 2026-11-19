import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAdminAuthenticated } from "../../utils/adminAuth";
import { getStoredUsers } from "../../utils/userStorage";
import {
  createGiftCard,
  deleteGiftCard,
  getAllGiftCardsAdmin,
  updateGiftCard,
} from "../../utils/giftCardStorage";
import AdminModal from "./AdminModal";
import "./AdminStyles.css";

const THEME_OPTIONS = [
  { id: "ruby", name: "Ruby Cinema", bg: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)", text: "#fff" },
  { id: "gold", name: "Royal Gold", bg: "linear-gradient(135deg, #d97706 0%, #b45309 100%)", text: "#fff" },
  { id: "emerald", name: "Emerald Luxe", bg: "linear-gradient(135deg, #059669 0%, #047857 100%)", text: "#fff" },
  { id: "indigo", name: "Electric Indigo", bg: "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)", text: "#fff" },
  { id: "sunset", name: "Sunset Fiesta", bg: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)", text: "#fff" },
  { id: "midnight", name: "Midnight VIP", bg: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", text: "#fff" },
];

const CATEGORIES = ["Movies", "Festive", "Birthday", "Celebration", "VIP Rewards", "General"];
const DENOMINATIONS = [250, 500, 1000, 2000, 5000];

function generateCode() {
  const letters = Math.random().toString(36).substring(2, 6).toUpperCase();
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `BMS-GIFT-${letters}-${digits}`;
}

function generatePin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

const emptyForm = {
  title: "Movie Lover Premier Card",
  code: generateCode(),
  pin: generatePin(),
  amount: 500,
  category: "Movies",
  themeColor: "ruby",
  recipientEmail: "",
  recipientName: "",
  recipientUserId: "",
  senderName: "BookMyShow Admin",
  message: "Enjoy your favourite movies and shows on BookMyShow!",
  expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  status: "active",
};

function AdminGiftCards() {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAllGiftCardsAdmin();
      setCards(data || []);
      const u = getStoredUsers();
      setUsers(u || []);
    } catch {
      showToast("Error loading gift cards.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate("/admin/login");
      return;
    }
    loadData();
  }, [navigate]);

  const openCreateModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setForm({
      ...emptyForm,
      code: generateCode(),
      pin: generatePin(),
      expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (card) => {
    setIsEditMode(true);
    setEditingId(card.id || card._id);
    setForm({
      title: card.title || "",
      code: card.code || "",
      pin: card.pin || "",
      amount: card.amount || 500,
      category: card.category || "Movies",
      themeColor: card.themeColor || "ruby",
      recipientEmail: card.recipientEmail || "",
      recipientName: card.recipientName || "",
      recipientUserId: card.recipientUserId || "",
      senderName: card.senderName || "BookMyShow Admin",
      message: card.message || "",
      expiryDate: card.expiryDate ? new Date(card.expiryDate).toISOString().slice(0, 10) : "",
      status: card.status || "active",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleUserSelect = (e) => {
    const selectedEmail = e.target.value;
    if (!selectedEmail) {
      setForm((prev) => ({
        ...prev,
        recipientEmail: "",
        recipientName: "",
        recipientUserId: "",
      }));
      return;
    }
    const matched = users.find((u) => u.email?.toLowerCase() === selectedEmail.toLowerCase());
    setForm((prev) => ({
      ...prev,
      recipientEmail: selectedEmail,
      recipientName: matched?.name || matched?.username || selectedEmail.split("@")[0],
      recipientUserId: matched?.id || matched?._id || "",
    }));
  };

  const validate = () => {
    const errors = {};
    if (!form.title.trim()) errors.title = "Title is required";
    if (!form.code.trim()) errors.code = "Voucher Code is required";
    if (!form.pin.trim()) errors.pin = "PIN is required";
    if (!form.amount || Number(form.amount) <= 0) errors.amount = "Enter a valid amount (₹)";
    if (!form.expiryDate) errors.expiryDate = "Expiry date is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      if (isEditMode) {
        await updateGiftCard(editingId, {
          ...form,
          amount: Number(form.amount),
        });
        showToast("Gift Card updated successfully!");
      } else {
        await createGiftCard({
          ...form,
          amount: Number(form.amount),
        });
        showToast(`Gift Card '${form.code}' issued successfully!`);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err?.message || "Failed to save gift card", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteGiftCard(deleteTarget.id || deleteTarget._id);
      showToast("Gift Card deleted.");
      setDeleteTarget(null);
      loadData();
    } catch {
      showToast("Failed to delete.", "error");
    }
  };

  const handleToggleStatus = async (card) => {
    const newStatus = card.status === "active" ? "disabled" : "active";
    try {
      await updateGiftCard(card.id || card._id, { status: newStatus });
      showToast(`Status updated to ${newStatus}.`);
      loadData();
    } catch {
      showToast("Failed to update status", "error");
    }
  };

  const copyCardDetails = (card) => {
    const text = `BookMyShow Gift Card: ${card.title}\nCode: ${card.code}\nPIN: ${card.pin}\nAmount: ₹${card.amount}\nValid till: ${new Date(card.expiryDate).toLocaleDateString()}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast("Gift Card code & PIN copied to clipboard!");
    }
  };

  // Metrics
  const totalCards = cards.length;
  const activeCards = cards.filter((c) => c.status === "active").length;
  const totalValue = cards.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const totalRemaining = cards.reduce((sum, c) => sum + (Number(c.balance !== undefined ? c.balance : c.amount) || 0), 0);
  const totalRedeemed = totalValue - totalRemaining;

  // Filter & Search
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        card.title?.toLowerCase().includes(q) ||
        card.code?.toLowerCase().includes(q) ||
        card.recipientName?.toLowerCase().includes(q) ||
        card.recipientEmail?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && card.status === "active") ||
        (statusFilter === "redeemed" && (card.status === "redeemed" || card.balance === 0)) ||
        (statusFilter === "disabled" && card.status === "disabled") ||
        (statusFilter === "expired" && (card.status === "expired" || new Date(card.expiryDate) < new Date()));

      return matchesSearch && matchesStatus;
    });
  }, [cards, search, statusFilter]);

  const activeTheme = THEME_OPTIONS.find((t) => t.id === form.themeColor) || THEME_OPTIONS[0];

  return (
    <div className="admin-page-container">
      {/* Toast Notification */}
      {toast && (
        <div className={`admin-toast ${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="admin-card" style={{ marginBottom: "20px" }}>
        <div className="admin-card-header">
          <div className="admin-card-title-group">
            <h2>Gift Cards Management</h2>
            <p>Issue, distribute, and manage BookMyShow digital gift cards and vouchers for users.</p>
          </div>
          <div className="admin-header-actions">
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={openCreateModal}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Issue New Gift Card</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Stat Cards */}
      <div className="admin-stats-grid" style={{ marginBottom: "24px" }}>
        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-label">Total Issued Cards</span>
            <strong className="admin-stat-value">{totalCards}</strong>
          </div>
          <div className="admin-stat-icon" style={{ background: "rgba(225, 29, 72, 0.1)", color: "#e11d48" }}>
            🎁
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-label">Active & Redeemable</span>
            <strong className="admin-stat-value">{activeCards}</strong>
          </div>
          <div className="admin-stat-icon" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
            ✅
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-label">Total Value Issued</span>
            <strong className="admin-stat-value">₹{totalValue.toLocaleString()}</strong>
          </div>
          <div className="admin-stat-icon" style={{ background: "rgba(217, 119, 6, 0.1)", color: "#d97706" }}>
            💰
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-label">Redeemed Amount</span>
            <strong className="admin-stat-value">₹{totalRedeemed.toLocaleString()}</strong>
          </div>
          <div className="admin-stat-icon" style={{ background: "rgba(79, 70, 229, 0.1)", color: "#4f46e5" }}>
            🎟️
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="admin-card" style={{ marginBottom: "20px" }}>
        <div className="admin-filter-bar">
          <div className="admin-search-box">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by code, title, user name, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button type="button" className="admin-search-clear" onClick={() => setSearch("")}>
                ✕
              </button>
            )}
          </div>

          <div className="admin-tab-group">
            {[
              { id: "all", label: "All Cards" },
              { id: "active", label: "Active" },
              { id: "redeemed", label: "Redeemed" },
              { id: "disabled", label: "Disabled" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`admin-tab-btn ${statusFilter === tab.id ? "active" : ""}`}
                onClick={() => setStatusFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gift Cards Grid / Table */}
      {loading ? (
        <div className="admin-loading-state">
          <div className="admin-spinner" />
          <p>Loading Gift Cards...</p>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="admin-card admin-empty-card">
          <div className="admin-empty-icon">🎁</div>
          <h3>No Gift Cards Found</h3>
          <p>
            {search || statusFilter !== "all"
              ? "No gift cards match your filter criteria."
              : "Click 'Issue New Gift Card' above to provide gift cards to users."}
          </p>
          <button type="button" className="admin-btn admin-btn-primary" onClick={openCreateModal}>
            Issue First Gift Card
          </button>
        </div>
      ) : (
        <div className="admin-grid-cards">
          {filteredCards.map((card) => {
            const cardId = card.id || card._id;
            const theme = THEME_OPTIONS.find((t) => t.id === card.themeColor) || THEME_OPTIONS[0];
            const isExpired = card.expiryDate && new Date(card.expiryDate) < new Date();
            const isRedeemed = card.status === "redeemed" || card.balance === 0;

            return (
              <div key={cardId} className="admin-giftcard-box">
                {/* Visual Card Banner Preview */}
                <div className="admin-giftcard-visual" style={{ background: theme.bg, color: theme.text }}>
                  <div className="visual-top-row">
                    <span className="visual-brand">BookMyShow</span>
                    <span className="visual-category">{card.category || "Gift Card"}</span>
                  </div>
                  <div className="visual-middle">
                    <h3 className="visual-title">{card.title}</h3>
                    <div className="visual-amount">₹{Number(card.amount).toLocaleString()}</div>
                  </div>
                  <div className="visual-bottom-row">
                    <div className="visual-code-chip">
                      <code>{card.code}</code>
                      <span className="visual-pin-badge">PIN: {card.pin}</span>
                    </div>
                  </div>
                </div>

                {/* Card Meta & Details */}
                <div className="admin-giftcard-details">
                  <div className="admin-giftcard-info-row">
                    <span className="meta-label">Recipient:</span>
                    <strong className="meta-value">
                      {card.recipientName || card.recipientEmail ? (
                        <span>
                          👤 {card.recipientName || "User"}{" "}
                          <small style={{ color: "#64748b" }}>({card.recipientEmail})</small>
                        </span>
                      ) : (
                        <span className="badge-open-voucher">🌐 Open Voucher (Any User)</span>
                      )}
                    </strong>
                  </div>

                  <div className="admin-giftcard-info-row">
                    <span className="meta-label">Remaining Balance:</span>
                    <strong className="meta-value balance-value">
                      ₹{Number(card.balance !== undefined ? card.balance : card.amount).toLocaleString()}
                    </strong>
                  </div>

                  <div className="admin-giftcard-info-row">
                    <span className="meta-label">Expiry Date:</span>
                    <span className={`meta-value ${isExpired ? "text-danger" : ""}`}>
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

                  <div className="admin-giftcard-info-row">
                    <span className="meta-label">Status:</span>
                    <span
                      className={`admin-status-badge ${
                        isRedeemed ? "redeemed" : card.status === "active" ? "active" : "disabled"
                      }`}
                    >
                      {isRedeemed ? "Redeemed" : card.status === "active" ? "Active" : "Disabled"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="admin-giftcard-actions">
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm admin-btn-secondary"
                      onClick={() => copyCardDetails(card)}
                      title="Copy code, PIN, and details to clipboard"
                    >
                      📋 Copy
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm admin-btn-secondary"
                      onClick={() => handleToggleStatus(card)}
                      title="Toggle active/disabled status"
                    >
                      {card.status === "active" ? "Disable" : "Enable"}
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm admin-btn-secondary"
                      onClick={() => openEditModal(card)}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm admin-btn-danger"
                      onClick={() => setDeleteTarget(card)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <AdminModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={isEditMode ? "Edit Gift Card" : "Issue Gift Card to User"}
        >
          <form onSubmit={handleSubmit} className="admin-form-modern">
            {/* Live Interactive Preview Card */}
            <div style={{ marginBottom: "20px" }}>
              <label className="admin-form-label" style={{ marginBottom: "8px", display: "block" }}>
                Gift Card Live Preview
              </label>
              <div
                style={{
                  background: activeTheme.bg,
                  color: activeTheme.text,
                  borderRadius: "16px",
                  padding: "20px 24px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <strong style={{ fontSize: "16px", letterSpacing: "1px" }}>BookMyShow</strong>
                  <span
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      padding: "4px 10px",
                      borderRadius: "20px",
                      fontSize: "11px",
                      fontWeight: "700",
                      textTransform: "uppercase",
                    }}
                  >
                    {form.category}
                  </span>
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "18px", fontWeight: "800", marginBottom: "4px" }}>
                    {form.title || "Gift Card Title"}
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: "900" }}>₹{Number(form.amount || 0).toLocaleString()}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                  <span style={{ fontFamily: "monospace", letterSpacing: "1px", background: "rgba(0,0,0,0.25)", padding: "4px 8px", borderRadius: "6px" }}>
                    {form.code || "BMS-GIFT-XXXX"}
                  </span>
                  <span style={{ background: "rgba(255,255,255,0.25)", padding: "4px 8px", borderRadius: "6px", fontWeight: "700" }}>
                    PIN: {form.pin || "0000"}
                  </span>
                </div>
              </div>
            </div>

            {/* Select Target User */}
            <div className="admin-form-group">
              <label className="admin-form-label">
                Provide / Assign to Specific User (Optional):
              </label>
              <select
                className="admin-form-input"
                value={form.recipientEmail}
                onChange={handleUserSelect}
              >
                <option value="">-- Open Voucher (Any User with Code & PIN can redeem) --</option>
                {users.map((u) => {
                  const uid = u.id || u._id;
                  const display = `${u.name || u.username || "User"} (${u.email}) - ${u.city || "India"}`;
                  return (
                    <option key={uid || u.email} value={u.email}>
                      👤 {display}
                    </option>
                  );
                })}
              </select>
              <small className="admin-form-hint">
                If selected, this Gift Card will directly appear in that user's "My Gift Cards" hub!
              </small>
            </div>

            {/* Title & Category */}
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-form-label">Gift Card Title *</label>
                <input
                  type="text"
                  className={`admin-form-input ${formErrors.title ? "error" : ""}`}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Birthday Special Gift Voucher"
                />
                {formErrors.title && <span className="admin-form-error">{formErrors.title}</span>}
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Occasion / Category</label>
                <select
                  className="admin-form-input"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Amount / Denomination */}
            <div className="admin-form-group">
              <label className="admin-form-label">Card Value / Amount (₹) *</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                {DENOMINATIONS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    className={`admin-denom-chip ${Number(form.amount) === val ? "selected" : ""}`}
                    onClick={() => setForm({ ...form, amount: val })}
                  >
                    ₹{val}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="1"
                className={`admin-form-input ${formErrors.amount ? "error" : ""}`}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                placeholder="Or enter custom amount in ₹"
              />
              {formErrors.amount && <span className="admin-form-error">{formErrors.amount}</span>}
            </div>

            {/* Code & PIN with Regenerate */}
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-form-label">Voucher Code *</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    className={`admin-form-input ${formErrors.code ? "error" : ""}`}
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  />
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary"
                    onClick={() => setForm({ ...form, code: generateCode() })}
                    title="Generate new unique code"
                  >
                    🎲
                  </button>
                </div>
                {formErrors.code && <span className="admin-form-error">{formErrors.code}</span>}
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Card Security PIN *</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    maxLength="6"
                    className={`admin-form-input ${formErrors.pin ? "error" : ""}`}
                    value={form.pin}
                    onChange={(e) => setForm({ ...form, pin: e.target.value })}
                  />
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary"
                    onClick={() => setForm({ ...form, pin: generatePin() })}
                    title="Generate new PIN"
                  >
                    🎲
                  </button>
                </div>
                {formErrors.pin && <span className="admin-form-error">{formErrors.pin}</span>}
              </div>
            </div>

            {/* Theme / Visual Style */}
            <div className="admin-form-group">
              <label className="admin-form-label">Theme Color & Card Style</label>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {THEME_OPTIONS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    style={{
                      background: t.bg,
                      color: "#fff",
                      border: form.themeColor === t.id ? "3px solid #000" : "2px solid transparent",
                      padding: "8px 14px",
                      borderRadius: "8px",
                      fontWeight: "700",
                      fontSize: "12px",
                      cursor: "pointer",
                      boxShadow: form.themeColor === t.id ? "0 0 0 2px #e11d48" : "none",
                    }}
                    onClick={() => setForm({ ...form, themeColor: t.id })}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Expiry Date */}
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-form-label">Valid Until (Expiry Date) *</label>
                <input
                  type="date"
                  className="admin-form-input"
                  value={form.expiryDate}
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Status</label>
                <select
                  className="admin-form-input"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </div>

            {/* Message */}
            <div className="admin-form-group">
              <label className="admin-form-label">Personalized Message</label>
              <textarea
                className="admin-form-input"
                rows="2"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Message for recipient..."
              />
            </div>

            {/* Actions */}
            <div className="admin-modal-actions" style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
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
                {isSubmitting ? "Saving..." : isEditMode ? "Save Changes" : "Issue Gift Card"}
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <AdminModal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          title="Delete Gift Card"
        >
          <div style={{ padding: "8px 0 16px" }}>
            <p>
              Are you sure you want to delete Gift Card <strong>'{deleteTarget.title}'</strong> (Code:{" "}
              <code>{deleteTarget.code}</code>)?
            </p>
            <p style={{ color: "#e11d48", fontSize: "13px", marginTop: "8px" }}>
              This action cannot be undone. Any user holding this code will not be able to redeem it.
            </p>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-danger"
              onClick={handleDelete}
            >
              Confirm Delete
            </button>
          </div>
        </AdminModal>
      )}
    </div>
  );
}

export default AdminGiftCards;

