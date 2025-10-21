import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

import { MapPin, Star, Heart, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
export default function FavoritesSection({ userData }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!userData || !userData.id) return;

      try {
        // 1️⃣ Get only favorites belonging to the current user
        const favRef = collection(db, "favorites");
        const q = query(favRef, where("guest_id", "==", userData.id));
        const favSnap = await getDocs(q);

        if (favSnap.empty) {
          setFavorites([]);
          setLoading(false);
          return;
        }

        // 2️⃣ For each favorite, get the corresponding listing data
        const favoriteListings = await Promise.all(
          favSnap.docs.map(async (favDoc) => {
            const favData = favDoc.data();
            const listingRef = doc(db, "listings", favData.listing_id);
            const listingSnap = await getDoc(listingRef);

            if (listingSnap.exists()) {
              return {
                id: listingSnap.id,
                ...listingSnap.data(),
                favoriteDocId: favDoc.id, // optional: store favorite doc reference
              };
            }
            return null;
          })
        );

        // 3️⃣ Filter out nulls (in case a listing was deleted)
        setFavorites(favoriteListings.filter((item) => item !== null));
      } catch (error) {
        console.error("Error loading favorites:", error);
      } finally {
        setLoading(false);
      }
    };
    const favRef = collection(db, "favorites");
    const q = query(favRef, where("guest_id", "==", userData.id));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const favs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFavorites(favs);
    });
    fetchFavorites();
    return () => unsubscribe();
  }, [userData]);

  const filteredItems =
    activeFilter === "all"
      ? favorites
      : favorites.filter((item) => item.type === activeFilter);

  const removeFavorite = async (listingId, guestId, setFavorites) => {
    try {
      // Find matching favorite(s)
      const favRef = collection(db, "favorites");
      const q = query(
        favRef,
        where("listing_id", "==", listingId),
        where("guest_id", "==", guestId)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        // Delete all matching favorites (usually one)
        const deletes = snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref));
        await Promise.all(deletes);

        setFavorites((prev) =>
          prev.filter((item) => item.listingId !== listingId)
        );

        toast.success("Listing successfully removed from favorites.", {
          position: "top-right",
        });
      } else {
        console.warn("No matching favorite found for this listing.");
      }
    } catch (err) {
      console.error("Error removing favorite:", err);
      toast.error("Failed to remove favorite.", { position: "top-right" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-600">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-2" />
        <p>Loading your favorites...</p>
      </div>
    );
  }
  filteredItems.forEach((item) => {
    console.log(item.id); // logs the first photo of each listing
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32 pb-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            My Favorites
          </h1>
          <p className="text-slate-600">
            {filteredItems.length}{" "}
            {filteredItems.length === 1 ? "item" : "items"} saved
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-3 mb-8">
          {["all", "stays", "services", "experiences"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                activeFilter === filter
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>

        {/* Favorites Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              No favorites yet
            </h3>
            <p className="text-slate-600">
              Start exploring and save your favorite places!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative">
                  {item.photos && item.photos.length > 0 ? (
                    <img
                      src={item.photos[0]}
                      alt={item.title || "Listing"}
                      className="w-full h-60 object-cover"
                    />
                  ) : (
                    <div className="w-full h-60 bg-slate-200 flex items-center justify-center text-slate-500">
                      No Image
                    </div>
                  )}
                  <button
                    onClick={() =>
                      removeFavorite(item.id, userData.id, setFavorites)
                    }
                    className="absolute top-3 right-3 bg-white/80 p-2 rounded-full hover:bg-white transition"
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        item ? "fill-red-500 text-red-500" : "text-slate-700"
                      }`}
                    />
                  </button>
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-semibold text-slate-900 truncate">
                    {item.title || "Untitled Listing"}
                  </h3>
                  <div className="flex items-center text-slate-600 text-sm mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {item.location || "Unknown Location"}
                  </div>

                  {/* Max guests */}
                  <div className="text-slate-500 text-sm mt-1">
                    Max Guests: {item.numberOfGuests || 1}
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <span className="text-slate-900 font-medium">
                      ₱{item.price || "0"} / night
                    </span>
                    <div className="flex items-center text-yellow-500 text-sm">
                      <Star className="w-4 h-4 mr-1" />
                      {item.rating || "New"}
                    </div>
                  </div>
                  <button
                    // onClick={() => setSelectedListing(listing)}
                    className="w-full mt-4 bg-slate-900 text-white py-2 rounded-xl font-medium hover:bg-slate-800 transition"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
