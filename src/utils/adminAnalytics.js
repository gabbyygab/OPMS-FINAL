import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { getTotalServiceFeeRevenue } from "./platformSettingsUtils";

/**
 * Admin Analytics Utility
 * Provides comprehensive analytics algorithms for the admin dashboard
 */

// ============================================
// CORE DATA FETCHING FUNCTIONS
// ============================================

/**
 * Fetch all bookings from Firestore
 */
export const getAllBookings = async () => {
  try {
    const bookingsRef = collection(db, "bookings");
    const snapshot = await getDocs(bookingsRef);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return [];
  }
};

/**
 * Fetch all listings from Firestore
 */
export const getAllListings = async () => {
  try {
    const listingsRef = collection(db, "listings");
    const snapshot = await getDocs(listingsRef);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching listings:", error);
    return [];
  }
};

/**
 * Fetch all users from Firestore
 */
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

/**
 * Fetch all wallets from Firestore
 */
export const getAllWallets = async () => {
  try {
    const walletsRef = collection(db, "wallets");
    const snapshot = await getDocs(walletsRef);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching wallets:", error);
    return [];
  }
};

/**
 * Fetch all rewards from Firestore
 */
export const getAllRewards = async () => {
  try {
    const rewardsRef = collection(db, "rewards");
    const snapshot = await getDocs(rewardsRef);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching rewards:", error);
    return [];
  }
};

/**
 * Fetch all reviews from Firestore
 */
export const getAllReviews = async () => {
  try {
    const reviewsRef = collection(db, "reviews");
    const snapshot = await getDocs(reviewsRef);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
};

// ============================================
// ANALYTICS ALGORITHMS
// ============================================

/**
 * Calculate total revenue from listing limit upgrades
 * Reads from transactions collection
 */
export const calculateListingUpgradeRevenue = async () => {
  try {
    const transactionsRef = collection(db, "transactions");
    const querySnapshot = await getDocs(transactionsRef);

    let totalRevenue = 0;

    for (const docSnap of querySnapshot.docs) {
      const transaction = docSnap.data();

      // Only count listing_limit_upgrade transactions
      if (transaction.type !== "listing_limit_upgrade") continue;

      // Listing upgrade transactions are stored as negative (user deduction)
      // Convert to positive for revenue calculation
      const upgradeRevenue = Math.abs(transaction.amount || 0);
      totalRevenue += upgradeRevenue;
    }

    return totalRevenue;
  } catch (error) {
    console.error("Error calculating listing upgrade revenue:", error);
    return 0;
  }
};

/**
 * Calculate total revenue from service fee transactions
 * Reads actual service fees collected from transactions collection
 */
export const calculateTotalRevenue = async () => {
  try {
    const serviceFeeRevenue = await getTotalServiceFeeRevenue();
    const listingUpgradeRevenue = await calculateListingUpgradeRevenue();
    const totalRevenue = serviceFeeRevenue + listingUpgradeRevenue;
    return totalRevenue;
  } catch (error) {
    console.error("Error calculating total revenue:", error);
    return 0;
  }
};

/**
 * Calculate revenue by listing type from transactions
 * Includes both service fees and listing limit upgrades
 */
export const calculateRevenueByType = async () => {
  try {
    const transactionsRef = collection(db, "transactions");
    const querySnapshot = await getDocs(transactionsRef);

    const revenueByType = {
      stays: 0,
      experiences: 0,
      services: 0,
    };

    for (const docSnap of querySnapshot.docs) {
      const transaction = docSnap.data();

      // Handle service_fee transactions
      if (transaction.type === "service_fee") {
        // Extract listing type from description
        const description = transaction.description || "";
        let listingType = null;

        if (description.includes("(stays)")) {
          listingType = "stays";
        } else if (description.includes("(experiences)")) {
          listingType = "experiences";
        } else if (description.includes("(services)")) {
          listingType = "services";
        }

        if (listingType && listingType in revenueByType) {
          const serviceFee = Math.abs(transaction.amount || 0);
          revenueByType[listingType] += serviceFee;
        }
      }

      // Handle listing_limit_upgrade transactions
      if (transaction.type === "listing_limit_upgrade") {
        const listingType = transaction.listingType;

        if (listingType && listingType in revenueByType) {
          const upgradeRevenue = Math.abs(transaction.amount || 0);
          revenueByType[listingType] += upgradeRevenue;
        }
      }
    }

    return revenueByType;
  } catch (error) {
    console.error("Error calculating revenue by type:", error);
    return {
      stays: 0,
      experiences: 0,
      services: 0,
    };
  }
};

/**
 * Get booking statistics with time-based comparison
 */
export const getBookingStats = (bookings) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Convert Firestore timestamps to Date objects
  const recentBookings = bookings.filter((booking) => {
    const bookingDate = booking.createdAt?.toDate
      ? booking.createdAt.toDate()
      : new Date(booking.createdAt);
    return bookingDate >= thirtyDaysAgo;
  });

  const previousPeriodBookings = bookings.filter((booking) => {
    const bookingDate = booking.createdAt?.toDate
      ? booking.createdAt.toDate()
      : new Date(booking.createdAt);
    return bookingDate >= sixtyDaysAgo && bookingDate < thirtyDaysAgo;
  });

  const recentCount = recentBookings.length;
  const previousCount = previousPeriodBookings.length;

  const percentageChange =
    previousCount === 0
      ? recentCount > 0
        ? 100
        : 0
      : ((recentCount - previousCount) / previousCount) * 100;

  return {
    total: bookings.length,
    recent: recentCount,
    previous: previousCount,
    change: percentageChange,
    trend: percentageChange >= 0 ? "up" : "down",
  };
};

