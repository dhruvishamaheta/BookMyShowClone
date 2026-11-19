import { useEffect, useMemo, useState } from "react";
import { getAllBookingsAdmin, deleteBookingAdmin, clearAllBookingsAdmin } from "../../utils/ticketStorage";
import { isAdminAuthenticated } from "../../utils/adminAuth";
import { paginateItems, sortAdminItems } from "../../utils/adminListUtils";
import AdminModal from "./AdminModal";
import "./AdminStyles.css";

function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("recent");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      window.location.href = "/admin/login";
      return;
    }

    const loadBookings = async () => {
      try {
        const data = await getAllBookingsAdmin();
        setBookings(data || []);
      } catch {
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();
    const base = bookings.filter((b) => {
      const matchesQuery =
        !query ||
        [
          b.id,
          b.title,
          b.customerName,
          b.customerEmail,
          b.customerMobile,
          b.theatre,
          b.type,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesType =
        typeFilter === "All" ||
        (b.type || "Movie").toLowerCase() === typeFilter.toLowerCase();

      const matchesStatus =
        statusFilter === "All" ||
        (b.status || "Confirmed").toLowerCase() === statusFilter.toLowerCase();

      return matchesQuery && matchesType && matchesStatus;
    });

    if (sortBy === "amount-high") {
      return [...base].sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0));
    }
    if (sortBy === "amount-low") {
      return [...base].sort((a, b) => (Number(a.amount) || 0) - (Number(b.amount) || 0));
    }
    return sortAdminItems(base, "alphabetical");
  }, [bookings, search, typeFilter, statusFilter, sortBy]);

  const pagedBookings = useMemo(
    () => paginateItems(filteredBookings, page, pageSize),
    [filteredBookings, page, pageSize]
  );

  const totalRevenue = bookings.reduce(
    (sum, b) => sum + (Number(b.amount) || 0),
    0
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id || deleteTarget._id;
    await deleteBookingAdmin(id);
    const updated = bookings.filter((b) => b.id !== id && b._id !== id);
    setBookings(updated);
    if (selectedBooking?.id === id) setSelectedBooking(null);
    setDeleteTarget(null);
    setToast("Booking removed successfully.");
  };

  const handleClearAll = async () => {
    await clearAllBookingsAdmin();
    setBookings([]);
    setClearOpen(false);
    setSelectedBooking(null);
    setToast("All bookings were cleared.");
  };

  return (
    <div>
      {/* Header Card */}
      <div className="admin-card">
        <div className="admin-card-header admin-card-header-centered">
          <div className="admin-card-title-group admin-card-title-group-centered">
            <h2>Bookings Management</h2>
            <p>Monitor real-time ticket sales, inspect seat allocations, and manage reservations.</p>
          </div>
          <div className="admin-header-actions">
            <button
              type="button"
              className="admin-btn admin-btn-danger admin-btn-sm"
              onClick={() => setClearOpen(true)}
              disabled={bookings.length === 0}
            >
              Clear All Bookings
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="admin-stats-grid" style={{ marginBottom: "22px" }}>
          <div className="admin-stat-card">
            <div className="admin-stat-info">
              <span className="admin-stat-label">Total Tickets</span>
              <strong className="admin-stat-value">{bookings.length}</strong>
              <span className="admin-stat-desc">Bookings placed</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-info">
              <span className="admin-stat-label">Total Revenue</span>
              <strong className="admin-stat-value" style={{ color: "#059669" }}>
                ₹{totalRevenue.toLocaleString("en-IN")}
              </strong>
              <span className="admin-stat-desc">Gross tickets income</span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="admin-toolbar">
          <div className="admin-search-box">
            <svg
              className="admin-search-svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="admin-search-input"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by Booking ID, Movie / Event name, Customer, or Venue..."
            />
          </div>

          <div className="admin-filters-group">
            <select
              className="admin-select"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All Categories</option>
              <option value="Movie">Movies</option>
              <option value="Event">Events</option>
              <option value="Sport">Sports</option>
              <option value="Activity">Activities</option>
            </select>

            <select
              className="admin-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="recent">Alphabetical</option>
              <option value="amount-high">Amount (High to Low)</option>
              <option value="amount-low">Amount (Low to High)</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        {loading ? (
          <p style={{ textAlign: "center", padding: "30px", color: "var(--admin-text-muted)" }}>
            Loading bookings...
          </p>
        ) : filteredBookings.length === 0 ? (
          <div className="admin-empty-state">
            <h3>No Bookings Found</h3>
            <p>No customer reservations matching your filters.</p>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Booking ID & Title</th>
                  <th>Customer Info</th>
                  <th>Venue & Timing</th>
                  <th>Seats / Passes</th>
                  <th>Amount Paid</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedBookings.items.map((b) => (
                  <tr key={b.id || b._id}>
                    <td>
                      <strong>{b.title}</strong>
                      <small style={{ display: "block", color: "var(--admin-red-dark)", fontFamily: "monospace", fontWeight: "700" }}>
                        #{b.id || b._id}
                      </small>
                      <span className="admin-badge admin-badge-red" style={{ marginTop: "4px" }}>
                        {b.type || "Movie"}
                      </span>
                    </td>
                    <td>
                      <strong>{b.customerName || "Customer"}</strong>
                      <small style={{ display: "block", color: "var(--admin-text-muted)" }}>
                        {b.customerEmail || b.customerMobile || "Direct Payment"}
                      </small>
                    </td>
                    <td>
                      <span>{b.theatre || "Main Auditorium"}</span>
                      <small style={{ display: "block", color: "var(--admin-text-muted)" }}>
                        {b.date} • {b.showtime}
                      </small>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-gray">
                        {Array.isArray(b.passes) && b.passes.length > 0
                          ? b.passes.map((pass) => `${pass.name} × ${pass.quantity}`).join(", ")
                          : Array.isArray(b.seats) ? b.seats.join(", ") : (b.seats || "1 Pass")}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: "var(--admin-red-primary)", fontSize: "15px" }}>
                        ₹{b.amount}
                      </strong>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-green">
                        {b.status || "Confirmed"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="admin-actions-group" style={{ display: "inline-flex", gap: "8px" }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          onClick={() => setSelectedBooking(b)}
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          onClick={() => setDeleteTarget(b)}
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {filteredBookings.length > 0 && (
          <div className="admin-pagination">
            <div className="admin-pagination-info">
              Showing <strong>{pagedBookings.startIndex}</strong> to <strong>{pagedBookings.endIndex}</strong> of{" "}
              <strong>{pagedBookings.totalItems}</strong> bookings
            </div>
            <div className="admin-pagination-controls">
              <button
                type="button"
                className="admin-page-btn"
                onClick={() => setPage((c) => Math.max(1, c - 1))}
                disabled={page === 1}
              >
                ← Prev
              </button>
              {Array.from({ length: pagedBookings.totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`admin-page-btn ${num === page ? "active" : ""}`}
                  onClick={() => setPage(num)}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                className="admin-page-btn"
                onClick={() => setPage((c) => Math.min(pagedBookings.totalPages, c + 1))}
                disabled={page === pagedBookings.totalPages}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <AdminModal
          title={`Booking Details #${selectedBooking.id || selectedBooking._id}`}
          onClose={() => setSelectedBooking(null)}
          actions={
            <>
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => setSelectedBooking(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={() => {
                  setDeleteTarget(selectedBooking);
                }}
              >
                Cancel / Delete Booking
              </button>
            </>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                background: "linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%)",
                border: "1px solid var(--admin-red-border)",
                borderRadius: "var(--admin-radius-md)",
                padding: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: "18px", color: "var(--admin-red-dark)" }}>
                  {selectedBooking.title}
                </h3>
                <span className="admin-badge admin-badge-red">{selectedBooking.type || "Movie"}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span className="admin-badge admin-badge-green" style={{ fontSize: "13px" }}>
                  ✓ {selectedBooking.status || "Confirmed"}
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div style={{ background: "#fafafa", padding: "12px", borderRadius: "10px" }}>
                <span style={{ fontSize: "12px", color: "var(--admin-text-muted)", display: "block" }}>
                  Customer Name
                </span>
                <strong>{selectedBooking.customerName || "Customer"}</strong>
              </div>

              <div style={{ background: "#fafafa", padding: "12px", borderRadius: "10px" }}>
                <span style={{ fontSize: "12px", color: "var(--admin-text-muted)", display: "block" }}>
                  Customer Contact
                </span>
                <strong>{selectedBooking.customerEmail || selectedBooking.customerMobile || "N/A"}</strong>
              </div>

              <div style={{ background: "#fafafa", padding: "12px", borderRadius: "10px" }}>
                <span style={{ fontSize: "12px", color: "var(--admin-text-muted)", display: "block" }}>
                  Venue / Hall
                </span>
                <strong>{selectedBooking.theatre || "Main Auditorium"}</strong>
              </div>

              <div style={{ background: "#fafafa", padding: "12px", borderRadius: "10px" }}>
                <span style={{ fontSize: "12px", color: "var(--admin-text-muted)", display: "block" }}>
                  Show Date & Time
                </span>
                <strong>
                  {selectedBooking.date} • {selectedBooking.showtime}
                </strong>
              </div>

              <div style={{ background: "#fafafa", padding: "12px", borderRadius: "10px" }}>
                <span style={{ fontSize: "12px", color: "var(--admin-text-muted)", display: "block" }}>
                  Seats / Passes Reserved
                </span>
                <strong style={{ color: "var(--admin-red-primary)" }}>
                  {Array.isArray(selectedBooking.passes) && selectedBooking.passes.length > 0
                    ? selectedBooking.passes.map((pass) => `${pass.name} × ${pass.quantity}`).join(", ")
                    : Array.isArray(selectedBooking.seats)
                    ? selectedBooking.seats.join(", ")
                    : selectedBooking.seats || "1 Seat"}
                </strong>
              </div>

              <div style={{ background: "#fafafa", padding: "12px", borderRadius: "10px" }}>
                <span style={{ fontSize: "12px", color: "var(--admin-text-muted)", display: "block" }}>
                  Total Amount Paid
                </span>
                <strong style={{ color: "#059669", fontSize: "16px" }}>
                  ₹{selectedBooking.amount} ({selectedBooking.paymentMethod || "Online Payment"})
                </strong>
              </div>
            </div>
          </div>
        </AdminModal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <AdminModal
          title="Cancel & Delete Booking"
          icon="⚠️"
          size="sm"
          onClose={() => setDeleteTarget(null)}
          actions={
            <>
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => setDeleteTarget(null)}
              >
                Go Back
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={handleDelete}
              >
                Yes, Cancel Booking
              </button>
            </>
          }
        >
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <p style={{ fontSize: "15px", color: "var(--admin-text-main)", marginBottom: "10px" }}>
              Are you sure you want to cancel booking:
            </p>
            <strong style={{ fontSize: "17px", color: "var(--admin-red-primary)" }}>
              #{deleteTarget.id || deleteTarget._id} - {deleteTarget.title}
            </strong>
            <p style={{ fontSize: "13px", color: "var(--admin-text-muted)", marginTop: "10px" }}>
              The reserved seats will be released and the record will be removed.
            </p>
          </div>
        </AdminModal>
      )}

      {/* Clear All Confirmation Modal */}
      {clearOpen && (
        <AdminModal
          title="Clear All Bookings"
          icon="⚠️"
          size="sm"
          onClose={() => setClearOpen(false)}
          actions={
            <>
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => setClearOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={handleClearAll}
              >
                Confirm Clear
              </button>
            </>
          }
        >
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <p style={{ fontSize: "15px", color: "var(--admin-danger)", fontWeight: "700" }}>
              Warning: You are about to clear all ticket records!
            </p>
            <p style={{ fontSize: "13px", color: "var(--admin-text-muted)" }}>
              All history and active reservations will be removed.
            </p>
          </div>
        </AdminModal>
      )}

      {/* Toast */}
      {toast && <div className="admin-toast">✓ {toast}</div>}
    </div>
  );
}

export default AdminBookings;
