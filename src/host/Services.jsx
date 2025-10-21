import { useState } from "react";
import {
  Briefcase,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MapPin,
  Users,
  DollarSign,
  Star,
  Clock,
  Search,
  Filter,
  X,
  Save,
  Upload,
  Calendar,
  Award,
  Wrench,
  Home,
  Car,
  Smartphone,
  Laptop,
  Camera,
  Heart,
  GraduationCap,
  Scissors,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  ZoomControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Helper function to extract street, city, and province from Nominatim address
function parseNominatimAddress(addressData) {
  const address = addressData.address || {};
  const components = [];

  // Add street address if available
  if (address.road || address.street) {
    components.push(address.road || address.street);
  } else if (address.house_number) {
    components.push(address.house_number);
  }

  // Add city/municipality
  if (address.city) {
    components.push(address.city);
  } else if (address.town) {
    components.push(address.town);
  } else if (address.municipality) {
    components.push(address.municipality);
  }

  // Add province/state
  if (address.state) {
    components.push(address.state);
  } else if (address.province) {
    components.push(address.province);
  }

  return components.length > 0 ? components.join(", ") : null;
}

// LocationPicker Component

function LocationPicker({ marker, setMarker, setFormData, formData }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      setMarker([lat, lng]);

      try {
        // Reverse geocode using Nominatim with proper headers and delay
        await new Promise((resolve) => setTimeout(resolve, 300)); // Rate limiting

        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
        );
        if (!res.ok) throw new Error("Geocoding failed");

        const data = await res.json();

        // Extract only street, city, and province from the address
        const parsedAddress = parseNominatimAddress(data);
        const placeName = parsedAddress || data.display_name || `${lat}, ${lng}`;

        setFormData({
          ...formData,
          location: placeName,
        });
      } catch (error) {
        console.error("Error fetching location:", error);
        setFormData({
          ...formData,
          location: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        });
      }
    },
  });

  return marker ? <Marker position={marker}></Marker> : null;
}

const defaultCenter = [14.5995, 120.9842];