/**
 * Get user statistics (hosts vs guests)
 */
export const getUserStats = (users) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Exclude admin users from total count
  const nonAdminUsers = users.filter((user) => user.role !== "admin");
  const hosts = nonAdminUsers.filter((user) => user.role === "host");
  const guests = nonAdminUsers.filter((user) => user.role === "guest");

  const recentHosts = hosts.filter((host) => {
    const createdDate = host.createdAt?.toDate
      ? host.createdAt.toDate()
      : new Date(host.createdAt);
    return createdDate >= thirtyDaysAgo;
  });

  const previousHosts = hosts.filter((host) => {
    const createdDate = host.createdAt?.toDate
      ? host.createdAt.toDate()
      : new Date(host.createdAt);
    return createdDate >= sixtyDaysAgo && createdDate < thirtyDaysAgo;
  });

  const hostChange =
    previousHosts.length === 0
      ? recentHosts.length > 0
        ? 100
        : 0
      : ((recentHosts.length - previousHosts.length) / previousHosts.length) *
        100;

  return {
    totalHosts: hosts.length,
    totalGuests: guests.length,
    totalUsers: nonAdminUsers.length,
    hostChange,
    hostTrend: hostChange >= 0 ? "up" : "down",
  };
};

/**
 * Get listing statistics
 */
export const getListingStats = (listings) => {
  const activeListings = listings.filter(
    (listing) => listing.status === "active" && !listing.isDraft
  );

  const draftListings = listings.filter((listing) => listing.isDraft);
  const inactiveListings = listings.filter(
    (listing) => listing.status === "inactive"
  );

  const byType = {
    stays: listings.filter((l) => l.type === "stays").length,
    experiences: listings.filter((l) => l.type === "experiences").length,
    services: listings.filter((l) => l.type === "services").length,
  };

  // Calculate change (simple version - can be enhanced with time-based data)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const recentActive = activeListings.filter((listing) => {
    const createdDate = listing.created_at?.toDate
      ? listing.created_at.toDate()
      : new Date(listing.created_at);
    return createdDate >= thirtyDaysAgo;
  });

  const previousActive = activeListings.filter((listing) => {
    const createdDate = listing.created_at?.toDate
      ? listing.created_at.toDate()
      : new Date(listing.created_at);
    return createdDate >= sixtyDaysAgo && createdDate < thirtyDaysAgo;
  });

  const change =
    previousActive.length === 0
      ? recentActive.length > 0
        ? 100
        : 0
      : ((recentActive.length - previousActive.length) /
          previousActive.length) *
        100;

  return {
    total: listings.length,
    active: activeListings.length,
    draft: draftListings.length,
    inactive: inactiveListings.length,
    byType,
    change,
    trend: change >= 0 ? "up" : "down",
  };
};

