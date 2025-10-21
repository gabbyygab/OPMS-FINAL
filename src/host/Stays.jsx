import {
  Home,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MapPin,
  Users,
  DollarSign,
  Star,
  Calendar,
  Search,
  Filter,
  X,
  Save,
  Upload,
  Bed,
  Bath,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  ZoomControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { uploadToCloudinary } from "../cloudinary/uploadFunction";
import { toast } from "react-toastify";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";
//uploadthing

//Map integrations
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
export default function HostMyStays({ user, userData }) {
  const { isVerified } = useAuth();
  const [listings, setListings] = useState([]);
  const [marker, setMarker] = useState(null);

  const handleActionWithVerification = (action) => {
    if (!isVerified) {
      toast.warning("Please verify your account first", {
        position: "top-center",
      });
      return;
    }
    action();
  };
  //photoUpload

  const [previewImages, setPreviewImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);

  //houseRule

  const [newRule, setNewRule] = useState("");
  const [newAvailableDate, setNewAvailableDate] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    price: "",
    guests: "",
    bedrooms: "",
    beds: "",
    bathrooms: "",
    availableDates: [],
    bookedDates: [],
    amenities: [],
    discount: { type: "percentage", value: "" },
    description: "",
    houseRules: [], // ✅ added
  });

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  //rendering of data
  const getHostListing = async () => {
    try {
      const listingRef = collection(db, "listings");
      const q = query(
        listingRef,
        where("host_id", "==", userData.id),
        where("isDraft", "==", false),
        where("type", "==", "stays")
      );
      const querySnapshot = await getDocs(q);
      const data = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const listingData = { id: doc.id, ...doc.data() };

          // 2️⃣ Fetch booking count for this listing
          const bookingsRef = collection(db, "bookings");
          const bookingQuery = query(
            bookingsRef,
            where("listing_id", "==", doc.id)
          );
          const bookingSnapshot = await getDocs(bookingQuery);
          const revenue = listingData.price * bookingSnapshot.size;
          // 3️⃣ Add count into listing data
          return {
            id: listingData.id,
            ...listingData,
            bookingCount: bookingSnapshot.size,
            revenue: revenue,
          };
        })
      );

      setListings(data);
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    if (!userData.id) {
      return;
    }
    getHostListing();

    // Check for draft data from sessionStorage (coming from DraftsPage)
    const draftData = sessionStorage.getItem("editDraft");
    if (draftData) {
      try {
        const draft = JSON.parse(draftData);
        if (draft.type === "stays") {
          // Pre-fill the form with draft data and open edit modal
          openEditModal(draft);
          // Clear the sessionStorage
          sessionStorage.removeItem("editDraft");
        }
      } catch (error) {
        console.error("Error loading draft:", error);
      }
    }
  }, [userData]);
  console.log(listings);

  //imageUploading
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newPreviews = files.map((file) => URL.createObjectURL(file));

    setPreviewImages((prev) => [...prev, ...newPreviews]);

    // Keep both new and existing photo data
    setFormData((prev) => ({
      ...prev,
      photos: [...(prev.photos || []), ...files],
    }));
  };

  const removeImage = (index) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      photos: (prev.photos || []).filter((_, i) => i !== index),
    }));
  };

  //Map integrations
  const handleSearch = async (query) => {
    setFormData({ ...formData, location: query });
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300)); // Rate limiting

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

  // Add/Remove Available Date handlers
  const addAvailableDate = () => {
    if (newAvailableDate.trim()) {
      const dateTimestamp = new Date(newAvailableDate);
      setFormData({
        ...formData,
        availableDates: [...formData.availableDates, dateTimestamp],
      });
      setNewAvailableDate("");
    } else {
      toast.warning("Please select a date");
    }
  };

  const removeAvailableDate = (index) => {
    setFormData({
      ...formData,
      availableDates: formData.availableDates.filter((_, i) => i !== index),
    });
  };

  // Filter and search stays
  const filteredStays = listings.filter((stay) => {
    const matchesSearch =
      stay.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stay.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || stay.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Handle Add Stay

  const handleAddStay = async (isDraft = false) => {
    try {
      // Validate required fields
      if (!formData.title || !formData.location) {
        toast.error("Please fill in Title and Location first.");
        return;
      }

      const loadingToast = toast.loading(
        "Uploading images and creating stay..."
      );

      // Upload images to Cloudinary
      let imageUrls = [];
      if (imageFiles.length > 0) {
        try {
          const uploadPromises = imageFiles.map((file) =>
            uploadToCloudinary(file)
          );
          imageUrls = await Promise.all(uploadPromises);
        } catch (uploadError) {
          toast.dismiss(loadingToast);
          toast.error("Failed to upload images. Please try again.");
          return;
        }
      }

      // Prepare data (ensure no undefined values)
      const newStay = {
        title: formData.title || "",
        description: formData.description || "",
        location: formData.location || "",
        price: Number(formData.price) || 0,
        numberOfGuests: Number(formData.guests) || 1,
        bedrooms: Number(formData.bedrooms) || 0,
        bathrooms: Number(formData.bathrooms) || 0,
        amenities: Array.isArray(formData.amenities) ? formData.amenities : [],
        houseRules: Array.isArray(formData.houseRules)
          ? formData.houseRules
          : [],
        photos: imageUrls && imageUrls.length > 0 ? imageUrls : [],
        availableDates: Array.isArray(formData.availableDates)
          ? formData.availableDates.map(date =>
              date instanceof Date ? date : new Date(date)
            )
          : [],
        bookedDates: [],
        discount: {
          type: formData.discount?.type || "percentage",
          value: Number(formData.discount?.value) || 0,
        },
        ratings: 0,
        beds: Number(formData.beds) || 0,
        isDraft: !!isDraft,
        status: "active",
        type: "stays",
        host_id: userData.id || "unknown",
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };

      // Remove any undefined/null nested fields recursively
      const sanitizeData = (obj) =>
        Object.entries(obj).reduce((acc, [key, value]) => {
          if (value !== undefined) acc[key] = value;
          return acc;
        }, {});

      const cleanStay = sanitizeData(newStay);
      cleanStay.discount = sanitizeData(cleanStay.discount);

      // Add to Firestore
      const docRef = await addDoc(collection(db, "listings"), cleanStay);

      // Add the new stay to local state ONLY if it's not a draft
      if (!isDraft) {
        setListings((prev) => [{ id: docRef.id, ...cleanStay }, ...prev]);
      }

      toast.dismiss(loadingToast);
      toast.success(
        isDraft ? "Draft saved successfully!" : "Stay added successfully!"
      );

      // Reset form and UI
      resetForm();
      setShowAddModal(false);
      setPreviewImages([]);
      setImageFiles([]);
      setMarker(null);
    } catch (error) {
      console.error("Error adding stay:", error);
      toast.dismiss();
      toast.error("Failed to add stay. Please try again.");
    }
  };

  // Update resetForm to clear images
  const resetForm = () => {
    setFormData({
      title: "",
      location: "",
      price: "",
      guests: "",
      bedrooms: "",
      bathrooms: "",
      beds: "",
      availableDates: [],
      bookedDates: [],
      amenities: [],
      discount: { type: "percentage", value: "" },
      description: "",
      houseRules: [],
    });
    setPreviewImages([]);
    setMarker(null);
    setNewRule("");
    setNewAvailableDate("");
  };

  // Handle Edit Stay
  const handleEditStay = async () => {
    try {
      if (!formData.title || !formData.location) {
        toast.error("Please fill in required fields.");
        return;
      }

      const loadingToast = toast.loading("Saving Changes...");

      // Separate existing URLs from new File objects
      const existingUrls = previewImages.filter(
        (img) => typeof img === "string" && img.startsWith("http")
      );
      const newFiles = previewImages.filter(
        (img) =>
          img instanceof Blob ||
          (typeof img === "string" && img.startsWith("blob:"))
      );

      // Find corresponding File objects for new images
      const filesToUpload =
        formData.photos?.filter((photo) => photo instanceof File) || [];

      // Upload new images to Cloudinary
      let newImageUrls = [];
      if (filesToUpload.length > 0) {
        try {
          const uploadPromises = filesToUpload.map((file) =>
            uploadToCloudinary(file)
          );
          newImageUrls = await Promise.all(uploadPromises);
        } catch (uploadError) {
          toast.dismiss(loadingToast);
          toast.error("Failed to upload images. Please try again.");
          return;
        }
      }

      // Combine existing URLs with newly uploaded URLs
      const allPhotos = [...existingUrls, ...newImageUrls];

      // Prepare data (ensure no undefined values)
      const newStay = {
        title: formData.title || "",
        description: formData.description || "",
        location: formData.location || "",
        price: Number(formData.price) || 0,
        numberOfGuests: Number(formData.guests) || 1,
        bedrooms: Number(formData.bedrooms) || 0,
        bathrooms: Number(formData.bathrooms) || 0,
        beds: Number(formData.beds) || 0,
        amenities: Array.isArray(formData.amenities) ? formData.amenities : [],
        houseRules: Array.isArray(formData.houseRules)
          ? formData.houseRules
          : [],
        photos: allPhotos,
        availableDates: Array.isArray(formData.availableDates)
          ? formData.availableDates.map(date =>
              date instanceof Date ? date : new Date(date)
            )
          : [],
        bookedDates: Array.isArray(formData.bookedDates)
          ? formData.bookedDates
          : (selectedListing.bookedDates || []),
        discount: {
          type: formData.discount?.type || "percentage",
          value: Number(formData.discount?.value) || 0,
        },
        ratings: 0,
        isDraft: false,
        status: "active",
        type: "stays",
        host_id: userData.id || "unknown",
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };

      if (!newStay.photos || newStay.photos.length === 0) {
        newStay.photos = selectedListing.photos;
      }
      // Remove any undefined/null nested fields recursively
      const sanitizeData = (obj) =>
        Object.entries(obj).reduce((acc, [key, value]) => {
          if (value !== undefined) acc[key] = value;
          return acc;
        }, {});

      const cleanStay = sanitizeData(newStay);
      cleanStay.discount = sanitizeData(cleanStay.discount);

      const selectedId = selectedListing.id;

      // edit to Firestore
      const stayRef = doc(db, "listings", selectedId);
      const docRef = await updateDoc(stayRef, newStay);

      // Add the new stay to local state
      setListings((prev) =>
        prev.map((stay) =>
          stay.id === selectedId ? { id: selectedId, ...newStay } : stay
        )
      );

      toast.dismiss(loadingToast);
      toast.success("Stay edited successfully!");

      // Reset form and UI
      resetForm();
      setShowEditModal(false);
      setPreviewImages([]);
      setImageFiles([]);
      setMarker(null);
    } catch (error) {
      console.error("Error adding stay:", error);
      toast.dismiss();
      toast.error("Failed to edit stay. Please try again.");
    }
  };

  // Toggle Stay Status
  const toggleStatus = async (id) => {
    try {
      const stay = listings.find((s) => s.id === id);
      const newStatus = stay.status === "active" ? "inactive" : "active";

      await updateDoc(doc(db, "listings", id), {
        status: newStatus,
        updated_at: serverTimestamp(),
      });

      setListings(
        listings.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
      );
      toast.success(
        `Stay ${newStatus === "active" ? "activated" : "deactivated"} successfully!`
      );
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Failed to update status");
    }
  };

  // Open Edit Modal
  const openEditModal = (selectedListing) => {
    setSelectedListing(selectedListing);

    setFormData({
      title: selectedListing.title || "",
      location: selectedListing.location || "",
      price: selectedListing.price || "",
      guests: selectedListing.numberOfGuests || "",
      availableDates: Array.isArray(selectedListing.availableDates)
        ? selectedListing.availableDates.map(date => {
            if (date && date.toDate) {
              return date.toDate();
            }
            return date instanceof Date ? date : new Date(date);
          })
        : [],
      bookedDates: selectedListing.bookedDates || [],
      discount: selectedListing.discount || { type: "percentage", value: 0 },
      bedrooms: selectedListing.bedrooms || 0,
      bathrooms: selectedListing.bathrooms || 0,
      beds: selectedListing.beds || 0,
      houseRules: selectedListing.houseRules || [],
      amenities: selectedListing.amenities || [],
      description: selectedListing.description || "",
      photos: selectedListing.photos || [],
    });

    // Optional: Set markers for map if you have location coordinates
    if (selectedListing.latitude && selectedListing.longitude) {
      setMarker([selectedListing.latitude, selectedListing.longitude]);
    }

    // Prepare preview images (if stored as URLs)
    if (selectedListing.photos && selectedListing.photos.length > 0) {
      setPreviewImages(selectedListing.photos);
      setImageFiles(selectedListing.photos);
    } else {
      setPreviewImages([]);
      setImageFiles([]);
    }
    setShowEditModal(true);
  };

  // Open Delete Modal
  const openDeleteModal = (stay) => {
    setSelectedListing(stay);
    setShowDeleteModal(true);
  };

  // handle delete stay
  const handleDeleteStay = async (stay) => {
    try {
      const toastId = toast.loading("Deleting your listing...", {
        position: "top-center",
      });

      const id = stay.id;
      await deleteDoc(doc(db, "listings", id));
      setListings((prev) => prev.filter((s) => s.id !== id));
      toast.update(toastId, {
        render: "Listing deleted successfully.",
        type: "success",
        isLoading: false,
        autoClose: 2000,
        closeOnClick: true,
        draggable: true,
      });
      setShowDeleteModal(false);
    } catch (error) {
      toast.error("Failed to delete listing. Please try again.", {
        position: "top-center",
      });
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Stays</h1>
            <p className="text-slate-600 mt-1">Manage your property listings</p>
          </div>
          <button
            onClick={() =>
              handleActionWithVerification(() => setShowAddModal(true))
            }
            className="mt-4 md:mt-0 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Add New Stay
          </button>
        </div>

        {/* Stats Cards */}
        <div className="flex flex-wrap md:flex-nowrap gap-6 mb-8">
          {/* Total Stays */}
          <div className="flex-1 bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Total Stays</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {listings.length}
                </h3>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Home className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          {/* Total Bookings */}
          <div className="flex-1 bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Total Bookings</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {listings.length}
                </h3>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Active Listings */}
          <div className="flex-1 bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Active Listings</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {listings.filter((s) => s.status === "active").length}
                </h3>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="flex-1 bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Total Revenue</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  ₱
                  {listings
                    .reduce((sum, stay) => sum + (stay.revenue || 0), 0)
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
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search stays by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-600" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stays Grid */}
        {filteredStays.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 border border-slate-200 text-center">
            <Home className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              No stays found
            </h3>
            <p className="text-slate-600 mb-6">
              {searchTerm || filterStatus !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by adding your first stay"}
            </p>
            {!searchTerm && filterStatus === "all" && (
              <button
                onClick={() =>
                  handleActionWithVerification(() => setShowAddModal(true))
                }
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Your First Stay
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredStays.map((stay) => (
              <div
                key={stay.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition flex flex-col"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={stay.photos[0]}
                    alt={stay.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        stay.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {stay.status}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    {stay.title}
                  </h3>
                  <p className="text-sm text-slate-600 flex items-center gap-1 mb-3">
                    {stay.location}
                  </p>

                  {/* Details (removed bedrooms/bathrooms) */}
                  <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {stay.numberOfGuests} Max number of guests
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold text-slate-900">
                        {stay.rating}
                      </span>
                      <span className="text-slate-600 text-sm">
                        ({stay.reviews})
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">
                        ₱{stay.price.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Performance */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-2">
                      <p className="text-xs text-slate-600">Bookings</p>
                      <p className="font-semibold text-purple-700">
                        {stay.bookingCount}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-2">
                      <p className="text-xs text-slate-600">Revenue</p>
                      <p className="font-semibold text-green-600">
                        ₱{stay.revenue?.toLocaleString?.() || 0}
                      </p>
                    </div>
                  </div>

                  {/* Actions (stay at bottom) */}
                  <div className="mt-auto flex gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => toggleStatus(stay.id)}
                      className={`flex-1 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                        stay.status === "active"
                          ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                    >
                      {stay.status === "active" ? (
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
                      onClick={() => openEditModal(stay)}
                      className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(stay)}
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

      {/* Add Stay Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between z-[1000]">
              <h2 className="text-2xl font-bold text-slate-900">
                Add New Stay
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

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Property Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Beachfront Villa"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Location + Map */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Location *
                </label>
                <div className="relative">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Type a location or click on map"
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                  </div>

                  {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute w-full bg-white border border-slate-200 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto z-[999]">
                      {suggestions.map((place) => (
                        <li
                          key={place.place_id}
                          onClick={() => handleSelect(place)}
                          className="px-4 py-2 hover:bg-indigo-50 cursor-pointer text-sm text-slate-700"
                        >
                          {place.display_name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 relative" style={{ zIndex: 1 }}>
                  <MapContainer
                    center={marker || defaultCenter}
                    zoom={10}
                    scrollWheelZoom={false}
                    zoomControl={false}
                    style={{ height: "350px", width: "100%", position: "relative" }}
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

              {/* Available Dates */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Available Dates
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newAvailableDate}
                    onChange={(e) => setNewAvailableDate(e.target.value)}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                  <button
                    type="button"
                    onClick={addAvailableDate}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add
                  </button>
                </div>
                {formData.availableDates.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {formData.availableDates.map((date, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2"
                      >
                        <span className="text-indigo-700 text-sm font-medium">
                          {date instanceof Date
                            ? date.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : new Date(date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAvailableDate(index)}
                          className="text-slate-400 hover:text-red-500 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Price & Guests */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Price (₱)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    placeholder="Enter nightly rate"
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Max Guests
                  </label>
                  <input
                    type="number"
                    value={formData.guests}
                    onChange={(e) =>
                      setFormData({ ...formData, guests: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                {/* Bedrooms */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    value={formData.bedrooms || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, bedrooms: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    placeholder="e.g., 3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Beds
                  </label>
                  <input
                    type="number"
                    value={formData.beds || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, beds: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    placeholder="e.g., 3"
                  />
                </div>

                {/* Bathrooms */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    value={formData.bathrooms || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, bathrooms: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    placeholder="e.g., 2"
                  />
                </div>
              </div>

              {/* Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Discount Type
                  </label>
                  <select
                    value={formData.discount?.type || "percentage"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount: {
                          ...formData.discount,
                          type: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Discount Value
                  </label>
                  <input
                    type="number"
                    value={formData.discount?.value || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount: {
                          ...formData.discount,
                          value: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Amenities
                </label>
                <div className="flex flex-wrap gap-3">
                  {[
                    "Wifi",
                    "Parking",
                    "Pool",
                    "Air Conditioning",
                    "TV",
                    "Kitchen",
                  ].map((item) => (
                    <label
                      key={item}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={formData.amenities.includes(item)}
                        onChange={() => {
                          const exists = formData.amenities.includes(item);
                          setFormData({
                            ...formData,
                            amenities: exists
                              ? formData.amenities.filter((a) => a !== item)
                              : [...formData.amenities, item],
                          });
                        }}
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows="4"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                ></textarea>
              </div>

              {/* House Rules */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  House Rules
                </label>

                {/* Add Rule Input */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newRule || ""}
                    onChange={(e) => setNewRule(e.target.value)}
                    placeholder="Enter a rule (e.g., No smoking)"
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newRule.trim()) {
                        setFormData({
                          ...formData,
                          houseRules: [
                            ...(formData.houseRules || []),
                            newRule.trim(),
                          ],
                        });
                        setNewRule("");
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Add
                  </button>
                </div>

                {/* Display List of Rules */}
                {formData.houseRules && formData.houseRules.length > 0 ? (
                  <ul className="space-y-2">
                    {formData.houseRules.map((rule, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-2"
                      >
                        <span className="text-slate-700 text-sm">{rule}</span>
                        <button
                          onClick={() => {
                            const updated = formData.houseRules.filter(
                              (_, i) => i !== index
                            );
                            setFormData({ ...formData, houseRules: updated });
                          }}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">
                    No house rules added yet.
                  </p>
                )}
              </div>
              {/* Photos */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Photos
                </label>
                <div
                  onClick={() => document.getElementById("photoInput").click()}
                  className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-indigo-500 transition cursor-pointer"
                >
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600 text-sm">
                    Click to upload or drag and drop
                  </p>
                  <input
                    id="photoInput"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>

                {previewImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {previewImages.map((src, i) => (
                      <div key={i} className="relative">
                        <img
                          src={src}
                          alt={`Preview ${i}`}
                          className="rounded-lg object-cover w-full h-32"
                        />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute top-2 right-2 bg-white rounded-full p-1 shadow"
                        >
                          <X className="w-4 h-4 text-slate-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 z-[999] bg-slate-50 border-t border-slate-200 p-6 flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                onClick={() => handleAddStay(true)}
                className="flex-1 px-6 py-3 border border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50"
              >
                Save Draft
              </button>

              <button
                onClick={() => handleAddStay(false)}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Add Stay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Stay Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between z-[1000]">
              <h2 className="text-2xl font-bold text-slate-900">Edit Stay</h2>
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

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Property Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Beachfront Villa"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Location + Map */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Location *
                </label>
                <div className="relative">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => {
                        handleSearch(e.target.value);
                        setFormData({ ...formData, location: e.target.value });
                      }}
                      placeholder="Type a location or click on map"
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                  </div>

                  {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute w-full bg-white border border-slate-200 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto z-[999]">
                      {suggestions.map((place) => (
                        <li
                          key={place.place_id}
                          onClick={() => handleSelect(place)}
                          className="px-4 py-2 hover:bg-indigo-50 cursor-pointer text-sm text-slate-700"
                        >
                          {place.display_name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 relative" style={{ zIndex: 1 }}>
                  <MapContainer
                    center={marker || defaultCenter}
                    zoom={10}
                    scrollWheelZoom={false}
                    zoomControl={false}
                    style={{ height: "350px", width: "100%", position: "relative" }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <LocationPicker
                      marker={marker}
                      setMarker={setMarker}
                      setFormData={setFormData}
                      formData={formData}
                    />
                  </MapContainer>
                </div>
              </div>

              {/* Available Dates */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Available Dates
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newAvailableDate}
                    onChange={(e) => setNewAvailableDate(e.target.value)}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                  <button
                    type="button"
                    onClick={addAvailableDate}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add
                  </button>
                </div>
                {formData.availableDates.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {formData.availableDates.map((date, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2"
                      >
                        <span className="text-indigo-700 text-sm font-medium">
                          {date instanceof Date
                            ? date.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : new Date(date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAvailableDate(index)}
                          className="text-slate-400 hover:text-red-500 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Price & Guests */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Price (₱)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Max Guests
                  </label>
                  <input
                    type="number"
                    value={formData.guests}
                    onChange={(e) =>
                      setFormData({ ...formData, guests: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              {/* Bedrooms, Bathrooms & Beds */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    value={formData.bedrooms || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, bedrooms: e.target.value })
                    }
                    placeholder="e.g., 2"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    value={formData.bathrooms || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, bathrooms: e.target.value })
                    }
                    placeholder="e.g., 1"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Beds
                  </label>
                  <input
                    type="number"
                    value={formData.beds || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, beds: e.target.value })
                    }
                    placeholder="e.g., 3"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Discount Type
                  </label>
                  <select
                    value={formData.discount?.type || "percentage"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount: {
                          ...formData.discount,
                          type: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Discount Value
                  </label>
                  <input
                    type="number"
                    value={formData.discount?.value || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount: {
                          ...formData.discount,
                          value: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Amenities
                </label>
                <div className="flex flex-wrap gap-3">
                  {[
                    "Wifi",
                    "Parking",
                    "Pool",
                    "Air Conditioning",
                    "TV",
                    "Kitchen",
                  ].map((item) => (
                    <label
                      key={item}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={formData.amenities.includes(item)}
                        onChange={() => {
                          const exists = formData.amenities.includes(item);
                          setFormData({
                            ...formData,
                            amenities: exists
                              ? formData.amenities.filter((a) => a !== item)
                              : [...formData.amenities, item],
                          });
                        }}
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows="4"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                ></textarea>
              </div>
              {/* House Rules */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  House Rules
                </label>

                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newRule || ""}
                    onChange={(e) => setNewRule(e.target.value)}
                    placeholder="Enter a rule (e.g., No smoking)"
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newRule.trim()) {
                        setFormData({
                          ...formData,
                          houseRules: [
                            ...(formData.houseRules || []),
                            newRule.trim(),
                          ],
                        });
                        setNewRule("");
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Add
                  </button>
                </div>

                {formData.houseRules && formData.houseRules.length > 0 ? (
                  <ul className="space-y-2">
                    {formData.houseRules.map((rule, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-2"
                      >
                        <span className="text-slate-700 text-sm">{rule}</span>
                        <button
                          onClick={() => {
                            const updated = formData.houseRules.filter(
                              (_, i) => i !== index
                            );
                            setFormData({ ...formData, houseRules: updated });
                          }}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">
                    No house rules added yet.
                  </p>
                )}
              </div>

              {/* Photos */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Photos
                </label>
                <div
                  onClick={() =>
                    document.getElementById("editPhotoInput").click()
                  }
                  className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-indigo-500 transition cursor-pointer"
                >
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600 text-sm">
                    Click to upload or drag and drop
                  </p>
                  <input
                    id="editPhotoInput"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>

                {previewImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {previewImages.map((src, i) => (
                      <div key={i} className="relative">
                        <img
                          src={src}
                          alt={`Preview ${i}`}
                          className="rounded-lg object-cover w-full h-32"
                        />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute top-2 right-2 bg-white rounded-full p-1 shadow"
                        >
                          <X className="w-4 h-4 text-slate-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-6 flex gap-3 z-[999]">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleEditStay}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">
              Delete Stay
            </h3>
            <p className="text-slate-600 text-center mb-6">
              Are you sure you want to delete "{selectedListing.title}"? This
              action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedListing(null);
                }}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteStay(selectedListing)}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
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
