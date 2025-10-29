import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Calendar,
  Users,
  DollarSign,
  Check,
  X,
  Clock,
  MapPin,
  Phone,
  Mail,
  Award,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import emailjs from "@emailjs/browser";
import LoadingSpinner from "../../loading/Loading";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

export default function HostMyBookings() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [bookingToAction, setBookingToAction] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState("list"); // "list" or "calendar"
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const itemsPerPage = 8;

  // Initialize EmailJS
  useEffect(() => {
    const publicKey = import.meta.env.VITE_EMAIL_JS_PUBLIC_KEY?.trim();
    if (publicKey) {
      try {
        emailjs.init({
          publicKey: publicKey,
          blockHeadless: false,
        });
        console.log("✓ EmailJS initialized successfully");
      } catch (err) {
        console.error("Failed to initialize EmailJS:", err);
      }
    } else {
      console.warn("EmailJS public key not found in environment variables");
    }
  }, []);

  // Fetch bookings for host's listings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);

        // Get all listings for this host
        const listingsRef = collection(db, "listings");
        const listingsQuery = query(
          listingsRef,
          where("hostId", "==", userData.id)
        );
        const listingsSnap = await getDocs(listingsQuery);
        const listingIds = listingsSnap.docs.map((doc) => doc.id);

        if (listingIds.length === 0) {
          setBookings([]);
          setFilteredBookings([]);
          setLoading(false);
          return;
        }

        // Chunk listingIds to handle Firestore 'in' query limit of 30
        const bookingPromises = [];
        const bookingsRef = collection(db, "bookings");
        for (let i = 0; i < listingIds.length; i += 30) {
          const chunk = listingIds.slice(i, i + 30);
          const bookingsQuery = query(
            bookingsRef,
            where("listing_id", "in", chunk)
          );
          bookingPromises.push(getDocs(bookingsQuery));
        }

        const bookingSnapshots = await Promise.all(bookingPromises);
        const bookingsDocs = bookingSnapshots.flatMap((snap) => snap.docs);

        // Enrich bookings with listing and guest data
        const enrichedBookings = await Promise.all(
          bookingsDocs.map(async (bookingDoc) => {
            const bookingData = bookingDoc.data();

            // Fetch listing data
            let listingData = null;
            const listingRef = doc(db, "listings", bookingData.listing_id);
            const listingSnap = await getDoc(listingRef);
            if (listingSnap.exists()) {
              listingData = { id: listingSnap.id, ...listingSnap.data() };
            }

            // Fetch guest data
            let guestData = null;
            const guestRef = doc(db, "users", bookingData.guest_id);
            const guestSnap = await getDoc(guestRef);
            if (guestSnap.exists()) {
              guestData = { id: guestSnap.id, ...guestSnap.data() };
            }

            return {
              id: bookingDoc.id,
              ...bookingData,
              listing: listingData,
              guest: guestData,
            };
          })
        );

        // Sort by creation date (newest first)
        enrichedBookings.sort(
          (a, b) => b.createdAt.toDate() - a.createdAt.toDate()
        );

        setBookings(enrichedBookings);
        filterBookings(enrichedBookings, statusFilter, searchTerm);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        toast.error("Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };

    if (userData) {
      fetchBookings();
    }
  }, [userData]);

  // Filter bookings based on search and status
  const filterBookings = (allBookings, status, search) => {
    let filtered = allBookings;

    // Filter by status
    if (status !== "all") {
      filtered = filtered.filter((booking) => booking.status === status);
    }

    // Filter by search term (guest name or listing title)
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(
        (booking) =>
          booking.guest?.fullName?.toLowerCase().includes(lowerSearch) ||
          booking.listing?.title?.toLowerCase().includes(lowerSearch)
      );
    }

    setFilteredBookings(filtered);
    setCurrentPage(1);
  };

  // Handle search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    filterBookings(bookings, statusFilter, value);
  };

  // Handle status filter
  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    filterBookings(bookings, status, searchTerm);
  };

  // Send booking confirmation email
  const sendBookingConfirmationEmail = async (booking, guestData) => {
    try {
      const listing = booking.listing;
      const serviceId = import.meta.env.VITE_EMAIL_JS_SERVICE_ID;
      const templateId = import.meta.env.VITE_BOOKING_EMAIL_JS_TEMPLATE_ID;

      if (!serviceId || !templateId) {
        console.warn("EmailJS service or template ID not configured");
        return;
      }

      if (!guestData?.email) {
        console.warn("Guest email not available, skipping email send");
        return;
      }

      // Calculate base price and service fee
      const totalAmount = booking.totalAmount || 0;
      const serviceFee = totalAmount * 0.05;

      // Generate booking type-specific details HTML
      let bookingDetailsHtml = "";
      if (booking.type === "stays") {
        const checkInDate = booking.checkIn
          ? new Date(
              booking.checkIn.toDate?.() || booking.checkIn
            ).toLocaleDateString()
          : "N/A";
        const checkOutDate = booking.checkOut
          ? new Date(
              booking.checkOut.toDate?.() || booking.checkOut
            ).toLocaleDateString()
          : "N/A";
        let nights = 1;
        if (booking.checkIn && booking.checkOut) {
          const checkInObj = new Date(
            booking.checkIn.toDate?.() || booking.checkIn
          );
          const checkOutObj = new Date(
            booking.checkOut.toDate?.() || booking.checkOut
          );
          nights = Math.max(
            Math.ceil((checkOutObj - checkInObj) / (1000 * 60 * 60 * 24)),
            1
          );
        }
        bookingDetailsHtml = `
          <div style="margin-bottom: 12px; display: flex; justify-content: space-between; font-size: 14px;">
            <span style="color: #6b7280; font-weight: 500;">Check-in Date</span>
            <span style="color: #1f2937; font-weight: 600;">${checkInDate}</span>
          </div>
          <div style="margin-bottom: 12px; display: flex; justify-content: space-between; font-size: 14px;">
            <span style="color: #6b7280; font-weight: 500;">Check-out Date</span>
            <span style="color: #1f2937; font-weight: 600;">${checkOutDate}</span>
          </div>
          <div style="margin-bottom: 12px; display: flex; justify-content: space-between; font-size: 14px;">
            <span style="color: #6b7280; font-weight: 500;">Number of Nights</span>
            <span style="color: #1f2937; font-weight: 600;">${nights}</span>
          </div>
        `;
      } else if (booking.type === "experiences") {
        const expDate = booking.selectedDateTime?.date || "N/A";
        const expTime = booking.selectedDateTime?.time || "N/A";
        const duration = listing?.duration || 0;
        bookingDetailsHtml = `
          <div style="margin-bottom: 12px; display: flex; justify-content: space-between; font-size: 14px;">
            <span style="color: #6b7280; font-weight: 500;">Experience Date</span>
            <span style="color: #1f2937; font-weight: 600;">${expDate}</span>
          </div>
          <div style="margin-bottom: 12px; display: flex; justify-content: space-between; font-size: 14px;">
            <span style="color: #6b7280; font-weight: 500;">Experience Time</span>
            <span style="color: #1f2937; font-weight: 600;">${expTime}</span>
          </div>
          <div style="margin-bottom: 12px; display: flex; justify-content: space-between; font-size: 14px;">
            <span style="color: #6b7280; font-weight: 500;">Duration</span>
            <span style="color: #1f2937; font-weight: 600;">${duration} hours</span>
          </div>
        `;
      } else if (booking.type === "services") {
        const svcDate = booking.selectedDateTime?.date || "N/A";
        const svcTime = booking.selectedDateTime?.time || "N/A";
        const duration = listing?.duration || 0;
        bookingDetailsHtml = `
          <div style="margin-bottom: 12px; display: flex; justify-content: space-between; font-size: 14px;">
            <span style="color: #6b7280; font-weight: 500;">Service Date</span>
            <span style="color: #1f2937; font-weight: 600;">${svcDate}</span>
          </div>
          <div style="margin-bottom: 12px; display: flex; justify-content: space-between; font-size: 14px;">
            <span style="color: #6b7280; font-weight: 500;">Service Time</span>
            <span style="color: #1f2937; font-weight: 600;">${svcTime}</span>
          </div>
          <div style="margin-bottom: 12px; display: flex; justify-content: space-between; font-size: 14px;">
            <span style="color: #6b7280; font-weight: 500;">Duration</span>
            <span style="color: #1f2937; font-weight: 600;">${duration} hours</span>
          </div>
        `;
      }

      // Prepare email template variables (MUST match template {{variables}})
      const emailParams = {
        to_email: guestData.email,
        guestName: guestData.fullName || "Guest",
        listingTitle: listing?.title || "N/A",
        listingLocation: listing?.location || "N/A",
        listingRating: listing?.rating || 0,
        listingType: listing?.type
          ? listing.type.charAt(0).toUpperCase() + listing.type.slice(1)
          : "Booking",
        bookingId: booking.id || "N/A",
        numberOfGuests: booking.numberOfGuests || booking.totalGuests || 1,
        basePrice: totalAmount.toFixed(2),
        serviceFee: serviceFee.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        dashboardLink: `${window.location.origin}/guest/my-bookings`,
      };

      // Send email using EmailJS
      console.log("Sending booking confirmation email to:", guestData.email);
      console.log("Email params:", emailParams);

      try {
        const response = await emailjs.send(serviceId, templateId, emailParams);

        console.log("✓ Booking confirmation email sent successfully", {
          status: response.status,
          to: guestData.email,
          bookingId: booking.id,
        });
      } catch (emailError) {
        // If primary template fails, try alternative approach
        console.warn(
          "Primary template failed, attempting alternative send:",
          emailError?.message
        );

        // Try using the alternative email service if available
        const altServiceId = import.meta.env.VITE_EMAIL_JS_ANOTHER_SERVICE_ID;
        const altPublicKey = import.meta.env.VITE_EMAIL_JS_ANOTHER_PUBLIC_KEY;

        if (altServiceId && altPublicKey) {
          try {
            emailjs.init({
              publicKey: altPublicKey,
              blockHeadless: false,
            });

            const altResponse = await emailjs.send(
              altServiceId,
              templateId,
              emailParams
            );

            console.log("✓ Email sent via alternative service:", {
              status: altResponse.status,
              to: guestData.email,
            });
          } catch (altError) {
            console.error(
              "Alternative email service also failed:",
              altError?.message
            );
            // Re-initialize with primary key for future emails
            emailjs.init({
              publicKey: import.meta.env.VITE_EMAIL_JS_PUBLIC_KEY,
              blockHeadless: false,
            });
          }
        } else {
          throw emailError;
        }
      }
    } catch (error) {
      console.error("Error sending booking confirmation email:", {
        message: error?.message,
        status: error?.status,
        errorText: error?.text,
        fullError: error,
      });
      // Don't throw error - email failure shouldn't stop booking confirmation
    }
  };

  // Handle confirm booking
  const handleConfirmBooking = async () => {
    if (!bookingToAction) return;

    try {
      setIsProcessing(true);

      // Get guest and host wallet data
      const guestWalletQuery = query(
        collection(db, "wallets"),
        where("user_id", "==", bookingToAction.guest_id)
      );
      const guestWalletSnap = await getDocs(guestWalletQuery);

      const hostWalletQuery = query(
        collection(db, "wallets"),
        where("user_id", "==", userData.id)
      );
      const hostWalletSnap = await getDocs(hostWalletQuery);

      // Check guest has sufficient balance
      if (guestWalletSnap.empty) {
        toast.error("Guest wallet not found");
        setIsProcessing(false);
        return;
      }

      const guestWalletDoc = guestWalletSnap.docs[0];
      const guestWalletData = guestWalletDoc.data();

      if (guestWalletData.balance < bookingToAction.totalAmount) {
        toast.error(
          `Guest has insufficient balance. Need ₱${bookingToAction.totalAmount.toLocaleString()} but has ₱${guestWalletData.balance.toLocaleString()}`
        );
        setIsProcessing(false);
        return;
      }

      const loadingToast = toast.loading("Processing booking confirmation...");

      // Update guest wallet (deduct)
      await updateDoc(doc(db, "wallets", guestWalletDoc.id), {
        balance: guestWalletData.balance - bookingToAction.totalAmount,
        total_spent:
          (guestWalletData.total_spent || 0) + bookingToAction.totalAmount,
      });

      // Create guest transaction
      await addDoc(collection(db, "transactions"), {
        amount: -bookingToAction.totalAmount,
        created_at: serverTimestamp(),
        type: "payment",
        status: "completed",
        user_id: bookingToAction.guest_id,
        wallet_id: guestWalletDoc.id,
      });

      // Create notification for guest about payment deduction
      await addDoc(collection(db, "notifications"), {
        userId: bookingToAction.guest_id,
        guestId: bookingToAction.guest_id,
        type: "payment",
        title: "Payment Successful",
        message: `An amount of ₱${bookingToAction.totalAmount.toLocaleString()} has been deducted from your wallet for your booking of "${
          bookingToAction.listing?.title
        }".`,
        listingId: bookingToAction.listing_id,
        bookingId: bookingToAction.id,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      // Update host wallet (add)
      if (!hostWalletSnap.empty) {
        const hostWalletDoc = hostWalletSnap.docs[0];
        const hostWalletData = hostWalletDoc.data();

        await updateDoc(doc(db, "wallets", hostWalletDoc.id), {
          balance: hostWalletData.balance + bookingToAction.totalAmount,
          total_cash_in:
            (hostWalletData.total_cash_in || 0) + bookingToAction.totalAmount,
        });

        // Create host transaction
        await addDoc(collection(db, "transactions"), {
          amount: bookingToAction.totalAmount,
          created_at: serverTimestamp(),
          type: "payment",
          status: "completed",
          user_id: userData.id,
          wallet_id: hostWalletDoc.id,
        });
      }

      // Update booking status to confirmed
      await updateDoc(doc(db, "bookings", bookingToAction.id), {
        status: "confirmed",
        confirmedAt: serverTimestamp(),
      });

      // Create notification for guest
      await addDoc(collection(db, "notifications"), {
        userId: bookingToAction.guest_id,
        guestId: bookingToAction.guest_id,
        type: "booking_confirmed",
        title: "Booking Confirmed",
        message: `Your booking for ${bookingToAction.listing?.title} has been confirmed!`,
        listingId: bookingToAction.listing_id,
        bookingId: bookingToAction.id,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      // Send booking confirmation email to guest
      const guestRef = doc(db, "users", bookingToAction.guest_id);
      const guestSnap = await getDoc(guestRef);
      const guestData = guestSnap.exists() ? guestSnap.data() : null;

      if (guestData) {
        await sendBookingConfirmationEmail(bookingToAction, guestData);
      }

      // Update local state
      const updatedBooking = {
        ...bookingToAction,
        status: "confirmed",
      };

      const updatedBookings = bookings.map((b) =>
        b.id === bookingToAction.id ? updatedBooking : b
      );

      setBookings(updatedBookings);
      filterBookings(updatedBookings, statusFilter, searchTerm);

      toast.dismiss(loadingToast);
      toast.success("Booking confirmed successfully!");

      setShowConfirmModal(false);
      setBookingToAction(null);
      setShowDetailsModal(false);
    } catch (error) {
      console.error("Error confirming booking:", error);
      toast.error("Failed to confirm booking");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle reject booking
  const handleRejectBooking = async () => {
    if (!bookingToAction) return;

    try {
      setIsProcessing(true);
      const loadingToast = toast.loading("Processing booking rejection...");

      // Update booking status to rejected
      await updateDoc(doc(db, "bookings", bookingToAction.id), {
        status: "rejected",
        rejectionReason: rejectReason,
        rejectedAt: serverTimestamp(),
      });

      // Create notification for guest
      await addDoc(collection(db, "notifications"), {
        userId: bookingToAction.guest_id,
        guestId: bookingToAction.guest_id,
        type: "booking_rejected",
        title: "Booking Rejected",
        message: `Your booking for ${bookingToAction.listing?.title} has been rejected. Reason: ${rejectReason}`,
        listingId: bookingToAction.listing_id,
        bookingId: bookingToAction.id,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      // Update local state
      const updatedBooking = {
        ...bookingToAction,
        status: "rejected",
      };

      const updatedBookings = bookings.map((b) =>
        b.id === bookingToAction.id ? updatedBooking : b
      );

      setBookings(updatedBookings);
      filterBookings(updatedBookings, statusFilter, searchTerm);

      toast.dismiss(loadingToast);
      toast.success("Booking rejected successfully!");

      setShowRejectModal(false);
      setBookingToAction(null);
      setRejectReason("");
      setShowDetailsModal(false);
    } catch (error) {
      console.error("Error rejecting booking:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteBooking = async () => {
    if (!bookingToAction) return;

    try {
      setIsProcessing(true);
      const loadingToast = toast.loading("Marking booking as completed...");

      // Update booking status to completed
      await updateDoc(doc(db, "bookings", bookingToAction.id), {
        status: "completed",
        completedAt: serverTimestamp(),
      });

      // Create notification for guest to leave a review
      await addDoc(collection(db, "notifications"), {
        userId: bookingToAction.guest_id,
        guestId: bookingToAction.guest_id,
        type: "booking_completed",
        title: "Booking Completed",
        message: `Your booking for ${bookingToAction.listing?.title} is complete! Please leave a review to share your experience.`,
        listingId: bookingToAction.listing_id,
        bookingId: bookingToAction.id,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      // Update local state
      const updatedBooking = {
        ...bookingToAction,
        status: "completed",
      };

      const updatedBookings = bookings.map((b) =>
        b.id === bookingToAction.id ? updatedBooking : b
      );

      setBookings(updatedBookings);
      filterBookings(updatedBookings, statusFilter, searchTerm);

      toast.dismiss(loadingToast);
      toast.success("Booking marked as completed!");

      setShowCompleteModal(false);
      setBookingToAction(null);
      setShowDetailsModal(false);
    } catch (error) {
      console.error("Error completing booking:", error);
      toast.error("Failed to mark booking as completed");
    } finally {
      setIsProcessing(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedBookings = filteredBookings.slice(
    startIdx,
    startIdx + itemsPerPage
  );

  // Get booking stats
  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    rejected: bookings.filter((b) => b.status === "rejected").length,
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-300";
      case "confirmed":
        return "bg-green-500/20 text-green-300";
      case "rejected":
        return "bg-red-500/20 text-red-300";
      default:
        return "bg-slate-500/20 text-slate-300";
    }
  };

  // Calendar functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getBookingsForDate = (date) => {
    const dateString = date.toISOString().split("T")[0];
    return bookings.filter((booking) => {
      const checkInDate = booking.checkIn
        ? booking.checkIn.toDate().toISOString().split("T")[0]
        : booking.selectedDate?.split("T")[0];
      const checkOutDate = booking.checkOut
        ? booking.checkOut.toDate().toISOString().split("T")[0]
        : null;

      if (checkOutDate) {
        return dateString >= checkInDate && dateString <= checkOutDate;
      }
      return dateString === checkInDate;
    });
  };

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className="bg-slate-700/20 rounded-lg p-2 h-24"
        />
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      const dayBookings = getBookingsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`rounded-lg p-2 h-24 cursor-pointer transition border-2 overflow-hidden ${
            isToday
              ? "border-indigo-500 bg-indigo-500/10"
              : selectedDate?.toDateString() === date.toDateString()
              ? "border-indigo-400 bg-indigo-500/20"
              : "border-slate-700 bg-slate-800 hover:bg-slate-700"
          }`}
        >
          <div className="font-semibold text-white text-sm mb-1">{day}</div>
          <div className="space-y-1 overflow-y-auto max-h-16">
            {dayBookings.slice(0, 2).map((booking) => (
              <div
                key={booking.id}
                className="text-xs px-2 py-1 rounded bg-indigo-500/30 text-indigo-200 truncate"
                title={booking.listing?.title}
              >
                {booking.listing?.title}
              </div>
            ))}
            {dayBookings.length > 2 && (
              <div className="text-xs px-2 py-1 text-slate-300">
                +{dayBookings.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-slate-900 pt-24 sm:pt-28 lg:pt-32">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 fixed top-0 w-full z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-slate-300 hover:text-indigo-400 font-medium transition"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>
            <h1 className="text-2xl font-bold text-white">Manage Bookings</h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="text-slate-400 text-sm font-medium mb-2">
              Total Bookings
            </div>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="text-yellow-400 text-sm font-medium mb-2">
              Pending
            </div>
            <div className="text-3xl font-bold text-yellow-300">
              {stats.pending}
            </div>
          </div>
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="text-green-400 text-sm font-medium mb-2">
              Confirmed
            </div>
            <div className="text-3xl font-bold text-green-300">
              {stats.confirmed}
            </div>
          </div>
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="text-red-400 text-sm font-medium mb-2">
              Rejected
            </div>
            <div className="text-3xl font-bold text-red-300">
              {stats.rejected}
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              viewMode === "list"
                ? "bg-indigo-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
              viewMode === "calendar"
                ? "bg-indigo-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Calendar View
          </button>
        </div>

        {/* Calendar View */}
        {viewMode === "calendar" && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 mb-8">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {currentMonth.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-300"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date())}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition text-sm font-medium"
                >
                  Today
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-300"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="text-center font-semibold text-slate-300 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2 mb-6">
              {renderCalendar()}
            </div>

            {/* Selected Date Details */}
            {selectedDate && (
              <div className="border-t border-slate-700 pt-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Bookings for{" "}
                  {selectedDate.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </h3>
                <div className="space-y-3">
                  {getBookingsForDate(selectedDate).length === 0 ? (
                    <p className="text-slate-400">No bookings on this date</p>
                  ) : (
                    getBookingsForDate(selectedDate).map((booking) => (
                      <div
                        key={booking.id}
                        className="bg-slate-700 rounded-lg p-4 flex items-center justify-between hover:bg-slate-600 transition cursor-pointer"
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowDetailsModal(true);
                        }}
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-white">
                            {booking.listing?.title}
                          </div>
                          <div className="text-sm text-slate-400">
                            {booking.guest?.fullName}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              booking.status
                            )}`}
                          >
                            {booking.status?.charAt(0).toUpperCase() +
                              booking.status?.slice(1)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search and Filter */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by guest name or listing..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap">
            {["all", "pending", "confirmed", "rejected"].map((status) => (
              <button
                key={status}
                onClick={() => handleStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition capitalize ${
                  statusFilter === status
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings Table - Only show in List View */}
        {viewMode === "list" && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            {paginatedBookings.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-slate-400 text-lg">No bookings found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700 bg-slate-700/50">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                          Guest
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                          Listing
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                          Dates
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                          Amount
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedBookings.map((booking) => (
                        <tr
                          key={booking.id}
                          className="border-b border-slate-700 hover:bg-slate-700/30 transition"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  booking.guest?.photoURL ||
                                  "https://via.placeholder.com/40"
                                }
                                alt={booking.guest?.fullName}
                                className="w-10 h-10 rounded-full"
                              />
                              <div>
                                <div className="text-sm font-medium text-white">
                                  {booking.guest?.fullName || "Unknown"}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {booking.guest?.email || "N/A"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-slate-200">
                              {booking.listing?.title || "Unknown"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-slate-200">
                              {booking.checkIn
                                ? formatDate(booking.checkIn)
                                : formatDate(booking.selectedDate)}{" "}
                              {booking.checkIn &&
                                `- ${formatDate(booking.checkOut)}`}
                            </div>
                            {booking.checkIn && (
                              <div className="text-xs text-slate-400">
                                {booking.guests}{" "}
                                {booking.guests === 1 ? "guest" : "guests"}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-white">
                              ₱{booking.totalAmount?.toLocaleString() || 0}
                            </div>
                            <div className="text-xs text-slate-400">
                              +₱{booking.serviceFee?.toLocaleString() || 0} fee
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                booking.status
                              )}`}
                            >
                              {booking.status?.charAt(0).toUpperCase() +
                                booking.status?.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => {
                                setSelectedBooking(booking);
                                setShowDetailsModal(true);
                              }}
                              className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700">
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    <span className="text-sm text-slate-400">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 transition"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-slate-800 rounded-2xl shadow-lg w-full max-w-2xl border border-slate-700 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700 flex-shrink-0">
              <h2 className="text-2xl font-bold text-white">Booking Details</h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedBooking(null);
                }}
                className="text-slate-400 hover:text-slate-200 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-6">
              {/* Guest Info */}
              <div className="mb-6 pb-6 border-b border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Guest Information
                </h3>
                <div className="flex items-center gap-4">
                  <img
                    src={
                      selectedBooking.guest?.photoURL ||
                      "https://via.placeholder.com/80"
                    }
                    alt={selectedBooking.guest?.fullName}
                    className="w-16 h-16 rounded-full"
                  />
                  <div className="flex-1 space-y-2">
                    <div>
                      <div className="text-sm text-slate-400">Name</div>
                      <div className="text-white font-medium">
                        {selectedBooking.guest?.fullName || "Unknown"}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div>
                        <div className="text-sm text-slate-400 flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          Email
                        </div>
                        <div className="text-white font-medium">
                          {selectedBooking.guest?.email || "N/A"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-400 flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          Phone
                        </div>
                        <div className="text-white font-medium">
                          {selectedBooking.guest?.phone || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Listing Info */}
              <div className="mb-6 pb-6 border-b border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Listing Information
                </h3>
                <div className="space-y-2">
                  <div>
                    <div className="text-sm text-slate-400">Title</div>
                    <div className="text-white font-medium">
                      {selectedBooking.listing?.title || "Unknown"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Location
                    </div>
                    <div className="text-white font-medium">
                      {selectedBooking.listing?.location || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Type</div>
                    <div className="text-white font-medium capitalize">
                      {selectedBooking.listing?.type || "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="mb-6 pb-6 border-b border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Booking Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-slate-400 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Check-in
                    </div>
                    <div className="text-white font-medium">
                      {selectedBooking.checkIn
                        ? formatDate(selectedBooking.checkIn)
                        : formatDate(selectedBooking.selectedDate)}
                    </div>
                  </div>
                  {selectedBooking.checkOut && (
                    <div>
                      <div className="text-sm text-slate-400 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Check-out
                      </div>
                      <div className="text-white font-medium">
                        {formatDate(selectedBooking.checkOut)}
                      </div>
                    </div>
                  )}
                  {selectedBooking.selectedTime && (
                    <div>
                      <div className="text-sm text-slate-400 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Time
                      </div>
                      <div className="text-white font-medium">
                        {selectedBooking.selectedTime}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-slate-400 flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      Guests
                    </div>
                    <div className="text-white font-medium">
                      {selectedBooking.guests}{" "}
                      {selectedBooking.guests === 1 ? "guest" : "guests"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="mb-6 pb-6 border-b border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Payment Details
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Booking Amount</span>
                    <span className="text-white font-medium">
                      ₱{selectedBooking.totalAmount?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Service Fee (10%)</span>
                    <span className="text-white font-medium">
                      ₱{selectedBooking.serviceFee?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-700">
                    <span className="text-white font-semibold">
                      Total Amount
                    </span>
                    <span className="text-white font-bold text-lg">
                      ₱
                      {(
                        (selectedBooking.totalAmount || 0) +
                        (selectedBooking.serviceFee || 0)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Status
                </h3>
                <span
                  className={`inline-block px-4 py-2 rounded-lg text-sm font-medium ${getStatusColor(
                    selectedBooking.status
                  )}`}
                >
                  {selectedBooking.status?.charAt(0).toUpperCase() +
                    selectedBooking.status?.slice(1)}
                </span>
              </div>
            </div>

            {/* Modal Footer */}

            <div className="p-6 border-t border-slate-700 flex-shrink-0">
              {selectedBooking.status === "pending" && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setShowConfirmModal(true);

                      setBookingToAction(selectedBooking);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Confirm Booking
                  </button>

                  <button
                    onClick={() => {
                      setShowRejectModal(true);

                      setBookingToAction(selectedBooking);
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Reject Booking
                  </button>
                </div>
              )}

              {selectedBooking.status === "confirmed" && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 text-center py-3 bg-green-500/10 rounded-lg border border-green-500/20 flex items-center justify-center">
                    <p className="text-green-300 font-medium">
                      Booking Confirmed
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setShowCompleteModal(true);

                      setBookingToAction(selectedBooking);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Mark as Completed
                  </button>
                </div>
              )}

              {selectedBooking.status === "completed" && (
                <div className="text-center py-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <Check className="w-6 h-6 text-blue-400 mx-auto mb-2" />

                  <p className="text-blue-300 font-medium">
                    This booking has been marked as completed.
                  </p>
                </div>
              )}

              {selectedBooking.status === "rejected" && (
                <div className="text-center py-4 bg-red-500/10 rounded-lg border border-red-500/20">
                  <X className="w-6 h-6 text-red-400 mx-auto mb-2" />

                  <p className="text-red-300 font-medium">
                    This booking has been rejected.
                  </p>

                  {selectedBooking.rejectionReason && (
                    <p className="text-red-300 text-sm mt-2">
                      Reason: {selectedBooking.rejectionReason}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Booking Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-slate-800 rounded-2xl shadow-lg w-full max-w-md p-6 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-4">
              Confirm Booking?
            </h2>
            <p className="text-slate-300 mb-6">
              By confirming this booking, you're allowing the guest to proceed
              with payment. Their wallet will be debited and the booking will be
              marked as confirmed.
            </p>

            <div className="bg-slate-700 rounded-lg p-4 mb-6">
              <div className="text-sm text-slate-400 mb-2">Total Amount</div>
              <div className="text-2xl font-bold text-white">
                ₱{bookingToAction?.totalAmount?.toLocaleString() || 0}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConfirmBooking}
                disabled={isProcessing}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition"
              >
                {isProcessing ? "Processing..." : "Confirm"}
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setBookingToAction(null);
                }}
                disabled={isProcessing}
                className="flex-1 border border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold py-3 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Booking Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-slate-800 rounded-2xl shadow-lg w-full max-w-md p-6 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-4">
              Reject Booking?
            </h2>
            <p className="text-slate-300 mb-4">
              Please provide a reason for rejecting this booking. The guest will
              be notified.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 mb-6 resize-none"
              rows={4}
            />

            <div className="flex gap-3">
              <button
                onClick={handleRejectBooking}
                disabled={isProcessing || !rejectReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition"
              >
                {isProcessing ? "Processing..." : "Reject"}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setBookingToAction(null);
                  setRejectReason("");
                }}
                disabled={isProcessing}
                className="flex-1 border border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold py-3 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Booking Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-slate-800 rounded-2xl shadow-lg w-full max-w-md p-6 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-4">
              Mark as Completed?
            </h2>
            <p className="text-slate-300 mb-6">
              This will mark the booking as completed and notify the guest to
              leave a review. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCompleteBooking}
                disabled={isProcessing}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition"
              >
                {isProcessing ? "Processing..." : "Confirm"}
              </button>
              <button
                onClick={() => {
                  setShowCompleteModal(false);
                  setBookingToAction(null);
                }}
                disabled={isProcessing}
                className="flex-1 border border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold py-3 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