/**
 * Calculate average rating for a listing based on reviews
 */
export const calculateListingRating = (listingId, reviews) => {
  const listingReviews = reviews.filter(
    (review) => review.listingId === listingId
  );

  if (listingReviews.length === 0) return 0;

  const totalRating = listingReviews.reduce(
    (sum, review) => sum + (review.rating || 0),
    0
  );
  return totalRating / listingReviews.length;
};

/**
 * Get top-rated listings with booking counts
 */
export const getTopRatedListings = async (
  listings,
  reviews,
  bookings,
  limitCount = 10
) => {
  // Calculate ratings for each listing
  const listingsWithRatings = listings.map((listing) => {
    const listingReviews = reviews.filter(
      (review) => review.listingId === listing.id
    );
    const averageRating =
      listingReviews.length > 0
        ? listingReviews.reduce(
            (sum, review) => sum + (review.rating || 0),
            0
          ) / listingReviews.length
        : 0;

    const bookingCount = bookings.filter(
      (booking) =>
        booking.listing_id === listing.id &&
        (booking.status === "confirmed" || booking.status === "completed")
    ).length;

    return {
      ...listing,
      rating: averageRating,
      reviewCount: listingReviews.length,
      bookingCount,
    };
  });

  // Sort by rating (descending) and filter out unrated listings
  const topRated = listingsWithRatings
    .filter((listing) => listing.rating > 0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limitCount);

  return topRated;
};

/**
 * Get low-rated listings that need attention
 */
export const getLowRatedListings = async (
  listings,
  reviews,
  bookings,
  threshold = 3.5,
  limitCount = 10
) => {
  const listingsWithRatings = listings.map((listing) => {
    const listingReviews = reviews.filter(
      (review) => review.listingId === listing.id
    );
    const averageRating =
      listingReviews.length > 0
        ? listingReviews.reduce(
            (sum, review) => sum + (review.rating || 0),
            0
          ) / listingReviews.length
        : 0;

    const bookingCount = bookings.filter(
      (booking) =>
        booking.listing_id === listing.id &&
        (booking.status === "confirmed" || booking.status === "completed")
    ).length;

    return {
      ...listing,
      rating: averageRating,
      reviewCount: listingReviews.length,
      bookingCount,
    };
  });

  // Filter by threshold and sort
  const lowRated = listingsWithRatings
    .filter((listing) => listing.rating > 0 && listing.rating <= threshold)
    .sort((a, b) => a.rating - b.rating)
    .slice(0, limitCount);

  return lowRated;
};

/**
 * Get recent bookings with guest names and listing titles from respective collections
 */
export const getRecentBookings = async (
  bookings,
  users,
  listings,
  limitCount = 10
) => {
  const sortedBookings = bookings
    .sort((a, b) => {
      const dateA = a.createdAt?.toDate
        ? a.createdAt.toDate()
        : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate
        ? b.createdAt.toDate()
        : new Date(b.createdAt);
      return dateB - dateA;
    })
    .slice(0, limitCount);

  // Populate guest names and listing titles from respective collections
  return sortedBookings.map((booking) => {
    const guest = users.find((user) => user.id === booking.guest_id);
    const listing = listings.find((l) => l.id === booking.listing_id);

    return {
      ...booking,
      guestName: guest?.fullName || "Unknown Guest",
      listing: {
        title: listing?.title || "Deleted Listing",
        type: listing?.type || booking.type,
        price: listing?.price || 0,
      },
    };
  });
};

/**
 * Get booking status breakdown
 */
