import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import "leaflet/dist/leaflet.css";

// Fix leaflet marker icons for React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Component to handle map centering
function MapCenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 15);
    }
  }, [lat, lng, map]);
  return null;
}

export default function ServiceLocationMap({ location, serviceTitle }) {
  const [coordinates, setCoordinates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const geocodeLocation = async () => {
      if (!location) {
        setError("No location provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Use Nominatim API to geocode the address
        const response = await axios.get(
          "https://nominatim.openstreetmap.org/search",
          {
            params: {
              q: location,
              format: "json",
              limit: 1,
            },
            headers: {
              "User-Agent": "BookingNest-ServiceLocator",
            },
          }
        );

        if (response.data && response.data.length > 0) {
          const result = response.data[0];
          setCoordinates({
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
          });
          setError(null);
        } else {
          setError("Location not found. Please check the address.");
          setCoordinates(null);
        }
      } catch (err) {
        console.error("Geocoding error:", err);
        setError(
          "Unable to load map. Please check your internet connection."
        );
        setCoordinates(null);
      } finally {
        setLoading(false);
      }
    };

    geocodeLocation();
  }, [location]);

  if (loading) {
    return (
      <div className="w-full h-96 bg-slate-700 rounded-2xl flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mb-3"></div>
          <p className="text-slate-300">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error || !coordinates) {
    return (
      <div className="w-full h-96 bg-slate-700 rounded-2xl flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-300 text-sm">{error || "Unable to load map"}</p>
          <p className="text-slate-400 text-xs mt-2">Location: {location}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-slate-700 shadow-lg">
      <MapContainer
        center={[coordinates.lat, coordinates.lng]}
        zoom={15}
        style={{ height: "400px", width: "100%" }}
        className="z-10"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={[coordinates.lat, coordinates.lng]}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold text-slate-900">{serviceTitle}</p>
              <p className="text-slate-600">{location}</p>
              <p className="text-xs text-slate-500 mt-1">
                {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
              </p>
            </div>
          </Popup>
        </Marker>
        <MapCenter lat={coordinates.lat} lng={coordinates.lng} />
      </MapContainer>
    </div>
  );
}
