import { useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  Flag,
  XCircle,
  CheckCircle,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Search,
  Filter,
} from "lucide-react";

export default function PolicyCompliance() {
  const [activeTab, setActiveTab] = useState("cancellation");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Mock cancellation policies
  const cancellationPolicies = [
    {
      id: 1,
      name: "Flexible",
      description: "Full refund up to 24 hours before check-in",
      refundPercentage: 100,
      hoursBeforeCheckIn: 24,
      totalListings: 234,
      status: "active",
    },
    {
      id: 2,
      name: "Moderate",
      description: "Full refund up to 5 days before check-in",
      refundPercentage: 100,
      hoursBeforeCheckIn: 120,
      totalListings: 189,
      status: "active",
    },
    {
      id: 3,
      name: "Strict",
      description: "50% refund up to 7 days before check-in",
      refundPercentage: 50,
      hoursBeforeCheckIn: 168,
      totalListings: 98,
      status: "active",
    },
    {
      id: 4,
      name: "Non-Refundable",
      description: "No refunds allowed",
      refundPercentage: 0,
      hoursBeforeCheckIn: 0,
      totalListings: 45,
      status: "active",
    },
  ];

  // Mock rules and regulations
  const platformRules = [
    {
      id: 1,
      category: "Listing Quality",
      rule: "All listings must have at least 5 high-quality photos",
      severity: "high",
      violations: 12,
      status: "enforced",
    },
    {
      id: 2,
      category: "Pricing",
      rule: "No hidden fees - all charges must be disclosed upfront",
      severity: "critical",
      violations: 3,
      status: "enforced",
    },
    {
      id: 3,
      category: "Communication",
      rule: "Hosts must respond to inquiries within 24 hours",
      severity: "medium",
      violations: 28,
      status: "enforced",
    },
    {
      id: 4,
      category: "Safety",
      rule: "Safety equipment must be available and documented",
      severity: "critical",
      violations: 5,
      status: "enforced",
    },
    {
      id: 5,
      category: "Availability",
      rule: "Calendar must be kept up to date",
      severity: "medium",
      violations: 19,
      status: "enforced",
    },
  ];

  // Mock violation reports
  const violationReports = [
    {
      id: 1,
      type: "Misleading Photos",
      reportedBy: "Guest",
      listing: "Beach Villa Premium",
      host: "John Doe",
      date: "2024-02-15",
      status: "pending",
      severity: "high",
    },
    {
      id: 2,
      type: "Safety Concern",
      reportedBy: "Guest",
      listing: "Mountain Cabin",
      host: "Jane Smith",
      date: "2024-02-14",
      status: "investigating",
      severity: "critical",
    },
    {
      id: 3,
      type: "Pricing Issue",
      reportedBy: "Guest",
      listing: "City Apartment",
      host: "Mike Johnson",
      date: "2024-02-13",
      status: "resolved",
      severity: "medium",
    },
    {
      id: 4,
      type: "Poor Communication",
      reportedBy: "Guest",
      listing: "Lake House",
      host: "Sarah Lee",
      date: "2024-02-12",
      status: "pending",
      severity: "low",
    },
    {
      id: 5,
      type: "Cleanliness",
      reportedBy: "Guest",
      listing: "Downtown Studio",
      host: "Tom Brown",
      date: "2024-02-11",
      status: "resolved",
      severity: "high",
    },
  ];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "low":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
      case "enforced":
      case "resolved":
        return "bg-emerald-500/10 text-emerald-400";
      case "pending":
        return "bg-amber-500/10 text-amber-400";
      case "investigating":
        return "bg-blue-500/10 text-blue-400";
      default:
        return "bg-slate-500/10 text-slate-400";
    }
  };

  const tabs = [
    { id: "cancellation", name: "Cancellation Policies", icon: XCircle },
    { id: "rules", name: "Rules & Regulations", icon: FileText },
    { id: "reports", name: "Violation Reports", icon: Flag },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Policy & Compliance
        </h1>
        <p className="text-slate-400">
          Manage platform policies, rules, and compliance reports
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-xs text-slate-400">Active</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">4</h3>
          <p className="text-sm text-slate-400">Policies</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <span className="text-xs text-slate-400">Enforced</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">5</h3>
          <p className="text-sm text-slate-400">Platform Rules</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span className="text-xs text-slate-400">Pending</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">2</h3>
          <p className="text-sm text-slate-400">Reports</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Flag className="w-5 h-5 text-red-400" />
            <span className="text-xs text-slate-400">Total</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">67</h3>
          <p className="text-sm text-slate-400">Violations</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="flex border-b border-slate-800 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* Cancellation Policies Tab */}
          {activeTab === "cancellation" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Cancellation Policies
                </h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                  <Plus className="w-4 h-4" />
                  Add Policy
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cancellationPolicies.map((policy) => (
                  <div
                    key={policy.id}
                    className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-1">
                          {policy.name}
                        </h4>
                        <p className="text-sm text-slate-400">
                          {policy.description}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          policy.status
                        )}`}
                      >
                        {policy.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-slate-900/50 rounded-lg p-3">
                        <p className="text-xs text-slate-400 mb-1">
                          Refund Rate
                        </p>
                        <p className="text-lg font-bold text-emerald-400">
                          {policy.refundPercentage}%
                        </p>
                      </div>
                      <div className="bg-slate-900/50 rounded-lg p-3">
                        <p className="text-xs text-slate-400 mb-1">
                          Time Window
                        </p>
                        <p className="text-lg font-bold text-indigo-400">
                          {policy.hoursBeforeCheckIn}h
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                      <p className="text-sm text-slate-400">
                        {policy.totalListings} listings using this policy
                      </p>
                      <div className="flex gap-2">
                        <button className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rules & Regulations Tab */}
          {activeTab === "rules" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Platform Rules & Regulations
                </h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                  <Plus className="w-4 h-4" />
                  Add Rule
                </button>
              </div>

              <div className="space-y-3">
                {platformRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400">
                            {rule.category}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(
                              rule.severity
                            )}`}
                          >
                            {rule.severity}
                          </span>
                        </div>
                        <p className="text-sm text-white font-medium">
                          {rule.rule}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-3 border-t border-slate-700">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span className="text-sm text-slate-400">
                          {rule.violations} violations reported
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span
                          className={`text-sm font-medium ${getStatusColor(
                            rule.status
                          )}`}
                        >
                          {rule.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Violation Reports Tab */}
          {activeTab === "reports" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Violation Reports
                </h3>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search reports..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full sm:w-64 pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-slate-600 transition-colors">
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">
                        Type
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">
                        Listing
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">
                        Host
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">
                        Severity
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {violationReports.map((report) => (
                      <tr
                        key={report.id}
                        className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-4 px-4 text-sm font-medium text-white">
                          {report.type}
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-300">
                          {report.listing}
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-400">
                          {report.host}
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-400">
                          {report.date}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(
                              report.severity
                            )}`}
                          >
                            {report.severity}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              report.status
                            )}`}
                          >
                            {report.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <button className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors">
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
