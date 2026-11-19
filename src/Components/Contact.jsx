import { useState } from "react";
import { submitContactMessage } from "../utils/contactStorage";
import { isValidEmail } from "../utils/formValidation";
import "./Contact.css";

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    subject: "Ticket Booking",
    message: "",
  });

  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Full name is required.";
    if (!formData.email.trim()) {
      errs.email = "Email address is required.";
    } else if (!isValidEmail(formData.email)) {
      errs.email = "Please enter a valid email address.";
    }
    if (!formData.message.trim()) {
      errs.message = "Please enter your message or query.";
    } else if (formData.message.trim().length < 10) {
      errs.message = "Message must be at least 10 characters long.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validate();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({ name: true, email: true, message: true });
    setStatus({ type: "", message: "" });

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const result = await submitContactMessage(formData);
      setStatus({
        type: "success",
        message: result.message || "Thank you! Your message has been sent successfully.",
      });
      setFormData({
        name: "",
        email: "",
        mobile: "",
        subject: "Ticket Booking",
        message: "",
      });
      setTouched({});
      setErrors({});
    } catch (error) {
      setStatus({
        type: "error",
        message: error?.message || "Unable to send your message. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page-viewport">
      <div className="contact-page-container">
        {/* Header */}
        <div className="contact-header-section">
          <span className="contact-kicker">Get in Touch</span>
          <h1 className="contact-page-title">We'd Love to Hear From You</h1>
          <p className="contact-page-subtitle">
            Have a question about a show, a venue partnership, or need assistance with your booking? Reach out to our team.
          </p>
        </div>

        <div className="contact-layout-grid">
          {/* Left Column: Direct Info */}
          <div className="contact-info-panel">
            <h3>Customer Support</h3>
            <p className="contact-info-desc">
              Our support team is available 24/7 to assist with showtime inquiries, ticketing, and account questions.
            </p>

            <div className="contact-details-list">
              <div className="contact-detail-item">
                <div className="contact-detail-icon">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <div>
                  <strong>Email Us</strong>
                  <span>support@bookmyshow.com</span>
                </div>
              </div>

              <div className="contact-detail-item">
                <div className="contact-detail-icon">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div>
                  <strong>Phone Support</strong>
                  <span>+91 98765 43210 (Toll Free)</span>
                </div>
              </div>

              <div className="contact-detail-item">
                <div className="contact-detail-icon">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <strong>Registered Office</strong>
                  <span>Rajkot, Gujarat 360005, India</span>
                </div>
              </div>
            </div>

            <div className="contact-hours-box">
              <strong>Support Hours:</strong>
              <p>Monday – Sunday: 24 Hours Active Service</p>
            </div>
          </div>

          {/* Right Column: Interactive Form */}
          <div className="contact-form-card">
            <h3>Send Us a Message</h3>
            <p className="contact-form-subtitle">Fill in the details below and our team will get back to you promptly.</p>

            {status.message && (
              <div className={`contact-status-toast ${status.type}`}>
                {status.type === "success" ? (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                )}
                <span>{status.message}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="contact-actual-form">
              <div className="contact-input-row">
                <div className="contact-form-group">
                  <label htmlFor="contact-name">
                    Full Name <span className="req-star">*</span>
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={() => handleBlur("name")}
                    placeholder="Enter your name"
                    className={errors.name && touched.name ? "is-invalid" : ""}
                  />
                  {errors.name && touched.name && <span className="contact-error">{errors.name}</span>}
                </div>

                <div className="contact-form-group">
                  <label htmlFor="contact-email">
                    Email Address <span className="req-star">*</span>
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={() => handleBlur("email")}
                    placeholder="Enter your email"
                    className={errors.email && touched.email ? "is-invalid" : ""}
                  />
                  {errors.email && touched.email && <span className="contact-error">{errors.email}</span>}
                </div>
              </div>

              <div className="contact-input-row">
                <div className="contact-form-group">
                  <label htmlFor="contact-mobile">Mobile Number (Optional)</label>
                  <input
                    id="contact-mobile"
                    type="tel"
                    name="mobile"
                    maxLength={10}
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                  />
                </div>

                <div className="contact-form-group">
                  <label htmlFor="contact-subject">Inquiry Type</label>
                  <select
                    id="contact-subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                  >
                    <option value="Ticket Booking">Ticket Booking & QR Pass</option>
                    <option value="Event Partnership">Event Partnership & Listing</option>
                    <option value="Cancellation & Refund">Cancellation & Refund Request</option>
                    <option value="Technical Issue">Technical / Website Issue</option>
                    <option value="General Inquiry">General Feedback & Other</option>
                  </select>
                </div>
              </div>

              <div className="contact-form-group">
                <label htmlFor="contact-message">
                  Your Message <span className="req-star">*</span>
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  onBlur={() => handleBlur("message")}
                  placeholder="How can we help you today? Please provide relevant details."
                  className={errors.message && touched.message ? "is-invalid" : ""}
                />
                {errors.message && touched.message && <span className="contact-error">{errors.message}</span>}
              </div>

              <button type="submit" className="contact-submit-btn" disabled={isSubmitting}>
                {isSubmitting ? "Submitting Query..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;
