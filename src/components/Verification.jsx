import { AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useContext } from "react";
import { AuthModalContext } from "../context/AuthModalContext";
import { toast } from "react-toastify";

export default function VerificationBanner({ handleVerification }) {
  const { userData } = useAuth();
  const { openSignUp } = useContext(AuthModalContext);

  // Don't show banner if userData is null or role is not available
  if (!userData || !userData.role) {
    return null;
  }

  const handleVerifyClick = async () => {
    try {
      // Call the verification handler
      await handleVerification();
      // Show toast that code is sent
      toast.info("Verification code sent to your email", {
        position: "top-center",
      });
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Failed to send verification code");
    }
  };

  return (
    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 className="font-semibold text-amber-900">Verify Your Account</h3>
          <p className="text-sm text-amber-700">
            Please verify your account to use our{" "}
            {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}{" "}
            Features
          </p>
        </div>
      </div>

      <button
        onClick={handleVerifyClick}
        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium text-sm transition"
      >
        Verify Account Now
      </button>
    </div>
  );
}
