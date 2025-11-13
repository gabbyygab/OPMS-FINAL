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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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

  // Pagination states
  const [topRatedPage, setTopRatedPage] = useState(1);
  const [lowRatedPage, setLowRatedPage] = useState(1);
  const [recentBookingsPage, setRecentBookingsPage] = useState(1);
  const itemsPerPage = 5;

  // Chart states
  const [revenueTrendData, setRevenueTrendData] = useState([]);
  const [bookingStatusData, setBookingStatusData] = useState([]);
  const [revenueByTypeData, setRevenueByTypeData] = useState([]);
  const [userDistributionData, setUserDistributionData] = useState([]);
  const [listingDistributionData, setListingDistributionData] = useState([]);
  const [revenueSourceData, setRevenueSourceData] = useState([]);

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

      // Process chart data from fetched data
      if (data?.stats) {
        // Revenue Trends
        if (data.stats.revenue?.trends) {
          const trendData = data.stats.revenue.trends.map((trend) => ({
            month: trend.month,
            serviceFees: trend.revenue - (trend.listingUpgradeRevenue || 0),
            listingUpgrades: trend.listingUpgradeRevenue || 0,
            total: trend.revenue,
          }));
          setRevenueTrendData(trendData);
        }

        // Booking Status Breakdown
        if (data.bookingStatusBreakdown) {
          const statusData = Object.entries(data.bookingStatusBreakdown)
            .filter(([_, count]) => count > 0)
            .map(([status, count]) => ({
              name:
                status.charAt(0).toUpperCase() +
                status.slice(1).replace("_", " "),
              value: count,
              status: status,
            }));
          setBookingStatusData(statusData);
        }

        // Revenue by Listing Type
        if (data.stats.revenue?.byType) {
          const typeData = Object.entries(data.stats.revenue.byType)
            .filter(([_, revenue]) => revenue > 0)
            .map(([type, revenue]) => ({
              name: type.charAt(0).toUpperCase() + type.slice(1),
              value: revenue,
              type: type,
            }));
          setRevenueByTypeData(typeData);
        }

        // User Distribution (Hosts vs Guests)
        if (data.stats.users) {
          const userDist = [
            {
              name: "Hosts",
              value: data.stats.users.totalHosts,
            },
            {
              name: "Guests",
              value: data.stats.users.totalGuests,
            },
          ];
          setUserDistributionData(userDist);
        }

        // Listing Distribution by Type
        if (data.stats.listings?.byType) {
          const listingDist = Object.entries(data.stats.listings.byType)
            .filter(([_, count]) => count > 0)
            .map(([type, count]) => ({
              name: type.charAt(0).toUpperCase() + type.slice(1),
              value: count,
              type: type,
            }));
          setListingDistributionData(listingDist);
        }

        // Revenue Source (Service Fees, Registration Fees, Listing Upgrades)
        if (data.stats.revenue) {
          const revenueSources = [
            {
              name: "Service Fees",
              value: data.stats.revenue.serviceFeeRevenue || 0,
            },
            {
              name: "Registration Fees",
              value: data.stats.revenue.registrationFeeRevenue || 0,
            },
            {
              name: "Listing Upgrades",
              value: data.stats.revenue.listingUpgradeRevenue || 0,
            },
          ].filter((source) => source.value > 0);
          setRevenueSourceData(revenueSources);
        }
      }
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
      title: "Total Revenue",
      subtitle: "Service Fees + Registration Fees + Listing Upgrades",
      value: formatCurrency(stats.revenue.total),
      breakdown: {
        serviceFees: stats.revenue.serviceFeeRevenue || 0,
        registrationFees: stats.revenue.registrationFeeRevenue || 0,
        listingUpgrades: stats.revenue.listingUpgradeRevenue || 0,
      },
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
              {stat.subtitle && (
                <p className="text-xs text-slate-500 mt-1">{stat.subtitle}</p>
              )}
              {stat.breakdown && (
                <div className="mt-3 pt-3 border-t border-slate-800 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Service Fees:</span>
                    <span className="text-emerald-400 font-medium">
                      {formatCurrency(stat.breakdown.serviceFees)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Registration Fees:</span>
                    <span className="text-orange-400 font-medium">
                      {formatCurrency(stat.breakdown.registrationFees)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Listing Upgrades:</span>
                    <span className="text-indigo-400 font-medium">
                      {formatCurrency(stat.breakdown.listingUpgrades)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trends Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Revenue Trends (6 Months)</h2>
          {revenueTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: "12px" }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#e2e8f0" }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="serviceFees"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", r: 4 }}
                  name="Service Fees"
                />
                <Line
                  type="monotone"
                  dataKey="listingUpgrades"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ fill: "#6366f1", r: 4 }}
                  name="Listing Upgrades"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-80 text-slate-400">
              No revenue data available
            </div>
          )}
        </div>

        {/* Booking Status Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Booking Status Breakdown</h2>
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
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Revenue by Listing Type</h2>
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
                  formatter={(value) => formatCurrency(value)}
                />
                <Bar dataKey="value" fill="#8b5cf6" name="Revenue" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-80 text-slate-400">
              No revenue data available
            </div>
          )}
        </div>

        {/* User Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">User Distribution</h2>
          {userDistributionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {userDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
              No user data available
            </div>
          )}
        </div>

        {/* Listing Distribution by Type */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Listings by Type</h2>
          {listingDistributionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={listingDistributionData}>
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
                />
                <Bar dataKey="value" fill="#06b6d4" name="Count" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-80 text-slate-400">
              No listing data available
            </div>
          )}
        </div>

        {/* Revenue Source Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Revenue Sources</h2>
          {revenueSourceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueSourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) =>
                    `${name}: ${formatCurrency(value)}`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#e2e8f0" }}
                  formatter={(value) => formatCurrency(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-80 text-slate-400">
              No revenue data available
            </div>
          )}
        </div>
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
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50">
              {topRatedListings?.length || 0} total
            </span>
          </div>
          <div className="space-y-4">
            {topRatedListings && topRatedListings.length > 0 ? (
              topRatedListings.slice((topRatedPage - 1) * itemsPerPage, topRatedPage * itemsPerPage).map((listing) => (
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

          {/* Pagination for Top Rated */}
          {topRatedListings && topRatedListings.length > itemsPerPage && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
              <button
                onClick={() => setTopRatedPage(Math.max(1, topRatedPage - 1))}
                disabled={topRatedPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-xs text-slate-400">
                Page {topRatedPage} of {Math.ceil(topRatedListings.length / itemsPerPage)}
              </span>
              <button
                onClick={() => setTopRatedPage(Math.min(Math.ceil(topRatedListings.length / itemsPerPage), topRatedPage + 1))}
                disabled={topRatedPage === Math.ceil(topRatedListings.length / itemsPerPage)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
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
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/50">
              {lowRatedListings?.length || 0} total
            </span>
          </div>
          <div className="space-y-4">
            {lowRatedListings && lowRatedListings.length > 0 ? (
              lowRatedListings.slice((lowRatedPage - 1) * itemsPerPage, lowRatedPage * itemsPerPage).map((listing) => (
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

          {/* Pagination for Low Rated */}
          {lowRatedListings && lowRatedListings.length > itemsPerPage && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
              <button
                onClick={() => setLowRatedPage(Math.max(1, lowRatedPage - 1))}
                disabled={lowRatedPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-xs text-slate-400">
                Page {lowRatedPage} of {Math.ceil(lowRatedListings.length / itemsPerPage)}
              </span>
              <button
                onClick={() => setLowRatedPage(Math.min(Math.ceil(lowRatedListings.length / itemsPerPage), lowRatedPage + 1))}
                disabled={lowRatedPage === Math.ceil(lowRatedListings.length / itemsPerPage)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Recent Bookings</h2>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/50">
            {recentBookings?.length || 0} total
          </span>
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
                recentBookings.slice((recentBookingsPage - 1) * itemsPerPage, recentBookingsPage * itemsPerPage).map((booking) => (
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

        {/* Pagination for Recent Bookings */}
        {recentBookings && recentBookings.length > itemsPerPage && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
            <button
              onClick={() => setRecentBookingsPage(Math.max(1, recentBookingsPage - 1))}
              disabled={recentBookingsPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="text-xs text-slate-400">
              Page {recentBookingsPage} of {Math.ceil(recentBookings.length / itemsPerPage)}
            </span>
            <button
              onClick={() => setRecentBookingsPage(Math.min(Math.ceil(recentBookings.length / itemsPerPage), recentBookingsPage + 1))}
              disabled={recentBookingsPage === Math.ceil(recentBookings.length / itemsPerPage)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
