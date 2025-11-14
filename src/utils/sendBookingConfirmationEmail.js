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
 * Send booking confirmation email to guest when booking is created
 * @param {Object} booking - The booking document
 * @param {Object} listingData - Listing details
 * @param {Object} guestData - Guest user data with email and name
 * @returns {Promise<void>}
 */
export const sendBookingConfirmationEmail = async (
  booking,
  listingData,
  guestData
) => {
  try {
    // Use PRIMARY EmailJS service for booking confirmations
    const publicKey = import.meta.env.VITE_EMAIL_JS_PUBLIC_KEY?.trim();
    const serviceId = import.meta.env.VITE_EMAIL_JS_SERVICE_ID?.trim();
    const templateId =
      import.meta.env.VITE_BOOKING_EMAIL_JS_TEMPLATE_ID?.trim();

    if (!publicKey || !serviceId || !templateId) {
      console.warn("EmailJS credentials not configured for booking emails");
      return;
    }

    // Initialize EmailJS with PRIMARY service
    emailjs.init({
      publicKey: publicKey,
      blockHeadless: false,
    });

    // Determine booking type and extract relevant dates
    const bookingType = listingData?.type || booking.type || "booking";
    let dateDisplay = "";
    let numberOfNights = 0;
    let checkInDate = "N/A";
    let checkOutDate = "N/A";

    if (bookingType === "stays") {
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
      
      if (checkIn && checkOut && !isNaN(checkIn) && !isNaN(checkOut)) {
        dateDisplay = `${checkIn.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })} - ${checkOut.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}`;
        numberOfNights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      }
    } else if (
      bookingType === "experiences" ||
      bookingType === "services"
    ) {
      const selectedDateValue = booking.selectedDate || booking.selectedDateTime?.date || booking.startDate;
      const selectedDate = parseDate(selectedDateValue);
      
      if (selectedDate && !isNaN(selectedDate)) {
        checkInDate = selectedDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        dateDisplay = selectedDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        if (booking.selectedTime || booking.selectedDateTime?.time) {
          dateDisplay += ` at ${booking.selectedTime || booking.selectedDateTime.time}`;
        }
      }
      
      checkOutDate = "N/A"; // Not applicable for experiences/services
    }

    // Get platform service fee percentage for this listing type
    const serviceFeePercentage = await getServiceFeeForType(bookingType);

    // Get average rating from reviews
    const listingRating = await getAverageListingRating(booking.listing_id);

    // Prepare discount information
    const discountAmount = booking.discountAmount || 0;
    const discountType = booking.discountType || "Promo Code";
    const hasDiscount = discountAmount > 0;

    // Prepare email parameters
    const emailParams = {
      to_email: guestData.email,
      guestName: guestData.fullName || guestData.displayName || "Guest",
      listingTitle: listingData?.title || "Booking",
      listingLocation: listingData?.location || "N/A",
      listingRating: listingRating,
      listingType:
        bookingType.charAt(0).toUpperCase() +
        bookingType.slice(1),
      bookingId: booking.id || "N/A",
      numberOfGuests: booking.guests || booking.numberOfGuests || 1,
      checkInDate: checkInDate || "N/A",
      checkOutDate: checkOutDate || "N/A",
      basePrice: (booking.baseAmount || booking.totalAmount || 0).toFixed(2),
      serviceFee: (booking.serviceFee || 0).toFixed(2),
      serviceFeePercentage: serviceFeePercentage.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      discountType: discountType,
      discountDisplay: hasDiscount ? "" : "display: none;",
      totalAmount: (booking.grandTotal || booking.totalAmount || 0).toFixed(
        2
      ),
      bookingType: bookingType,
      dateDisplay: dateDisplay,
      numberOfNights: numberOfNights,
      dashboardLink: `${window.location.origin}/guest/my-bookings`,
    };

    console.log("📧 Sending booking confirmation email...", {
      to: emailParams.to_email,
      bookingId: emailParams.bookingId,
      listingType: emailParams.listingType,
      serviceFeePercentage: serviceFeePercentage,
    });

    await emailjs.send(serviceId, templateId, emailParams);

    console.log("✅ Booking confirmation email sent successfully");
  } catch (error) {
    console.error("❌ Error sending booking confirmation email:", error);
    // Don't use fallback - the "another" service is reserved for cancellation emails only
    throw error;
  }
};
