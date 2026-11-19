/**
 * SMS Gateway Service for Sending Real Mobile OTPs in India & Globally
 * Supports:
 * 1. Twilio Verify Service (Global & India Real Telecom SMS)
 * 2. Fast2SMS (India Transactional SMS)
 * 3. 2Factor.in (Indian DLT SMS)
 */

export async function sendMobileOtpSms({ mobile, otp }) {
  const cleanMobile = String(mobile || "").replace(/\D/g, "");
  if (!cleanMobile || cleanMobile.length !== 10) {
    throw new Error("Invalid 10-digit mobile number.");
  }

  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioVerifySid = process.env.TWILIO_VERIFY_SERVICE_SID;
  const fast2SmsKey = process.env.FAST2SMS_API_KEY;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
  let providerError = "";

  const smsContent = `BookMyShow\n\nYour OTP for login is ${otp}.\n\nThis OTP is valid for 10 minutes. Do not share it with anyone.\n\n- Team BookMyShow`;

  // 1. TWILIO VERIFY SERVICE (Primary OTP provider)
  if (twilioSid && twilioAuth && twilioVerifySid) {
    try {
      const authHeader = "Basic " + Buffer.from(`${twilioSid.trim()}:${twilioAuth.trim()}`).toString("base64");
      const body = new URLSearchParams({
        To: `+91${cleanMobile}`,
        Channel: "sms",
      });

      const response = await fetch(
        `https://verify.twilio.com/v2/Services/${twilioVerifySid.trim()}/Verifications`,
        {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body.toString(),
        }
      );

      const data = await response.json();
      if (response.ok && (data.status === "pending" || data.sid)) {
        console.log(`✅ [Twilio Verify SUCCESS] Real SMS OTP dispatched to +91${cleanMobile}!`);
        return { success: true, provider: "TwilioVerify", sid: data.sid };
      }

      providerError = data.message || "Twilio Verify rejected the OTP request.";
      console.warn("⚠️ [Twilio Verify Warning]:", data.message || data);
    } catch (err) {
      console.error("❌ [Twilio Verify Error]:", err.message);
    }
  }

  // 2. FAST2SMS (India's instant transactional SMS Gateway for custom text)
  if (fast2SmsKey) {
    try {
      let response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: fast2SmsKey.trim(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "q",
          message: smsContent,
          language: "english",
          flash: 0,
          numbers: cleanMobile,
        }),
      });

      let data = await response.json();

      if (data.status_code === 996 || data.status_code === 997 || !data.return) {
        const quickUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(
          fast2SmsKey.trim()
        )}&route=q&message=${encodeURIComponent(
          smsContent
        )}&language=english&flash=0&numbers=${cleanMobile}`;

        response = await fetch(quickUrl, { method: "GET" });
        data = await response.json();
      }

      if (data.return || data.status_code === 200 || (Array.isArray(data.message) && data.message[0]?.toLowerCase().includes("success"))) {
        console.log(`✅ [Fast2SMS SUCCESS] Real SMS delivered to +91${cleanMobile}:\n${smsContent}`);
        return { success: true, provider: "Fast2SMS", messageId: data.request_id || "sent" };
      } else {
        providerError = providerError || data.message || "Fast2SMS rejected the OTP request.";
        console.warn(`⚠️ [Fast2SMS API Response Notice]:`, data.message || data);
      }
    } catch (err) {
      console.error("❌ [Fast2SMS Network Error]:", err.message);
    }
  }

  // 3. TWILIO Standard SMS (Custom formatted body)
  if (twilioSid && twilioAuth && twilioPhone) {
    try {
      const authHeader = "Basic " + Buffer.from(`${twilioSid}:${twilioAuth}`).toString("base64");
      const body = new URLSearchParams({
        To: `+91${cleanMobile}`,
        From: twilioPhone,
        Body: smsContent,
      });

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body.toString(),
        }
      );

      const data = await response.json();
      if (data.sid) {
        console.log(`✅ [Twilio] Real SMS sent to +91${cleanMobile}:\n${smsContent}`);
        return { success: true, provider: "Twilio", sid: data.sid };
      }
      providerError = providerError || data.message || "Twilio SMS rejected the OTP request.";
    } catch (err) {
      console.error("❌ [Twilio Delivery Error]:", err.message);
    }
  }

  throw new Error(providerError || "No SMS provider delivered the OTP. Check FAST2SMS or Twilio credentials.");
}

/**
 * Check verification code with Twilio Verify
 */
export async function verifyTwilioCode({ mobile, code }) {
  const cleanMobile = String(mobile || "").replace(/\D/g, "");
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioVerifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (twilioSid && twilioAuth && twilioVerifySid) {
    try {
      const authHeader = "Basic " + Buffer.from(`${twilioSid.trim()}:${twilioAuth.trim()}`).toString("base64");
      const body = new URLSearchParams({
        To: `+91${cleanMobile}`,
        Code: String(code).trim(),
      });

      const response = await fetch(
        `https://verify.twilio.com/v2/Services/${twilioVerifySid.trim()}/VerificationCheck`,
        {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body.toString(),
        }
      );

      const data = await response.json();
      if (data.status === "approved" || data.valid === true) {
        return { valid: true, provider: "TwilioVerify" };
      }
      return { valid: false, message: data.message || "Invalid or expired OTP code." };
    } catch (err) {
      console.error("Twilio VerificationCheck error:", err.message);
    }
  }

  return { valid: false, useFallback: true };
}
import process from "node:process";
import { Buffer } from "node:buffer";

