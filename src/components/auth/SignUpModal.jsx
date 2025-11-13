import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  fetchSignInMethodsForEmail,
  signOut,
} from "firebase/auth";
import { setDoc, doc, serverTimestamp, addDoc, collection } from "firebase/firestore";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import { auth, db, googleAuthProvider } from "../../firebase/firebase";
import { AuthModalContext } from "../../context/AuthModalContext";
import RoleSelectionModal from "./RoleSelectionModal";
import ProgressBar from "./ProgressBar";
import PolicyAcceptanceModal from "./PolicyAcceptanceModal";
import { sendSignupOtp } from "../../utils/sendSignupOtp";
import { initializeUserRewards } from "../../utils/rewardsUtils";
import AddFundsPaypal from "../../paypal/AddFundsPaypal";

export default function SignUpModal() {
  const navigate = useNavigate();
  const {
    showSignUpModal,
    closeSignUp,
    signUpRole,
    signUpStep,
    selectSignUpRole,
    moveToSignUpStep,
  } = useContext(AuthModalContext);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [focusedFields, setFocusedFields] = useState({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!showSignUpModal) return null;

  // Different steps for guest vs host
  const guestSteps = [
    { number: 1, label: "Choose Role" },
    { number: 2, label: "Enter Details" },
    { number: 3, label: "Verify Email" },
    { number: 4, label: "Accept Policies" },
  ];

  const hostSteps = [
    { number: 1, label: "Choose Role" },
    { number: 2, label: "Enter Details" },
    { number: 3, label: "Verify Email" },
    { number: 4, label: "Accept Policies" },
    { number: 5, label: "Payment" },
  ];

  const steps = signUpRole === "host" ? hostSteps : guestSteps;

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

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFocus = (fieldName) => {
    setFocusedFields((prev) => ({ ...prev, [fieldName]: true }));
  };

  const handleBlur = (fieldName) => {
    setFocusedFields((prev) => ({ ...prev, [fieldName]: false }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      // Validate password
      const passwordError = validatePassword(formData.password);
      if (passwordError) {
        toast.error(passwordError, { position: "top-right" });
        return;
      }

      // Validate password match
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match.", { position: "top-right" });
        return;
      }

      // Check if email already exists
      const methods = await fetchSignInMethodsForEmail(auth, formData.email);
      if (methods.length > 0) {
        toast.warning(
          "This email is already registered. Please sign in instead.",
          { position: "top-right" }
        );
        return;
      }

      // Send OTP for email verification
      const otpData = await sendSignupOtp(formData.email, formData.fullName);

      if (!otpData) {
        toast.error("Failed to send verification code. Please try again.");
        return;
      }

      // Store signup data in sessionStorage
      sessionStorage.setItem(
        "signupData",
        JSON.stringify({
          signupMode: true,
          userData: {
            fullName: formData.fullName,
            email: formData.email,
            password: formData.password,
            role: signUpRole,
          },
          otpData: {
            otp: otpData.otp,
            otpExpiry: otpData.otpExpiry,
            otpSentAt: otpData.otpSentAt,
          },
        })
      );

      // Move to policy acceptance step
      moveToSignUpStep(3);
    } catch (error) {
      toast.error(error.message, { position: "top-right" });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePolicyAccept = async () => {
    try {
      setIsLoading(true);
      // For hosts, move to payment step (4). For guests, move to email verification (4)
      if (signUpRole === "host") {
        moveToSignUpStep(4); // Payment step for hosts
      } else {
        moveToSignUpStep(4); // Email verification for guests
      }
    } catch (error) {
      toast.error(error.message, { position: "top-right" });
    } finally {
      setIsLoading(false);
    }
  };

  const doSignUpWithGoogle = async (e) => {
    e.preventDefault();

    // Disable Google sign-up for hosts
    if (signUpRole === "host") {
      toast.warning(
        "Google sign-up is not available for Host accounts. Please use email registration and complete the ₱400 registration fee payment.",
        { position: "top-right", autoClose: 5000 }
      );
      return;
    }

    try {
      setIsLoading(true);
      const result = await signInWithPopup(auth, googleAuthProvider);
      const user = result.user;

      // Check if user already exists
      const userRef = doc(db, "users", user.uid);
      const userSnap = await userRef.getDoc ? await getDoc(userRef) : null;

      if (userSnap?.exists()) {
        const existingData = userSnap.data();

        // Prevent guest signup if email already used by host
        if (existingData.role === "host" && signUpRole === "guest") {
          toast.error(
            "This email is already registered as a Host. Please sign in instead.",
            { position: "top-right" }
          );
          await auth.signOut();
          return;
        }

        // Otherwise, sign in existing user
        toast.info(
          `This email is already registered. Please sign in instead.`,
          {
            position: "top-right",
          }
        );
        closeSignUp();
        return;
      }

      // Create Firestore document for new Google signup
      const { getDoc } = await import("firebase/firestore");
      const userDocSnap = await getDoc(userRef);

      if (!userDocSnap.exists()) {
        await setDoc(userRef, {
          id: user.uid,
          email: user.email,
          fullName: user.displayName || "",
          photoURL: user.photoURL || "",
          role: signUpRole,
          isVerified: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Create wallet for the user
        await setDoc(doc(db, "wallets", user.uid), {
          user_id: user.uid,
          balance: 0,
          createdAt: new Date(),
          currency: "PHP",
          total_cash_in: 0,
          total_spent: 0,
          updated_at: new Date(),
        });

        // Initialize rewards/points system for the user
        await initializeUserRewards(user.uid, signUpRole);
      }

      toast.success("You have registered successfully!", {
        position: "top-right",
      });

      closeSignUp();
      navigate(`/${signUpRole}`);
    } catch (error) {
      toast.error(error.message, { position: "top-right" });
      console.error("Google Sign-up Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Role Selection
  if (signUpStep === 1) {
    return (
      <RoleSelectionModal onSelectRole={selectSignUpRole} onCancel={closeSignUp} />
    );
  }

  // Step 2: Form Details
  if (signUpStep === 2) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col overflow-y-auto">
        <ProgressBar
          currentStep={2}
          totalSteps={signUpRole === "host" ? 5 : 4}
          steps={steps}
        />

        <div className="flex-1 flex items-center justify-center p-2 sm:p-3">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl w-full max-w-xs sm:max-w-sm border border-slate-700 shadow-2xl p-3 sm:p-5 my-auto">
            <h2 className="text-lg sm:text-2xl font-bold text-white mb-1">
              Create your {signUpRole === "host" ? "Host" : "Guest"} Account
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mb-4">
              {signUpRole === "host"
                ? "Start listing your properties and earn money"
                : "Start booking amazing stays and experiences"}
            </p>

            {/* Google Sign Up - Only for Guests */}
            {signUpRole === "guest" && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={doSignUpWithGoogle}
                  className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold py-1.5 rounded-lg border border-slate-300 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm"
                >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 24 24">
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
                {isLoading ? "Signing up..." : "Continue with Google"}
              </button>
              </div>
            )}

            {/* Notice for Hosts */}
            {signUpRole === "host" && (
              <div className="mb-4 bg-amber-600/10 border border-amber-600/30 rounded-lg p-3">
                <p className="text-xs sm:text-sm text-amber-300">
                  ℹ️ Host accounts require email registration and a ₱400 registration fee. Google sign-up is not available for hosts.
                </p>
              </div>
            )}

            {/* Divider */}
            {signUpRole === "guest" && (
              <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-600" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-slate-900 text-slate-400 text-xs">
                  Or sign up with email
                </span>
              </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="space-y-3">
              {/* Full Name */}
              <div className="relative">
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={handleFormChange}
                  onFocus={() => handleFocus("fullName")}
                  onBlur={() => handleBlur("fullName")}
                  required
                  className="peer w-full px-3 py-2.5 sm:py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-transparent focus:border-indigo-500 focus:outline-none transition-all text-xs sm:text-sm"
                />
                <label
                  className={`absolute left-3 text-slate-400 text-xs sm:text-sm transition-all ${
                    focusedFields.fullName || formData.fullName
                      ? "top-0 -translate-y-1/2 bg-slate-800 px-1 text-indigo-400"
                      : "top-2.5 sm:top-3"
                  }`}
                >
                  Full Name
                </label>
              </div>

              {/* Email */}
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleFormChange}
                  onFocus={() => handleFocus("email")}
                  onBlur={() => handleBlur("email")}
                  required
                  className="peer w-full px-3 py-2.5 sm:py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-transparent focus:border-indigo-500 focus:outline-none transition-all text-xs sm:text-sm"
                />
                <label
                  className={`absolute left-3 text-slate-400 text-xs sm:text-sm transition-all ${
                    focusedFields.email || formData.email
                      ? "top-0 -translate-y-1/2 bg-slate-800 px-1 text-indigo-400"
                      : "top-2.5 sm:top-3"
                  }`}
                >
                  Email
                </label>
              </div>

              {/* Password */}
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleFormChange}
                  onFocus={() => handleFocus("password")}
                  onBlur={() => handleBlur("password")}
                  required
                  className="peer w-full px-3 py-2.5 sm:py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-transparent focus:border-indigo-500 focus:outline-none transition-all text-xs sm:text-sm"
                />
                <label
                  className={`absolute left-3 text-slate-400 text-xs sm:text-sm transition-all ${
                    focusedFields.password || formData.password
                      ? "top-0 -translate-y-1/2 bg-slate-800 px-1 text-indigo-400"
                      : "top-2.5 sm:top-3"
                  }`}
                >
                  Password (8+ chars, letters & numbers)
                </label>
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleFormChange}
                  onFocus={() => handleFocus("confirmPassword")}
                  onBlur={() => handleBlur("confirmPassword")}
                  required
                  className="peer w-full px-3 py-2.5 sm:py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-transparent focus:border-indigo-500 focus:outline-none transition-all text-xs sm:text-sm"
                />
                <label
                  className={`absolute left-3 text-slate-400 text-xs sm:text-sm transition-all ${
                    focusedFields.confirmPassword || formData.confirmPassword
                      ? "top-0 -translate-y-1/2 bg-slate-800 px-1 text-indigo-400"
                      : "top-2.5 sm:top-3"
                  }`}
                >
                  Confirm Password
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeSignUp}
                  className="flex-1 px-3 py-1.5 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700/50 transition font-medium text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs sm:text-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Next
                    </>
                  ) : (
                    "Next"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Policy Acceptance
  if (signUpStep === 3) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col">
        <ProgressBar
          currentStep={3}
          totalSteps={signUpRole === "host" ? 5 : 4}
          steps={steps}
        />

        <div className="flex-1">
          <PolicyAcceptanceModal
            onAccept={handlePolicyAccept}
            onCancel={() => moveToSignUpStep(2)}
            userRole={signUpRole}
            isLoading={isLoading}
          />
        </div>
      </div>
    );
  }

  // Step 4: For hosts = Payment, For guests = Email Verification
  if (signUpStep === 4) {
    // If host, show payment step
    if (signUpRole === "host") {
      return <HostPaymentStep />;
    }

    // If guest, show email verification
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col overflow-y-auto">
        <ProgressBar currentStep={4} totalSteps={4} steps={steps} />

        <div className="flex-1 flex items-center justify-center p-2 sm:p-3">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl w-full max-w-xs sm:max-w-sm border border-slate-700 shadow-2xl p-3 sm:p-5 text-center my-auto">
            <h2 className="text-lg sm:text-2xl font-bold text-white mb-1">
              Verify Your Email
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mb-4">
              We've sent a verification code to {formData.email}. Check your email
              and enter the code below.
            </p>

            <div className="bg-indigo-600/10 border border-indigo-600/20 rounded-lg p-3 mb-4">
              <p className="text-xs sm:text-sm text-slate-300">
                This will redirect to the email verification page. The OTP data has
                been stored in your session.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => moveToSignUpStep(3)}
                className="flex-1 px-3 py-1.5 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700/50 transition font-medium text-xs sm:text-sm"
              >
                Back
              </button>
              <button
                onClick={() => {
                  closeSignUp();
                  navigate("/account-verification");
                }}
                className="flex-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-xs sm:text-sm"
              >
                Verify Email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 5: Email Verification for Hosts (after payment)
  if (signUpStep === 5 && signUpRole === "host") {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col overflow-y-auto">
        <ProgressBar currentStep={5} totalSteps={5} steps={steps} />

        <div className="flex-1 flex items-center justify-center p-2 sm:p-3">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl w-full max-w-xs sm:max-w-sm border border-slate-700 shadow-2xl p-3 sm:p-5 text-center my-auto">
            <h2 className="text-lg sm:text-2xl font-bold text-white mb-1">
              Verify Your Email
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mb-4">
              We've sent a verification code to {formData.email}. Check your email
              and enter the code below.
            </p>

            <div className="bg-indigo-600/10 border border-indigo-600/20 rounded-lg p-3 mb-4">
              <p className="text-xs sm:text-sm text-slate-300">
                This will redirect to the email verification page. The OTP data has
                been stored in your session.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => moveToSignUpStep(4)}
                className="flex-1 px-3 py-1.5 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700/50 transition font-medium text-xs sm:text-sm"
              >
                Back
              </button>
              <button
                onClick={() => {
                  closeSignUp();
                  navigate("/account-verification");
                }}
                className="flex-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-xs sm:text-sm"
              >
                Verify Email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Host Payment Step Component (Step 4 for hosts)
  function HostPaymentStep() {
    const [showPaypal, setShowPaypal] = useState(false);
    const [paymentCompleted, setPaymentCompleted] = useState(false);
    const registrationFee = 400; // ₱400 registration fee

    const handlePaymentSuccess = async () => {
      try {
        setIsLoading(true);

        // Save transaction to Firestore
        const signupData = JSON.parse(sessionStorage.getItem("signupData"));

        // Create transaction record for new host fee
        await addDoc(collection(db, "transactions"), {
          amount: -registrationFee, // Negative because it's a payment
          created_at: new Date(),
          type: "new_host_fees",
          status: "completed",
          description: "Host Registration Fee",
          email: signupData?.userData?.email || formData.email,
        });

        setPaymentCompleted(true);
        toast.success("Payment successful! Proceeding to email verification.", {
          position: "top-right",
        });

        // Move to email verification step (step 5 for hosts)
        setTimeout(() => {
          moveToSignUpStep(5);
        }, 1500);
      } catch (error) {
        console.error("Error saving transaction:", error);
        toast.error("Payment recorded but there was an error. Please contact support.");
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col overflow-y-auto">
        <ProgressBar currentStep={4} totalSteps={5} steps={steps} />

        <div className="flex-1 flex items-center justify-center p-2 sm:p-3">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl p-4 sm:p-6 my-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Host Registration Fee
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Complete your host registration by paying the one-time registration
              fee of ₱400.00
            </p>

            {/* Fee Breakdown */}
            <div className="bg-slate-900/50 rounded-lg p-4 mb-6 border border-slate-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-300 text-sm">Registration Fee</span>
                <span className="text-white font-semibold">₱400.00</span>
              </div>
              <div className="border-t border-slate-700 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-white font-bold">Total Amount</span>
                  <span className="text-indigo-400 font-bold text-lg">
                    ₱400.00
                  </span>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-indigo-600/10 border border-indigo-600/30 rounded-lg p-3 mb-6">
              <p className="text-xs sm:text-sm text-slate-300">
                ℹ️ This is a one-time fee to activate your host account. You'll be
                able to list unlimited properties after registration.
              </p>
            </div>

            {/* PayPal Button */}
            {!showPaypal && !paymentCompleted && (
              <button
                onClick={() => setShowPaypal(true)}
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg mb-4 transition-colors disabled:opacity-50"
              >
                Proceed to PayPal Payment
              </button>
            )}

            {showPaypal && !paymentCompleted && (
              <div className="mb-4">
                <AddFundsPaypal
                  amount={registrationFee}
                  onSuccess={handlePaymentSuccess}
                  isLoading={isLoading}
                />
              </div>
            )}

            {paymentCompleted && (
              <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-4 mb-4">
                <p className="text-green-400 font-semibold text-center">
                  ✓ Payment Successful
                </p>
              </div>
            )}

            {/* Back Button */}
            <button
              onClick={() => moveToSignUpStep(3)}
              disabled={isLoading || paymentCompleted}
              className="w-full border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700/50 transition font-medium py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }
}
