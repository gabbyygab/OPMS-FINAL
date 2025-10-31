import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

/**
 * Fetch guest's previous confirmed/completed bookings
 * @param {string} userId - Guest user ID
 * @returns {Promise<Array>} Array of booking objects with listing details
 */
export async function getGuestPreviousBookings(userId) {
  try {
    const bookingsRef = collection(db, "bookings");
    const q = query(
      bookingsRef,
      where("guest_id", "==", userId),
      where("status", "==", "confirmed") // Only confirmed bookings
    );

    const querySnapshot = await getDocs(q);
    const bookings = [];

    for (const bookingDoc of querySnapshot.docs) {
      const booking = { id: bookingDoc.id, ...bookingDoc.data() };

      // Fetch listing details
      if (booking.listing_id) {
        try {
          const listingRef = doc(db, "listings", booking.listing_id);
          const listingSnap = await getDoc(listingRef);
          if (listingSnap.exists()) {
            booking.listing = listingSnap.data();
          }
        } catch (error) {
          console.error("Error fetching listing for booking:", error);
        }
      }

      bookings.push(booking);
    }

    return bookings;
  } catch (error) {
    console.error("Error fetching guest bookings:", error);
    return [];
  }
}

/**
 * Extract key property features from a booking
 * @param {Object} booking - Booking object with listing data
 * @returns {Object} Object with extracted features
 */
export function extractPropertyFeatures(booking) {
  if (!booking || !booking.listing) return null;

  const listing = booking.listing;

  // Extract city from location string (format: "Street, City, Province, Country")
  const extractCity = (location) => {
    if (!location) return "";
    const parts = location.split(",").map((part) => part.trim());
    if (parts.length >= 2) {
      return parts[parts.length - 2]; // Second-to-last part (usually city/province)
    }
    return parts[0];
  };

  return {
    type: listing.type || "stays",
    bedrooms: listing.bedrooms || 0,
    bathrooms: listing.bathrooms || 0,
    price: listing.price || 0,
    location: listing.location || "",
    city: extractCity(listing.location),
    coordinates: listing.coordinates || null,
    numberOfGuests: listing.numberOfGuests || 0,
  };
}

/**
 * Calculate similarity score between two listings
 * Score factors:
 * - Bedrooms/Bathrooms match: 40 points
 * - Same city: 30 points
 * - Similar price range: 20 points
 * - Location proximity (if coordinates): 10 points
 *
 * @param {Object} guestFeature - Features from guest's previous booking
 * @param {Object} candidateListing - Listing to check
 * @returns {number} Similarity score (0-100)
 */
export function calculateSimilarityScore(guestFeature, candidateListing) {
  if (!guestFeature || !candidateListing) return 0;

  let score = 0;

  // 1. Bedrooms/Bathrooms match (40 points max)
  if (guestFeature.type === "stays") {
    const bedroomMatch = guestFeature.bedrooms === candidateListing.bedrooms ? 20 : 0;
    const bathroomMatch = guestFeature.bathrooms === candidateListing.bathrooms ? 20 : 0;
    score += bedroomMatch + bathroomMatch;
  }

  // 2. Same city (30 points)
  const extractCity = (location) => {
    if (!location) return "";
    const parts = location.split(",").map((part) => part.trim());
    if (parts.length >= 2) {
      return parts[parts.length - 2];
    }
    return parts[0];
  };

  const guestCity = extractCity(guestFeature.location);
  const candidateCity = extractCity(candidateListing.location);

  if (guestCity && candidateCity && guestCity.toLowerCase() === candidateCity.toLowerCase()) {
    score += 30;
  } else if (guestCity && candidateCity) {
    // Partial city match (within 15 points)
    const similarity = guestCity.toLowerCase().includes(candidateCity.toLowerCase()) ||
                       candidateCity.toLowerCase().includes(guestCity.toLowerCase());
    if (similarity) score += 15;
  }

  // 3. Similar price range (20 points)
  // Price within ±30% is considered similar
  const priceRatio = candidateListing.price / guestFeature.price;
  if (priceRatio >= 0.7 && priceRatio <= 1.3) {
    score += 20;
  } else if (priceRatio >= 0.5 && priceRatio <= 1.5) {
    // Wider range gets half points
    score += 10;
  }

  // 4. Location proximity (10 points max)
  // If both have coordinates, calculate distance
  if (guestFeature.coordinates && candidateListing.coordinates) {
    try {
      const distance = calculateDistanceKm(
        guestFeature.coordinates,
        candidateListing.coordinates
      );
      // Within 50km = 10 points
      // Within 100km = 5 points
      if (distance <= 50) {
        score += 10;
      } else if (distance <= 100) {
        score += 5;
      }
    } catch (error) {
      console.error("Error calculating distance:", error);
    }
  }

  return Math.min(score, 100); // Cap at 100
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Object} coord1 - {lat, lng}
 * @param {Object} coord2 - {lat, lng}
 * @returns {number} Distance in kilometers
 */
