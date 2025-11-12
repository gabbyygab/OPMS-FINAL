import { db } from "../firebase/firebase";
import {
  doc,
  updateDoc,
  addDoc,
  collection,
  getDoc,
  serverTimestamp,
  arrayRemove,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { POINTS_CONFIG } from "./rewardsUtils";

/**
 * Request a refund/cancellation for a confirmed booking
 * Changes booking status to "refund_requested"
 * Notifies host for approval/denial
 * NOTE: Only confirmed bookings can be refunded (before completion)
 */
export const requestRefund = async (bookingId, guestId, reason) => {
  try {
    const bookingRef = doc(db, "bookings", bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      throw new Error("Booking not found");
    }

    const bookingData = bookingSnap.data();

    // Validate booking can be refunded
    if (bookingData.status !== "confirmed") {
      throw new Error(
        "Only confirmed bookings can be refunded. Completed bookings cannot be refunded. Current status: " +
          bookingData.status
      );
    }

    // Check if booking is before check-in date
    const checkInDate = new Date(bookingData.checkIn);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate <= today) {
      throw new Error(
        "Cannot request refund on or after check-in date. Booking is imminent or in progress."
      );
    }

    // Update booking status to refund_requested
    await updateDoc(bookingRef, {
      status: "refund_requested",
      refund_requested_at: serverTimestamp(),
      refund_request_reason: reason || "",
      refund_requested_by: guestId,
    });

    // Get guest's name from users collection
    const guestDocRef = doc(db, "users", guestId);
    const guestDocSnap = await getDoc(guestDocRef);
    const guestName = guestDocSnap.exists() ? guestDocSnap.data().fullName : "Guest";

    // Create notification for host
    await addDoc(collection(db, "notifications"), {
      userId: bookingData.host_id,
      guestId: guestId,
      guestName: guestName,
      type: "refund_requested",
      title: "Cancellation Request Received",
      message: `${guestName} requested to cancel the booking for "${
        bookingData.listing?.title
      }". Reason: ${reason || "No reason provided"}`,
      listingId: bookingData.listing_id,
      bookingId: bookingId,
      isRead: false,
      createdAt: serverTimestamp(),
    });

    return {
      success: true,
      message: "Cancellation request submitted. Waiting for host approval.",
    };
  } catch (error) {
    console.error("Error requesting refund:", error);
    throw error;
  }
};

/**
 * Approve a cancellation request (Host action)
 * Since payment only happens on completion, this simply cancels the booking
 * NO money movement, NO points deduction (as no payment/points were processed yet)
 */
export const approveRefund = async (bookingId, hostId) => {
  try {
    const bookingRef = doc(db, "bookings", bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      throw new Error("Booking not found");
    }

    const bookingData = bookingSnap.data();

    // Verify it's a refund request
    if (bookingData.status !== "refund_requested") {
      throw new Error("Booking must have refund_requested status");
    }

    // Verify host is the listing owner
    if (bookingData.host_id !== hostId && bookingData.hostId !== hostId) {
      throw new Error("Only the host can approve/deny this cancellation");
    }

    // Remove booked dates from listing (free up availability)
    if (bookingData.checkIn && bookingData.checkOut) {
      const listingRef = doc(db, "listings", bookingData.listing_id);
      const checkInDate = new Date(bookingData.checkIn);
      const checkOutDate = new Date(bookingData.checkOut);
      const datesToRemove = [];

      for (
        let d = new Date(checkInDate);
        d <= checkOutDate;
        d.setDate(d.getDate() + 1)
      ) {
        datesToRemove.push(new Date(d));
      }

      await updateDoc(listingRef, {
        bookedDates: arrayRemove(...datesToRemove),
      });
    }

    // Update booking status to cancelled
    await updateDoc(bookingRef, {
      status: "cancelled",
      refund_approved_at: serverTimestamp(),
      refund_approved_by: hostId,
    });

    // Create notification for guest (cancellation approved)
    await addDoc(collection(db, "notifications"), {
      userId: bookingData.guest_id,
      guestId: bookingData.guest_id,
      type: "refund_approved",
      title: "Cancellation Approved",
      message: `Your cancellation request for "${bookingData.listing?.title}" has been approved. No charges were made to your wallet.`,
      listingId: bookingData.listing_id,
      bookingId: bookingId,
      isRead: false,
      createdAt: serverTimestamp(),
    });

    return {
      success: true,
      message: "Cancellation approved. Booking cancelled with no charges.",
    };
  } catch (error) {
    console.error("Error approving cancellation:", error);
    throw error;
  }
};

/**
 * Deny a refund request (Host action)
 * Changes status back to confirmed, booking continues
 */
export const denyRefund = async (bookingId, hostId, reason) => {
  try {
    const bookingRef = doc(db, "bookings", bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      throw new Error("Booking not found");
    }

    const bookingData = bookingSnap.data();

    // Verify it's a refund request
    if (bookingData.status !== "refund_requested") {
      throw new Error("Booking must have refund_requested status");
    }

    // Verify host is the listing owner
    if (bookingData.host_id !== hostId) {
      throw new Error("Only the host can approve/deny this refund");
    }

    // Update booking status back to confirmed
    await updateDoc(bookingRef, {
      status: "confirmed",
      refund_denied_at: serverTimestamp(),
      refund_denied_by: hostId,
      refund_denial_reason: reason || "No reason provided",
    });

    // Create notification for guest (refund denied)
    await addDoc(collection(db, "notifications"), {
      userId: bookingData.guest_id,
      guestId: bookingData.guest_id,
      type: "refund_denied",
      title: "Refund Request Denied",
      message: `Your refund request for "${
        bookingData.listing?.title
      }" has been denied. Reason: ${reason || "No reason provided"}`,
      listingId: bookingData.listing_id,
      bookingId: bookingId,
      isRead: false,
      createdAt: serverTimestamp(),
    });

    return {
      success: true,
      message: "Refund request denied. Booking remains confirmed.",
    };
  } catch (error) {
    console.error("Error denying refund:", error);
    throw error;
  }
};

/**
 * Check if a booking can be refunded
 */
export const canRequestRefund = (booking) => {
  if (!booking) {
    return { canRefund: false, reason: "Booking not found" };
  }

  if (booking.status !== "confirmed") {
    return {
      canRefund: false,
      reason: `Booking status is "${booking.status}", not confirmed`,
    };
  }

  const checkInDate = new Date(booking.checkIn);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (checkInDate <= today) {
    return {
      canRefund: false,
      reason: "Cannot request refund on or after check-in date",
    };
  }

  return { canRefund: true };
};
