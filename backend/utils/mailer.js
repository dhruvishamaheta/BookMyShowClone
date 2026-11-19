import dotenv from "dotenv";
import nodemailer from "nodemailer";
import process from "node:process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });
dotenv.config();

function getTransporter() {
  const host = process.env.EMAIL_HOST || "smtp.gmail.com";
  const port = Number(process.env.EMAIL_PORT || 587);
  const isGmail = host.includes("gmail") || (process.env.EMAIL_USER && process.env.EMAIL_USER.endsWith("@gmail.com"));

  if (isGmail) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
      connectionTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 10000,
    socketTimeout: 15000,
  });
}

export function getEmailConfigurationStatus() {
  const configured = Boolean(process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD);
  return {
    configured,
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT || 587),
    senderConfigured: Boolean(process.env.EMAIL_USER),
    appPasswordConfigured: Boolean(process.env.EMAIL_APP_PASSWORD),
  };
}

export async function verifyEmailConnection() {
  const status = getEmailConfigurationStatus();
  if (!status.configured) {
    throw new Error("Email is not configured. Set EMAIL_USER and EMAIL_APP_PASSWORD in backend/.env.");
  }
  await getTransporter().verify();
  return status;
}

export async function sendEmail({ to, subject, html, from, text } = {}) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    throw new Error("Email is not configured. Set EMAIL_USER and EMAIL_APP_PASSWORD in backend/.env.");
  }

  if (!to || !subject || !html) {
    throw new Error("Email requires to, subject, and html values.");
  }

  const transporter = getTransporter();

  const mailOptions = {
    from: from || `"BookMyShow" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text: text || subject,
    html,
  };

  return transporter.sendMail(mailOptions);
}

export async function sendWelcomeEmail({ name, email }) {
  if (!email) return;

  const safeName = String(name || "Movie Lover").trim();
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const supportEmail = process.env.EMAIL_TO || process.env.EMAIL_USER || "dhruvishamaheta284@gmail.com";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to BookMyShow</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table role="presentation" width="100%" style="max-width: 620px; background-color: #131b2e; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b; box-shadow: 0 20px 40px rgba(0,0,0,0.5);" cellspacing="0" cellpadding="0">
          
          <!-- Top Header Brand Bar -->
          <tr>
            <td style="background: linear-gradient(135deg, #e50914 0%, #f84464 50%, #b91c1c 100%); padding: 24px 32px; text-align: center;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background: rgba(255,255,255,0.15); padding: 8px 18px; border-radius: 30px; backdrop-filter: blur(8px); margin-bottom: 8px;">
                      <span style="color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">
                        🎬 BOOK<span style="color: #fecdd3;">MY</span>SHOW
                      </span>
                    </div>
                    <h1 style="color: #ffffff; margin: 8px 0 0 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
                      Welcome to Non-Stop Entertainment! 🍿
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero Greeting -->
          <tr>
            <td style="padding: 32px 32px 20px 32px;">
              <h2 style="margin: 0 0 12px 0; color: #ffffff; font-size: 20px; font-weight: 600;">
                Hello <span style="color: #f43f5e;">${safeName}</span>,
              </h2>
              <p style="margin: 0 0 20px 0; color: #94a3b8; font-size: 15px; line-height: 1.6;">
                Thank you for joining <strong>BookMyShow</strong>! We are thrilled to have you in our entertainment family. Your account is now active and ready to explore thousands of blockbuster movies, live concerts, comedy specials, and premier sports events across India.
              </p>

              <!-- Account Summary Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #1e293b; border-radius: 12px; border: 1px solid #334155; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #f43f5e; font-weight: 700; margin-bottom: 10px;">
                      ✅ Account Details
                    </div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 4px 0; color: #94a3b8; font-size: 14px;"><strong>Name:</strong></td>
                        <td style="padding: 4px 0; color: #f8fafc; font-size: 14px; text-align: right;">${safeName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #94a3b8; font-size: 14px;"><strong>Registered Email:</strong></td>
                        <td style="padding: 4px 0; color: #f8fafc; font-size: 14px; text-align: right;">${email}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #94a3b8; font-size: 14px;"><strong>Membership Status:</strong></td>
                        <td style="padding: 4px 0; color: #10b981; font-size: 14px; text-align: right; font-weight: 600;">Active Member ★</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- What You Can Do Section -->
              <h3 style="margin: 0 0 16px 0; color: #f8fafc; font-size: 16px; font-weight: 600;">
                Discover What's Waiting For You:
              </h3>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <!-- Item 1: Movies -->
                <tr>
                  <td style="padding: 10px 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(255,255,255,0.03); border-radius: 10px; border: 1px solid #1e293b;">
                      <tr>
                        <td width="48" style="padding: 12px; text-align: center; font-size: 24px;">🎥</td>
                        <td style="padding: 12px 12px 12px 0;">
                          <div style="color: #ffffff; font-size: 14px; font-weight: 600; margin-bottom: 2px;">Latest Movies & Cinema Halls</div>
                          <div style="color: #94a3b8; font-size: 13px;">Book IMAX, 4DX, 3D, and Dolby Atmos seats at top theatres with instant M-Tickets.</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Item 2: Live Events -->
                <tr>
                  <td style="padding: 10px 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(255,255,255,0.03); border-radius: 10px; border: 1px solid #1e293b;">
                      <tr>
                        <td width="48" style="padding: 12px; text-align: center; font-size: 24px;">🎭</td>
                        <td style="padding: 12px 12px 12px 0;">
                          <div style="color: #ffffff; font-size: 14px; font-weight: 600; margin-bottom: 2px;">Live Events, Plays & Standup Comedy</div>
                          <div style="color: #94a3b8; font-size: 13px;">Experience music concerts, theatrical plays, stand-up specials, and workshops.</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Item 3: Sports & Activities -->
                <tr>
                  <td style="padding: 10px 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(255,255,255,0.03); border-radius: 10px; border: 1px solid #1e293b;">
                      <tr>
                        <td width="48" style="padding: 12px; text-align: center; font-size: 24px;">⚽</td>
                        <td style="padding: 12px 12px 12px 0;">
                          <div style="color: #ffffff; font-size: 14px; font-weight: 600; margin-bottom: 2px;">Live Sports & Fun Activities</div>
                          <div style="color: #94a3b8; font-size: 13px;">Cheer for your favourite teams in cricket, football tournaments, and theme parks.</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Item 4: Exclusive Offers -->
                <tr>
                  <td style="padding: 10px 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(255,255,255,0.03); border-radius: 10px; border: 1px solid #1e293b;">
                      <tr>
                        <td width="48" style="padding: 12px; text-align: center; font-size: 24px;">🎟️</td>
                        <td style="padding: 12px 12px 12px 0;">
                          <div style="color: #ffffff; font-size: 14px; font-weight: 600; margin-bottom: 2px;">Exclusive Offers & Snacks Combos</div>
                          <div style="color: #94a3b8; font-size: 13px;">Enjoy special bank discounts, buy-1-get-1 offers, and pre-booked delicious food.</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Call to Action Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0 16px 0;">
                <tr>
                  <td align="center">
                    <a href="${frontendUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #e50914 0%, #f84464 100%); color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; padding: 14px 36px; border-radius: 30px; box-shadow: 0 8px 20px rgba(244,63,94,0.35); text-transform: uppercase; letter-spacing: 0.5px;">
                      Start Exploring Movies & Shows 🚀
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Security Note & Help Desk -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #0f172a; border-radius: 10px; padding: 14px 18px; border-left: 4px solid #f43f5e;">
                <tr>
                  <td style="color: #94a3b8; font-size: 12px; line-height: 1.5;">
                    🔒 <strong>Security Tip:</strong> BookMyShow will never ask you for your account password or payment PIN via email or phone call. If you didn't create this account, please reach out to us at <a href="mailto:${supportEmail}" style="color: #f43f5e; text-decoration: underline;">${supportEmail}</a>.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0b0f19; padding: 24px 32px; text-align: center; border-top: 1px solid #1e293b;">
              <p style="margin: 0 0 8px 0; color: #64748b; font-size: 12px;">
                © ${new Date().getFullYear()} BookMyShow. All rights reserved.
              </p>
              <p style="margin: 0; color: #475569; font-size: 11px;">
                Crafted with ❤️ for movie and entertainment lovers everywhere.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  await sendEmail({
    to: email,
    subject: `🎉 Welcome to BookMyShow, ${safeName}! Your Entertainment Journey Starts Here`,
    html,
  });
}

export async function sendBookingConfirmationEmail({ name, email, booking }) {
  if (!email) return;

  const safeName = String(name || "Movie Lover").trim();
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const bookingId = booking?.id || booking?._id || `BMS-${Math.floor(100000 + Math.random() * 900000)}`;
  const title = booking?.title || "Movie / Event Booking";
  const seats = Array.isArray(booking?.seats) ? booking.seats.join(", ") : booking?.seats || "General Admission";
  const date = booking?.date || booking?.details?.date || new Date().toLocaleDateString("en-IN");
  const time = booking?.details?.time || "Showtime";
  const cinema = booking?.details?.cinema || booking?.details?.venue || "BookMyShow Cinema";
  const amount = booking?.amount || 0;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Booking Confirmed - BookMyShow</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #131b2e; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b;" cellspacing="0" cellpadding="0">
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">
                🎉 Booking Confirmed!
              </h1>
              <p style="color: #ecfdf5; margin: 6px 0 0 0; font-size: 14px;">
                Booking ID: <strong>#${bookingId}</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 32px;">
              <p style="color: #94a3b8; font-size: 15px; margin: 0 0 18px 0;">
                Hello <strong>${safeName}</strong>, your tickets for <strong>${title}</strong> are confirmed. Enjoy the show!
              </p>
              
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #1e293b; border-radius: 12px; border: 1px solid #334155; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 6px 0; color: #94a3b8; font-size: 14px;"><strong>Event / Movie:</strong></td>
                        <td style="padding: 6px 0; color: #f8fafc; font-size: 14px; text-align: right; font-weight: 600;">${title}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #94a3b8; font-size: 14px;"><strong>Venue / Cinema:</strong></td>
                        <td style="padding: 6px 0; color: #f8fafc; font-size: 14px; text-align: right;">${cinema}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #94a3b8; font-size: 14px;"><strong>Date & Time:</strong></td>
                        <td style="padding: 6px 0; color: #f8fafc; font-size: 14px; text-align: right;">${date} • ${time}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #94a3b8; font-size: 14px;"><strong>Seats:</strong></td>
                        <td style="padding: 6px 0; color: #f43f5e; font-size: 14px; text-align: right; font-weight: 700;">${seats}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #94a3b8; font-size: 14px;"><strong>Total Paid:</strong></td>
                        <td style="padding: 6px 0; color: #10b981; font-size: 16px; text-align: right; font-weight: 700;">₹${amount}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <div style="text-align: center; margin: 24px 0 10px 0;">
                <a href="${frontendUrl}/profile" target="_blank" style="display: inline-block; background: #f43f5e; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                  View Ticket in Profile 🎟️
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #0b0f19; padding: 16px; text-align: center; border-top: 1px solid #1e293b;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">© BookMyShow. Present this digital ticket or QR code at the venue entry.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  await sendEmail({
    to: email,
    subject: `🎟️ Booking Confirmed: ${title} (#${bookingId})`,
    html,
  });
}

function escapeEmailHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendCancellationEmail(userEmail, bookingDetails = {}) {
  if (!userEmail) {
    throw new Error("Cancellation email requires a recipient.");
  }

  const name = escapeEmailHtml(bookingDetails.name || "Movie Lover");
  const bookingId = escapeEmailHtml(bookingDetails.bookingId || "Booking");
  const title = escapeEmailHtml(bookingDetails.title || "Event / Movie");
  const venue = escapeEmailHtml(bookingDetails.venue || "Venue not available");
  const date = escapeEmailHtml(bookingDetails.date || "Date not available");
  const time = escapeEmailHtml(bookingDetails.time || "Time not available");
  const seats = escapeEmailHtml(
    Array.isArray(bookingDetails.seats) && bookingDetails.seats.length
      ? bookingDetails.seats.join(", ")
      : "General Admission"
  );
  const refundAmount = Number(bookingDetails.refundAmount || 0).toFixed(2);
  const subjectTitle = String(bookingDetails.title || "your booking").replace(/[\r\n]/g, " ");
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Cancelled - BookMyShow</title>
</head>
<body style="margin:0;padding:24px 12px;background:#f1f5f9;font-family:Arial,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;">
    <tr>
      <td style="padding:24px 20px;background:#e13c4b;border-radius:14px 14px 0 0;text-align:center;color:#ffffff;">
        <h1 style="margin:0;font-size:24px;">Booking cancelled</h1>
        <p style="margin:8px 0 0;font-size:14px;">Booking ID: <strong>${bookingId}</strong></p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;background:#ffffff;">
        <p style="margin:0 0 18px;font-size:15px;">Hello ${name}, your cancellation is confirmed. Here is your booking summary.</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:10px;">
          <tr><td style="padding:12px 14px;color:#64748b;border-bottom:1px solid #e2e8f0;">Movie / Event</td><td style="padding:12px 14px;text-align:right;font-weight:700;border-bottom:1px solid #e2e8f0;">${title}</td></tr>
          <tr><td style="padding:12px 14px;color:#64748b;border-bottom:1px solid #e2e8f0;">Venue</td><td style="padding:12px 14px;text-align:right;border-bottom:1px solid #e2e8f0;">${venue}</td></tr>
          <tr><td style="padding:12px 14px;color:#64748b;border-bottom:1px solid #e2e8f0;">Show date &amp; time</td><td style="padding:12px 14px;text-align:right;border-bottom:1px solid #e2e8f0;">${date} · ${time}</td></tr>
          <tr><td style="padding:12px 14px;color:#64748b;border-bottom:1px solid #e2e8f0;">Cancelled seats</td><td style="padding:12px 14px;text-align:right;border-bottom:1px solid #e2e8f0;">${seats}</td></tr>
          <tr><td style="padding:12px 14px;color:#64748b;">Refund amount</td><td style="padding:12px 14px;text-align:right;color:#e13c4b;font-size:18px;font-weight:700;">₹${refundAmount}</td></tr>
        </table>
        <p style="margin:18px 0 0;padding:14px;border-radius:8px;background:#fff1f2;color:#7f1d1d;font-size:14px;">
          Your refund request has been recorded for processing. Once processed by your payment provider, it is expected within 5–7 business days.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px;text-align:center;color:#64748b;font-size:12px;">Thank you for booking with BookMyShow.</td>
    </tr>
  </table>
</body>
</html>`;
  const text = [
    `Booking cancelled: ${bookingDetails.title || "Event / Movie"}`,
    `Booking ID: ${bookingDetails.bookingId || "Booking"}`,
    `Venue: ${bookingDetails.venue || "Venue not available"}`,
    `Show: ${bookingDetails.date || "Date not available"} ${bookingDetails.time || ""}`,
    `Cancelled seats: ${Array.isArray(bookingDetails.seats) ? bookingDetails.seats.join(", ") : "General Admission"}`,
    `Refund amount: ₹${refundAmount}`,
    "Expected timeline after payment-provider processing: 5–7 business days.",
  ].join("\n");

  await sendEmail({
    to: userEmail,
    subject: `Booking Cancelled: ${subjectTitle} (#${bookingId})`,
    html,
    text,
  });
}

