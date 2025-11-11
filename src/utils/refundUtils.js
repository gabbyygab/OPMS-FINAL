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
 * Request a refund for a confirmed booking
 * Changes booking status to "refund_requested"
 * Notifies host for approval/denial
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
        "Only confirmed bookings can be refunded. Current status: " +
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
      title: "Refund Request Received",
      message: `${guestName} requested a refund for "${
        bookingData.listing?.title
      }". Reason: ${reason || "No reason provided"}`,
      listingId: bookingData.listing_id,
      bookingId: bookingId,
      isRead: false,
      createdAt: serverTimestamp(),
    });

    return {
      success: true,
      message: "Refund request submitted. Waiting for host approval.",
    };
  } catch (error) {
    console.error("Error requesting refund:", error);
    throw error;
  }
};

/**
 * Approve a refund request (Host action)
 * Processes refund, deducts points, updates wallets
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
    console.log(bookingId);
    console.log(bookingData.host_id);
    console.log(hostId);
    if (bookingData.host_id !== hostId) {
      throw new Error("Only the host can approve/deny this refund");
    }

    // Get guest wallet
    const guestWalletRef = doc(db, "wallets", bookingData.guest_id);
    const guestWalletSnap = await getDoc(guestWalletRef);

    if (!guestWalletSnap.exists()) {
      throw new Error("Guest wallet not found");
    }

    const guestWalletData = guestWalletSnap.data();

    // Get host wallet
    const hostWalletRef = doc(db, "wallets", hostId);
    const hostWalletSnap = await getDoc(hostWalletRef);

    if (!hostWalletSnap.exists()) {
      throw new Error("Host wallet not found");
    }

    const hostWalletData = hostWalletSnap.data();

    // Calculate refund amounts
    // Guest gets back: totalAmount + serviceFee (full amount paid)
    // Host loses: only totalAmount (service fee was already deducted)
    const baseRefundAmount = bookingData.totalAmount || 0;
    const serviceFeeAmount = bookingData.serviceFee || (baseRefundAmount * 0.05);
    const totalGuestRefund = baseRefundAmount + serviceFeeAmount;

    // Update guest wallet (add full refund including service fee)
    await updateDoc(guestWalletRef, {
      balance: guestWalletData.balance + totalGuestRefund,
      total_spent: Math.max(
        0,
        (guestWalletData.total_spent || 0) - totalGuestRefund
      ),
    });

    // Update host wallet (deduct only base amount, service fee already accounted for)
    await updateDoc(hostWalletRef, {
      balance: hostWalletData.balance - baseRefundAmount,
      total_cash_in: Math.max(
        0,
        (hostWalletData.total_cash_in || 0) - baseRefundAmount
      ),
    });

    // Get or create admin/platform wallet to deduct service fee
    const platformWalletRef = doc(db, "wallets", "platform_admin");
    const platformWalletSnap = await getDoc(platformWalletRef);

    if (platformWalletSnap.exists()) {
      const platformWalletData = platformWalletSnap.data();
      // Deduct service fee from platform
      await updateDoc(platformWalletRef, {
        balance: platformWalletData.balance - serviceFeeAmount,
        total_platform_fees: Math.max(
          0,
          (platformWalletData.total_platform_fees || 0) - serviceFeeAmount
        ),
      });
    }

    // Create guest transaction (full refund including service fee)
    await addDoc(collection(db, "transactions"), {
      amount: totalGuestRefund,
      created_at: serverTimestamp(),
      type: "refund",
      status: "completed",
      user_id: bookingData.guest_id,
      wallet_id: guestWalletRef.id,
      bookingId: bookingId,
      description: `Refund for booking (₱${baseRefundAmount.toFixed(2)} + ₱${serviceFeeAmount.toFixed(2)} service fee)`,
    });

    // Create host transaction (base amount refunded)
    await addDoc(collection(db, "transactions"), {
      amount: -baseRefundAmount,
      created_at: serverTimestamp(),
      type: "refund",
      status: "completed",
      user_id: hostId,
      wallet_id: hostWalletRef.id,
      bookingId: bookingId,
      description: `Refund paid to guest for booking`,
    });

    // Create platform transaction (service fee deducted)
    if (platformWalletSnap.exists()) {
      await addDoc(collection(db, "transactions"), {
        amount: -serviceFeeAmount,
        created_at: serverTimestamp(),
        type: "service_fee_refund",
        status: "completed",
        user_id: "platform_admin",
        wallet_id: platformWalletRef.id,
        bookingId: bookingId,
        description: `Service fee refunded to guest`,
      });
    }

    // DEDUCT POINTS from both guest and host
    // Deduct from guest
    const guestRewardsQuery = query(
      collection(db, "rewards"),
      where("userId", "==", bookingData.guest_id)
    );
    const guestRewardsSnap = await getDocs(guestRewardsQuery);
    if (!guestRewardsSnap.empty) {
      const guestRewardsDoc = guestRewardsSnap.docs[0];
      const guestRewardsData = guestRewardsDoc.data();
      const pointsToRemove = Math.min(
        POINTS_CONFIG.POINTS_PER_BOOKING,
        guestRewardsData.availablePoints || 0
      );

      const guestPointsHistory = [...(guestRewardsData.pointsHistory || [])];
      guestPointsHistory.push({
        action: "points_deducted_on_refund",
        bookingId: bookingId,
        pointsRemoved: pointsToRemove,
        reason: "Booking was refunded",
        createdAt: new Date().toISOString(),
      });

      const guestRewardsRef = doc(db, "rewards", guestRewardsDoc.id);
      await updateDoc(guestRewardsRef, {
        availablePoints: Math.max(
          0,
          (guestRewardsData.availablePoints || 0) - pointsToRemove
        ),
        totalPoints: Math.max(
          0,
          (guestRewardsData.totalPoints || 0) - pointsToRemove
        ),
        pointsHistory: guestPointsHistory,
        updatedAt: serverTimestamp(),
      });
    }

    // Deduct from host
    const hostRewardsQuery = query(
      collection(db, "rewards"),
      where("userId", "==", hostId)
    );
    const hostRewardsSnap = await getDocs(hostRewardsQuery);
    if (!hostRewardsSnap.empty) {
      const hostRewardsDoc = hostRewardsSnap.docs[0];
      const hostRewardsData = hostRewardsDoc.data();
      const pointsToRemove = Math.min(
        POINTS_CONFIG.POINTS_PER_BOOKING,
        hostRewardsData.availablePoints || 0
      );

      const hostPointsHistory = [...(hostRewardsData.pointsHistory || [])];
      hostPointsHistory.push({
        action: "points_deducted_on_refund",
        bookingId: bookingId,
        pointsRemoved: pointsToRemove,
        reason: "Booking was refunded",
        createdAt: new Date().toISOString(),
      });

      const hostRewardsRef = doc(db, "rewards", hostRewardsDoc.id);
      await updateDoc(hostRewardsRef, {
        availablePoints: Math.max(
          0,
          (hostRewardsData.availablePoints || 0) - pointsToRemove
        ),
        totalPoints: Math.max(
          0,
          (hostRewardsData.totalPoints || 0) - pointsToRemove
        ),
        pointsHistory: hostPointsHistory,
        updatedAt: serverTimestamp(),
      });
    }

    // Remove booked dates from listing
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

    // Update booking status to refunded
    await updateDoc(bookingRef, {
      status: "refunded",
      refund_approved_at: serverTimestamp(),
      refund_approved_by: hostId,
    });

    // Create notification for guest (refund approved)
    await addDoc(collection(db, "notifications"), {
      userId: bookingData.guest_id,
      guestId: bookingData.guest_id,
      type: "refund_approved",
      title: "Refund Approved",
      message: `Your refund of ₱${totalGuestRefund.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} has been approved and credited to your wallet.`,
      listingId: bookingData.listing_id,
      bookingId: bookingId,
      isRead: false,
      createdAt: serverTimestamp(),
    });

    return {
      success: true,
      message: "Refund approved. Full amount (including service fee) returned to guest wallet.",
      guestRefundAmount: totalGuestRefund,
      hostRefundAmount: baseRefundAmount,
      serviceFeeRefunded: serviceFeeAmount,
      pointsDeducted: POINTS_CONFIG.POINTS_PER_BOOKING,
    };
  } catch (error) {
    console.error("Error approving refund:", error);
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
