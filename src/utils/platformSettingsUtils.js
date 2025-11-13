import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  query,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

// Default service fee configuration (paid by guests, not deducted from hosts)
const DEFAULT_SERVICE_FEES = {
  stays: 5,
  experiences: 5,
  services: 5,
};

/**
 * Initialize platform settings with default values if not exists
 */
export async function initializePlatformSettings() {
  try {
    const settingsRef = doc(db, "platformSettings", "serviceFees");
    const settingsSnap = await getDoc(settingsRef);

    if (!settingsSnap.exists()) {
      await setDoc(settingsRef, {
        stays: DEFAULT_SERVICE_FEES.stays,
        experiences: DEFAULT_SERVICE_FEES.experiences,
        services: DEFAULT_SERVICE_FEES.services,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return DEFAULT_SERVICE_FEES;
    }

    return settingsSnap.data();
  } catch (error) {
    console.error("Error initializing platform settings:", error);
    throw error;
  }
}

/**
 * Get current service fee rates
 * @returns {Promise<{stays: number, experiences: number, services: number}>}
 */
export async function getServiceFees() {
  try {
    const settingsRef = doc(db, "platformSettings", "serviceFees");
    const settingsSnap = await getDoc(settingsRef);

    if (!settingsSnap.exists()) {
      // Initialize if doesn't exist
      return await initializePlatformSettings();
    }

    return {
      stays: settingsSnap.data().stays || DEFAULT_SERVICE_FEES.stays,
      experiences:
        settingsSnap.data().experiences || DEFAULT_SERVICE_FEES.experiences,
      services: settingsSnap.data().services || DEFAULT_SERVICE_FEES.services,
    };
  } catch (error) {
    console.error("Error getting service fees:", error);
    // Return defaults on error
    return DEFAULT_SERVICE_FEES;
  }
}

/**
 * Get service fee rate for a specific listing type
 * @param {string} listingType - "stays", "experiences", or "services"
 * @returns {Promise<number>} Fee percentage
 */
export async function getServiceFeeForType(listingType) {
  try {
    const fees = await getServiceFees();
    return fees[listingType] || DEFAULT_SERVICE_FEES[listingType] || 10;
  } catch (error) {
    console.error("Error getting service fee for type:", error);
    return 10; // Default fallback
  }
}

/**
 * Update service fee rates (admin only)
 * @param {Object} newFees - Object with stays, experiences, and/or services keys
 * @returns {Promise<void>}
 */
export async function updateServiceFees(newFees) {
  try {
    const settingsRef = doc(db, "platformSettings", "serviceFees");
    const updateData = {
      ...newFees,
      updatedAt: serverTimestamp(),
    };

    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) {
      // Create with defaults first
      await initializePlatformSettings();
    }

    await updateDoc(settingsRef, updateData);
    return true;
  } catch (error) {
    console.error("Error updating service fees:", error);
    throw error;
  }
}

/**
 * Calculate service fee amount for a booking
 * @param {number} bookingAmount - Total booking amount
 * @param {string} listingType - "stays", "experiences", or "services"
 * @returns {Promise<number>} Service fee amount
 */
export async function calculateServiceFee(bookingAmount, listingType) {
  try {
    const feePercentage = await getServiceFeeForType(listingType);
    return (bookingAmount * feePercentage) / 100;
  } catch (error) {
    console.error("Error calculating service fee:", error);
    // Default to 10% on error
    return (bookingAmount * 10) / 100;
  }
}

/**
 * Get host statistics for service fees from transactions collection
 * @returns {Promise<Array>} Array of host statistics
 */
export async function getHostServiceFeeStats() {
  try {
    // Fetch all users to filter by role
    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);
    const hostUserIds = new Set();

    // Get all host user IDs
    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      if (userData.role === "host") {
        hostUserIds.add(doc.id);
      }
    });

    // Fetch all bookings to check completion status
    const bookingsRef = collection(db, "bookings");
    const bookingsSnapshot = await getDocs(bookingsRef);

    // Only get completed bookings
    const completedBookings = bookingsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(booking => booking.status === "completed");

    // Fetch platform revenue to get service fees
    const platformRevenueRef = collection(db, "platformRevenue");
    const revenueSnapshot = await getDocs(platformRevenueRef);
    const platformRevenue = revenueSnapshot.docs.map(doc => doc.data());

    const hostStats = {};

    // Calculate earnings from completed bookings only
    for (const booking of completedBookings) {
      const hostId = booking.hostId || booking.host_id;

      if (!hostUserIds.has(hostId)) continue;

      // Initialize host stats if not exists
      if (!hostStats[hostId]) {
        hostStats[hostId] = {
          hostId: hostId,
          totalEarnings: 0,
          bookingsCount: 0,
          serviceFeeCollected: 0,
          listingType: booking.listing?.type || booking.type || "stays",
        };
      }

      // Add earnings from this completed booking
      hostStats[hostId].totalEarnings += (Number(booking.totalAmount) || 0);
      hostStats[hostId].bookingsCount += 1;

      // Update listing type if available
      if (booking.listing?.type && !hostStats[hostId].listingType) {
        hostStats[hostId].listingType = booking.listing.type;
      }
    }

    // Add service fees collected from completed bookings only
    for (const revenue of platformRevenue) {
      const hostId = revenue.hostId;

      if (!hostStats[hostId]) continue;

      // Only count service fees for completed bookings
      const isCompletedBooking = completedBookings.some(b => b.id === revenue.bookingId);
      if (isCompletedBooking) {
        hostStats[hostId].serviceFeeCollected += (Number(revenue.amount) || 0);
      }
    }

    // Convert to array and sort by service fee collected
    return Object.values(hostStats).sort(
      (a, b) => b.serviceFeeCollected - a.serviceFeeCollected
    );
  } catch (error) {
    console.error("Error getting host service fee stats:", error);
    return [];
  }
}

