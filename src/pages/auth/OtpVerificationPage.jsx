import { getDoc, updateDoc, doc, setDoc } from "firebase/firestore";
import { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { sendOtpToUser } from "../../utils/sendOtpToUser";
import { sendSignupOtp } from "../../utils/sendSignupOtp";
import { db, auth } from "../../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { serverTimestamp } from "firebase/firestore";

export default function OTPVerificationPage({ user, userData }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [expiryTimer, setExpiryTimer] = useState(900); // 15 minutes in seconds
  const [isExpired, setIsExpired] = useState(false);
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  // Check if coming from signup flow
  const [signupData, setSignupData] = useState(null);
  const [isSignupMode, setIsSignupMode] = useState(false);

  useEffect(() => {
    // Check sessionStorage for signup data
    const storedData = sessionStorage.getItem("signupData");
    if (storedData) {
      const parsed = JSON.parse(storedData);
      setSignupData(parsed);
      setIsSignupMode(parsed.signupMode || false);
    }
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Expiry timer effect
  useEffect(() => {
    if (expiryTimer > 0 && !isExpired) {
      const timer = setTimeout(() => setExpiryTimer(expiryTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (expiryTimer === 0 && !isExpired) {
      setIsExpired(true);
    }
  }, [expiryTimer, isExpired]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

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
      // SIGNUP MODE: Verify OTP then create Firebase account
      if (isSignupMode && signupData) {
        // Check OTP against sessionStorage data
        if (!signupData.otpData || Date.now() > signupData.otpData.otpExpiry) {
          toast.error("OTP expired. Please sign up again.", {
            position: "top-right",
          });
          sessionStorage.removeItem("signupData");
          navigate("/signup");
          return;
        }

        if (signupData.otpData.otp !== otpCode) {
          toast.error("Incorrect code. Try again.", {
            position: "top-right",
          });
          setIsVerifying(false);
          return;
        }

        // OTP is correct - create Firebase account
        const { email, password, fullName, role } = signupData.userData;

        const result = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const newUser = result.user;

        // Immediately sign out to prevent login session
        await signOut(auth);

        // Save user record in Firestore
        await setDoc(doc(db, "users", newUser.uid), {
          id: newUser.uid,
          email,
          fullName: fullName || "",
          photoURL: newUser.photoURL || "",
          role: role,
          isVerified: true, // Already verified via OTP
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Create wallet for host accounts
        if (role === "host") {
          await setDoc(doc(db, "wallets", newUser.uid), {
            user_id: newUser.uid,
            balance: 0,
            createdAt: new Date(),
            currency: "PHP",
            total_cash_in: 0,
            total_spent: 0,
            updated_at: new Date(),
          });
        }

        // Clear sessionStorage
        sessionStorage.removeItem("signupData");

        toast.success("Account created successfully! Please sign in.", {
          position: "top-right",
        });
        navigate("/login");
        return;
      }

      // ACCOUNT VERIFICATION MODE: Verify existing user's email
      if (!user || !user.uid) {
        toast.error("User not found. Please sign in.", {
          position: "top-right",
        });
        navigate("/login");
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        toast.error("User not found", { position: "top-right" });
        return;
      }

      const data = userSnap.data();

      if (!data.otp || Date.now() > data.otpExpiry) {
        toast.error("OTP expired or not sent", {
          position: "top-right",
        });
        return;
      }

      if (data.otp !== otpCode) {
        toast.error("Incorrect code. Try again.", {
          position: "top-right",
        });
        return;
      }

      await updateDoc(userRef, {
        isVerified: true,
        otp: "",
        otpExpiry: 0,
        otpSentAt: 0,
      });

      toast.success("Account Verified Successfully!");
      navigate("/");
    } catch (error) {
      toast.error("Verification failed");
      console.error(error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      // SIGNUP MODE: Resend signup OTP
      if (isSignupMode && signupData) {
        const { email, fullName } = signupData.userData;
        const newOtpData = await sendSignupOtp(email, fullName);

        if (newOtpData) {
          // Update sessionStorage with new OTP data
          const updatedSignupData = {
            ...signupData,
            otpData: {
              otp: newOtpData.otp,
              otpExpiry: newOtpData.otpExpiry,
              otpSentAt: newOtpData.otpSentAt,
            },
          };
          sessionStorage.setItem("signupData", JSON.stringify(updatedSignupData));
          setSignupData(updatedSignupData);

          toast.success("New OTP sent to your email!", { position: "top-right" });
          setOtp(["", "", "", "", "", ""]);
          inputRefs.current[0]?.focus();
          setResendTimer(60);
          setExpiryTimer(900); // Reset 15 minutes timer
          setIsExpired(false);
        }
      } else {
        // ACCOUNT VERIFICATION MODE: Resend OTP to existing user
        await sendOtpToUser(user);
        toast.success("New OTP sent to your email!", { position: "top-right" });
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        setResendTimer(60);
        setExpiryTimer(900); // Reset 15 minutes timer
        setIsExpired(false);
      }
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
              {isSignupMode ? "Verify your email" : "Verify your account"}
            </h1>
            <p className="text-slate-400">
              We've sent a 6-digit code to your email
            </p>
            <p className="text-indigo-400 font-medium mt-1">
              {isSignupMode && signupData
                ? signupData.userData.email
                : user?.email || "user@example.com"}
            </p>
          </div>

          {/* OTP Input */}
          <div className="mb-8">
            <div className="flex gap-3 justify-center mb-4">
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
                  disabled={isExpired}
                  className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold bg-slate-900/50 border-2 border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              ))}
            </div>

            {/* Expiry Timer */}
            <div className={`text-center mb-4 p-3 rounded-lg ${
              expiryTimer > 300
                ? "bg-blue-900/20 border border-blue-600/30"
                : expiryTimer > 60
                ? "bg-yellow-900/20 border border-yellow-600/30"
                : "bg-red-900/20 border border-red-600/30"
            }`}>
              {!isExpired ? (
                <p className={`text-sm font-semibold ${
                  expiryTimer > 300
                    ? "text-blue-300"
                    : expiryTimer > 60
                    ? "text-yellow-300"
                    : "text-red-300"
                }`}>
                  Your code expires in <span className="font-bold">{formatTime(expiryTimer)}</span>
                </p>
              ) : (
                <p className="text-sm font-semibold text-red-300">
                  Your code has expired. Please request a new one.
                </p>
              )}
            </div>
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={isVerifying || otp.join("").length !== 6 || isExpired}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors mb-6"
          >
            {isExpired ? "Code Expired" : isVerifying ? "Verifying..." : "Verify Account"}
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
