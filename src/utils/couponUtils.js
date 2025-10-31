import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";

/**
 * Fetch and validate a coupon for a specific host
 * @param {string} couponCode - The coupon code to validate
 * @param {string} hostId - The host ID to check if coupon belongs to
 * @returns {Promise<{valid: boolean, coupon: Object|null, message: string}>}
 */
export const validateCoupon = async (couponCode, hostId) => {
  if (!couponCode || !hostId) {
    return { valid: false, coupon: null, message: "Coupon code or host ID missing" };
  }

  try {
    const couponsRef = collection(db, "coupons");
    const q = query(
      couponsRef,
      where("code", "==", couponCode.toUpperCase()),
      where("hostId", "==", hostId),
      where("active", "==", true)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { valid: false, coupon: null, message: "Invalid coupon code" };
    }

    const coupon = querySnapshot.docs[0].data();
    const couponId = querySnapshot.docs[0].id;

    // Check if coupon has expired
    const expiryDate = new Date(coupon.expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (expiryDate < today) {
      return { valid: false, coupon: null, message: "Coupon has expired" };
    }

    return {
      valid: true,
      coupon: { id: couponId, ...coupon },
      message: "Coupon is valid",
    };
  } catch (error) {
    console.error("Error validating coupon:", error);
    return { valid: false, coupon: null, message: "Error validating coupon" };
  }
};

/**
 * Calculate discount amount based on coupon type and value
 * @param {number} basePrice - The base price before discount
 * @param {Object} coupon - The coupon object with type and value
 * @returns {number} The discount amount
 */
export const calculateDiscount = (basePrice, coupon) => {
  if (!coupon) return 0;

  if (coupon.type === "percentage") {
    return basePrice * (coupon.discount / 100);
  } else if (coupon.type === "fixed") {
    return coupon.discount;
  }

  return 0;
};
