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

    // Fetch all transactions
    const transactionsRef = collection(db, "transactions");
    const q = query(transactionsRef);
    const querySnapshot = await getDocs(q);

    const hostStats = {};
    const bookingCounts = {};

    for (const docSnap of querySnapshot.docs) {
      const transaction = docSnap.data();

      const userId = transaction.user_id;
      if (!userId) continue;

      // Only process transactions for hosts
      if (!hostUserIds.has(userId)) continue;

      // Initialize host stats if not exists
      if (!hostStats[userId]) {
        hostStats[userId] = {
          hostId: userId,
          totalEarnings: 0,
          bookingsCount: 0,
          serviceFeeCollected: 0,
          listingType: transaction.listingType || "stays",
        };
      }

      // Handle different transaction types
      if (transaction.type === "service_fee") {
        // Service fee amount is stored as negative in transactions
        const serviceFee = Math.abs(transaction.amount || 0);
        hostStats[userId].serviceFeeCollected += serviceFee;

        // Track unique bookings using bookingId
        if (transaction.bookingId && !bookingCounts[userId]) {
          bookingCounts[userId] = new Set();
        }
        if (transaction.bookingId) {
          bookingCounts[userId].add(transaction.bookingId);
        }
      } else if (transaction.type === "payment" && transaction.amount > 0) {
        // Payment to host (positive amount) - this is their earnings
        hostStats[userId].totalEarnings += transaction.amount;
      }

      // Update listing type if available
      if (transaction.listingType && !hostStats[userId].listingType) {
        hostStats[userId].listingType = transaction.listingType;
      }
    }

    // Set booking counts from unique bookingIds
    Object.keys(bookingCounts).forEach(hostId => {
      if (hostStats[hostId]) {
        hostStats[hostId].bookingsCount = bookingCounts[hostId].size;
      }
    });

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
 * Get total revenue from all service fee transactions
 * @returns {Promise<number>} Total service fee revenue
 */
export async function getTotalServiceFeeRevenue() {
  try {
    const transactionsRef = collection(db, "transactions");
    const q = query(transactionsRef);
    const querySnapshot = await getDocs(q);

    let totalRevenue = 0;

    for (const docSnap of querySnapshot.docs) {
      const transaction = docSnap.data();

      // Only count service_fee transactions
      if (transaction.type !== "service_fee") continue;

      // Service fee is stored as negative, convert to positive
      const serviceFee = Math.abs(transaction.amount || 0);
      totalRevenue += serviceFee;
    }

    return totalRevenue;
  } catch (error) {
    console.error("Error getting total service fee revenue:", error);
    return 0;
  }
}

/**
 * Get monthly revenue breakdown by listing type from transactions
 * @returns {Promise<Object>} Revenue breakdown
 */
export async function getMonthlyRevenueBreakdown() {
  try {
    const transactionsRef = collection(db, "transactions");
    const q = query(transactionsRef);
    const querySnapshot = await getDocs(q);

    const breakdown = {
      stays: { revenue: 0, hosts: new Set(), bookings: 0, bookingIds: new Set() },
      experiences: { revenue: 0, hosts: new Set(), bookings: 0, bookingIds: new Set() },
      services: { revenue: 0, hosts: new Set(), bookings: 0, bookingIds: new Set() },
    };

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    for (const docSnap of querySnapshot.docs) {
      const transaction = docSnap.data();

      // Only count service_fee transactions
      if (transaction.type !== "service_fee") continue;

      // Check if transaction is from current month
      const transactionDate = transaction.created_at?.toDate();
      if (
        !transactionDate ||
        transactionDate.getMonth() !== currentMonth ||
        transactionDate.getFullYear() !== currentYear
      ) {
        continue;
      }

      // Extract listing type from description (e.g., "Service fee (stays) for booking...")
      const description = transaction.description || "";
      let listingType = "stays"; // default

      if (description.includes("(stays)")) {
        listingType = "stays";
      } else if (description.includes("(experiences)")) {
        listingType = "experiences";
      } else if (description.includes("(services)")) {
        listingType = "services";
      }

      if (!breakdown[listingType]) continue;

      // Service fee is stored as negative, convert to positive
      const serviceFee = Math.abs(transaction.amount || 0);

      breakdown[listingType].revenue += serviceFee;

      // Track unique bookings
      if (transaction.bookingId && !breakdown[listingType].bookingIds.has(transaction.bookingId)) {
        breakdown[listingType].bookingIds.add(transaction.bookingId);
        breakdown[listingType].bookings += 1;
      }

      // Track unique hosts
      if (transaction.user_id) {
        breakdown[listingType].hosts.add(transaction.user_id);
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
