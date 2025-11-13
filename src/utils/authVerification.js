import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth } from "../firebase/firebase";

/**
 * Verify admin password before sensitive operations
 * @param {string} password - The admin's password to verify
 * @returns {Promise<Object>} Result object with success status and message
 */
export async function verifyAdminPassword(password) {
  try {
    const user = auth.currentUser;

    if (!user) {
      return {
        success: false,
        message: "No user is currently logged in",
      };
    }

    if (!user.email) {
      return {
        success: false,
        message: "User email not found",
      };
    }

    // Create credential with email and password
    const credential = EmailAuthProvider.credential(user.email, password);

    // Reauthenticate user
    await reauthenticateWithCredential(user, credential);

    return {
      success: true,
      message: "Password verified successfully",
    };
  } catch (error) {
    console.error("Error verifying password:", error);

    // Handle specific error codes
    if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
      return {
        success: false,
        message: "Incorrect password. Please try again.",
      };
    } else if (error.code === "auth/too-many-requests") {
      return {
        success: false,
        message: "Too many failed attempts. Please try again later.",
      };
    }

    return {
      success: false,
      message: error.message || "Failed to verify password",
    };
  }
}
