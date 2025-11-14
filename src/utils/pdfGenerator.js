import pdfMakeLib from "pdfmake/build/pdfmake";
import * as pdfFontsLib from "pdfmake/build/vfs_fonts";
import { formatCurrency } from "./adminAnalytics";
import { formatDateRange } from "./reportUtils";

// Get the pdfMake instance
const pdfMake = pdfMakeLib.default || pdfMakeLib;

// Initialize fonts - the VFS is directly the imported object
if (pdfFontsLib.pdfMake && pdfFontsLib.pdfMake.vfs) {
  // Old structure: { pdfMake: { vfs: {...} } }
  pdfMake.vfs = pdfFontsLib.pdfMake.vfs;
} else if (typeof pdfFontsLib === 'object' && Object.keys(pdfFontsLib).some(key => key.endsWith('.ttf'))) {
  // New structure: direct VFS object with .ttf files
  pdfMake.vfs = pdfFontsLib;
} else {
  console.error("Unable to load pdfMake fonts. Structure:", pdfFontsLib);
}

/**
 * PDF Generation Utility for BookingNest Reports
 * Professional, minimalist design matching the project theme
 */

// ============================================
// COLOR SCHEME (Dark theme to match project)
// ============================================

const COLORS = {
  primary: "#6366F1", // Indigo-500
  secondary: "#0F172A", // Slate-900
  accent: "#10B981", // Emerald-500
  text: "#F8FAFC", // Slate-50
  textMuted: "#94A3B8", // Slate-400
  border: "#1E293B", // Slate-800
  background: "#0F172A", // Slate-900
};

// ============================================
// LOGO (Base64 - will be loaded dynamically)
// ============================================

let logoBase64 = null;

