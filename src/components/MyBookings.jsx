import { useState, useEffect } from "react";
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { db } from "../firebase/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  arrayRemove,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import LoadingSpinner from "../loading/Loading";

function parseDate(dateStr) {
  return dateStr ? new Date(dateStr) : null;
}

function formatDate(dateStr) {
  const date = parseDate(dateStr);
  if (!date) return "N/A";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function MyBookingsSection() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const bookingsPerPage = 4;

  // Fetch bookings from Firestore
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const bookingsRef = collection(db, "bookings");
        const q = query(bookingsRef, where("guest_id", "==", user.uid));
        const querySnapshot = await getDocs(q);

        const bookingsData = await Promise.all(
          querySnapshot.docs.map(async (bookingDoc) => {
            const booking = { id: bookingDoc.id, ...bookingDoc.data() };

            // Fetch listing data
            if (booking.listing_id) {
              const listingRef = doc(db, "listings", booking.listing_id);
              const listingSnap = await getDoc(listingRef);
              if (listingSnap.exists()) {
                const listingData = listingSnap.data();
                booking.title = listingData.title;
                booking.location = listingData.location;
                booking.photo =
                  listingData.photos?.[0] || "https://via.placeholder.com/400";
                booking.type = listingData.type;
              }
            }

            // Convert Firestore Timestamps to Date strings
            if (booking.checkIn && booking.checkIn.toDate) {
              booking.checkIn = booking.checkIn
                .toDate()
                .toISOString()
                .split("T")[0];
            }
            if (booking.checkOut && booking.checkOut.toDate) {
              booking.checkOut = booking.checkOut
                .toDate()
                .toISOString()
                .split("T")[0];
            }

            return booking;
          })
        );

        setBookings(bookingsData);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        toast.error("Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  // Handle refund
  const handleRefund = async () => {
    if (!selectedBooking) return;

    const checkInDate = new Date(selectedBooking.checkIn);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate <= today) {
      toast.error("Cannot refund bookings on or after check-in date");
      return;
    }

    try {
      const loadingToast = toast.loading("Processing refund...");

      // Get guest wallet
      const guestWalletQuery = query(
        collection(db, "wallets"),
        where("user_id", "==", user.uid)
      );
      const guestWalletSnap = await getDocs(guestWalletQuery);

      if (guestWalletSnap.empty) {
        toast.dismiss(loadingToast);
        toast.error("Wallet not found");
        return;
      }

      const guestWalletDoc = guestWalletSnap.docs[0];
      const guestWalletId = guestWalletDoc.id;
      const guestBalance = guestWalletDoc.data().balance || 0;
      const guestTotalSpent = guestWalletDoc.data().total_spent || 0;

      // Get host wallet
      const hostWalletQuery = query(
        collection(db, "wallets"),
        where("user_id", "==", selectedBooking.host_id)
      );
      const hostWalletSnap = await getDocs(hostWalletQuery);

      if (hostWalletSnap.empty) {
        toast.dismiss(loadingToast);
        toast.error("Host wallet not found");
        return;
      }

      const hostWalletDoc = hostWalletSnap.docs[0];
      const hostWalletId = hostWalletDoc.id;
      const hostBalance = hostWalletDoc.data().balance || 0;
      const hostTotalCashIn = hostWalletDoc.data().total_cash_in || 0;

      // Update guest wallet (add refund)
      await updateDoc(doc(db, "wallets", guestWalletDoc.id), {
        balance: guestBalance + selectedBooking.totalAmount,
        total_spent: Math.max(0, guestTotalSpent - selectedBooking.totalAmount),
      });

      // Update host wallet (deduct refund)
      await updateDoc(doc(db, "wallets", hostWalletDoc.id), {
        balance: hostBalance - selectedBooking.totalAmount,
        total_cash_in: Math.max(
          0,
          hostTotalCashIn - selectedBooking.totalAmount
        ),
      });

      // Create guest transaction (refund - added)
      await addDoc(collection(db, "transactions"), {
        amount: selectedBooking.totalAmount,
        created_at: serverTimestamp(),
        paypal_batch_id: null,
        paypal_email: null,
        status: "completed",
        type: "refund",
        user_id: user.uid,
        wallet_id: guestWalletId,
      });

      // Create host transaction (refund - deducted)
      await addDoc(collection(db, "transactions"), {
        amount: -selectedBooking.totalAmount,
        created_at: serverTimestamp(),
        paypal_batch_id: null,
        paypal_email: null,
        status: "completed",
        type: "refund",
        user_id: selectedBooking.host_id,
        wallet_id: hostWalletId,
      });

      // Remove booked dates from listing
      const listingRef = doc(db, "listings", selectedBooking.listing_id);
      const checkInDate = new Date(selectedBooking.checkIn);
      const checkOutDate = new Date(selectedBooking.checkOut);
      const datesToRemove = [];

      for (
        let d = new Date(checkInDate);
        d <= checkOutDate;
        d.setDate(d.getDate() + 1)
      ) {
        datesToRemove.push(new Date(d));
      }

      await updateDoc(listingRef, {
        bookedDates: arrayRemove(...datesToRemove),
      });

      // Delete booking
      await deleteDoc(doc(db, "bookings", selectedBooking.id));

      // Update local state
      setBookings(bookings.filter((b) => b.id !== selectedBooking.id));

      toast.dismiss(loadingToast);
      toast.success("Booking cancelled and refund processed successfully!");
      setShowRefundModal(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error("Error processing refund:", error);
      toast.error("Failed to process refund. Please try again.");
    }
  };

  // Get bookings for selected date
  const getBookingsForDate = (date) => {
    return bookings.filter((booking) => {
      const checkIn = parseDate(booking.checkIn);
      const checkOut = parseDate(booking.checkOut);

      // Set time to midnight for accurate date comparison
      const compareDate = new Date(date);
      compareDate.setHours(0, 0, 0, 0);

      const checkInDate = new Date(checkIn);
      checkInDate.setHours(0, 0, 0, 0);

      const checkOutDate = new Date(checkOut);
      checkOutDate.setHours(0, 0, 0, 0);

      return compareDate >= checkInDate && compareDate <= checkOutDate;
    });
  };

  // Get all dates with bookings in current month
  const getDatesWithBookings = () => {
    const dates = new Set();
    bookings.forEach((booking) => {
      const checkIn = parseDate(booking.checkIn);
      const checkOut = parseDate(booking.checkOut);

      if (!checkIn || !checkOut) return;

      const current = new Date(checkIn);
      current.setHours(0, 0, 0, 0);

      const endDate = new Date(checkOut);
      endDate.setHours(0, 0, 0, 0);

      while (current <= endDate) {
        if (
          current.getMonth() === currentMonth.getMonth() &&
          current.getFullYear() === currentMonth.getFullYear()
        ) {
          dates.add(current.getDate());
        }
        current.setDate(current.getDate() + 1);
      }
    });
    return dates;
  };

  const datesWithBookings = getDatesWithBookings();

  // Calendar functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

  const previousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day) => {
    return (
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    );
  };

  const selectDate = (day) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(newDate);
    // Reset to first page when selecting a date
    setCurrentPage(1);
  };

  // Get bookings for selected date in calendar sidebar
  const selectedDateBookings = getBookingsForDate(selectedDate);

  // Filter bookings by type
  let filteredBookings = activeFilter === "all"
    ? bookings
    : bookings.filter((b) => b.type === activeFilter);

  // Further filter by selected date if bookings exist for that date
  // Only apply date filter if a date with bookings is selected
  const hasBookingsOnSelectedDate = selectedDateBookings.length > 0;
  if (hasBookingsOnSelectedDate) {
    filteredBookings = selectedDateBookings.filter((booking) =>
      activeFilter === "all" ? true : booking.type === activeFilter
    );
  }

  // Pagination
  const indexOfLastBooking = currentPage * bookingsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
  const currentBookings = filteredBookings.slice(
    indexOfFirstBooking,
    indexOfLastBooking
  );
  const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Check if booking can be refunded
  const canRefund = (booking) => {
    const checkInDate = new Date(booking.checkIn);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return checkInDate > today;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 bg-[url('/guestBg.png')] bg-cover bg-center opacity-5"></div>

      <div className="relative z-10">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">My Bookings</h1>
            <p className="text-slate-300">
              View and manage your upcoming reservations
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-8">
            {["all", "stays", "services", "experiences"].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeFilter === filter
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                    : "bg-slate-800/50 text-slate-300 border border-slate-700 hover:bg-slate-800 hover:text-white hover:border-slate-600"
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}

            {hasBookingsOnSelectedDate && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-slate-400">
                  Showing bookings for {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                <button
                  onClick={() => {
                    setSelectedDate(new Date());
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 bg-slate-700/50 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white text-xs font-medium transition"
                >
                  Clear Date Filter
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {currentBookings.length > 0 ? (
                <>
                  {currentBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-700 overflow-hidden hover:shadow-xl hover:shadow-indigo-500/10 hover:border-slate-600 transition-all duration-300 cursor-pointer group"
                      onClick={() => setSelectedBooking(booking)}
                    >
                      <div className="flex flex-col sm:flex-row">
                        <div className="sm:w-48 h-48 flex-shrink-0 relative overflow-hidden">
                          <img
                            src={booking.photo}
                            alt={booking.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>

                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="text-lg font-bold text-white">
                                {booking.title}
                              </h3>
                              <span
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                                  booking.status === "confirmed"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                }`}
                              >
                                {booking.status.charAt(0).toUpperCase() +
                                  booking.status.slice(1)}
                              </span>
                            </div>

                            <div className="flex items-center text-slate-300 text-sm mb-2">
                              <MapPin className="w-4 h-4 mr-1.5 text-indigo-400" />
                              {booking.location}
                            </div>

                            <div className="flex items-center text-slate-400 text-sm mb-2">
                              <Calendar className="w-4 h-4 mr-1.5 text-emerald-400" />
                              {formatDate(booking.checkIn)} -{" "}
                              {formatDate(booking.checkOut)}
                            </div>

                            <div className="flex items-center text-slate-400 text-sm">
                              <Users className="w-4 h-4 mr-1.5 text-amber-400" />
                              {booking.guests}{" "}
                              {booking.guests === 1 ? "Guest" : "Guests"}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
                            <div>
                              <span className="text-xs text-slate-400 block">
                                Total Amount
                              </span>
                              <span className="text-xl font-bold text-white">
                                ₱
                                {booking.totalAmount?.toFixed(2) ||
                                  booking.price?.toFixed(2) ||
                                  0}
                              </span>
                            </div>
                            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40">
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-slate-800/50 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            onClick={() => paginate(page)}
                            className={`px-4 py-2 rounded-lg font-semibold transition ${
                              currentPage === page
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                                : "bg-slate-800/50 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                            }`}
                          >
                            {page}
                          </button>
                        )
                      )}

                      <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-slate-800/50 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-12 text-center">
                  <Calendar className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No bookings found
                  </h3>
                  <p className="text-slate-400">
                    You don't have any{" "}
                    {activeFilter !== "all" ? activeFilter : "bookings"} yet.
                  </p>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-lg p-6 sticky top-36">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">
                    {currentMonth.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={previousMonth}
                      className="p-1.5 hover:bg-slate-700 rounded-lg transition"
                    >
                      <ChevronLeft className="w-5 h-5 text-slate-300" />
                    </button>
                    <button
                      onClick={nextMonth}
                      className="p-1.5 hover:bg-slate-700 rounded-lg transition"
                    >
                      <ChevronRight className="w-5 h-5 text-slate-300" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-semibold text-slate-400 py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}

                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const hasBooking = datesWithBookings.has(day);
                    return (
                      <button
                        key={day}
                        onClick={() => selectDate(day)}
                        className={`aspect-square flex items-center justify-center rounded-lg text-sm font-semibold transition-all relative ${
                          isSelected(day)
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                            : isToday(day)
                            ? "bg-slate-700 text-white"
                            : "text-slate-300 hover:bg-slate-700 hover:text-white"
                        }`}
                      >
                        {day}
                        {hasBooking && (
                          <span
                            className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                              isSelected(day) ? "bg-white" : "bg-indigo-400"
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-700">
                  <h3 className="text-sm font-semibold text-white mb-3">
                    {selectedDate.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </h3>

                  {selectedDateBookings.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDateBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="p-3 bg-slate-900/50 border border-slate-700 rounded-xl cursor-pointer hover:bg-slate-900 hover:border-slate-600 transition-all"
                          onClick={() => setSelectedBooking(booking)}
                        >
                          <p className="text-sm font-semibold text-white truncate">
                            {booking.title}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {booking.location}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">
                      No bookings on this date
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        {selectedBooking && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center z-50 px-4">
            <div className="bg-slate-800/90 backdrop-blur-lg border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 relative mt-[110px]">
              <button
                onClick={() => setSelectedBooking(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-slate-700 p-2 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <img
                src={selectedBooking.photo}
                alt={selectedBooking.title}
                className="w-full h-48 object-cover rounded-xl mb-4 border border-slate-700"
              />

              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">
                  {selectedBooking.title}
                </h2>
                <span
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                    selectedBooking.status === "confirmed"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }`}
                >
                  {selectedBooking.status.charAt(0).toUpperCase() +
                    selectedBooking.status.slice(1)}
                </span>
              </div>

              <div className="space-y-3 mb-5">
                <div className="flex items-center text-slate-300 text-sm">
                  <MapPin className="w-4 h-4 mr-2 text-indigo-400" />
                  {selectedBooking.location}
                </div>

                <div className="flex items-center text-slate-300 text-sm">
                  <Calendar className="w-4 h-4 mr-2 text-emerald-400" />
                  {formatDate(selectedBooking.checkIn)} -{" "}
                  {formatDate(selectedBooking.checkOut)}
                </div>

                <div className="flex items-center text-slate-300 text-sm">
                  <Users className="w-4 h-4 mr-2 text-amber-400" />
                  {selectedBooking.guests}{" "}
                  {selectedBooking.guests === 1 ? "Guest" : "Guests"}
                </div>
              </div>

              <div className="border-t border-slate-700 pt-4 mb-5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total Amount</span>
                  <span className="text-2xl font-bold text-white">
                    ₱
                    {selectedBooking.totalAmount?.toFixed(2) ||
                      selectedBooking.price?.toFixed(2) ||
                      0}
                  </span>
                </div>
              </div>

              {canRefund(selectedBooking) && (
                <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-300">
                      You can request a full refund for this booking since the
                      check-in date hasn't arrived yet.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {canRefund(selectedBooking) ? (
                  <button
                    onClick={() => setShowRefundModal(true)}
                    className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/40 flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Request Refund
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex-1 bg-slate-700 text-slate-500 py-3 rounded-lg font-semibold cursor-not-allowed border border-slate-600"
                  >
                    Refund Not Available
                  </button>
                )}
                <button className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40">
                  View Listing
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Refund Confirmation Modal */}
        {showRefundModal && selectedBooking && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center z-50 px-4 mt-[110px]">
            <div className="bg-slate-800/90 backdrop-blur-lg border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
              <button
                onClick={() => setShowRefundModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-slate-700 p-2 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-amber-500/10 border-2 border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-amber-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Confirm Refund Request
                </h2>
                <p className="text-slate-400 text-sm">
                  Are you sure you want to cancel this booking and request a
                  refund?
                </p>
              </div>

              <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 mb-6">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Booking:</span>
                    <span className="font-semibold text-white">
                      {selectedBooking.title}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Check-in:</span>
                    <span className="font-semibold text-white">
                      {formatDate(selectedBooking.checkIn)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Refund Amount:</span>
                    <span className="font-bold text-emerald-400 text-lg">
                      ₱
                      {selectedBooking.totalAmount?.toFixed(2) ||
                        selectedBooking.price?.toFixed(2) ||
                        0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-6">
                <p className="text-xs text-amber-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    The refund will be processed to your wallet immediately. The
                    amount will be deducted from the host's wallet.
                  </span>
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRefundModal(false)}
                  className="flex-1 bg-slate-700 text-white py-3 rounded-lg font-semibold hover:bg-slate-600 transition-all border border-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRefund}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/40 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Confirm Refund
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
