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
import {
  doc,
  getDoc,
  getDocs,
  query,
  where,
  collection,
} from "firebase/firestore";
import LoadingSpinner from "../../loading/Loading";
import { useAuth } from "../../context/AuthContext";
import VerificationBanner from "../../components/Verification";
import { sendOtpToUser } from "../../utils/sendOtpToUser";
import { toast } from "react-toastify";

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
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [serviceData, setServiceData] = useState({});
  const [reviewsData, setReviewsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingVerification, setIsLoadingVerification] = useState(false);

  const { user, isVerified } = useAuth();
  const navigate = useNavigate();
  const { listing_id } = useParams();

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

  const basePrice = serviceData?.price || 0;
  const serviceFee = basePrice * 0.12;
  const totalPrice = basePrice + serviceFee;

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
        const q = query(reviewsRef, where("listing_id", "==", listing_id));
        const reviewSnap = await getDocs(q);
        const reviewCount = reviewSnap.size;

        // Fetch review details with user data
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

        // Fetch provider/host data
        let providerData = null;
        if (data.hostId) {
          const providerRef = doc(db, "users", data.hostId);
          const providerSnap = await getDoc(providerRef);
          if (providerSnap.exists()) {
            providerData = { id: providerSnap.id, ...providerSnap.data() };
          }
        }

        setServiceData({ ...data, reviewCount, provider: providerData });
        setReviewsData(reviewsWithUsers || []);

        // Set first available time slot and service type
        if (
          Array.isArray(data?.availableTimes) &&
          data.availableTimes.length > 0
        ) {
          setSelectedTime(data.availableTimes[0]);
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

  if (loading) return <LoadingSpinner />;
  console.log(serviceData);

  return (
    <div className="min-h-screen bg-slate-900">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-2xl overflow-hidden flex-1">
              <div
                className="md:col-span-2 relative cursor-pointer group h-96"
                onClick={() => setShowAllPhotos(true)}
              >
                <img
                  src={
                    serviceData?.photos?.[0] ||
                    "https://via.placeholder.com/800"
                  }
                  alt="Main"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
              </div>
              {serviceData?.photos?.slice(1, 3)?.map((photo, idx) => (
                <div
                  key={idx}
                  className="relative cursor-pointer group h-40 hidden md:block"
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
              Show all {serviceData?.photos?.length || 0} photos
            </button>
          </div>

          {/* Provider Info Card */}
          <div className="flex flex-col">
            <div className="bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-700 flex-1">
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
              <div className="flex items-center justify-between mb-4">
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
              <p className="text-slate-300 leading-relaxed mb-6">
                {serviceData?.description || "No description available."}
              </p>

              {Array.isArray(serviceData?.highlights) &&
                serviceData.highlights.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    {serviceData.highlights.map((highlight, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 text-slate-300 bg-slate-800 px-4 py-3 rounded-lg"
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
            {reviewsData.length > 0 && (
              <div className="pb-8 border-b border-slate-700">
                <div className="flex items-center gap-2 mb-6">
                  <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                  <h3 className="text-xl font-semibold text-white">
                    {serviceData?.rating || 0} · {serviceData?.reviewCount || 0}{" "}
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
                          {review.comment || review.review || "Great service!"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
            <div className="bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-700 sticky top-24">
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
                <div className="border border-slate-600 rounded-lg p-3 bg-slate-700">
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    SELECT DATE
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded bg-slate-700 text-white"
                  />
                </div>

                <div className="border border-slate-600 rounded-lg p-3 bg-slate-700">
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    PREFERRED TIME
                  </label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded bg-slate-700 text-white"
                  >
                    {Array.isArray(serviceData?.availableTimes) &&
                    serviceData.availableTimes.length > 0 ? (
                      serviceData.availableTimes.map((time, idx) => (
                        <option key={idx} value={time}>
                          {time}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        No times available
                      </option>
                    )}
                  </select>
                </div>

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
                    ₱{totalPrice.toLocaleString()}
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
                <span className="text-slate-400">Preferred date</span>
                <span className="font-medium text-white">
                  {selectedDate || "Not selected"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Preferred time</span>
                <span className="font-medium text-white">{selectedTime}</span>
              </div>
              {additionalNotes && (
                <div className="text-sm">
                  <span className="text-slate-400 block mb-1">Notes:</span>
                  <p className="text-white bg-slate-700 p-3 rounded-lg">
                    {additionalNotes}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-600 pt-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">Estimated total</span>
                <span className="text-2xl font-bold text-white">
                  ₱{totalPrice.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Includes ₱{serviceFee.toLocaleString()} service fee · Final
                quote will be provided by provider
              </p>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition">
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
    </div>
  );
}
