import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
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
  Trash2,
  CheckCircle,
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
  orderBy,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import LoadingSpinner from "../loading/Loading";
import { sendBookingCancellationEmail } from "../utils/sendBookingCancellationEmail";
import { requestRefund, canRequestRefund } from "../utils/refundUtils";

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
  const [searchParams] = useSearchParams();
  const highlightedBookingId = searchParams.get("booking");
  const highlightedBookingRef = useRef(null);

  const [bookings, setBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null); // null means no date filter
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showRefundReasonModal, setShowRefundReasonModal] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  const bookingsPerPage = 4;

  // Fetch bookings from Firestore
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const bookingsRef = collection(db, "bookings");
        const q = query(
          bookingsRef,
          where("guest_id", "==", user.uid),
          orderBy("createdAt", "desc")
        );
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

  // Scroll to and highlight the booking if a booking ID is in the query params
  useEffect(() => {
    if (highlightedBookingId && highlightedBookingRef.current) {
      setTimeout(() => {
        highlightedBookingRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 500); // Wait for animations to settle
    }
  }, [highlightedBookingId, bookings]);

  // Handle cancellation for pending bookings
  const handleCancelBooking = async () => {
    if (!selectedBooking) return;

    try {
      const loadingToast = toast.loading("Cancelling booking...");

      // Delete booking
      await deleteDoc(doc(db, "bookings", selectedBooking.id));

      // Update local state
      setBookings(bookings.filter((b) => b.id !== selectedBooking.id));

      // Send cancellation email to guest
      try {
        await sendBookingCancellationEmail(
          selectedBooking,
          {
            email: user.email,
            fullName: user.displayName || "Guest",
          },
          {
            cancellationReason: "Booking cancelled by guest",
            basePrice: selectedBooking.totalAmount || selectedBooking.price,
            refundAmount: 0, // No refund for pending bookings
          }
        );
      } catch (emailError) {
        console.error("Error sending cancellation email:", emailError);
        // Don't fail the cancellation if email fails
      }

      toast.dismiss(loadingToast);
      toast.success("Booking cancelled successfully!");
      setShowRefundModal(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error("Failed to cancel booking. Please try again.");
    }
  };

  // Handle refund request (sends to host for approval)
  const handleRequestRefund = async () => {
    if (!selectedBooking) return;

    // Check if booking can be refunded
    const refundEligibility = canRequestRefund(selectedBooking);
    if (!refundEligibility.canRefund) {
      toast.error(refundEligibility.reason);
      setShowRefundReasonModal(false);
      setRefundReason("");
      return;
    }

    try {
      setIsProcessingRefund(true);
      const loadingToast = toast.loading("Submitting refund request...");

      // Call refund request function
      await requestRefund(selectedBooking.id, user.uid, refundReason);

      // Update local booking status
      const updatedBooking = { ...selectedBooking, status: "refund_requested" };
      setBookings(
        bookings.map((b) => (b.id === selectedBooking.id ? updatedBooking : b))
      );

      toast.dismiss(loadingToast);
      toast.success(
        "Refund request submitted! Waiting for host approval. You'll be notified of the decision."
      );

      setShowRefundReasonModal(false);
      setShowRefundModal(false);
      setRefundReason("");
      setSelectedBooking(null);
    } catch (error) {
      console.error("Error requesting refund:", error);
      toast.error(error.message || "Failed to submit refund request.");
    } finally {
      setIsProcessingRefund(false);
    }
  };

  // Get bookings for selected date
  const getBookingsForDate = (date) => {
    if (!date) return bookings; // If no date selected, return all bookings

    return bookings.filter((booking) => {
      // Set time to midnight for accurate date comparison
      const compareDate = new Date(date);
      compareDate.setHours(0, 0, 0, 0);

      // Handle experiences and services (use selectedDateTime.date)
      if (booking.type === "experiences" || booking.type === "services") {
        const bookingDate = parseDate(
          booking.selectedDateTime?.date ||
          booking.selectedDate ||
          booking.checkIn
        );
        if (!bookingDate) return false;

        const bookingDateOnly = new Date(bookingDate);
        bookingDateOnly.setHours(0, 0, 0, 0);

        return compareDate.getTime() === bookingDateOnly.getTime();
      }

      // Handle stays (check if date falls within checkIn - checkOut range)
      const checkIn = parseDate(booking.checkIn);
      const checkOut = parseDate(booking.checkOut);

      if (!checkIn || !checkOut) return false;

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
      // Handle experiences and services (single date)
      if (booking.type === "experiences" || booking.type === "services") {
        const bookingDate = parseDate(
          booking.selectedDateTime?.date ||
          booking.selectedDate ||
          booking.checkIn
        );

        if (bookingDate) {
          if (
            bookingDate.getMonth() === currentMonth.getMonth() &&
            bookingDate.getFullYear() === currentMonth.getFullYear()
          ) {
            dates.add(bookingDate.getDate());
          }
        }
        return;
      }

      // Handle stays (date range)
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
    if (!selectedDate) return false; // No date selected
    return (
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    );
  };

  const selectDate = (day) => {
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    setSelectedDate(newDate);
    // Reset to first page when selecting a date
    setCurrentPage(1);
  };

  // Get bookings for selected date in calendar sidebar
  const selectedDateBookings = getBookingsForDate(selectedDate);

  // Filter bookings by type
  let filteredBookings =
    activeFilter === "all"
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
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-60 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 mt-16 sm:mt-20">
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

            {hasBookingsOnSelectedDate && selectedDate && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-slate-400">
                  Showing bookings for{" "}
                  {selectedDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <button
                  onClick={() => {
                    setSelectedDate(null); // Clear date filter
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
                      ref={
                        highlightedBookingId === booking.id
                          ? highlightedBookingRef
                          : null
                      }
                      className={`backdrop-blur-sm rounded-2xl shadow-lg border overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group ${
                        highlightedBookingId === booking.id
                          ? "bg-indigo-600/20 border-indigo-500 shadow-xl shadow-indigo-500/30"
                          : "bg-slate-800/50 border-slate-700 hover:shadow-indigo-500/10 hover:border-slate-600"
                      }`}
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
                              {booking.type === "experiences" ? (
                                <>
                                  {formatDate(
                                    booking.selectedDateTime?.date ||
                                      booking.selectedDate ||
                                      booking.checkIn
                                  )}{" "}
                                  at{" "}
                                  {booking.selectedDateTime?.time ||
                                    booking.selectedTime ||
                                    "N/A"}
                                </>
                              ) : booking.type === "services" ? (
                                formatDate(
                                  booking.selectedDateTime?.date ||
                                    booking.selectedDate ||
                                    booking.checkIn
                                )
                              ) : (
                                <>
                                  {formatDate(booking.checkIn)} -{" "}
                                  {formatDate(booking.checkOut)}
                                </>
                              )}
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
                                Amount Paid
                              </span>
                              <span className="text-xl font-bold text-white">
                                ₱
                                {booking.grandTotal?.toFixed(2) ||
                                  booking.totalAmount?.toFixed(2) ||
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
                    {selectedDate
                      ? selectedDate.toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "All Bookings"}
                  </h3>

                  {selectedDate && selectedDateBookings.length > 0 ? (
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
                  ) : selectedDate ? (
                    <p className="text-sm text-slate-400">
                      No bookings on this date
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400">
                      Select a date to view bookings
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
                  {selectedBooking.type === "experiences" ? (
                    <>
                      {formatDate(
                        selectedBooking.selectedDateTime?.date ||
                          selectedBooking.selectedDate ||
                          selectedBooking.checkIn
                      )}{" "}
                      at{" "}
                      {selectedBooking.selectedDateTime?.time ||
                        selectedBooking.selectedTime ||
                        "N/A"}
                    </>
                  ) : selectedBooking.type === "services" ? (
                    formatDate(
                      selectedBooking.selectedDateTime?.date ||
                        selectedBooking.selectedDate ||
                        selectedBooking.checkIn
                    )
                  ) : (
                    <>
                      {formatDate(selectedBooking.checkIn)} -{" "}
                      {formatDate(selectedBooking.checkOut)}
                    </>
                  )}
                </div>

                <div className="flex items-center text-slate-300 text-sm">
                  <Users className="w-4 h-4 mr-2 text-amber-400" />
                  {selectedBooking.guests}{" "}
                  {selectedBooking.guests === 1 ? "Guest" : "Guests"}
                </div>
              </div>

              <div className="border-t border-slate-700 pt-4 mb-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-400">Amount Paid (with service fee)</span>
                  <span className="text-2xl font-bold text-white">
                    ₱
                    {selectedBooking.grandTotal?.toFixed(2) ||
                      selectedBooking.totalAmount?.toFixed(2) ||
                      selectedBooking.price?.toFixed(2) ||
                      0}
                  </span>
                </div>

                {(selectedBooking.totalAmount || selectedBooking.serviceFee) && (
                  <div className="bg-slate-900/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Booking Amount:</span>
                      <span className="text-slate-300">
                        ₱{selectedBooking.totalAmount?.toFixed(2) || selectedBooking.price?.toFixed(2) || 0}
                      </span>
                    </div>
                    {selectedBooking.serviceFee && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Service Fee (5%):</span>
                        <span className="text-slate-300">
                          ₱{selectedBooking.serviceFee?.toFixed(2) || 0}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedBooking.status === "pending" && (
                <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-300">
                      Your booking is pending. You can cancel it anytime before
                      the host confirms.
                    </p>
                  </div>
                </div>
              )}

              {selectedBooking.status === "confirmed" &&
                canRefund(selectedBooking) && (
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
                {selectedBooking.status === "pending" ? (
                  <button
                    onClick={() => setShowRefundModal(true)}
                    className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/40 flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Cancel Booking
                  </button>
                ) : selectedBooking.status === "confirmed" ? (
                  canRefund(selectedBooking) ? (
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
                      className="flex-1 bg-slate-700 text-slate-500 py-3 rounded-lg font-semibold cursor-not-allowed border border-slate-600 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Completed
                    </button>
                  )
                ) : (
                  <button
                    disabled
                    className="flex-1 bg-slate-700 text-slate-500 py-3 rounded-lg font-semibold cursor-not-allowed border border-slate-600"
                  >
                    Unavailable
                  </button>
                )}
                <button className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40">
                  View Listing
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel/Refund Confirmation Modal */}
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
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 ${
                    selectedBooking.status === "pending"
                      ? "bg-blue-500/10 border-blue-500/20"
                      : "bg-amber-500/10 border-amber-500/20"
                  }`}
                >
                  <AlertCircle
                    className={`w-8 h-8 ${
                      selectedBooking.status === "pending"
                        ? "text-blue-400"
                        : "text-amber-400"
                    }`}
                  />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {selectedBooking.status === "pending"
                    ? "Cancel Booking?"
                    : "Request Refund?"}
                </h2>
                <p className="text-slate-400 text-sm">
                  {selectedBooking.status === "pending"
                    ? "Are you sure you want to cancel this booking? This action cannot be undone."
                    : "Are you sure you want to cancel this booking and request a refund?"}
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
                    <span className="text-slate-400">
                      {selectedBooking.type === "experiences"
                        ? "Date & Time:"
                        : selectedBooking.type === "services"
                        ? "Service Date:"
                        : "Check-in:"}
                    </span>
                    <span className="font-semibold text-white">
                      {selectedBooking.type === "experiences" ? (
                        <>
                          {formatDate(
                            selectedBooking.selectedDateTime?.date ||
                              selectedBooking.selectedDate ||
                              selectedBooking.checkIn
                          )}{" "}
                          at{" "}
                          {selectedBooking.selectedDateTime?.time ||
                            selectedBooking.selectedTime ||
                            "N/A"}
                        </>
                      ) : selectedBooking.type === "services" ? (
                        formatDate(
                          selectedBooking.selectedDateTime?.date ||
                            selectedBooking.selectedDate ||
                            selectedBooking.checkIn
                        )
                      ) : (
                        formatDate(selectedBooking.checkIn)
                      )}
                    </span>
                  </div>
                  {selectedBooking.status === "confirmed" && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Refund Amount (if approved):</span>
                      <span className="font-bold text-emerald-400 text-lg">
                        ₱
                        {selectedBooking.grandTotal?.toFixed(2) ||
                          selectedBooking.totalAmount?.toFixed(2) ||
                          selectedBooking.price?.toFixed(2) ||
                          0}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {selectedBooking.status === "confirmed" && (
                <>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-6">
                    <p className="text-xs text-amber-300 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>
                        Your refund request will be sent to the host for approval.
                        You'll be notified once the host reviews your request.
                      </span>
                    </p>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Reason for Refund (Optional)
                    </label>
                    <textarea
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="Please let the host know why you're requesting a refund..."
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all resize-none"
                      rows="3"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRefundModal(false);
                    setRefundReason("");
                  }}
                  className="flex-1 bg-slate-700 text-white py-3 rounded-lg font-semibold hover:bg-slate-600 transition-all border border-slate-600"
                >
                  Keep Booking
                </button>
                <button
                  onClick={
                    selectedBooking.status === "pending"
                      ? handleCancelBooking
                      : () => setShowRefundReasonModal(true)
                  }
                  disabled={selectedBooking.status === "confirmed" && isProcessingRefund}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/40 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedBooking.status === "pending" ? (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Confirm Cancel
                    </>
                  ) : isProcessingRefund ? (
                    <>
                      <span className="animate-spin">⚙</span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Confirm Refund
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Refund Confirmation Modal */}
        {showRefundReasonModal && selectedBooking && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center z-50 px-4 mt-[110px]">
            <div className="bg-slate-800/90 backdrop-blur-lg border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
              <button
                onClick={() => setShowRefundReasonModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-slate-700 p-2 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 bg-amber-500/10 border-amber-500/20">
                  <AlertCircle className="w-8 h-8 text-amber-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Confirm Refund Request
                </h2>
                <p className="text-slate-400 text-sm">
                  Submit your refund request to the host for approval
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
                    <span className="text-slate-400">
                      {selectedBooking.type === "experiences"
                        ? "Date & Time:"
                        : selectedBooking.type === "services"
                        ? "Service Date:"
                        : "Check-in:"}
                    </span>
                    <span className="font-semibold text-white">
                      {selectedBooking.type === "experiences" ? (
                        <>
                          {formatDate(
                            selectedBooking.selectedDateTime?.date ||
                              selectedBooking.selectedDate ||
                              selectedBooking.checkIn
                          )}{" "}
                          at{" "}
                          {selectedBooking.selectedDateTime?.time ||
                            selectedBooking.selectedTime ||
                            "N/A"}
                        </>
                      ) : selectedBooking.type === "services" ? (
                        formatDate(
                          selectedBooking.selectedDateTime?.date ||
                            selectedBooking.selectedDate ||
                            selectedBooking.checkIn
                        )
                      ) : (
                        formatDate(selectedBooking.checkIn)
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Refund Amount (if approved):</span>
                    <span className="font-bold text-emerald-400 text-lg">
                      ₱
                      {selectedBooking.grandTotal?.toFixed(2) ||
                        selectedBooking.totalAmount?.toFixed(2) ||
                        selectedBooking.price?.toFixed(2) ||
                        0}
                    </span>
                  </div>
                </div>
              </div>

              {refundReason && (
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 mb-6">
                  <p className="text-xs text-slate-400 mb-2">Your reason:</p>
                  <p className="text-white text-sm">{refundReason}</p>
                </div>
              )}

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-6">
                <p className="text-xs text-blue-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    The host will review your request and notify you of their decision.
                    Points earned from this booking will be deducted if approved.
                  </span>
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRefundReasonModal(false)}
                  disabled={isProcessingRefund}
                  className="flex-1 bg-slate-700 text-white py-3 rounded-lg font-semibold hover:bg-slate-600 transition-all border border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestRefund}
                  disabled={isProcessingRefund}
                  className="flex-1 bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessingRefund ? (
                    <>
                      <span className="animate-spin">⚙</span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