/**
 * Get total revenue from service fee transactions only
 * @returns {Promise<number>} Total service fee revenue (excluding new host fees)
 */
export async function getTotalServiceFeeRevenue() {
  try {
    const transactionsRef = collection(db, "transactions");
    const q = query(transactionsRef);
    const querySnapshot = await getDocs(q);

    let totalRevenue = 0;

    for (const docSnap of querySnapshot.docs) {
      const transaction = docSnap.data();

      // Count only service_fee transactions (exclude new_host_fees)
      if (transaction.type !== "service_fee") continue;

      // Service fees are stored as negative, convert to positive
      const amount = Math.abs(transaction.amount || 0);
      totalRevenue += amount;
    }

    return totalRevenue;
  } catch (error) {
    console.error("Error getting total service fee revenue:", error);
    return 0;
  }
}

/**
 * Get total revenue from new host fees
 * @returns {Promise<number>} Total new host fees revenue
 */
export async function getNewHostFeesRevenue() {
  try {
    const transactionsRef = collection(db, "transactions");
    const q = query(transactionsRef);
    const querySnapshot = await getDocs(q);

    let totalRevenue = 0;

    for (const docSnap of querySnapshot.docs) {
      const transaction = docSnap.data();

      // Only count new_host_fees transactions
      if (transaction.type !== "new_host_fees") continue;

      // Host fees are stored as negative, convert to positive
      const amount = Math.abs(transaction.amount || 0);
      totalRevenue += amount;
    }

    return totalRevenue;
  } catch (error) {
    console.error("Error getting new host fees revenue:", error);
    return 0;
  }
}

/**
 * Get monthly revenue breakdown by listing type from transactions
 * Includes all bookings created this month (confirmed/completed/refunded)
 * Revenue is calculated as net amount (service fees collected minus refunds)
 * Excludes only pending and rejected bookings
 * @returns {Promise<Object>} Revenue breakdown with net revenue and booking counts
 */
