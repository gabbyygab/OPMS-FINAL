import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Home,
  Calendar,
  DollarSign,
  Star,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Award,
  TrendingUpIcon,
} from "lucide-react";
import {
  getDashboardData,
  formatCurrency,
  formatPercentage,
  formatNumber,
} from "../../utils/adminAnalytics";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  // Fetch dashboard data on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardData();
      setDashboardData(data);
    } catch (err) {
      console.error("Error loading dashboard:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">{error || "No data available"}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { stats, topRatedListings, lowRatedListings, recentBookings } = dashboardData;

  // Prepare stats for display
  const displayStats = [
    {
      title: "Total Bookings",
      value: formatNumber(stats.bookings.total),
      change: formatPercentage(stats.bookings.change),
      trend: stats.bookings.trend,
      icon: Calendar,
      color: "indigo",
    },
    {
      title: "Active Hosts",
      value: formatNumber(stats.users.totalHosts),
      change: formatPercentage(stats.users.hostChange),
      trend: stats.users.hostTrend,
      icon: Users,
      color: "emerald",
    },
    {
      title: "Total Revenue (Service Fees)",
      value: formatCurrency(stats.revenue.total),
      change: stats.revenue.trends.length > 1
        ? formatPercentage(
            ((stats.revenue.trends[stats.revenue.trends.length - 1].revenue -
              stats.revenue.trends[stats.revenue.trends.length - 2].revenue) /
              (stats.revenue.trends[stats.revenue.trends.length - 2].revenue || 1)) * 100
          )
        : "+0.0%",
      trend: stats.revenue.trends.length > 1 &&
        stats.revenue.trends[stats.revenue.trends.length - 1].revenue >=
        stats.revenue.trends[stats.revenue.trends.length - 2].revenue
        ? "up"
        : "down",
      icon: DollarSign,
      color: "violet",
    },
    {
      title: "Active Listings",
      value: formatNumber(stats.listings.active),
      change: formatPercentage(stats.listings.change),
      trend: stats.listings.trend,
      icon: Home,
      color: "amber",
    },
  ];


  const getStatusColor = (status) => {
    if (!status) return "bg-slate-500/10 text-slate-400 border-slate-500/20";

    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "pending":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "completed":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "refund_requested":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "refunded":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getTypeColor = (type) => {
    const normalizedType = type?.toLowerCase();
    switch (normalizedType) {
      case "stays":
        return "bg-blue-500/10 text-blue-400";
      case "experiences":
        return "bg-purple-500/10 text-purple-400";
      case "services":
        return "bg-emerald-500/10 text-emerald-400";
      default:
        return "bg-slate-500/10 text-slate-400";
    }
  };

  const formatListingType = (type) => {
    if (!type) return "Unknown";
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    if (date.toDate) {
      return date.toDate().toLocaleDateString();
    }
    return new Date(date).toLocaleDateString();
  };

  const formatStatus = (status) => {
    if (!status) return "Unknown";
    return status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Dashboard Analytics
          </h1>
          <p className="text-slate-400">
            Real-time platform performance and metrics
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors border border-slate-700"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-900/40 to-indigo-800/20 border border-indigo-700/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-medium text-indigo-300">Total Points Distributed</h3>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatNumber(stats.points.totalPoints)}
          </p>
          <p className="text-xs text-indigo-300 mt-1">
            {formatNumber(stats.points.redeemedPoints)} redeemed ({stats.points.redemptionRate.toFixed(1)}%)
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 border border-emerald-700/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-medium text-emerald-300">Total Users</h3>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatNumber(stats.users.totalUsers)}
          </p>
          <p className="text-xs text-emerald-300 mt-1">
            {formatNumber(stats.users.totalGuests)} guests, {formatNumber(stats.users.totalHosts)} hosts
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-900/40 to-amber-800/20 border border-amber-700/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUpIcon className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-medium text-amber-300">Refund Requests</h3>
          </div>
          <p className="text-2xl font-bold text-white">
            {stats.refunds.requested}
          </p>
          <p className="text-xs text-amber-300 mt-1">
            {stats.refunds.approved} approved - {formatCurrency(stats.refunds.totalAmount)}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayStats.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === "up" ? ArrowUpRight : ArrowDownRight;
          return (
            <div
              key={index}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`p-3 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-400 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    stat.trend === "up" ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  <TrendIcon className="w-4 h-4" />
                  {stat.change}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">
                {stat.value}
              </h3>
              <p className="text-sm text-slate-400">{stat.title}</p>
            </div>
          );
        })}
      </div>

      {/* Top & Low Rated Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Rated */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-bold text-white">
                Best Reviewed Listings
              </h2>
            </div>
            <button className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {topRatedListings && topRatedListings.length > 0 ? (
              topRatedListings.map((listing) => (
                <div
                  key={listing.id}
                  className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-white">
                        {listing.title || "Untitled"}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                          listing.type
                        )}`}
                      >
                        {formatListingType(listing.type)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {listing.location || "No location"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-amber-400">
                        <Star className="w-4 h-4 fill-amber-400" />
                        <span className="text-sm font-semibold">
                          {listing.rating.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {listing.reviewCount} reviews
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-indigo-400">
                        {listing.bookingCount}
                      </p>
                      <p className="text-xs text-slate-500">bookings</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                No rated listings yet
              </div>
            )}
          </div>
        </div>

        {/* Low Rated */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <h2 className="text-xl font-bold text-white">
                Needs Attention
              </h2>
            </div>
            <button className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {lowRatedListings && lowRatedListings.length > 0 ? (
              lowRatedListings.map((listing) => (
                <div
                  key={listing.id}
                  className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors border border-red-500/10"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-white">
                        {listing.title || "Untitled"}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                          listing.type
                        )}`}
                      >
                        {formatListingType(listing.type)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {listing.location || "No location"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-red-400">
                        <Star className="w-4 h-4 fill-red-400" />
                        <span className="text-sm font-semibold">
                          {listing.rating.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {listing.reviewCount} reviews
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-400">
                        {listing.bookingCount}
                      </p>
                      <p className="text-xs text-slate-500">bookings</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                No low-rated listings
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Recent Bookings</h2>
          </div>
          <button className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">
                  Booking ID
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">
                  Guest
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">
                  Listing
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">
                  Date
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">
                  Amount
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {recentBookings && recentBookings.length > 0 ? (
                recentBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-4 px-4 text-sm font-medium text-indigo-400">
                      {booking.id.substring(0, 12)}...
                    </td>
                    <td className="py-4 px-4 text-sm text-white">
                      {booking.guestName || "Unknown Guest"}
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-300">
                      {booking.listing?.title || "Deleted Listing"}
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-400">
                      {formatDate(booking.createdAt)}
                    </td>
                    <td className="py-4 px-4 text-sm font-semibold text-emerald-400">
                      {formatCurrency(booking.totalAmount || 0)}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {formatStatus(booking.status)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    No bookings yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
