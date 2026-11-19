import { useEffect } from "react";
import {BrowserRouter as Router,Routes,Route,useLocation,} from "react-router-dom";

import Navbar from "./Components/Navbar.jsx";
import Home from "./Components/Home.jsx";
import Movies from "./Components/Movies.jsx";
import Events from "./Components/Events.jsx";
import Contact from "./Components/Contact.jsx";
import Footer from "./Components/Footer.jsx";
import Sports from "./Components/Sports.jsx";
import Profile from "./Components/Profile.jsx";
import Activities from "./Components/Activities.jsx";
import PrivacyPolicy from "./Components/PrivacyPolicy.jsx";
import Terms from "./Components/Terms.jsx";
import Offers from "./Components/Offers.jsx";
import GiftCards from "./Components/GiftCards.jsx";
import UserLogin from "./Components/UserLogin.jsx";
import UserSignup from "./Components/UserSignup.jsx";
import ForgotPassword from "./Components/ForgotPassword.jsx";
import ResetPassword from "./Components/ResetPassword.jsx";
import OtpVerification from "./Components/OtpVerification.jsx";

import Search from "./Components/Search.jsx";
import SearchOverlay from "./Components/SearchOverlay.jsx";
import { SearchOverlayProvider } from "./context/SearchOverlayContext.jsx";

// Booking flow imports
import MovieDetails from "./Components/MovieDetails.jsx";
import ShowtimeList from "./Components/ShowtimeList.jsx";
import SeatSelection from "./Components/SeatSelection.jsx";

import Payment from "./Components/payment.jsx";
import Success from "./Components/success.jsx";

import EventDetails from "./Components/EventDetails.jsx";
import EventSeatSelection from "./Components/EventSeatSelection.jsx";
import EventPassBooking from "./Components/EventPassBooking.jsx";
import ActivityDetails from "./Components/ActivityDetails.jsx";

import SportsDetails from "./Components/SportsDetails.jsx";
import SportsSeatSelection from "./Components/SportsSeatSelection.jsx";

import AdminRoute from "./Components/Admin/AdminRoute.jsx";
import AdminLogin from "./Components/Admin/AdminLogin.jsx";
import AdminDashboard from "./Components/Admin/AdminDashboard.jsx";
import AdminMovies from "./Components/Admin/AdminMovies.jsx";
import AdminEvents from "./Components/Admin/AdminEvents.jsx";
import AdminSports from "./Components/Admin/AdminSports.jsx";
import AdminActivities from "./Components/Admin/AdminActivities.jsx";
import AdminOffers from "./Components/Admin/AdminOffers.jsx";
import AdminGiftCards from "./Components/Admin/AdminGiftCards.jsx";
import AdminUsers from "./Components/Admin/AdminUsers.jsx";
import AdminBookings from "./Components/Admin/AdminBookings.jsx";
import AdminContacts from "./Components/Admin/AdminContacts.jsx";
import AdminReviews from "./Components/Admin/AdminReviews.jsx";
import { initializeAdminData } from "./utils/adminData";
import AIChatbot from "./Components/Chatbot/AIChatbot.jsx";

function AppShell() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAuthRoute =
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/forgot-password" ||
    location.pathname === "/reset-password" ||
    location.pathname === "/otp-verification";
  const hideChrome = isAdminRoute || isAuthRoute;
  return (
    <div className="app-shell-root">
      <SearchOverlay />
      {!hideChrome && <Navbar />}
      <main className="app-main-content">
        <Routes>
          {/* Main Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/events" element={<Events />} />
          <Route path="/sports" element={<Sports />} />
          <Route path="/activity" element={<Activities />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/giftcards" element={<GiftCards />} />
          <Route path="/gift-cards" element={<GiftCards />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<UserLogin />} />
          <Route path="/signup" element={<UserSignup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/otp-verification" element={<OtpVerification />} />

          {/* Movie Booking Flow */}
          <Route path="/movie/:id" element={<MovieDetails />} />
          <Route path="/showtimes/:id" element={<ShowtimeList />} />
          <Route path="/seats/:id/:time" element={<SeatSelection />} />

          {/* Event Booking Flow */}
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/events/:id/seats" element={<EventSeatSelection />} />
          <Route path="/events/:id/pass" element={<EventPassBooking />} />

          {/* Activity Booking Flow */}
          <Route path="/activity/:id" element={<ActivityDetails />} />

          {/* Sports Booking Flow */}
          <Route path="/sports/:id" element={<SportsDetails />} />
          <Route path="/sports/:id/seats" element={<SportsSeatSelection />} />

          {/* Admin Panel */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/movies"
            element={
              <AdminRoute>
                <AdminMovies />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/events"
            element={
              <AdminRoute>
                <AdminEvents />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/sports"
            element={
              <AdminRoute>
                <AdminSports />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/activities"
            element={
              <AdminRoute>
                <AdminActivities />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/offers"
            element={
              <AdminRoute>
                <AdminOffers />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/giftcards"
            element={
              <AdminRoute>
                <AdminGiftCards />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <AdminRoute>
                <AdminBookings />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/reviews"
            element={
              <AdminRoute>
                <AdminReviews />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/contacts"
            element={
              <AdminRoute>
                <AdminContacts />
              </AdminRoute>
            }
          />

          {/* Common Payment & Success (for all types) */}
          <Route path="/payment" element={<Payment />} />
          <Route path="/success" element={<Success />} />
        </Routes>
      </main>
      {!hideChrome && <Footer />}
      {!isAdminRoute && <AIChatbot />}
    </div>
  );
}

function App() {
  useEffect(() => {
    initializeAdminData();
  }, []);

  return (
    <SearchOverlayProvider>
      <Router>
        <AppShell />
      </Router>
    </SearchOverlayProvider>
  );
}

export default App;