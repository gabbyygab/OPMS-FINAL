import { useState } from "react";
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
} from "lucide-react";

export default function Reports() {
  const [selectedReportType, setSelectedReportType] = useState("financial");
  const [dateRange, setDateRange] = useState("last30days");
  const [isGenerating, setIsGenerating] = useState(false);

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

  const recentReports = [
    {
      id: 1,
      name: "Monthly Financial Summary - January 2024",
      type: "Financial Report",
      generatedBy: "Admin",
      date: "2024-02-01",
      size: "2.4 MB",
      format: "PDF",
      status: "completed",
    },
    {
      id: 2,
      name: "Bookings Analysis Q4 2023",
      type: "Bookings Report",
      generatedBy: "Admin",
      date: "2024-01-15",
      size: "1.8 MB",
      format: "Excel",
      status: "completed",
    },
    {
      id: 3,
      name: "Host Performance - December 2023",
      type: "Host Performance",
      generatedBy: "Admin",
      date: "2024-01-05",
      size: "3.1 MB",
      format: "PDF",
      status: "completed",
    },
    {
      id: 4,
      name: "Listing Analytics Year-End Report",
      type: "Listing Analytics",
      generatedBy: "System",
      date: "2024-01-01",
      size: "4.2 MB",
      format: "Excel",
      status: "completed",
    },
  ];

  const quickStats = [
    {
      label: "Reports Generated",
      value: "248",
      change: "+12%",
      icon: FileText,
      color: "indigo",
    },
    {
      label: "This Month",
      value: "24",
      change: "+8%",
      icon: Calendar,
      color: "emerald",
    },
    {
      label: "Pending",
      value: "0",
      change: "0%",
      icon: Clock,
      color: "amber",
    },
    {
      label: "Storage Used",
      value: "128 MB",
      change: "+15%",
      icon: FileSpreadsheet,
      color: "violet",
    },
  ];

  const handleGenerateReport = () => {
    setIsGenerating(true);
    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false);
      alert("Report generated successfully!");
    }, 2000);
  };

  const getFormatIcon = (format) => {
    switch (format) {
      case "PDF":
        return FilePieChart;
      case "Excel":
        return FileSpreadsheet;
      default:
        return FileText;
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`p-2 rounded-lg bg-${stat.color}-500/10 text-${stat.color}-400`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs text-emerald-400 font-medium">
                  {stat.change}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">
                {stat.value}
              </h3>
              <p className="text-sm text-slate-400">{stat.label}</p>
            </div>
          );
        })}
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
            <select className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500">
              <option value="pdf">PDF Document</option>
              <option value="excel">Excel Spreadsheet</option>
              <option value="csv">CSV File</option>
              <option value="json">JSON Data</option>
            </select>
          </div>
        </div>

        {/* Selected Report Preview */}
        {selectedReportType && (
          <div className="bg-slate-800/50 rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-white mb-3">
              Report will include:
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {reportTypes
                .find((t) => t.id === selectedReportType)
                ?.fields.map((field, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-slate-300"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    {field}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerateReport}
          disabled={isGenerating}
          className={`w-full md:w-auto px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
            isGenerating
              ? "bg-slate-700 text-slate-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          }`}
        >
          {isGenerating ? (
            <>
              <Clock className="w-5 h-5 animate-spin" />
              Generating Report...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Generate Report
            </>
          )}
        </button>
      </div>

      {/* Recent Reports */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Recent Reports</h2>
          </div>
          <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        <div className="space-y-3">
          {recentReports.map((report) => {
            const FormatIcon = getFormatIcon(report.format);
            return (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors border border-slate-700"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-3 bg-indigo-500/10 rounded-lg">
                    <FormatIcon className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white mb-1 truncate">
                      {report.name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{report.type}</span>
                      <span>•</span>
                      <span>{report.date}</span>
                      <span>•</span>
                      <span>{report.size}</span>
                      <span>•</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                        {report.format}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 hidden sm:block">
                    Completed
                  </span>
                  <button className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 text-center">
          <button className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors">
            View All Reports
          </button>
        </div>
      </div>

      {/* Report Templates */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <FilePieChart className="w-5 h-5 text-violet-400" />
          <h2 className="text-xl font-bold text-white">Quick Templates</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-indigo-500 hover:bg-slate-800 transition-all text-left group">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-sm font-semibold text-white">
                Monthly Summary
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Complete overview of all metrics for the past month
            </p>
          </button>

          <button className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-emerald-500 hover:bg-slate-800 transition-all text-left group">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-sm font-semibold text-white">
                Revenue Report
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Detailed breakdown of all revenue streams
            </p>
          </button>

          <button className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-violet-500 hover:bg-slate-800 transition-all text-left group">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-violet-500/10 rounded-lg group-hover:bg-violet-500/20 transition-colors">
                <PieChart className="w-5 h-5 text-violet-400" />
              </div>
              <h3 className="text-sm font-semibold text-white">
                Analytics Dashboard
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Visual analytics with charts and graphs
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