function calculateDistanceKm(coord1, coord2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get recommended listings for a guest based on their booking history
 * @param {string} userId - Guest user ID
 * @param {Array} allListings - All available listings
 * @returns {Promise<Array>} Recommended listings with scores
 */
export async function getRecommendedListings(userId, allListings = []) {
  try {
    // Fetch guest's previous bookings
    const previousBookings = await getGuestPreviousBookings(userId);

    if (previousBookings.length === 0) {
      return []; // No booking history, no recommendations
    }

    // Extract features from all previous bookings
    const guestFeatures = previousBookings
      .map((booking) => extractPropertyFeatures(booking))
      .filter((feature) => feature !== null);

    if (guestFeatures.length === 0) {
      return [];
    }

    // Calculate recommendations
    const recommendationsMap = new Map(); // listing.id -> { listing, scores: [], maxScore }

    for (const feature of guestFeatures) {
      for (const listing of allListings) {
        // Skip if same type as previous booking
        if (feature.type !== listing.type) continue;

        const score = calculateSimilarityScore(feature, listing);

        if (score > 0) {
          if (!recommendationsMap.has(listing.id)) {
            recommendationsMap.set(listing.id, {
              listing,
              scores: [],
              basedOnFeature: feature,
            });
          }
          const rec = recommendationsMap.get(listing.id);
          rec.scores.push(score);
          // Update if this is a better match
          if (score > (rec.maxScore || 0)) {
            rec.maxScore = score;
            rec.basedOnFeature = feature;
          }
        }
      }
    }

    // Convert map to array and calculate average score
    const recommendations = Array.from(recommendationsMap.values()).map((rec) => ({
      ...rec.listing,
      recommendationScore: rec.maxScore || 0,
      recommendationReason: generateRecommendationReason(rec.basedOnFeature, rec.listing),
    }));

    // Sort by score descending
    recommendations.sort((a, b) => b.recommendationScore - a.recommendationScore);

    return recommendations;
  } catch (error) {
    console.error("Error getting recommendations:", error);
    return [];
  }
}

/**
 * Generate a user-friendly reason for the recommendation
 * @param {Object} guestFeature - Guest's previous booking features
 * @param {Object} listing - Recommended listing
 * @returns {string} Reason text
 */
function generateRecommendationReason(guestFeature, listing) {
  const reasons = [];

  if (guestFeature.bedrooms === listing.bedrooms && guestFeature.bedrooms > 0) {
    reasons.push(`${guestFeature.bedrooms} bedroom${guestFeature.bedrooms > 1 ? "s" : ""}`);
  }

  if (guestFeature.bathrooms === listing.bathrooms && guestFeature.bathrooms > 0) {
    reasons.push(`${guestFeature.bathrooms} bathroom${guestFeature.bathrooms > 1 ? "s" : ""}`);
  }

  const extractCity = (location) => {
    if (!location) return "";
    const parts = location.split(",").map((part) => part.trim());
    if (parts.length >= 2) {
      return parts[parts.length - 2];
    }
    return parts[0];
  };

  const guestCity = extractCity(guestFeature.location);
  const listingCity = extractCity(listing.location);

  if (guestCity && listingCity && guestCity.toLowerCase() === listingCity.toLowerCase()) {
    reasons.push(`in ${listingCity}`);
  }

  if (reasons.length === 0) {
    return `Similar to your previous ${guestFeature.type}`;
  }

  return `Based on your ${reasons.join(", ")} booking`;
}

/**
 * Filter recommendations by type and get top N
 * @param {Array} recommendations - All recommendations
 * @param {string} type - Listing type ("stays", "experiences", "services")
 * @param {number} limit - Maximum number to return
 * @returns {Array} Filtered and limited recommendations
 */
export function getRecommendationsByType(recommendations, type, limit = 6) {
  return recommendations
    .filter((rec) => rec.type === type)
    .slice(0, limit);
}