export const getBookingStatusBreakdown = (bookings) => {
  const breakdown = {
    pending: 0,
    confirmed: 0,
    completed: 0,
    rejected: 0,
    refund_requested: 0,
    refunded: 0,
  };

  bookings.forEach((booking) => {
    if (booking.status in breakdown) {
      breakdown[booking.status]++;
    }
  });

  return breakdown;
};

/**
 * Calculate total points distributed in the system
 */
export const getPointsStats = (rewards) => {
  const totalPoints = rewards.reduce(
    (sum, reward) => sum + (reward.totalPoints || 0),
    0
  );
  const availablePoints = rewards.reduce(
    (sum, reward) => sum + (reward.availablePoints || 0),
    0
  );
  const redeemedPoints = rewards.reduce(
    (sum, reward) => sum + (reward.redeemedPoints || 0),
    0
  );

  return {
    totalPoints,
    availablePoints,
    redeemedPoints,
    redemptionRate: totalPoints > 0 ? (redeemedPoints / totalPoints) * 100 : 0,
  };
};

/**
 * Get refund statistics
 */
export const getRefundStats = (bookings) => {
  const refundRequested = bookings.filter(
    (b) => b.status === "refund_requested"
  ).length;
  const refunded = bookings.filter((b) => b.status === "refunded").length;
  const totalRefundAmount = bookings
    .filter((b) => b.status === "refunded")
    .reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);

  return {
    requested: refundRequested,
    approved: refunded,
    totalAmount: totalRefundAmount,
  };
};

/**
 * Get host performance data
 */
export const getHostPerformance = async (
  hostId,
  bookings,
  listings,
  reviews
) => {
  const hostListings = listings.filter((l) => l.hostId === hostId);
  const hostBookings = bookings.filter((b) => b.hostId === hostId);
  const confirmedBookings = hostBookings.filter(
    (b) => b.status === "confirmed" || b.status === "completed"
  );

  // Only count earnings from COMPLETED bookings
  const completedBookings = hostBookings.filter(
    (b) => b.status === "completed"
  );

  const totalEarnings = completedBookings.reduce((sum, booking) => {
    return sum + (booking.totalAmount || 0);
  }, 0);

  // Calculate average rating across all host listings
  const hostReviews = reviews.filter((review) =>
    hostListings.some((listing) => listing.id === review.listingId)
  );

  const averageRating =
    hostReviews.length > 0
      ? hostReviews.reduce((sum, review) => sum + (review.rating || 0), 0) /
        hostReviews.length
      : 0;

  return {
    totalListings: hostListings.length,
    totalBookings: hostBookings.length,
    confirmedBookings: confirmedBookings.length,
    totalEarnings,
    averageRating,
    reviewCount: hostReviews.length,
  };
};

/**
 * Get revenue trends over time (monthly) from transactions
 * Includes both service fees and listing limit upgrades
 */
export const getRevenueTrends = async (months = 6) => {
  try {
    const transactionsRef = collection(db, "transactions");
    const querySnapshot = await getDocs(transactionsRef);

    const now = new Date();
    const trends = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonthDate = new Date(
        now.getFullYear(),
        now.getMonth() - i + 1,
        1
      );

      let revenue = 0;
      const bookingIds = new Set();
      let listingUpgradeRevenue = 0;
      let listingUpgradeCount = 0;

      querySnapshot.docs.forEach((docSnap) => {
        const transaction = docSnap.data();

        const transactionDate = transaction.created_at?.toDate
          ? transaction.created_at.toDate()
          : new Date(transaction.created_at);

        if (transactionDate >= monthDate && transactionDate < nextMonthDate) {
          // Count service_fee transactions
          if (transaction.type === "service_fee") {
            revenue += Math.abs(transaction.amount || 0);
            if (transaction.bookingId) {
              bookingIds.add(transaction.bookingId);
            }
          }

          // Count listing_limit_upgrade transactions
          if (transaction.type === "listing_limit_upgrade") {
            const upgradeAmount = Math.abs(transaction.amount || 0);
            revenue += upgradeAmount;
            listingUpgradeRevenue += upgradeAmount;
            listingUpgradeCount++;
          }
        }
      });

      trends.push({
        month: monthDate.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        revenue,
        bookingCount: bookingIds.size,
        listingUpgradeRevenue,
        listingUpgradeCount,
      });
    }

    return trends;
  } catch (error) {
    console.error("Error getting revenue trends:", error);
    return [];
  }
};

