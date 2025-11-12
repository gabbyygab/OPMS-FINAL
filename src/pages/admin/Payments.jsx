import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import {
  DollarSign,
  TrendingUp,
  ArrowUpCircle,
  Download,
  File,
  Calendar,
  Filter,
} from "lucide-react";
import ReceiptModal from "../../e-wallet/ReceiptModal";

export default function Payments() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState("all"); // "all", "service_fee", "listing_limit_upgrade"
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const itemsPerPage = 10;

  // Statistics
  const [stats, setStats] = useState({
    totalRevenue: 0,
    serviceFeeRevenue: 0,
    listingUpgradeRevenue: 0,
    totalTransactions: 0,
  });

  // Fetch all revenue transactions (service fees and listing upgrades)
  useEffect(() => {
    const q = query(
      collection(db, "transactions"),
      orderBy("created_at", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactionData = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(
          (transaction) =>
            transaction.type === "service_fee" ||
            transaction.type === "listing_limit_upgrade"
        );

      setTransactions(transactionData);
      calculateStats(transactionData);
    });

    return () => unsubscribe();
  }, []);

  // Calculate statistics
  const calculateStats = (data) => {
    const serviceFees = data.filter((t) => t.type === "service_fee");
    const listingUpgrades = data.filter(
      (t) => t.type === "listing_limit_upgrade"
    );

    const serviceFeeRevenue = serviceFees.reduce(
      (sum, t) => sum + Math.abs(t.amount || 0),
      0
    );
    const listingUpgradeRevenue = listingUpgrades.reduce(
      (sum, t) => sum + Math.abs(t.amount || 0),
      0
    );

    setStats({
      totalRevenue: serviceFeeRevenue + listingUpgradeRevenue,
      serviceFeeRevenue,
      listingUpgradeRevenue,
      totalTransactions: data.length,
    });
  };

  // Filter transactions
  useEffect(() => {
    if (filterType === "all") {
      setFilteredTransactions(transactions);
    } else {
      setFilteredTransactions(
        transactions.filter((t) => t.type === filterType)
      );
    }
    setCurrentPage(1); // Reset to first page when filter changes
  }, [filterType, transactions]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentTransactions = filteredTransactions.slice(
    indexOfFirst,
    indexOfLast
  );

  const handleViewReceipt = (transaction) => {
    setSelectedTransaction(transaction);
    setShowReceiptModal(true);
  };

  const getTransactionIcon = (type) => {
    if (type === "service_fee") {
      return (
        <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-emerald-400" />
        </div>
      );
    } else {
      return (
        <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
          <ArrowUpCircle className="w-5 h-5 text-purple-400" />
        </div>
      );
    }
  };

  const getTransactionLabel = (type) => {
    return type === "service_fee" ? "Service Fee" : "Listing Upgrade";
  };

  const exportToCSV = () => {
    // Prepare CSV data
    const headers = [
      "Date",
      "Time",
      "Type",
      "Amount",
      "User ID",
      "Booking ID",
      "Listing Type",
      "Description",
    ];

    const rows = filteredTransactions.map((transaction) => {
      const date = transaction.created_at?.toDate
        ? new Date(transaction.created_at.toDate()).toLocaleDateString("en-PH")
        : "";
      const time = transaction.created_at?.toDate
        ? new Date(transaction.created_at.toDate()).toLocaleTimeString("en-PH")
        : "";
      const type = getTransactionLabel(transaction.type);
      const amount = Math.abs(transaction.amount || 0).toFixed(2);
      const userId = transaction.user_id || "";
      const bookingId = transaction.bookingId || "";
      const listingType = transaction.listingType || "";
      const description = transaction.description || "";

      return [date, time, type, amount, userId, bookingId, listingType, description];
    });

    // Convert to CSV
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Download
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment-transactions-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Payment Transactions
          </h1>
          <p className="text-slate-400">
            Service fees and listing upgrade revenue
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
        >
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-400 text-sm font-medium">Total Revenue</p>
            <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">
            ₱{stats.totalRevenue.toFixed(2)}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-400 text-sm font-medium">Service Fees</p>
            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">
            ₱{stats.serviceFeeRevenue.toFixed(2)}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-400 text-sm font-medium">
              Listing Upgrades
            </p>
            <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
              <ArrowUpCircle className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">
            ₱{stats.listingUpgradeRevenue.toFixed(2)}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-400 text-sm font-medium">Transactions</p>
            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">
            {stats.totalTransactions}
          </p>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                Transaction History
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                All payment transactions
              </p>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Transactions</option>
                <option value="service_fee">Service Fees</option>
                <option value="listing_limit_upgrade">Listing Upgrades</option>
              </select>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-800">
          {currentTransactions.length > 0 ? (
            currentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="p-6 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {getTransactionIcon(transaction.type)}

                  <div className="flex-1">
                    <p className="text-white font-medium mb-1">
                      {getTransactionLabel(transaction.type)}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span>
                        {transaction.created_at
                          ? new Date(
                              transaction.created_at.toDate()
                            ).toLocaleDateString("en-PH", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </span>
                      <span>
                        {transaction.created_at
                          ? new Date(
                              transaction.created_at.toDate()
                            ).toLocaleTimeString("en-PH", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                      {transaction.listingType && (
                        <span className="px-2 py-0.5 bg-slate-700 rounded text-xs capitalize">
                          {transaction.listingType}
                        </span>
                      )}
                    </div>
                    {transaction.description && (
                      <p className="text-xs text-slate-500 mt-1">
                        {transaction.description}
                      </p>
                    )}
                  </div>

                  <div className="text-right space-y-2">
                    <p className="text-lg font-bold text-emerald-400">
                      +₱{Math.abs(transaction.amount || 0).toFixed(2)}
                    </p>
                    <button
                      onClick={() => handleViewReceipt(transaction)}
                      className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 hover:text-indigo-200 text-xs font-semibold rounded transition-colors flex items-center gap-1"
                    >
                      <File className="w-4 h-4" />
                      Receipt
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <p className="text-slate-400">No transactions found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 p-4 border-t border-slate-800">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg bg-slate-800 text-white disabled:opacity-50 hover:bg-slate-700 transition-colors"
            >
              Previous
            </button>

            <div className="flex items-center gap-2">
              {[...Array(totalPages)].map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    currentPage === idx + 1
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg bg-slate-800 text-white disabled:opacity-50 hover:bg-slate-700 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && selectedTransaction && (
        <ReceiptModal
          transaction={selectedTransaction}
          user={{ email: "admin@bookingnest.com" }}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedTransaction(null);
          }}
        />
      )}
    </div>
  );
}
