import { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  PieChart,
  FileSpreadsheet,
  FilePieChart,
  CheckCircle,
  Clock,
  Filter,
  Plus,
  Loader2,
} from "lucide-react";
import {
  getDateRange,
  generateFinancialReportData,
  generateBookingsReportData,
  generateHostPerformanceReportData,
  generateListingAnalyticsReportData,
} from "../../utils/reportUtils";
import {
  generateFinancialReportPDF,
  generateBookingsReportPDF,
  generateHostPerformanceReportPDF,
  generateListingAnalyticsReportPDF,
} from "../../utils/pdfGenerator";
import { formatCurrency } from "../../utils/adminAnalytics";

export default function Reports() {
  const [selectedReportType, setSelectedReportType] = useState("financial");
  const [dateRange, setDateRange] = useState("last30days");
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportPreview, setReportPreview] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const reportTypes = [
    {
      id: "financial",
      name: "Financial Report",
      description: "Revenue, fees, and transaction data",
      icon: DollarSign,
      color: "emerald",
      fields: ["Total Revenue", "Service Fees", "Transactions", "Refunds"],
    },
    {
      id: "bookings",
      name: "Bookings Report",
      description: "Booking trends and statistics",
      icon: Calendar,
      color: "indigo",
      fields: ["Total Bookings", "Cancellations", "No-shows", "Completion Rate"],
    },
    {
      id: "hosts",
      name: "Host Performance",
      description: "Host activity and earnings",
      icon: Users,
      color: "violet",
      fields: ["Active Hosts", "Total Earnings", "Average Rating", "Response Time"],
    },
    {
      id: "listings",
      name: "Listing Analytics",
      description: "Listing performance metrics",
      icon: BarChart3,
      color: "amber",
      fields: ["Active Listings", "Views", "Conversion Rate", "Top Categories"],
    },
  ];

  const dateRangeOptions = [
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "last7days", label: "Last 7 Days" },
    { value: "last30days", label: "Last 30 Days" },
    { value: "last3months", label: "Last 3 Months" },
    { value: "last6months", label: "Last 6 Months" },
    { value: "lastyear", label: "Last Year" },
    { value: "custom", label: "Custom Range" },
  ];

  const quickTemplates = [
    {
      id: "monthly",
      name: "Monthly Summary",
      description: "Complete overview of all metrics for the past month",
      icon: TrendingUp,
      color: "indigo",
      reportType: "financial",
      dateRange: "last30days",
    },
    {
      id: "revenue",
      name: "Revenue Report",
      description: "Detailed breakdown of all revenue streams",
      icon: DollarSign,
      color: "emerald",
      reportType: "financial",
      dateRange: "last3months",
    },
    {
      id: "analytics",
      name: "Analytics Dashboard",
      description: "Visual analytics with charts and graphs",
      icon: PieChart,
      color: "violet",
      reportType: "listings",
      dateRange: "last30days",
    },
  ];

  // Load report preview when report type or date range changes
  useEffect(() => {
    loadReportPreview();
  }, [selectedReportType, dateRange]);

  const loadReportPreview = async () => {
    setIsLoadingPreview(true);
    try {
      const range = getDateRange(dateRange);
      let preview = null;

      switch (selectedReportType) {
        case "financial":
          preview = await generateFinancialReportData(range);
          break;
        case "bookings":
          preview = await generateBookingsReportData(range);
          break;
        case "hosts":
          preview = await generateHostPerformanceReportData(range);
          break;
        case "listings":
          preview = await generateListingAnalyticsReportData(range);
          break;
      }

      setReportPreview(preview);
    } catch (error) {
      console.error("Error loading report preview:", error);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const range = getDateRange(dateRange);
      let data = null;

      // Generate report data
      switch (selectedReportType) {
        case "financial":
          data = await generateFinancialReportData(range);
          generateFinancialReportPDF(data);
          break;
        case "bookings":
          data = await generateBookingsReportData(range);
          generateBookingsReportPDF(data);
          break;
        case "hosts":
          data = await generateHostPerformanceReportData(range);
          generateHostPerformanceReportPDF(data);
          break;
        case "listings":
          data = await generateListingAnalyticsReportData(range);
          generateListingAnalyticsReportPDF(data);
          break;
      }
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Reports Generation
        </h1>
        <p className="text-slate-400">
          Generate and download comprehensive platform reports
        </p>
      </div>

      {/* Report Generator */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Plus className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xl font-bold text-white">Generate New Report</h2>
        </div>

        {/* Report Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Select Report Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {reportTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedReportType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedReportType(type.id)}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? `border-${type.color}-500 bg-${type.color}-500/10`
                      : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg inline-flex mb-3 ${
                      isSelected
                        ? `bg-${type.color}-500/20 text-${type.color}-400`
                        : "bg-slate-700 text-slate-400"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3
                    className={`text-sm font-semibold mb-1 ${
                      isSelected ? "text-white" : "text-slate-300"
                    }`}
                  >
                    {type.name}
                  </h3>
                  <p className="text-xs text-slate-400">{type.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date Range & Format Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            >
              {dateRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Export Format
            </label>
            <div className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white">
              <div className="flex items-center gap-2">
                <FilePieChart className="w-5 h-5 text-indigo-400" />
                <span>PDF Document</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Report Preview */}
        {selectedReportType && (
          <div className="bg-slate-800/50 rounded-xl p-5 mb-6">
            {isLoadingPreview ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                <span className="ml-2 text-slate-400">
                  Loading preview...
                </span>
              </div>
            ) : reportPreview ? (
              <>
                <h3 className="text-sm font-semibold text-white mb-4">
                  Report Preview
                </h3>
                {selectedReportType === "financial" && reportPreview && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">
                          Total Revenue
                        </p>
                        <p className="text-lg font-bold text-emerald-400">
                          {formatCurrency(reportPreview.totalRevenue || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">
                          Service Fees
                        </p>
                        <p className="text-lg font-bold text-white">
                          {formatCurrency(reportPreview.serviceFees || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">
                          Transactions
                        </p>
                        <p className="text-lg font-bold text-white">
                          {reportPreview.transactions || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Refunds</p>
                        <p className="text-lg font-bold text-amber-400">
                          {formatCurrency(reportPreview.refunds || 0)}
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-slate-700 pt-4">
                      <p className="text-xs font-semibold text-slate-300 mb-3">
                        Revenue by Type
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-400">Stays</span>
                          <span className="text-sm font-semibold text-white">
                            {formatCurrency(reportPreview.revenueByType?.stays || 0)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-400">
                            Experiences
                          </span>
                          <span className="text-sm font-semibold text-white">
                            {formatCurrency(reportPreview.revenueByType?.experiences || 0)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-400">Services</span>
                          <span className="text-sm font-semibold text-white">
                            {formatCurrency(reportPreview.revenueByType?.services || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {selectedReportType === "bookings" && reportPreview && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">
                          Total Bookings
                        </p>
                        <p className="text-lg font-bold text-white">
                          {reportPreview.totalBookings || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Confirmed</p>
                        <p className="text-lg font-bold text-emerald-400">
                          {reportPreview.confirmedBookings || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">
                          Completion Rate
                        </p>
                        <p className="text-lg font-bold text-white">
                          {(reportPreview.completionRate || 0).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">
                          Avg. Value
                        </p>
                        <p className="text-lg font-bold text-indigo-400">
                          {formatCurrency(reportPreview.averageBookingValue || 0)}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 border-t border-slate-700 pt-4 mb-4">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Stays</p>
                        <p className="text-sm font-semibold text-white">
                          {reportPreview.bookingsByType?.stays || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">
                          Experiences
                        </p>
                        <p className="text-sm font-semibold text-white">
                          {reportPreview.bookingsByType?.experiences || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Services</p>
                        <p className="text-sm font-semibold text-white">
                          {reportPreview.bookingsByType?.services || 0}
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-slate-700 pt-4">
                      <p className="text-xs font-semibold text-slate-300 mb-3">
                        Status Breakdown
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-700/30 rounded-lg p-2">
                          <p className="text-xs text-slate-400">Pending</p>
                          <p className="text-sm font-bold text-amber-400">
                            {reportPreview.statusBreakdown?.pending || 0}
                          </p>
                        </div>
                        <div className="bg-slate-700/30 rounded-lg p-2">
                          <p className="text-xs text-slate-400">Confirmed</p>
                          <p className="text-sm font-bold text-emerald-400">
                            {reportPreview.statusBreakdown?.confirmed || 0}
                          </p>
                        </div>
                        <div className="bg-slate-700/30 rounded-lg p-2">
                          <p className="text-xs text-slate-400">Rejected</p>
                          <p className="text-sm font-bold text-red-400">
                            {reportPreview.statusBreakdown?.rejected || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {selectedReportType === "hosts" && reportPreview && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">
                          Total Hosts
                        </p>
                        <p className="text-lg font-bold text-white">
                          {reportPreview.totalHosts || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">
                          Active Hosts
                        </p>
                        <p className="text-lg font-bold text-emerald-400">
                          {reportPreview.activeHosts || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">
                          Total Earnings
                        </p>
                        <p className="text-lg font-bold text-white">
                          {formatCurrency(reportPreview.totalEarnings || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">
                          Avg. Rating
                        </p>
                        <p className="text-lg font-bold text-amber-400">
                          {(reportPreview.averageRating || 0).toFixed(2)} / 5.00
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-slate-700 pt-4">
                      <p className="text-xs font-semibold text-slate-300 mb-3">
                        Top Performing Hosts (Top 5)
                      </p>
                      <div className="space-y-2">
                        {reportPreview.topHosts?.slice(0, 5).map((host, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-slate-700/20 rounded-lg p-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-indigo-400 w-6">
                                #{idx + 1}
                              </span>
                              <span className="text-sm text-white">
                                {host.hostName}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-xs text-slate-400">
                                {host.confirmedBookings} bookings
                              </span>
                              <span className="text-sm font-semibold text-emerald-400">
                                {formatCurrency(host.totalEarnings)}
                              </span>
                            </div>
                          </div>
                        ))}
                        {(!reportPreview.topHosts || reportPreview.topHosts.length === 0) && (
                          <p className="text-sm text-slate-400 text-center py-4">
                            No active hosts in this period
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
                {selectedReportType === "listings" && reportPreview && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">
                          Total Listings
                        </p>
                        <p className="text-lg font-bold text-white">
                          {reportPreview.totalListings || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">
                          Active Listings
                        </p>
                        <p className="text-lg font-bold text-emerald-400">
                          {reportPreview.activeListings || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">
                          New Listings
                        </p>
                        <p className="text-lg font-bold text-indigo-400">
                          {reportPreview.newListings || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">
                          Conversion Rate
                        </p>
                        <p className="text-lg font-bold text-white">
                          {(reportPreview.conversionRate || 0).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 border-t border-slate-700 pt-4 mb-4">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Stays</p>
                        <p className="text-sm font-semibold text-white">
                          {reportPreview.listingsByType?.stays || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">
                          Experiences
                        </p>
                        <p className="text-sm font-semibold text-white">
                          {reportPreview.listingsByType?.experiences || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Services</p>
                        <p className="text-sm font-semibold text-white">
                          {reportPreview.listingsByType?.services || 0}
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-slate-700 pt-4">
                      <p className="text-xs font-semibold text-slate-300 mb-3">
                        Top Performing Listings (Top 5)
                      </p>
                      <div className="space-y-2">
                        {reportPreview.topListings?.slice(0, 5).map((listing, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-slate-700/20 rounded-lg p-2"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-xs font-bold text-indigo-400 w-6">
                                #{idx + 1}
                              </span>
                              <span className="text-sm text-white truncate">
                                {listing.title}
                              </span>
                              <span className="text-xs text-slate-500 px-2 py-0.5 bg-slate-700 rounded">
                                {listing.type}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-400">
                                {listing.bookingCount} bookings
                              </span>
                              <span className="text-sm font-semibold text-emerald-400">
                                {formatCurrency(listing.totalRevenue)}
                              </span>
                            </div>
                          </div>
                        ))}
                        {(!reportPreview.topListings || reportPreview.topListings.length === 0) && (
                          <p className="text-sm text-slate-400 text-center py-4">
                            No listings with bookings in this period
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <p>No preview available</p>
              </div>
            )}
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerateReport}
          disabled={isGenerating || isLoadingPreview}
          className={`w-full md:w-auto px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
            isGenerating || isLoadingPreview
              ? "bg-slate-700 text-slate-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Download PDF Report
            </>
          )}
        </button>
      </div>

      {/* Quick Templates */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <FilePieChart className="w-5 h-5 text-violet-400" />
          <h2 className="text-xl font-bold text-white">Quick Templates</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickTemplates.map((template) => {
            const Icon = template.icon;
            return (
              <button
                key={template.id}
                onClick={() => {
                  setSelectedReportType(template.reportType);
                  setDateRange(template.dateRange);
                }}
                className={`p-4 bg-slate-800/50 border rounded-xl hover:bg-slate-800 transition-all text-left group ${
                  selectedReportType === template.reportType &&
                  dateRange === template.dateRange
                    ? `border-${template.color}-500`
                    : "border-slate-700 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`p-2 bg-${template.color}-500/10 rounded-lg group-hover:bg-${template.color}-500/20 transition-colors`}
                  >
                    <Icon className={`w-5 h-5 text-${template.color}-400`} />
                  </div>
                  <h3 className="text-sm font-semibold text-white">
                    {template.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-400">{template.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
