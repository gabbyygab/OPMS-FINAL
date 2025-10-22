import { useEffect, useState } from "react";
import {
  MapPin,
  Star,
  Heart,
  Share2,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  Award,
  MessageCircle,
  Check,
  Info,
  AlertCircle,
  Users,
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
  serverTimestamp,
} from "firebase/firestore";
import LoadingSpinner from "../../loading/Loading";
import { useAuth } from "../../context/AuthContext";
import VerificationBanner from "../../components/Verification";
import { sendOtpToUser } from "../../utils/sendOtpToUser";
import { toast } from "react-toastify";

const reviews = [
  {
    id: 1,
    author: "Jennifer L.",
    avatar: "https://i.pravatar.cc/150?img=10",
    rating: 5,
    date: "October 2025",
    comment:
      "This was an incredible experience! Our guide was knowledgeable and passionate. The whole family had an amazing time. Highly recommend!",
  },
  {
    id: 2,
    author: "Michael T.",
    avatar: "https://i.pravatar.cc/150?img=13",
    rating: 5,
    date: "September 2025",
    comment:
      "Best experience we've had! Everything was well-organized and the host made sure everyone was comfortable. Worth every peso!",
  },
  {
    id: 3,
    author: "Ana S.",
    avatar: "https://i.pravatar.cc/150?img=16",
    rating: 5,
    date: "August 2025",
    comment:
      "Unforgettable! The attention to detail was amazing. Our host went above and beyond. Can't wait to book again!",
  },
];

