import { useEffect, useState } from "react";
import { Star, MapPin } from "lucide-react";
import { db } from "../firebase/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

export default function NewListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

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
        const fetchedListings = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setListings(fetchedListings);
      } catch (error) {
        console.error("Error fetching new listings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNewListings();
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
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Recently Added Listings
          </h2>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Explore newly listed properties on BookingNest
          </p>
        </div>

        {/* Grid of New Listings */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="bg-slate-800 rounded-2xl overflow-hidden shadow-lg border border-slate-700 hover:shadow-2xl hover:border-indigo-600 transition-all duration-300 group cursor-pointer"
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
                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                  {listing.title}
                </h3>

                {/* Location */}
                <div className="flex items-start gap-2 mb-4">
                  <MapPin className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <p className="text-slate-400 text-sm line-clamp-2">
                    {listing.location}
                  </p>
                </div>

                {/* Description */}
                <p className="text-slate-300 text-sm mb-4 line-clamp-2">
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
                    <span className="text-lg font-bold text-indigo-400">
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
          ))}
        </div>
      </div>
    </section>
  );
}
