import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getStoredActivities,
  getStoredEvents,
  getStoredMovies,
  getStoredSports,
  initializeAdminData,
} from "../../utils/adminData";
import { getStoredUsers } from "../../utils/userStorage";
import { getAllBookingsAdmin, getAllReviewsAdmin } from "../../utils/ticketStorage";
import { getAllContactsAdmin } from "../../utils/contactStorage";
import { getAdminOffers } from "../../utils/offerStorage";
import { getAllGiftCardsAdmin } from "../../utils/giftCardStorage";
import { isAdminAuthenticated } from "../../utils/adminAuth";
import { getItemDateStatus } from "../../utils/dateUtils";
import "./AdminStyles.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [movies, setMovies] = useState([]);
  const [events, setEvents] = useState([]);
  const [sports, setSports] = useState({});
  const [activities, setActivities] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [messages, setMessages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [offers, setOffers] = useState([]);
  const [giftCards, setGiftCards] = useState([]);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate("/admin/login");
      return;
    }

    const loadData = async () => {
      try {
        await initializeAdminData();
      } catch {
        // fallback
      } finally {
        const m = getStoredMovies();
        const e = getStoredEvents();
        const s = getStoredSports();
        const a = getStoredActivities();
        const u = getStoredUsers();
        const b = await getAllBookingsAdmin();
        const c = await getAllContactsAdmin();
        const r = await getAllReviewsAdmin();
        const o = await getAdminOffers();
        const g = await getAllGiftCardsAdmin();

        setMovies(m);
        setEvents(e);
        setSports(s);
        setActivities(a);
        setUsers(u);
        setBookings(b);
        setMessages(c || []);
        setReviews(r || []);
        setOffers(o || []);
        setGiftCards(g || []);
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const sportsList = Object.values(sports || {});
  const sportsCount = sportsList.length;
  const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  const activeMovies = movies.filter((m) => getItemDateStatus(m).status === "active").length;
  const activeEvents = events.filter((e) => getItemDateStatus(e).status === "active").length;
  const activeSports = sportsList.filter((s) => getItemDateStatus(s).status === "active").length;
  const activeActivities = activities.filter((a) => getItemDateStatus(a).status === "active").length;

  const recentBookings = bookings.slice(0, 5);

  return (
    <div>
      {/* Welcome Banner Card */}
      <div className="admin-card" style={{ marginBottom: "24px" }}>
        <div className="admin-card-header admin-card-header-centered" style={{ borderBottom: "none", paddingBottom: "0", marginBottom: "0" }}>
          <div className="admin-card-title-group admin-card-title-group-centered">
            <h2>Welcome to BookMyShow Admin</h2>
            <p>
              Manage your entertainment catalog, monitor real-time ticket reservations, and administer user accounts.
            </p>
          </div>
          <div className="admin-header-actions" />
        </div>
      </div>

      {/* Metrics Stat Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-label">Total Movies</span>
            <strong className="admin-stat-value">{movies.length}</strong>
            <span className="admin-stat-desc">{activeMovies} Active on User Side</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-label">Live Events</span>
            <strong className="admin-stat-value">{events.length}</strong>
            <span className="admin-stat-desc">{activeEvents} Active on User Side</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-label">Sports Events</span>
            <strong className="admin-stat-value">{sportsCount}</strong>
            <span className="admin-stat-desc">{activeSports} Active on User Side</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-label">Activities</span>
            <strong className="admin-stat-value">{activities.length}</strong>
            <span className="admin-stat-desc">{activeActivities} Active on User Side</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-label">Users</span>
            <strong className="admin-stat-value">{users.length}</strong>
            <span className="admin-stat-desc">Registered Customers</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-label">Total Bookings</span>
            <strong className="admin-stat-value">{bookings.length}</strong>
            <span className="admin-stat-desc">Tickets Issued</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-label">Reviews & Ratings</span>
            <strong className="admin-stat-value" style={{ color: "#f59e0b" }}>
              ⭐ {reviews.length}
            </strong>
            <span className="admin-stat-desc">Customer Ratings</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-label">Contact Us</span>
            <strong className="admin-stat-value">{messages.length}</strong>
            <span className="admin-stat-desc">Inquiries & Feedback</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-label">Offers & Deals</span>
            <strong className="admin-stat-value" style={{ color: "#e11d48" }}>
              {offers.length}
            </strong>
            <span className="admin-stat-desc">Festive & Last Minute</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-label">Gift Cards</span>
            <strong className="admin-stat-value" style={{ color: "#d97706" }}>
              {giftCards.length}
            </strong>
            <span className="admin-stat-desc">Issued to Customers</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-label">Total Revenue</span>
            <strong className="admin-stat-value" style={{ color: "#059669" }}>
              ₹{totalRevenue.toLocaleString("en-IN")}
            </strong>
            <span className="admin-stat-desc">Gross Ticket Sales</span>
          </div>
        </div>
      </div>

      {/* Recent Bookings Table Card */}
      <div className="admin-card">
        <div className="admin-card-header admin-card-header-centered">
          <div className="admin-card-title-group admin-card-title-group-centered">
            <h2>Recent Bookings</h2>
            <p>Latest customer ticket orders across all categories</p>
          </div>
          <Link to="/admin/bookings" className="admin-btn admin-btn-outline admin-btn-sm">
            View All
          </Link>
        </div>

        {loading ? (
          <p style={{ color: "var(--admin-text-muted)", textAlign: "center", padding: "20px" }}>
            Loading data...
          </p>
        ) : recentBookings.length === 0 ? (
          <div className="admin-empty-state">
            <h3>No Bookings Yet</h3>
            <p>Customer reservations will appear here in real-time.</p>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID & Event</th>
                  <th>Customer</th>
                  <th>Date / Time</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b.id || b._id}>
                    <td>
                      <strong>{b.title}</strong>
                      <small style={{ display: "block", color: "var(--admin-text-muted)" }}>
                        {b.id} • {b.type}
                      </small>
                    </td>
                    <td>
                      <span>{b.customerName || "Customer"}</span>
                    </td>
                    <td>
                      <span>{b.date}</span>
                      <small style={{ display: "block", color: "var(--admin-text-muted)" }}>
                        {b.showtime}
                      </small>
                    </td>
                    <td>
                      <strong style={{ color: "var(--admin-red-primary)" }}>₹{b.amount}</strong>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-green">
                        {b.status || "Confirmed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
