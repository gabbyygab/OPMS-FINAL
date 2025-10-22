import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
} from "firebase/firestore";

export default function PopularListings() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [itemsPerPage, setItemsPerPage] = useState(3);

  useEffect(() => {
    const fetchPopularListings = async () => {
      try {
        setLoading(true);
        // Fetch all bookings
        const bookingsCollection = collection(db, "bookings");
        const bookingsSnapshot = await getDocs(bookingsCollection);

        // Count bookings per listing
        const bookingCounts = {};
        const uniqueListingIds = new Set();

        bookingsSnapshot.forEach((doc) => {
          const booking = doc.data();
          const listingId = booking.listing_id;
          bookingCounts[listingId] = (bookingCounts[listingId] || 0) + 1;
          uniqueListingIds.add(listingId);
        });

        // Get minimum threshold (at least 2 bookings to be considered popular)
        const minBookings = Math.max(2, Math.min(...Array.from(uniqueListingIds).map(id => bookingCounts[id])));

        // Sort listing IDs by booking count (highest first) and filter by minimum threshold
        const sortedListingIds = Array.from(uniqueListingIds)
          .filter(id => bookingCounts[id] >= minBookings)
          .sort((a, b) => bookingCounts[b] - bookingCounts[a]);

        // Fetch listing details for top unique listings
        const fetchedListings = [];
        const seenIds = new Set();

        for (const listingId of sortedListingIds) {
          // Skip if already added (prevent duplicates)
          if (seenIds.has(listingId)) continue;

          try {
            const docRef = doc(db, "listings", listingId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
              const listingData = {
                id: docSnap.id,
                ...docSnap.data(),
                bookingCount: bookingCounts[listingId],
              };

              // Only add if we haven't seen this listing before
              if (!seenIds.has(listingData.id)) {
                fetchedListings.push(listingData);
                seenIds.add(listingData.id);
              }

              // Stop when we have 6 unique listings
              if (fetchedListings.length >= 6) break;
            }
          } catch (error) {
            console.error(`Error fetching listing ${listingId}:`, error);
          }
        }

        setListings(fetchedListings);
      } catch (error) {
        console.error("Error fetching popular listings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularListings();
  }, []);

  // Handle responsive items per page
  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(window.innerWidth < 768 ? 1 : 3);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => {
      const maxIndex = Math.max(listings.length - itemsPerPage, 0);
      return prev >= maxIndex ? 0 : prev + 1;
    });
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => {
      const maxIndex = Math.max(listings.length - itemsPerPage, 0);
      return prev === 0 ? maxIndex : prev - 1;
    });
  };

  const visibleListings = () => {
    const items = [];
    if (listings.length === 0) return items;

    for (let i = 0; i < itemsPerPage; i++) {
      const index = (currentIndex + i) % listings.length;
      if (listings[index]) {
        // Create unique key based on listing ID and position in current view
        items.push({
          ...listings[index],
          _uniqueKey: `${listings[index].id}-position-${i}`,
        });
      }
    }
    return items;
  };

  // Get navigation route based on listing type
  const getNavigationRoute = (listing) => {
    const type = listing.type?.toLowerCase() || "stays";
    let category = "stays";

    if (type === "stays") {
      category = "stays";
    } else if (type === "experience" || type === "experiences") {
      category = "experiences";
    } else if (type === "service" || type === "services") {
      category = "services";
    }

    return `/guest/listing-details/${category}/${listing.id}`;
  };

  const handleCardClick = (listing) => {
    navigate(getNavigationRoute(listing));
  };

  if (loading) {
    return (
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className="text-slate-300">Loading popular listings...</p>
          </div>
        </div>
      </section>
    );
  }

  if (listings.length === 0) {
    return null;
  }

  return (
    <section className="py-20 px-4 bg-slate-800/30">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Most Popular Listings
          </h2>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Discover the most booked properties on BookingNest
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Carousel Items */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {visibleListings().map(
              (listing) =>
                listing && (
                  <div
                    key={listing._uniqueKey}
                    onClick={() => handleCardClick(listing)}
                    className="bg-slate-800 rounded-2xl overflow-hidden shadow-lg border border-slate-700 hover:shadow-2xl hover:border-indigo-500 transition-all duration-300 group cursor-pointer transform hover:scale-105"
                  >
                    {/* Image Container */}
                    <div className="relative h-48 overflow-hidden">
                      {listing.photos && listing.photos[0] ? (
                        <img
                          src={listing.photos[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                          <span className="text-slate-400">No image</span>
                        </div>
                      )}
                      {/* Booking Badge */}
                      <div className="absolute top-4 right-4 bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {listing.bookingCount} bookings
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                        {listing.title}
                      </h3>

                      <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                        {listing.location}
                      </p>

                      {/* Rating */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.round(listing.rating || 0)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-slate-600"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-slate-300 text-sm">
                          ({listing.reviewCount || 0})
                        </span>
                      </div>

                      {/* Price */}
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-indigo-400">
                          ₱{listing.price}
                        </span>
                        <span className="text-slate-400 text-sm">
                          per night
                        </span>
                      </div>
                    </div>
                  </div>
                )
            )}
          </div>

          {/* Navigation Buttons */}
          {listings.length > itemsPerPage && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/3 -translate-x-14 md:-translate-x-20 transform -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full transition-all shadow-lg z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/3 translate-x-14 md:translate-x-20 transform -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full transition-all shadow-lg z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Indicator Dots */}
          {listings.length > itemsPerPage && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({
                length: Math.max(listings.length - itemsPerPage + 1, 0),
              }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentIndex
                      ? "bg-indigo-600 w-8"
                      : "bg-slate-600 hover:bg-slate-500"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
