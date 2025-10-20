// useVerification.js

import emailjs from "@emailjs/browser";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase"; // your firebase export
import { generateOtp, otpExpiryTimestamp } from "./generateOtp";
import { toast } from "react-toastify"; // optional
const serviceId = import.meta.env.VITE_EMAIL_JS_SERVICE_ID;
const templateId = import.meta.env.VITE_EMAIL_JS_TEMPLATE_ID;
const publicKey = import.meta.env.VITE_EMAIL_JS_PUBLIC_KEY;
export async function sendOtpToUser(user) {
  if (!user?.uid) {
    toast.error("User not signed in");
    return;
  }
  const otp = generateOtp();
  const expiry = otpExpiryTimestamp(15); // 5 minutes
  try {
    const expiryTime = new Date(expiry).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      otp,
      otpExpiry: expiry,
      otpSentAt: Date.now(),
    });

    const templateParams = {
      email: user.email,
      passcode: otp,
      time: expiryTime,
    };
    await emailjs.send(serviceId, templateId, templateParams, publicKey);
    toast.success("Verification code sent to your email.", {
      position: "top-center",
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    toast.error("Failed to send verification code. Try again.");
  }

  return otp;
}
