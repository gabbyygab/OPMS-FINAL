import { useEffect, useState, useRef } from "react";
import {
  MapPin,
  Star,
  Heart,
  Share2,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  Home,
  Wifi,
  Tv,
  Wind,
  Utensils,
  Shield,
  Calendar,
  Clock,
  Check,
  MessageCircle,
  Award,
  User,
  Facebook,
  Instagram,
  Gift,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { db } from "../../firebase/firebase";
import { validateCoupon, calculateDiscount } from "../../utils/couponUtils";
import {
  doc,
  getDoc,
  getDocs,
  query,
  where,
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import LoadingSpinner from "../../loading/Loading";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import VerificationBanner from "../../components/Verification";
import { sendOtpToUser } from "../../utils/sendOtpToUser";
import { getCoordinatesFromLocation } from "../../utils/geocoding";
import { toast } from "react-toastify";

// Component to change map view when center state changes
function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

const reviews = [
  {
    id: 1,
    author: "John D.",
    avatar: "https://i.pravatar.cc/150?img=12",
    rating: 5,
    date: "September 2025",
    comment:
      "Amazing place with stunning views! The condo was spotless and had everything we needed. Maria was very responsive and helpful. Highly recommend!",
  },
  {
    id: 2,
    author: "Sarah M.",
    avatar: "https://i.pravatar.cc/150?img=9",
    rating: 5,
    date: "August 2025",
    comment:
      "Perfect weekend getaway. The location is great, close to restaurants and attractions. The bed was comfortable and the WiFi was fast. Will definitely book again!",
  },
  {
    id: 3,
    author: "Carlos R.",
    avatar: "https://i.pravatar.cc/150?img=15",
    rating: 5,
    date: "July 2025",
    comment:
      "Exceeded our expectations! The view from the balcony is incredible. Great value for money. Thank you Maria for being such a wonderful host!",
  },
];

export default function ListingDetailPage() {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const [checkIn, setCheckIn] = useState("2025-11-28");
  const [checkOut, setCheckOut] = useState("2025-11-30");
  const [guests, setGuests] = useState(2);
  const [promoCode, setPromoCode] = useState("");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(2025, 10, 28),
      endDate: new Date(2025, 10, 30),
      key: "selection",
    },
  ]);
  const [listingData, setListingData] = useState({});
  const [reviewsData, setReviewsData] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isLoadingVerification, setIsLoadingVerification] = useState(false);
  const [userData, setUserData] = useState(null);
  const [mapCenter, setMapCenter] = useState([14.5994, 120.9842]);
  const [guestRewards, setGuestRewards] = useState(null);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [showPointsSlider, setShowPointsSlider] = useState(false);

  const { user, isVerified } = useAuth();
  //navigation
  const navigate = useNavigate();

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
    if (!isVerified) {
      toast.warning("Please verify your account first", {
        position: "top-center",
      });
      return;
    }
    action();
  };

  // Toggle Favorite
  const toggleFavorite = async () => {
    if (!user || !userData) {
      toast.error("Please log in to save favorites");
      return;
    }

    try {
      if (isFavorite && favoriteId) {
        // Remove from favorites
        await deleteDoc(doc(db, "favorites", favoriteId));
        setIsFavorite(false);
        setFavoriteId(null);
        toast.success("Removed from favorites");
      } else {
        // Add to favorites
        const favoriteData = {
          guest_id: userData.id,
          listing_id: listing_id,
          createdAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, "favorites"), favoriteData);
        setIsFavorite(true);
        setFavoriteId(docRef.id);
        toast.success("Added to favorites");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Failed to update favorites");
    }
  };

  // Handle Confirm Booking
  const handleConfirmBooking = async () => {
    if (!userData) {
      toast.error("User data not loaded");
      return;
    }

    // Check if dates are within available dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Validate check-in is before check-out
    if (checkInDate >= checkOutDate) {
      toast.error("Check-out date must be after check-in date");
      return;
    }

    // Check if selected dates fall within available date ranges
    const availableDates = Array.isArray(listingData.availableDates)
      ? listingData.availableDates
      : [];
    const isWithinAvailable = availableDates.some((range) => {
      const rangeStart = new Date(range.startDate);
      const rangeEnd = new Date(range.endDate);
      // Check if the entire booking period falls within this available range
      return checkInDate >= rangeStart && checkOutDate <= rangeEnd;
    });

    if (availableDates.length > 0 && !isWithinAvailable) {
      toast.error("Selected dates are not within available date ranges");
      return;
    }

    // Check if any dates in the stay period are booked
    const bookedDates = listingData.bookedDates || [];
    const stayDates = [];
    for (
      let d = new Date(checkInDate);
      d <= checkOutDate;
      d.setDate(d.getDate() + 1)
    ) {
      stayDates.push(new Date(d));
    }

    const isAlreadyBooked = stayDates.some((stayDate) =>
      bookedDates.some((bookedDate) => {
        const bookedDateObj = bookedDate.toDate
          ? bookedDate.toDate()
          : new Date(bookedDate);
        return stayDate.toDateString() === bookedDateObj.toDateString();
      })
    );

    if (isAlreadyBooked) {
      toast.error("Some dates in your selection are already booked");
      return;
    }

    // NOTE: No wallet balance check needed here
    // Payment will be processed when the host confirms the booking

    try {
      const loadingToast = toast.loading("Processing your booking...");

      // Create booking with pending status
      // Payment will be processed only when host confirms the booking
      const bookingData = {
        listing_id: listing_id,
        guest_id: userData.id,
        host_id: listingData.hostId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests: guests,
        baseAmount: basePrice,
        discountAmount: discountAmount,
        discountType: isValidPromo ? listingData.discount?.type || null : null,
        pointsUsed: pointsToUse || 0,
        totalAmount: totalPrice,
        serviceFee: serviceFee,
        grandTotal: grandTotal,
        promoCode: promoCode || null,
        status: "pending",
        createdAt: serverTimestamp(),
      };
      const bookingRef = await addDoc(collection(db, "bookings"), bookingData);

      // Create notification for host
      const notificationData = {
        host_id: listingData.hostId,
        type: "booking",
        title: "New Booking",
        message: `${userData.fullName || "A guest"} has booked your ${
          listingData.title
        } for ${checkIn} to ${checkOut}`,
        listing_id: listing_id,
        booking_id: bookingRef.id,
        guest_id: userData.id,
        guest_avatar: userData.photoURL || null,
        read: false,
        isRead: false,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, "notifications"), notificationData);

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

  const calculateNights = () => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Date picker handler
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
      toast.error("Check-out date must be after check-in date.");
      return;
    }

    // Helper to format date as YYYY-MM-DD in local timezone to avoid timezone shift issues
    const toYMD = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    setCheckIn(toYMD(start));
    setCheckOut(toYMD(end));
    setShowDatePicker(false);
  };

  const nights = calculateNights();
  const basePrice = nights * listingData.price;

  // Calculate discount if promo code is valid
  // Note: We'll validate against Firestore coupons instead of listing.promoCode
  const [couponValidationResult, setCouponValidationResult] = useState({
    valid: false,
    coupon: null,
    message: "",
  });

  // Validate coupon when it changes
  useEffect(() => {
    const validatePromoCode = async () => {
      if (!promoCode || !listingData.hostId) {
        setCouponValidationResult({ valid: false, coupon: null, message: "" });
        return;
      }

      const result = await validateCoupon(promoCode, listingData.hostId);
      setCouponValidationResult(result);
    };

    const debounceTimer = setTimeout(validatePromoCode, 500);
    return () => clearTimeout(debounceTimer);
  }, [promoCode, listingData.hostId]);

  let discountAmount = 0;
  let isValidPromo = couponValidationResult.valid;

  if (isValidPromo && couponValidationResult.coupon) {
    discountAmount = calculateDiscount(
      basePrice,
      couponValidationResult.coupon
    );
  }

  // Calculate points discount (1 point = ₱1)
  const pointsDiscount = pointsToUse;

  const totalPrice = basePrice - discountAmount - pointsDiscount;
  const serviceFee = totalPrice * 0.1;
  const grandTotal = totalPrice + serviceFee;

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % listingData.photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) =>
      prev === 0 ? listingData.photos.length - 1 : prev - 1
    );
  };

  //get selected listing by params
  const { listing_id } = useParams();

  useEffect(() => {
    const getSelectedListing = async () => {
      try {
        setLoading(true);

        // Fetch user data
        if (user) {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUserData({ id: userSnap.id, ...userSnap.data() });
          }

          // Fetch wallet balance
          const walletQuery = query(
            collection(db, "wallets"),
            where("user_id", "==", user.uid)
          );
          const walletSnap = await getDocs(walletQuery);
          if (!walletSnap.empty) {
            const walletData = walletSnap.docs[0].data();
            setWalletBalance(walletData.balance || 0);
          }

          // Fetch guest rewards/points
          const rewardsQuery = query(
            collection(db, "rewards"),
            where("userId", "==", user.uid)
          );
          const rewardsSnap = await getDocs(rewardsQuery);
          if (!rewardsSnap.empty) {
            setGuestRewards(rewardsSnap.docs[0].data());
          }

          // Check if listing is favorited
          const favQuery = query(
            collection(db, "favorites"),
            where("guest_id", "==", user.uid),
            where("listing_id", "==", listing_id)
          );
          const favSnap = await getDocs(favQuery);
          if (!favSnap.empty) {
            setIsFavorite(true);
            setFavoriteId(favSnap.docs[0].id);
          }
        }

        // Fetch listing data
        const listingRef = doc(db, "listings", listing_id);
        const listingSnap = await getDoc(listingRef);
        if (!listingSnap.exists()) {
          console.log("No such listing!");
          return;
        }

        const data = listingSnap.data();

        // Set map center immediately if coordinates exist in the listing
        if (data.coordinates?.lat && data.coordinates?.lng) {
          setMapCenter([data.coordinates.lat, data.coordinates.lng]);
          console.log(
            `📍 Map centered at coordinates: ${data.coordinates.lat}, ${data.coordinates.lng}`
          );
        }

        // Fetch reviews with user data
        const reviewsRef = collection(db, "reviews");
        const reviewQuery = query(
          reviewsRef,
          where("listingId", "==", listing_id)
        );
        const reviewSnap = await getDocs(reviewQuery);
        const reviewCount = reviewSnap.size;

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

        setReviewsData(reviewsWithUsers);

        // Calculate average rating from reviews
        let averageRating = 0;
        if (reviewsWithUsers.length > 0) {
          const totalRating = reviewsWithUsers.reduce(
            (sum, review) => sum + (review.rating || 0),
            0
          );
          averageRating = (totalRating / reviewsWithUsers.length).toFixed(1);
        }

        // Fetch host data
        let hostData = null;
        if (data.hostId) {
          const hostRef = doc(db, "users", data.hostId);
          const hostSnap = await getDoc(hostRef);
          if (hostSnap.exists()) {
            hostData = { id: hostSnap.id, ...hostSnap.data() };
          }
        }

        setListingData({
          ...data,
          reviewCount,
          rating: averageRating || data.rating,
          host: hostData,
        });

        // Set map center based on listing coordinates
        if (data.coordinates?.lat && data.coordinates?.lng) {
          setMapCenter([data.coordinates.lat, data.coordinates.lng]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    getSelectedListing();
  }, [listing_id, user]);

  // Fetch coordinates from location if they don't exist
  useEffect(() => {
    const fetchCoordinatesFromLocation = async () => {
      if (!listingData?.location) return;

      // If coordinates already exist in listingData, use them
      if (listingData?.coordinates?.lat && listingData?.coordinates?.lng) {
        setMapCenter([
          listingData.coordinates.lat,
          listingData.coordinates.lng,
        ]);
        console.log(
          `📍 Map centered using stored coordinates: ${listingData.location}`
        );
        return;
      }

      // Fallback: fetch coordinates from location string
      try {
        console.log(
          `📍 Fetching coordinates for location: ${listingData.location}`
        );
        const coords = await getCoordinatesFromLocation(listingData.location);
        if (coords) {
          setMapCenter([coords.lat, coords.lng]);
          console.log(
            `📍 Map centered at geocoded location: ${listingData.location} (${coords.lat}, ${coords.lng})`
          );
        } else {
          console.warn(`Could not geocode location: ${listingData.location}`);
        }
      } catch (error) {
        console.error(
          `Error fetching coordinates for ${listingData.location}:`,
          error
        );
      }
    };

    fetchCoordinatesFromLocation();
  }, [listingData?.location, listingData?.coordinates]);

  if (loading) return <LoadingSpinner />;
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
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-slate-300 hover:text-indigo-400 font-medium transition"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-700 transition text-slate-300"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Share</span>
              </button>
              <button
                onClick={() =>
                  handleActionWithVerification(() => toggleFavorite())
                }
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-700 transition text-slate-300"
              >
                <Heart
                  className={`w-4 h-4 ${
                    isFavorite ? "fill-red-500 text-red-500" : ""
                  }`}
                />
                <span className="hidden sm:inline text-sm">
                  {isFavorite ? "Saved" : "Save"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 mt-[65px]">
        {/* Verification Banner */}
        {!isVerified && (
          <div className="mb-6">
            <VerificationBanner handleVerification={handleVerification} />
          </div>
        )}

        {/* Title Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-3">
            {listingData?.title || "Loading..."}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-white">
                {listingData?.rating || "New"}
              </span>
              <span className="text-slate-400">
                ({listingData?.reviewCount || 0} reviews)
              </span>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <MapPin className="w-4 h-4" />
              {listingData?.location || "Unknown location"}
            </div>
          </div>
        </div>

        {/* Photo Gallery and Map Side by Side */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Photos Section */}
          <div className="flex flex-col">
            <div className="relative h-[450px] rounded-xl overflow-hidden mb-4">
              <img
                src={
                  listingData?.photos?.[0] ||
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
              Show all {listingData?.photos?.length || 0} photos
            </button>
          </div>

          {/* Map Section */}
          <div className="flex flex-col">
            <div className="rounded-xl overflow-hidden border border-slate-700/50 h-[450px] relative z-0 mb-4">
              <MapContainer
                center={mapCenter}
                zoom={15}
                scrollWheelZoom={false}
                style={{ width: "100%", height: "100%", zIndex: 0 }}
              >
                <ChangeMapView center={mapCenter} zoom={15} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {mapCenter && mapCenter.length === 2 && (
                  <Marker
                    position={mapCenter}
                    icon={L.icon({
                      iconUrl:
                        "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDMyIDQwIj48cGF0aCBkPSJNMTYgMEM4LjMgMCAxIDcuNyAxIDE2YzAgOC4yIDEyIDI0IDEyIDI0czEyLTE1LjggMTItMjRjMC04LjMtNy4zLTE2LTE2LTE2eiIgZmlsbD0iIzRmNDZlNSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSI2IiBmaWxsPSIjZmZmIi8+PC9zdmc+",
                      iconSize: [32, 40],
                      iconAnchor: [16, 40],
                      popupAnchor: [0, -40],
                    })}
                  >
                    <Popup>
                      <div className="text-sm">
                        <div className="font-semibold text-gray-900 mb-1">
                          {listingData?.title}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-700">
                          <MapPin className="w-3 h-3" />
                          {listingData?.location}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-md rounded-lg p-4 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-2">Location</h3>
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-4 h-4 text-indigo-400" />
                <span>{listingData?.location || "Location details"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Host Info */}
            <div className="pb-8 border-b border-slate-700">
              <div className="flex items-center justify-between mb-4 bg-slate-800/50 backdrop-blur-md rounded-xl p-6 border border-slate-700/50">
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-2">
                    Hosted by {listingData?.host?.fullName || "Unknown"}
                  </h2>
                  <div className="flex items-center gap-3 text-slate-400 text-sm">
                    <span>{listingData?.numberOfGuests || 0} guests</span>
                    <span>·</span>
                    <span>{listingData?.bedrooms || 0} bedrooms</span>
                    <span>·</span>
                    <span>{listingData?.beds || 0} beds</span>
                    <span>·</span>
                    <span>{listingData?.bathrooms || 0} baths</span>
                  </div>
                </div>
                <img
                  src={
                    listingData?.host?.photoURL ||
                    "https://via.placeholder.com/100"
                  }
                  alt={listingData?.host?.name || "Host"}
                  className="w-14 h-14 rounded-full"
                />
              </div>
              {listingData?.host?.isVerified && (
                <div className="flex items-center gap-2 text-sm text-slate-300 mt-4">
                  <Award className="w-4 h-4 text-indigo-400" />
                  <span>
                    {listingData?.host?.isVerified
                      ? "Verified"
                      : "Not Verified"}{" "}
                    Host · Joined{" "}
                    {listingData?.host?.createdAt
                      ? new Date(
                          listingData.host.createdAt.toDate()
                        ).toLocaleDateString("en-PH", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "—"}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="pb-8 border-b border-slate-700">
              <h3 className="text-xl font-semibold text-white mb-4">
                About this place
              </h3>
              <p className="text-slate-300 leading-relaxed bg-slate-800/50 backdrop-blur-md p-6 rounded-xl border border-slate-700/50">
                {listingData?.description || "No description available."}
              </p>
            </div>

            {/* Amenities */}
            <div className="pb-8 border-b border-slate-700">
              <h3 className="text-xl font-semibold text-white mb-4">
                What this place offers
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {listingData?.amenities?.map((amenity, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 text-slate-200 bg-slate-700/50 backdrop-blur-md px-4 py-3 rounded-lg border border-slate-600/50 hover:bg-slate-700 hover:border-indigo-500/30 transition"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5 text-indigo-400 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="capitalize font-medium">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            {reviewsData.length > 0 && (
              <div className="pb-8 border-b border-slate-700">
                <div className="flex items-center gap-2 mb-6">
                  <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                  <h3 className="text-xl font-semibold text-white">
                    {listingData?.rating || 0} · {listingData?.reviewCount || 0}{" "}
                    reviews
                  </h3>
                </div>
                <div className="space-y-6">
                  {reviewsData.map((review) => (
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
                          {review.comment || review.review || "Great stay!"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* House Rules */}
            <div className="pb-8 border-b border-slate-700">
              <h3 className="text-xl font-semibold text-white mb-4">
                House rules
              </h3>
              <div className="space-y-3">
                {listingData?.houseRules?.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 bg-slate-800/50 backdrop-blur-md p-4 rounded-lg border border-slate-700/50"
                  >
                    <Check className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl shadow-lg p-6 border border-slate-700/50 sticky top-24">
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-3xl font-bold text-white">
                  ₱{listingData?.price?.toLocaleString() || 0}
                </span>
                <span className="text-slate-400">/ night</span>
              </div>

              <div className="space-y-4 mb-6">
                <button
                  onClick={() => {
                    setDateRange([
                      {
                        startDate: new Date(checkIn),
                        endDate: new Date(checkOut),
                        key: "selection",
                      },
                    ]);
                    setShowDatePicker(true);
                  }}
                  className="w-full border-2 border-slate-600 rounded-xl p-4 bg-gradient-to-br from-slate-700 to-slate-800 hover:border-indigo-500/50 transition-colors cursor-pointer text-left"
                >
                  <label className="text-xs font-semibold text-slate-400 block mb-3 uppercase tracking-wider">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Select Dates
                  </label>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">
                        Check-in
                      </div>
                      <div className="text-sm font-semibold text-white">
                        {formatDateForDisplay(checkIn)}
                      </div>
                    </div>
                    <div className="text-slate-400">→</div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500 mb-1">
                        Check-out
                      </div>
                      <div className="text-sm font-semibold text-white">
                        {formatDateForDisplay(checkOut)}
                      </div>
                    </div>
                  </div>
                </button>

                <div className="border-2 border-slate-600 rounded-xl p-4 bg-gradient-to-br from-slate-700 to-slate-800 hover:border-indigo-500/50 transition-colors">
                  <label className="text-xs font-semibold text-slate-400 block mb-2 uppercase tracking-wider">
                    <Users className="w-3 h-3 inline mr-1" />
                    Guests
                  </label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full text-sm font-medium focus:outline-none rounded-lg bg-slate-600/50 text-white px-3 py-2 border border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer"
                  >
                    {Array.from(
                      { length: listingData?.numberOfGuests || 1 },
                      (_, i) => i + 1
                    ).map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? "guest" : "guests"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="border-2 border-slate-600 rounded-xl p-4 bg-gradient-to-br from-slate-700 to-slate-800 hover:border-indigo-500/50 transition-colors">
                  <label className="text-xs font-semibold text-slate-400 block mb-2 uppercase tracking-wider">
                    Coupon or Promo Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Enter promo code"
                    className="w-full text-sm font-medium focus:outline-none rounded-lg bg-slate-600/50 text-white placeholder-slate-400 px-3 py-2 border border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>

                {/* Points Redemption */}
                {guestRewards && (guestRewards.availablePoints || 0) > 0 && (
                  <div className="border-2 border-indigo-500/30 rounded-xl p-4 bg-gradient-to-br from-indigo-700/20 to-indigo-800/20 hover:border-indigo-500/50 transition-colors">
                    <label className="text-xs font-semibold text-indigo-400 block mb-3 uppercase tracking-wider flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Redeem Points (Optional)
                    </label>
                    <p className="text-xs text-slate-300 mb-3">
                      Available:{" "}
                      <span className="font-bold text-indigo-300">
                        {guestRewards.availablePoints || 0}
                      </span>{" "}
                      points (₱{guestRewards.availablePoints || 0})
                    </p>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max={guestRewards.availablePoints || 0}
                        value={pointsToUse}
                        onChange={(e) => setPointsToUse(Number(e.target.value))}
                        className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
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
                    <p className="text-xs text-indigo-300 mt-2">
                      Using <span className="font-bold">₱{pointsToUse}</span> in
                      points
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() =>
                  handleActionWithVerification(() => setShowBookingModal(true))
                }
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-600 hover:from-indigo-700 hover:to-indigo-700 text-white py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 mb-4 flex items-center justify-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Reserve Now
              </button>

              <p className="text-center text-xs text-slate-400 mb-6 flex items-center justify-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" />
                You won't be charged yet
              </p>

              <div className="space-y-3 text-sm bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 backdrop-blur-sm">
                <div className="flex items-center justify-between pb-3">
                  <span className="text-slate-400">
                    <span className="font-medium">
                      ₱{listingData?.price?.toLocaleString() || 0}
                    </span>{" "}
                    × {nights} {nights === 1 ? "night" : "nights"}
                  </span>
                  <span className="font-semibold text-white">
                    ₱{basePrice?.toLocaleString() || 0}
                  </span>
                </div>

                {/* Discount Row - Only show if valid promo code */}
                {isValidPromo && discountAmount > 0 && (
                  <div className="flex items-center justify-between pb-3 text-emerald-400">
                    <span className="text-emerald-300/80">
                      Discount (
                      {couponValidationResult.coupon?.type === "percentage"
                        ? `${couponValidationResult.coupon?.discount}%`
                        : "Fixed"}
                      )
                    </span>
                    <span className="font-semibold text-emerald-400">
                      -₱{discountAmount?.toLocaleString() || 0}
                    </span>
                  </div>
                )}

                {/* Points Redemption Row - Only show if points are being used */}
                {pointsToUse > 0 && (
                  <div className="flex items-center justify-between pb-3 text-indigo-400">
                    <span className="text-indigo-300/80">Points Redeemed</span>
                    <span className="font-semibold text-indigo-400">
                      -₱{pointsToUse?.toLocaleString() || 0}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
                  <span className="text-slate-400">Service fee</span>
                  <span className="font-semibold text-white">
                    ₱{serviceFee?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="font-semibold text-slate-100">Total</span>
                  <span className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    ₱{grandTotal?.toLocaleString() || 0}
                  </span>
                </div>
              </div>

              <button
                onClick={() =>
                  handleActionWithVerification(() =>
                    navigate(
                      `/guest/messages/${user.uid}/${listingData.hostId}`
                    )
                  )
                }
                className="w-full mt-6 flex items-center justify-center gap-2 py-3.5 border-2 border-slate-600 rounded-xl text-slate-300 hover:text-white hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all duration-200 font-medium"
              >
                <MessageCircle className="w-4 h-4" />
                Contact Host
              </button>
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
              {currentPhotoIndex + 1} / {listingData?.photos?.length || 0}
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
                src={listingData?.photos?.[currentPhotoIndex] || ""}
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
              {listingData?.photos?.map((photo, idx) => (
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

      {/* Booking Confirmation Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-slate-800 rounded-2xl shadow-lg w-full max-w-md p-6 relative border border-slate-700">
            <button
              onClick={() => setShowBookingModal(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold text-white mb-6">
              Confirm your booking
            </h2>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Check-in</span>
                <span className="font-medium text-white">{checkIn}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Checkout</span>
                <span className="font-medium text-white">{checkOut}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Guests</span>
                <span className="font-medium text-white">{guests}</span>
              </div>
              {promoCode && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Promo Code</span>
                  <span
                    className={`font-medium ${
                      isValidPromo ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {promoCode} {isValidPromo ? "✓" : "✗"}
                  </span>
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
                  <span className="text-slate-400">Subtotal</span>
                  <span className="font-medium text-white">
                    ₱{basePrice?.toLocaleString() || 0}
                  </span>
                </div>
                {isValidPromo && discountAmount > 0 && (
                  <div className="flex items-center justify-between text-sm text-emerald-400">
                    <span>
                      Discount (
                      {couponValidationResult.coupon?.type === "percentage"
                        ? `${couponValidationResult.coupon?.discount}%`
                        : "Fixed"}
                      )
                    </span>
                    <span className="font-medium">
                      -₱{discountAmount?.toLocaleString() || 0}
                    </span>
                  </div>
                )}
                {pointsToUse > 0 && (
                  <div className="flex items-center justify-between text-sm text-indigo-400">
                    <span>Points Redeemed</span>
                    <span className="font-medium">
                      -₱{pointsToUse?.toLocaleString() || 0}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Service fee</span>
                  <span className="font-medium text-white">
                    ₱{serviceFee?.toLocaleString() || 0}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between mb-2 border-t border-slate-600 pt-3">
                <span className="text-white font-semibold">Total amount</span>
                <span className="text-2xl font-bold text-indigo-400">
                  ₱{grandTotal?.toLocaleString() || 0}
                </span>
              </div>
            </div>

            <div className="mb-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <p className="text-xs text-blue-300">
                Payment will be processed only when the host confirms your
                booking. No charges will be made now.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConfirmBooking}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition"
              >
                Confirm booking
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

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-slate-800 rounded-2xl shadow-lg w-full max-w-sm p-6 relative border border-slate-700">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold text-white mb-6">
              Share this stay
            </h2>

            <div className="space-y-3">
              <button
                onClick={() => {
                  const shareUrl = `https://bookingnest.vercel.app${window.location.pathname}`;
                  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    shareUrl
                  )}&quote=${encodeURIComponent(
                    listingData?.title || "Check out this stay"
                  )}`;
                  window.open(facebookUrl, "_blank", "width=600,height=400");
                  setShowShareModal(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
              >
                <Facebook className="w-5 h-5" />
                Share on Facebook
              </button>

              <button
                onClick={() => {
                  const shareUrl = `https://bookingnest.vercel.app${window.location.pathname}`;
                  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
                    shareUrl
                  )}&text=${encodeURIComponent(
                    listingData?.title || "Check out this stay"
                  )}`;
                  window.open(twitterUrl, "_blank", "width=600,height=400");
                  setShowShareModal(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition font-medium"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 9 0 11-4s1-8.5 0-11.5a4.5 4.5 0 00-.5-.5z" />
                </svg>
                Share on Twitter
              </button>

              <button
                onClick={() => {
                  const shareUrl = `https://bookingnest.vercel.app${window.location.pathname}`;
                  const instagramUrl = `https://www.instagram.com/?url=${encodeURIComponent(
                    shareUrl
                  )}`;
                  navigator.clipboard.writeText(shareUrl);
                  toast.success(
                    "Link copied! You can paste it in Instagram DM"
                  );
                  window.open(instagramUrl, "_blank", "width=600,height=400");
                  setShowShareModal(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition font-medium"
              >
                <Instagram className="w-5 h-5" />
                Share on Instagram
              </button>

              <button
                onClick={() => {
                  const shareUrl = `https://bookingnest.vercel.app${window.location.pathname}`;
                  const messengerUrl = `https://www.facebook.com/dialog/send?app_id=YOUR_APP_ID&link=${encodeURIComponent(
                    shareUrl
                  )}&redirect_uri=${encodeURIComponent(shareUrl)}`;
                  window.open(messengerUrl, "_blank", "width=600,height=400");
                  setShowShareModal(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition font-medium"
              >
                <MessageCircle className="w-5 h-5" />
                Share via Messenger
              </button>

              <button
                onClick={() => {
                  const shareUrl = `https://bookingnest.vercel.app${window.location.pathname}`;
                  navigator.clipboard.writeText(shareUrl);
                  toast.success("Link copied to clipboard!");
                  setShowShareModal(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition font-medium"
              >
                <Share2 className="w-5 h-5" />
                Copy link
              </button>
            </div>
          </div>
        </div>
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
                  Select Dates
                </h3>
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="text-indigo-400/60 hover:text-indigo-400 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Available Dates */}
              {Array.isArray(listingData.availableDates) &&
                listingData.availableDates.length > 0 && (
                  <div className="mb-4 p-3 bg-slate-900/50 rounded-lg border border-green-500/30">
                    <div className="text-xs font-semibold text-green-400 mb-2 flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      Available Dates
                    </div>
                    <div className="space-y-1">
                      {listingData.availableDates.map((range, idx) => (
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
                  display: flex;
                  gap: 20px;
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
                months={2}
                direction="horizontal"
                showMonthAndYearPickers={false}
                minDate={new Date()}
                disabledDay={(date) => {
                  // Disable past dates
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  if (date < today) return true;

                  // Check if date is in booked dates
                  const bookedDates = listingData.bookedDates || [];
                  const isBooked = bookedDates.some((bookedDate) => {
                    const bookedDateObj = bookedDate.toDate
                      ? bookedDate.toDate()
                      : new Date(bookedDate);
                    bookedDateObj.setHours(0, 0, 0, 0);
                    const checkDate = new Date(date);
                    checkDate.setHours(0, 0, 0, 0);
                    return checkDate.getTime() === bookedDateObj.getTime();
                  });

                  if (isBooked) return true;

                  // If there are available dates, check if the date falls within any range
                  const availableDates = Array.isArray(listingData.availableDates)
                    ? listingData.availableDates
                    : [];

                  if (availableDates.length === 0) {
                    // If no available dates are set, all future dates are available
                    return false;
                  }

                  // Check if date is within any available range
                  const isWithinAvailable = availableDates.some((range) => {
                    const rangeStart = new Date(range.startDate);
                    const rangeEnd = new Date(range.endDate);
                    rangeStart.setHours(0, 0, 0, 0);
                    rangeEnd.setHours(0, 0, 0, 0);
                    const checkDate = new Date(date);
                    checkDate.setHours(0, 0, 0, 0);
                    return checkDate >= rangeStart && checkDate <= rangeEnd;
                  });

                  // Disable if NOT within available range
                  return !isWithinAvailable;
                }}
                />
              </div>

              {/* Selected dates summary */}
              <div className="mb-4 p-3 bg-slate-900/50 rounded-lg border border-indigo-500/20">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Check-in</div>
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
                    <div className="text-xs text-slate-400 mb-1">Check-out</div>
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
                  nights
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
