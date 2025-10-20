import { getDoc, updateDoc, doc } from "firebase/firestore";
import { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { sendOtpToUser } from "../../utils/sendOtpToUser";
import { db } from "../../firebase/firebase";
import { useNavigate } from "react-router-dom";

export default function OTPVerificationPage({ user, userData }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (index, value) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }

    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pasted)) return;
    const newOtp = pasted.split("");
    setOtp(newOtp);
  };

  const handleVerify = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      return toast.error("Please enter all 6 digits", {
        position: "top-right",
      });
    }

    setIsVerifying(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists())
        return toast.error("User not found", { position: "top-right" });
      const data = userSnap.data();

      if (!data.otp || Date.now() > data.otpExpiry)
        return toast.error("OTP expired or not sent", {
          position: "top-right",
        });
      if (data.otp !== otpCode)
        return toast.error("Incorrect code. Try again.", {
          position: "top-right",
        });

      await updateDoc(userRef, {
        isVerified: true,
        otp: "",
        otpExpiry: 0,
        otpSentAt: 0,
      });
      toast.success("Account Verified Successfully!");
    } catch (error) {
      toast.error("Verification failed");
      console.error(error);
    } finally {
      setIsVerifying(false);
      navigate("/");
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      await sendOtpToUser(user);
      toast.success("New OTP sent to your email!", { position: "top-right" });
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      setResendTimer(60);
    } catch (err) {
      toast.error("Failed to resend code");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/loginImage.jpg')] bg-cover bg-center opacity-10" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8 cursor-pointer">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="oklch(0.511 0.262 276.966)"
          >
            <path d="M7 2v2H5a2 2 0 0 0-2 2v2h18V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm13 8H4v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10zm-4 4h-4v4h4v-4z" />
          </svg>
          <span className="text-2xl font-bold text-white">BookingNest</span>
        </div>

        {/* OTP Verification Card */}
        <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-slate-700">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-indigo-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Verify your account
            </h1>
            <p className="text-slate-400">
              We've sent a 6-digit code to your email
            </p>
            <p className="text-indigo-400 font-medium mt-1">user@example.com</p>
          </div>

          {/* OTP Input */}
          <div className="mb-8">
            <div className="flex gap-3 justify-center mb-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold bg-slate-900/50 border-2 border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              ))}
            </div>
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={isVerifying || otp.join("").length !== 6}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors mb-6"
          >
            {isVerifying ? "Verifying..." : "Verify Account"}
          </button>

          {/* Resend Code */}
          <div className="text-center">
            <p className="text-slate-400 text-sm mb-2">
              Didn't receive the code?
            </p>
            {resendTimer > 0 ? (
              <p className="text-slate-500 text-sm">
                Resend code in{" "}
                <span className="font-semibold text-slate-400">
                  {resendTimer}s
                </span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                className="text-indigo-400 hover:text-indigo-300 font-semibold text-sm"
              >
                Resend Code
              </button>
            )}
          </div>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => window.history.back()}
              className="text-sm text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back
            </button>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-slate-400 mt-6 text-sm">
          Having trouble?{" "}
          <a
            href="#"
            className="text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
