import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  fetchSignInMethodsForEmail,
  signOut,
} from "firebase/auth";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db, googleAuthProvider } from "../../firebase/firebase";
import { setDoc, doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { serverTimestamp } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import LoadingSpinner from "../../loading/Loading";
import { sendSignupOtp } from "../../utils/sendSignupOtp";
export default function SignUpPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();
  const [isLoading, setisLoading] = useState(false);
  if (isLoading) return <LoadingSpinner />;

  const validatePassword = (pwd) => {
    if (pwd.length < 8) {
      return "Password must be at least 8 characters long.";
    }
    if (!/[0-9]/.test(pwd)) {
      return "Password must contain at least one number.";
    }
    if (!/[a-zA-Z]/.test(pwd)) {
      return "Password must contain at least one letter.";
    }
    return "";
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setisLoading(true);

      const passwordError = validatePassword(password);
      if (passwordError) {
        toast.error(passwordError, { position: "top-right" });
        return;
      }

      if (password !== confirmPassword) {
        toast.error("Password does not match.", { position: "top-right" });
        document.getElementById("confirmPassword").value = "";
        return;
      }

      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length > 0) {
        toast.warning(
          "This email is already registered, please Sign in.",
          { position: "top-right" }
        );
        return;
      }

      // Send OTP for email verification before creating account
      const otpData = await sendSignupOtp(email, fullName);

      if (!otpData) {
        toast.error("Failed to send verification code. Please try again.");
        return;
      }

      // Store signup data temporarily in sessionStorage
      sessionStorage.setItem(
        "signupData",
        JSON.stringify({
          signupMode: true,
          userData: {
            fullName,
            email,
            password,
            role: "guest",
          },
          otpData: {
            otp: otpData.otp,
            otpExpiry: otpData.otpExpiry,
            otpSentAt: otpData.otpSentAt,
          },
        })
      );

      // Navigate to OTP verification page
      navigate("/account-verification");
    } catch (error) {
      toast.error(error.message, { position: "top-right" });
    } finally {
      setisLoading(false);
    }
  };

  const doSignUpWithGoogle = async (e) => {
    e.preventDefault();

    try {
      setisLoading(true);
      const result = await signInWithPopup(auth, googleAuthProvider);
      const user = result.user;
      await signOut(auth);
      // 🔍 Check Firestore for existing user
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const existingData = userSnap.data();

        // 🚫 Prevent guest signup if email already used by host
        if (existingData.role === "host") {
          toast.error(
            "This email is already registered as a Host. Please sign in instead.",
            { position: "top-right" }
          );
          // Optional: Sign the user back out so it doesn’t stay in auth
          await auth.signOut();
          return;
        }

        // ✅ Otherwise, sign in existing guest
        toast.info(
          `This email is already registered. Please sign in instead.`,
          {
            position: "top-right",
          }
        );
        return;
      }

      // 🆕 Create Firestore document for new Google signup (guest only)
      await setDoc(userRef, {
        id: user.uid,
        email: user.email,
        fullName: user.displayName || "",
        photoURL: user.photoURL || "",
        role: "guest", // default
        isVerified: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success("You have registered successfully. Please Sign in.", {
        position: "top-right",
      });
      navigate("/guest");
    } catch (error) {
      toast.error(error.message, { position: "top-right" });
      console.error("Google Sign-up Error:", error);
    } finally {
      setisLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/loginImage.jpg')] bg-cover bg-center opacity-10" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <Link to="/">
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
        </Link>

        {/* Sign Up Card */}
        <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-slate-700">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Create your Guest account
            </h1>
            <p className="text-slate-400">Start managing your Bookings today</p>
          </div>

          {/* Google Sign Up */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={doSignUpWithGoogle}
              className="w-full bg-white hover:bg-slate-200 text-slate-900 font-semibold py-3 rounded-lg border border-slate-300 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Sign Up with Google"
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-slate-800 text-slate-400">
                Or sign up with email
              </span>
            </div>
          </div>

          {/* Sign Up Form */}
          <form className="space-y-5" onSubmit={handleFormSubmit}>
            <div className="relative">
              <input
                id="fullName"
                type="text"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="peer w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <label
                htmlFor="fullName"
                className="absolute left-4 top-3 text-slate-400 text-sm transition-all duration-200 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:bg-slate-800 peer-focus:px-1 peer-focus:text-indigo-400 peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:-translate-y-1/2 peer-not-placeholder-shown:bg-slate-800 peer-not-placeholder-shown:px-1"
              >
                Full name
              </label>
            </div>

            <div className="relative">
              <input
                id="email"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="peer w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <label
                htmlFor="email"
                className="absolute left-4 top-3 text-slate-400 text-sm transition-all duration-200 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:bg-slate-800 peer-focus:px-1 peer-focus:text-indigo-400 peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:-translate-y-1/2 peer-not-placeholder-shown:bg-slate-800 peer-not-placeholder-shown:px-1"
              >
                Email address
              </label>
            </div>

            <div className="relative">
              <input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="peer w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <label
                htmlFor="password"
                className="absolute left-4 top-3 text-slate-400 text-sm transition-all duration-200 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:bg-slate-800 peer-focus:px-1 peer-focus:text-indigo-400 peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:-translate-y-1/2 peer-not-placeholder-shown:bg-slate-800 peer-not-placeholder-shown:px-1"
              >
                Password (8+ chars, letters & numbers)
              </label>
            </div>

            <div className="relative">
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="peer w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <label
                htmlFor="confirmPassword"
                className="absolute left-4 top-3 text-slate-400 text-sm transition-all duration-200 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:bg-slate-800 peer-focus:px-1 peer-focus:text-indigo-400 peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:-translate-y-1/2 peer-not-placeholder-shown:bg-slate-800 peer-not-placeholder-shown:px-1"
              >
                Confirm password
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          {/* Footer Text */}
          <p className="text-center text-sm text-slate-400 mt-6">
            By continuing, you agree to BookingNest's{" "}
            <a
              href="#"
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              Privacy Policy
            </a>
          </p>
        </div>

        {/* Additional Link */}
        <p className="text-center text-slate-400 mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
