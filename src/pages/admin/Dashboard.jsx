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
} from "lucide-react";

export default function Dashboard() {
  // Mock data - replace with real data from Firebase
  const stats = [
    {
      title: "Total Bookings",
      value: "1,284",
      change: "+12.5%",
      trend: "up",
      icon: Calendar,
      color: "indigo",
    },
    {
      title: "Active Hosts",
      value: "342",
      change: "+8.2%",
      trend: "up",
      icon: Users,
      color: "emerald",
    },
    {
      title: "Total Revenue",
      value: "$48,592",
      change: "+18.7%",
      trend: "up",
      icon: DollarSign,
      color: "violet",
    },
    {
      title: "Active Listings",
      value: "892",
      change: "-3.1%",
      trend: "down",
      icon: Home,
      color: "amber",
    },
  ];

  const topRatedListings = [
    {
      id: 1,
      name: "Luxury Beach Villa",
      host: "John Doe",
      rating: 4.9,
      reviews: 128,
      bookings: 45,
      type: "Stay",
    },
    {
      id: 2,
      name: "Mountain Hiking Experience",
      host: "Jane Smith",
      rating: 4.8,
      reviews: 96,
      bookings: 38,
      type: "Experience",
    },
    {
      id: 3,
      name: "City Center Apartment",
      host: "Mike Johnson",
      rating: 4.7,
      reviews: 84,
      bookings: 52,
      type: "Stay",
    },
    {
      id: 4,
      name: "Photography Tour",
      host: "Sarah Lee",
      rating: 4.9,
      reviews: 72,
      bookings: 31,
      type: "Experience",
    },
  ];

  const lowRatedListings = [
    {
      id: 1,
      name: "Budget Hostel Room",
      host: "Tom Brown",
      rating: 3.2,
      reviews: 28,
      bookings: 12,
      type: "Stay",
    },
    {
      id: 2,
      name: "Basic City Tour",
      host: "Emma Wilson",
      rating: 3.4,
      reviews: 18,
      bookings: 8,
      type: "Service",
    },
    {
      id: 3,
      name: "Shared Workspace",
      host: "Chris Davis",
      rating: 3.5,
      reviews: 22,
      bookings: 15,
      type: "Service",
    },
  ];

  const recentBookings = [
    {
      id: "BK-2024-001",
      guest: "Alice Cooper",
      listing: "Luxury Beach Villa",
      date: "2024-02-15",
      amount: "$450",
      status: "confirmed",
    },
    {
      id: "BK-2024-002",
      guest: "Bob Martin",
      listing: "Mountain Hiking",
      date: "2024-02-14",
      amount: "$120",
      status: "pending",
    },
    {
      id: "BK-2024-003",
      guest: "Carol White",
      listing: "City Apartment",
      date: "2024-02-14",
      amount: "$280",
      status: "confirmed",
    },
    {
      id: "BK-2024-004",
      guest: "David Lee",
      listing: "Photography Tour",
      date: "2024-02-13",
      amount: "$95",
      status: "completed",
    },
    {
      id: "BK-2024-005",
      guest: "Eva Green",
      listing: "Beach Villa",
      date: "2024-02-13",
      amount: "$520",
      status: "confirmed",
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "pending":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "completed":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "Stay":
        return "bg-blue-500/10 text-blue-400";
      case "Experience":
        return "bg-purple-500/10 text-purple-400";
      case "Service":
        return "bg-emerald-500/10 text-emerald-400";
      default:
        return "bg-slate-500/10 text-slate-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Dashboard Analytics
        </h1>
        <p className="text-slate-400">
          Overview of your platform performance and metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
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
            {topRatedListings.map((listing) => (
              <div
                key={listing.id}
                className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-white">
                      {listing.name}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                        listing.type
                      )}`}
                    >
                      {listing.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">by {listing.host}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star className="w-4 h-4 fill-amber-400" />
                      <span className="text-sm font-semibold">
                        {listing.rating}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {listing.reviews} reviews
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-indigo-400">
                      {listing.bookings}
                    </p>
                    <p className="text-xs text-slate-500">bookings</p>
                  </div>
                </div>
              </div>
            ))}
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
            {lowRatedListings.map((listing) => (
              <div
                key={listing.id}
                className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors border border-red-500/10"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-white">
                      {listing.name}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                        listing.type
                      )}`}
                    >
                      {listing.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">by {listing.host}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-red-400">
                      <Star className="w-4 h-4 fill-red-400" />
                      <span className="text-sm font-semibold">
                        {listing.rating}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {listing.reviews} reviews
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-400">
                      {listing.bookings}
                    </p>
                    <p className="text-xs text-slate-500">bookings</p>
                  </div>
                </div>
              </div>
            ))}
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
              {recentBookings.map((booking) => (
                <tr
                  key={booking.id}
                  className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-4 px-4 text-sm font-medium text-indigo-400">
                    {booking.id}
                  </td>
                  <td className="py-4 px-4 text-sm text-white">
                    {booking.guest}
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-300">
                    {booking.listing}
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-400">
                    {booking.date}
                  </td>
                  <td className="py-4 px-4 text-sm font-semibold text-emerald-400">
                    {booking.amount}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        booking.status
                      )}`}
                    >
                      {booking.status.charAt(0).toUpperCase() +
                        booking.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
