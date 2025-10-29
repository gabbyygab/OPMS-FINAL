import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import AddFundsPaypal from "../paypal/AddFundsPaypal";
import ReceiptModal from "./ReceiptModal";
import {
  addDoc,
  collection,
  doc,
  orderBy,
  query,
  updateDoc,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { getDocs, getDoc } from "firebase/firestore";

export default function WalletPage({ user, userData }) {
  const [balance, setBalance] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalAdded, setTotalAdded] = useState(0);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const [userPaypalEmail, setUserPaypalEmail] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  //paypal
  const [showPaypal, setShowPaypal] = useState(false);

  const [transactions, setTransactions] = useState([]);

  // Receipt Modal
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  //get wallet from user
  const getWalletDataFromCurrentUser = async (user_id) => {
    try {
      const walletsRef = collection(db, "wallets");
      const q = query(walletsRef, where("user_id", "==", user_id));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const walletDoc = querySnapshot.docs[0];
        return { id: walletDoc.id, ...walletDoc.data() };
      }
    } catch (error) {
      console.error(error);
    }
  };

  //fetch Transactions

  useEffect(() => {
    const q = query(
      collection(db, "transactions"),
      where("user_id", "==", userData.id),
      orderBy("created_at", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactionData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTransactions(transactionData);
    });
    return () => unsubscribe();
  }, []);

  //pagination
  // Pagination calculations
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentTransactions = transactions.slice(indexOfFirst, indexOfLast);
  console.log("Transactions:", transactions);

  //fetch wallet
  useEffect(() => {
    const fetchWallet = async () => {
      if (user?.uid) {
        const wallet = await getWalletDataFromCurrentUser(userData.id);

        if (wallet) {
          console.log("✅ Wallet fetched:", wallet);
          console.log("💰 Wallet balance:", wallet.balance);
          setBalance(wallet.balance);
          setTotalAdded(wallet.total_cash_in);
          setTotalSpent(wallet.total_spent);
        } else {
          console.log("⚠️ No wallet found for user:", userData.id);
          setBalance(0);
        }
      } else {
        console.log("❌ No user signed in.");
      }
    };

    fetchWallet();
  }, [user]);

  const handleWithdraw = async () => {
    const numericAmount = parseFloat(withdrawAmount);

    if (!userPaypalEmail || !userPaypalEmail.includes("@")) {
      return toast.error("Please enter a valid PayPal email");
    }

    if (!numericAmount || numericAmount <= 0) {
      return toast.error("Please enter a valid amount");
    }

    if (numericAmount > balance) {
      return toast.error("Insufficient balance");
    }

    setIsLoading(true);

    const backendUrl = "https://opms-final-backend.onrender.com";
    try {
      const res = await fetch(`${backendUrl}/api/paypal/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userPaypalEmail,
          amount: numericAmount,
          userId: userData.id,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Update wallet in Firestore
        const walletRef = doc(db, "wallets", userData.id);
        const walletSnap = await getDoc(walletRef);

        if (walletSnap.exists()) {
          const walletData = walletSnap.data();
          const newBalance = walletData.balance - numericAmount;
          const newTotalWithdrawn =
            (walletData.total_withdrawn || 0) + numericAmount;

          await updateDoc(walletRef, {
            balance: newBalance,
            total_withdrawn: newTotalWithdrawn,
          });

          // Create withdrawal transaction
          await addDoc(collection(db, "transactions"), {
            amount: -numericAmount,
            created_at: new Date(),
            type: "withdrawal",
            status: "completed",
            paypal_email: userPaypalEmail,
            paypal_batch_id: data.batch?.batch_id || null,
            user_id: userData.id,
            wallet_id: walletSnap.id,
          });

          // Update local state
          setBalance(newBalance);
          setShowWithdraw(false);
          setWithdrawAmount("");
          setUserPaypalEmail("");

          toast.success(
            "Withdrawal successful! Funds sent to your PayPal account."
          );
        }
      } else {
        console.error("Withdraw error:", data);
        toast.error(data.error || "Withdrawal failed.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error processing withdrawal.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewReceipt = (transaction) => {
    setSelectedTransaction(transaction);
    setShowReceiptModal(true);
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case "payment":
        return (
          <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
        );
      case "refund":
        return (
          <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
          </div>
        );
      case "deposit":
        return (
          <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
        );
      case "withdrawal":
        return (
          <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-orange-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/loginImage.jpg')] bg-cover bg-center opacity-10" />

      <div className="relative max-w-6xl mx-auto">
        {/* Home Button */}
        <button
          onClick={() => (window.location.href = "/")}
          className="flex items-center gap-2 mb-6 px-4 py-2 bg-slate-800/80 hover:bg-slate-700/80 backdrop-blur-lg rounded-lg border border-slate-700 transition-colors group"
        >
          <svg
            className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span className="text-white font-medium">Home</span>
        </button>
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="oklch(0.511 0.262 276.966)"
          >
            <path d="M7 2v2H5a2 2 0 0 0-2 2v2h18V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm13 8H4v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10zm-4 4h-4v4h4v-4z" />
          </svg>
          <div>
            <h1 className="text-3xl font-bold text-white">My Wallet</h1>
            <p className="text-slate-400">Manage your BookingNest funds</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Balance Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl shadow-2xl p-8 border border-indigo-500/50">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-indigo-200 text-sm mb-2">
                  Available Balance
                </p>
                <h2 className="text-5xl font-bold text-white">
                  ₱ {balance.toFixed(2)}
                </h2>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowAddFunds(true)}
                className="flex-1 bg-white hover:bg-slate-100 text-indigo-600 font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Funds
              </button>
              <button
                onClick={() => setShowWithdraw(true)}
                className="flex-1 bg-indigo-700 hover:bg-indigo-900 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
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
                    d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                  />
                </svg>
                Withdraw
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-400 text-sm">Total Spent</p>
                <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-white">
                ₱ {totalSpent.toFixed(2)}
              </p>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-400 text-sm">Total Added</p>
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 10l7-7m0 0l7 7m-7-7v18"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-white">
                ₱ {totalAdded.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700">
          <div className="p-6 border-b border-slate-700">
            <h3 className="text-xl font-bold text-white">
              Transaction History
            </h3>
            <p className="text-slate-400 text-sm">
              Your recent wallet activity
            </p>
          </div>

          <div className="divide-y divide-slate-700">
            {currentTransactions.length > 0 ? (
              currentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-6 hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {getTransactionIcon(transaction.type)}

                    <div className="flex-1">
                      <p className="text-white font-medium mb-1 capitalize">
                        {transaction.type}
                      </p>
                      <p className="text-slate-400 text-sm">
                        {transaction.created_at
                          ? new Date(
                              transaction.created_at.toDate()
                            ).toLocaleDateString("en-PH", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}{" "}
                        at{" "}
                        {transaction.created_at
                          ? new Date(
                              transaction.created_at.toDate()
                            ).toLocaleTimeString("en-PH", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </p>
                    </div>

                    <div className="text-right space-y-2">
                      <div>
                        <p
                          className={`text-lg font-bold ${
                            transaction.amount > 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {transaction.amount > 0 ? "+" : ""}₱
                          {Math.abs(transaction.amount).toFixed(2)}
                        </p>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                          {transaction.status}
                        </span>
                      </div>
                      <button
                        onClick={() => handleViewReceipt(transaction)}
                        className="w-full px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 hover:text-indigo-200 text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1"
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
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Receipt
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <p className="text-slate-400">No transactions yet</p>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 p-4 border-t border-slate-700">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md bg-slate-700 text-white disabled:opacity-50 hover:bg-slate-600"
              >
                Prev
              </button>

              {[...Array(totalPages)].map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === idx + 1
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-md bg-slate-700 text-white disabled:opacity-50 hover:bg-slate-600"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Funds Modal */}
      {showAddFunds && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700 max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-2">Add Funds</h3>
            <p className="text-slate-400 mb-6">
              Enter the amount you want to add to your wallet
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Amount (PHP)
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            {!showPaypal && amount > 0 && (
              <button
                onClick={() => setShowPaypal(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg my-4 transition"
              >
                Proceed to PayPal
              </button>
            )}

            {showPaypal && (
              <div className="mb-6">
                <AddFundsPaypal
                  isLoading={isLoading}
                  amount={parseFloat(amount)}
                  onSuccess={async (addedAmount) => {
                    try {
                      setIsLoading(true);
                      const walletRef = doc(db, "wallets", userData.id);
                      const walletSnap = await getDoc(walletRef);

                      if (!walletSnap.exists()) {
                        console.error("Wallet not found!");
                        return;
                      }

                      const walletData = walletSnap.data();
                      const newBalance = walletData.balance + addedAmount;
                      const newTotalCashIn =
                        walletData.total_cash_in + addedAmount;

                      // Update Firestore
                      await updateDoc(walletRef, {
                        balance: newBalance,
                        total_cash_in: newTotalCashIn,
                      });

                      await addDoc(collection(db, "transactions"), {
                        amount: addedAmount,
                        created_at: new Date(),
                        type: "deposit",
                        status: "completed",
                        user_id: userData.id,
                        wallet_id: walletSnap.id,
                      });

                      // Update local state
                      setBalance(newBalance);
                      setTotalAdded(newTotalCashIn);
                      setShowAddFunds(false);
                      setShowPaypal(false);
                      setAmount("");

                      toast.success(
                        `₱${addedAmount} successfully added to your wallet`,
                        {
                          position: "top-right",
                        }
                      );
                    } catch (error) {
                      console.error("Error updating wallet:", error);
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                />
              </div>
            )}

            <button
              onClick={() => {
                setShowAddFunds(false);
                setShowPaypal(false);
                setAmount("");
              }}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700 max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-2">
              Withdraw Funds
            </h3>
            <p className="text-slate-400 mb-6">
              Enter your PayPal email and withdrawal amount
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-200 mb-2">
                PayPal Email
              </label>
              <input
                type="email"
                placeholder="your-email@example.com"
                value={userPaypalEmail}
                onChange={(e) => setUserPaypalEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Amount (PHP)
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <p className="text-slate-400 text-sm mt-2">
                Available: ₱{balance.toFixed(2)}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowWithdraw(false);
                  setWithdrawAmount("");
                  setUserPaypalEmail("");
                }}
                disabled={isLoading}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={isLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? "Processing..." : "Withdraw"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && selectedTransaction && (
        <ReceiptModal
          transaction={selectedTransaction}
          user={user}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedTransaction(null);
          }}
        />
      )}
    </div>
  );
}
