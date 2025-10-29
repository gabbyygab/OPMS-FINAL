/**
 * EmailJS Diagnostic and Testing Utility
 * Use this to verify EmailJS configuration and test email sending
 */

import emailjs from "@emailjs/browser";

export const testEmailJSConfiguration = async () => {
  try {
    const publicKey = import.meta.env.VITE_EMAIL_JS_PUBLIC_KEY?.trim();
    const serviceId = import.meta.env.VITE_EMAIL_JS_SERVICE_ID;
    const templateId = import.meta.env.VITE_BOOKING_EMAIL_JS_TEMPLATE_ID;

    console.log("=== EmailJS Configuration Diagnostic ===");
    console.log(
      "Public Key:",
      publicKey ? `Set (${publicKey.substring(0, 8)}...)` : "NOT SET"
    );
    console.log("Service ID:", serviceId || "NOT SET");
    console.log("Template ID:", templateId || "NOT SET");

    if (!publicKey) {
      console.error("❌ VITE_EMAIL_JS_PUBLIC_KEY is not set");
      return false;
    }

    if (!serviceId) {
      console.error("❌ VITE_EMAIL_JS_SERVICE_ID is not set");
      return false;
    }

    if (!templateId) {
      console.error("❌ VITE_BOOKING_EMAIL_JS_TEMPLATE_ID is not set");
      return false;
    }

    // Initialize EmailJS
    emailjs.init({
      publicKey: publicKey,
      blockHeadless: false,
    });

    console.log("✓ EmailJS initialized successfully");
    return true;
  } catch (error) {
    console.error("❌ Error initializing EmailJS:", error);
    return false;
  }
};

export const testEmailSend = async (testEmail) => {
  try {
    console.log("=== Testing Email Send ===");

    const serviceId = import.meta.env.VITE_EMAIL_JS_SERVICE_ID;
    const templateId = import.meta.env.VITE_BOOKING_EMAIL_JS_TEMPLATE_ID;

    const testParams = {
      email: testEmail,
      name: "Test Guest",
      listingTitle: "Test Listing",
      listingLocation: "Test Location",
      listingRating: 4.5,
      listingType: "Stay",
      bookingId: "TEST123",
      numberOfGuests: 2,
      basePrice: "1000.00",
      serviceFee: "50.00",
      totalAmount: "1050.00",
      bookingType: "stays",
      checkInDate: "2024-11-15",
      checkOutDate: "2024-11-17",
      numberOfNights: 2,
      dashboardLink: window.location.origin,
    };

    console.log("Sending test email to:", testEmail);
    console.log("Parameters:", testParams);

    const response = await emailjs.send(serviceId, templateId, testParams);

    console.log("✓ Test email sent successfully!");
    console.log("Status:", response.status);
    console.log("Text:", response.text);

    return {
      success: true,
      message: "Test email sent successfully. Check your inbox.",
      response,
    };
  } catch (error) {
    console.error("❌ Error sending test email:", error);
    return {
      success: false,
      message: "Failed to send test email",
      error: {
        message: error?.message,
        status: error?.status,
        text: error?.text,
      },
    };
  }
};

/**
 * Validates email parameters match template expectations
 */
export const validateEmailParams = (params) => {
  const requiredParams = [
    "to_email",
    "guestName",
    "listingTitle",
    "bookingId",
    "numberOfGuests",
    "basePrice",
    "serviceFee",
    "totalAmount",
    "bookingType",
  ];

  const missingParams = requiredParams.filter((param) => !params[param]);

  if (missingParams.length > 0) {
    console.warn("⚠ Missing parameters:", missingParams);
    return {
      valid: false,
      missingParams,
    };
  }

  console.log("✓ All required parameters present");
  return { valid: true };
};