// Load logo as base64
const loadLogo = async () => {
  if (logoBase64) return logoBase64;

  try {
    const response = await fetch('/BookingNestLogo.png');
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        logoBase64 = reader.result;
        resolve(logoBase64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error loading logo:", error);
    return null;
  }
};

// ============================================
// PDF HEADER & FOOTER
// ============================================

const getHeader = (reportTitle, logo = null) => {
  const headerContent = {
    columns: [],
    margin: [40, 30, 40, 20],
  };

  // Add logo if available
  if (logo) {
    headerContent.columns.push({
      image: logo,
      width: 40,
      height: 40,
      alignment: 'left',
    });
  }

  headerContent.columns.push({
    stack: [
      {
        text: "BookingNest",
        style: "headerTitle",
      },
      {
        text: reportTitle,
        style: "headerSubtitle",
      },
    ],
    width: "*",
    margin: logo ? [10, 0, 0, 0] : [0, 0, 0, 0],
  });

  return headerContent;
};

const getFooter = (currentPage, pageCount) => {
  return {
    columns: [
      {
        text: `Generated on ${new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`,
        style: "footer",
        width: "*",
      },
      {
        text: `Page ${currentPage} of ${pageCount}`,
        style: "footer",
        alignment: "right",
        width: "auto",
      },
    ],
    margin: [40, 10, 40, 30],
  };
};

// ============================================
// STYLES
// ============================================

const styles = {
  headerTitle: {
    fontSize: 20,
    bold: true,
    color: COLORS.primary,
    margin: [0, 0, 0, 5],
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  headerDate: {
    fontSize: 10,
    color: COLORS.textMuted,
    margin: [0, 5, 0, 0],
  },
  footer: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  title: {
    fontSize: 24,
    bold: true,
    color: "#1F2937",
    margin: [0, 0, 0, 10],
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    margin: [0, 0, 0, 20],
  },
  sectionHeader: {
    fontSize: 16,
    bold: true,
    color: "#1F2937",
    margin: [0, 15, 0, 10],
  },
  metricLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    margin: [0, 0, 0, 3],
  },
  metricValue: {
    fontSize: 18,
    bold: true,
    color: "#1F2937",
  },
  tableHeader: {
    fontSize: 11,
    bold: true,
    color: "#1F2937",
    fillColor: "#F1F5F9",
    margin: [5, 5, 5, 5],
  },
  tableCell: {
    fontSize: 10,
    color: "#374151",
    margin: [5, 5, 5, 5],
  },
  smallText: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
};

// ============================================
// METRIC CARD COMPONENT
// ============================================

const createMetricCard = (label, value, icon = null) => {
  return {
    stack: [
      { text: label, style: "metricLabel" },
      { text: value, style: "metricValue" },
    ],
    margin: [0, 0, 0, 15],
  };
};

// ============================================
// FINANCIAL REPORT PDF
// ============================================

export const generateFinancialReportPDF = async (data) => {
  // Load logo
  const logo = await loadLogo();

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [40, 80, 40, 60],
    header: (currentPage, pageCount) => {
      return getHeader("Financial Report", logo);
    },
    footer: getFooter,
    content: [
      // Title Section
      { text: "Financial Report", style: "title" },
      {
        text: formatDateRange(data.dateRange),
        style: "subtitle",
      },

      // Summary Metrics
      { text: "Summary", style: "sectionHeader" },
      {
        columns: [
          createMetricCard("Total Revenue", formatCurrency(data.totalRevenue)),
          createMetricCard(
            "Gross Revenue",
            formatCurrency(data.grossRevenue)
          ),
          createMetricCard("Transactions", data.transactions.toString()),
        ],
      },
      {
        columns: [
          createMetricCard(
            "Service Fees",
            formatCurrency(data.serviceFees)
          ),
          createMetricCard(
            "Host Registration Fees",
            formatCurrency(data.hostRegistrationFees || 0)
          ),
          createMetricCard(
            "Refunds",
            formatCurrency(data.refunds)
          ),
        ],
      },

      // Revenue by Type
      { text: "Revenue by Listing Type", style: "sectionHeader" },
      {
        table: {
          widths: ["*", "auto"],
          body: [
            [
              { text: "Listing Type", style: "tableHeader" },
              { text: "Revenue", style: "tableHeader" },
            ],
            [
              { text: "Stays", style: "tableCell" },
              {
                text: formatCurrency(data.revenueByType.stays),
                style: "tableCell",
                alignment: "right",
              },
            ],
            [
              { text: "Experiences", style: "tableCell" },
              {
                text: formatCurrency(data.revenueByType.experiences),
                style: "tableCell",
                alignment: "right",
              },
            ],
            [
              { text: "Services", style: "tableCell" },
              {
                text: formatCurrency(data.revenueByType.services),
                style: "tableCell",
                alignment: "right",
              },
            ],
            [
              { text: "Total", style: "tableHeader" },
              {
                text: formatCurrency(
                  data.revenueByType.stays +
                    data.revenueByType.experiences +
                    data.revenueByType.services
                ),
                style: "tableHeader",
                alignment: "right",
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0,
          hLineColor: () => "#E2E8F0",
        },
        margin: [0, 0, 0, 20],
      },

      // Note
      {
        text: "Note: Revenue represents 5% service fee collected from confirmed bookings.",
        style: "smallText",
        margin: [0, 10, 0, 0],
      },
    ],
    styles,
  };

  pdfMake.createPdf(docDefinition).download(`financial-report-${Date.now()}.pdf`);
};

// ============================================
// BOOKINGS REPORT PDF
// ============================================

export const generateBookingsReportPDF = async (data) => {
  // Load logo
  const logo = await loadLogo();

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [40, 80, 40, 60],
    header: (currentPage, pageCount) => {
      return getHeader("Bookings Report", logo);
    },
    footer: getFooter,
    content: [
      // Title Section
      { text: "Bookings Report", style: "title" },
      {
        text: formatDateRange(data.dateRange),
        style: "subtitle",
      },

      // Summary Metrics
      { text: "Booking Statistics", style: "sectionHeader" },
      {
        columns: [
          createMetricCard("Total Bookings", data.totalBookings.toString()),
          createMetricCard(
            "Confirmed Bookings",
            data.confirmedBookings.toString()
          ),
          createMetricCard(
            "Completed Bookings",
            data.completedBookings.toString()
          ),
        ],
      },
      {
        columns: [
          createMetricCard(
            "Cancelled Bookings",
            data.cancelledBookings.toString()
          ),
          createMetricCard(
            "Refunded Bookings",
            data.refundedBookings.toString()
          ),
          createMetricCard(
            "Completion Rate",
            `${data.completionRate.toFixed(1)}%`
          ),
        ],
      },
      {
        columns: [
          createMetricCard(
            "Average Value",
            formatCurrency(data.averageBookingValue)
          ),
          { text: "" },
          { text: "" },
        ],
      },

      // Bookings by Type
      { text: "Bookings by Type", style: "sectionHeader" },
      {
        table: {
          widths: ["*", "auto", "auto"],
          body: [
            [
              { text: "Type", style: "tableHeader" },
              { text: "Count", style: "tableHeader" },
              { text: "Percentage", style: "tableHeader" },
            ],
            [
              { text: "Stays", style: "tableCell" },
              {
                text: data.bookingsByType.stays.toString(),
                style: "tableCell",
                alignment: "center",
              },
              {
                text: `${((data.bookingsByType.stays / data.totalBookings) * 100).toFixed(1)}%`,
                style: "tableCell",
                alignment: "center",
              },
            ],
            [
              { text: "Experiences", style: "tableCell" },
              {
                text: data.bookingsByType.experiences.toString(),
                style: "tableCell",
                alignment: "center",
              },
              {
                text: `${((data.bookingsByType.experiences / data.totalBookings) * 100).toFixed(1)}%`,
                style: "tableCell",
                alignment: "center",
              },
            ],
            [
              { text: "Services", style: "tableCell" },
              {
                text: data.bookingsByType.services.toString(),
                style: "tableCell",
                alignment: "center",
              },
              {
                text: `${((data.bookingsByType.services / data.totalBookings) * 100).toFixed(1)}%`,
                style: "tableCell",
                alignment: "center",
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0,
          hLineColor: () => "#E2E8F0",
        },
        margin: [0, 0, 0, 20],
      },

      // Status Breakdown
      { text: "Status Breakdown", style: "sectionHeader" },
      {
        table: {
          widths: ["*", "auto"],
          body: [
            [
              { text: "Status", style: "tableHeader" },
              { text: "Count", style: "tableHeader" },
            ],
            [
              { text: "Pending", style: "tableCell" },
              {
                text: data.statusBreakdown.pending.toString(),
                style: "tableCell",
                alignment: "right",
              },
            ],
            [
              { text: "Confirmed", style: "tableCell" },
              {
                text: data.statusBreakdown.confirmed.toString(),
                style: "tableCell",
                alignment: "right",
              },
            ],
            [
              { text: "Completed", style: "tableCell" },
              {
                text: data.statusBreakdown.completed.toString(),
                style: "tableCell",
                alignment: "right",
              },
            ],
            [
              { text: "Rejected", style: "tableCell" },
              {
                text: data.statusBreakdown.rejected.toString(),
                style: "tableCell",
                alignment: "right",
              },
            ],
            [
              { text: "Refunded", style: "tableCell" },
              {
                text: data.statusBreakdown.refunded.toString(),
                style: "tableCell",
                alignment: "right",
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0,
          hLineColor: () => "#E2E8F0",
        },
      },
    ],
    styles,
  };

  pdfMake.createPdf(docDefinition).download(`bookings-report-${Date.now()}.pdf`);
};

// ============================================
// HOST PERFORMANCE REPORT PDF
// ============================================

export const generateHostPerformanceReportPDF = async (data) => {
  // Load logo
  const logo = await loadLogo();

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [40, 80, 40, 60],
    header: (currentPage, pageCount) => {
      return getHeader("Host Performance Report", logo);
    },
    footer: getFooter,
    content: [
      // Title Section
      { text: "Host Performance Report", style: "title" },
      {
        text: formatDateRange(data.dateRange),
        style: "subtitle",
      },

      // Summary Metrics
      { text: "Overall Performance", style: "sectionHeader" },
      {
        columns: [
          createMetricCard("Total Hosts", data.totalHosts.toString()),
          createMetricCard("Active Hosts", data.activeHosts.toString()),
          createMetricCard(
            "Average Rating",
            data.averageRating.toFixed(2) + " / 5.00"
          ),
        ],
      },
      {
        columns: [
          createMetricCard(
            "Total Earnings",
            formatCurrency(data.totalEarnings)
          ),
          createMetricCard(
            "Average Earnings",
            formatCurrency(data.averageEarnings)
          ),
          { text: "" }, // Empty column for alignment
        ],
      },

      // Top Performing Hosts
      { text: "Top Performing Hosts", style: "sectionHeader" },
      {
        table: {
          widths: ["*", "auto", "auto", "auto", "auto"],
          body: [
            [
              { text: "Host Name", style: "tableHeader" },
              { text: "Listings", style: "tableHeader", alignment: "center" },
              { text: "Bookings", style: "tableHeader", alignment: "center" },
              { text: "Earnings", style: "tableHeader", alignment: "right" },
              { text: "Rating", style: "tableHeader", alignment: "center" },
            ],
            ...data.topHosts.map((host) => [
              { text: host.hostName, style: "tableCell" },
              {
                text: host.totalListings.toString(),
                style: "tableCell",
                alignment: "center",
              },
              {
                text: host.confirmedBookings.toString(),
                style: "tableCell",
                alignment: "center",
              },
              {
                text: formatCurrency(host.totalEarnings),
                style: "tableCell",
                alignment: "right",
              },
              {
                text:
                  host.averageRating > 0
                    ? host.averageRating.toFixed(2)
                    : "N/A",
                style: "tableCell",
                alignment: "center",
              },
            ]),
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0,
          hLineColor: () => "#E2E8F0",
        },
      },
    ],
    styles,
  };

  pdfMake
    .createPdf(docDefinition)
    .download(`host-performance-report-${Date.now()}.pdf`);
};

// ============================================
// LISTING ANALYTICS REPORT PDF
// ============================================

export const generateListingAnalyticsReportPDF = async (data) => {
  // Load logo
  const logo = await loadLogo();

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [40, 80, 40, 60],
    header: (currentPage, pageCount) => {
      return getHeader("Listing Analytics Report", logo);
    },
    footer: getFooter,
    content: [
      // Title Section
      { text: "Listing Analytics Report", style: "title" },
      {
        text: formatDateRange(data.dateRange),
        style: "subtitle",
      },

      // Summary Metrics
      { text: "Listing Statistics", style: "sectionHeader" },
      {
        columns: [
          createMetricCard("Total Listings", data.totalListings.toString()),
          createMetricCard(
            "Active Listings",
            data.activeListings.toString()
          ),
          createMetricCard("New Listings", data.newListings.toString()),
        ],
      },
      {
        columns: [
          createMetricCard(
            "Conversion Rate",
            `${data.conversionRate.toFixed(2)}%`
          ),
          { text: "" },
          { text: "" },
        ],
      },

      // Listings by Type
      { text: "Listings by Type", style: "sectionHeader" },
      {
        table: {
          widths: ["*", "auto", "auto"],
          body: [
            [
              { text: "Type", style: "tableHeader" },
              { text: "Count", style: "tableHeader" },
              { text: "Percentage", style: "tableHeader" },
            ],
            [
              { text: "Stays", style: "tableCell" },
              {
                text: data.listingsByType.stays.toString(),
                style: "tableCell",
                alignment: "center",
              },
              {
                text: `${((data.listingsByType.stays / data.totalListings) * 100).toFixed(1)}%`,
                style: "tableCell",
                alignment: "center",
              },
            ],
            [
              { text: "Experiences", style: "tableCell" },
              {
                text: data.listingsByType.experiences.toString(),
                style: "tableCell",
                alignment: "center",
              },
              {
                text: `${((data.listingsByType.experiences / data.totalListings) * 100).toFixed(1)}%`,
                style: "tableCell",
                alignment: "center",
              },
            ],
            [
              { text: "Services", style: "tableCell" },
              {
                text: data.listingsByType.services.toString(),
                style: "tableCell",
                alignment: "center",
              },
              {
                text: `${((data.listingsByType.services / data.totalListings) * 100).toFixed(1)}%`,
                style: "tableCell",
                alignment: "center",
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0,
          hLineColor: () => "#E2E8F0",
        },
        margin: [0, 0, 0, 20],
      },

      // Top Performing Listings
      { text: "Top Performing Listings", style: "sectionHeader" },
      {
        table: {
          widths: ["*", "auto", "auto", "auto", "auto"],
          body: [
            [
              { text: "Listing Title", style: "tableHeader" },
              { text: "Type", style: "tableHeader", alignment: "center" },
              { text: "Bookings", style: "tableHeader", alignment: "center" },
              { text: "Revenue", style: "tableHeader", alignment: "right" },
              { text: "Rating", style: "tableHeader", alignment: "center" },
            ],
            ...data.topListings.slice(0, 10).map((listing) => [
              {
                text: listing.title.substring(0, 40) + (listing.title.length > 40 ? "..." : ""),
                style: "tableCell",
              },
              {
                text: listing.type.charAt(0).toUpperCase() + listing.type.slice(1),
                style: "tableCell",
                alignment: "center",
              },
              {
                text: listing.bookingCount.toString(),
                style: "tableCell",
                alignment: "center",
              },
              {
                text: formatCurrency(listing.totalRevenue),
                style: "tableCell",
                alignment: "right",
              },
              {
                text:
                  listing.averageRating > 0
                    ? listing.averageRating.toFixed(2)
                    : "N/A",
                style: "tableCell",
                alignment: "center",
              },
            ]),
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0,
          hLineColor: () => "#E2E8F0",
        },
      },
    ],
    styles,
  };

  pdfMake
    .createPdf(docDefinition)
    .download(`listing-analytics-report-${Date.now()}.pdf`);
};
