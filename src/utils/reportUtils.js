import {
  getAllBookings,
  getAllListings,
  getAllUsers,
  getAllReviews,
  getAllRewards,
  calculateTotalRevenue,
  calculateRevenueByType,
  getBookingStatusBreakdown,
  getHostPerformance,
  formatCurrency,
} from "./adminAnalytics";
import { db } from "../firebase/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

/**
 * Report Generation Utility
 * Provides data filtering and processing for admin reports
 */

// ============================================
// DATE RANGE FILTERS
// ============================================

/**
 * Get date range based on selection
 */
export const getDateRange = (rangeType) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (rangeType) {
    case "today":
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      };

    case "yesterday":
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return {
        start: yesterday,
        end: today,
      };

    case "last7days":
      return {
        start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        end: now,
      };

    case "last30days":
      return {
        start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
        end: now,
      };

    case "last3months":
      return {
        start: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000),
        end: now,
      };

    case "last6months":
      return {
        start: new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000),
        end: now,
      };

    case "lastyear":
      return {
        start: new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000),
        end: now,
      };

    default:
      return {
        start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
        end: now,
      };
  }
};

/**
 * Filter data by date range
 */
export const filterByDateRange = (data, dateRange, dateField = "createdAt") => {
  return data.filter((item) => {
    const itemDate = item[dateField]?.toDate
      ? item[dateField].toDate()
      : new Date(item[dateField]);
    return itemDate >= dateRange.start && itemDate <= dateRange.end;
  });
};

// ============================================
// FINANCIAL REPORT DATA
// ============================================

/**
 * Generate financial report data using actual transactions
 */
export const generateFinancialReportData = async (dateRange) => {
  try {
    // Get all transactions from Firestore
    const transactionsRef = collection(db, "transactions");
    const transactionsSnapshot = await getDocs(transactionsRef);

    let serviceFeeRevenue = 0;
    let refundedServiceFees = 0;
    let totalTransactions = 0;

    const revenueByType = {
      stays: 0,
      experiences: 0,
      services: 0,
    };

    // Filter transactions by date range
    transactionsSnapshot.docs.forEach((doc) => {
      const transaction = doc.data();

      // Convert Firestore timestamp to Date
      const transactionDate = transaction.created_at?.toDate
        ? transaction.created_at.toDate()
        : new Date(transaction.created_at);

      // Check if transaction is within date range
      if (transactionDate >= dateRange.start && transactionDate <= dateRange.end) {
        // Service fee transactions (revenue)
        if (transaction.type === "service_fee") {
          const amount = Math.abs(transaction.amount || 0);
          serviceFeeRevenue += amount;
          totalTransactions++;

          // Extract listing type from description
          const description = transaction.description || "";
          if (description.includes("(stays)")) {
            revenueByType.stays += amount;
          } else if (description.includes("(experiences)")) {
            revenueByType.experiences += amount;
          } else if (description.includes("(services)")) {
            revenueByType.services += amount;
          }
        }

        // Refund transactions (negative revenue)
        if (transaction.type === "refund" && transaction.description?.includes("service fee")) {
          refundedServiceFees += Math.abs(transaction.amount || 0);
        }
      }
    });

    // Calculate total refund amount from bookings
    const bookings = await getAllBookings();
    const refundedBookings = filterByDateRange(bookings, dateRange).filter(
      (b) => b.status === "refunded"
    );
    const totalRefundAmount = refundedBookings.reduce(
      (sum, b) => sum + (b.totalAmount || 0),
      0
    );

    // Net revenue after refunds
    const netRevenue = serviceFeeRevenue - refundedServiceFees;

    return {
      totalRevenue: netRevenue,
      grossRevenue: serviceFeeRevenue,
      serviceFees: serviceFeeRevenue,
      refunds: totalRefundAmount,
      refundedFees: refundedServiceFees,
      transactions: totalTransactions,
      revenueByType,
      dateRange,
    };
  } catch (error) {
    console.error("Error generating financial report data:", error);
    // Return empty data on error
    return {
      totalRevenue: 0,
      grossRevenue: 0,
      serviceFees: 0,
      refunds: 0,
      refundedFees: 0,
      transactions: 0,
      revenueByType: {
        stays: 0,
        experiences: 0,
        services: 0,
      },
      dateRange,
    };
  }
};

// ============================================
// BOOKINGS REPORT DATA
// ============================================

/**
 * Generate bookings report data
 */
export const generateBookingsReportData = async (dateRange) => {
  const bookings = await getAllBookings();
  const filteredBookings = filterByDateRange(bookings, dateRange);

  const statusBreakdown = getBookingStatusBreakdown(filteredBookings);

  const totalBookings = filteredBookings.length;
  const confirmedBookings = statusBreakdown.confirmed + statusBreakdown.completed;
  const cancelledBookings = statusBreakdown.rejected;
  const refundedBookings = statusBreakdown.refunded;
  const pendingBookings = statusBreakdown.pending;

  const completionRate =
    totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0;

  // Bookings by type
  const bookingsByType = {
    stays: filteredBookings.filter((b) => b.type === "stays").length,
    experiences: filteredBookings.filter((b) => b.type === "experiences")
      .length,
    services: filteredBookings.filter((b) => b.type === "services").length,
  };

  // Average booking value
  const totalBookingValue = filteredBookings.reduce(
    (sum, b) => sum + (b.totalAmount || 0),
    0
  );
  const averageBookingValue =
    totalBookings > 0 ? totalBookingValue / totalBookings : 0;

  return {
    totalBookings,
    confirmedBookings,
    cancelledBookings,
    refundedBookings,
    pendingBookings,
    completionRate,
    bookingsByType,
    averageBookingValue,
    statusBreakdown,
    dateRange,
  };
};

