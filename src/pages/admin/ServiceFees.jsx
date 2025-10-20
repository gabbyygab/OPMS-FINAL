import { useState } from "react";
import {
  DollarSign,
  Percent,
  TrendingUp,
  Users,
  Home,
  Calendar,
  Briefcase,
  Edit2,
  Save,
  X,
  Info,
  PieChart,
} from "lucide-react";

export default function ServiceFees() {
  const [isEditing, setIsEditing] = useState(null);
  const [fees, setFees] = useState({
    stays: 15,
    experiences: 12,
    services: 10,
  });

  // Mock data for host earnings
  const topEarningHosts = [
    {
      id: 1,
      name: "John Doe",
      type: "Stay",
      earnings: 12450,
      bookings: 45,
      serviceFee: 1867.5,
    },
    {
      id: 2,
      name: "Jane Smith",
      type: "Experience",
      earnings: 8920,
      bookings: 38,
      serviceFee: 1070.4,
    },
    {
      id: 3,
      name: "Mike Johnson",
      type: "Stay",
      earnings: 10200,
      bookings: 52,
      serviceFee: 1530,
    },
    {
      id: 4,
      name: "Sarah Lee",
      type: "Service",
      earnings: 7650,
      bookings: 31,
      serviceFee: 765,
    },
    {
      id: 5,
      name: "Tom Brown",
      type: "Experience",
      earnings: 6840,
      bookings: 28,
      serviceFee: 820.8,
    },
  ];

  const feeBreakdown = [
    {
      type: "Stays",
      icon: Home,
      currentRate: fees.stays,
      totalHosts: 145,
      monthlyRevenue: 18240,
      color: "indigo",
    },
    {
      type: "Experiences",
      icon: Calendar,
      currentRate: fees.experiences,
      totalHosts: 89,
      monthlyRevenue: 12360,
      color: "violet",
    },
    {
      type: "Services",
      icon: Briefcase,
      currentRate: fees.services,
      totalHosts: 108,
      monthlyRevenue: 8950,
      color: "emerald",
    },
  ];

  const handleEdit = (type) => {
    setIsEditing(type.toLowerCase());
  };

  const handleSave = () => {
    setIsEditing(null);
    // Here you would save to Firebase
  };

  const handleCancel = () => {
    setIsEditing(null);
  };

  const handleFeeChange = (type, value) => {
    setFees({ ...fees, [type]: parseFloat(value) || 0 });
  };

  const totalMonthlyRevenue = feeBreakdown.reduce(
    (sum, item) => sum + item.monthlyRevenue,
    0
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Service Fee Management
        </h1>
        <p className="text-slate-400">
          Manage service fees charged to hosts across different categories
        </p>
      </div>

      {/* Total Revenue Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-8 shadow-lg shadow-indigo-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-indigo-100 text-sm font-medium mb-2">
              Total Monthly Revenue from Service Fees
            </p>
            <h2 className="text-4xl font-bold text-white mb-4">
              ${totalMonthlyRevenue.toLocaleString()}
            </h2>
            <div className="flex items-center gap-2 text-indigo-100">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">+12.3% from last month</span>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
              <DollarSign className="w-16 h-16 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Fee Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {feeBreakdown.map((item) => {
          const Icon = item.icon;
          const type = item.type.toLowerCase();
          const editing = isEditing === type;

          return (
            <div
              key={item.type}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`p-3 rounded-xl bg-${item.color}-500/10 text-${item.color}-400`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                {!editing ? (
                  <button
                    onClick={() => handleEdit(item.type)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancel}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <h3 className="text-lg font-semibold text-white mb-4">
                {item.type}
              </h3>

              <div className="space-y-4">
                {/* Fee Rate */}
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-2">Service Fee Rate</p>
                  {editing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={fees[type]}
                        onChange={(e) => handleFeeChange(type, e.target.value)}
                        className="w-20 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xl font-bold focus:outline-none focus:border-indigo-500"
                        min="0"
                        max="100"
                        step="0.5"
                      />
                      <Percent className="w-5 h-5 text-slate-400" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-2xl font-bold text-white">
                        {item.currentRate}
                      </span>
                      <Percent className="w-5 h-5 text-slate-400" />
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1">Active Hosts</p>
                    <p className="text-lg font-bold text-white">
                      {item.totalHosts}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1">
                      Monthly Revenue
                    </p>
                    <p className="text-lg font-bold text-emerald-400">
                      ${item.monthlyRevenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-300 font-medium mb-1">
            Fee Structure Information
          </p>
          <p className="text-xs text-blue-200/80">
            Service fees are automatically deducted from host earnings for each
            booking. Changes to fee rates will apply to new bookings only and
            will not affect existing or pending transactions.
          </p>
        </div>
      </div>

      {/* Top Earning Hosts */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">
              Top Earning Hosts (Service Fees)
            </h2>
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
                  Rank
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">
                  Host Name
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">
                  Type
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">
                  Total Earnings
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">
                  Bookings
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">
                  Service Fee Collected
                </th>
              </tr>
            </thead>
            <tbody>
              {topEarningHosts.map((host, index) => (
                <tr
                  key={host.id}
                  className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0
                          ? "bg-amber-500/20 text-amber-400"
                          : index === 1
                          ? "bg-slate-500/20 text-slate-400"
                          : index === 2
                          ? "bg-orange-500/20 text-orange-400"
                          : "bg-slate-700/50 text-slate-400"
                      }`}
                    >
                      {index + 1}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                        {host.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <span className="text-sm font-medium text-white">
                        {host.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400">
                      {host.type}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm font-semibold text-white">
                    ${host.earnings.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-300">
                    {host.bookings}
                  </td>
                  <td className="py-4 px-4 text-sm font-semibold text-emerald-400">
                    ${host.serviceFee.toLocaleString()}
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
