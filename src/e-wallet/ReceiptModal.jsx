import { useRef } from "react";
import { jsPDF } from "jspdf";
import { toast } from "react-toastify";

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

  const getTransactionColor = (type) => {
    const colors = {
      payment: { bg: "bg-red-50", border: "border-red-200" },
      refund: { bg: "bg-blue-50", border: "border-blue-200" },
      deposit: { bg: "bg-green-50", border: "border-green-200" },
      withdrawal: { bg: "bg-orange-50", border: "border-orange-200" },
    };
    return colors[type] || { bg: "bg-gray-50", border: "border-gray-200" };
  };

  const exportToPDF = async () => {
    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 200], // Thermal printer format (80mm width)
      });

      // Set font
      pdf.setFont("helvetica");

      // Logo and Header
      pdf.setFontSize(14);
      pdf.text("BookingNest", 40, 15, { align: "center" });

      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text("E-Wallet Transaction Receipt", 40, 23, { align: "center" });

      // Divider
      pdf.setDrawColor(200, 200, 200);
      pdf.line(5, 28, 75, 28);

      // Transaction Type
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${getTransactionTypeLabel(transaction.type).toUpperCase()}`, 40, 36, {
        align: "center",
      });

      // Amount
      pdf.setFontSize(18);
      const amountColor = transaction.amount > 0 ? [34, 197, 94] : [239, 68, 68];
      pdf.setTextColor(...amountColor);
      pdf.text(
        `${transaction.amount > 0 ? "+" : ""}₱${Math.abs(
          transaction.amount
        ).toFixed(2)}`,
        40,
        48,
        { align: "center" }
      );

      // Status
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      const statusColor = transaction.status === "completed" ? [34, 197, 94] : [239, 68, 68];
      pdf.setTextColor(...statusColor);
      pdf.text(`Status: ${transaction.status.toUpperCase()}`, 40, 56, {
        align: "center",
      });

      // Divider
      pdf.setDrawColor(200, 200, 200);
      pdf.line(5, 60, 75, 60);

      // Details
      pdf.setFontSize(9);
      pdf.setTextColor(0, 0, 0);
      let yPosition = 68;

      const details = [
        ["Transaction ID", transaction.id],
        ["Date & Time", formatDate(transaction.created_at)],
        ["Guest Name", transaction.guestName || user?.displayName || "N/A"],
        ["Email", transaction.email || user?.email || "N/A"],
        ["Type", getTransactionTypeLabel(transaction.type)],
      ];

      details.forEach(([label, value]) => {
        pdf.setTextColor(100, 100, 100);
        pdf.text(`${label}:`, 8, yPosition);

        pdf.setTextColor(50, 50, 50);
        const splitValue = pdf.splitTextToSize(value || "N/A", 50);
        pdf.text(splitValue, 35, yPosition);

        yPosition += splitValue.length * 5 + 3;
      });

      // Special fields for different transaction types
      if (transaction.type === "withdrawal" && transaction.paypal_email) {
        pdf.setTextColor(100, 100, 100);
        pdf.text("PayPal Email:", 8, yPosition);
        pdf.setTextColor(50, 50, 50);
        pdf.text(transaction.paypal_email, 35, yPosition);
        yPosition += 8;
      }

      if (transaction.paypal_batch_id) {
        pdf.setTextColor(100, 100, 100);
        pdf.text("Batch ID:", 8, yPosition);
        pdf.setTextColor(50, 50, 50);
        pdf.text(transaction.paypal_batch_id, 35, yPosition);
        yPosition += 8;
      }

      // Divider
      pdf.setDrawColor(200, 200, 200);
      pdf.line(5, yPosition + 2, 75, yPosition + 2);

      // Footer
      yPosition += 10;
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text("Thank you for using BookingNest!", 40, yPosition, {
        align: "center",
      });

      yPosition += 6;
      pdf.text("www.bookingnest.com", 40, yPosition, { align: "center" });

      // Save PDF
      pdf.save(
        `Receipt-${transaction.type}-${new Date().getTime()}.pdf`
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
    printWindow.document.write(receiptRef.current.innerHTML);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const colors = getTransactionColor(transaction.type);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Receipt</h3>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
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

        {/* Thermal Printer Receipt Preview */}
        <div
          ref={receiptRef}
          className={`m-6 p-6 border-2 ${colors.border} ${colors.bg} rounded-lg font-mono text-sm`}
          style={{
            maxWidth: "280px",
            margin: "24px auto",
            backgroundColor: "#ffffff",
            borderColor: "#e5e7eb",
          }}
        >
          {/* Logo Section */}
          <div className="text-center mb-4 pb-3 border-b-2 border-gray-300">
            <div className="flex justify-center mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="oklch(0.511 0.262 276.966)"
              >
                <path d="M7 2v2H5a2 2 0 0 0-2 2v2h18V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm13 8H4v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10zm-4 4h-4v4h4v-4z" />
              </svg>
            </div>
            <p className="font-bold text-gray-900 text-base">BookingNest</p>
            <p className="text-gray-600 text-xs">E-Wallet Receipt</p>
          </div>

          {/* Transaction Type */}
          <div className="text-center mb-4 pb-3 border-b-2 border-gray-300">
            <p className="text-xs text-gray-500 mb-1">Transaction Type</p>
            <p className="font-bold text-lg text-gray-900">
              {getTransactionTypeLabel(transaction.type)}
            </p>
          </div>

          {/* Amount */}
          <div className="text-center mb-4 pb-3 border-b-2 border-gray-300">
            <p
              className={`text-3xl font-bold ${
                transaction.amount > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {transaction.amount > 0 ? "+" : ""}₱{Math.abs(
                transaction.amount
              ).toFixed(2)}
            </p>
            <p
              className={`text-xs font-semibold mt-1 ${
                transaction.status === "completed"
                  ? "text-green-600"
                  : "text-orange-600"
              }`}
            >
              [{transaction.status.toUpperCase()}]
            </p>
          </div>

          {/* Details */}
          <div className="mb-4 pb-3 border-b-2 border-gray-300 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Receipt ID:</span>
              <span className="text-gray-900 font-semibold">
                {transaction.id.slice(0, 12)}...
              </span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Date & Time:</span>
              <span className="text-gray-900 font-semibold">
                {formatDate(transaction.created_at)}
              </span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Name:</span>
              <span className="text-gray-900 font-semibold">
                {user?.displayName || "Guest"}
              </span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Email:</span>
              <span className="text-gray-900 font-semibold break-all">
                {user?.email || "N/A"}
              </span>
            </div>

            {transaction.type === "withdrawal" && transaction.paypal_email && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">PayPal:</span>
                <span className="text-gray-900 font-semibold break-all">
                  {transaction.paypal_email}
                </span>
              </div>
            )}

            {transaction.paypal_batch_id && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Batch ID:</span>
                <span className="text-gray-900 font-semibold break-all">
                  {transaction.paypal_batch_id}
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 space-y-1">
            <p>═══════════════════════════</p>
            <p className="font-semibold">Thank you for using BookingNest!</p>
            <p>www.bookingnest.com</p>
            <p>support@bookingnest.com</p>
            <p>═══════════════════════════</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={printReceipt}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
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
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
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
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            PDF
          </button>

          <button
            onClick={onClose}
            className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
