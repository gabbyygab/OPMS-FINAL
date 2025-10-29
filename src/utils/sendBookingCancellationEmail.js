import emailjs from "@emailjs/browser";

/**
 * Send booking cancellation email to guest
 * @param {Object} booking - The booking document
 * @param {Object} guestData - Guest user data with email and name
 * @param {Object} options - Optional configuration
 * @param {string} options.cancellationReason - Reason for cancellation (if applicable)
 * @param {number} options.refundAmount - Amount being refunded
 * @param {string} options.basePrice - Original booking price
 * @param {string} options.serviceFee - Service fee amount
 * @returns {Promise<void>}
 */
export const sendBookingCancellationEmail = async (
  booking,
  guestData,
  options = {}
) => {
  try {
    const publicKey = import.meta.env.VITE_EMAIL_JS_ANOTHER_PUBLIC_KEY?.trim();
    const serviceId = import.meta.env.VITE_EMAIL_JS_ANOTHER_SERVICE_ID?.trim();
    const templateId =
      import.meta.env.VITE_CANCELED_EMAIL_JS_TEMPLATE_ID?.trim();

    if (!publicKey || !serviceId || !templateId) {
      console.warn(
        "EmailJS credentials not configured for cancellation emails"
      );
      return;
    }

    // Initialize EmailJS
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

    // Calculate refund amounts
    const basePrice = options.basePrice || booking.totalAmount || 0;
    const serviceFee =
      options.serviceFee || Math.round(basePrice * 0.05 * 100) / 100;
    const refundAmount = options.refundAmount || basePrice;

    // Prepare email parameters
    const emailParams = {
      to_email: guestData.email,
      guestName: guestData.fullName || guestData.displayName || "Guest",
      listingTitle: booking.listing?.title || booking.title || "Booking",
      listingLocation: booking.listing?.location || booking.location || "N/A",
      listingRating: booking.listing?.rating || 0,
      listingType: booking.type
        ? booking.type.charAt(0).toUpperCase() + booking.type.slice(1)
        : "Booking",
      bookingId: booking.id,
      numberOfGuests: booking.totalGuests || booking.numberOfGuests || 1,
      basePrice: basePrice.toFixed(2),
      serviceFee: serviceFee.toFixed(2),
      refundAmount: refundAmount.toFixed(2),
      cancellationDate: cancellationDate,
      dashboardLink: `${window.location.origin}/guest/my-bookings`,
    };

    console.log("📧 Sending booking cancellation email...", {
      to: emailParams.to_email,
      bookingId: emailParams.bookingId,
    });

    await emailjs.send(serviceId, templateId, emailParams);

    console.log("✅ Booking cancellation email sent successfully");
  } catch (error) {
    console.error("❌ Error sending cancellation email:", error);

    // Try fallback service (primary credentials)
    try {
      const fallbackPublicKey =
        import.meta.env.VITE_EMAIL_JS_PUBLIC_KEY?.trim();
      const fallbackServiceId =
        import.meta.env.VITE_EMAIL_JS_SERVICE_ID?.trim();
      const fallbackTemplateId =
        import.meta.env.VITE_CANCELED_EMAIL_JS_TEMPLATE_ID?.trim();

      if (fallbackPublicKey && fallbackServiceId && fallbackTemplateId) {
        emailjs.init({
          publicKey: fallbackPublicKey,
          blockHeadless: false,
        });

        // Rebuild emailParams for fallback
        const basePrice = options.basePrice || booking.totalAmount || 0;
        const serviceFee =
          options.serviceFee || Math.round(basePrice * 0.05 * 100) / 100;
        const refundAmount = options.refundAmount || basePrice;
        const now = new Date();
        const cancellationDate = now.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });

        const fallbackEmailParams = {
          to_email: guestData.email,
          guestName: guestData.fullName || guestData.displayName || "Guest",
          listingTitle: booking.listing?.title || booking.title || "Booking",
          listingLocation:
            booking.listing?.location || booking.location || "N/A",
          listingRating: booking.listing?.rating || 0,
          listingType: booking.type
            ? booking.type.charAt(0).toUpperCase() + booking.type.slice(1)
            : "Booking",
          bookingId: booking.id,
          numberOfGuests: booking.totalGuests || booking.numberOfGuests || 1,
          basePrice: basePrice.toFixed(2),
          serviceFee: serviceFee.toFixed(2),
          refundAmount: refundAmount.toFixed(2),
          cancellationDate: cancellationDate,
          dashboardLink: `${window.location.origin}/guest/my-bookings`,
        };

        // Send using fallback service
        await emailjs.send(
          fallbackServiceId,
          fallbackTemplateId,
          fallbackEmailParams
        );
        console.log(
          "✅ Cancellation email sent via fallback service successfully"
        );
      }
    } catch (fallbackError) {
      console.error(
        "❌ Both primary and fallback email services failed:",
        fallbackError
      );
    }
  }
};
