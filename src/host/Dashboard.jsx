import { useEffect, useState } from "react";
import {
  Home,
  Calendar,
  Briefcase,
  DollarSign,
  TrendingUp,
  Users,
  Star,
  MessageSquare,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

import { sendOtpToUser } from "../utils/sendOtpToUser";
import LoadingSpinner from "../loading/Loading";
import VerificationBanner from "../components/Verification";
import { useAuth } from "../context/AuthContext";
export default function HostDashboard({ isVerified, user }) {
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [isLoading, setLoading] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [stats, setStats] = useState({
    totalEarnings: 0,
    earningsChange: 0,
    totalBookings: 0,
    bookingsChange: 0,
    activeListings: 0,
    listingsChange: 0,
    avgRating: 0,
    ratingChange: 0,
  });
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [todayBookings, setTodayBookings] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [bestListings, setBestListings] = useState([]);
  const [needsAttentionListings, setNeedsAttentionListings] = useState([]);
  const [revenueTrendData, setRevenueTrendData] = useState([]);
  const [bookingStatusData, setBookingStatusData] = useState([]);
  const [revenueByTypeData, setRevenueByTypeData] = useState([]);
  const [completedBookingCount, setCompletedBookingCount] = useState(0);
  const [confirmedBookingCount, setConfirmedBookingCount] = useState(0);
  const { userData } = useAuth();
  const navigate = useNavigate();
  console.log(isVerified);

  // Colors for charts
  const COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];
  const pieColors = {
    confirmed: "#3b82f6",
    pending: "#f59e0b",
    completed: "#10b981",
    rejected: "#ef4444",
    refund_requested: "#f97316",
    refunded: "#a855f7",
  };

  const handleVerification = async () => {
    try {
      setLoading(true);
      await sendOtpToUser(user);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      navigate("/account-verification");
    }
  };

  // Track mouse position for interactive gradient background
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        if (!userData?.id) return;

        // Get all listings for this host (exclude drafts)
        const listingsRef = collection(db, "listings");
        const listingsQuery = query(
          listingsRef,
          where("hostId", "==", userData.id),
          where("isDraft", "==", false)
        );
        const listingsSnap = await getDocs(listingsQuery);
        const listings = listingsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Get all bookings for host's listings
        const bookingsRef = collection(db, "bookings");
        const listingIds = listings.map((l) => l.id);

        let allBookings = [];
        if (listingIds.length > 0) {
          // Firebase IN operator supports max 30 values, so split into chunks
          const chunkSize = 30;
          for (let i = 0; i < listingIds.length; i += chunkSize) {
            const chunk = listingIds.slice(i, i + chunkSize);
            const bookingsQuery = query(
              bookingsRef,
              where("listing_id", "in", chunk)
            );
            const bookingsSnap = await getDocs(bookingsQuery);
            allBookings = [
              ...allBookings,
              ...bookingsSnap.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              })),
            ];
          }
        }

        // Helper: normalize to start-of-day for date-only comparison
        const toStartOfDay = (d) => {
          const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          return dt;
        };
        const today = toStartOfDay(new Date());

        // Helper: safely extract Date from mixed booking fields
        const getDateFrom = (value) => {
          try {
            if (!value) return null;
            if (typeof value?.toDate === "function") return value.toDate();
            const parsed = new Date(value);
            return isNaN(parsed.getTime()) ? null : parsed;
          } catch (_) {
            return null;
          }
        };

        // Partition bookings into today's and upcoming (future-only)
        const bookingsWithDates = allBookings.map((b) => {
          const start = getDateFrom(b.checkIn) || getDateFrom(b.selectedDate) || null;
          const end = getDateFrom(b.checkOut) || start;
          return { ...b, __start: start, __end: end };
        });

        const isToday = (b) => {
          if (!b.__start) return false;
          const start = toStartOfDay(b.__start);
          const end = b.__end ? toStartOfDay(b.__end) : start;
          return start <= today && today <= end;
        };

        const isUpcoming = (b) => {
          if (!b.__start) return false;
          const start = toStartOfDay(b.__start);
          return start > today; // strictly after today
        };

        const todaysConfirmed = bookingsWithDates.filter(
          (b) => b.status === "confirmed" && isToday(b)
        );
        const upcomingConfirmed = bookingsWithDates
          .filter((b) => b.status === "confirmed" && isUpcoming(b))
          .sort((a, b) => a.__start - b.__start);

        // Get conversations for this host
        const conversationsRef = collection(db, "conversations");
        const conversationsQuery = query(conversationsRef);
        const conversationsSnap = await getDocs(conversationsQuery);
        const userConversations = conversationsSnap.docs
          .filter((doc) => doc.data().participants?.includes(userData.id))
          .map((doc) => ({ id: doc.id, ...doc.data() }));

        // Get recent messages
        const messagesWithDetails = await Promise.all(
          userConversations.map(async (conv) => {
            const guestId = conv.participants?.find((id) => id !== userData.id);
            const guestRef = doc(db, "users", guestId);
            const guestSnap = await getDoc(guestRef);
            const guestData = guestSnap.data();

            return {
              id: conv.id,
              guest: guestData?.fullName || "Unknown",
              message: typeof conv.lastMessage === "string"
                ? conv.lastMessage
                : (conv.lastMessage?.text || "No messages"),
              time: conv.updatedAt
                ? new Date(conv.updatedAt.toDate()).toLocaleString()
                : "Just now",
              unread: false,
            };
          })
        );

        // Fetch all completed bookings for this host to calculate earnings
        // Only completed bookings should count towards earnings
        const completedBookings = bookingsWithDates.filter(
          (b) => b.status === "completed"
        );

        // Calculate total earnings from completed bookings only
        const totalEarnings = completedBookings.reduce((sum, booking) => {
          return sum + (Number(booking.totalAmount) || 0);
        }, 0);

        // Get all reviews for this host's listings
        const reviewsRef = collection(db, "reviews");
        const reviewsQuery = query(reviewsRef, where("hostId", "==", userData.id));
        const reviewsSnap = await getDocs(reviewsQuery);
        const reviews = reviewsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Calculate average rating per listing from reviews
        const listingRatings = {};
        const listingReviewCounts = {};

        reviews.forEach((review) => {
          const listingId = review.listingId;
          if (!listingRatings[listingId]) {
            listingRatings[listingId] = 0;
            listingReviewCounts[listingId] = 0;
          }
          listingRatings[listingId] += review.rating || 0;
          listingReviewCounts[listingId] += 1;
        });

        // Calculate average ratings per listing
        Object.keys(listingRatings).forEach((listingId) => {
          listingRatings[listingId] = listingRatings[listingId] / listingReviewCounts[listingId];
        });

        // Calculate overall average rating from all reviews (for dashboard stat)
        const avgRating = reviews.length > 0
          ? Math.round(
              (reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length) * 10
            ) / 10
          : 0;

        // Calculate stats
        const confirmedBookings = bookingsWithDates.filter(
          (b) => b.status === "confirmed"
        );

        // Map helper for booking display row
        const mapBookingDisplay = async (booking) => {
            const listingRef = doc(db, "listings", booking.listing_id);
            const listingSnap = await getDoc(listingRef);
            const listingData = listingSnap.data();

            const guestRef = doc(db, "users", booking.guest_id);
            const guestSnap = await getDoc(guestRef);
            const guestData = guestSnap.data();

            const getTypeLabel = (type) => {
              if (type === "stays") return "Stay";
              if (type === "experiences") return "Experience";
              if (type === "services") return "Service";
              return "Booking";
            };

            return {
              id: booking.id,
              guest: guestData?.fullName || "Unknown",
              property: listingData?.title || "Unknown",
              type: getTypeLabel(listingData?.type),
              checkIn: booking.checkIn
                ? new Date(booking.checkIn.toDate()).toLocaleDateString()
                : booking.selectedDate || "N/A",
              checkOut: booking.checkOut
                ? new Date(booking.checkOut.toDate()).toLocaleDateString()
                : booking.selectedDate || "N/A",
              amount: Number(booking.totalAmount || 0),
              status: booking.status,
            };
          };

        // Today's Bookings (up to 5)
        const todayBookingsData = await Promise.all(
          todaysConfirmed.slice(0, 5).map(mapBookingDisplay)
        );

        // Upcoming Bookings (next 5)
        const upcomingBookingsData = await Promise.all(
          upcomingConfirmed.slice(0, 5).map(mapBookingDisplay)
        );

        // Prepare listing data with calculated ratings
        const getTypeLabel = (type) => {
          if (type === "stays") return "Stay";
          if (type === "experiences") return "Experience";
          if (type === "services") return "Service";
          return "Listing";
        };

        const listingsWithRatings = listings.map((listing) => {
          const listingBookings = allBookings.filter(
            (b) => b.listing_id === listing.id && b.status === "confirmed"
          );
          // Revenue should only count completed bookings
          const completedListingBookings = allBookings.filter(
            (b) => b.listing_id === listing.id && b.status === "completed"
          );
          const revenue = completedListingBookings.reduce(
            (sum, b) => sum + (b.totalAmount || 0),
            0
          );
          const avgRating = listingRatings[listing.id] || 0;
          const reviewCount = listingReviewCounts[listing.id] || 0;

          return {
            id: listing.id,
            name: listing.title,
            type: getTypeLabel(listing.type),
            views: listing.views || 0,
            bookings: listingBookings.length,
            revenue: revenue,
            rating: avgRating,
            reviewCount: reviewCount,
          };
        });

        // Filter Best Listings (rating >= 4) and sort by rating
        const bestListingsData = listingsWithRatings
          .filter((listing) => listing.rating >= 4 && listing.reviewCount > 0)
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 5);

        // Filter Listings That Need Attention (rating <= 2) and sort by rating ascending
        const needsAttentionData = listingsWithRatings
          .filter((listing) => listing.rating > 0 && listing.rating <= 2 && listing.reviewCount > 0)
          .sort((a, b) => a.rating - b.rating)
          .slice(0, 5);

        // Calculate Revenue Trend Data (last 7 days)
        const currentDate = new Date();
        const revenueTrend = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date(currentDate);
          date.setDate(date.getDate() - i);
          const dateStr = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });

          // Filter completed bookings for this day
          const dayBookings = completedBookings.filter((b) => {
            const bookingDate = b.createdAt?.toDate
              ? b.createdAt.toDate()
              : new Date(b.createdAt);
            return (
              bookingDate.toLocaleDateString() === date.toLocaleDateString()
            );
          });

          const dayRevenue = dayBookings.reduce(
            (sum, b) => sum + (Number(b.totalAmount) || 0),
            0
          );

          revenueTrend.push({
            date: dateStr,
            revenue: dayRevenue,
            bookings: dayBookings.length,
          });
        }
        setRevenueTrendData(revenueTrend);

        // Calculate Booking Status Breakdown
        const statusCount = {
          confirmed: confirmedBookings.length,
          completed: completedBookings.length,
          pending: bookingsWithDates.filter(
            (b) => b.status === "pending"
          ).length,
          rejected: bookingsWithDates.filter(
            (b) => b.status === "rejected"
          ).length,
          refund_requested: bookingsWithDates.filter(
            (b) => b.status === "refund_requested"
          ).length,
          refunded: bookingsWithDates.filter(
            (b) => b.status === "refunded"
          ).length,
        };

        const bookingStatusBreakdown = Object.entries(statusCount)
          .filter(([_, count]) => count > 0)
          .map(([status, count]) => ({
            name: status.charAt(0).toUpperCase() + status.slice(1).replace("_", " "),
            value: count,
            status: status,
          }));
        setBookingStatusData(bookingStatusBreakdown);

        // Calculate Revenue by Listing Type
        const revenueByType = {
          stays: 0,
          experiences: 0,
          services: 0,
        };

        completedBookings.forEach((booking) => {
          const listingType = booking.listing?.type || booking.type || "stays";
          if (listingType in revenueByType) {
            revenueByType[listingType] += Number(booking.totalAmount) || 0;
          }
        });

        const revenueTypeData = Object.entries(revenueByType)
          .filter(([_, revenue]) => revenue > 0)
          .map(([type, revenue]) => ({
            name: type.charAt(0).toUpperCase() + type.slice(1),
            value: revenue,
            type: type,
          }));
        setRevenueByTypeData(revenueTypeData);

        setStats({
          totalEarnings: Number(totalEarnings) || 0,
          earningsChange: 12.5,
          totalBookings: Number(allBookings.length) || 0,
          bookingsChange: 8.3,
          activeListings: Number(listings.length) || 0,
          listingsChange: 2,
          avgRating: Number(avgRating) || 0,
          ratingChange: 0.2,
        });

        setTodayBookings(todayBookingsData);
        setUpcomingBookings(upcomingBookingsData);
        setRecentMessages(messagesWithDetails);
        setBestListings(bestListingsData);
        setNeedsAttentionListings(needsAttentionData);
        setCompletedBookingCount(completedBookings.length);
        setConfirmedBookingCount(confirmedBookings.length);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userData]);

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "Stay":
        return <Home className="w-4 h-4" />;
      case "Experience":
        return <Calendar className="w-4 h-4" />;
      case "Service":
        return <Briefcase className="w-4 h-4" />;
      default:
        return <Home className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 pb-12 overflow-hidden">
      {/* Interactive Mouse-Following Gradient Background */}
      <div
        className="absolute inset-0 transition-all duration-100 ease-out"
        style={{
          background: `radial-gradient(
            circle at ${mousePosition.x}% ${mousePosition.y}%,
            rgba(99, 102, 241, 0.15) 0%,
            rgba(168, 85, 247, 0.10) 25%,
            rgba(59, 130, 246, 0.05) 50%,
            rgba(15, 23, 42, 0) 100%
          ),
          linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)`,
        }}
      ></div>

      {/* Static gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-slate-900/30"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-20 sm:pt-24 md:pt-28 lg:pt-32">
        {/* Verification Banner */}
        {!isVerified && (
          <div className="mb-4 sm:mb-6 animate-fadeIn">
            <VerificationBanner handleVerification={handleVerification} />
          </div>
        )}

        {/* Header */}
        <div className="mb-6 sm:mb-8 md:mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-3 sm:mb-4 tracking-tight">
            Dashboard
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl">
            Welcome back! Here's what's happening with your listings.
          </p>
        </div>

        {/* Period Selector */}
        <div className="mb-6 sm:mb-8">
          <p className="text-xs sm:text-sm font-medium text-slate-300 mb-2 sm:mb-3">Time Period</p>
          <div className="flex gap-2 flex-wrap">
            {["today", "week", "month", "year"].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  selectedPeriod === period
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                    : "bg-slate-800/50 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 sm:mb-8 lg:mb-10">
          {/* Total Earnings */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700 p-5 lg:p-6 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-slate-600 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <span
                className={`flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${
                  stats.earningsChange >= 0
                    ? "text-green-300 bg-green-500/20"
                    : "text-red-300 bg-red-500/20"
                }`}
              >
                {stats.earningsChange >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 mr-1" />
                )}
                {Math.abs(stats.earningsChange)}%
              </span>
            </div>
            <h3 className="text-3xl lg:text-4xl font-bold text-white mb-2">
              ₱{Number(stats.totalEarnings || 0).toLocaleString()}
            </h3>
            <p className="text-slate-400 text-sm font-medium">Total Earnings</p>
          </div>

          {/* Total Bookings */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700 p-5 lg:p-6 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-slate-600 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
              <span
                className={`flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${
                  stats.bookingsChange >= 0
                    ? "text-green-300 bg-green-500/20"
                    : "text-red-300 bg-red-500/20"
                }`}
              >
                {stats.bookingsChange >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 mr-1" />
                )}
                {Math.abs(stats.bookingsChange)}%
              </span>
            </div>
            <h3 className="text-3xl lg:text-4xl font-bold text-white mb-2">
              {Number(stats.totalBookings || 0)}
            </h3>
            <p className="text-slate-400 text-sm font-medium">Total Bookings</p>
          </div>

          {/* Active Listings */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700 p-5 lg:p-6 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-slate-600 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Home className="w-6 h-6 text-purple-400" />
              </div>
              <span
                className={`flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${
                  stats.listingsChange >= 0
                    ? "text-green-300 bg-green-500/20"
                    : "text-red-300 bg-red-500/20"
                }`}
              >
                {stats.listingsChange >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 mr-1" />
                )}
                {Math.abs(stats.listingsChange)}
              </span>
            </div>
            <h3 className="text-3xl lg:text-4xl font-bold text-white mb-2">
              {Number(stats.activeListings || 0)}
            </h3>
            <p className="text-slate-400 text-sm font-medium">Active Listings</p>
          </div>

          {/* Average Rating */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700 p-5 lg:p-6 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-slate-600 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-400" />
              </div>
              <span
                className={`flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${
                  stats.ratingChange >= 0
                    ? "text-green-300 bg-green-500/20"
                    : "text-red-300 bg-red-500/20"
                }`}
              >
                {stats.ratingChange >= 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {Math.abs(stats.ratingChange)}
              </span>
            </div>
            <h3 className="text-3xl lg:text-4xl font-bold text-white mb-2">
              {Number.isFinite(Number(stats.avgRating))
                ? Number(stats.avgRating).toFixed(1)
                : "0.0"}
            </h3>
            <p className="text-slate-400 text-sm font-medium">Average Rating</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mt-6 sm:mt-8 lg:mt-10">
          {/* Today's Bookings */}
          <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-slate-700 p-3 sm:p-4 lg:p-6 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-slate-600 transition-all duration-300 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-3">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white tracking-tight">Today's Bookings</h2>
              <span className="text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/50 w-fit">
                {todayBookings.length} today
              </span>
            </div>

            {todayBookings.length === 0 ? (
              <div className="text-xs sm:text-sm text-slate-400">No bookings today.</div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {todayBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600 rounded-lg transition"
                  >
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 border border-blue-500/50 rounded-full flex items-center justify-center text-blue-400 flex-shrink-0">
                        {getTypeIcon(booking.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base text-white truncate">
                          {booking.property}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-300 truncate">{booking.guest}</p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                          <span className="text-[10px] sm:text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span className="truncate">
                              {booking.checkIn} {booking.checkOut && booking.checkOut !== booking.checkIn ? `- ${booking.checkOut}` : ""}
                            </span>
                          </span>
                          <span
                            className={`text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-full ${getStatusColor(
                              booking.status
                            )}`}
                          >
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right pl-11 sm:pl-0">
                      <p className="font-bold text-sm sm:text-base text-white">
                        ₱{Number(booking.amount || 0).toLocaleString()}
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-400">{booking.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Messages */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-slate-700 p-3 sm:p-4 lg:p-6 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-slate-600 transition-all duration-300 animate-fadeIn" style={{animationDelay: '100ms'}}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-3">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white tracking-tight">Messages</h2>
              <a
                href="/host/messages"
                className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg hover:bg-blue-500/20 transition w-fit"
              >
                View All
              </a>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {recentMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 sm:p-4 rounded-lg transition cursor-pointer ${
                    message.unread ? "bg-blue-500/20 border border-blue-500/50" : "bg-slate-700/30 border border-slate-600"
                  }`}
                >
                  <div className="flex items-start justify-between mb-1 sm:mb-2">
                    <h3 className="font-semibold text-sm sm:text-base text-white truncate pr-2">
                      {message.guest}
                    </h3>
                    {message.unread && (
                      <span className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0 mt-1"></span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 mb-1 sm:mb-2 line-clamp-2">
                    {message.message}
                  </p>
                  <span className="text-[10px] sm:text-xs text-slate-400">{message.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming - full width on desktop */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:gap-6 mt-6 sm:mt-8 lg:mt-10">
          {/* Upcoming Bookings */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-slate-700 p-3 sm:p-4 lg:p-6 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-slate-600 transition-all duration-300 animate-fadeIn" style={{animationDelay: '200ms'}}>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 sm:mb-6 gap-3">
              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white">
                  Upcoming Bookings
                </h2>
                <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1 sm:mt-2">Next confirmed reservations in chronological order</p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-medium px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-700/50 border border-slate-600 text-slate-300">
                  {upcomingBookings.length} upcoming
                </span>
                <a
                  href="/host/my-bookings"
                  className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm font-medium"
                >
                  View All
                </a>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 lg:p-5 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600 rounded-lg sm:rounded-xl transition shadow-sm hover:shadow-md"
                >
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 border border-blue-500/50 rounded-full flex items-center justify-center text-blue-400 flex-shrink-0">
                      {getTypeIcon(booking.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm sm:text-base truncate">
                        {booking.property}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 truncate">{booking.guest}</p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                        <span className="text-[10px] sm:text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                          <span className="truncate">
                            {booking.checkIn}
                            {booking.checkOut && booking.checkOut !== booking.checkIn ? (
                              <span className="mx-1">–</span>
                            ) : null}
                            {booking.checkOut && booking.checkOut !== booking.checkIn ? booking.checkOut : null}
                          </span>
                        </span>
                        <span
                          className={`text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right pl-13 sm:pl-0">
                    <p className="font-bold text-white text-sm sm:text-base">
                      ₱{Number(booking.amount || 0).toLocaleString()}
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-400">{booking.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 sm:mt-8 lg:mt-10">
          {/* Revenue Trend Chart */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-slate-700 p-3 sm:p-4 lg:p-6 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-slate-600 transition-all duration-300 animate-fadeIn" style={{animationDelay: '250ms'}}>
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-2xl font-bold text-white mb-4 sm:mb-6">
              Revenue Trend (Last 7 Days)
            </h2>
            {revenueTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: "12px" }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#e2e8f0" }}
                    formatter={(value) => `₱${value.toLocaleString()}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ fill: "#6366f1", r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-80 text-slate-400">
                No revenue data available
              </div>
            )}
          </div>

          {/* Booking Status Pie Chart */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-slate-700 p-3 sm:p-4 lg:p-6 hover:shadow-xl hover:shadow-blue-500/10 hover:border-slate-600 transition-all duration-300 animate-fadeIn" style={{animationDelay: '300ms'}}>
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-2xl font-bold text-white mb-4 sm:mb-6">
              Booking Status Breakdown
            </h2>
            {bookingStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={bookingStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {bookingStatusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={pieColors[entry.status] || COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#e2e8f0" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-80 text-slate-400">
                No booking data available
              </div>
            )}
          </div>

          {/* Revenue by Listing Type */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-slate-700 p-3 sm:p-4 lg:p-6 hover:shadow-xl hover:shadow-emerald-500/10 hover:border-slate-600 transition-all duration-300 animate-fadeIn" style={{animationDelay: '350ms'}}>
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-2xl font-bold text-white mb-4 sm:mb-6">
              Revenue by Listing Type
            </h2>
            {revenueByTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueByTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: "12px" }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#e2e8f0" }}
                    formatter={(value) => `₱${value.toLocaleString()}`}
                  />
                  <Bar dataKey="value" fill="#10b981" name="Revenue" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-80 text-slate-400">
                No revenue data available
              </div>
            )}
          </div>

          {/* Summary Stats Card */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-slate-700 p-3 sm:p-4 lg:p-6 hover:shadow-xl hover:shadow-purple-500/10 hover:border-slate-600 transition-all duration-300 animate-fadeIn" style={{animationDelay: '400ms'}}>
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-2xl font-bold text-white mb-4 sm:mb-6">
              Analytics Summary
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <span className="text-slate-300">Total Completed Bookings</span>
                <span className="text-xl font-bold text-emerald-400">
                  {completedBookingCount}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <span className="text-slate-300">Total Confirmed Bookings</span>
                <span className="text-xl font-bold text-blue-400">
                  {confirmedBookingCount}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <span className="text-slate-300">Average Revenue per Booking</span>
                <span className="text-xl font-bold text-indigo-400">
                  ₱{completedBookingCount > 0 ? Math.round(stats.totalEarnings / completedBookingCount).toLocaleString() : 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <span className="text-slate-300">Listing Types with Revenue</span>
                <span className="text-xl font-bold text-purple-400">
                  {revenueByTypeData.length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Best Listings */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-slate-700 p-3 sm:p-4 lg:p-6 mt-6 sm:mt-8 lg:mt-10 hover:shadow-xl hover:shadow-green-500/10 hover:border-slate-600 transition-all duration-300 animate-fadeIn" style={{animationDelay: '300ms'}}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white tracking-tight">
              Best Listings
            </h2>
            <span className="text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/50 w-fit">
              Rating 4.0+
            </span>
          </div>

          {bestListings.length === 0 ? (
            <div className="text-center py-8">
              <Star className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No listings with 4+ ratings yet</p>
              <p className="text-xs text-slate-500 mt-1">Keep providing great experiences to earn high ratings!</p>
            </div>
          ) : (
            <>
              {/* Mobile: Card Layout */}
              <div className="block md:hidden space-y-3">
                {bestListings.map((listing, index) => (
                  <div
                    key={index}
                    className="p-3 bg-slate-700/30 hover:bg-slate-700/50 border border-green-500/30 rounded-lg transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-white truncate">
                          {listing.name}
                        </h3>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-300 mt-1">
                          {getTypeIcon(listing.type)}
                          {listing.type}
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-white ml-2">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        {Number(listing.rating).toFixed(1)}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-600">
                      <div>
                        <p className="text-[10px] text-slate-400 mb-1">Views</p>
                        <span className="flex items-center gap-1 text-xs text-white">
                          <Eye className="w-3 h-3 text-slate-300" />
                          {listing.views}
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 mb-1">Reviews</p>
                        <span className="text-xs font-medium text-white">
                          {listing.reviewCount}
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 mb-1">Revenue</p>
                        <span className="text-xs font-semibold text-green-400">
                          ₱{Number(listing.revenue || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: Table Layout */}
              <div className="hidden md:block overflow-x-auto -mx-4 sm:-mx-6 lg:mx-0">
                <div className="inline-block min-w-full align-middle px-4 sm:px-6 lg:px-0">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-slate-600">
                        <th className="text-left py-3 px-3 lg:px-4 text-xs sm:text-sm font-semibold text-slate-300">
                          Listing
                        </th>
                        <th className="text-left py-3 px-3 lg:px-4 text-xs sm:text-sm font-semibold text-slate-300">
                          Type
                        </th>
                        <th className="text-left py-3 px-3 lg:px-4 text-xs sm:text-sm font-semibold text-slate-300">
                          Views
                        </th>
                        <th className="text-left py-3 px-3 lg:px-4 text-xs sm:text-sm font-semibold text-slate-300">
                          Reviews
                        </th>
                        <th className="text-left py-3 px-3 lg:px-4 text-xs sm:text-sm font-semibold text-slate-300">
                          Revenue
                        </th>
                        <th className="text-left py-3 px-3 lg:px-4 text-xs sm:text-sm font-semibold text-slate-300">
                          Rating
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {bestListings.map((listing, index) => (
                        <tr
                          key={index}
                          className="border-b border-slate-600 hover:bg-slate-700/30 transition"
                        >
                          <td className="py-3 lg:py-4 px-3 lg:px-4">
                            <div className="font-medium text-xs sm:text-sm text-white">
                              {listing.name}
                            </div>
                          </td>
                          <td className="py-3 lg:py-4 px-3 lg:px-4">
                            <span className="inline-flex items-center gap-1 text-xs sm:text-sm text-slate-300">
                              {getTypeIcon(listing.type)}
                              {listing.type}
                            </span>
                          </td>
                          <td className="py-3 lg:py-4 px-3 lg:px-4">
                            <span className="flex items-center gap-1 text-xs sm:text-sm text-white">
                              <Eye className="w-3 sm:w-4 h-3 sm:h-4 text-slate-300" />
                              {listing.views}
                            </span>
                          </td>
                          <td className="py-3 lg:py-4 px-3 lg:px-4">
                            <span className="text-xs sm:text-sm font-medium text-white">
                              {listing.reviewCount}
                            </span>
                          </td>
                          <td className="py-3 lg:py-4 px-3 lg:px-4">
                            <span className="text-xs sm:text-sm font-semibold text-green-400">
                              ₱{Number(listing.revenue || 0).toLocaleString()}
                            </span>
                          </td>
                          <td className="py-3 lg:py-4 px-3 lg:px-4">
                            <span className="flex items-center gap-1 text-xs sm:text-sm text-white">
                              <Star className="w-3 sm:w-4 h-3 sm:h-4 text-yellow-400 fill-yellow-400" />
                              {Number(listing.rating).toFixed(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Listings That Need Attention */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-slate-700 p-3 sm:p-4 lg:p-6 mt-6 sm:mt-8 hover:shadow-xl hover:shadow-red-500/10 hover:border-slate-600 transition-all duration-300 animate-fadeIn" style={{animationDelay: '350ms'}}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white tracking-tight">
              Listings That Need Attention
            </h2>
            <span className="text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/50 w-fit">
              Rating 2.0 or below
            </span>
          </div>

          {needsAttentionListings.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Great job! No listings need attention</p>
              <p className="text-xs text-slate-500 mt-1">All your listings are performing well!</p>
            </div>
          ) : (
            <>
              {/* Mobile: Card Layout */}
              <div className="block md:hidden space-y-3">
                {needsAttentionListings.map((listing, index) => (
                  <div
                    key={index}
                    className="p-3 bg-slate-700/30 hover:bg-slate-700/50 border border-red-500/30 rounded-lg transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-white truncate">
                          {listing.name}
                        </h3>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-300 mt-1">
                          {getTypeIcon(listing.type)}
                          {listing.type}
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-red-300 ml-2">
                        <AlertCircle className="w-3 h-3" />
                        {Number(listing.rating).toFixed(1)}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-600">
                      <div>
                        <p className="text-[10px] text-slate-400 mb-1">Views</p>
                        <span className="flex items-center gap-1 text-xs text-white">
                          <Eye className="w-3 h-3 text-slate-300" />
                          {listing.views}
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 mb-1">Reviews</p>
                        <span className="text-xs font-medium text-white">
                          {listing.reviewCount}
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 mb-1">Revenue</p>
                        <span className="text-xs font-semibold text-green-400">
                          ₱{Number(listing.revenue || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: Table Layout */}
              <div className="hidden md:block overflow-x-auto -mx-4 sm:-mx-6 lg:mx-0">
                <div className="inline-block min-w-full align-middle px-4 sm:px-6 lg:px-0">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-slate-600">
                        <th className="text-left py-3 px-3 lg:px-4 text-xs sm:text-sm font-semibold text-slate-300">
                          Listing
                        </th>
                        <th className="text-left py-3 px-3 lg:px-4 text-xs sm:text-sm font-semibold text-slate-300">
                          Type
                        </th>
                        <th className="text-left py-3 px-3 lg:px-4 text-xs sm:text-sm font-semibold text-slate-300">
                          Views
                        </th>
                        <th className="text-left py-3 px-3 lg:px-4 text-xs sm:text-sm font-semibold text-slate-300">
                          Reviews
                        </th>
                        <th className="text-left py-3 px-3 lg:px-4 text-xs sm:text-sm font-semibold text-slate-300">
                          Revenue
                        </th>
                        <th className="text-left py-3 px-3 lg:px-4 text-xs sm:text-sm font-semibold text-slate-300">
                          Rating
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {needsAttentionListings.map((listing, index) => (
                        <tr
                          key={index}
                          className="border-b border-slate-600 hover:bg-slate-700/30 transition"
                        >
                          <td className="py-3 lg:py-4 px-3 lg:px-4">
                            <div className="font-medium text-xs sm:text-sm text-white">
                              {listing.name}
                            </div>
                          </td>
                          <td className="py-3 lg:py-4 px-3 lg:px-4">
                            <span className="inline-flex items-center gap-1 text-xs sm:text-sm text-slate-300">
                              {getTypeIcon(listing.type)}
                              {listing.type}
                            </span>
                          </td>
                          <td className="py-3 lg:py-4 px-3 lg:px-4">
                            <span className="flex items-center gap-1 text-xs sm:text-sm text-white">
                              <Eye className="w-3 sm:w-4 h-3 sm:h-4 text-slate-300" />
                              {listing.views}
                            </span>
                          </td>
                          <td className="py-3 lg:py-4 px-3 lg:px-4">
                            <span className="text-xs sm:text-sm font-medium text-white">
                              {listing.reviewCount}
                            </span>
                          </td>
                          <td className="py-3 lg:py-4 px-3 lg:px-4">
                            <span className="text-xs sm:text-sm font-semibold text-green-400">
                              ₱{Number(listing.revenue || 0).toLocaleString()}
                            </span>
                          </td>
                          <td className="py-3 lg:py-4 px-3 lg:px-4">
                            <span className="flex items-center gap-1 text-xs sm:text-sm text-red-300">
                              <AlertCircle className="w-3 sm:w-4 h-3 sm:h-4" />
                              {Number(listing.rating).toFixed(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
