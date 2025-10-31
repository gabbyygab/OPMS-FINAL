import { Heart, MapPin, Star, Zap } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RecommendationCard({
  listing,
  recommendationReason,
  recommendationScore,
  isFavorite,
  onToggleFavorite,
}) {
  const navigate = useNavigate();
  const [hovering, setHovering] = useState(false);

  const handleViewListing = () => {
    navigate(`/guest/listing/${listing.id}`);
  };

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(listing.id, listing.isFavorite);
    }
  };

  // Calculate match percentage (0-100)
  const matchPercentage = Math.round(recommendationScore || 0);

  return (
    <div
      className="group bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-indigo-500/50 transition-all duration-300 cursor-pointer"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={handleViewListing}
    >
      {/* Image Container */}
      <div className="relative h-48 overflow-hidden bg-slate-900">
        <img
          src={listing.photos?.[0] || "https://via.placeholder.com/400x300"}
          alt={listing.title}
          className={`w-full h-full object-cover transition-transform duration-300 ${
            hovering ? "scale-110" : "scale-100"
          }`}
        />

        {/* Match Badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-full text-white text-xs font-bold shadow-lg">
          <Zap className="w-3 h-3" />
          {matchPercentage}% Match
        </div>

        {/* Favorite Button */}
        <button
          onClick={handleToggleFavorite}
          className="absolute top-3 left-3 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors duration-200 backdrop-blur-sm"
        >
          <Heart
            className={`w-4 h-4 ${
              isFavorite ? "fill-red-500 text-red-500" : "text-white"
            }`}
          />
        </button>

        {/* Overlay on Hover */}
        {hovering && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="text-white font-semibold text-sm">View Details</div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Recommendation Reason - AI Tag Style */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-1.5 rounded-lg w-fit mb-2 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Recommended for you
            </p>
            <p className="text-xs text-slate-300 italic">
              {recommendationReason || "Similar to your booking"}
            </p>
          </div>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-sm font-semibold text-white line-clamp-2 hover:text-indigo-400 transition">
            {listing.title}
          </h3>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 text-xs">
          {listing.rating && listing.rating > 0 ? (
            <>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-white">{listing.rating}</span>
              </div>
              <span className="text-slate-500">({listing.reviewCount || 0})</span>
            </>
          ) : (
            <span className="text-slate-500">New listing</span>
          )}
        </div>

        {/* Location */}
        <div className="flex items-start gap-1 text-xs text-slate-400">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-indigo-400" />
          <span className="line-clamp-1">{listing.location}</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1 pt-2 border-t border-slate-700">
          <span className="text-lg font-bold text-indigo-400">
            ₱{listing.price?.toLocaleString() || "0"}
          </span>
          <span className="text-xs text-slate-400">
            /{listing.type === "stays" ? "night" : listing.type === "experiences" ? "person" : "hour"}
          </span>
        </div>

        {/* Button */}
        <button
          onClick={handleViewListing}
          className="w-full mt-3 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition-colors duration-200"
        >
          View Details
        </button>
      </div>
    </div>
  );
}
