import { useState } from "react";
import {
  Compass,
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
  Activity,
  Coffee,
  Utensils,
  Music,
  Palette,
  Mountain,
  Waves,
  ChevronLeft,
  ChevronRight,
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
import { uploadToCloudinary } from "../cloudinary/uploadFunction";
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
import { useEffect } from "react";

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

  // Add barangay (Filipino subdivision) if available
  if (address.barangay || address.neighbourhood) {
    components.push(address.barangay || address.neighbourhood);
  } else if (address.suburb || address.village) {
    components.push(address.suburb || address.village);
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

export default function HostMyExperiences() {
  const { isVerified } = useAuth();
  const { user, userData } = useAuth();

  const handleActionWithVerification = (action) => {
    if (!isVerified) {
      toast.warning("Please verify your account first", {
        position: "top-center",
      });
      return;
    }
    action();
  };

  const [experiences, setExperiences] = useState([
    // {
    //   id: 1,
    //   title: "Sunset Yacht Sailing",
    //   location: "Miami Beach, Florida",
    //   price: 150,
    //   duration: 3,
    //   maxGuests: 12,
    //   category: "Adventure",
    //   rating: 4.9,
    //   reviews: 156,
    //   status: "active",
    //   image:
    //     "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=400",
    //   bookings: 45,
    //   revenue: 6750,
    //   language: "English, Spanish",
    //   ageMin: 12,
    // },
    // {
    //   id: 2,
    //   title: "Italian Cooking Class",
    //   location: "Florence, Italy",
    //   price: 85,
    //   duration: 4,
    //   maxGuests: 8,
    //   category: "Food & Drink",
    //   rating: 5.0,
    //   reviews: 203,
    //   status: "active",
    //   image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400",
    //   bookings: 78,
    //   revenue: 6630,
    //   language: "English, Italian",
    //   ageMin: 18,
    // },
    // {
    //   id: 3,
    //   title: "Photography Walking Tour",
    //   location: "Tokyo, Japan",
    //   price: 65,
    //   duration: 2.5,
    //   maxGuests: 6,
    //   category: "Arts & Culture",
    //   rating: 4.8,
    //   reviews: 89,
    //   status: "inactive",
    //   image:
    //     "https://images.unsplash.com/photo-1503149779833-1de50ebe5f8a?w=400",
    //   bookings: 34,
    //   revenue: 2210,
    //   language: "English, Japanese",
    //   ageMin: 16,
    // },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    price: "",
    duration: "",
    maxGuests: "",
    category: "Adventure",
    description: "",
    language: "",
    ageMin: "",
    availableTimes: [],
    photos: [],
    thingsToKnow: [],
    activities: [],
    availableDates: [],
    discount: { type: "percentage", value: "" },
    promoCode: "",
  });

  // Image upload states
  const [previewImages, setPreviewImages] = useState([]);

  // New item input states
  const [newTime, setNewTime] = useState("");
  const [newThingToKnow, setNewThingToKnow] = useState("");
  const [newActivity, setNewActivity] = useState("");
  const [newIncluded, setNewIncluded] = useState("");
  const [newToBring, setNewToBring] = useState("");
  const [newAvailableDate, setNewAvailableDate] = useState("");
  const [newAvailableTime, setNewAvailableTime] = useState("");

  // Map-related state
  const [marker, setMarker] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch experiences from Firebase
  useEffect(() => {
    const getHostExperiences = async () => {
      if (!userData?.id) return;

      try {
        setIsLoading(true);
        const experiencesRef = collection(db, "listings");
        const q = query(
          experiencesRef,
          where("hostId", "==", userData.id),
          where("type", "==", "experiences"),
          where("isDraft", "==", false)
        );
        const querySnapshot = await getDocs(q);
        const data = await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const experienceData = { id: doc.id, ...doc.data() };

            // Fetch booking count for this experience
            const bookingsRef = collection(db, "bookings");
            const bookingQuery = query(
              bookingsRef,
              where("listing_id", "==", doc.id)
            );
            const bookingSnapshot = await getDocs(bookingQuery);
            const revenue = experienceData.price * bookingSnapshot.size;

            return {
              id: experienceData.id,
              ...experienceData,
              bookingCount: bookingSnapshot.size,
              revenue: revenue,
            };
          })
        );
        setExperiences(data);
      } catch (error) {
        console.error("Error fetching experiences:", error);
        toast.error("Failed to load experiences");
      } finally {
        setIsLoading(false);
      }
    };
    getHostExperiences();
  }, [userData]);
  console.log(experiences);
  console.log("hostId: " + userData.id);

  // Image upload handlers
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

  // Array item handlers
  const addTime = () => {
    if (newTime.trim()) {
      setFormData({
        ...formData,
        availableTimes: [...formData.availableTimes, newTime],
      });
      setNewTime("");
    }
  };

  const removeTime = (index) => {
    setFormData({
      ...formData,
      availableTimes: formData.availableTimes.filter((_, i) => i !== index),
    });
  };

  const addThingToKnow = () => {
    if (newThingToKnow.trim()) {
      setFormData({
        ...formData,
        thingsToKnow: [...formData.thingsToKnow, newThingToKnow],
      });
      setNewThingToKnow("");
    }
  };

  const removeThingToKnow = (index) => {
    setFormData({
      ...formData,
      thingsToKnow: formData.thingsToKnow.filter((_, i) => i !== index),
    });
  };

  const addActivity = () => {
    if (newActivity.trim()) {
      setFormData({
        ...formData,
        activities: [...formData.activities, newActivity],
      });
      setNewActivity("");
    }
  };

  const removeActivity = (index) => {
    setFormData({
      ...formData,
      activities: formData.activities.filter((_, i) => i !== index),
    });
  };

  const addIncluded = () => {
    if (newIncluded.trim()) {
      setFormData({
        ...formData,
        included: [...formData.included, newIncluded],
      });
      setNewIncluded("");
    }
  };

  const removeIncluded = (index) => {
    setFormData({
      ...formData,
      included: formData.included.filter((_, i) => i !== index),
    });
  };

  const addToBring = () => {
    if (newToBring.trim()) {
      setFormData({
        ...formData,
        toBring: [...formData.toBring, newToBring],
      });
      setNewToBring("");
    }
  };

  const removeToBring = (index) => {
    setFormData({
      ...formData,
      toBring: formData.toBring.filter((_, i) => i !== index),
    });
  };

  const addAvailableDate = () => {
    if (newAvailableDate.trim() && newAvailableTime.trim()) {
      const newDateTimeObj = {
        date: newAvailableDate,
        time: newAvailableTime,
      };
      setFormData({
        ...formData,
        availableDates: [...formData.availableDates, newDateTimeObj],
      });
      setNewAvailableDate("");
      setNewAvailableTime("");
    } else if (newAvailableDate.trim() && !newAvailableTime.trim()) {
      toast.warning("Please select a time for this date");
    } else if (!newAvailableDate.trim() && newAvailableTime.trim()) {
      toast.warning("Please select a date for this time");
    }
  };

  const removeAvailableDate = (index) => {
    setFormData({
      ...formData,
      availableDates: formData.availableDates.filter((_, i) => i !== index),
    });
  };

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
    { name: "Adventure", icon: Mountain },
    { name: "Food & Drink", icon: Utensils },
    { name: "Arts & Culture", icon: Palette },
    { name: "Entertainment", icon: Music },
    { name: "Wellness", icon: Activity },
    { name: "Sports", icon: Waves },
  ];

  // Filter and search experiences
  const filteredExperiences = experiences.filter((exp) => {
    const matchesSearch =
      exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || exp.status === filterStatus;
    const matchesCategory =
      filterCategory === "all" || exp.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterCategory]);

  // Pagination logic
  const totalPages = Math.ceil(filteredExperiences.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedExperiences = filteredExperiences.slice(startIndex, endIndex);

  // Handle Add Experience
  const handleAddExperience = async (isDraft = false) => {
    try {
      // Validate required fields
      if (!formData.title || !formData.location) {
        toast.error("Please fill in Title and Location first.");
        return;
      }

      const loadingToast = toast.loading(
        "Uploading images and creating experience..."
      );

      // Upload images to Cloudinary
      let imageUrls = [];
      if (formData.photos && formData.photos.length > 0) {
        try {
          const uploadPromises = formData.photos.map((file) =>
            uploadToCloudinary(file)
          );
          imageUrls = await Promise.all(uploadPromises);
        } catch (uploadError) {
          toast.dismiss(loadingToast);
          toast.error("Failed to upload images. Please try again.");
          return;
        }
      }

      // Prepare data
      const newExperience = {
        title: formData.title || "",
        description: formData.description || "",
        location: formData.location || "",
        price: Number(formData.price) || 0,
        duration: Number(formData.duration) || 0,
        maxGuests: Number(formData.maxGuests) || 1,
        category: formData.category || "Adventure",
        language: formData.language || "",
        ageMin: Number(formData.ageMin) || 0,
        availableTimes: Array.isArray(formData.availableTimes)
          ? formData.availableTimes
          : [],
        availableDates: Array.isArray(formData.availableDates)
          ? formData.availableDates
          : [],
        thingsToKnow: Array.isArray(formData.thingsToKnow)
          ? formData.thingsToKnow
          : [],
        activities: Array.isArray(formData.activities)
          ? formData.activities
          : [],
        included: Array.isArray(formData.included) ? formData.included : [],
        toBring: Array.isArray(formData.toBring) ? formData.toBring : [],
        photos: imageUrls && imageUrls.length > 0 ? imageUrls : [],
        discount: {
          type: formData.discount?.type || "percentage",
          value: Number(formData.discount?.value) || 0,
        },
        promoCode: formData.promoCode || null,
        rating: 0,
        isDraft: !!isDraft,
        status: "active",
        type: "experiences",
        hostId: userData.id || "unknown",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Remove undefined values
      const sanitizeData = (obj) =>
        Object.entries(obj).reduce((acc, [key, value]) => {
          if (value !== undefined) acc[key] = value;
          return acc;
        }, {});

      const cleanExperience = sanitizeData(newExperience);

      // Add to Firestore
      const docRef = await addDoc(collection(db, "listings"), cleanExperience);

      // Add to local state ONLY if not a draft
      if (!isDraft) {
        setExperiences((prev) => [
          { id: docRef.id, ...cleanExperience },
          ...prev,
        ]);
      }

      toast.dismiss(loadingToast);
      toast.success(
        isDraft ? "Draft saved successfully!" : "Experience added successfully!"
      );

      // Reset form and UI
      resetForm();
      setShowAddModal(false);
      setPreviewImages([]);
      setMarker(null);
    } catch (error) {
      console.error("Error adding experience:", error);
      toast.dismiss();
      toast.error("Failed to add experience. Please try again.");
    }
  };

  // Handle Edit Experience
  const handleEditExperience = async () => {
    try {
      const loadingToast = toast.loading("Updating experience...");

      // Separate existing URLs from new File objects
      const existingPhotos = formData.photos.filter(
        (p) => typeof p === "string"
      );
      const newPhotoFiles = formData.photos.filter((p) => p instanceof File);

      // Upload new images to Cloudinary
      let newImageUrls = [];
      if (newPhotoFiles.length > 0) {
        try {
          const uploadPromises = newPhotoFiles.map((file) =>
            uploadToCloudinary(file)
          );
          newImageUrls = await Promise.all(uploadPromises);
        } catch (uploadError) {
          toast.dismiss(loadingToast);
          toast.error("Failed to upload new images. Please try again.");
          return;
        }
      }

      // Combine existing photos with newly uploaded ones
      const allPhotos = [...existingPhotos, ...newImageUrls];

      // Prepare updated data
      const updatedData = {
        title: formData.title,
        location: formData.location,
        price: parseFloat(formData.price),
        duration: parseFloat(formData.duration),
        maxGuests: parseInt(formData.maxGuests),
        category: formData.category,
        language: formData.language,
        ageMin: parseInt(formData.ageMin),
        activities: Array.isArray(formData.activities)
          ? formData.activities
          : [],
        availableDates: Array.isArray(formData.availableDates)
          ? formData.availableDates
          : [],
        thingsToKnow: Array.isArray(formData.thingsToKnow)
          ? formData.thingsToKnow
          : [],
        photos: allPhotos,
        discount: {
          type: formData.discount?.type || "percentage",
          value: Number(formData.discount?.value) || 0,
        },
        promoCode: formData.promoCode || null,
        updatedAt: serverTimestamp(),
      };

      // Update in Firestore
      const docRef = doc(db, "listings", selectedExperience.id);
      await updateDoc(docRef, updatedData);

      // Update local state
      const updatedExperiences = experiences.map((exp) =>
        exp.id === selectedExperience.id ? { ...exp, ...updatedData } : exp
      );
      setExperiences(updatedExperiences);

      toast.dismiss(loadingToast);
      toast.success("Experience updated successfully!");
      setShowEditModal(false);
      setPreviewImages([]);
      resetForm();
    } catch (error) {
      console.error("Error updating experience:", error);
      toast.dismiss();
      toast.error("Failed to update experience. Please try again.");
    }
  };

  // Handle Delete Experience
  const handleDeleteExperience = async () => {
    try {
      const loadingToast = toast.loading("Deleting experience...");

      // Delete from Firestore
      const docRef = doc(db, "listings", selectedExperience.id);
      await deleteDoc(docRef);

      // Update local state
      setExperiences(
        experiences.filter((exp) => exp.id !== selectedExperience.id)
      );

      toast.dismiss(loadingToast);
      toast.success("Experience deleted successfully!");
      setShowDeleteModal(false);
      setSelectedExperience(null);
    } catch (error) {
      console.error("Error deleting experience:", error);
      toast.error("Failed to delete experience. Please try again.");
    }
  };

  // Toggle Experience Status
  const toggleStatus = async (id) => {
    try {
      const experience = experiences.find((exp) => exp.id === id);
      if (!experience) return;

      const newStatus = experience.status === "active" ? "inactive" : "active";

      // Update in Firestore
      const docRef = doc(db, "listings", id);
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      // Update local state
      setExperiences(
        experiences.map((exp) =>
          exp.id === id ? { ...exp, status: newStatus } : exp
        )
      );

      toast.success(
        `Experience ${
          newStatus === "active" ? "activated" : "deactivated"
        } successfully!`
      );
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Failed to update status. Please try again.");
    }
  };

  // Open Edit Modal
  const openEditModal = (exp) => {
    setSelectedExperience(exp);
    setFormData({
      title: exp.title,
      location: exp.location,
      price: exp.price,
      duration: exp.duration,
      maxGuests: exp.maxGuests,
      category: exp.category,
      language: exp.language,
      ageMin: exp.ageMin,
      activities: Array.isArray(exp.activities) ? exp.activities : [],
      availableDates: Array.isArray(exp.availableDates)
        ? exp.availableDates
        : [],
      description: exp.description || "",
      availableTimes: Array.isArray(exp.availableTimes)
        ? exp.availableTimes
        : [],
      thingsToKnow: Array.isArray(exp.thingsToKnow) ? exp.thingsToKnow : [],
      included: Array.isArray(exp.included) ? exp.included : [],
      toBring: Array.isArray(exp.toBring) ? exp.toBring : [],
      photos: Array.isArray(exp.photos) ? exp.photos : [],
      discount: exp.discount || { type: "percentage", value: "" },
      promoCode: exp.promoCode || "",
    });
    setShowEditModal(true);
  };

  // Open Delete Modal
  const openDeleteModal = (exp) => {
    setSelectedExperience(exp);
    setShowDeleteModal(true);
  };

  // Reset Form
  const resetForm = () => {
    setFormData({
      title: "",
      location: "",
      price: "",
      duration: "",
      maxGuests: "",
      category: "Adventure",
      description: "",
      language: "",
      ageMin: "",
      availableTimes: [],
      availableDates: [],
      thingsToKnow: [],
      activities: [],
      included: [],
      toBring: [],
      photos: [],
      discount: { type: "percentage", value: "" },
      promoCode: "",
    });
    setPreviewImages([]);
    setMarker(null);
    setNewTime("");
    setNewThingToKnow("");
    setNewActivity("");
    setNewIncluded("");
    setNewToBring("");
    setNewAvailableDate("");
    setNewAvailableTime("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 pb-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 lg:pt-40">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-indigo-200 bg-clip-text text-transparent flex items-center gap-3">
              My Experiences
            </h1>
            <p className="text-indigo-300/60 mt-1">
              Manage your unique activities and tours
            </p>
          </div>
          <button
            onClick={() =>
              handleActionWithVerification(() => setShowAddModal(true))
            }
            className="mt-4 md:mt-0 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition flex items-center gap-2 font-medium shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-5 h-5" />
            Add New Experience
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl shadow-lg shadow-indigo-500/10 p-6 border border-indigo-500/20 backdrop-blur-sm hover:border-indigo-500/40 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-300/70 text-sm">Total Experiences</p>
                <h3 className="text-2xl font-bold text-indigo-100 mt-1">
                  {experiences.length}
                </h3>
              </div>
              <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center border border-indigo-500/30">
                <Compass className="w-6 h-6 text-indigo-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl shadow-lg shadow-green-500/10 p-6 border border-green-500/20 backdrop-blur-sm hover:border-green-500/40 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300/70 text-sm">Active Experiences</p>
                <h3 className="text-2xl font-bold text-green-100 mt-1">
                  {experiences.filter((e) => e.status === "active").length}
                </h3>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center border border-green-500/30">
                <Eye className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl shadow-lg shadow-orange-500/10 p-6 border border-orange-500/20 backdrop-blur-sm hover:border-orange-500/40 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-300/70 text-sm">Total Bookings</p>
                <h3 className="text-2xl font-bold text-orange-100 mt-1">
                  {experiences.reduce((sum, exp) => sum + (exp.bookingCount || 0), 0)}
                </h3>
              </div>
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center border border-orange-500/30">
                <Calendar className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl shadow-lg shadow-pink-500/10 p-6 border border-pink-500/20 backdrop-blur-sm hover:border-pink-500/40 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-300/70 text-sm">Total Revenue</p>
                <h3 className="text-2xl font-bold text-pink-100 mt-1">
                  ₱
                  {experiences
                    .reduce((sum, exp) => sum + (exp.revenue || 0), 0)
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
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-300/50" />
              <input
                type="text"
                placeholder="Search experiences by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-indigo-300/70" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100"
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
                className="px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Experiences Grid */}
        {isLoading ? (
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl shadow-lg shadow-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm p-12 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
            <h3 className="text-xl font-semibold text-indigo-100 mb-2">
              Loading your experiences...
            </h3>
            <p className="text-indigo-300/60">
              Please wait while we fetch your listings
            </p>
          </div>
        ) : filteredExperiences.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl shadow-lg shadow-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm p-12 text-center">
            <Compass className="w-16 h-16 text-indigo-300/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-indigo-100 mb-2">
              No experiences found
            </h3>
            <p className="text-indigo-300/60 mb-6">
              {searchTerm || filterStatus !== "all" || filterCategory !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by adding your first experience"}
            </p>
            {!searchTerm &&
              filterStatus === "all" &&
              filterCategory === "all" && (
                <button
                  onClick={() =>
                    handleActionWithVerification(() => setShowAddModal(true))
                  }
                  className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 shadow-lg shadow-indigo-500/20 text-white px-6 py-3 rounded-lg transition inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Your First Experience
                </button>
              )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {paginatedExperiences.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-lg shadow-lg shadow-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm overflow-hidden hover:shadow-xl transition group"
                >
                  {/* Image */}
                  <div className="relative h-40 overflow-hidden">
                  <img
                    src={exp.photos?.[0] || exp.images?.[0] || "https://via.placeholder.com/400x300?text=No+Image"}
                    alt={exp.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-600 text-white">
                      {exp.category}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium   ${
                        exp.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {exp.status}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-indigo-100 mb-1">
                    {exp.title}
                  </h3>
                  <p className="text-sm text-indigo-300/60 flex items-center gap-1 mb-3">
                    <MapPin className="w-4 h-4" />
                    {exp.location}
                  </p>

                  {/* Details */}
                  <div className="flex items-center gap-4 text-sm text-indigo-300/60 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {exp.duration}h
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {exp.maxGuests} guests
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      {exp.ageMin}+
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-indigo-500/20">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold text-indigo-100">
                        {exp.rating}
                      </span>
                      <span className="text-indigo-300/60 text-sm">
                        ({exp.reviews})
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-indigo-100">
                        ₱{(exp.price || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-indigo-300/60">per person</p>
                    </div>
                  </div>

                  {/* Performance */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-indigo-500/20 border border-indigo-500/30 rounded-lg p-2">
                      <p className="text-xs text-indigo-300/70">Bookings</p>
                      <p className="font-semibold text-indigo-300">
                        {exp.bookingCount || 0}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg p-2">
                      <p className="text-xs text-green-300/70">Revenue</p>
                      <p className="font-semibold text-green-300">
                        ₱{(exp.revenue || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleStatus(exp.id)}
                      className={`flex-1 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2   ₱{
                        exp.status === "active"
                          ? "bg-slate-700/50 text-indigo-300 hover:bg-slate-600/50 border border-slate-600/50"
                          : "bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/30"
                      }`}
                    >
                      {exp.status === "active" ? (
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
                      onClick={() => openEditModal(exp)}
                      className="px-4 py-2 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-lg transition"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(exp)}
                      className="px-4 py-2 bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 rounded-lg transition"
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

      {/* Add Experience Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-[1000] bg-slate-800 border-b border-indigo-500/20 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-indigo-100">
                Add New Experience
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-indigo-300/50 hover:text-indigo-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  Experience Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Sunset Yacht Sailing"
                  className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  Location *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Type a location or click on map"
                    className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40"
                  />

                  {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute w-full bg-slate-700 border border-indigo-500/30 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto z-[999]">
                      {suggestions.map((place) => (
                        <li
                          key={place.place_id}
                          onClick={() => handleSelect(place)}
                          className="px-4 py-2 hover:bg-indigo-500/20 cursor-pointer text-sm text-indigo-300"
                        >
                          {place.display_name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div
                  className="mt-4 rounded-xl overflow-hidden border border-indigo-500/30 relative"
                  style={{ zIndex: 1 }}
                >
                  <MapContainer
                    center={marker || defaultCenter}
                    zoom={10}
                    scrollWheelZoom={false}
                    zoomControl={false}
                    style={{
                      height: "350px",
                      width: "100%",
                      position: "relative",
                    }}
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
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40"
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
                  <label className="block text-sm font-medium text-indigo-300 mb-2">
                    Price per Person *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-300/50" />
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      placeholder="150"
                      className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">
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
                    className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">
                    Max Guests *
                  </label>
                  <input
                    type="number"
                    value={formData.maxGuests}
                    onChange={(e) =>
                      setFormData({ ...formData, maxGuests: e.target.value })
                    }
                    placeholder="12"
                    className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">
                    Minimum Age *
                  </label>
                  <input
                    type="number"
                    value={formData.ageMin}
                    onChange={(e) =>
                      setFormData({ ...formData, ageMin: e.target.value })
                    }
                    placeholder="12"
                    className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  Languages Offered *
                </label>
                <input
                  type="text"
                  value={formData.language}
                  onChange={(e) =>
                    setFormData({ ...formData, language: e.target.value })
                  }
                  placeholder="e.g., English, Spanish"
                  className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe your experience..."
                  rows="4"
                  className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  Activities
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newActivity}
                    onChange={(e) => setNewActivity(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addActivity()}
                    placeholder="e.g., Swimming, Hiking"
                    className="flex-1 px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40"
                  />
                  <button
                    type="button"
                    onClick={addActivity}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formData.activities.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.activities.map((activity, i) => (
                      <div
                        key={i}
                        className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                      >
                        {activity}
                        <button
                          type="button"
                          onClick={() => removeActivity(i)}
                          className="hover:text-indigo-900"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  Available Dates & Times
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newAvailableDate}
                    onChange={(e) => setNewAvailableDate(e.target.value)}
                    className="flex-1 px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40"
                    placeholder="Select date"
                  />
                  <input
                    type="time"
                    value={newAvailableTime}
                    onChange={(e) => setNewAvailableTime(e.target.value)}
                    className="flex-1 px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40"
                    placeholder="Select time"
                  />
                  <button
                    type="button"
                    onClick={addAvailableDate}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formData.availableDates.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.availableDates.map((dateTime, i) => (
                      <div
                        key={i}
                        className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                      >
                        {new Date(dateTime.date).toLocaleDateString()} at{" "}
                        {dateTime.time}
                        <button
                          type="button"
                          onClick={() => removeAvailableDate(i)}
                          className="hover:text-green-900"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  Things to Know
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newThingToKnow}
                    onChange={(e) => setNewThingToKnow(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addThingToKnow()}
                    placeholder="e.g., Bring sunscreen, Wear comfortable shoes"
                    className="flex-1 px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40"
                  />
                  <button
                    type="button"
                    onClick={addThingToKnow}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formData.thingsToKnow.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.thingsToKnow.map((thing, i) => (
                      <div
                        key={i}
                        className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                      >
                        {thing}
                        <button
                          type="button"
                          onClick={() => removeThingToKnow(i)}
                          className="hover:text-amber-900"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                    <option value="percentage" className="bg-slate-800 text-indigo-100">
                      Percentage
                    </option>
                    <option value="fixed" className="bg-slate-800 text-indigo-100">
                      Fixed
                    </option>
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

              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  Photos
                </label>
                <div
                  onClick={() => document.getElementById("photoInput").click()}
                  className="border-2 border-dashed border-indigo-500/30 rounded-lg p-8 text-center hover:border-indigo-500 transition cursor-pointer"
                >
                  <Upload className="w-12 h-12 text-indigo-300/50 mx-auto mb-3" />
                  <p className="text-indigo-300/60 text-sm">
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

            <div className="sticky bottom-0 z-[999] bg-slate-900 border-t border-indigo-500/20 p-6 flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="flex-1 px-6 py-3 border border-indigo-500/30 text-indigo-300 rounded-lg hover:bg-slate-700/50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAddExperience(true)}
                className="flex-1 px-6 py-3 border border-indigo-500/50 text-indigo-300 rounded-lg hover:bg-indigo-500/20 transition font-medium flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save as Draft
              </button>
              <button
                onClick={() => handleAddExperience(false)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 shadow-lg shadow-indigo-500/20 text-white rounded-lg transition font-medium flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Add Experience
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Experience Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-[1000] bg-slate-800 border-b border-indigo-500/20 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-indigo-100">
                Edit Experience
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                className="text-indigo-300/50 hover:text-indigo-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  Experience Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  Location *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Type a location or click on map"
                    className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40"
                  />

                  {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute w-full bg-slate-700 border border-indigo-500/30 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto z-[999]">
                      {suggestions.map((place) => (
                        <li
                          key={place.place_id}
                          onClick={() => handleSelect(place)}
                          className="px-4 py-2 hover:bg-indigo-500/20 cursor-pointer text-sm text-indigo-300"
                        >
                          {place.display_name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div
                  className="mt-4 rounded-xl overflow-hidden border border-indigo-500/30 relative"
                  style={{ zIndex: 1 }}
                >
                  <MapContainer
                    center={marker || defaultCenter}
                    zoom={10}
                    scrollWheelZoom={false}
                    zoomControl={false}
                    style={{
                      height: "350px",
                      width: "100%",
                      position: "relative",
                    }}
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
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40"
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
                  <label className="block text-sm font-medium text-indigo-300 mb-2">
                    Price per Person *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-300/50" />
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">
                    Duration (hours) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">
                    Max Guests *
                  </label>
                  <input
                    type="number"
                    value={formData.maxGuests}
                    onChange={(e) =>
                      setFormData({ ...formData, maxGuests: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">
                    Minimum Age *
                  </label>
                  <input
                    type="number"
                    value={formData.ageMin}
                    onChange={(e) =>
                      setFormData({ ...formData, ageMin: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  Languages Offered *
                </label>
                <input
                  type="text"
                  value={formData.language}
                  onChange={(e) =>
                    setFormData({ ...formData, language: e.target.value })
                  }
                  placeholder="e.g., English, Japanese"
                  className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  Activities
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newActivity}
                    onChange={(e) => setNewActivity(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addActivity()}
                    placeholder="e.g., Swimming, Hiking"
                    className="flex-1 px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40"
                  />
                  <button
                    type="button"
                    onClick={addActivity}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formData.activities.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.activities.map((activity, i) => (
                      <div
                        key={i}
                        className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                      >
                        {activity}
                        <button
                          type="button"
                          onClick={() => removeActivity(i)}
                          className="hover:text-indigo-900"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                    className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount</option>
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
                    placeholder="Enter discount value"
                    className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40"
                  />
                </div>
              </div>

              {/* Promo Code */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  Promo Code (Optional)
                </label>
                <input
                  type="text"
                  value={formData.promoCode || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      promoCode: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="e.g., SAVE10"
                  className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  Available Dates & Times
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newAvailableDate}
                    onChange={(e) => setNewAvailableDate(e.target.value)}
                    className="flex-1 px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40"
                    placeholder="Select date"
                  />
                  <input
                    type="time"
                    value={newAvailableTime}
                    onChange={(e) => setNewAvailableTime(e.target.value)}
                    className="flex-1 px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40"
                    placeholder="Select time"
                  />
                  <button
                    type="button"
                    onClick={addAvailableDate}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formData.availableDates.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.availableDates.map((dateTime, i) => (
                      <div
                        key={i}
                        className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                      >
                        {new Date(dateTime.date).toLocaleDateString()} at{" "}
                        {dateTime.time}
                        <button
                          type="button"
                          onClick={() => removeAvailableDate(i)}
                          className="hover:text-green-900"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  Things to Know
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newThingToKnow}
                    onChange={(e) => setNewThingToKnow(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addThingToKnow()}
                    placeholder="e.g., Bring sunscreen, Wear comfortable shoes"
                    className="flex-1 px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40"
                  />
                  <button
                    type="button"
                    onClick={addThingToKnow}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formData.thingsToKnow.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.thingsToKnow.map((thing, i) => (
                      <div
                        key={i}
                        className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                      >
                        {thing}
                        <button
                          type="button"
                          onClick={() => removeThingToKnow(i)}
                          className="hover:text-amber-900"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  Photos
                </label>

                {/* Existing Photos */}
                {formData.photos &&
                  formData.photos.length > 0 &&
                  formData.photos.some((p) => typeof p === "string") && (
                    <div className="mb-4">
                      <p className="text-xs text-indigo-300/60 mb-2">
                        Current Photos
                      </p>
                      <div className="grid grid-cols-3 gap-4">
                        {formData.photos.map(
                          (photo, i) =>
                            typeof photo === "string" && (
                              <div key={i} className="relative">
                                <img
                                  src={photo}
                                  alt={`Existing ${i}`}
                                  className="rounded-lg object-cover w-full h-32"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      photos: formData.photos.filter(
                                        (_, idx) => idx !== i
                                      ),
                                    });
                                  }}
                                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )
                        )}
                      </div>
                    </div>
                  )}

                {/* Add New Photos */}
                <div
                  onClick={() =>
                    document.getElementById("editPhotoInput").click()
                  }
                  className="border-2 border-dashed border-indigo-500/30 rounded-lg p-8 text-center hover:border-indigo-500 transition cursor-pointer"
                >
                  <Upload className="w-12 h-12 text-indigo-300/50 mx-auto mb-3" />
                  <p className="text-indigo-300/60 text-sm">
                    Click to add new photos
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

                {/* New Photo Previews */}
                {previewImages.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-indigo-300/60 mb-2">
                      New Photos to Upload
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                      {previewImages.map((src, i) => (
                        <div key={i} className="relative">
                          <img
                            src={src}
                            alt={`Preview ${i}`}
                            className="rounded-lg object-cover w-full h-32"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="absolute top-2 right-2 bg-white rounded-full p-1 shadow"
                          >
                            <X className="w-4 h-4 text-slate-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 z-[999] bg-slate-900 border-t border-indigo-500/20 p-6 flex gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                className="flex-1 px-6 py-3 border border-indigo-500/30 text-indigo-300 rounded-lg hover:bg-slate-700/50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleEditExperience}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 shadow-lg shadow-indigo-500/20 text-white rounded-lg transition font-medium flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedExperience && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl max-w-md w-full p-6 text-center shadow-lg">
            <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-indigo-100 mb-2">
              Delete Experience
            </h2>
            <p className="text-indigo-300 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{selectedExperience.title}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-6 py-3 border border-indigo-500/30 text-indigo-300 rounded-lg hover:bg-slate-700/50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteExperience}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
