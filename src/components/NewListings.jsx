import { useEffect, useState, useRef } from "react";
import { Star, MapPin } from "lucide-react";
import { db } from "../firebase/firebase";
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from "firebase/firestore";

export default function NewListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const sectionRef = useRef(null);

  useEffect(() => {
    const fetchNewListings = async () => {
      try {
        setLoading(true);
        const listingsCollection = collection(db, "listings");
        const q = query(
          listingsCollection,
          orderBy("createdAt", "desc"),
          limit(6)
        );

        const snapshot = await getDocs(q);

        // Filter out listings from deactivated hosts and inactive listings
        const fetchedListings = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const listing = {
              id: docSnap.id,
              ...docSnap.data(),
            };

            // Skip listing if its status is inactive
            if (listing.status === "inactive") {
              return null;
            }

            // Check if the host is deactivated
            const hostId = listing.hostId;
            if (hostId) {
              try {
                const hostRef = doc(db, "users", hostId);
                const hostSnap = await getDoc(hostRef);

                // Skip listing if host is deactivated or doesn't exist
                if (!hostSnap.exists() || hostSnap.data().status === "deactivated") {
                  return null;
                }
              } catch (error) {
                console.error("Error checking host status:", error);
                return null;
              }
            }

            return listing;
          })
        );

        setListings(fetchedListings.filter((listing) => listing !== null));
      } catch (error) {
        console.error("Error fetching new listings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNewListings();
  }, []);

  // Track mouse position for interactive background
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  if (loading) {
    return (
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className="text-slate-300">Loading new listings...</p>
          </div>
        </div>
      </section>
    );
  }

  if (listings.length === 0) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      className="relative py-20 px-4 bg-gradient-to-b from-transparent via-slate-900/50 to-transparent overflow-hidden"
    >
      {/* Interactive mouse cursor glow */}
      <div
        className="pointer-events-none fixed w-96 h-96 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl opacity-40 transition-opacity duration-300"
        style={{
          left: `${mousePosition.x - 192}px`,
          top: `${mousePosition.y - 192}px`,
        }}
      ></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
              Recently Added Listings
            </span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-200">
            Explore newly listed properties on BookingNest
          </p>
        </div>

        {/* Grid of New Listings */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="group relative rounded-2xl overflow-hidden shadow-lg transition-all duration-300 cursor-pointer"
            >
              {/* Gradient border glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-600 opacity-0 group-hover:opacity-30 rounded-2xl transition-opacity duration-500 blur-xl pointer-events-none -z-10"></div>

              <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 group-hover:shadow-2xl h-full">
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

                {/* Badge */}
                <div className="absolute top-4 left-4 bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  New
                </div>

                {/* Type Badge */}
                <div className="absolute top-4 right-4 bg-slate-900/80 text-slate-300 px-3 py-1 rounded-full text-xs font-semibold capitalize">
                  {listing.type || "listing"}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2 line-clamp-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200 group-hover:from-cyan-300 group-hover:to-blue-300 transition-all duration-300">
                  {listing.title}
                </h3>

                {/* Location */}
                <div className="flex items-start gap-2 mb-4">
                  <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <p className="text-slate-300 text-sm line-clamp-2 group-hover:text-white/90 transition-colors duration-300">
                    {listing.location}
                  </p>
                </div>

                {/* Description */}
                <p className="text-slate-400 text-sm mb-4 line-clamp-2 group-hover:text-slate-300 transition-colors duration-300">
                  {listing.description}
                </p>

                {/* Rating and Price Container */}
                <div className="flex items-center justify-between">
                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < Math.round(listing.rating || 0)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-slate-600"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-slate-300 text-xs">
                      ({listing.reviewCount || 0})
                    </span>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                      ₱{listing.price}
                    </span>
                    <span className="text-slate-400 text-xs block">/night</span>
                  </div>
                </div>

                {/* Amenities Preview */}
                {listing.amenities && listing.amenities.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-700 flex flex-wrap gap-2">
                    {listing.amenities.slice(0, 3).map((amenity, index) => (
                      <span
                        key={index}
                        className="text-xs bg-slate-700/50 text-slate-300 px-2 py-1 rounded"
                      >
                        {amenity}
                      </span>
                    ))}
                    {listing.amenities.length > 3 && (
                      <span className="text-xs text-slate-400">
                        +{listing.amenities.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
