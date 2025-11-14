import { useState } from "react";
import {
  ShieldCheck,
  FileText,
  Download,
  DollarSign,
  Users,
  Calendar,
  Clock,
  CheckCircle,
} from "lucide-react";
import { toast } from "react-toastify";

export default function PolicyCompliance() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isExporting, setIsExporting] = useState(false);

  const tabs = [
    { id: "overview", name: "Overview", icon: ShieldCheck },
    { id: "guest", name: "Guest Policy", icon: Users },
    { id: "host", name: "Host Policy", icon: FileText },
    { id: "fees", name: "Service Fees", icon: DollarSign },
    { id: "data", name: "Data Retention", icon: Calendar },
  ];

  // Policy content from claude.md
  const policyContent = {
    overview: {
      title: "Privacy Policy & Terms of Service",
      lastUpdated: "October 29, 2025",
      description:
        "BookingNest is committed to protecting user privacy and ensuring transparent, fair business practices.",
    },
    serviceFees: [
      {
        type: "Guest Booking",
        fee: "5%",
        payer: "Guest",
        when: "Upon booking confirmation",
      },
      {
        type: "Host Listing",
        fee: "₱0",
        payer: "None",
        when: "Free unlimited listings",
      },
      {
        type: "Host Withdrawal",
        fee: "0%",
        payer: "None",
        when: "No fees",
      },
      {
        type: "Wallet Refund",
        fee: "0%",
        payer: "None",
        when: "No processing fee",
      },
    ],
    guestPolicy: {
      bookingProcess: [
        "Guest creates booking with status: PENDING",
        "Host receives notification",
        "Payment NOT deducted until host confirms",
        "Host confirms → payment deducted + 5% service fee charged",
      ],
      refundRights: [
        "Can Request: Before check-in date",
        "Host Approval: Full refund (including 5% fee) to wallet",
        "Host Denial: No refund, booking continues",
        "Timeline: 24-48 hours processing",
      ],
      eWalletFeatures: [
        "Fund using PayPal",
        "No additional fees for funding (PayPal rates apply)",
        "Used for all booking payments",
        "Full transaction history available",
      ],
    },
    hostPolicy: {
      listingManagement: [
        "Unlimited listings (stays, experiences, services)",
        "NO creation fees",
        "NO subscription fees",
        "Can edit, deactivate, or delete anytime",
      ],
      commissionStructure: [
        "5% service fee per confirmed booking",
        "Fee PAID BY GUEST, not deducted from host",
        "Example: ₱1,000 booking = Host receives ₱1,000, Guest pays ₱1,050",
      ],
      bookingManagement: [
        "Respond to requests within 24 hours",
        "Accept: Confirms booking, processes payment",
        "Reject: Provides rejection reason, no payment charged",
      ],
      refundHandling: [
        "Full Control: Can approve or deny refund requests",
        "No Charge: Host not charged for refunds",
        "Timeline: Respond within 24 hours",
      ],
    },
    paymentTerms: {
      currency: "Philippine Peso (₱)",
      paymentMethods: "PayPal integration only",
      hostPayouts: "Bank transfer (via PayPal)",
      frequency: "Weekly or monthly (configurable)",
      processing: "3-5 business days",
    },
    dataRetention: [
      {
        type: "Active bookings",
        duration: "Indefinitely",
      },
      {
        type: "Cancelled bookings",
        duration: "7 years (legal requirement)",
      },
      {
        type: "Messages",
        duration: "2 years after account closure",
      },
      {
        type: "Financial records",
        duration: "7 years (tax/legal)",
      },
    ],
  };

  const generatePDF = async () => {
    setIsExporting(true);

    try {
      // Dynamically import pdfMake (better for Vite/bundlers)
      const pdfMake = await import("pdfmake/build/pdfmake");
      const pdfFonts = await import("pdfmake/build/vfs_fonts");
      
      // Initialize fonts
      if (pdfMake.default) {
        pdfMake.default.vfs = pdfFonts.default || pdfFonts;
      }

      const pdfMakeInstance = pdfMake.default || pdfMake;

      const docDefinition = {
        content: [
          // Header
          {
            text: "BookingNest",
            style: "header",
            alignment: "center",
            color: "#4F46E5",
          },
          {
            text: "Privacy Policy & Terms of Service",
            style: "title",
            alignment: "center",
            margin: [0, 10, 0, 5],
          },
          {
            text: `Last Updated: ${policyContent.overview.lastUpdated}`,
            style: "subtitle",
            alignment: "center",
            margin: [0, 0, 0, 20],
          },
          {
            text: policyContent.overview.description,
            style: "description",
            margin: [0, 0, 0, 30],
          },

          // Service Fee Structure
          {
            text: "Service Fee Structure",
            style: "sectionHeader",
            margin: [0, 20, 0, 10],
          },
          {
            table: {
              headerRows: 1,
              widths: ["*", "auto", "auto", "*"],
              body: [
                [
                  { text: "Transaction Type", style: "tableHeader" },
                  { text: "Fee", style: "tableHeader" },
                  { text: "Payer", style: "tableHeader" },
                  { text: "When Charged", style: "tableHeader" },
                ],
                ...policyContent.serviceFees.map((fee) => [
                  fee.type,
                  fee.fee,
                  fee.payer,
                  fee.when,
                ]),
              ],
            },
            layout: {
              fillColor: function (rowIndex) {
                return rowIndex === 0 ? "#4F46E5" : rowIndex % 2 === 0 ? "#F1F5F9" : null;
              },
            },
            margin: [0, 0, 0, 20],
          },

          // Guest Policy
          {
            text: "GUEST POLICY HIGHLIGHTS",
            style: "sectionHeader",
            pageBreak: "before",
            margin: [0, 0, 0, 10],
          },
          {
            text: "Booking Process",
            style: "subsectionHeader",
            margin: [0, 10, 0, 5],
          },
          {
            ul: policyContent.guestPolicy.bookingProcess,
            margin: [0, 0, 0, 15],
          },
          {
            text: "Refund Rights",
            style: "subsectionHeader",
            margin: [0, 10, 0, 5],
          },
          {
            ul: policyContent.guestPolicy.refundRights,
            margin: [0, 0, 0, 15],
          },
          {
            text: "E-Wallet Features",
            style: "subsectionHeader",
            margin: [0, 10, 0, 5],
          },
          {
            ul: policyContent.guestPolicy.eWalletFeatures,
            margin: [0, 0, 0, 20],
          },

          // Host Policy
          {
            text: "HOST POLICY HIGHLIGHTS",
            style: "sectionHeader",
            pageBreak: "before",
            margin: [0, 0, 0, 10],
          },
          {
            text: "Listing Management",
            style: "subsectionHeader",
            margin: [0, 10, 0, 5],
          },
          {
            ul: policyContent.hostPolicy.listingManagement,
            margin: [0, 0, 0, 15],
          },
          {
            text: "Commission Structure",
            style: "subsectionHeader",
            margin: [0, 10, 0, 5],
          },
          {
            ul: policyContent.hostPolicy.commissionStructure,
            margin: [0, 0, 0, 15],
          },
          {
            text: "Booking Management",
            style: "subsectionHeader",
            margin: [0, 10, 0, 5],
          },
          {
            ul: policyContent.hostPolicy.bookingManagement,
            margin: [0, 0, 0, 15],
          },
          {
            text: "Refund Handling",
            style: "subsectionHeader",
            margin: [0, 10, 0, 5],
          },
          {
            ul: policyContent.hostPolicy.refundHandling,
            margin: [0, 0, 0, 20],
          },

          // Payment Terms
          {
            text: "PAYMENT & FINANCIAL TERMS",
            style: "sectionHeader",
            margin: [0, 20, 0, 10],
          },
          {
            ul: [
              `Currency: ${policyContent.paymentTerms.currency}`,
              `Payment Methods: ${policyContent.paymentTerms.paymentMethods}`,
              `Host Payouts: ${policyContent.paymentTerms.hostPayouts}`,
              `Frequency: ${policyContent.paymentTerms.frequency}`,
              `Processing: ${policyContent.paymentTerms.processing}`,
            ],
            margin: [0, 0, 0, 20],
          },

          // Data Retention
          {
            text: "DATA RETENTION",
            style: "sectionHeader",
            margin: [0, 20, 0, 10],
          },
          {
            table: {
              headerRows: 1,
              widths: ["*", "*"],
              body: [
                [
                  { text: "Data Type", style: "tableHeader" },
                  { text: "Retention Period", style: "tableHeader" },
                ],
                ...policyContent.dataRetention.map((item) => [
                  item.type,
                  item.duration,
                ]),
              ],
            },
            layout: {
              fillColor: function (rowIndex) {
                return rowIndex === 0 ? "#4F46E5" : rowIndex % 2 === 0 ? "#F1F5F9" : null;
              },
            },
            margin: [0, 0, 0, 20],
          },

          // Footer
          {
            text: "---",
            alignment: "center",
            margin: [0, 30, 0, 10],
          },
          {
            text: "BookingNest - Comprehensive Multi-Role Booking Platform",
            style: "footer",
            alignment: "center",
          },
          {
            text: "For questions or concerns, please contact support@bookingnest.com",
            style: "footer",
            alignment: "center",
            margin: [0, 5, 0, 0],
          },
        ],
        styles: {
          header: {
            fontSize: 28,
            bold: true,
            margin: [0, 20, 0, 0],
          },
          title: {
            fontSize: 20,
            bold: true,
          },
          subtitle: {
            fontSize: 12,
            italics: true,
            color: "#64748B",
          },
          description: {
            fontSize: 12,
            alignment: "justify",
          },
          sectionHeader: {
            fontSize: 16,
            bold: true,
            color: "#1E293B",
          },
          subsectionHeader: {
            fontSize: 14,
            bold: true,
            color: "#475569",
          },
          tableHeader: {
            bold: true,
            fontSize: 11,
            color: "white",
          },
          footer: {
            fontSize: 10,
            color: "#64748B",
          },
        },
        defaultStyle: {
          fontSize: 11,
          lineHeight: 1.3,
        },
      };

      pdfMakeInstance.createPdf(docDefinition).download("BookingNest-Policy-Compliance.pdf");
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Policy & Compliance
          </h1>
          <p className="text-slate-400">
            Platform policies and terms of service
          </p>
        </div>
        <button
          onClick={generatePDF}
          disabled={isExporting}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-5 h-5" />
          {isExporting ? "Exporting..." : "Export to PDF"}
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-xs text-slate-400">Active</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            {policyContent.serviceFees.length}
          </h3>
          <p className="text-sm text-slate-400">Fee Structures</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <span className="text-xs text-slate-400">Policy</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">2</h3>
          <p className="text-sm text-slate-400">User Types</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <span className="text-xs text-slate-400">Retention</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            {policyContent.dataRetention.length}
          </h3>
          <p className="text-sm text-slate-400">Data Types</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <span className="text-xs text-slate-400">Updated</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">Oct 29</h3>
          <p className="text-sm text-slate-400">2025</p>
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
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {policyContent.overview.title}
                    </h3>
                    <p className="text-slate-300 mb-3">
                      {policyContent.overview.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Calendar className="w-4 h-4" />
                      <span>Last Updated: {policyContent.overview.lastUpdated}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Users className="w-5 h-5 text-emerald-400" />
                    <h4 className="font-semibold text-white">Guest Policy</h4>
                  </div>
                  <p className="text-sm text-slate-400">
                    5% service fee on bookings, full refund rights, secure
                    e-wallet payments
                  </p>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <FileText className="w-5 h-5 text-indigo-400" />
                    <h4 className="font-semibold text-white">Host Policy</h4>
                  </div>
                  <p className="text-sm text-slate-400">
                    Unlimited free listings, no commission deduction, full
                    control over bookings
                  </p>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <DollarSign className="w-5 h-5 text-amber-400" />
                    <h4 className="font-semibold text-white">Payment Terms</h4>
                  </div>
                  <p className="text-sm text-slate-400">
                    PayPal integration, weekly/monthly payouts, 3-5 day
                    processing
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Guest Policy Tab */}
          {activeTab === "guest" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-4">
                  Guest Policy Highlights
                </h3>

                {/* Booking Process */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 mb-4">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-indigo-400" />
                    Booking Process
                  </h4>
                  <ul className="space-y-2">
                    {policyContent.guestPolicy.bookingProcess.map(
                      (item, index) => (
                        <li
                          key={index}
                          className="text-slate-300 text-sm flex items-start gap-2"
                        >
                          <span className="text-indigo-400 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>

                {/* Refund Rights */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 mb-4">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    Refund Rights
                  </h4>
                  <ul className="space-y-2">
                    {policyContent.guestPolicy.refundRights.map((item, index) => (
                      <li
                        key={index}
                        className="text-slate-300 text-sm flex items-start gap-2"
                      >
                        <span className="text-emerald-400 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* E-Wallet Features */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-amber-400" />
                    E-Wallet Features
                  </h4>
                  <ul className="space-y-2">
                    {policyContent.guestPolicy.eWalletFeatures.map(
                      (item, index) => (
                        <li
                          key={index}
                          className="text-slate-300 text-sm flex items-start gap-2"
                        >
                          <span className="text-amber-400 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Host Policy Tab */}
          {activeTab === "host" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-4">
                  Host Policy Highlights
                </h3>

                {/* Listing Management */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 mb-4">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-indigo-400" />
                    Listing Management
                  </h4>
                  <ul className="space-y-2">
                    {policyContent.hostPolicy.listingManagement.map(
                      (item, index) => (
                        <li
                          key={index}
                          className="text-slate-300 text-sm flex items-start gap-2"
                        >
                          <span className="text-indigo-400 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>

                {/* Commission Structure */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 mb-4">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    Commission Structure
                  </h4>
                  <ul className="space-y-2">
                    {policyContent.hostPolicy.commissionStructure.map(
                      (item, index) => (
                        <li
                          key={index}
                          className="text-slate-300 text-sm flex items-start gap-2"
                        >
                          <span className="text-emerald-400 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>

                {/* Booking Management */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 mb-4">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-amber-400" />
                    Booking Management
                  </h4>
                  <ul className="space-y-2">
                    {policyContent.hostPolicy.bookingManagement.map(
                      (item, index) => (
                        <li
                          key={index}
                          className="text-slate-300 text-sm flex items-start gap-2"
                        >
                          <span className="text-amber-400 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>

                {/* Refund Handling */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-400" />
                    Refund Handling
                  </h4>
                  <ul className="space-y-2">
                    {policyContent.hostPolicy.refundHandling.map((item, index) => (
                      <li
                        key={index}
                        className="text-slate-300 text-sm flex items-start gap-2"
                      >
                        <span className="text-blue-400 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Service Fees Tab */}
          {activeTab === "fees" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-4">
                  Service Fee Structure
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">
                          Transaction Type
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">
                          Fee
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">
                          Payer
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">
                          When Charged
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {policyContent.serviceFees.map((fee, index) => (
                        <tr
                          key={index}
                          className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="py-4 px-4 text-sm font-medium text-white">
                            {fee.type}
                          </td>
                          <td className="py-4 px-4 text-sm">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                fee.fee === "₱0" || fee.fee === "0%"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : "bg-indigo-500/10 text-indigo-400"
                              }`}
                            >
                              {fee.fee}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm text-slate-300">
                            {fee.payer}
                          </td>
                          <td className="py-4 px-4 text-sm text-slate-400">
                            {fee.when}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Payment Terms */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 mt-6">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-amber-400" />
                    Payment & Financial Terms
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Currency</p>
                      <p className="text-sm text-white font-medium">
                        {policyContent.paymentTerms.currency}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">
                        Payment Methods
                      </p>
                      <p className="text-sm text-white font-medium">
                        {policyContent.paymentTerms.paymentMethods}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Host Payouts</p>
                      <p className="text-sm text-white font-medium">
                        {policyContent.paymentTerms.hostPayouts}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Frequency</p>
                      <p className="text-sm text-white font-medium">
                        {policyContent.paymentTerms.frequency}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">
                        Processing Time
                      </p>
                      <p className="text-sm text-white font-medium">
                        {policyContent.paymentTerms.processing}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Data Retention Tab */}
          {activeTab === "data" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-4">
                  Data Retention Policy
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">
                          Data Type
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">
                          Retention Period
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {policyContent.dataRetention.map((item, index) => (
                        <tr
                          key={index}
                          className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="py-4 px-4 text-sm font-medium text-white">
                            {item.type}
                          </td>
                          <td className="py-4 px-4 text-sm text-slate-300">
                            {item.duration}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 mt-6">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-300 mb-2">
                        Data Protection Notice
                      </h4>
                      <p className="text-sm text-slate-300">
                        All data is stored securely with encryption at rest and in
                        transit. We comply with data protection regulations and
                        ensure user privacy is maintained throughout the retention
                        period. Users can request data deletion in accordance with
                        applicable laws.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
