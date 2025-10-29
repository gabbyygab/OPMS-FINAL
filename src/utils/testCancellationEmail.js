import { sendBookingCancellationEmail } from "./sendBookingCancellationEmail";

/**
 * Test the booking cancellation email functionality
 * Use this to verify that cancellation emails work correctly
 */
export const testCancellationEmail = async (testEmail = "test@bookingnest.com") => {
  console.log("🧪 Testing booking cancellation email...");

  try {
    // Test data for STAYS booking
    const staysBooking = {
      id: "booking_stays_12345",
      type: "stays",
      title: "Beachfront Luxury Villa",
      listing: {
        title: "Beachfront Luxury Villa",
        location: "Boracay, Philippines",
        rating: 4.8,
      },
      checkIn: new Date("2025-12-15"),
      checkOut: new Date("2025-12-20"),
      totalAmount: 5000,
      price: 5000,
      totalGuests: 4,
      numberOfGuests: 4,
      duration: 5,
    };

    const guestData = {
      email: testEmail,
      fullName: "John Doe",
    };

    console.log("📧 Sending STAYS cancellation email...");
    await sendBookingCancellationEmail(staysBooking, guestData, {
      cancellationReason: "Guest requested cancellation",
      basePrice: 5000,
      serviceFee: 250,
      refundAmount: 5250,
    });
    console.log("✅ STAYS cancellation email test passed!");

    // Test data for EXPERIENCES booking
    const experiencesBooking = {
      id: "booking_exp_67890",
      type: "experiences",
      title: "Island Hopping Adventure",
      listing: {
        title: "Island Hopping Adventure",
        location: "Palawan, Philippines",
        rating: 4.9,
      },
      selectedDateTime: {
        date: "2025-11-30",
        time: "09:00",
      },
      duration: 6,
      totalAmount: 3000,
      price: 3000,
      totalGuests: 2,
      numberOfGuests: 2,
    };

    console.log("📧 Sending EXPERIENCES cancellation email...");
    await sendBookingCancellationEmail(experiencesBooking, guestData, {
      cancellationReason: "Guest requested cancellation",
      basePrice: 3000,
      serviceFee: 150,
      refundAmount: 3150,
    });
    console.log("✅ EXPERIENCES cancellation email test passed!");

    // Test data for SERVICES booking
    const servicesBooking = {
      id: "booking_svc_11111",
      type: "services",
      title: "Professional House Cleaning",
      listing: {
        title: "Professional House Cleaning",
        location: "Makati, Manila",
        rating: 4.7,
      },
      selectedDateTime: {
        date: "2025-11-25",
        time: "14:00",
      },
      duration: 3,
      totalAmount: 1500,
      price: 1500,
      totalGuests: 1,
      numberOfGuests: 1,
    };

    console.log("📧 Sending SERVICES cancellation email...");
    await sendBookingCancellationEmail(servicesBooking, guestData, {
      cancellationReason: "Guest requested cancellation",
      basePrice: 1500,
      serviceFee: 75,
      refundAmount: 1575,
    });
    console.log("✅ SERVICES cancellation email test passed!");

    console.log(
      "✅ All cancellation email tests passed! Check your inbox at " + testEmail
    );
    return { success: true, message: "All tests passed" };
  } catch (error) {
    console.error(
      "❌ Cancellation email test failed:",
      error.message || error
    );
    return {
      success: false,
      message: "Test failed: " + (error.message || String(error)),
    };
  }
};

/**
 * Test pending booking cancellation (no refund)
 */
export const testPendingBookingCancellation = async (
  testEmail = "test@bookingnest.com"
) => {
  console.log("🧪 Testing PENDING booking cancellation email...");

  try {
    const pendingBooking = {
      id: "booking_pending_xyz",
      type: "stays",
      title: "City Center Apartment",
      listing: {
        title: "City Center Apartment",
        location: "BGC, Taguig",
        rating: 4.5,
      },
      checkIn: new Date("2025-12-01"),
      checkOut: new Date("2025-12-05"),
      totalAmount: 2000,
      price: 2000,
      totalGuests: 2,
      numberOfGuests: 2,
    };

    const guestData = {
      email: testEmail,
      fullName: "Jane Smith",
    };

    console.log(
      "📧 Sending pending booking cancellation email (no refund)..."
    );
    await sendBookingCancellationEmail(
      pendingBooking,
      guestData,
      {
        cancellationReason: "Booking cancelled by guest (pending status)",
        basePrice: 2000,
        refundAmount: 0, // No refund for pending cancellations
      }
    );
    console.log("✅ Pending booking cancellation email test passed!");
    return { success: true, message: "Pending booking test passed" };
  } catch (error) {
    console.error(
      "❌ Pending booking cancellation test failed:",
      error.message || error
    );
    return {
      success: false,
      message: "Test failed: " + (error.message || String(error)),
    };
  }
};
