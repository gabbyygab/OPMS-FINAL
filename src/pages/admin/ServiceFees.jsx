import { useState, useEffect } from "react";
import {
  DollarSign,
  Percent,
  TrendingUp,
  Home,
  Calendar,
  Briefcase,
  Edit2,
  Save,
  X,
  Info,
  PieChart,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import { db } from "../../firebase/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import {
  getServiceFees,
  updateServiceFees,
  getHostServiceFeeStats,
  getMonthlyRevenueBreakdown,
  getTotalServiceFeeRevenue,
  getNewHostFeesRevenue,
} from "../../utils/platformSettingsUtils";

export default function ServiceFees() {
  const [isEditing, setIsEditing] = useState(false);
  const [fees, setFees] = useState({
    fixed: 5,
  });
  const [originalFees, setOriginalFees] = useState({
    fixed: 5,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [topEarningHosts, setTopEarningHosts] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState({
    stays: { revenue: 0, hosts: 0, bookings: 0 },
    experiences: { revenue: 0, hosts: 0, bookings: 0 },
    services: { revenue: 0, hosts: 0, bookings: 0 },
  });
  const [totalServiceFeeRevenue, setTotalServiceFeeRevenue] = useState(0);
  const [newHostFeesRevenue, setNewHostFeesRevenue] = useState(0);

  // Load service fees and statistics on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load service fees
      const currentFees = await getServiceFees();
      // Use a fixed fee structure - take the first available fee or default to 5%
      const fixedFee = currentFees.stays || currentFees.experiences || currentFees.services || 5;
      setFees({ fixed: fixedFee });
      setOriginalFees({ fixed: fixedFee });

      // Load total service fee revenue from transactions (service_fee type only)
      const totalRevenue = await getTotalServiceFeeRevenue();
      setTotalServiceFeeRevenue(totalRevenue);

      // Load new host fees revenue separately (new_host_fees type only)
      const hostFeesRevenue = await getNewHostFeesRevenue();
      setNewHostFeesRevenue(hostFeesRevenue);

      // Load monthly revenue breakdown
      const revenueData = await getMonthlyRevenueBreakdown();
      setMonthlyRevenue(revenueData);

      // Load top earning hosts
      const hostStats = await getHostServiceFeeStats();

      // Enrich with user data
      const enrichedHosts = await Promise.all(
        hostStats.slice(0, 5).map(async (stat) => {
          try {
            const userRef = doc(db, "users", stat.hostId);
            const userSnap = await getDoc(userRef);
            const userData = userSnap.exists() ? userSnap.data() : {};

            return {
              id: stat.hostId,
              name: userData.fullName || "Unknown Host",
              type: stat.listingType?.charAt(0).toUpperCase() + stat.listingType?.slice(1) || "Stay",
              earnings: stat.totalEarnings,
              bookings: stat.bookingsCount,
              serviceFee: stat.serviceFeeCollected,
            };
          } catch (error) {
            console.error("Error fetching host data:", error);
            return {
              id: stat.hostId,
              name: "Unknown Host",
              type: stat.listingType?.charAt(0).toUpperCase() + stat.listingType?.slice(1) || "Stay",
              earnings: stat.totalEarnings,
              bookings: stat.bookingsCount,
              serviceFee: stat.serviceFeeCollected,
            };
          }
        })
      );

      setTopEarningHosts(enrichedHosts);
    } catch (error) {
      console.error("Error loading service fees data:", error);
      toast.error("Failed to load service fees data");
    } finally {
      setLoading(false);
    }
  };

  const totalHosts = monthlyRevenue.stays.hosts + monthlyRevenue.experiences.hosts + monthlyRevenue.services.hosts;
  const totalMonthlyRevenueCalc = monthlyRevenue.stays.revenue + monthlyRevenue.experiences.revenue + monthlyRevenue.services.revenue;
  const totalBookingsCalc = monthlyRevenue.stays.bookings + monthlyRevenue.experiences.bookings + monthlyRevenue.services.bookings;

  const categoryBreakdown = [
    {
      type: "Stays",
      icon: Home,
      totalHosts: monthlyRevenue.stays.hosts,
      monthlyRevenue: monthlyRevenue.stays.revenue,
      bookings: monthlyRevenue.stays.bookings,
      color: "indigo",
    },
    {
      type: "Experiences",
      icon: Calendar,
      totalHosts: monthlyRevenue.experiences.hosts,
      monthlyRevenue: monthlyRevenue.experiences.revenue,
      bookings: monthlyRevenue.experiences.bookings,
      color: "violet",
    },
    {
      type: "Services",
      icon: Briefcase,
      totalHosts: monthlyRevenue.services.hosts,
      monthlyRevenue: monthlyRevenue.services.revenue,
      bookings: monthlyRevenue.services.bookings,
      color: "emerald",
    },
  ];

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validate fee percentage
      if (fees.fixed < 0 || fees.fixed > 100) {
        toast.error("Fee percentage must be between 0 and 100");
        return;
      }

      // Update all listing types with the same fixed fee
      await updateServiceFees({ 
        stays: fees.fixed,
        experiences: fees.fixed,
        services: fees.fixed
      });

      setOriginalFees({ fixed: fees.fixed });
      setIsEditing(false);
      toast.success("Service fee updated successfully for all booking types!");

      // Reload data to reflect changes
      await loadData();
    } catch (error) {
      console.error("Error saving service fee:", error);
      toast.error("Failed to update service fee");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Revert to original fee
    setFees({ fixed: originalFees.fixed });
    setIsEditing(false);
  };

  const handleFeeChange = (value) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setFees({ fixed: numValue });
    } else if (value === "" || value === ".") {
      setFees({ fixed: value });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading service fees data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Service Fee Management
        </h1>
        <p className="text-slate-400">
          Manage fixed service fee charged to guests on all bookings
        </p>
      </div>

      {/* Total Revenue Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-8 shadow-lg shadow-indigo-500/20">
        <div className="flex items-center justify-between">
          <div className="w-full">
            <p className="text-indigo-100 text-sm font-medium mb-2">
              Total Platform Revenue
            </p>
            <h2 className="text-4xl font-bold text-white mb-4">
              ₱{(totalServiceFeeRevenue + newHostFeesRevenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <div className="flex items-center gap-4 text-indigo-100 mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">All-time platform revenue from fees</span>
              </div>
            </div>

            {/* Revenue Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-indigo-400/20">
              <div>
                <p className="text-xs text-indigo-200 mb-1">Service Fees (Bookings):</p>
                <p className="text-lg font-semibold text-white">
                  ₱{totalServiceFeeRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-indigo-200 mt-1">All-time from confirmed bookings</p>
              </div>
              <div>
                <p className="text-xs text-indigo-200 mb-1">Host Registration Fees:</p>
                <p className="text-lg font-semibold text-white">
                  ₱{newHostFeesRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-indigo-200 mt-1">All-time host registrations</p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-indigo-400/20">
              <p className="text-xs text-indigo-200 mb-1">This Month (Service Fees):</p>
              <p className="text-lg font-semibold text-white">
                ₱{totalMonthlyRevenueCalc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="hidden lg:block ml-4">
            <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
              <DollarSign className="w-16 h-16 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Fee Configuration Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-indigo-500/10 text-indigo-400">
              <DollarSign className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-white mb-1">
                Fixed Service Fee
              </h3>
              <p className="text-sm text-slate-400">
                Applied to all booking types (Stays, Experiences, Services)
              </p>
            </div>
          </div>
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Edit fee rate"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                title="Save changes"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                title="Cancel"
              >
                <X className="w-5 h-5" />
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Fee Rate */}
          <div className="bg-slate-800/50 rounded-xl p-5">
            <p className="text-xs text-slate-400 mb-2">Service Fee Rate</p>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={fees.fixed}
                  onChange={(e) => handleFeeChange(e.target.value)}
                  className="w-24 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-2xl font-bold focus:outline-none focus:border-indigo-500"
                  min="0"
                  max="100"
                  step="0.5"
                />
                <Percent className="w-6 h-6 text-slate-400" />
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-3xl font-bold text-white">
                  {fees.fixed}
                </span>
                <Percent className="w-6 h-6 text-slate-400" />
              </div>
            )}
            <p className="text-xs text-slate-500 mt-2">Charged to guests</p>
          </div>

          {/* Total Revenue */}
          <div className="bg-slate-800/50 rounded-xl p-5">
            <p className="text-xs text-slate-400 mb-2">Monthly Revenue</p>
            <div className="text-2xl font-bold text-emerald-400">
              ₱{totalMonthlyRevenueCalc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-2">This month</p>
          </div>

          {/* Total Hosts */}
          <div className="bg-slate-800/50 rounded-xl p-5">
            <p className="text-xs text-slate-400 mb-2">Total Active Hosts</p>
            <div className="text-2xl font-bold text-white">{totalHosts}</div>
            <p className="text-xs text-slate-500 mt-2">Across all categories</p>
          </div>

          {/* Total Bookings */}
          <div className="bg-slate-800/50 rounded-xl p-5">
            <p className="text-xs text-slate-400 mb-2">Total Bookings</p>
            <div className="text-2xl font-bold text-white">{totalBookingsCalc}</div>
            <p className="text-xs text-slate-500 mt-2">This month</p>
          </div>
        </div>
      </div>

      {/* Category Revenue Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-indigo-400" />
          Revenue by Category
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categoryBreakdown.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.type}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`p-3 rounded-xl bg-${item.color}-500/10 text-${item.color}-400`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    {item.type}
                  </h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Revenue</p>
                    <div className="text-xl font-bold text-emerald-400">
                      ₱{item.monthlyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Hosts</p>
                      <p className="text-lg font-bold text-white">{item.totalHosts}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Bookings</p>
                      <p className="text-lg font-bold text-white">{item.bookings}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-300 font-medium mb-1">
            Fixed Fee Structure Information
          </p>
          <p className="text-xs text-blue-200/80">
            A fixed service fee is applied to all bookings (Stays, Experiences, and Services). 
            The fee is paid by guests on top of the booking amount when a booking is confirmed.
            Hosts receive 100% of their listing price. Changes to the fee rate will apply to new bookings only 
            and will not affect existing or pending transactions. Guests fund their e-wallets via PayPal.
          </p>
        </div>
      </div>

      {/* Top Earning Hosts */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">
              Top Hosts by Service Fees Collected
            </h2>
          </div>
          <button
            onClick={loadData}
            className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {topEarningHosts.length === 0 ? (
          <div className="text-center py-12">
            <PieChart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No booking data available yet</p>
            <p className="text-slate-500 text-sm mt-1">
              Service fee statistics will appear here once bookings are confirmed
            </p>
          </div>
        ) : (
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
                      ₱{host.earnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-300">
                      {host.bookings}
                    </td>
                    <td className="py-4 px-4 text-sm font-semibold text-emerald-400">
                      ₱{host.serviceFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