export async function sendContactEmail({ name, email, message }) {
  const recipient = process.env.EMAIL_TO || process.env.EMAIL_USER;

  if (!recipient) {
    throw new Error("Missing EMAIL_TO or EMAIL_USER in backend/.env");
  }

  const safeName = String(name || "Unknown");
  const safeEmail = String(email || "");
  const safeMessage = String(message || "");

  const htmlAdmin = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0f172a; max-width: 580px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #e11d48; margin-bottom: 12px;">📩 New Contact Inquiry</h2>
      <p><strong>Name:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Message:</strong></p>
      <div style="padding: 14px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
        ${safeMessage.replace(/\n/g, "<br />")}
      </div>
    </div>
  `;

  await sendEmail({
    to: recipient,
    subject: `📩 New Contact Form Message from ${safeName}`,
    html: htmlAdmin,
  });

  if (safeEmail) {
    await sendEmail({
      to: safeEmail,
      subject: "We received your message - BookMyShow Support",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0f172a; max-width: 580px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #e11d48;">Thanks for reaching out, ${safeName}!</h2>
          <p>We have successfully received your inquiry and our support team will get back to you shortly.</p>
          <p><strong>Your message summary:</strong></p>
          <div style="padding: 14px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; color: #475569;">
            ${safeMessage.replace(/\n/g, "<br />")}
          </div>
          <p style="margin-top: 20px; font-size: 13px; color: #64748b;">Warm regards,<br/>BookMyShow Customer Experience Team</p>
        </div>
      `,
    });
  }
}