// ============================================
// HOST PERFORMANCE REPORT DATA
// ============================================

/**
 * Generate host performance report data
 */
export const generateHostPerformanceReportData = async (dateRange) => {
  const users = await getAllUsers();
  const bookings = await getAllBookings();
  const listings = await getAllListings();
  const reviews = await getAllReviews();

  const hosts = users.filter((u) => u.role === "host");
  const filteredBookings = filterByDateRange(bookings, dateRange);

  // Calculate performance for each host
  const hostPerformanceData = await Promise.all(
    hosts.map(async (host) => {
      const hostBookings = filteredBookings.filter((b) => b.hostId === host.id);
      const confirmedBookings = hostBookings.filter(
        (b) => b.status === "confirmed" || b.status === "completed"
      );

      const totalEarnings = confirmedBookings.reduce(
        (sum, b) => sum + (b.totalAmount || 0),
        0
      );

      const hostListings = listings.filter((l) => l.hostId === host.id);
      const activeListings = hostListings.filter(
        (l) => l.status === "active" && !l.isDraft
      );

      // Get reviews for host's listings
      const hostReviews = reviews.filter((review) =>
        hostListings.some((listing) => listing.id === review.listingId)
      );

      const averageRating =
        hostReviews.length > 0
          ? hostReviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
            hostReviews.length
          : 0;

      return {
        hostId: host.id,
        hostName: host.fullName || "Unknown Host",
        totalListings: activeListings.length,
        totalBookings: hostBookings.length,
        confirmedBookings: confirmedBookings.length,
        totalEarnings,
        averageRating,
        reviewCount: hostReviews.length,
      };
    })
  );

  // Sort by total earnings
  const topHosts = hostPerformanceData
    .sort((a, b) => b.totalEarnings - a.totalEarnings)
    .slice(0, 10);

  const totalActiveHosts = hostPerformanceData.filter(
    (h) => h.totalBookings > 0
  ).length;

  const totalHostEarnings = hostPerformanceData.reduce(
    (sum, h) => sum + h.totalEarnings,
    0
  );

  const averageHostEarnings =
    totalActiveHosts > 0 ? totalHostEarnings / totalActiveHosts : 0;

  const totalHostReviews = hostPerformanceData.reduce(
    (sum, h) => sum + h.reviewCount,
    0
  );
  const averageHostRating =
    totalHostReviews > 0
      ? hostPerformanceData.reduce(
          (sum, h) => sum + h.averageRating * h.reviewCount,
          0
        ) / totalHostReviews
      : 0;

  return {
    totalHosts: hosts.length,
    activeHosts: totalActiveHosts,
    totalEarnings: totalHostEarnings,
    averageEarnings: averageHostEarnings,
    averageRating: averageHostRating,
    topHosts,
    dateRange,
  };
};

// ============================================
// LISTING ANALYTICS REPORT DATA
// ============================================

/**
 * Generate listing analytics report data
 */
export const generateListingAnalyticsReportData = async (dateRange) => {
  const listings = await getAllListings();
  const bookings = await getAllBookings();
  const reviews = await getAllReviews();

  const filteredListings = filterByDateRange(
    listings,
    dateRange,
    "created_at"
  );
  const filteredBookings = filterByDateRange(bookings, dateRange);

  const activeListings = listings.filter(
    (l) => l.status === "active" && !l.isDraft
  );

  const listingsByType = {
    stays: listings.filter((l) => l.type === "stays").length,
    experiences: listings.filter((l) => l.type === "experiences").length,
    services: listings.filter((l) => l.type === "services").length,
  };

  // Calculate conversion rate (bookings per listing)
  const totalBookings = filteredBookings.length;
  const conversionRate =
    activeListings.length > 0
      ? (totalBookings / activeListings.length) * 100
      : 0;

  // Top performing listings
  const listingsWithBookings = activeListings.map((listing) => {
    const listingBookings = bookings.filter(
      (b) =>
        b.listing_id === listing.id &&
        (b.status === "confirmed" || b.status === "completed")
    );

    const listingReviews = reviews.filter((r) => r.listingId === listing.id);
    const averageRating =
      listingReviews.length > 0
        ? listingReviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
          listingReviews.length
        : 0;

    const totalRevenue = listingBookings.reduce(
      (sum, b) => sum + (b.totalAmount || 0),
      0
    );

    return {
      id: listing.id,
      title: listing.title,
      type: listing.type,
      bookingCount: listingBookings.length,
      totalRevenue,
      averageRating,
      reviewCount: listingReviews.length,
    };
  });

  const topListings = listingsWithBookings
    .sort((a, b) => b.bookingCount - a.bookingCount)
    .slice(0, 10);

  return {
    totalListings: listings.length,
    activeListings: activeListings.length,
    newListings: filteredListings.length,
    listingsByType,
    conversionRate,
    topListings,
    dateRange,
  };
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format date range for display
 */
export const formatDateRange = (dateRange) => {
  const options = { year: "numeric", month: "long", day: "numeric" };
  const start = dateRange.start.toLocaleDateString("en-US", options);
  const end = dateRange.end.toLocaleDateString("en-US", options);
  return `${start} - ${end}`;
};

/**
 * Get report type label
 */
export const getReportTypeLabel = (reportType) => {
  const labels = {
    financial: "Financial Report",
    bookings: "Bookings Report",
    hosts: "Host Performance Report",
    listings: "Listing Analytics Report",
  };
  return labels[reportType] || "Report";
};
