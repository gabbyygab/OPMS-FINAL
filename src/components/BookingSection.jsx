import { useEffect, useState } from "react";
import { MapPin, Star, Heart, X, Calendar, Users } from "lucide-react";
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
import { point } from "leaflet";
// Extract city from location string
function extractCity(location) {
  if (!location) return "Other";

  // Split by comma and get the last or second-to-last part (city is usually before state/province)
  const parts = location.split(",").map((part) => part.trim());

  // Return the part before the last (which is usually the city)
  // If only one part, return it
  if (parts.length > 1) {
    return parts[parts.length - 2] || parts[0];
  }
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
export default function BookingsSection({ userData, isFavoritePage }) {
  const [listings, setListings] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedListing, setSelectedListing] = useState(null); // for modal
  const [searchParams] = useSearchParams();

  //favorites

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
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
  };

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
                return {
                  id: listingSnap.id,
                  ...listingSnap.data(),
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
      const fetchListingsWithFavorites = async () => {
        try {
          setLoading(true);
          // 1️⃣ Fetch all listings
          const listingRef = collection(db, "listings");
          const listingQuery = query(listingRef, where("isDraft", "==", false));
          const listingsSnap = await getDocs(listingQuery);
          const listingsData = listingsSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // 2️⃣ Fetch all favorites of the current user
          const favRef = collection(db, "favorites");
          const favQuery = query(favRef, where("guest_id", "==", userData.id));
          const favSnap = await getDocs(favQuery);

          // Get all favorited listing IDs for this user
          const favoriteIds = favSnap.docs.map((doc) => doc.data().listing_id);

          // 3️⃣ Combine listings + favorite status
          const listingsWithFavs = listingsData.map((listing) => ({
            ...listing,
            isFavorite: favoriteIds.includes(listing.id),
          }));

          setListings(listingsWithFavs);
        } catch (error) {
          console.error("Error fetching listings or favorites:", error);
        } finally {
          setLoading(false);
        }
      };

      if (userData?.id) {
        fetchListingsWithFavorites();
      }
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

    // Check availability dates
    if (searchFilters.checkIn || searchFilters.checkOut) {
      const listingAvail = listing.availableDate || {};
      const fromDate = parseToDate(listingAvail.from);
      const toDate = parseToDate(listingAvail.to);

      if (
        searchFilters.checkIn &&
        fromDate &&
        new Date(searchFilters.checkIn) < fromDate
      ) {
        return false;
      }

      if (
        searchFilters.checkOut &&
        toDate &&
        new Date(searchFilters.checkOut) > toDate
      ) {
        return false;
      }
    }

    return true;
  };

  const filteredFavoriteItems =
    activeFilter === "all"
      ? favorites.filter(matchesSearchFilters)
      : favorites.filter(
          (item) => item.type === activeFilter && matchesSearchFilters(item)
        );

  const filteredItems =
    activeFilter === "all"
      ? listings.filter(matchesSearchFilters)
      : listings.filter(
          (item) => item.type === activeFilter && matchesSearchFilters(item)
        );

  const toggleFavorite = async (listingId, guestId, setListings) => {
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

      if (snapshot.empty) {
        await addDoc(favRef, {
          guest_id: guestId,
          listing_id: listingId,
          createdAt: new Date(),
        });
        console.log("✅ Added to favorites");
        toast.success("Added to favorites.", { position: "top-right" });
        setListings((prev) =>
          prev.map((listing) =>
            listing.id === listingId
              ? { ...listing, isFavorite: true }
              : listing
          )
        );
      } else {
        const batch = snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref));
        await Promise.all(batch);
        toast.success("Removed from favorites.", { position: "top-right" });
        setListings((prev) =>
          prev.map((listing) =>
            listing.id === listingId
              ? { ...listing, isFavorite: false }
              : listing
          )
        );
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };
  //pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // ✅ Decide which list to paginate based on the page type
  const activeList = isFavoritePage ? filteredFavoriteItems : filteredItems;

  const totalPages = Math.ceil(activeList.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentListings = activeList.slice(indexOfFirst, indexOfLast);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 bg-[url('/guestBg.png')] bg-cover bg-center opacity-5"></div>
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32 pb-8">
        {!isVerified && (
          <VerificationBanner
            handleVerification={handleVerification}
            userData={userData}
          />
        )}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isFavoritePage
              ? "My Favorites"
              : "Explore Stays, Services & Experiences"}
          </h1>
          <p className="text-slate-300">
            {!isFavoritePage
              ? "Browse all available listings from hosts and providers"
              : ""}
          </p>
        </div>
        <div className="flex gap-3 mb-8 flex-wrap">
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
        </div>

        {/* Active Filters Display */}
        {(searchFilters.location ||
          searchFilters.checkIn ||
          searchFilters.checkOut ||
          searchFilters.guests > 1) && (
          <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                {searchFilters.location && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600/20 border border-indigo-500/50 rounded-full text-sm text-indigo-300">
                    <MapPin className="w-3 h-3" />
                    {searchFilters.location}
                  </span>
                )}
                {searchFilters.checkIn && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600/20 border border-emerald-500/50 rounded-full text-sm text-emerald-300">
                    <Calendar className="w-3 h-3" />
                    Check-in:{" "}
                    {new Date(searchFilters.checkIn).toLocaleDateString()}
                  </span>
                )}
                {searchFilters.checkOut && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600/20 border border-blue-500/50 rounded-full text-sm text-blue-300">
                    <Calendar className="w-3 h-3" />
                    Check-out:{" "}
                    {new Date(searchFilters.checkOut).toLocaleDateString()}
                  </span>
                )}
                {searchFilters.guests > 1 && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-600/20 border border-amber-500/50 rounded-full text-sm text-amber-300">
                    <Users className="w-3 h-3" />
                    {searchFilters.guests} guests
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

        {/* Group listings by city */}
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
              <p className="text-white text-lg font-semibold">Loading Listings</p>
              <p className="text-slate-400 text-sm mt-1">Please wait...</p>
            </div>
          </div>
        ) : currentListings.length > 0 ? (
          Object.entries(groupListingsByCity(currentListings)).map(
            ([city, cityListings]) => (
              <div key={city} className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <MapPin className="w-6 h-6 text-indigo-400" />
                  <h2 className="text-2xl font-bold text-white">{city}</h2>
                  <span className="ml-auto text-sm text-slate-400">
                    {cityListings.length}{" "}
                    {cityListings.length === 1 ? "listing" : "listings"}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cityListings.map((listing) => {
                    const raw = listing.availableDate || {};
                    const fromDate = parseToDate(raw.from);
                    const toDate = parseToDate(raw.to);
                    const availabilityText = formatRange(fromDate, toDate);

                    return (
                      <div
                        key={listing.id}
                        className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-700 overflow-hidden hover:shadow-xl hover:shadow-indigo-500/10 hover:border-slate-600 transition-all duration-300 flex flex-col h-full group"
                      >
                        <div className="relative overflow-hidden">
                          {listing.photos && listing.photos.length > 0 ? (
                            <img
                              src={listing.photos[0]}
                              alt={listing.title || "Listing"}
                              className="w-full h-60 object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-60 bg-slate-900 flex items-center justify-center text-slate-500">
                              No Image
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <button
                            onClick={() =>
                              toggleFavorite(
                                listing.id,
                                userData.id,
                                setListings
                              )
                            }
                            className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-sm p-2.5 rounded-full hover:bg-slate-900 transition-all hover:scale-110"
                          >
                            <Heart
                              className={`w-5 h-5 transition-all ${
                                listing.isFavorite
                                  ? "fill-red-500 text-red-500"
                                  : "text-slate-300 hover:text-red-400"
                              }`}
                            />
                          </button>
                        </div>

                        <div className="p-5 flex flex-col h-full">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-white truncate mb-2">
                              {listing.title || "Untitled Listing"}
                            </h3>
                            <div className="flex items-center text-slate-300 text-sm mt-2">
                              <MapPin className="w-4 h-4 mr-1.5 text-indigo-400" />
                              {listing.location || "Unknown Location"}
                            </div>
                            <div className="flex items-center text-slate-400 text-sm mt-2">
                              <Calendar className="w-4 h-4 mr-1.5 text-emerald-400" />
                              {availabilityText}
                            </div>
                            <div className="flex items-center text-slate-400 text-sm mt-2">
                              <Users className="w-4 h-4 mr-1.5 text-amber-400" />
                              Max Guests: {listing.numberOfGuests || 1}
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-slate-700">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <span className="text-xs text-slate-400 block">
                                  Starting at
                                </span>
                                <span className="text-2xl font-bold text-white">
                                  ₱{(parseFloat(listing.price) || 0).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex items-center bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                                <Star className="w-4 h-4 mr-1 fill-amber-400 text-amber-400" />
                                <span className="text-amber-400 font-semibold text-sm">
                                  {listing.rating || "New"}
                                </span>
                              </div>
                            </div>

                            <button
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
                              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40"
                            >
                              Book Now
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )
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
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 hover:border-slate-600 transition-all font-medium"
            >
              Next
            </button>
          </div>
        )}
      </main>
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
            {selectedListing.availableDate && (
              <div className="flex items-center text-slate-400 text-sm mt-2">
                <Calendar className="w-4 h-4 mr-1.5 text-emerald-400" />
                Available:{" "}
                <span className="font-medium text-slate-300 ml-1">
                  {formatRange(
                    parseToDate(selectedListing.availableDate.from),
                    parseToDate(selectedListing.availableDate.to)
                  )}
                </span>
              </div>
            )}
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
