import { useEffect, useState } from "react";
import { MapPin, Star, Heart, X, Calendar, Users, Briefcase, Home, Sparkles, Wrench } from "lucide-react";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { toast } from "react-toastify";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import VerificationBanner from "./Verification";
import { sendOtpToUser } from "../utils/sendOtpToUser";
import { getRecommendedListings, getRecommendationsByType } from "../utils/recommendationUtils";
import RecommendationCard from "./RecommendationCard";
import { motion, AnimatePresence } from "framer-motion";
// Extract city or province from location string
function extractCity(location) {
  if (!location) return "Other";

  // Split by comma and get parts
  const parts = location.split(",").map((part) => part.trim());

  // Address format is typically: "Street Address, City, Province/State, Country"
  // or "Street Address, City, Country"
  // We want to extract the City or Province (second-to-last or third-to-last part)

  if (parts.length >= 3) {
    // If we have 3+ parts, return the second-to-last (usually City or Province)
    return parts[parts.length - 2];
  } else if (parts.length === 2) {
    // If we have 2 parts, return the first one (City)
    return parts[0];
  }

  // If only 1 part, return it as is
  return parts[0];
}

// Group listings by city
function groupListingsByCity(listings) {
  const grouped = {};

  listings.forEach((listing) => {
    const city = extractCity(listing.location);
    if (!grouped[city]) {
      grouped[city] = [];
    }
    grouped[city].push(listing);
  });

  return grouped;
}

