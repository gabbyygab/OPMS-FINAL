import { useEffect, useState } from "react";
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
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../../firebase/firebase";
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
import VerificationBanner from "../../components/Verification";
import { sendOtpToUser } from "../../utils/sendOtpToUser";
import { toast } from "react-toastify";

// Sample listing data - replace with your Firebase data
// const listingData = {
//   id: 1,
//   title: "Stunning Condo in Tagaytay with Mountain View",
//   type: "stays",
//   rating: 5.0,
//   reviewCount: 24,
//   location: "Tagaytay, Cavite, Philippines",
//   host: {
//     name: "Maria",
//     avatar: "https://i.pravatar.cc/150?img=5",
//     joinedDate: "Joined in 2022",
//     isVerified: true,
//   },
//   details: {
//     guests: 4,
//     bedrooms: 1,
//     beds: 2,
//     bathrooms: 1,
//   },
//   photos: [
//     "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
//     "https://images.unsplash.com/photo-1502672260066-6bc35f0a1f2c?w=800",
//     "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
//     "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800",
//     "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800",
//   ],
//   price: 3500,
//   description:
//     "Experience the perfect getaway in this beautifully designed 1-bedroom condo with breathtaking mountain views. Located in the heart of Tagaytay, this cozy retreat offers modern amenities and a peaceful atmosphere, ideal for couples or small families looking to escape the city.",
//   amenities: [
//     { icon: Wifi, label: "Fast WiFi" },
//     { icon: Tv, label: '55" Smart TV' },
//     { icon: Wind, label: "Air conditioning" },
//     { icon: Utensils, label: "Full kitchen" },
//     { icon: Home, label: "Free parking" },
//     { icon: Shield, label: "Security 24/7" },
//   ],
//   houseRules: [
//     "Check-in: 2:00 PM - 9:00 PM",
//     "Checkout: 11:00 AM",
//     "No smoking",
//     "No pets",
//     "No parties or events",
//   ],
//   availableFrom: "2025-10-20",
//   availableTo: "2025-12-31",
// };

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
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [listingData, setListingData] = useState({});
  const [reviewsData, setReviewsData] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isLoadingVerification, setIsLoadingVerification] = useState(false);
  const [userData, setUserData] = useState(null);

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
    const availableDates = Array.isArray(listingData.availableDates) ? listingData.availableDates : [];
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
        host_id: listingData.host_id,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests: guests,
        totalAmount: grandTotal,
        serviceFee: serviceFee,
        status: "pending",
        createdAt: serverTimestamp(),
      };
      const bookingRef = await addDoc(collection(db, "bookings"), bookingData);

      // Create notification for host
      const notificationData = {
        host_id: listingData.host_id,
        type: "booking",
        title: "New Booking",
        message: `${userData.fullName || "A guest"} has booked your ${listingData.title} for ${checkIn} to ${checkOut}`,
        listing_id: listing_id,
        booking_id: bookingRef.id,
        guest_id: userData.id,
        guest_avatar: userData.photoURL || null,
        read: false,
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

  const nights = calculateNights();
  const totalPrice = nights * listingData.price;
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

        // Fetch reviews with user data
        const reviewsRef = collection(db, "reviews");
        const reviewQuery = query(
          reviewsRef,
          where("listing_id", "==", listing_id)
        );
        const reviewSnap = await getDocs(reviewQuery);
        const reviewCount = reviewSnap.size;

        const reviewsWithUsers = await Promise.all(
          reviewSnap.docs.map(async (reviewDoc) => {
            const reviewData = reviewDoc.data();
            let userData = null;

            if (reviewData.user_id) {
              const userRef = doc(db, "users", reviewData.user_id);
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

        // Fetch host data
        let hostData = null;
        if (data.host_id) {
          const hostRef = doc(db, "users", data.host_id);
          const hostSnap = await getDoc(hostRef);
          if (hostSnap.exists()) {
            hostData = { id: hostSnap.id, ...hostSnap.data() };
          }
        }

        setListingData({ ...data, reviewCount, host: hostData });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    getSelectedListing();
  }, [listing_id, user]);
  // useEffect(() => {
  //   if (listingData) {
  //     console.log("✅ Listing data loaded:", listingData);
  //   }
  // }, [listingData]);
  // return;

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Photo Gallery */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 rounded-2xl overflow-hidden">
            <div
              className="md:col-span-2 md:row-span-2 relative cursor-pointer group h-96 md:h-auto"
              onClick={() => setShowAllPhotos(true)}
            >
              <img
                src={
                  listingData?.photos?.[0] || "https://via.placeholder.com/800"
                }
                alt="Main"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
            </div>
            {listingData?.photos?.slice(1, 5)?.map((photo, idx) => (
              <div
                key={idx}
                className="relative cursor-pointer group h-48 hidden md:block"
                onClick={() => setShowAllPhotos(true)}
              >
                <img
                  src={photo}
                  alt={`Photo ${idx + 2}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowAllPhotos(true)}
            className="mt-4 px-4 py-2 border border-slate-400 text-slate-200 rounded-lg font-medium hover:bg-slate-700 transition"
          >
            Show all {listingData?.photos?.length || 0} photos
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Host Info */}
            <div className="pb-8 border-b border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-2">
                    Hosted by {listingData?.host?.fullName || "Unknown"}
                  </h2>
                  <div className="flex items-center gap-3 text-slate-400 text-sm">
                    <span>{listingData?.numberOfGuests || 0} guests</span>
                    <span>·</span>
                    <span>{listingData?.bedrooms || 0} bedroom</span>
                    <span>·</span>
                    <span>{listingData?.details?.beds || 0} beds</span>
                    <span>·</span>
                    <span>{listingData?.bathrooms || 0} bath</span>
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
                <div className="flex items-center gap-2 text-sm text-slate-300">
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
              <p className="text-slate-300 leading-relaxed">
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
                    className="flex items-center gap-3 text-slate-600 bg-slate-50 px-3 py-2 rounded-lg shadow-sm hover:bg-slate-100 transition"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5 text-indigo-400"
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
                    <div key={review.id} className="flex gap-4">
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
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">
                House rules
              </h3>
              <div className="space-y-3">
                {listingData?.houseRules?.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-700 sticky top-24">
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-3xl font-bold text-white">
                  ₱{listingData?.price?.toLocaleString() || 0}
                </span>
                <span className="text-slate-400">/ night</span>
              </div>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-slate-600 rounded-lg p-3 bg-slate-700">
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      CHECK-IN
                    </label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded bg-slate-700 text-white"
                    />
                  </div>
                  <div className="border border-slate-600 rounded-lg p-3 bg-slate-700">
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      CHECKOUT
                    </label>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded bg-slate-700 text-white"
                    />
                  </div>
                </div>

                <div className="border border-slate-600 rounded-lg p-3 bg-slate-700">
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    GUESTS
                  </label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded bg-slate-700 text-white"
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
              </div>

              <button
                onClick={() =>
                  handleActionWithVerification(() => setShowBookingModal(true))
                }
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition mb-4"
              >
                Reserve
              </button>

              <p className="text-center text-sm text-slate-400 mb-6">
                You won't be charged yet
              </p>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 underline">
                    ₱{listingData?.price?.toLocaleString() || 0} × {nights}{" "}
                    nights
                  </span>
                  <span className="font-medium text-white">
                    ₱{totalPrice?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 underline">Service fee</span>
                  <span className="font-medium text-white">
                    ₱{serviceFee?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="pt-3 border-t border-slate-600 flex items-center justify-between">
                  <span className="font-semibold text-white">Total</span>
                  <span className="font-bold text-white text-lg">
                    ₱{grandTotal?.toLocaleString() || 0}
                  </span>
                </div>
              </div>

              <button
                onClick={() =>
                  handleActionWithVerification(() =>
                    navigate(
                      `/guest/messages/${user.uid}/${listingData.host_id}`
                    )
                  )
                }
                className="w-full mt-6 flex items-center justify-center gap-2 py-3 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition"
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
            </div>

            <div className="border-t border-slate-600 pt-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">Total amount</span>
                <span className="text-2xl font-bold text-white">
                  ₱{grandTotal?.toLocaleString() || 0}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Includes ₱{serviceFee?.toLocaleString() || 0} service fee
              </p>
            </div>

            <div className="mb-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <p className="text-xs text-blue-300">
                Payment will be processed only when the host confirms your booking. No charges will be made now.
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

            <h2 className="text-2xl font-bold text-white mb-6">Share this stay</h2>

            <div className="space-y-3">
              <button
                onClick={() => {
                  const shareUrl = `https://bookingnest.vercel.app${window.location.pathname}`;
                  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(listingData?.title || "Check out this stay")}`;
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
                  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(listingData?.title || "Check out this stay")}`;
                  window.open(twitterUrl, "_blank", "width=600,height=400");
                  setShowShareModal(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition font-medium"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 9 0 11-4s1-8.5 0-11.5a4.5 4.5 0 00-.5-.5z" />
                </svg>
                Share on Twitter
              </button>

              <button
                onClick={() => {
                  const shareUrl = `https://bookingnest.vercel.app${window.location.pathname}`;
                  const instagramUrl = `https://www.instagram.com/?url=${encodeURIComponent(shareUrl)}`;
                  navigator.clipboard.writeText(shareUrl);
                  toast.success("Link copied! You can paste it in Instagram DM");
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
                  const messengerUrl = `https://www.facebook.com/dialog/send?app_id=YOUR_APP_ID&link=${encodeURIComponent(shareUrl)}&redirect_uri=${encodeURIComponent(shareUrl)}`;
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
    </div>
  );
}
