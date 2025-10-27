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
  Gift,
  ChevronLeft,
  ChevronRight,
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
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
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
  const [isLoading, setIsLoading] = useState(false);
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newDateRangeStart, setNewDateRangeStart] = useState("");
  const [newDateRangeEnd, setNewDateRangeEnd] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [dateRangeState, setDateRangeState] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);
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
    promoCode: "", // ✅ added
  });

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  //rendering of data
  const getHostListing = async () => {
    try {
      setIsLoading(true);
      const listingRef = collection(db, "listings");
      const q = query(
        listingRef,
        where("hostId", "==", userData.id),
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
    } finally {
      setIsLoading(false);
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
    setImageFiles((prev) => [...prev, ...files]);

    // Keep both new and existing photo data
    setFormData((prev) => ({
      ...prev,
      photos: [...(prev.photos || []), ...files],
    }));
  };

  const removeImage = (index) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
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

  // Add/Remove Available Date Range handlers
  const addDateRange = () => {
    if (!newDateRangeStart || !newDateRangeEnd) {
      toast.warning("Please select both start and end dates");
      return;
    }

    const startDate = new Date(newDateRangeStart);
    const endDate = new Date(newDateRangeEnd);

    if (startDate > endDate) {
      toast.warning("Start date must be before end date");
      return;
    }

    const dateRangeObj = {
      startDate: newDateRangeStart,
      endDate: newDateRangeEnd,
    };

    setFormData({
      ...formData,
      availableDates: [...formData.availableDates, dateRangeObj],
    });

    setNewDateRangeStart("");
    setNewDateRangeEnd("");
    toast.success("Date range added");
  };

  // Handler for adding date range from modal picker
  const addDateRangeFromModal = () => {
    const startDate = dateRangeState[0]?.startDate;
    const endDate = dateRangeState[0]?.endDate;

    if (!startDate || !endDate) {
      toast.warning("Please select both start and end dates");
      return;
    }

    if (startDate > endDate) {
      toast.warning("Start date must be before end date");
      return;
    }

    // Convert dates to YYYY-MM-DD format for storage
    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    const dateRangeObj = {
      startDate: startStr,
      endDate: endStr,
    };

    setFormData({
      ...formData,
      availableDates: [...formData.availableDates, dateRangeObj],
    });

    // Reset the modal state
    setDateRangeState([
      {
        startDate: new Date(),
        endDate: new Date(),
        key: "selection",
      },
    ]);
    setShowDateRangeModal(false);
    toast.success("Date range added");
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

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  // Pagination logic
  const totalPages = Math.ceil(filteredStays.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStays = filteredStays.slice(startIndex, endIndex);

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
        availableDates: Array.isArray(formData.availableDates) ? formData.availableDates : [],
        bookedDates: [],
        promoCode: formData.promoCode || null,
        discount: {
          type: formData.discount?.type || "percentage",
          value: Number(formData.discount?.value) || 0,
        },
        ratings: 0,
        beds: Number(formData.beds) || 0,
        isDraft: !!isDraft,
        status: "active",
        type: "stays",
        hostId: userData.id || "unknown",
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
      promoCode: "",
    });
    setPreviewImages([]);
    setImageFiles([]);
    setMarker(null);
    setNewRule("");
    setShowDatePicker(false);
    setNewDateRangeStart("");
    setNewDateRangeEnd("");
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
        availableDates: Array.isArray(formData.availableDates) ? formData.availableDates : [],
        bookedDates: Array.isArray(formData.bookedDates)
          ? formData.bookedDates
          : (selectedListing.bookedDates || []),
        promoCode: formData.promoCode || null,
        discount: {
          type: formData.discount?.type || "percentage",
          value: Number(formData.discount?.value) || 0,
        },
        ratings: 0,
        isDraft: false,
        status: "active",
        type: "stays",
        hostId: userData.id || "unknown",
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
        ? selectedListing.availableDates
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
      promoCode: selectedListing.promoCode || "",
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 pb-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 lg:pt-40">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-indigo-200 bg-clip-text text-transparent">My Stays</h1>
            <p className="text-indigo-300/60 mt-1">Manage your property listings</p>
          </div>
          <button
            onClick={() =>
              handleActionWithVerification(() => setShowAddModal(true))
            }
            className="mt-4 md:mt-0 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition flex items-center gap-2 font-medium shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-5 h-5" />
            Add New Stay
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Stays */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl shadow-lg shadow-indigo-500/10 p-6 border border-indigo-500/20 backdrop-blur-sm hover:border-indigo-500/40 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-300/70 text-sm">Total Stays</p>
                <h3 className="text-2xl font-bold text-indigo-100 mt-1">
                  {listings.length}
                </h3>
              </div>
              <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center border border-indigo-500/30">
                <Home className="w-6 h-6 text-indigo-400" />
              </div>
            </div>
          </div>

          {/* Active Listings */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl shadow-lg shadow-green-500/10 p-6 border border-green-500/20 backdrop-blur-sm hover:border-green-500/40 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300/70 text-sm">Active Listings</p>
                <h3 className="text-2xl font-bold text-green-100 mt-1">
                  {listings.filter((s) => s.status === "active").length}
                </h3>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center border border-green-500/30">
                <Eye className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>

          {/* Total Bookings */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl shadow-lg shadow-orange-500/10 p-6 border border-orange-500/20 backdrop-blur-sm hover:border-orange-500/40 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-300/70 text-sm">Total Bookings</p>
                <h3 className="text-2xl font-bold text-orange-100 mt-1">
                  {listings.reduce((sum, stay) => sum + (stay.bookingCount || 0), 0)}
                </h3>
              </div>
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center border border-orange-500/30">
                <Calendar className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl shadow-lg shadow-pink-500/10 p-6 border border-pink-500/20 backdrop-blur-sm hover:border-pink-500/40 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-300/70 text-sm">Total Revenue</p>
                <h3 className="text-2xl font-bold text-pink-100 mt-1">
                  ₱
                  {listings
                    .reduce((sum, stay) => sum + (stay.revenue || 0), 0)
                    .toLocaleString()}
                </h3>
              </div>
              <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center border border-pink-500/30">
                <DollarSign className="w-6 h-6 text-pink-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl shadow-lg shadow-indigo-500/10 p-6 border border-indigo-500/20 backdrop-blur-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-400/50" />
              <input
                type="text"
                placeholder="Search stays by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-indigo-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 transition"
              >
                <option value="all" className="bg-slate-800 text-indigo-100">All Status</option>
                <option value="active" className="bg-slate-800 text-indigo-100">Active</option>
                <option value="inactive" className="bg-slate-800 text-indigo-100">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stays Grid */}
        {isLoading ? (
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl shadow-lg shadow-indigo-500/10 p-12 border border-indigo-500/20 backdrop-blur-sm text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
            <h3 className="text-xl font-semibold text-indigo-100 mb-2">
              Loading your stays...
            </h3>
            <p className="text-indigo-300/60">
              Please wait while we fetch your listings
            </p>
          </div>
        ) : filteredStays.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl shadow-lg shadow-indigo-500/10 p-12 border border-indigo-500/20 backdrop-blur-sm text-center">
            <Home className="w-16 h-16 text-indigo-400/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-indigo-100 mb-2">
              No stays found
            </h3>
            <p className="text-indigo-300/60 mb-6">
              {searchTerm || filterStatus !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by adding your first stay"}
            </p>
            {!searchTerm && filterStatus === "all" && (
              <button
                onClick={() =>
                  handleActionWithVerification(() => setShowAddModal(true))
                }
                className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition inline-flex items-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                <Plus className="w-5 h-5" />
                Add Your First Stay
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {paginatedStays.map((stay) => (
              <div
                key={stay.id}
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-lg shadow-lg shadow-indigo-500/10 border border-indigo-500/20 overflow-hidden hover:border-indigo-500/40 hover:shadow-indigo-500/20 transition flex flex-col backdrop-blur-sm"
              >
                {/* Image */}
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={stay.photos?.[0] || stay.images?.[0] || "https://via.placeholder.com/400x300?text=No+Image"}
                    alt={stay.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                        stay.status === "active"
                          ? "bg-emerald-500/30 text-emerald-200 border border-emerald-500/50"
                          : "bg-slate-600/30 text-slate-200 border border-slate-500/50"
                      }`}
                    >
                      {stay.status}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-indigo-100 mb-1">
                    {stay.title}
                  </h3>
                  <p className="text-sm text-indigo-300/60 flex items-center gap-1 mb-3">
                    {stay.location}
                  </p>

                  {/* Details (removed bedrooms/bathrooms) */}
                  <div className="flex items-center gap-4 text-sm text-indigo-300/70 mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {stay.numberOfGuests} Max guests
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-indigo-500/20">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="font-semibold text-indigo-100">
                        {stay.rating || 0}
                      </span>
                      <span className="text-indigo-300/60 text-sm">
                        ({stay.reviews || 0})
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-indigo-200 bg-clip-text text-transparent">
                        ₱{(stay.price || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Performance */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gradient-to-br from-indigo-600/20 to-indigo-500/10 rounded-lg p-2 border border-indigo-500/30">
                      <p className="text-xs text-indigo-300/70">Bookings</p>
                      <p className="font-semibold text-indigo-300">
                        {stay.bookingCount}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-500/10 rounded-lg p-2 border border-emerald-500/30">
                      <p className="text-xs text-indigo-300/70">Revenue</p>
                      <p className="font-semibold text-emerald-300">
                        ₱{stay.revenue?.toLocaleString?.() || 0}
                      </p>
                    </div>
                  </div>

                  {/* Actions (stay at bottom) */}
                  <div className="mt-auto flex gap-2 pt-2 border-t border-indigo-500/20">
                    <button
                      onClick={() => toggleStatus(stay.id)}
                      className={`flex-1 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                        stay.status === "active"
                          ? "bg-slate-700/50 text-slate-200 hover:bg-slate-600/50 border border-slate-600/50"
                          : "bg-emerald-600/30 text-emerald-200 hover:bg-emerald-600/50 border border-emerald-500/50"
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
                      className="px-4 py-2 bg-indigo-600/30 text-indigo-200 rounded-lg hover:bg-indigo-600/50 transition border border-indigo-500/50"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(stay)}
                      className="px-4 py-2 bg-rose-600/30 text-rose-200 rounded-lg hover:bg-rose-600/50 transition border border-rose-500/50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-5 h-5 text-indigo-300" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg font-semibold transition ${
                        currentPage === page
                          ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                          : "bg-slate-700/50 border border-indigo-500/30 text-indigo-300 hover:bg-slate-700"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-5 h-5 text-indigo-300" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Stay Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-indigo-500/30 shadow-2xl shadow-indigo-500/20">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-indigo-500/30 p-6 flex items-center justify-between z-[1000]">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-indigo-200 bg-clip-text text-transparent">
                Add New Stay
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-indigo-400/60 hover:text-indigo-400 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  Property Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Beachfront Villa"
                  className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                />
              </div>

              {/* Location + Map */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  Location *
                </label>
                <div className="relative">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Type a location or click on map"
                      className="flex-1 px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                    />
                  </div>

                  {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute w-full bg-slate-800/95 border border-indigo-500/30 rounded-lg mt-1 shadow-lg shadow-indigo-500/10 max-h-60 overflow-y-auto z-[999] backdrop-blur-sm">
                      {suggestions.map((place) => (
                        <li
                          key={place.place_id}
                          onClick={() => handleSelect(place)}
                          className="px-4 py-2 hover:bg-indigo-600/30 cursor-pointer text-sm text-indigo-200 border-b border-indigo-500/10 last:border-b-0 transition"
                        >
                          {place.display_name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-4 rounded-xl overflow-hidden border border-indigo-500/30 relative" style={{ zIndex: 1 }}>
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

              {/* Available Date Ranges */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Available Date Ranges
                </label>

                {/* Open Date Range Picker Button */}
                <button
                  type="button"
                  onClick={() => setShowDateRangeModal(true)}
                  className="w-full mb-4 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white rounded-lg transition font-medium flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  <Calendar className="w-4 h-4" />
                  Select Date Range
                </button>

                {/* Display Date Ranges List */}
                {formData.availableDates && formData.availableDates.length > 0 ? (
                  <div className="space-y-2">
                    {formData.availableDates.map((range, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-slate-700/50 border border-indigo-500/20 rounded-lg px-4 py-2"
                      >
                        <span className="text-indigo-200 text-sm">
                          {new Date(range.startDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}{" "}
                          -{" "}
                          {new Date(range.endDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAvailableDate(index)}
                          className="text-indigo-400/50 hover:text-red-400 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-indigo-300/50">No date ranges added yet</p>
                )}
              </div>

              {/* Price & Guests */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">
                    Price (₱)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    placeholder="Enter nightly rate"
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">
                    Max Guests
                  </label>
                  <input
                    type="number"
                    value={formData.guests}
                    onChange={(e) =>
                      setFormData({ ...formData, guests: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                  />
                </div>

                {/* Bedrooms */}
                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    value={formData.bedrooms || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, bedrooms: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                    placeholder="e.g., 3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">
                    Beds
                  </label>
                  <input
                    type="number"
                    value={formData.beds || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, beds: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                    placeholder="e.g., 3"
                  />
                </div>

                {/* Bathrooms */}
                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    value={formData.bathrooms || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, bathrooms: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                    placeholder="e.g., 2"
                  />
                </div>
              </div>

              {/* Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">
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
                    className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 transition"
                  >
                    <option value="percentage" className="bg-slate-800 text-indigo-100">Percentage</option>
                    <option value="fixed" className="bg-slate-800 text-indigo-100">Fixed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">
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
                    className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                  />
                </div>
              </div>

              {/* Promo Code */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  <Gift className="w-4 h-4 inline mr-1" />
                  Promo Code (Optional)
                </label>
                <input
                  type="text"
                  value={formData.promoCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      promoCode: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="e.g., SUMMER20"
                  className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                />
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-3">
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
                      className="flex items-center gap-2 text-sm px-3 py-2 bg-slate-700/50 border border-indigo-500/20 rounded-lg hover:border-indigo-500/40 cursor-pointer transition"
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
                        className="w-4 h-4 accent-indigo-500"
                      />
                      <span className="text-indigo-200">{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows="4"
                  className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition resize-none"
                ></textarea>
              </div>

              {/* House Rules */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-3">
                  House Rules
                </label>

                {/* Add Rule Input */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newRule || ""}
                    onChange={(e) => setNewRule(e.target.value)}
                    placeholder="Enter a rule (e.g., No smoking)"
                    className="flex-1 px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
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
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition font-medium"
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
                        className="flex items-center justify-between bg-slate-700/50 border border-indigo-500/20 rounded-lg px-4 py-2 hover:border-indigo-500/40 transition"
                      >
                        <span className="text-indigo-200 text-sm">{rule}</span>
                        <button
                          onClick={() => {
                            const updated = formData.houseRules.filter(
                              (_, i) => i !== index
                            );
                            setFormData({ ...formData, houseRules: updated });
                          }}
                          className="text-indigo-400/50 hover:text-rose-400 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-indigo-300/50">
                    No house rules added yet.
                  </p>
                )}
              </div>
              {/* Photos */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  Photos
                </label>
                <div
                  onClick={() => document.getElementById("photoInput").click()}
                  className="border-2 border-dashed border-indigo-500/30 rounded-lg p-8 text-center hover:border-indigo-500/60 hover:bg-slate-700/30 transition cursor-pointer bg-slate-700/20"
                >
                  <Upload className="w-12 h-12 text-indigo-400/50 mx-auto mb-3" />
                  <p className="text-indigo-300/70 text-sm">
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
                          className="rounded-lg object-cover w-full h-32 border border-indigo-500/20"
                        />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute top-2 right-2 bg-slate-800/80 rounded-full p-1 shadow hover:bg-slate-800 transition border border-indigo-500/30"
                        >
                          <X className="w-4 h-4 text-indigo-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 z-[999] bg-gradient-to-r from-slate-800 to-slate-900 border-t border-indigo-500/30 p-6 flex gap-3 backdrop-blur-sm">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="flex-1 px-6 py-3 border border-indigo-500/30 text-indigo-300 rounded-lg hover:bg-slate-700/50 hover:border-indigo-500/50 transition font-medium"
              >
                Cancel
              </button>

              <button
                onClick={() => handleAddStay(true)}
                className="flex-1 px-6 py-3 border border-indigo-500/30 text-indigo-300 rounded-lg hover:bg-slate-700/50 hover:border-indigo-500/50 transition font-medium"
              >
                Save Draft
              </button>

              <button
                onClick={() => handleAddStay(false)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition flex items-center justify-center gap-2 font-medium shadow-lg shadow-indigo-500/20"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-indigo-500/30 shadow-2xl shadow-indigo-500/20">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-indigo-500/30 p-6 flex items-center justify-between z-[1000]">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-indigo-200 bg-clip-text text-transparent">Edit Stay</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                className="text-indigo-400/60 hover:text-indigo-400 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  Property Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Beachfront Villa"
                  className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                />
              </div>

              {/* Location + Map */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">
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
                      className="flex-1 px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                    />
                  </div>

                  {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute w-full bg-slate-800/95 border border-indigo-500/30 rounded-lg mt-1 shadow-lg shadow-indigo-500/10 max-h-60 overflow-y-auto z-[999] backdrop-blur-sm">
                      {suggestions.map((place) => (
                        <li
                          key={place.place_id}
                          onClick={() => handleSelect(place)}
                          className="px-4 py-2 hover:bg-indigo-600/30 cursor-pointer text-sm text-indigo-200 border-b border-indigo-500/10 last:border-b-0 transition"
                        >
                          {place.display_name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-4 rounded-xl overflow-hidden border border-indigo-500/30 relative" style={{ zIndex: 1 }}>
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

              {/* Available Date Ranges */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Available Date Ranges
                </label>

                {/* Open Date Range Picker Button */}
                <button
                  type="button"
                  onClick={() => setShowDateRangeModal(true)}
                  className="w-full mb-4 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white rounded-lg transition font-medium flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  <Calendar className="w-4 h-4" />
                  Select Date Range
                </button>

                {/* Display Date Ranges List */}
                {formData.availableDates && formData.availableDates.length > 0 ? (
                  <div className="space-y-2">
                    {formData.availableDates.map((range, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-slate-700/50 border border-indigo-500/20 rounded-lg px-4 py-2"
                      >
                        <span className="text-indigo-200 text-sm">
                          {new Date(range.startDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}{" "}
                          -{" "}
                          {new Date(range.endDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAvailableDate(index)}
                          className="text-indigo-400/50 hover:text-red-400 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-indigo-300/50">No date ranges added yet</p>
                )}
              </div>

              {/* Price & Guests */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">
                    Price (₱)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">
                    Max Guests
                  </label>
                  <input
                    type="number"
                    value={formData.guests}
                    onChange={(e) =>
                      setFormData({ ...formData, guests: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                  />
                </div>
              </div>
              {/* Bedrooms, Bathrooms & Beds */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    value={formData.bedrooms || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, bedrooms: e.target.value })
                    }
                    placeholder="e.g., 2"
                    className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    value={formData.bathrooms || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, bathrooms: e.target.value })
                    }
                    placeholder="e.g., 1"
                    className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">
                    Beds
                  </label>
                  <input
                    type="number"
                    value={formData.beds || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, beds: e.target.value })
                    }
                    placeholder="e.g., 3"
                    className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                  />
                </div>
              </div>

              {/* Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">
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
                    className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 transition"
                  >
                    <option value="percentage" className="bg-slate-800 text-indigo-100">Percentage</option>
                    <option value="fixed" className="bg-slate-800 text-indigo-100">Fixed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">
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
                    className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                  />
                </div>
              </div>

              {/* Promo Code */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  <Gift className="w-4 h-4 inline mr-1" />
                  Promo Code (Optional)
                </label>
                <input
                  type="text"
                  value={formData.promoCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      promoCode: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="e.g., SUMMER20"
                  className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                />
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-3">
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
                      className="flex items-center gap-2 text-sm px-3 py-2 bg-slate-700/50 border border-indigo-500/20 rounded-lg hover:border-indigo-500/40 cursor-pointer transition"
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
                        className="w-4 h-4 accent-indigo-500"
                      />
                      <span className="text-indigo-200">{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows="4"
                  className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition resize-none"
                ></textarea>
              </div>

              {/* House Rules */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-3">
                  House Rules
                </label>

                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newRule || ""}
                    onChange={(e) => setNewRule(e.target.value)}
                    placeholder="Enter a rule (e.g., No smoking)"
                    className="flex-1 px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
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
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition font-medium"
                  >
                    Add
                  </button>
                </div>

                {formData.houseRules && formData.houseRules.length > 0 ? (
                  <ul className="space-y-2">
                    {formData.houseRules.map((rule, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between bg-slate-700/50 border border-indigo-500/20 rounded-lg px-4 py-2 hover:border-indigo-500/40 transition"
                      >
                        <span className="text-indigo-200 text-sm">{rule}</span>
                        <button
                          onClick={() => {
                            const updated = formData.houseRules.filter(
                              (_, i) => i !== index
                            );
                            setFormData({ ...formData, houseRules: updated });
                          }}
                          className="text-indigo-400/50 hover:text-rose-400 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-indigo-300/50">
                    No house rules added yet.
                  </p>
                )}
              </div>

              {/* Photos */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  Photos
                </label>
                <div
                  onClick={() =>
                    document.getElementById("editPhotoInput").click()
                  }
                  className="border-2 border-dashed border-indigo-500/30 rounded-lg p-8 text-center hover:border-indigo-500/60 hover:bg-slate-700/30 transition cursor-pointer bg-slate-700/20"
                >
                  <Upload className="w-12 h-12 text-indigo-400/50 mx-auto mb-3" />
                  <p className="text-indigo-300/70 text-sm">
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
                          className="rounded-lg object-cover w-full h-32 border border-indigo-500/20"
                        />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute top-2 right-2 bg-slate-800/80 rounded-full p-1 shadow hover:bg-slate-800 transition border border-indigo-500/30"
                        >
                          <X className="w-4 h-4 text-indigo-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gradient-to-r from-slate-800 to-slate-900 border-t border-indigo-500/30 p-6 flex gap-3 z-[999] backdrop-blur-sm">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                className="flex-1 px-6 py-3 border border-indigo-500/30 text-indigo-300 rounded-lg hover:bg-slate-700/50 hover:border-indigo-500/50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleEditStay}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition flex items-center justify-center gap-2 font-medium shadow-lg shadow-indigo-500/20"
              >
                <Save className="w-5 h-5" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date Range Picker Modal */}
      {showDateRangeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl w-full max-w-xl p-5 border border-indigo-500/30 shadow-2xl shadow-indigo-500/20">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-indigo-200 bg-clip-text text-transparent flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                Select Date Range
              </h3>
              <button
                onClick={() => setShowDateRangeModal(false)}
                className="text-indigo-400/60 hover:text-indigo-400 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Date Range Picker */}
            <div className="mb-4 w-full flex justify-center">
              <style>{`
                .rdrCalendarWrapper {
                  background-color: rgba(15, 23, 42, 0.8);
                  border-radius: 12px;
                  width: 100%;
                  padding: 16px;
                }
                .rdrCalendarContainer {
                  width: 100%;
                }
                .rdrMonth {
                  width: 100%;
                  padding: 0 10px;
                }
                .rdrMonths {
                  width: 100%;
                  display: flex;
                  gap: 20px;
                }
                .rdrMonthAndYearWrapper {
                  background-color: rgba(30, 41, 59, 0.5);
                  border-radius: 8px;
                  padding: 10px;
                  margin-bottom: 12px;
                  text-align: center;
                  color: #a5b4fc;
                  font-weight: 600;
                  font-size: 14px;
                }
                .rdrMonthAndYearPickers button {
                  color: #a5b4fc;
                  padding: 2px 6px;
                }
                .rdrMonthAndYearPickers button:hover {
                  background-color: rgba(79, 70, 229, 0.2);
                }
                .rdrDayNames {
                  margin-bottom: 10px;
                  display: grid;
                  grid-template-columns: repeat(7, 1fr);
                  gap: 3px;
                }
                .rdrDayName {
                  color: #c7d2fe;
                  font-size: 11px;
                  font-weight: 600;
                  text-align: center;
                  padding: 6px 0;
                }
                .rdrDays {
                  display: grid;
                  grid-template-columns: repeat(7, 1fr);
                  gap: 3px;
                }
                .rdrDayDisabled {
                  background-color: transparent;
                }
                .rdrDay {
                  height: 42px;
                  display: flex !important;
                  align-items: center !important;
                  justify-content: center !important;
                  border-radius: 6px;
                  border: 1px solid transparent !important;
                  cursor: pointer;
                  position: relative;
                  width: 100%;
                  padding: 0 !important;
                  margin: 0 !important;
                }
                .rdrDayNumber {
                  color: #cbd5e1;
                  font-size: 13px;
                  font-weight: 500;
                  position: relative;
                  z-index: 1;
                  text-decoration: none !important;
                  border: none !important;
                  outline: none !important;
                }
                .rdrDayNumber span {
                  color: #cbd5e1;
                  text-decoration: none !important;
                  border: none !important;
                }
                .rdrDayNumber::before,
                .rdrDayNumber::after {
                  content: none !important;
                }
                .rdrStartEdge {
                  border-radius: 6px 0 0 6px !important;
                  border: 1px solid #818cf8 !important;
                  border-right: none !important;
                  background-color: #6366f1 !important;
                  width: 100% !important;
                }
                .rdrStartEdge::after {
                  content: none !important;
                }
                .rdrEndEdge {
                  border-radius: 0 6px 6px 0 !important;
                  border: 1px solid #818cf8 !important;
                  border-left: none !important;
                  background-color: #6366f1 !important;
                  width: 100% !important;
                }
                .rdrEndEdge::before {
                  content: none !important;
                }
                .rdrDayStartPreview {
                  background-color: #6366f1 !important;
                  border-radius: 6px !important;
                  border: 1px solid #818cf8 !important;
                  width: 100% !important;
                }
                .rdrDayInPreview {
                  background-color: rgba(99, 102, 241, 0.2) !important;
                  border: none !important;
                  width: 100% !important;
                }
                .rdrDayInPreview::before,
                .rdrDayInPreview::after {
                  content: none !important;
                }
                .rdrDayEndPreview {
                  background-color: #6366f1 !important;
                  border-radius: 6px !important;
                  border: 1px solid #818cf8 !important;
                  width: 100% !important;
                }
                .rdrDayInRange {
                  background-color: rgba(99, 102, 241, 0.2) !important;
                  border: none !important;
                  width: 100% !important;
                }
                .rdrDayInRange::before,
                .rdrDayInRange::after {
                  content: none !important;
                }
                .rdrDayStartOfMonth,
                .rdrDayEndOfMonth {
                  background-color: transparent;
                }
                .rdrDaySelected {
                  background-color: #6366f1 !important;
                  color: #ffffff !important;
                  border-radius: 6px !important;
                  border: 1px solid #818cf8 !important;
                }
                .rdrDaySelected .rdrDayNumber {
                  color: #ffffff !important;
                }
                .rdrDayStartOfWeek,
                .rdrDayEndOfWeek {
                  border-radius: 6px;
                }
              `}</style>
              <DateRange
                editableDateInputs={false}
                onChange={(item) => setDateRangeState([item.selection])}
                moveRangeOnFirstSelection={false}
                ranges={dateRangeState}
                months={2}
                direction="horizontal"
                showMonthAndYearPickers={false}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowDateRangeModal(false)}
                className="flex-1 px-4 py-2 border border-indigo-500/30 text-indigo-300 rounded-lg hover:bg-slate-700/50 hover:border-indigo-500/50 transition font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={addDateRangeFromModal}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition flex items-center justify-center gap-2 font-medium text-sm shadow-lg shadow-indigo-500/20"
              >
                <Calendar className="w-4 h-4" />
                Add Date Range
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedListing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl max-w-md w-full p-6 border border-indigo-500/30 shadow-2xl shadow-indigo-500/20">
            <div className="w-12 h-12 bg-rose-600/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/50">
              <Trash2 className="w-6 h-6 text-rose-400" />
            </div>
            <h3 className="text-xl font-bold text-indigo-100 text-center mb-2">
              Delete Stay
            </h3>
            <p className="text-indigo-300/70 text-center mb-6">
              Are you sure you want to delete "{selectedListing.title}"? This
              action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedListing(null);
                }}
                className="flex-1 px-6 py-3 border border-indigo-500/30 text-indigo-300 rounded-lg hover:bg-slate-700/50 hover:border-indigo-500/50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteStay(selectedListing)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-600 to-rose-500 text-white rounded-lg hover:from-rose-700 hover:to-rose-600 transition font-medium shadow-lg shadow-rose-500/20"
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
