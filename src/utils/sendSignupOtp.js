import emailjs from "@emailjs/browser";
import { toast } from "react-toastify";
import { generateOtp, otpExpiryTimestamp } from "./generateOtp";

const serviceId = import.meta.env.VITE_EMAIL_JS_SERVICE_ID;
const templateId = import.meta.env.VITE_EMAIL_JS_TEMPLATE_ID;
const publicKey = import.meta.env.VITE_EMAIL_JS_PUBLIC_KEY;

export async function sendSignupOtp(email, fullName) {
  if (!email) {
    toast.error("Email is required");
    return null;
  }

  const otp = generateOtp();
  const expiry = otpExpiryTimestamp(15); // 15 minutes

  try {
    const expiryTime = new Date(expiry).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Extract first name from full name
    const firstName = fullName?.split(" ")[0] || "User";

    const templateParams = {
      email: email,
      passcode: otp,
      time: expiryTime,
      to_name: fullName || "User",
      username: firstName,
    };

    await emailjs.send(serviceId, templateId, templateParams, publicKey);

    toast.success("Verification code sent to your email.", {
      position: "top-center",
    });

    // Return OTP data to be stored temporarily
    return {
      otp,
      otpExpiry: expiry,
      otpSentAt: Date.now(),
    };
  } catch (error) {
    console.error("Send OTP error:", error);
    toast.error("Failed to send verification code. Try again.");
    return null;
  }
}