/**
 * Get listing upgrade statistics
 */
export const getListingUpgradeStats = async () => {
  try {
    const transactionsRef = collection(db, "transactions");
    const querySnapshot = await getDocs(transactionsRef);

    const stats = {
      totalRevenue: 0,
      totalUpgrades: 0,
      byType: {
        stays: { count: 0, revenue: 0 },
        experiences: { count: 0, revenue: 0 },
        services: { count: 0, revenue: 0 },
      },
    };

    for (const docSnap of querySnapshot.docs) {
      const transaction = docSnap.data();

      if (transaction.type === "listing_limit_upgrade") {
        const amount = Math.abs(transaction.amount || 0);
        const listingType = transaction.listingType;

        stats.totalRevenue += amount;
        stats.totalUpgrades++;

        if (listingType && listingType in stats.byType) {
          stats.byType[listingType].count++;
          stats.byType[listingType].revenue += amount;
        }
      }
    }

    return stats;
  } catch (error) {
    console.error("Error getting listing upgrade stats:", error);
    return {
      totalRevenue: 0,
      totalUpgrades: 0,
      byType: {
        stays: { count: 0, revenue: 0 },
        experiences: { count: 0, revenue: 0 },
        services: { count: 0, revenue: 0 },
      },
    };
  }
};

/**
 * Get comprehensive dashboard data
 */
export const getDashboardData = async () => {
  try {
    // Fetch all data in parallel
    const [bookings, listings, users, reviews, rewards, wallets] =
      await Promise.all([
        getAllBookings(),
        getAllListings(),
        getAllUsers(),
        getAllReviews(),
        getAllRewards(),
        getAllWallets(),
      ]);

    // Calculate all statistics
    const bookingStats = getBookingStats(bookings);
    const userStats = getUserStats(users);
    const listingStats = getListingStats(listings);
    const totalRevenue = await calculateTotalRevenue();
    const revenueByType = await calculateRevenueByType();
    const topRatedListings = await getTopRatedListings(
      listings,
      reviews,
      bookings,
      4
    );
    const lowRatedListings = await getLowRatedListings(
      listings,
      reviews,
      bookings,
      3.5,
      3
    );
    const recentBookings = await getRecentBookings(
      bookings,
      users,
      listings,
      5
    );
    const bookingStatusBreakdown = getBookingStatusBreakdown(bookings);
    const pointsStats = getPointsStats(rewards);
    const refundStats = getRefundStats(bookings);
    const revenueTrends = await getRevenueTrends(6);
    const listingUpgradeStats = await getListingUpgradeStats();
    const serviceFeeRevenue = await getTotalServiceFeeRevenue();
    const listingUpgradeRevenue = await calculateListingUpgradeRevenue();

    return {
      stats: {
        bookings: bookingStats,
        users: userStats,
        listings: listingStats,
        revenue: {
          total: totalRevenue,
          serviceFeeRevenue,
          listingUpgradeRevenue,
          byType: revenueByType,
          trends: revenueTrends,
          listingUpgrades: listingUpgradeStats,
        },
        points: pointsStats,
        refunds: refundStats,
      },
      topRatedListings,
      lowRatedListings,
      recentBookings,
      bookingStatusBreakdown,
      rawData: {
        bookings,
        listings,
        users,
        reviews,
        rewards,
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw error;
  }
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format percentage for display
 */
export const formatPercentage = (value, showSign = true) => {
  const sign = showSign && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
};

/**
 * Format large numbers with K/M suffixes
 */
export const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toLocaleString();
};
