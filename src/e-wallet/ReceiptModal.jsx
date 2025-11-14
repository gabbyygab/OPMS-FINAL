import { useRef } from "react";
import { toast } from "react-toastify";
import pdfMake from "pdfmake/build/pdfmake";
import * as vfsFonts from "pdfmake/build/vfs_fonts";

// Initialize pdfMake with fonts (handle new pdfmake v0.2.x structure)
if (vfsFonts.pdfMake && vfsFonts.pdfMake.vfs) {
  pdfMake.vfs = vfsFonts.pdfMake.vfs;
} else if (typeof vfsFonts === 'object' && Object.keys(vfsFonts).some(key => key.endsWith('.ttf'))) {
  pdfMake.vfs = vfsFonts;
}

export default function ReceiptModal({ transaction, user, onClose }) {
  const receiptRef = useRef(null);

  const formatDate = (timestamp) => {
    if (!timestamp) return "—";
    const date = new Date(timestamp.toDate ? timestamp.toDate() : timestamp);
    return date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTransactionTypeLabel = (type) => {
    const labels = {
      payment: "Payment",
      refund: "Refund",
      deposit: "Deposit",
      withdrawal: "Withdrawal",
    };
    return labels[type] || type;
  };

  const exportToPDF = async () => {
    try {
      // Define fonts for pdfmake
      const fonts = {
        Roboto: {
          normal: "Roboto-Regular.ttf",
          bold: "Roboto-Medium.ttf",
          italics: "Roboto-Italic.ttf",
          bolditalics: "Roboto-MediumItalic.ttf",
        },
      };

      // Define the PDF document structure
      const docDefinition = {
        content: [
          // Header
          {
            text: "BookingNest",
            fontSize: 32,
            bold: true,
            alignment: "center",
            margin: [0, 0, 0, 8],
          },
          {
            text: "E-Wallet Transaction Receipt",
            fontSize: 14,
            color: "#6b7280",
            alignment: "center",
            margin: [0, 0, 0, 15],
          },
          {
            canvas: [
              {
                type: "line",
                x1: 0,
                y1: 0,
                x2: 515,
                y2: 0,
                lineWidth: 0.5,
                lineColor: "#e5e7eb",
              },
            ],
            margin: [0, 0, 0, 12],
          },

          // Receipt Info
          {
            columns: [
              { text: "Receipt Number:", bold: true, width: "50%" },
              {
                text: transaction.id.slice(0, 12).toUpperCase(),
                width: "50%",
                alignment: "right",
              },
            ],
            margin: [0, 0, 0, 8],
            fontSize: 11,
          },
          {
            columns: [
              { text: "Transaction Type:", bold: true, width: "50%" },
              {
                text: getTransactionTypeLabel(transaction.type),
                width: "50%",
                alignment: "right",
              },
            ],
            margin: [0, 0, 0, 8],
            fontSize: 11,
          },
          {
            columns: [
              { text: "Status:", bold: true, width: "50%" },
              {
                text: transaction.status.toUpperCase(),
                width: "50%",
                alignment: "right",
                bold: true,
              },
            ],
            margin: [0, 0, 0, 15],
            fontSize: 11,
          },

          // Separator
          {
            canvas: [
              {
                type: "line",
                x1: 0,
                y1: 0,
                x2: 515,
                y2: 0,
                lineWidth: 0.5,
                lineColor: "#e5e7eb",
              },
            ],
            margin: [0, 0, 0, 12],
          },

          // Transaction Details Section
          {
            text: "TRANSACTION DETAILS",
            fontSize: 12,
            bold: true,
            margin: [0, 0, 0, 10],
          },

          {
            text: "Transaction ID",
            fontSize: 10,
            bold: true,
            color: "#6b7280",
            margin: [0, 0, 0, 2],
          },
          {
            text: transaction.id,
            fontSize: 11,
            margin: [0, 0, 0, 10],
          },

          {
            text: "Date & Time",
            fontSize: 10,
            bold: true,
            color: "#6b7280",
            margin: [0, 0, 0, 2],
          },
          {
            text: formatDate(transaction.created_at),
            fontSize: 11,
            margin: [0, 0, 0, 10],
          },

          {
            text: "Guest Name",
            fontSize: 10,
            bold: true,
            color: "#6b7280",
            margin: [0, 0, 0, 2],
          },
          {
            text: transaction.guestName || user?.displayName || "N/A",
            fontSize: 11,
            margin: [0, 0, 0, 10],
          },

          {
            text: "Email",
            fontSize: 10,
            bold: true,
            color: "#6b7280",
            margin: [0, 0, 0, 2],
          },
          {
            text: transaction.email || user?.email || "N/A",
            fontSize: 11,
            margin: [0, 0, 0, 10],
          },

          ...(transaction.type === "withdrawal" && transaction.paypal_email
            ? [
                {
                  text: "PayPal Email",
                  fontSize: 10,
                  bold: true,
                  color: "#6b7280",
                  margin: [0, 0, 0, 2],
                },
                {
                  text: transaction.paypal_email,
                  fontSize: 11,
                  margin: [0, 0, 0, 10],
                },
              ]
            : []),

          ...(transaction.paypal_batch_id
            ? [
                {
                  text: "Batch ID",
                  fontSize: 10,
                  bold: true,
                  color: "#6b7280",
                  margin: [0, 0, 0, 2],
                },
                {
                  text: transaction.paypal_batch_id,
                  fontSize: 11,
                  margin: [0, 0, 0, 10],
                },
              ]
            : []),

          // Separator
          {
            canvas: [
              {
                type: "line",
                x1: 0,
                y1: 0,
                x2: 515,
                y2: 0,
                lineWidth: 0.5,
                lineColor: "#e5e7eb",
              },
            ],
            margin: [0, 15, 0, 15],
          },

          // Amount Section
          {
            columns: [
              { text: "Total Amount", fontSize: 16, bold: true, width: "50%" },
              {
                text: `\u20B1${Math.abs(transaction.amount).toFixed(2)}`,
                fontSize: 28,
                bold: true,
                width: "50%",
                alignment: "right",
              },
            ],
            margin: [0, 0, 0, 8],
          },
          {
            text:
              transaction.amount > 0
                ? "Amount credited to your wallet"
                : "Amount deducted from your wallet",
            fontSize: 10,
            color: "#6b7280",
            alignment: "right",
            margin: [0, 0, 0, 15],
          },

          // Separator
          {
            canvas: [
              {
                type: "line",
                x1: 0,
                y1: 0,
                x2: 515,
                y2: 0,
                lineWidth: 0.5,
                lineColor: "#e5e7eb",
              },
            ],
            margin: [0, 0, 0, 12],
          },

          // Footer
          {
            text: "Thank you for using BookingNest!",
            fontSize: 11,
            bold: true,
            alignment: "center",
            margin: [0, 0, 0, 8],
          },
          {
            text: "www.bookingnest.com",
            fontSize: 11,
            alignment: "center",
            margin: [0, 0, 0, 8],
          },
          {
            text: `© ${new Date().getFullYear()} BookingNest. All rights reserved.`,
            fontSize: 9,
            color: "#9ca3af",
            alignment: "center",
          },
        ],
        pageSize: "A4",
        pageMargins: [40, 40, 40, 40],
        defaultStyle: {
          font: "Roboto",
        },
      };

      // Generate and download PDF
      pdfMake
        .createPdf(docDefinition, null, fonts, pdfMake.vfs)
        .download(
          `BookingNest-Receipt-${transaction.id.slice(0, 8)}.pdf`
        );

      toast.success("Receipt downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate receipt");
    }
  };

  const printReceipt = () => {
    if (!receiptRef.current) return;

    const printWindow = window.open("", "_blank");
    const receiptHtml = receiptRef.current.innerHTML;

    const styles = `
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f9fafb;
        }
        .receipt-container {
          max-width: 320px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background-color: #ffffff;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .text-center { text-align: center; }
        .mb-4 { margin-bottom: 1rem; }
        .pb-3 { padding-bottom: 0.75rem; }
        .border-b { border-bottom: 1px solid #e5e7eb; }
        .text-xl { font-size: 1.25rem; }
        .font-bold { font-weight: 700; }
        .text-gray-900 { color: #111827; }
        .text-xs { font-size: 0.75rem; }
        .text-gray-500 { color: #6b7280; }
        .space-y-2 > * + * { margin-top: 0.5rem; }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .text-gray-600 { color: #4b5563; }
        .font-semibold { font-weight: 600; }
        .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .break-all { word-break: break-all; }
        .items-center { align-items: center; }
        .text-base { font-size: 1rem; }
        .space-y-1 > * + * { margin-top: 0.25rem; }
      </style>
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Receipt</title>
          ${styles}
        </head>
        <body>
          <div class="receipt-container">
            ${receiptHtml}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 flex items-center justify-between border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Transaction Receipt
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:bg-gray-100 rounded-full p-2 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Receipt Container - For Display and PDF */}
        <div className="flex flex-col gap-4">
          {/* Screen Display Receipt */}
          <div
            ref={receiptRef}
            className="p-6 border border-gray-300 bg-white rounded-lg font-mono text-sm shadow-sm"
            style={{
              maxWidth: "320px",
              margin: "24px auto",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            {/* Header */}
            <div className="text-center mb-4 pb-3 border-b border-gray-300">
              <h2 className="text-xl font-bold text-gray-900">BookingNest</h2>
              <p className="text-xs text-gray-500">
                E-Wallet Transaction Receipt
              </p>
            </div>

            {/* Details */}
            <div className="mb-4 pb-3 border-b border-gray-300 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="text-gray-900 font-semibold truncate">
                  {transaction.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date & Time:</span>
                <span className="text-gray-900 font-semibold">
                  {formatDate(transaction.created_at)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Guest Name:</span>
                <span className="text-gray-900 font-semibold">
                  {transaction.guestName || user?.displayName || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="text-gray-900 font-semibold break-all">
                  {transaction.email || user?.email || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="text-gray-900 font-semibold">
                  {getTransactionTypeLabel(transaction.type)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-bold text-gray-900">
                  {transaction.status.toUpperCase()}
                </span>
              </div>
              {transaction.type === "withdrawal" && transaction.paypal_email && (
                <div className="flex justify-between">
                  <span className="text-gray-600">PayPal Email:</span>
                  <span className="text-gray-900 font-semibold break-all">
                    {transaction.paypal_email}
                  </span>
                </div>
              )}
              {transaction.paypal_batch_id && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Batch ID:</span>
                  <span className="text-gray-900 font-semibold break-all">
                    {transaction.paypal_batch_id}
                  </span>
                </div>
              )}
            </div>

            {/* Amount */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-300">
              <span className="text-base font-bold text-gray-900">Amount</span>
              <span className="text-xl font-bold text-gray-900">
                {transaction.amount > 0 ? "+" : "-"} ₱
                {Math.abs(transaction.amount).toFixed(2)}
              </span>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-500 space-y-1">
              <p className="font-semibold">Thank you for choosing BookingNest!</p>
              <p>www.bookingnest.com</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={printReceipt}
            className="flex-1 bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print
          </button>

          <button
            onClick={exportToPDF}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