function parseToDate(ts) {
  if (!ts && ts !== 0) return null;

  // Firestore Timestamp (client lib): has toDate()
  if (typeof ts === "object" && typeof ts.toDate === "function") {
    try {
      return ts.toDate();
    } catch {
      return null;
    }
  }

  // Some firestore shapes: { seconds, nanoseconds }
  if (
    typeof ts === "object" &&
    (typeof ts.seconds === "number" || typeof ts.nanoseconds === "number")
  ) {
    const seconds = Number(ts.seconds || 0);
    const nanos = Number(ts.nanoseconds || 0);
    return new Date(seconds * 1000 + Math.round(nanos / 1e6));
  }

  // JS Date instance
  if (ts instanceof Date) return ts;

  // number (assume milliseconds)
  if (typeof ts === "number" && !Number.isNaN(ts)) return new Date(ts);

  // ISO string or other date string
  if (typeof ts === "string") {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

function formatRange(fromDate, toDate) {
  if (!fromDate && !toDate) return "Availability not specified";

  // if both present, show short range; else fallback to single date
  if (fromDate && toDate) {
    // Example formatting: "Oct 15 – Oct 18, 2025"
    const fromStr = fromDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const toStr = toDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${fromStr} – ${toStr}`;
  }

  // Only from
  if (fromDate) {
    return fromDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  // Only to
  if (toDate) {
    return toDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return "Availability not specified";
}

// Format availability based on listing type - returns array of formatted strings
function formatAvailability(listing) {
  if (!listing) return [];

  // Handle stays - availableDates is array of { startDate, endDate }
  if (listing.type === "stays" && Array.isArray(listing.availableDates) && listing.availableDates.length > 0) {
    return listing.availableDates
      .map((range) => {
        const startDate = parseToDate(range.startDate);
        const endDate = parseToDate(range.endDate);
        if (startDate && endDate) {
          return formatRange(startDate, endDate);
        }
        return null;
      })
      .filter((item) => item !== null);
  }

  // Handle experiences - availableDates is array of { date, time }
  if (listing.type === "experiences" && Array.isArray(listing.availableDates) && listing.availableDates.length > 0) {
    return listing.availableDates
      .map((dateItem) => {
        if (dateItem.date) {
          const dateObj = parseToDate(dateItem.date);
          if (dateObj) {
            const dateStr = dateObj.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            const timeStr = dateItem.time ? ` at ${dateItem.time}` : "";
            return `${dateStr}${timeStr}`;
          }
        }
        return null;
      })
      .filter((item) => item !== null);
  }

  // Handle services - availableDates is array of { startDate, endDate }
  if (listing.type === "services" && Array.isArray(listing.availableDates) && listing.availableDates.length > 0) {
    return listing.availableDates
      .map((range) => {
        const startDate = parseToDate(range.startDate);
        const endDate = parseToDate(range.endDate);
        if (startDate && endDate) {
          return formatRange(startDate, endDate);
        }
        return null;
      })
      .filter((item) => item !== null);
  }

  return [];
}
export default function BookingsSection({ userData, isFavoritePage }) {
  const [listings, setListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null); // for modal
  const [searchParams] = useSearchParams();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Get active filter from URL params (set by navbar tabs)
  const activeFilter = searchParams.get("type") || "stays";

  //favorites

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const closeModal = () => {
    setSelectedListing(null);
  };
  const { isVerified, user } = useAuth();

  const navigate = useNavigate();

  // Get search filters from URL params
  const searchFilters = {
    location: searchParams.get("location") || "",
    checkIn: searchParams.get("checkIn") || "",
    checkOut: searchParams.get("checkOut") || "",
    guests: parseInt(searchParams.get("guests") || "1"),
    serviceType: searchParams.get("serviceType") || "",
  };

  // Track mouse position for interactive gradient background
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Clear filters function
  const clearFilters = () => {
    navigate("/guest");
  };
  const handleVerification = async () => {
    try {
      setLoading(true);
      await sendOtpToUser(user);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      navigate("/account-verification");
    }
  };

  if (isFavoritePage) {
    useEffect(() => {
      if (!userData?.id) return;

      // Reference to favorites collection filtered by current user
      const favRef = collection(db, "favorites");
      const q = query(
        favRef,
        where("guest_id", "==", userData.id),
        where("isDraft", "==", false)
      );

      // Realtime listener for user's favorites
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        try {
          setLoading(true);
          if (snapshot.empty) {
            setFavorites([]);
            setLoading(false);
            return;
          }

          // Fetch full listing data for each favorite
                  const favoriteListings = await Promise.all(
                    snapshot.docs.map(async (favDoc) => {
                      const favData = favDoc.data();
                      const listingRef = doc(db, "listings", favData.listing_id);
                      const listingSnap = await getDoc(listingRef);
          
                      if (listingSnap.exists()) {
                        const listing = {
                          id: listingSnap.id,
                          ...listingSnap.data(),
                        };
          
                        // Fetch reviews for this listing
                        const reviewsRef = collection(db, "reviews");
                        const reviewQuery = query(
                          reviewsRef,
                          where("listingId", "==", listing.id)
                        );
                        const reviewSnap = await getDocs(reviewQuery);
                        const reviewCount = reviewSnap.size;
          
                        let totalRating = 0;
                        reviewSnap.docs.forEach((doc) => {
                          totalRating += doc.data().rating;
                        });
                        const averageRating =
                          reviewCount > 0 ? (totalRating / reviewCount).toFixed(1) : 0;
          
                        return {
                          ...listing,
                          rating: averageRating,
                          reviewCount: reviewCount,
                          isFavorite: true, // ✅ mark it as favorite
                          favoriteDocId: favDoc.id, // for removing later
                        };
                      }
                      return null;
                    })
                  );
          setFavorites(favoriteListings.filter((f) => f !== null));
        } catch (error) {
          console.error("Error fetching favorite listings:", error);
        } finally {
          setLoading(false);
        }
      });

      return () => unsubscribe();
    }, [userData]);
  } else {
    useEffect(() => {
      if (!userData?.id) return;

      setLoading(true);

      // 1️⃣ Fetch all listings
      const listingRef = collection(db, "listings");
      const listingQuery = query(listingRef, where("isDraft", "==", false));

      const fetchAndCombine = async (favDocIds) => {
        try {
          const listingsSnap = await getDocs(listingQuery);
          const listingsData = await Promise.all(
            listingsSnap.docs.map(async (doc) => {
              const listing = {
                id: doc.id,
                ...doc.data(),
              };

              // Fetch reviews for this listing
              const reviewsRef = collection(db, "reviews");
              const reviewQuery = query(
                reviewsRef,
                where("listingId", "==", listing.id)
              );
              const reviewSnap = await getDocs(reviewQuery);
              const reviewCount = reviewSnap.size;

              let totalRating = 0;
              reviewSnap.docs.forEach((doc) => {
                totalRating += doc.data().rating;
              });
              const averageRating =
                reviewCount > 0 ? (totalRating / reviewCount).toFixed(1) : 0;

              return {
                ...listing,
                rating: averageRating,
                reviewCount: reviewCount,
              };
            })
          );

          // Combine listings with favorite status based on current favorites
          const listingsWithFavs = listingsData.map((listing) => ({
            ...listing,
            isFavorite: favDocIds.includes(listing.id),
          }));

          setListings(listingsWithFavs);
          setLoading(false);

          // 🔥 Fetch recommendations based on guest's previous bookings
          if (!isFavoritePage && userData?.id) {
            try {
              setRecommendationsLoading(true);
              const recs = await getRecommendedListings(userData.id, listingsWithFavs);
              setRecommendations(recs);
            } catch (error) {
              console.error("Error fetching recommendations:", error);
            } finally {
              setRecommendationsLoading(false);
            }
          }
        } catch (error) {
          console.error("Error fetching listings:", error);
          setLoading(false);
        }
      };

      // 2️⃣ Set up real-time listener for user's favorites
      const favRef = collection(db, "favorites");
      const favQuery = query(
        favRef,
        where("guest_id", "==", userData.id),
        where("isDraft", "==", false)
      );

      const unsubscribe = onSnapshot(favQuery, (favSnap) => {
        // Get all favorited listing IDs for this user from favorites collection
        const favoriteIds = favSnap.docs.map((doc) => doc.data().listing_id);

        // Update listings with current favorite status
        fetchAndCombine(favoriteIds);
      });

      return () => unsubscribe();
    }, [userData]);
  }
  // Helper function to check if listing matches filters
  const matchesSearchFilters = (listing) => {
    // Check location
    if (
      searchFilters.location &&
      !listing.location
        ?.toLowerCase()
        .includes(searchFilters.location.toLowerCase())
    ) {
      return false;
    }

    // Check guest count
    if (searchFilters.guests && listing.numberOfGuests < searchFilters.guests) {
      return false;
    }

    // Check service type (for services listings)
    if (searchFilters.serviceType && listing.type === "services") {
      const listingServiceTypes = listing.serviceTypes || [];
      const matchesServiceType = listingServiceTypes.some((type) =>
        type.toLowerCase().includes(searchFilters.serviceType.toLowerCase())
      );
      if (!matchesServiceType) {
        return false;
      }
    }

    // Check availability dates
    if (searchFilters.checkIn || searchFilters.checkOut) {
      // Get available dates array
      const availableDates = listing.availableDates || [];

      if (availableDates.length === 0) {
        return false; // No availability info, exclude listing
      }

      // Check if any availability range matches the search dates
      const hasMatchingDates = availableDates.some((range) => {
        const rangeStart = parseToDate(range.startDate);
        const rangeEnd = parseToDate(range.endDate);

        if (!rangeStart || !rangeEnd) return false;

        const searchCheckIn = searchFilters.checkIn
          ? new Date(searchFilters.checkIn)
          : null;
        const searchCheckOut = searchFilters.checkOut
          ? new Date(searchFilters.checkOut)
          : null;

        // If only checkIn is provided, check if it's within range
        if (searchCheckIn && !searchCheckOut) {
          return searchCheckIn >= rangeStart && searchCheckIn <= rangeEnd;
        }

        // If only checkOut is provided, check if it's within range
        if (searchCheckOut && !searchCheckIn) {
          return searchCheckOut >= rangeStart && searchCheckOut <= rangeEnd;
        }

        // If both dates provided, check if date range overlaps
        if (searchCheckIn && searchCheckOut) {
          return searchCheckIn <= rangeEnd && searchCheckOut >= rangeStart;
        }

        return false;
      });

      if (!hasMatchingDates) {
        return false;
      }
    }

    return true;
  };

  const filteredFavoriteItems = favorites.filter(
    (item) => item.type === activeFilter && matchesSearchFilters(item)
  );

  const filteredItems = listings.filter(
    (item) => item.type === activeFilter && matchesSearchFilters(item)
  );

  const toggleFavorite = async (
    listingId,
    guestId,
    setSetter,
    isOnFavoritePage = false
  ) => {
    try {
      // Reference the top-level 'favorites' collection
      const favRef = collection(db, "favorites");

      // Query to check if this favorite already exists
      const q = query(
        favRef,
        where("guest_id", "==", guestId),
        where("listing_id", "==", listingId)
      );
      const snapshot = await getDocs(q);
      const isFavoritedInDb = !snapshot.empty;

      if (isFavoritedInDb) {
        // Remove from favorites
        const batch = snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref));
        await Promise.all(batch);
        toast.success("Removed from favorites.", { position: "top-right" });
        console.log("❌ Removed from favorites");

        if (isOnFavoritePage) {
          // On favorites page, remove the item from the list
          setSetter((prev) =>
            prev.filter((listing) => listing.id !== listingId)
          );
        } else {
          // On regular page, update the isFavorite flag based on DB state
          setSetter((prev) =>
            prev.map((listing) =>
              listing.id === listingId
                ? { ...listing, isFavorite: false }
                : listing
            )
          );
        }
      } else {
        // Add to favorites
        await addDoc(favRef, {
          guest_id: guestId,
          listing_id: listingId,
          createdAt: new Date(),
          isDraft: false,
        });
        console.log("✅ Added to favorites");
        toast.success("Added to favorites.", { position: "top-right" });

        // Update state - set isFavorite based on whether it's in favorites collection
        setSetter((prev) =>
          prev.map((listing) =>
            listing.id === listingId
              ? { ...listing, isFavorite: true }
              : listing
          )
        );
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Failed to update favorite status.", {
        position: "top-right",
      });
    }
  };

  // Helper function to check if a listing is favorited by querying the favorites collection
  const checkIsFavorited = async (listingId, guestId) => {
    try {
      const favRef = collection(db, "favorites");
      const q = query(
        favRef,
        where("guest_id", "==", guestId),
        where("listing_id", "==", listingId)
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error("Error checking favorite status:", error);
      return false;
    }
  };
  //pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // ✅ Decide which list to paginate based on the page type
  const activeList = isFavoritePage ? filteredFavoriteItems : filteredItems;

  const totalPages = Math.ceil(activeList.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentListings = activeList.slice(indexOfFirst, indexOfLast);

  return (
    <div className="relative w-screen min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 overflow-x-hidden -ml-[calc((100vw-100%)/2)] -mt-32 pt-32 lg:pt-0">
      {/* Interactive Mouse-Following Gradient Background */}
      <div
        className="absolute inset-0 transition-all duration-100 ease-out"
        style={{
          background: `radial-gradient(
            circle at ${mousePosition.x}% ${mousePosition.y}%,
            rgba(99, 102, 241, 0.15) 0%,
            rgba(168, 85, 247, 0.10) 25%,
            rgba(59, 130, 246, 0.05) 50%,
            rgba(15, 23, 42, 0) 100%
          ),
          linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)`,
        }}
      ></div>

      {/* Static gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-slate-900/30"></div>
      <div className="lg:mt-28 sm:mt-32">
        <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="pt-12 sm:pt-20 md:pt-28 lg:pt-36 pb-8 sm:pb-12">
            {!isVerified && (
              <VerificationBanner
                handleVerification={handleVerification}
                userData={userData}
              />
            )}
            <div className="mb-8 sm:mb-12 text-center">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-3 sm:mb-4 tracking-tight">
                {isFavoritePage
                  ? "Your Favorite Escapes"
                  : activeFilter === "stays"
                  ? "Explore Homes"
                  : activeFilter === "experiences"
                  ? "Explore Experiences"
                  : "Explore Services"}
              </h1>
              <p className="text-base sm:text-lg text-slate-400 max-w-3xl mx-auto">
                {isFavoritePage
                  ? "A curated collection of your most-loved stays, experiences, and services. Ready for your next adventure!"
                  : "Browse all available listings from hosts and providers"}
              </p>
            </div>

            {/* Active Filters Display */}
            {(searchFilters.location ||
              searchFilters.checkIn ||
              searchFilters.checkOut ||
              searchFilters.guests > 1 ||
              searchFilters.serviceType) && (
              <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    {searchFilters.location && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600/20 border border-indigo-500/50 rounded-full text-sm text-indigo-300">
                        <MapPin className="w-3 h-3" />
                        {searchFilters.location}
                      </span>
                    )}
                    {(searchFilters.checkIn || searchFilters.checkOut) && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600/20 border border-emerald-500/50 rounded-full text-sm text-emerald-300">
                        <Calendar className="w-3 h-3" />
                        {searchFilters.checkIn && searchFilters.checkOut
                          ? `${new Date(searchFilters.checkIn).toLocaleDateString()} - ${new Date(searchFilters.checkOut).toLocaleDateString()}`
                          : searchFilters.checkIn
                          ? new Date(searchFilters.checkIn).toLocaleDateString()
                          : new Date(searchFilters.checkOut).toLocaleDateString()}
                      </span>
                    )}
                    {searchFilters.guests > 1 && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-600/20 border border-amber-500/50 rounded-full text-sm text-amber-300">
                        <Users className="w-3 h-3" />
                        {searchFilters.guests} guests
                      </span>
                    )}
                    {searchFilters.serviceType && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-600/20 border border-purple-500/50 rounded-full text-sm text-purple-300">
                        <Briefcase className="w-3 h-3" />
                        {searchFilters.serviceType}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-slate-400 hover:text-slate-200 underline transition"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}

            {/* Listings Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="text-center">
                  <div className="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    {/* Outer ring */}
                    <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
                    {/* Rotating border */}
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 border-r-indigo-500 animate-spin"></div>
                    {/* Center dot */}
                    <div className="absolute w-2 h-2 bg-indigo-500 rounded-full"></div>
                  </div>
                  <p className="text-white text-lg font-semibold">
                    Loading Listings
                  </p>
                  <p className="text-slate-400 text-sm mt-1">Please wait...</p>
                </div>
              </div>
            ) : currentListings.length > 0 ? (
              <motion.div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                    },
                  },
                }}
              >
                {currentListings.map((listing) => {
                  return (
                    <motion.div
                      key={listing.id}
                      className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700 overflow-hidden hover:shadow-xl hover:shadow-indigo-500/10 hover:border-slate-600 transition-all duration-300 flex flex-col h-full group"
                      variants={{
                        hidden: { opacity: 0, y: 20, scale: 0.95 },
                        visible: {
                          opacity: 1,
                          y: 0,
                          scale: 1,
                          transition: {
                            duration: 0.4,
                            ease: [0.25, 0.1, 0.25, 1],
                          },
                        },
                      }}
                      whileHover={{
                        y: -8,
                        transition: { duration: 0.2 },
                      }}
                    >
                      {/* Image Container - Compact */}
                      <div className="relative overflow-hidden h-32 sm:h-40 md:h-48">
                        {listing.photos && listing.photos.length > 0 ? (
                          <img
                            src={listing.photos[0]}
                            alt={listing.title || "Listing"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-500 text-xs">
                            No Image
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                        {/* Favorite Button */}
                        <motion.button
                          onClick={() =>
                            toggleFavorite(
                              listing.id,
                              userData.id,
                              isFavoritePage ? setFavorites : setListings,
                              isFavoritePage
                            )
                          }
                          className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-sm p-1.5 sm:p-2 rounded-full hover:bg-slate-900 transition-all"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <motion.div
                            animate={{
                              scale: listing.isFavorite ? [1, 1.2, 1] : 1,
                            }}
                            transition={{
                              duration: 0.3,
                            }}
                          >
                            <Heart
                              className={`w-3 h-3 sm:w-4 sm:h-4 transition-all ${
                                listing.isFavorite
                                  ? "fill-red-500 text-red-500"
                                  : "text-slate-300 hover:text-red-400"
                              }`}
                            />
                          </motion.div>
                        </motion.button>

                        {/* Rating Badge */}
                        <div className="absolute bottom-2 left-2 flex items-center bg-amber-500/90 px-2 py-1 rounded-lg border border-amber-500/50">
                          <Star className="w-3 h-3 mr-0.5 fill-white text-white" />
                          <span className="text-white font-semibold text-xs">
                            {listing.rating || "New"}
                          </span>
                        </div>
                      </div>

                      {/* Content - Minimal */}
                      <div className="p-2 sm:p-3 flex flex-col flex-1">
                        {/* Title */}
                        <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 mb-2">
                          {listing.title || "Untitled"}
                        </h3>

                        {/* Price */}
                        <div className="flex items-baseline gap-1 mb-3 flex-1">
                          <span className="text-lg sm:text-xl font-bold text-white">
                            ₱{(parseFloat(listing.price) || 0).toFixed(0)}
                          </span>
                          <span className="text-xs text-slate-400">
                            {listing.type === "stays" ? "/night" : listing.type === "experiences" ? "/person" : "/hr"}
                          </span>
                        </div>

                        {/* Book Now Button */}
                        <motion.button
                          onClick={() => {
                            if (!isVerified) {
                              return toast.warning(
                                "Please verify to use this feature!",
                                { position: "top-right" }
                              );
                            }
                            navigate(
                              `/guest/listing-details/${listing.type}/${listing.id}`
                            );
                          }}
                          className="w-full bg-indigo-600 text-white py-2 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Book Now
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <div className="flex items-center justify-center py-24">
                <div className="text-center">
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-12">
                    <p className="text-slate-300 text-lg font-medium">
                      {isFavoritePage
                        ? "No Favorites Available"
                        : "No listings available."}
                    </p>
                    <p className="text-slate-500 text-sm mt-2">
                      {isFavoritePage
                        ? "Start adding listings to your favorites"
                        : "Check back later for new listings"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ✅ Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 hover:border-slate-600 transition-all font-medium"
                >
                  Prev
                </button>

                {[...Array(totalPages)].map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      currentPage === idx + 1
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                        : "bg-slate-800/50 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 hover:border-slate-600 transition-all font-medium"
                >
                  Next
                </button>
              </div>
            )}

            {/* 🔥 RECOMMENDATIONS SECTION - Shows if user has booking history */}
            {!isFavoritePage && !recommendationsLoading && recommendations.length > 0 && (
              <div className="mt-20 pt-20 border-t border-slate-700">
                {/* Recommendations for Stays */}
                {getRecommendationsByType(recommendations, "stays", 6).length > 0 && (
                  <div className="mb-16">
                    <div className="mb-8">
                      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center gap-2">
                        <Home className="w-7 h-7 text-indigo-400" />
                        Recommended Homes for You
                      </h2>
                      <p className="text-slate-400">
                        Based on your previous bookings, we think you'll love these stays
                      </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                      {getRecommendationsByType(recommendations, "stays", 6).map((rec) => (
                        <RecommendationCard
                          key={rec.id}
                          listing={rec}
                          recommendationReason={rec.recommendationReason}
                          recommendationScore={rec.recommendationScore}
                          isFavorite={rec.isFavorite}
                          onToggleFavorite={(listingId) => {
                            toggleFavorite(listingId, userData.id, setListings, false);
                            // Update recommendations state to reflect favorite change
                            setRecommendations((prev) =>
                              prev.map((item) =>
                                item.id === listingId
                                  ? { ...item, isFavorite: !item.isFavorite }
                                  : item
                              )
                            );
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations for Experiences */}
                {getRecommendationsByType(recommendations, "experiences", 6).length > 0 && (
                  <div className="mb-16">
                    <div className="mb-8">
                      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center gap-2">
                        <Sparkles className="w-7 h-7 text-indigo-400" />
                        Recommended Experiences for You
                      </h2>
                      <p className="text-slate-400">
                        Adventure awaits - explore experiences similar to your past bookings
                      </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                      {getRecommendationsByType(recommendations, "experiences", 6).map((rec) => (
                        <RecommendationCard
                          key={rec.id}
                          listing={rec}
                          recommendationReason={rec.recommendationReason}
                          recommendationScore={rec.recommendationScore}
                          isFavorite={rec.isFavorite}
                          onToggleFavorite={(listingId) => {
                            toggleFavorite(listingId, userData.id, setListings, false);
                            // Update recommendations state to reflect favorite change
                            setRecommendations((prev) =>
                              prev.map((item) =>
                                item.id === listingId
                                  ? { ...item, isFavorite: !item.isFavorite }
                                  : item
                              )
                            );
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations for Services */}
                {getRecommendationsByType(recommendations, "services", 6).length > 0 && (
                  <div className="mb-16">
                    <div className="mb-8">
                      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center gap-2">
                        <Wrench className="w-7 h-7 text-indigo-400" />
                        Recommended Services for You
                      </h2>
                      <p className="text-slate-400">
                        Quality services matched to your needs and preferences
                      </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                      {getRecommendationsByType(recommendations, "services", 6).map((rec) => (
                        <RecommendationCard
                          key={rec.id}
                          listing={rec}
                          recommendationReason={rec.recommendationReason}
                          recommendationScore={rec.recommendationScore}
                          isFavorite={rec.isFavorite}
                          onToggleFavorite={(listingId) => {
                            toggleFavorite(listingId, userData.id, setListings, false);
                            // Update recommendations state to reflect favorite change
                            setRecommendations((prev) =>
                              prev.map((item) =>
                                item.id === listingId
                                  ? { ...item, isFavorite: !item.isFavorite }
                                  : item
                              )
                            );
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
      {selectedListing && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-slate-800/90 backdrop-blur-lg border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-slate-700 p-2 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedListing.photos?.[0] || null}
              alt={selectedListing.title}
              className="w-full h-48 object-cover rounded-xl mb-4 border border-slate-700"
            />
            <h2 className="text-2xl font-bold text-white">
              {selectedListing.title}
            </h2>
            <div className="flex items-center text-slate-300 mt-2">
              <MapPin className="w-4 h-4 mr-1.5 text-indigo-400" />
              {selectedListing.location}
            </div>
            <p className="text-2xl font-bold text-white mt-3">
              ₱{selectedListing.price}
            </p>
            <div className="flex items-center text-slate-400 text-sm mt-2">
              <Users className="w-4 h-4 mr-1.5 text-amber-400" />
              Max Guests: {selectedListing.numberOfGuests || 1}
            </div>
            <div className="text-slate-400 text-sm mt-2">
              <div className="flex items-center mb-2">
                <Calendar className="w-4 h-4 mr-1.5 text-emerald-400" />
                <span className="font-medium">Available Dates</span>
              </div>
              {(() => {
                const dates = formatAvailability(selectedListing);
                return dates.length > 0 ? (
                  <div className="space-y-1 ml-5">
                    {dates.map((date, idx) => (
                      <div key={idx} className="text-slate-300 text-xs">
                        • {date}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs ml-5">
                    No availability
                  </div>
                );
              })()}
            </div>
            <div className="flex flex-col gap-4 mt-6">
              <div>
                <label className="text-sm text-slate-300 font-medium block mb-2">
                  Check-in Date
                </label>
                <input
                  type="date"
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 font-medium block mb-2">
                  Check-out Date
                </label>
                <input
                  type="date"
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
            <button className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40">
              Confirm Booking
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