export async function sendSignInWelcomeEmail({ name, email, loginTime } = {}) {
  if (!email) return;

  const safeName = String(name || "Movie Lover").trim();
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const supportEmail = process.env.EMAIL_TO || process.env.EMAIL_USER || "dhruvishamaheta284@gmail.com";
  const formattedTime = loginTime || new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome Back to BookMyShow</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table role="presentation" width="100%" style="max-width: 620px; background-color: #131b2e; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b; box-shadow: 0 20px 40px rgba(0,0,0,0.5);" cellspacing="0" cellpadding="0">
          
          <!-- Top Header Brand Bar -->
          <tr>
            <td style="background: linear-gradient(135deg, #e50914 0%, #f84464 50%, #b91c1c 100%); padding: 24px 32px; text-align: center;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background: rgba(255,255,255,0.15); padding: 8px 18px; border-radius: 30px; backdrop-filter: blur(8px); margin-bottom: 8px;">
                      <span style="color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">
                        🎬 BOOK<span style="color: #fecdd3;">MY</span>SHOW
                      </span>
                    </div>
                    <h1 style="color: #ffffff; margin: 8px 0 0 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
                      Welcome Back to the Show! 🍿
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero Greeting -->
          <tr>
            <td style="padding: 32px 32px 20px 32px;">
              <h2 style="margin: 0 0 12px 0; color: #ffffff; font-size: 20px; font-weight: 600;">
                Hello <span style="color: #f43f5e;">${safeName}</span>,
              </h2>
              <p style="margin: 0 0 20px 0; color: #94a3b8; font-size: 15px; line-height: 1.6;">
                Great to see you again! You have successfully signed in to your <strong>BookMyShow</strong> account. The latest movies, concerts, comedy specials, and live sports are ready for you.
              </p>

              <!-- Sign-In Activity Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #1e293b; border-radius: 12px; border: 1px solid #334155; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #10b981; font-weight: 700; margin-bottom: 10px;">
                      ⚡ Sign-In Summary
                    </div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 4px 0; color: #94a3b8; font-size: 14px;"><strong>Account Name:</strong></td>
                        <td style="padding: 4px 0; color: #f8fafc; font-size: 14px; text-align: right;">${safeName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #94a3b8; font-size: 14px;"><strong>Email Address:</strong></td>
                        <td style="padding: 4px 0; color: #f8fafc; font-size: 14px; text-align: right;">${email}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #94a3b8; font-size: 14px;"><strong>Sign-In Time:</strong></td>
                        <td style="padding: 4px 0; color: #f8fafc; font-size: 14px; text-align: right;">${formattedTime}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #94a3b8; font-size: 14px;"><strong>Session Security:</strong></td>
                        <td style="padding: 4px 0; color: #10b981; font-size: 14px; text-align: right; font-weight: 600;">Authenticated & Active 🔒</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- What's Trending Section -->
              <h3 style="margin: 0 0 16px 0; color: #f8fafc; font-size: 16px; font-weight: 600;">
                Ready For Your Next Experience?
              </h3>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <!-- Item 1: Movies -->
                <tr>
                  <td style="padding: 8px 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(255,255,255,0.03); border-radius: 10px; border: 1px solid #1e293b;">
                      <tr>
                        <td width="48" style="padding: 12px; text-align: center; font-size: 24px;">🎥</td>
                        <td style="padding: 12px 12px 12px 0;">
                          <div style="color: #ffffff; font-size: 14px; font-weight: 600; margin-bottom: 2px;">Trending Blockbuster Movies</div>
                          <div style="color: #94a3b8; font-size: 13px;">Catch new releases in IMAX, 3D, and 4DX with prime seat selections.</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Item 2: Live Concerts & Stand-up -->
                <tr>
                  <td style="padding: 8px 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(255,255,255,0.03); border-radius: 10px; border: 1px solid #1e293b;">
                      <tr>
                        <td width="48" style="padding: 12px; text-align: center; font-size: 24px;">🎭</td>
                        <td style="padding: 12px 12px 12px 0;">
                          <div style="color: #ffffff; font-size: 14px; font-weight: 600; margin-bottom: 2px;">Live Events & Comedy Shows</div>
                          <div style="color: #94a3b8; font-size: 13px;">Explore musical concerts, laugh out loud at comedy nights, and cheer at sports.</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Item 3: Combos & Offers -->
                <tr>
                  <td style="padding: 8px 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(255,255,255,0.03); border-radius: 10px; border: 1px solid #1e293b;">
                      <tr>
                        <td width="48" style="padding: 12px; text-align: center; font-size: 24px;">🍿</td>
                        <td style="padding: 12px 12px 12px 0;">
                          <div style="color: #ffffff; font-size: 14px; font-weight: 600; margin-bottom: 2px;">Food Combos & Member Discounts</div>
                          <div style="color: #94a3b8; font-size: 13px;">Pre-book delicious snacks and unlock credit card discounts on checkout.</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Call to Action Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0 16px 0;">
                <tr>
                  <td align="center">
                    <a href="${frontendUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #e50914 0%, #f84464 100%); color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; padding: 14px 36px; border-radius: 30px; box-shadow: 0 8px 20px rgba(244,63,94,0.35); text-transform: uppercase; letter-spacing: 0.5px;">
                      Browse Movies & Shows 🚀
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Security Note & Help Desk -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #0f172a; border-radius: 10px; padding: 14px 18px; border-left: 4px solid #10b981;">
                <tr>
                  <td style="color: #94a3b8; font-size: 12px; line-height: 1.5;">
                    🔒 <strong>Security Notice:</strong> If you recently signed in, no further action is required. If you did not sign in or believe someone else has accessed your account, please <a href="${frontendUrl}/profile" style="color: #f43f5e; text-decoration: underline;">change your password immediately</a> or contact our support team at <a href="mailto:${supportEmail}" style="color: #f43f5e; text-decoration: underline;">${supportEmail}</a>.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0b0f19; padding: 24px 32px; text-align: center; border-top: 1px solid #1e293b;">
              <p style="margin: 0 0 8px 0; color: #64748b; font-size: 12px;">
                © ${new Date().getFullYear()} BookMyShow. All rights reserved.
              </p>
              <p style="margin: 0; color: #475569; font-size: 11px;">
                India's biggest entertainment ticketing platform.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  await sendEmail({
    to: email,
    subject: `🍿 Welcome Back to BookMyShow, ${safeName}! Ready for Your Next Show? 🎬`,
    html,
  });
}

