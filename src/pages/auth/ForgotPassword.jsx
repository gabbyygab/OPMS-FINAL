import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      toast.success("Password reset email sent! Check your inbox.", {
        position: "top-right",
      });
      setIsSubmitted(true);
    } catch (error) {
      toast.error(error.message, { position: "top-right" });
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

        {/* Forgot Password Card */}
        <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-slate-700">
          {!isSubmitted ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                  Forgot password?
                </h1>
                <p className="text-slate-400">
                  No worries, we'll send you reset instructions
                </p>
              </div>

              {/* Email Form */}
              <form className="space-y-6" onSubmit={handleFormSubmit}>
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-200"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Reset password
                </button>
              </form>

              {/* Back to Sign In Link */}
              <div className="text-center mt-6">
                <Link
                  to="/login"
                  className="text-slate-400 hover:text-slate-300 text-sm inline-flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m12 19-7-7 7-7" />
                    <path d="M19 12H5" />
                  </svg>
                  Back to sign in
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6Z" />
                    <path d="m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Check your email
                </h1>
                <p className="text-slate-400">
                  We've sent password reset instructions to{" "}
                  <span className="text-white font-medium">{email}</span>
                </p>
              </div>

              <div className="space-y-4">
                <Link
                  to="/guest/signin"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors block text-center"
                >
                  Back to sign in
                </Link>

                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="w-full text-slate-400 hover:text-slate-300 text-sm"
                >
                  Didn't receive the email? Click to resend
                </button>
              </div>
            </>
          )}
        </div>

        {/* Additional Link */}
        {!isSubmitted && (
          <p className="text-center text-slate-400 mt-6">
            New to BookingNest?{" "}
            <Link
              to="/guest/signup"
              className="text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Create an account
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
