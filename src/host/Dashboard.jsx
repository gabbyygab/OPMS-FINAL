import { useState } from "react";
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

import { sendOtpToUser } from "../utils/sendOtpToUser";
import LoadingSpinner from "../loading/Loading";
import VerificationBanner from "../components/Verification";
import { useAuth } from "../context/AuthContext";
export default function HostDashboard({ isVerified, user }) {
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [isLoading, setLoading] = useState(false);
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

  // Sample data
  const stats = {
    totalEarnings: 12450,
    earningsChange: 12.5,
    totalBookings: 24,
    bookingsChange: 8.3,
    activeListings: 8,
    listingsChange: 2,
    avgRating: 4.8,
    ratingChange: 0.2,
  };

  const upcomingBookings = [
    {
      id: 1,
      guest: "John Doe",
      property: "Beachfront Villa",
      type: "Stay",
      checkIn: "Oct 15, 2025",
      checkOut: "Oct 18, 2025",
      amount: 450,
      status: "confirmed",
    },
    {
      id: 2,
      guest: "Sarah Smith",
      property: "Mountain Hiking Tour",
      type: "Experience",
      checkIn: "Oct 16, 2025",
      checkOut: "Oct 16, 2025",
      amount: 120,
      status: "confirmed",
    },
    {
      id: 3,
      guest: "Mike Johnson",
      property: "City Photography Service",
      type: "Service",
      checkIn: "Oct 17, 2025",
      checkOut: "Oct 17, 2025",
      amount: 200,
      status: "pending",
    },
  ];

  const recentMessages = [
    {
      id: 1,
      guest: "Emily Chen",
      message: "Is late check-in available?",
      time: "2 hours ago",
      unread: true,
    },
    {
      id: 2,
      guest: "David Lee",
      message: "Thank you for the wonderful stay!",
      time: "5 hours ago",
      unread: false,
    },
    {
      id: 3,
      guest: "Anna Park",
      message: "Can I book for an extra day?",
      time: "1 day ago",
      unread: true,
    },
  ];

  const listingPerformance = [
    {
      name: "Beachfront Villa",
      type: "Stay",
      views: 342,
      bookings: 8,
      revenue: 3600,
      rating: 4.9,
    },
    {
      name: "Mountain Hiking Tour",
      type: "Experience",
      views: 218,
      bookings: 12,
      revenue: 1440,
      rating: 4.7,
    },
    {
      name: "Photography Service",
      type: "Service",
      views: 156,
      bookings: 4,
      revenue: 800,
      rating: 5.0,
    },
  ];

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
              ${stats.totalEarnings.toLocaleString()}
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
              {stats.totalBookings}
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
              {stats.activeListings}
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
              {stats.avgRating}
            </h3>
            <p className="text-indigo-300/70 text-sm mt-1">Average Rating</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Bookings */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl shadow-lg shadow-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-indigo-100">
                Upcoming Bookings
              </h2>
              <a
                href="/host/bookings"
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                View All
              </a>
            </div>

            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
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
                          {booking.checkIn} - {booking.checkOut}
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
                      ${booking.amount}
                    </p>
                    <p className="text-xs text-indigo-300/50">{booking.type}</p>
                  </div>
                </div>
              ))}
            </div>
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
                        ${listing.revenue.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="flex items-center gap-1 text-sm text-indigo-100">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        {listing.rating}
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