export async function sendLoginAlertEmail({ name, email, loginTime, ipAddress } = {}) {
  return sendSignInWelcomeEmail({ name, email, loginTime, ipAddress });
}

export async function sendPasswordResetEmail({ name, email, resetUrl }) {
  if (!email) return;

  await sendEmail({
    to: email,
    subject: "🔑 Reset your BookMyShow password",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0f172a; max-width: 560px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #e11d48; margin-top: 0;">Password Reset Request</h2>
        <p>Hello <strong>${name || "there"}</strong>,</p>
        <p>We received a request to reset your password. Click the button below to choose a new password:</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: #e11d48; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Reset Password
          </a>
        </p>
        <p style="font-size: 13px; color: #64748b;">If the button does not work, copy and paste this link into your browser:</p>
        <p style="font-size: 12px; color: #3b82f6; word-break: break-all;">${resetUrl}</p>
        <p style="font-size: 12px; color: #94a3b8;">This link is valid for a limited time. If you didn't request a reset, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function sendOtpEmail({ name, email, otp }) {
  if (!email) return;

  await sendEmail({
    to: email,
    subject: `🔐 Your BookMyShow Verification Code: ${otp}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0f172a; max-width: 560px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #e11d48; margin-top: 0;">One-Time Verification Code</h2>
        <p>Hello <strong>${name || "there"}</strong>,</p>
        <p>Use the following 6-digit OTP code to complete your verification:</p>
        <div style="background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 10px; padding: 16px; text-align: center; margin: 20px 0;">
          <span style="letter-spacing: 8px; font-size: 32px; font-weight: 800; color: #0f172a;">${otp}</span>
        </div>
        <p style="font-size: 13px; color: #64748b;">This OTP code is valid for 10 minutes. Do not share this code with anyone.</p>
      </div>
    `,
  });
}
