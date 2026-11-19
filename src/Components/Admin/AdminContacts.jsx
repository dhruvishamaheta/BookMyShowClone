import { useState, useEffect } from "react";
import { deleteContactAdmin, getAllContactsAdmin, updateContactStatusAdmin } from "../../utils/contactStorage";
import AdminModal from "./AdminModal";
import "./AdminStyles.css";

function AdminContacts() {
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  useEffect(() => {
    loadContacts();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const loadContacts = async () => {
    setLoading(true);
    try {
      const data = await getAllContactsAdmin();
      setMessages(data || []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    const updated = await updateContactStatusAdmin(id, newStatus);
    setMessages(updated);
    if (selectedMessage && (selectedMessage.id === id || selectedMessage._id === id)) {
      setSelectedMessage((prev) => ({ ...prev, status: newStatus }));
    }
    showToast(`Status updated to "${newStatus}"`);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id || deleteTarget._id;
    const updated = await deleteContactAdmin(targetId);
    setMessages(updated);
    if (selectedMessage && (selectedMessage.id === targetId || selectedMessage._id === targetId)) {
      setSelectedMessage(null);
    }
    setDeleteTarget(null);
    showToast("Contact inquiry deleted successfully");
  };

  const filteredMessages = messages.filter((msg) => {
    const query = search.toLowerCase();
    const matchesSearch =
      (msg.name || "").toLowerCase().includes(query) ||
      (msg.email || "").toLowerCase().includes(query) ||
      (msg.subject || "").toLowerCase().includes(query) ||
      (msg.message || "").toLowerCase().includes(query) ||
      (msg.mobile || "").includes(query);

    const matchesStatus =
      statusFilter === "all" ||
      (msg.status || "New").toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const totalCount = messages.length;
  const newCount = messages.filter((m) => (m.status || "New") === "New").length;
  const inReviewCount = messages.filter((m) => m.status === "In Review").length;
  const resolvedCount = messages.filter((m) => m.status === "Resolved").length;

  return (
    <div>
      {/* Top Banner Card */}
      <div className="admin-card" style={{ marginBottom: "24px" }}>
        <div className="admin-card-header admin-card-header-centered" style={{ borderBottom: "none", paddingBottom: "0", marginBottom: "0" }}>
          <div className="admin-card-title-group admin-card-title-group-centered">
            <h2>Contact Us Inquiries</h2>
            <p>
              Manage incoming customer messages, partnership requests, and feedback submitted via the Contact Us page.
            </p>
          </div>
          <div className="admin-header-actions">
            <button type="button" className="admin-btn admin-btn-outline admin-btn-sm" onClick={loadContacts}>
              ↻ Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Stats Grid */}
      <div className="admin-stats-grid" style={{ marginBottom: "24px" }}>
        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-label">Total Inquiries</span>
            <strong className="admin-stat-value">{totalCount}</strong>
            <span className="admin-stat-desc">All customer submissions</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-label">New / Unresolved</span>
            <strong className="admin-stat-value" style={{ color: "var(--admin-red-primary)" }}>
              {newCount}
            </strong>
            <span className="admin-stat-desc">Awaiting staff response</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-label">In Review</span>
            <strong className="admin-stat-value" style={{ color: "#d97706" }}>
              {inReviewCount}
            </strong>
            <span className="admin-stat-desc">Under investigation</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-label">Resolved Queries</span>
            <strong className="admin-stat-value" style={{ color: "#059669" }}>
              {resolvedCount}
            </strong>
            <span className="admin-stat-desc">Successfully answered</span>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title-group">
            <h2>All Contact Inquiries</h2>
            <p>Click on any message row to view full content and reply</p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="text"
              className="admin-input"
              style={{ width: "240px", padding: "8px 12px" }}
              placeholder="Search sender, email, query..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="admin-input"
              style={{ width: "160px", padding: "8px 12px" }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All ({totalCount})</option>
              <option value="New">New ({newCount})</option>
              <option value="In Review">In Review ({inReviewCount})</option>
              <option value="Resolved">Resolved ({resolvedCount})</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p style={{ color: "var(--admin-text-muted)", textAlign: "center", padding: "30px" }}>
            Loading inquiries...
          </p>
        ) : filteredMessages.length === 0 ? (
          <div className="admin-empty-state">
            <h3>No Contact Inquiries Found</h3>
            <p>
              {search || statusFilter !== "all"
                ? "No inquiries match your current search or status filter."
                : "Customer submissions from the Contact Us page will appear here."}
            </p>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sender Info</th>
                  <th>Category</th>
                  <th>Message Preview</th>
                  <th>Date Received</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMessages.map((msg) => {
                  const msgId = msg.id || msg._id;
                  const isNew = (msg.status || "New") === "New";
                  const isResolved = msg.status === "Resolved";
                  const isInReview = msg.status === "In Review";

                  return (
                    <tr
                      key={msgId}
                      style={{
                        background: isNew ? "rgba(235, 78, 98, 0.03)" : "transparent",
                        cursor: "pointer",
                      }}
                      onClick={() => setSelectedMessage(msg)}
                    >
                      <td style={{ minWidth: "180px" }}>
                        <strong style={{ display: "block", color: "var(--admin-text-main)", fontSize: "14px" }}>
                          {msg.name}
                        </strong>
                        <span style={{ fontSize: "12.5px", color: "var(--admin-text-muted)" }}>{msg.email}</span>
                        {msg.mobile && (
                          <div style={{ fontSize: "11.5px", color: "var(--admin-text-light)", marginTop: "2px" }}>
                            📞 {msg.mobile}
                          </div>
                        )}
                      </td>

                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            background: "#f1f5f9",
                            color: "#334155",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "600",
                          }}
                        >
                          {msg.subject || "General Inquiry"}
                        </span>
                      </td>

                      <td style={{ maxWidth: "320px" }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "13px",
                            color: "var(--admin-text-body)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            lineHeight: "1.45",
                          }}
                        >
                          {msg.message}
                        </p>
                      </td>

                      <td style={{ whiteSpace: "nowrap", fontSize: "12.5px", color: "var(--admin-text-muted)" }}>
                        {new Date(msg.createdAt || Date.now()).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td onClick={(e) => e.stopPropagation()}>
                        <select
                          value={msg.status || "New"}
                          onChange={(e) => handleStatusChange(msgId, e.target.value)}
                          style={{
                            padding: "5px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "700",
                            border: "1px solid #cbd5e1",
                            cursor: "pointer",
                            background: isResolved ? "#ecfdf5" : isInReview ? "#fffbeb" : "#fff5f7",
                            color: isResolved ? "#059669" : isInReview ? "#d97706" : "var(--admin-red-primary)",
                          }}
                        >
                          <option value="New">New</option>
                          <option value="In Review">In Review</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </td>

                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="admin-btn admin-btn-outline admin-btn-sm"
                            onClick={() => setSelectedMessage(msg)}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn-danger admin-btn-sm"
                            onClick={() => setDeleteTarget(msg)}
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

      {/* View & Reply Modal */}
      {selectedMessage && (
        <AdminModal
          title={`Inquiry: ${selectedMessage.subject || "General Inquiry"}`}
          size="md"
          onClose={() => setSelectedMessage(null)}
          actions={
            <>
              <a
                href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject || "BookMyShow Support")}`}
                className="admin-btn admin-btn-primary"
                style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
              >
                Reply via Email
              </a>
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => setSelectedMessage(null)}
              >
                Close
              </button>
            </>
          }
        >
          <div>
            <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "6px", marginBottom: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px" }}>
              <div>
                <strong style={{ display: "block", color: "#64748b", fontSize: "11px", textTransform: "uppercase" }}>SENDER NAME</strong>
                <span style={{ color: "#0f172a", fontWeight: "700" }}>{selectedMessage.name}</span>
              </div>
              <div>
                <strong style={{ display: "block", color: "#64748b", fontSize: "11px", textTransform: "uppercase" }}>EMAIL ADDRESS</strong>
                <span style={{ color: "#0f172a" }}>{selectedMessage.email}</span>
              </div>
              <div>
                <strong style={{ display: "block", color: "#64748b", fontSize: "11px", textTransform: "uppercase" }}>MOBILE NUMBER</strong>
                <span style={{ color: "#0f172a" }}>{selectedMessage.mobile || "Not provided"}</span>
              </div>
              <div>
                <strong style={{ display: "block", color: "#64748b", fontSize: "11px", textTransform: "uppercase" }}>DATE RECEIVED</strong>
                <span style={{ color: "#0f172a" }}>
                  {new Date(selectedMessage.createdAt || Date.now()).toLocaleString("en-GB")}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <strong style={{ display: "block", color: "#64748b", fontSize: "11px", textTransform: "uppercase", marginBottom: "6px" }}>
                MESSAGE CONTENT
              </strong>
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "14px", fontSize: "14px", color: "#334155", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                {selectedMessage.message}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Update Status:</label>
              <select
                className="admin-input"
                style={{ width: "160px", padding: "6px 10px", fontSize: "13px", fontWeight: "700" }}
                value={selectedMessage.status || "New"}
                onChange={(e) => handleStatusChange(selectedMessage.id || selectedMessage._id, e.target.value)}
              >
                <option value="New">New</option>
                <option value="In Review">In Review</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>
        </AdminModal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <AdminModal
          title="Confirm Inquiry Deletion"
          size="sm"
          onClose={() => setDeleteTarget(null)}
          actions={
            <>
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={confirmDelete}
              >
                Yes, Delete Inquiry
              </button>
            </>
          }
        >
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <p style={{ fontSize: "15px", color: "var(--admin-text-main)", marginBottom: "8px" }}>
              Are you sure you want to permanently delete this inquiry from:
            </p>
            <strong style={{ fontSize: "16px", color: "var(--admin-red-primary)" }}>
              {deleteTarget.name} ({deleteTarget.email})
            </strong>
          </div>
        </AdminModal>
      )}

      {/* Toast Notification */}
      {toast && <div className="admin-toast">✓ {toast}</div>}
    </div>
  );
}

export default AdminContacts;
