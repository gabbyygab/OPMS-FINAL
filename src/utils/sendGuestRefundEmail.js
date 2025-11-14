import emailjs from "@emailjs/browser";
import { getServiceFeeForType } from "./platformSettingsUtils";
import { db } from "../firebase/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

/**
 * Safely parse a date from various formats
 * @param {Date|string|Object} dateValue - The date value to parse
 * @returns {Date|null} Parsed date or null if invalid
 */
const parseDate = (dateValue) => {
  if (!dateValue) return null;
  
  // If it's already a valid Date object
  if (dateValue instanceof Date && !isNaN(dateValue)) {
    return dateValue;
  }
  
  // If it's a Firestore Timestamp
  if (dateValue.toDate && typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }
  
  // If it's a string, try to parse it
  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    return isNaN(parsed) ? null : parsed;
  }
  
  // If it's an object with seconds (Firestore Timestamp-like)
  if (dateValue.seconds) {
    return new Date(dateValue.seconds * 1000);
  }
  
  return null;
};

/**
 * Fetch average rating for a listing from reviews collection
 * @param {string} listingId - The listing ID
 * @returns {Promise<number>} Average rating (0 if no reviews)
 */
const getAverageListingRating = async (listingId) => {
  try {
    const reviewsRef = collection(db, "reviews");
    const q = query(reviewsRef, where("listingId", "==", listingId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return 0;
    }

    let totalRating = 0;
    querySnapshot.forEach((doc) => {
      const rating = doc.data().rating || 0;
      totalRating += rating;
    });

    const averageRating = totalRating / querySnapshot.size;
    return Math.round(averageRating * 10) / 10; // Round to 1 decimal place
  } catch (error) {
    console.error("Error fetching average rating:", error);
    return 0;
  }
};

/**
 * Send guest refund email notification
 * @param {Object} booking - The booking document
 * @param {Object} guestData - Guest user data with email and name
 * @param {Object} options - Optional configuration
 * @param {string} options.cancellationReason - Reason for refund (if applicable)
 * @param {number} options.refundAmount - Amount being refunded
 * @param {string} options.basePrice - Original booking price
 * @param {string} options.serviceFee - Service fee amount
 * @returns {Promise<void>}
 */
export const sendGuestRefundEmail = async (
  booking,
  guestData,
  options = {}
) => {
  try {
    // Use ALTERNATIVE EmailJS service for refund emails only
    const publicKey = import.meta.env.VITE_EMAIL_JS_ANOTHER_PUBLIC_KEY?.trim();
    const serviceId = import.meta.env.VITE_EMAIL_JS_ANOTHER_SERVICE_ID?.trim();
    const templateId =
      import.meta.env.VITE_CANCELED_EMAIL_JS_TEMPLATE_ID?.trim();

    if (!publicKey || !serviceId || !templateId) {
      console.warn(
        "EmailJS credentials not configured for refund emails"
      );
      return;
    }

    // Initialize EmailJS with ALTERNATIVE service (dedicated for refunds)
    emailjs.init({
      publicKey: publicKey,
      blockHeadless: false,
    });

    // Format dates
    const now = new Date();
    const cancellationDate = now.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    // Determine booking type and extract relevant dates
    const listingType = booking.type || "stays";
    let checkInDate = "N/A";
    let checkOutDate = "N/A";

    if (listingType === "stays") {
      const checkIn = parseDate(booking.checkIn);
      const checkOut = parseDate(booking.checkOut);
      
      if (checkIn && !isNaN(checkIn)) {
        checkInDate = checkIn.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
      
      if (checkOut && !isNaN(checkOut)) {
        checkOutDate = checkOut.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
    } else if (
      listingType === "experiences" ||
      listingType === "services"
    ) {
      const selectedDateValue = booking.selectedDate || booking.selectedDateTime?.date || booking.startDate;
      const selectedDate = parseDate(selectedDateValue);
      
      if (selectedDate && !isNaN(selectedDate)) {
        checkInDate = selectedDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
      
      checkOutDate = "N/A"; // Not applicable for experiences/services
    }

    // Get platform service fee percentage for this listing type
    const serviceFeePercentage = await getServiceFeeForType(listingType);

    // Get average rating from reviews
    const listingRating = await getAverageListingRating(booking.listing_id);

    // Calculate refund amounts
    const basePrice = options.basePrice || booking.totalAmount || 0;
    const serviceFee =
      options.serviceFee || Math.round(basePrice * (serviceFeePercentage / 100) * 100) / 100;
    const refundAmount = options.refundAmount || basePrice;

    // Prepare discount information
    const discountAmount = booking.discountAmount || 0;
    const discountType = booking.discountType || "Promo Code";
    const hasDiscount = discountAmount > 0;

    // Prepare email parameters
    const emailParams = {
      to_email: guestData.email,
      guestName: guestData.fullName || guestData.displayName || "Guest",
      listingTitle: booking.listing?.title || booking.title || "Booking",
      listingLocation: booking.listing?.location || booking.location || "N/A",
      listingRating: listingRating,
      listingType: booking.type
        ? booking.type.charAt(0).toUpperCase() + booking.type.slice(1)
        : "Booking",
      bookingId: booking.id,
      numberOfGuests: booking.totalGuests || booking.numberOfGuests || booking.guests || 1,
      checkInDate: checkInDate || "N/A",
      checkOutDate: checkOutDate || "N/A",
      basePrice: basePrice.toFixed(2),
      serviceFee: serviceFee.toFixed(2),
      serviceFeePercentage: serviceFeePercentage.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      discountType: discountType,
      discountDisplay: hasDiscount ? "" : "display: none;",
      refundAmount: refundAmount.toFixed(2),
      cancellationDate: cancellationDate,
      dashboardLink: `${window.location.origin}/guest/my-bookings`,
    };

    console.log("📧 Sending guest refund email...", {
      to: emailParams.to_email,
      bookingId: emailParams.bookingId,
      serviceFeePercentage: serviceFeePercentage,
    });

    await emailjs.send(serviceId, templateId, emailParams);

    console.log("✅ Guest refund email sent successfully");
  } catch (error) {
    console.error("❌ Error sending refund email:", error);
    // Don't use fallback - this service is already the dedicated refund service
    throw error;
  }
};
