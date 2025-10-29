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

import { sendOtpToUser } from "../utils/sendOtpToUser";
import LoadingSpinner from "../loading/Loading";
import VerificationBanner from "../components/Verification";
import { useAuth } from "../context/AuthContext";
export default function HostDashboard({ isVerified, user }) {
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [isLoading, setLoading] = useState(true);
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
  const [listingPerformance, setListingPerformance] = useState([]);
  const { userData } = useAuth();
  const navigate = useNavigate();
  console.log(isVerified);

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

        // Calculate stats
        const confirmedBookings = bookingsWithDates.filter(
          (b) => b.status === "confirmed"
        );
        const totalEarnings = confirmedBookings.reduce(
          (sum, b) => sum + (b.totalAmount || 0),
          0
        );
        const avgRating =
          listings.length > 0
            ? Math.round(
                (listings.reduce((sum, l) => sum + (Number(l.rating) || 0), 0) /
                  listings.length) *
                  10
              ) / 10
            : 0;

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

        // Get listing performance
        const listingPerformanceData = listings.slice(0, 5).map((listing) => {
          const listingBookings = allBookings.filter(
            (b) => b.listing_id === listing.id && b.status === "confirmed"
          );
          const revenue = listingBookings.reduce(
            (sum, b) => sum + (b.totalAmount || 0),
            0
          );

          const getTypeLabel = (type) => {
            if (type === "stays") return "Stay";
            if (type === "experiences") return "Experience";
            if (type === "services") return "Service";
            return "Listing";
          };

          return {
            name: listing.title,
            type: getTypeLabel(listing.type),
            views: listing.views || 0,
            bookings: listingBookings.length,
            revenue: revenue,
            rating: listing.rating || 0,
          };
        });

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
        setListingPerformance(listingPerformanceData);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 pb-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 lg:pt-40">
        {/* Verification Banner */}
        {!isVerified && (
          <VerificationBanner handleVerification={handleVerification} />
        )}
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-indigo-200 bg-clip-text text-transparent">Dashboard</h1>
          <p className="text-indigo-300/60 mt-1">
            Welcome back! Here's what's happening with your listings.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2 mb-6">
          {["today", "week", "month", "year"].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedPeriod === period
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white"
                  : "bg-slate-800/50 text-indigo-300 hover:bg-slate-700/50 border border-indigo-500/20"
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Earnings */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl shadow-lg shadow-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <span
                className={`flex items-center text-sm font-medium ${
                  stats.earningsChange >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {stats.earningsChange >= 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {Math.abs(stats.earningsChange)}%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-indigo-100">
              ₱{Number(stats.totalEarnings || 0).toLocaleString()}
            </h3>
            <p className="text-indigo-300/70 text-sm mt-1">Total Earnings</p>
          </div>

          {/* Total Bookings */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl shadow-lg shadow-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
              <span
                className={`flex items-center text-sm font-medium ${
                  stats.bookingsChange >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {stats.bookingsChange >= 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {Math.abs(stats.bookingsChange)}%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-indigo-100">
              {Number(stats.totalBookings || 0)}
            </h3>
            <p className="text-indigo-300/70 text-sm mt-1">Total Bookings</p>
          </div>

          {/* Active Listings */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl shadow-lg shadow-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/20 border border-purple-500/30 rounded-lg flex items-center justify-center">
                <Home className="w-6 h-6 text-purple-400" />
              </div>
              <span
                className={`flex items-center text-sm font-medium ${
                  stats.listingsChange >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {stats.listingsChange >= 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {Math.abs(stats.listingsChange)}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-indigo-100">
              {Number(stats.activeListings || 0)}
            </h3>
            <p className="text-indigo-300/70 text-sm mt-1">Active Listings</p>
          </div>

          {/* Average Rating */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl shadow-lg shadow-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-500/20 border border-yellow-500/30 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-400" />
              </div>
              <span
                className={`flex items-center text-sm font-medium ${
                  stats.ratingChange >= 0 ? "text-green-400" : "text-red-400"
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
            <h3 className="text-2xl font-bold text-indigo-100">
              {Number.isFinite(Number(stats.avgRating))
                ? Number(stats.avgRating).toFixed(1)
                : "0.0"}
            </h3>
            <p className="text-indigo-300/70 text-sm mt-1">Average Rating</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Bookings */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl shadow-lg shadow-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-indigo-100">Today's Bookings</h2>
              <span className="text-indigo-300/70 text-sm">
                {todayBookings.length} today
              </span>
            </div>

            {todayBookings.length === 0 ? (
              <div className="text-sm text-indigo-300/60">No bookings today.</div>
            ) : (
              <div className="space-y-4">
                {todayBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 bg-slate-700/30 hover:bg-slate-600/30 border border-indigo-500/20 rounded-lg transition"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-indigo-500/20 border border-indigo-500/30 rounded-full flex items-center justify-center text-indigo-400">
                        {getTypeIcon(booking.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-indigo-100">
                          {booking.property}
                        </h3>
                        <p className="text-sm text-indigo-300/60">{booking.guest}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-indigo-300/50 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {booking.checkIn} {booking.checkOut && booking.checkOut !== booking.checkIn ? `- ${booking.checkOut}` : ""}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                              booking.status
                            )}`}
                          >
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-indigo-100">
                        ₱{Number(booking.amount || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-indigo-300/50">{booking.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Messages */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl shadow-lg shadow-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-indigo-100">Messages</h2>
              <a
                href="/host/messages"
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                View All
              </a>
            </div>

            <div className="space-y-4">
              {recentMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 rounded-lg transition cursor-pointer ${
                    message.unread ? "bg-indigo-500/20 border border-indigo-500/30" : "bg-slate-700/30 border border-indigo-500/20"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-indigo-100">
                      {message.guest}
                    </h3>
                    {message.unread && (
                      <span className="w-2 h-2 bg-indigo-400 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-sm text-indigo-300/60 mb-2 line-clamp-2">
                    {message.message}
                  </p>
                  <span className="text-xs text-indigo-300/50">{message.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming - full width on desktop */}
        <div className="grid grid-cols-1 gap-6 mt-6">
          {/* Upcoming Bookings */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl shadow-xl shadow-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-indigo-200 bg-clip-text text-transparent">
                  Upcoming Bookings
                </h2>
                <p className="text-indigo-300/60 text-sm mt-1">Next confirmed reservations in chronological order</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-slate-700/60 border border-slate-600/50 text-indigo-200">
                  {upcomingBookings.length} upcoming
                </span>
                <a
                  href="/host/my-bookings"
                  className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                >
                  View All
                </a>
              </div>
            </div>

            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-5 bg-slate-700/30 hover:bg-slate-600/30 border border-indigo-500/20 rounded-xl transition shadow-sm hover:shadow-md hover:border-indigo-400/30"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-indigo-500/20 border border-indigo-500/30 rounded-full flex items-center justify-center text-indigo-400">
                      {getTypeIcon(booking.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-indigo-100 text-base">
                        {booking.property}
                      </h3>
                      <p className="text-sm text-indigo-300/70">{booking.guest}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-indigo-300/60 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {booking.checkIn}
                          {booking.checkOut && booking.checkOut !== booking.checkIn ? (
                            <span className="mx-1">–</span>
                          ) : null}
                          {booking.checkOut && booking.checkOut !== booking.checkIn ? booking.checkOut : null}
                        </span>
                        <span
                          className={`text-[11px] px-2.5 py-1 rounded-full ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-indigo-100 text-base">
                      ₱{Number(booking.amount || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-indigo-300/60">{booking.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Listing Performance */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl shadow-lg shadow-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm p-6 mt-6">
          <h2 className="text-xl font-bold text-indigo-100 mb-6">
            Listing Performance
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-indigo-500/20">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-indigo-300">
                    Listing
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-indigo-300">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-indigo-300">
                    Views
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-indigo-300">
                    Bookings
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-indigo-300">
                    Revenue
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-indigo-300">
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody>
                {listingPerformance.map((listing, index) => (
                  <tr
                    key={index}
                    className="border-b border-indigo-500/20 hover:bg-slate-700/30 transition"
                  >
                    <td className="py-4 px-4">
                      <div className="font-medium text-indigo-100">
                        {listing.name}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 text-sm text-indigo-300/60">
                        {getTypeIcon(listing.type)}
                        {listing.type}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="flex items-center gap-1 text-sm text-indigo-100">
                        <Eye className="w-4 h-4 text-indigo-300/60" />
                        {listing.views}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-medium text-indigo-100">
                        {listing.bookings}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-semibold text-green-400">
                        ₱{Number(listing.revenue || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="flex items-center gap-1 text-sm text-indigo-100">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        {Number.isFinite(Number(listing.rating))
                          ? Number(listing.rating).toFixed(1)
                          : "0.0"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