export default function ExperienceDetailPage() {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const [selectedDateTime, setSelectedDateTime] = useState(null);
  const [guests, setGuests] = useState(2);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [experienceData, setExperienceData] = useState({});
  const [loading, setLoading] = useState(false);
  const [isLoadingVerification, setIsLoadingVerification] = useState(false);
  const [userData, setUserData] = useState(null);

  const { user, isVerified } = useAuth();
  const navigate = useNavigate();
  const { listing_id } = useParams();

  const handleVerification = async () => {``
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

  const handleConfirmBooking = async () => {
    if (!user) {
      toast.error("Please log in to book");
      return;
    }

    if (!selectedDateTime) {
      toast.error("Please select a date and time");
      return;
    }

    try {
      const loadingToast = toast.loading("Processing your booking...");

      // Create booking with pending status
      // Payment will be processed only when host confirms the booking
      const bookingData = {
        listing_id: listing_id,
        guest_id: user.uid,
        host_id: experienceData.host_id,
        selectedDate: selectedDateTime.date,
        selectedTime: selectedDateTime.time,
        guests: guests,
        totalAmount: grandTotal,
        serviceFee: serviceFee,
        status: "pending",
        createdAt: serverTimestamp(),
      };
      const bookingRef = await addDoc(collection(db, "bookings"), bookingData);

      // Create notification for host
      const notificationData = {
        host_id: experienceData.host_id,
        type: "booking",
        title: "New Booking",
        message: `${user.fullName || "A guest"} has booked your ${experienceData.title} for ${selectedDateTime.date} at ${selectedDateTime.time}`,
        listing_id: listing_id,
        booking_id: bookingRef.id,
        guest_id: user.uid,
        guest_avatar: null,
        read: false,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, "notifications"), notificationData);

      // DO NOT process payment here - payment will be processed when host confirms the booking
      // This allows the host to accept or reject the booking before payment is taken

      toast.dismiss(loadingToast);
      toast.success("Booking request sent successfully! Awaiting host confirmation...");
      setShowBookingModal(false);
      navigate("/guest/my-bookings");
    } catch (error) {
      console.error("Error confirming booking:", error);
      toast.error("Failed to confirm booking. Please try again.");
    }
  };

  const totalPrice = (experienceData?.price || 0) * guests;
  const serviceFee = totalPrice * 0.1;
  const grandTotal = totalPrice + serviceFee;

  const nextPhoto = () => {
    setCurrentPhotoIndex(
      (prev) => (prev + 1) % (experienceData?.photos?.length || 1)
    );
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) =>
      prev === 0 ? (experienceData?.photos?.length || 1) - 1 : prev - 1
    );
  };

  useEffect(() => {
    const getSelectedExperience = async () => {
      try {
        setLoading(true);
        const experienceRef = doc(db, "listings", listing_id);
        const experienceSnap = await getDoc(experienceRef);

        if (!experienceSnap.exists()) {
          console.log("No such experience!");
          return;
        }

        const data = experienceSnap.data();
        const reviewsRef = collection(db, "reviews");
        const q = query(reviewsRef, where("listing_id", "==", listing_id));
        const reviewSnap = await getDocs(q);
        const reviewCount = reviewSnap.size;

        let hostData = null;
        if (data.host_id) {
          const hostRef = doc(db, "users", data.host_id);
          const hostSnap = await getDoc(hostRef);
          if (hostSnap.exists()) {
            hostData = { id: hostSnap.id, ...hostSnap.data() };
          }
        }

        setExperienceData({ ...data, reviewCount, host: hostData });

        // Set first available date-time combination
        if (data?.availableDates?.length > 0) {
          setSelectedDateTime(data.availableDates[0]);
        }

        // Check if user has favorited this experience
        if (user) {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUserData({ id: userSnap.id, ...userSnap.data() });
          }

          const favoritesRef = collection(db, "favorites");
          const favQuery = query(
            favoritesRef,
            where("guest_id", "==", user.uid),
            where("listing_id", "==", listing_id)
          );
          const favSnap = await getDocs(favQuery);
          if (favSnap.size > 0) {
            setIsFavorite(true);
            setFavoriteId(favSnap.docs[0].id);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    getSelectedExperience();
  }, [listing_id, user]);
  //   console.log(experienceData);

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
                <span className="hidden sm:inline text-sm">Save</span>
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
            {experienceData?.title || "Loading..."}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-white">
                {experienceData?.rating || "New"}
              </span>
              <span className="text-slate-400">
                ({experienceData?.reviewCount || 0} reviews)
              </span>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <MapPin className="w-4 h-4" />
              {experienceData?.location || "Unknown location"}
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <Clock className="w-4 h-4" />
              {experienceData?.duration || "Duration varies"}
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <Globe className="w-4 h-4" />
              {experienceData?.language || "English"}
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
                  experienceData?.photos?.[0] ||
                  "https://via.placeholder.com/800"
                }
                alt="Main"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
            </div>
            {experienceData?.photos?.slice(1, 5)?.map((photo, idx) => (
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
            Show all {experienceData?.photos?.length || 0} photos
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
                    Experience hosted by{" "}
                    {experienceData?.host?.fullName || "Unknown"}
                  </h2>
                  <div className="flex items-center gap-3 text-slate-400 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>
                        Up to {experienceData?.maxGuests || 10} guests
                      </span>
                    </div>

                    <span>·</span>

                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{experienceData?.duration || "3"} hours</span>
                    </div>

                    <span>·</span>

                    <div className="flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      <span>{experienceData?.language || "English"}</span>
                    </div>
                  </div>
                </div>
                <img
                  src={
                    experienceData?.host?.photoURL ||
                    "https://via.placeholder.com/100"
                  }
                  alt={experienceData?.host?.fullName || "Host"}
                  className="w-14 h-14 rounded-full"
                />
              </div>
              {experienceData?.host?.isVerified && (
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Award className="w-4 h-4 text-indigo-400" />
                  <span>
                    Verified Host · Joined{" "}
                    {experienceData?.host?.createdAt
                      ? new Date(
                          experienceData.host.createdAt.toDate()
                        ).toLocaleDateString("en-PH", {
                          year: "numeric",
                          month: "long",
                        })
                      : "—"}
                  </span>
                </div>
              )}
            </div>

            {/* What You'll Do */}
            <div className="pb-8 border-b border-slate-700">
              <h3 className="text-xl font-semibold text-white mb-4">
                What you'll do
              </h3>
              <p className="text-slate-300 leading-relaxed mb-6">
                {experienceData?.description || "No description available."}
              </p>

              {experienceData?.activities &&
                experienceData.activities.length > 0 && (
                  <div className="space-y-3">
                    {experienceData.activities.map((activity, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white font-semibold text-sm">
                            {idx + 1}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-slate-300">{activity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {/* What to Bring */}
            {experienceData?.toBring && experienceData.toBring.length > 0 && (
              <div className="pb-8 border-b border-slate-700">
                <h3 className="text-xl font-semibold text-white mb-4">
                  What to bring
                </h3>
                <div className="space-y-2">
                  {experienceData.toBring.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">{item}</span>
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
                  {experienceData?.rating || 0} ·{" "}
                  {experienceData?.reviewCount || 0} reviews
                </h3>
              </div>
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="flex gap-4">
                    <img
                      src={review.avatar}
                      alt={review.author}
                      className="w-12 h-12 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">
                          {review.author}
                        </span>
                        <span className="text-slate-500 text-sm">·</span>
                        <span className="text-slate-500 text-sm">
                          {review.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star
                            key={i}
                            className="w-3 h-3 fill-yellow-400 text-yellow-400"
                          />
                        ))}
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Important Information */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Things To Know
              </h3>
              <div className="space-y-3">
                {experienceData?.thingsToKnow?.map((info, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">{info}</span>
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
                  ₱{experienceData?.price?.toLocaleString() || 0}
                </span>
                <span className="text-slate-400">/ person</span>
              </div>

              <div className="space-y-4 mb-6">
                <div className="border border-slate-600 rounded-lg p-3 bg-slate-700">
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    SELECT DATE & TIME
                  </label>
                  <select
                    value={selectedDateTime ? JSON.stringify(selectedDateTime) : ""}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedDateTime(JSON.parse(e.target.value));
                      }
                    }}
                    className="w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded bg-slate-700 text-white"
                  >
                    <option value="" disabled>
                      Select a date and time
                    </option>
                    {experienceData?.availableDates && experienceData.availableDates.length > 0 ? (
                      experienceData.availableDates.map((dateTime, idx) => {
                        const dateStr = dateTime.date || "";
                        const timeStr = dateTime.time || "";
                        const displayDate = dateStr
                          ? new Date(dateStr).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "";
                        return (
                          <option
                            key={idx}
                            value={JSON.stringify(dateTime)}
                            className="bg-slate-900 text-white"
                          >
                            {displayDate} at {timeStr}
                          </option>
                        );
                      })
                    ) : (
                      <option value="" disabled>
                        No dates available
                      </option>
                    )}
                  </select>
                </div>

                <div className="border border-slate-600 rounded-lg p-3 bg-slate-700">
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    NUMBER OF GUESTS
                  </label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded bg-slate-700 text-white"
                  >
                    {Array.from(
                      { length: experienceData?.maxGuests || 10 },
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
                Book now
              </button>

              <p className="text-center text-sm text-slate-400 mb-6">
                You won't be charged yet
              </p>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 underline">
                    ₱{experienceData?.price?.toLocaleString() || 0} × {guests}{" "}
                    {guests === 1 ? "guest" : "guests"}
                  </span>
                  <span className="font-medium text-white">
                    ₱{totalPrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 underline">Service fee</span>
                  <span className="font-medium text-white">
                    ₱{serviceFee.toLocaleString()}
                  </span>
                </div>
                <div className="pt-3 border-t border-slate-600 flex items-center justify-between">
                  <span className="font-semibold text-white">Total</span>
                  <span className="font-bold text-white text-lg">
                    ₱{grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() =>
                  handleActionWithVerification(() =>
                    navigate(
                      `/guest/messages/${user?.uid}/${experienceData?.host_id}`
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
              {currentPhotoIndex + 1} / {experienceData?.photos?.length || 0}
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
                src={experienceData?.photos?.[currentPhotoIndex] || ""}
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
              {experienceData?.photos?.map((photo, idx) => (
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
                <span className="text-slate-400">Date & Time</span>
                <span className="font-medium text-white">
                  {selectedDateTime
                    ? `${new Date(selectedDateTime.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })} at ${selectedDateTime.time}`
                    : "Not selected"}
                </span>
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
                  ₱{grandTotal.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Includes ₱{serviceFee.toLocaleString()} service fee
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

            <h2 className="text-2xl font-bold text-white mb-6">Share this experience</h2>

            <div className="space-y-3">
              <button
                onClick={() => {
                  const shareUrl = `https://bookingnest.vercel.app${window.location.pathname}`;
                  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(experienceData?.title || "Check out this experience")}`;
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
                  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(experienceData?.title || "Check out this experience")}`;
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
