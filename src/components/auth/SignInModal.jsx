import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import { auth, db, googleAuthProvider } from "../../firebase/firebase";
import { AuthModalContext } from "../../context/AuthModalContext";

export default function SignInModal() {
  const navigate = useNavigate();
  const { showSignInModal, closeSignIn } = useContext(AuthModalContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!showSignInModal) return null;

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter both email and password.", {
        position: "top-right",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Sign in with email and password
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      // Fetch user data from Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        toast.error("User data not found. Please contact support.", {
          position: "top-right",
        });
        await auth.signOut();
        return;
      }

      const userData = userSnap.data();

      // Check if user account is deactivated
      if (userData.status === "deactivated") {
        toast.error("Your account has been deactivated. Please contact support for assistance.", {
          position: "top-right",
        });
        await auth.signOut();
        return;
      }

      // Show success toast and close modal immediately
      toast.success("Successfully signed in!", { position: "top-right" });
      closeSignIn();

      // Navigate to appropriate dashboard
      setTimeout(() => {
        navigate(`/${userData.role || "guest"}`);
      }, 100);
    } catch (error) {
      console.error("Sign in error:", error);

      // Handle specific Firebase auth errors
      let errorMessage = "Failed to sign in. Please try again.";

      if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address format.";
      } else if (error.code === "auth/user-disabled") {
        errorMessage = "This account has been disabled.";
      } else if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email. Please sign up first.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password. Please try again.";
      } else if (error.code === "auth/invalid-credential") {
        errorMessage = "Invalid email or password. Please check your credentials.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later.";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your connection.";
      }

      toast.error(errorMessage, { position: "top-right" });
    } finally {
      setIsLoading(false);
    }
  };

  const doSignInWithGoogle = async () => {
    try {
      setIsLoading(true);

      const result = await signInWithPopup(auth, googleAuthProvider);
      const user = result.user;

      // Fetch user data
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        toast.error(
          "Email doesn't exist. Please sign up first with this email.",
          {
            position: "top-right",
          }
        );
        await auth.signOut();
        return;
      }

      const userData = userSnap.data();

      // Check if user account is deactivated
      if (userData.status === "deactivated") {
        toast.error("Your account has been deactivated. Please contact support for assistance.", {
          position: "top-right",
        });
        await auth.signOut();
        return;
      }

      // Show success toast and close modal immediately
      toast.success("Successfully signed in!", { position: "top-right" });
      closeSignIn();

      // Navigate to appropriate dashboard
      setTimeout(() => {
        navigate(`/${userData.role || "guest"}`);
      }, 100);
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast.error("Google authentication failed. Please try again.", {
        position: "top-right",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Sign In Form
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-slate-400 text-sm mb-6">
            Sign in to continue to BookingNest
          </p>

          {/* Google Sign In */}
          <div className="mb-6">
            <button
              type="button"
              onClick={doSignInWithGoogle}
              disabled={isLoading}
              className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold py-2 rounded-lg border border-slate-300 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              {isLoading ? "Signing in..." : "Continue with Google"}
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-slate-900 text-slate-400">
                Or sign in with email
              </span>
            </div>
          </div>

          {/* Sign In Form */}
          <form className="space-y-4" onSubmit={handleFormSubmit}>
            {/* Email */}
            <div className="relative">
              <input
                id="signin-email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                required
                className="peer w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-transparent focus:border-indigo-500 focus:outline-none transition-all"
              />
              <label
                htmlFor="signin-email"
                className={`absolute left-4 text-slate-400 text-sm transition-all ${
                  emailFocused || email
                    ? "top-0 -translate-y-1/2 bg-slate-800 px-1 text-indigo-400"
                    : "top-2"
                }`}
              >
                Email
              </label>
            </div>

            {/* Password */}
            <div className="relative">
              <input
                id="signin-password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                required
                className="peer w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-transparent focus:border-indigo-500 focus:outline-none transition-all"
              />
              <label
                htmlFor="signin-password"
                className={`absolute left-4 text-slate-400 text-sm transition-all ${
                  passwordFocused || password
                    ? "top-0 -translate-y-1/2 bg-slate-800 px-1 text-indigo-400"
                    : "top-2"
                }`}
              >
                Password
              </label>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  closeSignIn();
                  navigate("/forgot-password");
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition"
              >
                Forgot password?
              </button>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={closeSignIn}
                className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700/50 transition font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Next"
                )}
              </button>
            </div>
          </form>

          {/* Sign Up Link */}
          <p className="text-center text-slate-400 text-sm mt-6">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => {
                closeSignIn();
                setTimeout(() => {
                  const openSignUpEvent = new CustomEvent("openSignUp");
                  window.dispatchEvent(openSignUpEvent);
                }, 100);
              }}
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    );
}