export async function getMonthlyRevenueBreakdown() {
  try {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Fetch all bookings
    const bookingsRef = collection(db, "bookings");
    const bookingsSnapshot = await getDocs(bookingsRef);

    // Filter for bookings created this month and are completed
    const thisMonthBookingIds = new Set();
    const bookingHostMap = new Map(); // Map booking ID to host ID
    const bookingTypeMap = new Map(); // Map booking ID to listing type

    bookingsSnapshot.docs.forEach(doc => {
      const booking = doc.data();
      const bookingDate = booking.createdAt?.toDate();

      // Include all confirmed/completed/refunded bookings created this month
      // Exclude only pending and rejected bookings
      if (
        (booking.status === "completed" || booking.status === "confirmed" || booking.status === "refunded") &&
        bookingDate &&
        bookingDate.getMonth() === currentMonth &&
        bookingDate.getFullYear() === currentYear
      ) {
        thisMonthBookingIds.add(doc.id);
        bookingHostMap.set(doc.id, booking.hostId || booking.host_id);
        bookingTypeMap.set(doc.id, booking.listing?.type || booking.type || "stays");
      }
    });

    // Fetch transactions
    const transactionsRef = collection(db, "transactions");
    const q = query(transactionsRef);
    const querySnapshot = await getDocs(q);

    const breakdown = {
      stays: { revenue: 0, hosts: new Set(), bookings: 0, bookingIds: new Set() },
      experiences: { revenue: 0, hosts: new Set(), bookings: 0, bookingIds: new Set() },
      services: { revenue: 0, hosts: new Set(), bookings: 0, bookingIds: new Set() },
    };

    for (const docSnap of querySnapshot.docs) {
      const transaction = docSnap.data();

      // Only include transactions for bookings created this month
      if (!transaction.bookingId || !thisMonthBookingIds.has(transaction.bookingId)) {
        continue;
      }

      // Get listing type from transaction (preferred) or fallback to booking data
      let listingType = transaction.listingType || bookingTypeMap.get(transaction.bookingId) || "stays";

      if (!breakdown[listingType]) continue;

      // Count service_fee transactions (revenue earned)
      if (transaction.type === "service_fee") {
        // Service fee is stored as negative, convert to positive
        const serviceFee = Math.abs(transaction.amount || 0);
        breakdown[listingType].revenue += serviceFee;

        // Track unique bookings
        if (!breakdown[listingType].bookingIds.has(transaction.bookingId)) {
          breakdown[listingType].bookingIds.add(transaction.bookingId);
          breakdown[listingType].bookings += 1;
        }

        // Track unique hosts from booking data
        const hostId = bookingHostMap.get(transaction.bookingId);
        if (hostId) {
          breakdown[listingType].hosts.add(hostId);
        }
      }
      // Subtract service_fee_refund transactions (revenue lost)
      else if (transaction.type === "service_fee_refund") {
        // Service fee refund is stored as negative, subtract the absolute value
        const refundAmount = Math.abs(transaction.amount || 0);
        breakdown[listingType].revenue -= refundAmount;
      }
    }

    // Convert Set to count and remove bookingIds set
    return {
      stays: {
        revenue: breakdown.stays.revenue,
        hosts: breakdown.stays.hosts.size,
        bookings: breakdown.stays.bookings,
      },
      experiences: {
        revenue: breakdown.experiences.revenue,
        hosts: breakdown.experiences.hosts.size,
        bookings: breakdown.experiences.bookings,
      },
      services: {
        revenue: breakdown.services.revenue,
        hosts: breakdown.services.hosts.size,
        bookings: breakdown.services.bookings,
      },
    };
  } catch (error) {
    console.error("Error getting monthly revenue breakdown:", error);
    return {
      stays: { revenue: 0, hosts: 0, bookings: 0 },
      experiences: { revenue: 0, hosts: 0, bookings: 0 },
      services: { revenue: 0, hosts: 0, bookings: 0 },
    };
  }
}
