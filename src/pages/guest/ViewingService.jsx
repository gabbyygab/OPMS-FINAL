import { useEffect, useState, useRef } from "react";
import {
  MapPin,
  Star,
  Heart,
  Share2,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  Award,
  MessageCircle,
  Check,
  Info,
  Calendar,
  DollarSign,
  Shield,
  Users,
  Briefcase,
  Phone,
  Mail,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../../firebase/firebase";
import { validateCoupon, calculateDiscount } from "../../utils/couponUtils";
import { getServiceFeeForType } from "../../utils/platformSettingsUtils";
import { sendBookingConfirmationEmail } from "../../utils/sendBookingConfirmationEmail";
import {
  doc,
  getDoc,
  getDocs,
  query,
  where,
  collection,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import LoadingSpinner from "../../loading/Loading";
import { useAuth } from "../../context/AuthContext";
import VerificationBanner from "../../components/Verification";
import { sendOtpToUser } from "../../utils/sendOtpToUser";
import { toast } from "react-toastify";
import ServiceLocationMap from "../../components/ServiceLocationMap";
import { motion } from "framer-motion";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

const reviews = [
  {
    id: 1,
    author: "Roberto M.",
    avatar: "https://i.pravatar.cc/150?img=11",
    rating: 5,
    date: "October 2025",
    comment:
      "Excellent service! Very professional and reliable. They arrived on time and completed the work efficiently. Highly recommend for anyone needing this service.",
  },
  {
    id: 2,
    author: "Maria C.",
    avatar: "https://i.pravatar.cc/150?img=14",
    rating: 5,
    date: "September 2025",
    comment:
      "Outstanding quality and attention to detail. The provider was courteous and explained everything clearly. Will definitely use their services again!",
  },
  {
    id: 3,
    author: "Jose P.",
    avatar: "https://i.pravatar.cc/150?img=17",
    rating: 5,
    date: "August 2025",
    comment:
      "Great value for money! Very satisfied with the results. The service provider was knowledgeable and professional throughout. Strongly recommended!",
  },
];

export default function ServiceDetailPage() {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
      key: "selection",
    },
  ]);
  const [serviceType, setServiceType] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [guestRewards, setGuestRewards] = useState(null);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [serviceData, setServiceData] = useState({});
  const [reviewsData, setReviewsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingVerification, setIsLoadingVerification] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isBookingCardVisible, setIsBookingCardVisible] = useState(true);
  const [serviceFeePercentage, setServiceFeePercentage] = useState(null);
  const bookingCardRef = useRef(null);

  const { user, isVerified } = useAuth();
  const navigate = useNavigate();
  const { listing_id } = useParams();

  // Fetch service fee from platformSettings
  useEffect(() => {
    const fetchServiceFee = async () => {
      try {
        const fee = await getServiceFeeForType("services");
        setServiceFeePercentage(fee);
      } catch (error) {
        console.error("Error fetching service fee:", error);
        setServiceFeePercentage(5); // Fallback to 5%
      }
    };
    fetchServiceFee();
  }, []);

  const handleVerification = async () => {
    try {
      setIsLoadingVerification(true);
      await sendOtpToUser(user);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingVerification(false);
      navigate("/account-verification");
    }
  };

  const handleActionWithVerification = (action) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    if (!isVerified) {
      toast.warning("Please verify your account first", {
        position: "top-center",
      });
      return;
    }
    action();
  };

  // Date picker helpers
  const formatDateForDisplay = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleDateRangeChange = (ranges) => {
    setDateRange([ranges.selection]);
  };

  const handleApplyDates = () => {
    const start = dateRange[0].startDate;
    const end = dateRange[0].endDate;

    if (start >= end) {
      toast.error("End date must be after start date.");
      return;
    }

    // Helper to format date as YYYY-MM-DD in local timezone
    const toYMD = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    setStartDate(toYMD(start));
    setEndDate(toYMD(end));
    setShowDatePicker(false);
  };

  const handleConfirmBooking = async () => {
    if (!user) {
      toast.error("Please log in to book");
      return;
    }

    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      toast.error("End date must be after start date");
      return;
    }

    try {
      const loadingToast = toast.loading("Processing your booking...");

      // Create booking with pending status
      // Payment will be processed only when host confirms the booking
      const bookingData = {
        type: "services",
        listing_id: listing_id,
        guest_id: user.uid,
        hostId: serviceData.hostId,
        guestName: user.displayName || "Guest",
        startDate: startDate,
        endDate: endDate,
        serviceType: serviceType,
        additionalNotes: additionalNotes,
        baseAmount: basePrice,
        discountAmount: discountAmount,
        discountType: isValidPromo ? serviceData.discount?.type || null : null,
        pointsUsed: pointsToUse || 0,
        totalAmount: totalPrice,
        serviceFee: serviceFee,
        grandTotal: finalTotal,
        promoCode: promoCode || null,
        status: "pending",
        createdAt: serverTimestamp(),
      };
      const bookingRef = await addDoc(collection(db, "bookings"), bookingData);

      // Create notification for host
      const notificationData = {
        userId: serviceData.hostId,
        guestId: user.uid,
        type: "booking",
        title: "New Booking",
        message: `${user.displayName || "A guest"} has booked your ${
          serviceData.title
        } from ${startDate} to ${endDate}`,
        listingId: listing_id,
        bookingId: bookingRef.id,
        guestName: user.displayName || "A guest",
        guestAvatar: null,
        isRead: false,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, "notifications"), notificationData);

      // Send booking confirmation email to guest
      try {
        const guestData = {
          email: user.email,
          fullName: user.fullName || user.displayName || "Guest",
        };

        const bookingWithId = {
          ...bookingData,
          id: bookingRef.id,
        };

        await sendBookingConfirmationEmail(
          bookingWithId,
          { type: "services", ...serviceData },
          guestData
        );
      } catch (emailError) {
        console.error("Error sending booking email:", emailError);
        // Don't fail the booking if email fails
      }

      // DO NOT process payment here - payment will be processed when host confirms the booking
      // This allows the host to accept or reject the booking before payment is taken

      toast.dismiss(loadingToast);
      toast.success(
        "Booking request sent successfully! Awaiting host confirmation..."
      );
      setShowBookingModal(false);
      navigate("/guest/my-bookings");
    } catch (error) {
      console.error("Error confirming booking:", error);
      toast.error("Failed to confirm booking. Please try again.");
    }
  };

  const basePrice = serviceData?.price || 0;

  // Calculate discount if promo code is valid
  const [couponValidationResult, setCouponValidationResult] = useState({
    valid: false,
    coupon: null,
    message: "",
  });

  // Validate coupon when it changes
  useEffect(() => {
    const validatePromoCode = async () => {
      if (!promoCode || !serviceData.hostId) {
        setCouponValidationResult({ valid: false, coupon: null, message: "" });
        return;
      }

      const result = await validateCoupon(promoCode, serviceData.hostId);
      setCouponValidationResult(result);
    };

    const debounceTimer = setTimeout(validatePromoCode, 500);
    return () => clearTimeout(debounceTimer);
  }, [promoCode, serviceData.hostId]);

  let discountAmount = 0;
  let isValidPromo = couponValidationResult.valid;

  if (isValidPromo && couponValidationResult.coupon) {
    discountAmount = calculateDiscount(basePrice, couponValidationResult.coupon);
  }

  const pointsDiscount = pointsToUse;
  const totalPrice = basePrice - discountAmount - pointsDiscount;
  const feePercentage = serviceFeePercentage !== null ? serviceFeePercentage : 5;
  const serviceFee = totalPrice * (feePercentage / 100);
  const finalTotal = totalPrice + serviceFee;

  const nextPhoto = () => {
    setCurrentPhotoIndex(
      (prev) => (prev + 1) % (serviceData?.photos?.length || 1)
    );
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) =>
      prev === 0 ? (serviceData?.photos?.length || 1) - 1 : prev - 1
    );
  };

  useEffect(() => {
    const getSelectedService = async () => {
      try {
        setLoading(true);
        // Fetch service listing from listings collection
        const serviceRef = doc(db, "listings", listing_id);
        const serviceSnap = await getDoc(serviceRef);

        if (!serviceSnap.exists()) {
          console.log("No such service!");
          return;
        }

        const data = serviceSnap.data();

        // Fetch reviews using listing_id
        const reviewsRef = collection(db, "reviews");
        const q = query(reviewsRef, where("listingId", "==", listing_id));
        const reviewSnap = await getDocs(q);
        const reviewCount = reviewSnap.size;

        let totalRating = 0;
        reviewSnap.docs.forEach(doc => {
          totalRating += doc.data().rating;
        });
        const averageRating = reviewCount > 0 ? (totalRating / reviewCount).toFixed(1) : 0;

        // Fetch review details with user data
        const reviewsWithUsers = await Promise.all(
          reviewSnap.docs.map(async (reviewDoc) => {
            const reviewData = reviewDoc.data();
            let userData = null;

            if (reviewData.guestId) {
              const userRef = doc(db, "users", reviewData.guestId);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                userData = userSnap.data();
              }
            }

            return {
              id: reviewDoc.id,
              ...reviewData,
              user: userData,
            };
          })
        );

        // Fetch provider/host data
        let providerData = null;
        if (data.hostId) {
          const providerRef = doc(db, "users", data.hostId);
          const providerSnap = await getDoc(providerRef);
          if (providerSnap.exists()) {
            providerData = { id: providerSnap.id, ...providerSnap.data() };
          }
        }

        setServiceData({ ...data, reviewCount, rating: averageRating, provider: providerData });
        setReviewsData(reviewsWithUsers || []);

        // Update the listing document with the new rating and review count
        if (serviceSnap.exists()) {
          const listingRef = doc(db, "listings", listing_id);
          await updateDoc(listingRef, {
            rating: averageRating,
            reviewCount: reviewCount
          });
        }

        // Set first available date and service type
        if (
          Array.isArray(data?.availableDates) &&
          data.availableDates.length > 0
        ) {
          const firstStart = data.availableDates[0].startDate || "";
          const firstEnd = data.availableDates[0].endDate || "";
          setStartDate(firstStart);
          setEndDate(firstEnd);
          if (firstStart && firstEnd) {
            setDateRange([
              {
                startDate: new Date(firstStart),
                endDate: new Date(firstEnd),
                key: "selection",
              },
            ]);
          }
        }
        if (Array.isArray(data?.serviceTypes) && data.serviceTypes.length > 0) {
          setServiceType(data.serviceTypes[0]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    getSelectedService();
  }, [listing_id]);

  // Fetch guest rewards for points redemption
  useEffect(() => {
    const fetchRewards = async () => {
      if (!user?.uid) return;
      try {
        const rewardsQuery = query(
          collection(db, "rewards"),
          where("userId", "==", user.uid)
        );
        const rewardsSnap = await getDocs(rewardsQuery);
        if (!rewardsSnap.empty) {
          setGuestRewards(rewardsSnap.docs[0].data());
        }
      } catch (error) {
        console.error("Error fetching rewards:", error);
      }
    };
    fetchRewards();
  }, [user?.uid]);

  // Fetch service fee from platform settings
  useEffect(() => {
    const fetchServiceFee = async () => {
      try {
        const feePercentage = await getServiceFeeForType("services");
        setServiceFeePercentage(feePercentage);
      } catch (error) {
        console.error("Error fetching service fee:", error);
        setServiceFeePercentage(10); // Default to 10% on error
      }
    };
    fetchServiceFee();
  }, []);

  // Track visibility of booking card
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsBookingCardVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (bookingCardRef.current) {
      observer.observe(bookingCardRef.current);
    }

    return () => {
      if (bookingCardRef.current) {
        observer.unobserve(bookingCardRef.current);
      }
    };
  }, []);

  if (loading) return <LoadingSpinner />;
  console.log(serviceData);

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-slate-800 border-b border-slate-700 w-full z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                if (!user) {
                  navigate("/");
                } else {
                  window.history.back();
                }
              }}
              className="flex items-center gap-2 text-slate-300 hover:text-indigo-400 font-medium transition"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-700 transition text-slate-300">
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Share</span>
              </button>
              <button
                onClick={() =>
                  handleActionWithVerification(() => setIsFavorite(!isFavorite))
                }
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-700 transition text-slate-300"
              >
                <Heart
                  className={`w-4 h-4 ${
                    isFavorite ? "fill-red-500 text-red-500" : ""
                  }`}
                />
                <span className="hidden sm:inline text-sm">Save</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 mt-[64px]">
        {/* Verification Banner */}
        {!isVerified && (
          <div className="mb-6">
            <VerificationBanner handleVerification={handleVerification} />
          </div>
        )}

        {/* Title Section */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-3">
            <h1 className="text-3xl font-bold text-white">
              {serviceData?.title || "Loading..."}
            </h1>
            {serviceData?.isVerified && (
              <div className="flex items-center gap-1 px-3 py-1 bg-indigo-600/20 rounded-full">
                <Shield className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-medium text-indigo-400">
                  Verified
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm mb-3">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-white">
                {serviceData?.rating || "New"}
              </span>
              <span className="text-slate-400">
                ({serviceData?.reviewCount || 0} reviews)
              </span>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <MapPin className="w-4 h-4" />
              {serviceData?.location || "Service Area"}
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <Briefcase className="w-4 h-4" />
              {serviceData?.category || "General Service"}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-indigo-400">
            <Clock className="w-4 h-4" />
            <span>
              {serviceData?.responseTime || "Responds within 24 hours"}
            </span>
          </div>
        </div>

        {/* Photo Gallery and Provider Info Side by Side */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Photos Section */}
          <div className="flex flex-col">
            <div className="relative h-[450px] rounded-xl overflow-hidden mb-4">
              <img
                src={
                  serviceData?.photos?.[0] ||
                  "https://via.placeholder.com/800"
                }
                alt="Main"
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setShowAllPhotos(true)}
              />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition cursor-pointer" onClick={() => setShowAllPhotos(true)} />
            </div>
            <button
              onClick={() => setShowAllPhotos(true)}
              className="w-full px-4 py-2 bg-slate-800/50 backdrop-blur-md border border-slate-700/50 text-slate-200 rounded-lg font-medium hover:bg-slate-700/50 transition"
            >
              Show all {serviceData?.photos?.length || 0} photos
            </button>
          </div>

          {/* Provider Info Card */}
          <div className="flex flex-col">
            <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl shadow-lg p-6 border border-slate-700/50 h-[450px] mb-4 overflow-y-auto">
              <h3 className="text-xl font-semibold text-white mb-4">
                Service Provider
              </h3>
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={
                    serviceData?.provider?.photoURL ||
                    "https://via.placeholder.com/100"
                  }
                  alt={serviceData?.provider?.fullName || "Provider"}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <h4 className="font-semibold text-white">
                    {serviceData?.provider?.fullName || "Professional"}
                  </h4>
                  <p className="text-slate-400 text-sm">
                    {serviceData?.experienceYears || 5}+ years experience
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="w-4 h-4 text-indigo-400" />
                  <span>
                    {serviceData?.provider?.phone || "Available after booking"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-4 h-4 text-indigo-400" />
                  <span>
                    {serviceData?.provider?.email || "Available after booking"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Provider Info */}
            <div className="pb-8 border-b border-slate-700">
              <div className="flex items-center justify-between mb-4 bg-slate-800/50 backdrop-blur-md rounded-xl p-6 border border-slate-700/50">
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-2">
                    Service by{" "}
                    {serviceData?.provider?.fullName || "Professional"}
                  </h2>
                  <div className="flex items-center gap-3 text-slate-400 text-sm">
                    <span>
                      {serviceData?.experienceYears || 5}+ years experience
                    </span>
                    <span>·</span>
                    <span>
                      {serviceData?.completedJobs || 100}+ jobs completed
                    </span>
                  </div>
                </div>
                <img
                  src={
                    serviceData?.provider?.photoURL ||
                    "https://via.placeholder.com/100"
                  }
                  alt={serviceData?.provider?.fullName || "Provider"}
                  className="w-14 h-14 rounded-full"
                />
              </div>
              <div className="space-y-2">
                {serviceData?.provider?.isVerified && (
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Award className="w-4 h-4 text-indigo-400" />
                    <span>
                      Verified Professional · Member since{" "}
                      {serviceData?.provider?.createdAt
                        ? new Date(
                            serviceData.provider.createdAt.toDate()
                          ).toLocaleDateString("en-PH", {
                            year: "numeric",
                            month: "long",
                          })
                        : "—"}
                    </span>
                  </div>
                )}
                {serviceData?.certifications &&
                  serviceData.certifications.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Shield className="w-4 h-4 text-green-400" />
                      <span>Licensed & Insured</span>
                    </div>
                  )}
              </div>
            </div>

            {/* Service Description */}
            <div className="pb-8 border-b border-slate-700">
              <h3 className="text-xl font-semibold text-white mb-4">
                About this service
              </h3>
              <p className="text-slate-300 leading-relaxed mb-6 bg-slate-800/50 backdrop-blur-md p-6 rounded-xl border border-slate-700/50">
                {serviceData?.description || "No description available."}
              </p>

              {Array.isArray(serviceData?.highlights) &&
                serviceData.highlights.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    {serviceData.highlights.map((highlight, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 text-slate-300 bg-slate-700/50 backdrop-blur-md px-4 py-3 rounded-lg border border-slate-600/50 hover:bg-slate-700 hover:border-indigo-500/30 transition"
                      >
                        <Check className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {/* Services Offered */}
            {Array.isArray(serviceData?.serviceTypes) &&
              serviceData.serviceTypes.length > 0 && (
                <div className="pb-8 border-b border-slate-700">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Services offered
                  </h3>
                  <div className="space-y-3">
                    {serviceData.serviceTypes.map((service, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between p-4 bg-slate-800 rounded-lg"
                      >
                        <div className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-slate-200 font-medium">
                              {service}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Service Area */}
            {Array.isArray(serviceData?.serviceAreas) &&
              serviceData.serviceAreas.length > 0 && (
                <div className="pb-8 border-b border-slate-700">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Service areas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {serviceData.serviceAreas.map((area, idx) => (
                      <div
                        key={idx}
                        className="px-4 py-2 bg-slate-800 rounded-full text-slate-300 text-sm"
                      >
                        {area}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Service Location Map */}
            {serviceData?.location && (
              <div className="pb-8 border-b border-slate-700">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Service location
                </h3>
                <ServiceLocationMap
                  location={serviceData.location}
                  serviceTitle={serviceData.title}
                />
              </div>
            )}

            {/* Certifications */}
            {Array.isArray(serviceData?.certifications) &&
              serviceData.certifications.length > 0 && (
                <div className="pb-8 border-b border-slate-700">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Certifications & Licenses
                  </h3>
                  <div className="space-y-2">
                    {serviceData.certifications.map((cert, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Award className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-300">{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Reviews */}
            <div className="pb-8 border-b border-slate-700">
              <div className="flex items-center gap-2 mb-6">
                <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                <h3 className="text-xl font-semibold text-white">
                  {serviceData?.rating || 0} · {serviceData?.reviewCount || 0}{" "}
                  reviews
                </h3>
              </div>
              <div className="space-y-6">
                {reviewsData && reviewsData.length > 0 ? (
                  reviewsData.map((review) => (
                    <div
                      key={review.id}
                      className="flex gap-4 bg-slate-800/50 backdrop-blur-md p-6 rounded-xl border border-slate-700/50"
                    >
                      <img
                        src={
                          review.user?.photoURL ||
                          "https://via.placeholder.com/100"
                        }
                        alt={review.user?.fullName || "User"}
                        className="w-12 h-12 rounded-full flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white">
                            {review.user?.fullName || "Anonymous"}
                          </span>
                          <span className="text-slate-500 text-sm">·</span>
                          <span className="text-slate-500 text-sm">
                            {review.createdAt
                              ? new Date(
                                  review.createdAt.toDate()
                                ).toLocaleDateString("en-US", {
                                  month: "long",
                                  year: "numeric",
                                })
                              : "Recently"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {Array.from({ length: review.rating || 5 }).map(
                            (_, i) => (
                              <Star
                                key={i}
                                className="w-3 h-3 fill-yellow-400 text-yellow-400"
                              />
                            )
                          )}
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed">
                          {review.comment || review.review || "Great service!"}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-400">No reviews yet. Be the first to review this service!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Terms & Conditions */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Terms & conditions
              </h3>
              <div className="space-y-3">
                {serviceData?.terms?.map((term, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">{term}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <div ref={bookingCardRef} className="bg-slate-800/50 backdrop-blur-md rounded-2xl shadow-lg p-6 border border-slate-700/50 sticky top-24">
              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-white">
                    ₱{serviceData?.price?.toLocaleString() || 0}
                  </span>
                  <span className="text-slate-400">starting price</span>
                </div>
                <p className="text-xs text-slate-400">
                  Final price may vary based on service requirements
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <button
                  onClick={() => {
                    if (startDate && endDate) {
                      setDateRange([
                        {
                          startDate: new Date(startDate),
                          endDate: new Date(endDate),
                          key: "selection",
                        },
                      ]);
                    }
                    setShowDatePicker(true);
                  }}
                  className="w-full border-2 border-slate-600 rounded-xl p-4 bg-gradient-to-br from-slate-700 to-slate-800 hover:border-indigo-500/50 transition-colors cursor-pointer text-left"
                >
                  <label className="text-xs font-semibold text-slate-400 block mb-3 uppercase tracking-wider">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Select Service Dates
                  </label>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Start Date</div>
                      <div className="text-sm font-semibold text-white">
                        {startDate ? formatDateForDisplay(startDate) : "Select date"}
                      </div>
                    </div>
                    <div className="text-slate-400">→</div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500 mb-1">End Date</div>
                      <div className="text-sm font-semibold text-white">
                        {endDate ? formatDateForDisplay(endDate) : "Select date"}
                      </div>
                    </div>
                  </div>
                </button>

                <div className="border border-slate-600 rounded-lg p-3 bg-slate-700">
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    SERVICE TYPE
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded bg-slate-700 text-white"
                  >
                    {Array.isArray(serviceData?.serviceTypes) &&
                    serviceData.serviceTypes.length > 0 ? (
                      serviceData.serviceTypes.map((type, idx) => (
                        <option key={idx} value={type}>
                          {type}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        No services available
                      </option>
                    )}
                  </select>
                </div>

                <div className="border border-slate-600 rounded-lg p-3 bg-slate-700">
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    COUPON OR PROMO CODE (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Enter promo code"
                    className="w-full text-sm font-medium focus:outline-none rounded-lg bg-slate-600/50 text-white placeholder-slate-400 px-3 py-2 border border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>

                <div className="border border-slate-600 rounded-lg p-3 bg-slate-700">
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    ADDITIONAL NOTES (OPTIONAL)
                  </label>
                  <textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Describe your service needs..."
                    rows={3}
                    className="w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded bg-slate-700 text-white resize-none"
                  />
                </div>

                {/* Points Redemption Section */}
                {guestRewards && (guestRewards.availablePoints || 0) > 0 && (
                  <div className="border-2 border-indigo-500/30 rounded-xl p-4 bg-gradient-to-br from-indigo-700/20 to-indigo-800/20">
                    <label className="text-xs font-semibold text-indigo-400 block mb-3 uppercase tracking-wider flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Redeem Points (Optional)
                    </label>
                    <p className="text-xs text-slate-300 mb-3">
                      Available: <span className="font-bold text-indigo-300">{guestRewards.availablePoints || 0}</span> points (₱{guestRewards.availablePoints || 0})
                    </p>
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="range"
                        min="0"
                        max={guestRewards.availablePoints || 0}
                        value={pointsToUse}
                        onChange={(e) => setPointsToUse(Number(e.target.value))}
                        className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <input
                        type="number"
                        min="0"
                        max={guestRewards.availablePoints || 0}
                        value={pointsToUse}
                        onChange={(e) =>
                          setPointsToUse(
                            Math.min(
                              Number(e.target.value),
                              guestRewards.availablePoints || 0
                            )
                          )
                        }
                        className="w-16 px-2 py-1 bg-slate-600/50 border border-slate-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <p className="text-xs text-indigo-300">
                      Using <span className="font-bold">₱{pointsToUse}</span> in points
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() =>
                  handleActionWithVerification(() => setShowBookingModal(true))
                }
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition mb-4"
              >
                Request service
              </button>

              <p className="text-center text-sm text-slate-400 mb-6">
                Free quote · No commitment required
              </p>

              <div className="space-y-3 text-sm mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Base price</span>
                  <span className="font-medium text-white">
                    ₱{basePrice.toLocaleString()}
                  </span>
                </div>

                {/* Discount Row - Only show if valid promo code */}
                {isValidPromo && discountAmount > 0 && (
                  <div className="flex items-center justify-between text-emerald-400">
                    <span className="text-emerald-300/80">
                      Discount ({couponValidationResult.coupon?.type === "percentage"
                        ? `${couponValidationResult.coupon?.discount}%`
                        : "Fixed"})
                    </span>
                    <span className="font-semibold text-emerald-400">
                      -₱{discountAmount.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Points Redemption Row - Only show if points are being used */}
                {pointsToUse > 0 && (
                  <div className="flex items-center justify-between text-indigo-400">
                    <span className="text-indigo-300/80">
                      Points Redeemed
                    </span>
                    <span className="font-semibold text-indigo-400">
                      -₱{pointsToUse?.toLocaleString() || 0}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Service fee</span>
                  <span className="font-medium text-white">
                    ₱{serviceFee.toLocaleString()}
                  </span>
                </div>
                <div className="pt-3 border-t border-slate-600 flex items-center justify-between">
                  <span className="font-semibold text-white">
                    Estimated total
                  </span>
                  <span className="font-bold text-white text-lg">
                    ₱{finalTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() =>
                  handleActionWithVerification(() =>
                    navigate(
                      `/guest/messages/${user?.uid}/${serviceData?.hostId}`
                    )
                  )
                }
                className="w-full flex items-center justify-center gap-2 py-3 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition"
              >
                <MessageCircle className="w-4 h-4" />
                Contact Provider
              </button>

              <div className="mt-6 pt-6 border-t border-slate-700 space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Phone className="w-4 h-4" />
                  <span>
                    {serviceData?.provider?.phone || "Available after booking"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Mail className="w-4 h-4" />
                  <span>
                    {serviceData?.provider?.email || "Available after booking"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Photo Gallery Modal */}
      {showAllPhotos && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setShowAllPhotos(false)}
              className="text-white hover:bg-white/10 p-2 rounded-lg transition"
            >
              <X className="w-6 h-6" />
            </button>
            <span className="text-white text-sm">
              {currentPhotoIndex + 1} / {serviceData?.photos?.length || 0}
            </span>
          </div>

          <div className="flex-1 relative flex items-center justify-center">
            <button
              onClick={prevPhoto}
              className="absolute left-4 text-white hover:bg-white/10 p-3 rounded-full transition z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="w-full h-[600px] flex items-center justify-center bg-black">
              <img
                src={serviceData?.photos?.[currentPhotoIndex] || ""}
                alt={`Photo ${currentPhotoIndex + 1}`}
                className="w-full h-full object-cover"
              />
            </div>

            <button
              onClick={nextPhoto}
              className="absolute right-4 text-white hover:bg-white/10 p-3 rounded-full transition z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="p-4 overflow-x-auto">
            <div className="flex gap-2">
              {serviceData?.photos?.map((photo, idx) => (
                <img
                  key={idx}
                  src={photo}
                  alt={`Thumbnail ${idx + 1}`}
                  onClick={() => setCurrentPhotoIndex(idx)}
                  className={`h-16 w-24 object-cover rounded-lg cursor-pointer transition ${
                    idx === currentPhotoIndex
                      ? "ring-2 ring-indigo-400"
                      : "opacity-50 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Service Request Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-slate-800 rounded-2xl shadow-lg w-full max-w-md p-6 relative border border-slate-700 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowBookingModal(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold text-white mb-6">
              Confirm service request
            </h2>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Service</span>
                <span className="font-medium text-white">{serviceType}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Start date</span>
                <span className="font-medium text-white">
                  {startDate || "Not selected"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">End date</span>
                <span className="font-medium text-white">
                  {endDate || "Not selected"}
                </span>
              </div>
              {promoCode && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Promo Code</span>
                  <span className={`font-medium ${isValidPromo ? "text-emerald-400" : "text-red-400"}`}>
                    {promoCode} {isValidPromo ? "✓" : "✗"}
                  </span>
                </div>
              )}
              {additionalNotes && (
                <div className="text-sm">
                  <span className="text-slate-400 block mb-1">Notes:</span>
                  <p className="text-white bg-slate-700 p-3 rounded-lg">
                    {additionalNotes}
                  </p>
                </div>
              )}
              {pointsToUse > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Points Used</span>
                  <span className="font-medium text-indigo-400">
                    {pointsToUse} points
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-slate-600 pt-4 mb-6">
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Base price</span>
                  <span className="font-medium text-white">
                    ₱{basePrice.toLocaleString()}
                  </span>
                </div>
                {isValidPromo && discountAmount > 0 && (
                  <div className="flex items-center justify-between text-sm text-emerald-400">
                    <span>Discount ({couponValidationResult.coupon?.type === "percentage" ? `${couponValidationResult.coupon?.discount}%` : "Fixed"})</span>
                    <span className="font-medium">-₱{discountAmount.toLocaleString()}</span>
                  </div>
                )}
                {pointsToUse > 0 && (
                  <div className="flex items-center justify-between text-sm text-indigo-400">
                    <span>Points Redeemed</span>
                    <span className="font-medium">-₱{pointsToUse?.toLocaleString() || 0}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Service fee</span>
                  <span className="font-medium text-white">
                    ₱{serviceFee.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between mb-2 border-t border-slate-600 pt-3">
                <span className="text-white font-semibold">Estimated total</span>
                <span className="text-2xl font-bold text-indigo-400">
                  ₱{finalTotal.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Final quote will be provided by provider
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() =>
                  handleActionWithVerification(() => handleConfirmBooking())
                }
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition"
              >
                Send request
              </button>
              <button
                onClick={() => setShowBookingModal(false)}
                className="flex-1 border border-slate-600 text-slate-300 py-3 rounded-lg hover:bg-slate-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-slate-800 rounded-2xl shadow-lg w-full max-w-md p-6 border border-slate-700">
                <h2 className="text-2xl font-bold text-white mb-4">
                    Please Sign In
                </h2>
                <p className="text-slate-300 mb-6">
                    You need to be logged in to perform this action.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            setShowLoginModal(false);
                            navigate('/');
                        }}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition"
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => setShowLoginModal(false)}
                        className="flex-1 border border-slate-600 text-slate-300 hover:bg-slate-700 font-semibold py-3 rounded-lg transition"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Floating Booking Button - Shows when booking card is not visible */}
      {!isBookingCardVisible && (
        <motion.button
          onClick={() => bookingCardRef.current?.scrollIntoView({ behavior: "smooth" })}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-indigo-600 to-indigo-600 hover:from-indigo-700 hover:to-indigo-700 text-white px-6 py-3 rounded-full font-semibold transition-all duration-200 shadow-md shadow-indigo-500/20 flex items-center gap-2 z-40 hover:shadow-indigo-500/30"
        >
          <Briefcase className="w-5 h-5" />
          <span>Book Now</span>
        </motion.button>
      )}

      {/* Date Range Picker Modal */}
      {showDatePicker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl w-full max-w-xl max-h-[80vh] overflow-hidden flex flex-col border border-indigo-500/30 shadow-2xl shadow-indigo-500/20">
            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-indigo-200 bg-clip-text text-transparent flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                  Select Service Dates
                </h3>
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="text-indigo-400/60 hover:text-indigo-400 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Available Dates */}
              {Array.isArray(serviceData.availableDates) &&
                serviceData.availableDates.length > 0 && (
                  <div className="mb-4 p-3 bg-slate-900/50 rounded-lg border border-green-500/30">
                    <div className="text-xs font-semibold text-green-400 mb-2 flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      Available Service Periods
                    </div>
                    <div className="space-y-1">
                      {serviceData.availableDates.map((range, idx) => (
                        <div key={idx} className="text-xs text-slate-300">
                          <span className="text-green-400 font-medium">
                            {new Date(range.startDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </span>
                          <span className="text-slate-500 mx-1">→</span>
                          <span className="text-green-400 font-medium">
                            {new Date(range.endDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Date Range Picker */}
              <div className="mb-4 w-full flex justify-center">
              <style>{`
                .rdrCalendarWrapper {
                  background-color: rgba(15, 23, 42, 0.8);
                  border-radius: 12px;
                  width: 100%;
                  padding: 16px;
                }
                .rdrCalendarContainer {
                  width: 100%;
                }
                .rdrMonth {
                  width: 100%;
                  padding: 0 10px;
                }
                .rdrMonths {
                  width: 100%;
                }
                .rdrMonthAndYearWrapper {
                  background-color: rgba(30, 41, 59, 0.5);
                  border-radius: 8px;
                  padding: 10px;
                  margin-bottom: 12px;
                  text-align: center;
                  color: #a5b4fc;
                  font-weight: 600;
                  font-size: 14px;
                }
                .rdrMonthAndYearPickers button {
                  color: #a5b4fc;
                  padding: 2px 6px;
                }
                .rdrMonthAndYearPickers button:hover {
                  background-color: rgba(79, 70, 229, 0.2);
                }
                .rdrDayNames {
                  margin-bottom: 10px;
                  display: grid;
                  grid-template-columns: repeat(7, 1fr);
                  gap: 3px;
                }
                .rdrDayName {
                  color: #c7d2fe;
                  font-size: 11px;
                  font-weight: 600;
                  text-align: center;
                  padding: 6px 0;
                }
                .rdrDays {
                  display: grid;
                  grid-template-columns: repeat(7, 1fr);
                  gap: 3px;
                }
                .rdrDayDisabled {
                  background-color: transparent !important;
                  cursor: not-allowed !important;
                  opacity: 0.3 !important;
                }
                .rdrDayDisabled .rdrDayNumber span {
                  color: #475569 !important;
                  text-decoration: line-through !important;
                }
                .rdrDayPassive {
                  opacity: 0.3 !important;
                  pointer-events: none !important;
                }
                .rdrDay {
                  height: 42px;
                  display: flex !important;
                  align-items: center !important;
                  justify-content: center !important;
                  border-radius: 6px;
                  border: 1px solid transparent !important;
                  cursor: pointer;
                  position: relative;
                  width: 100%;
                  padding: 0 !important;
                  margin: 0 !important;
                }
                .rdrDayNumber {
                  color: #cbd5e1;
                  font-size: 13px;
                  font-weight: 500;
                  position: relative;
                  z-index: 1;
                  text-decoration: none !important;
                  border: none !important;
                  outline: none !important;
                }
                .rdrDayNumber span {
                  color: #cbd5e1;
                  text-decoration: none !important;
                  border: none !important;
                }
                .rdrDayNumber::before,
                .rdrDayNumber::after {
                  content: none !important;
                }
                .rdrStartEdge {
                  border-radius: 6px 0 0 6px !important;
                  border: 1px solid #818cf8 !important;
                  border-right: none !important;
                  background-color: #6366f1 !important;
                  width: 100% !important;
                }
                .rdrStartEdge::after {
                  content: none !important;
                }
                .rdrEndEdge {
                  border-radius: 0 6px 6px 0 !important;
                  border: 1px solid #818cf8 !important;
                  border-left: none !important;
                  background-color: #6366f1 !important;
                  width: 100% !important;
                }
                .rdrEndEdge::before {
                  content: none !important;
                }
                .rdrDayStartPreview {
                  background-color: #6366f1 !important;
                  border-radius: 6px !important;
                  border: 1px solid #818cf8 !important;
                  width: 100% !important;
                }
                .rdrDayInPreview {
                  background-color: rgba(99, 102, 241, 0.2) !important;
                  border: none !important;
                  width: 100% !important;
                }
                .rdrDayInPreview::before,
                .rdrDayInPreview::after {
                  content: none !important;
                }
                .rdrDayEndPreview {
                  background-color: #6366f1 !important;
                  border-radius: 6px !important;
                  border: 1px solid #818cf8 !important;
                  width: 100% !important;
                }
                .rdrDayInRange {
                  background-color: rgba(99, 102, 241, 0.2) !important;
                  border: none !important;
                  width: 100% !important;
                }
                .rdrDayInRange::before,
                .rdrDayInRange::after {
                  content: none !important;
                }
                .rdrDayStartOfMonth,
                .rdrDayEndOfMonth {
                  background-color: transparent;
                }
                .rdrDaySelected {
                  background-color: #6366f1 !important;
                  color: #ffffff !important;
                  border-radius: 6px !important;
                  border: 1px solid #818cf8 !important;
                }
                .rdrDaySelected .rdrDayNumber {
                  color: #ffffff !important;
                }
                .rdrDayStartOfWeek,
                .rdrDayEndOfWeek {
                  border-radius: 6px;
                }
                /* Scrollbar Styling */
                div:has(> .DateRange)::-webkit-scrollbar {
                  width: 8px;
                }
                div:has(> .DateRange)::-webkit-scrollbar-track {
                  background-color: rgba(30, 41, 59, 0.5);
                  border-radius: 10px;
                }
                div:has(> .DateRange)::-webkit-scrollbar-thumb {
                  background: linear-gradient(180deg, #6366f1 0%, #818cf8 100%);
                  border-radius: 10px;
                  border: 2px solid rgba(30, 41, 59, 0.5);
                }
                div:has(> .DateRange)::-webkit-scrollbar-thumb:hover {
                  background: linear-gradient(180deg, #818cf8 0%, #a5b4fc 100%);
                }
              `}</style>
              <DateRange
                editableDateInputs={false}
                onChange={handleDateRangeChange}
                moveRangeOnFirstSelection={false}
                ranges={dateRange}
                months={1}
                direction="horizontal"
                showMonthAndYearPickers={false}
                minDate={new Date()}
              />
              </div>

              {/* Selected dates summary */}
              <div className="mb-4 p-3 bg-slate-900/50 rounded-lg border border-indigo-500/20">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Start Date</div>
                    <div className="text-sm font-semibold text-white">
                      {dateRange[0].startDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                  <div className="text-slate-500">→</div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400 mb-1">End Date</div>
                    <div className="text-sm font-semibold text-white">
                      {dateRange[0].endDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-400 text-center mt-2">
                  {Math.ceil(
                    (dateRange[0].endDate - dateRange[0].startDate) /
                      (1000 * 60 * 60 * 24)
                  )}{" "}
                  day(s)
                </div>
              </div>
            </div>

            {/* Sticky Footer with Buttons */}
            <div className="sticky bottom-0 bg-gradient-to-br from-slate-800 to-slate-900 border-t border-slate-700/50 p-5 rounded-b-2xl">
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="flex-1 px-4 py-2 border border-indigo-500/30 text-indigo-300 rounded-lg hover:bg-slate-700/50 hover:border-indigo-500/50 transition font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyDates}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition flex items-center justify-center gap-2 font-medium text-sm shadow-lg shadow-indigo-500/20"
                >
                  <Calendar className="w-4 h-4" />
                  Apply Dates
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
