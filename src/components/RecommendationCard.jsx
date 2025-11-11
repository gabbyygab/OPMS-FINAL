import { Heart, MapPin, Star, Zap } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

export default function RecommendationCard({
  listing,
  recommendationReason,
  recommendationScore,
  isFavorite,
  onToggleFavorite,
}) {
  const navigate = useNavigate();
  const [hovering, setHovering] = useState(false);
  const { isVerified } = useAuth();

  const handleViewListing = () => {
    if (!isVerified) {
      toast.warning("Please verify your account to view listing details!", {
        position: "top-right",
      });
      return;
    }
    navigate(`/guest/listing-details/${listing.type}/${listing.id}`);
  };

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    if (!isVerified) {
      toast.warning("Please verify your account to use favorites!", {
        position: "top-right",
      });
      return;
    }
    if (onToggleFavorite) {
      onToggleFavorite(listing.id);
    }
  };

  // Calculate match percentage (0-100)
  const matchPercentage = Math.round(recommendationScore || 0);

  return (
    <motion.div
      className="group bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-indigo-500/50 transition-all duration-300 cursor-pointer flex flex-col h-full"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={handleViewListing}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        y: -8,
        boxShadow: "0 20px 40px rgba(99, 102, 241, 0.2)",
        transition: { duration: 0.3 }
      }}
      transition={{
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1]
      }}
    >
      {/* Image Container */}
      <div className="relative h-48 overflow-hidden bg-slate-900">
        <motion.img
          src={listing.photos?.[0] || "https://via.placeholder.com/400x300"}
          alt={listing.title}
          className="w-full h-full object-cover"
          animate={{
            scale: hovering ? 1.1 : 1
          }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />

        {/* Match Badge */}
        <motion.div
          className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-full text-white text-xs font-bold shadow-lg"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          whileHover={{ scale: 1.05 }}
        >
          <motion.div
            animate={{ rotate: hovering ? 15 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <Zap className="w-3 h-3" />
          </motion.div>
          {matchPercentage}% Match
        </motion.div>

        {/* Overlay on Hover */}
        {hovering && (
          <motion.div
            className="absolute inset-0 bg-black/30 flex items-center justify-center backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="text-white font-semibold text-sm bg-indigo-600 px-4 py-2 rounded-lg"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              View Details
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Content */}
      <motion.div
        className="p-4 space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        {/* Recommendation Reason - AI Tag Style */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <motion.div
              className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-1.5 rounded-lg w-fit mb-2 flex items-center gap-1"
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
              >
                <Zap className="w-3 h-3" />
              </motion.div>
              Recommended for you
            </motion.div>
            <motion.p
              className="text-xs text-slate-300 italic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {recommendationReason || "Similar to your booking"}
            </motion.p>
          </div>
        </div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-sm font-semibold text-white line-clamp-2 hover:text-indigo-400 transition">
            {listing.title}
          </h3>
        </motion.div>

        {/* Rating */}
        <motion.div
          className="flex items-center gap-2 text-xs"
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
        >
          {listing.rating && listing.rating > 0 ? (
            <>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-white">
                  {listing.rating}
                </span>
              </div>
              <span className="text-slate-500">
                ({listing.reviewCount || 0})
              </span>
            </>
          ) : (
            <span className="text-slate-500">New listing</span>
          )}
        </motion.div>

        {/* Location */}
        <motion.div
          className="flex items-start gap-1 text-xs text-slate-400"
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-indigo-400" />
          <span className="line-clamp-1">{listing.location}</span>
        </motion.div>

        {/* Price */}
        <motion.div
          className="flex items-baseline gap-1 pt-2 border-t border-slate-700"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <span className="text-lg font-bold text-indigo-400">
            ₱{listing.price?.toLocaleString() || "0"}
          </span>
          <span className="text-xs text-slate-400">
            /
            {listing.type === "stays"
              ? "night"
              : listing.type === "experiences"
              ? "person"
              : "hour"}
          </span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
