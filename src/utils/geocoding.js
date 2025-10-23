/**
 * Reverse geocoding utility to convert location names to coordinates
 * Uses OpenStreetMap's Nominatim API
 */

const NOMINATIM_API = "https://nominatim.openstreetmap.org/search";

/**
 * Convert location string to latitude and longitude
 * @param {string} location - Location name (e.g., "Tagaytay, Cavite, Philippines")
 * @returns {Promise<{lat: number, lng: number} | null>} - Coordinates or null if not found
 */
export const getCoordinatesFromLocation = async (location) => {
  if (!location) return null;

  try {
    const response = await fetch(
      `${NOMINATIM_API}?format=json&q=${encodeURIComponent(location)}&limit=1`
    );

    if (!response.ok) {
      console.error("Geocoding API error:", response.statusText);
      return null;
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
      };
    }

    console.warn(`No coordinates found for location: ${location}`);
    return null;
  } catch (error) {
    console.error("Error fetching coordinates:", error);
    return null;
  }
};

/**
 * Get coordinates with fallback to default location
 * @param {string} location - Location name
 * @param {object} defaultCoordinates - Default coordinates if lookup fails
 * @returns {Promise<{lat: number, lng: number}>} - Coordinates
 */
export const getCoordinatesWithFallback = async (
  location,
  defaultCoordinates = { lat: 14.3595, lng: 121.0857 } // Manila, Philippines default
) => {
  const coordinates = await getCoordinatesFromLocation(location);
  return coordinates || defaultCoordinates;
};
