// utils/otp.js
export function generateOtp() {
  // ensure 6 digits with leading zeros allowed
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
}

export function otpExpiryTimestamp(minutes = 15) {
  return Date.now() + minutes * 60 * 1000; // ms
}