export default function HostMyServices() {
  const { isVerified } = useAuth();

  const handleActionWithVerification = (action) => {
    if (!isVerified) {
      toast.warning("Please verify your account first", {
        position: "top-center",
      });
      return;
    }
    action();
  };

  const [services, setServices] = useState([
    {
      id: 1,
      title: "Professional House Cleaning",
      location: "Los Angeles, CA",
      price: 120,
      duration: 3,
      category: "Home Services",
      rating: 4.9,
      reviews: 134,
      status: "active",
      image:
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400",
      bookings: 67,
      revenue: 8040,
      availability: "Mon-Sat",
      responseTime: "1 hour",
    },
    {
      id: 2,
      title: "Mobile Car Detailing",
      location: "San Diego, CA",
      price: 85,
      duration: 2,
      category: "Automotive",
      rating: 4.8,
      reviews: 89,
      status: "active",
      image:
        "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=400",
      bookings: 52,
      revenue: 4420,
      availability: "7 days",
      responseTime: "2 hours",
    },
    {
      id: 3,
      title: "Personal Training Sessions",
      location: "Miami, FL",
      price: 75,
      duration: 1,
      category: "Health & Wellness",
      rating: 5.0,
      reviews: 156,
      status: "inactive",
      image:
        "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400",
      bookings: 94,
      revenue: 7050,
      availability: "Mon-Fri",
      responseTime: "30 min",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    price: "",
    duration: "",
    category: "Home Services",
    description: "",
    availability: "",
    responseTime: "",
  });

  // Map-related state
  const [marker, setMarker] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  // Map search handler
  const handleSearch = async (query) => {
    setFormData({ ...formData, location: query });
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&addressdetails=1&limit=5`,
        {
          headers: {
            "User-Agent": "BookingNest/1.0",
          },
        }
      );

      if (!res.ok) throw new Error("Search failed");

      const data = await res.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (err) {
      console.error("Error fetching locations:", err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (place) => {
    setFormData({ ...formData, location: place.display_name });
    setMarker([parseFloat(place.lat), parseFloat(place.lon)]);
    setShowSuggestions(false);
  };

  const categories = [
    { name: "Home Services", icon: Home },
    { name: "Automotive", icon: Car },
    { name: "Tech Support", icon: Laptop },
    { name: "Beauty & Spa", icon: Scissors },
    { name: "Health & Wellness", icon: Heart },
    { name: "Photography", icon: Camera },
    { name: "Tutoring", icon: GraduationCap },
    { name: "Repair & Maintenance", icon: Wrench },
  ];

  // Filter and search services
  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || service.status === filterStatus;
    const matchesCategory =
      filterCategory === "all" || service.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Handle Add Service
  const handleAddService = () => {
    const newService = {
      id: services.length + 1,
      title: formData.title,
      location: formData.location,
      price: parseFloat(formData.price),
      duration: parseFloat(formData.duration),
      category: formData.category,
      rating: 0,
      reviews: 0,
      status: "active",
      image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400",
      bookings: 0,
      revenue: 0,
      availability: formData.availability,
      responseTime: formData.responseTime,
    };
    setServices([...services, newService]);
    setShowAddModal(false);
    resetForm();
  };

  // Handle Edit Service
  const handleEditService = () => {
    const updatedServices = services.map((service) =>
      service.id === selectedService.id
        ? {
            ...service,
            title: formData.title,
            location: formData.location,
            price: parseFloat(formData.price),
            duration: parseFloat(formData.duration),
            category: formData.category,
            availability: formData.availability,
            responseTime: formData.responseTime,
          }
        : service
    );
    setServices(updatedServices);
    setShowEditModal(false);
    resetForm();
  };

  // Handle Delete Service
  const handleDeleteService = () => {
    setServices(
      services.filter((service) => service.id !== selectedService.id)
    );
    setShowDeleteModal(false);
    setSelectedService(null);
  };

  // Toggle Service Status
  const toggleStatus = (id) => {
    setServices(
      services.map((service) =>
        service.id === id
          ? {
              ...service,
              status: service.status === "active" ? "inactive" : "active",
            }
          : service
      )
    );
  };

  // Open Edit Modal
  const openEditModal = (service) => {
    setSelectedService(service);
    setFormData({
      title: service.title,
      location: service.location,
      price: service.price,
      duration: service.duration,
      category: service.category,
      availability: service.availability,
      responseTime: service.responseTime,
    });
    setShowEditModal(true);
  };

  // Open Delete Modal
  const openDeleteModal = (service) => {
    setSelectedService(service);
    setShowDeleteModal(true);
  };

  // Reset Form
  const resetForm = () => {
    setFormData({
      title: "",
      location: "",
      price: "",
      duration: "",
      category: "Home Services",
      description: "",
      availability: "",
      responseTime: "",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              My Services
            </h1>
            <p className="text-slate-600 mt-1">
              Manage your professional services
            </p>
          </div>
          <button
            onClick={() =>
              handleActionWithVerification(() => setShowAddModal(true))
            }
            className="mt-4 md:mt-0 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Add New Service
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Total Services</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {services.length}
                </h3>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Active Services</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {services.filter((s) => s.status === "active").length}
                </h3>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Total Bookings</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {services.reduce((sum, service) => sum + service.bookings, 0)}
                </h3>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Total Revenue</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  $
                  {services
                    .reduce((sum, service) => sum + service.revenue, 0)
                    .toLocaleString()}
                </h3>
              </div>
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-pink-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search services by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-600" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        {filteredServices.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 border border-slate-200 text-center">
            <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              No services found
            </h3>
            <p className="text-slate-600 mb-6">
              {searchTerm || filterStatus !== "all" || filterCategory !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by adding your first service"}
            </p>
            {!searchTerm &&
              filterStatus === "all" &&
              filterCategory === "all" && (
                <button
                  onClick={() =>
                    handleActionWithVerification(() => setShowAddModal(true))
                  }
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Your First Service
                </button>
              )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
                      {service.category}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        service.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {service.status}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    {service.title}
                  </h3>
                  <p className="text-sm text-slate-600 flex items-center gap-1 mb-3">
                    <MapPin className="w-4 h-4" />
                    {service.location}
                  </p>

                  {/* Details */}
                  <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {service.duration}h
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {service.availability}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold text-slate-900">
                        {service.rating}
                      </span>
                      <span className="text-slate-600 text-sm">
                        ({service.reviews})
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">
                        ${service.price}
                      </p>
                      <p className="text-xs text-slate-600">per service</p>
                    </div>
                  </div>

                  {/* Performance */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-xs text-slate-600">Bookings</p>
                      <p className="font-semibold text-blue-600">
                        {service.bookings}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-xs text-slate-600">Revenue</p>
                      <p className="font-semibold text-green-600">
                        ${service.revenue.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Response Time Badge */}
                  <div className="mb-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                      <Award className="w-3 h-3" />
                      Responds in {service.responseTime}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleStatus(service.id)}
                      className={`flex-1 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                        service.status === "active"
                          ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                    >
                      {service.status === "active" ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          Activate
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => openEditModal(service)}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(service)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                Add New Service
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Service Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Professional House Cleaning"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Location *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Type a location or click on map"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />

                  {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute w-full bg-white border border-slate-200 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto z-[999]">
                      {suggestions.map((place) => (
                        <li
                          key={place.place_id}
                          onClick={() => handleSelect(place)}
                          className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-slate-700"
                        >
                          {place.display_name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 z-[998]">
                  <MapContainer
                    center={marker || defaultCenter}
                    zoom={10}
                    scrollWheelZoom
                    zoomControl={false}
                    style={{ height: "350px", width: "100%" }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <ZoomControl position="bottomright" />
                    <LocationPicker
                      marker={marker}
                      setMarker={setMarker}
                      setFormData={setFormData}
                      formData={formData}
                    />
                  </MapContainer>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Price per Service *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      placeholder="120"
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Duration (hours) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                    placeholder="3"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Availability *
                  </label>
                  <input
                    type="text"
                    value={formData.availability}
                    onChange={(e) =>
                      setFormData({ ...formData, availability: e.target.value })
                    }
                    placeholder="e.g., Mon-Sat"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Response Time *
                  </label>
                  <input
                    type="text"
                    value={formData.responseTime}
                    onChange={(e) =>
                      setFormData({ ...formData, responseTime: e.target.value })
                    }
                    placeholder="e.g., 1 hour"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe your service..."
                  rows="4"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Photos
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-500 transition cursor-pointer">
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600 text-sm">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    PNG, JPG up to 10MB
                  </p>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-6 flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddService}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Add Service
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                Edit Service
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Service Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Price per Service *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Duration (hours) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Availability *
                  </label>
                  <input
                    type="text"
                    value={formData.availability}
                    onChange={(e) =>
                      setFormData({ ...formData, availability: e.target.value })
                    }
                    placeholder="e.g., Mon-Sat"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Response Time *
                  </label>
                  <input
                    type="text"
                    value={formData.responseTime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        responseTime: e.target.value,
                      })
                    }
                    placeholder="e.g., 1 hour"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe your service..."
                  rows="4"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Photos
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-500 transition cursor-pointer">
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600 text-sm">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    PNG, JPG up to 10MB
                  </p>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-6 flex gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleEditService}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
            <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Delete Service
            </h2>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{selectedService?.title}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteService}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
