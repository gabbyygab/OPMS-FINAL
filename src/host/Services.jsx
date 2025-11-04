import { useState, useEffect } from "react";
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
  Check,
  Info,
  Shield,
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
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  doc,
  query,
  where,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

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
        await new Promise((resolve) => setTimeout(resolve, 300));
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
        );
        if (!res.ok) throw new Error("Geocoding failed");

        const data = await res.json();
        const parsedAddress = parseNominatimAddress(data);
        const placeName =
          parsedAddress || data.display_name || `${lat}, ${lng}`;

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
  const { isVerified, userData } = useAuth();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleActionWithVerification = (action) => {
    if (!isVerified) {
      toast.warning("Please verify your account first", {
        position: "top-center",
      });
      return;
    }
    action();
  };

  // State management
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    location: "",
    basePrice: "",
    duration: "",
    category: "Home Services",
    description: "",
    availableDates: [],
    responseTime: "",
    photos: [],
    serviceTypes: [],
    highlights: [],
    serviceAreas: [],
    certifications: [],
    terms: [],
    experienceYears: "",
    completedJobs: "",
    isVerified: false,
    discount: { type: "percentage", value: "" },
    promoCode: "",
  });

  const [newServiceType, setNewServiceType] = useState("");
  const [newHighlight, setNewHighlight] = useState("");
  const [newServiceArea, setNewServiceArea] = useState("");
  const [newCertification, setNewCertification] = useState("");
  const [newTerm, setNewTerm] = useState("");

  // Date range state
  const [newDateRangeStart, setNewDateRangeStart] = useState("");
  const [newDateRangeEnd, setNewDateRangeEnd] = useState("");
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [dateRangeState, setDateRangeState] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);

  // Map-related state
  const [marker, setMarker] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Track mouse position for interactive gradient background
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Fetch services from Firebase
  useEffect(() => {
    if (!userData?.id) return;
    fetchHostServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  // Fetch services from Firebase
  const fetchHostServices = async () => {
    try {
      setIsLoading(true);
      const servicesRef = collection(db, "listings");
      const q = query(
        servicesRef,
        where("hostId", "==", userData.id),
        where("isDraft", "==", false),
        where("type", "==", "services")
      );
      const querySnapshot = await getDocs(q);
      const data = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const serviceData = { id: doc.id, ...doc.data() };

          // Fetch booking count
          const bookingsRef = collection(db, "bookings");
          const bookingQuery = query(
            bookingsRef,
            where("listing_id", "==", doc.id)
          );
          const bookingSnapshot = await getDocs(bookingQuery);
          const revenue =
            (serviceData.price || serviceData.basePrice || 0) *
            bookingSnapshot.size;

          return {
            id: serviceData.id,
            ...serviceData,
            bookingCount: bookingSnapshot.size,
            revenue: revenue,
          };
        })
      );

      setServices(data);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Failed to load services");
    } finally {
      setIsLoading(false);
    }
  };

  // Image upload handler
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newPreviews = files.map((file) => URL.createObjectURL(file));

    setPreviewImages((prev) => [...prev, ...newPreviews]);
    setImageFiles((prev) => [...prev, ...files]);

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

  // Map search handler
  const handleSearch = async (query) => {
    setFormData({ ...formData, location: query });
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

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
    }
  };

  const handleSelect = (place) => {
    setFormData({ ...formData, location: place.display_name });
    setMarker([parseFloat(place.lat), parseFloat(place.lon)]);
    setShowSuggestions(false);
  };

  // Array handlers
  const addServiceType = () => {
    if (newServiceType.trim()) {
      setFormData({
        ...formData,
        serviceTypes: [...formData.serviceTypes, newServiceType.trim()],
      });
      setNewServiceType("");
    }
  };

  const removeServiceType = (index) => {
    setFormData({
      ...formData,
      serviceTypes: formData.serviceTypes.filter((_, i) => i !== index),
    });
  };

  const addHighlight = () => {
    if (newHighlight.trim()) {
      setFormData({
        ...formData,
        highlights: [...formData.highlights, newHighlight.trim()],
      });
      setNewHighlight("");
    }
  };

  const removeHighlight = (index) => {
    setFormData({
      ...formData,
      highlights: formData.highlights.filter((_, i) => i !== index),
    });
  };

  const addServiceArea = () => {
    if (newServiceArea.trim()) {
      setFormData({
        ...formData,
        serviceAreas: [...formData.serviceAreas, newServiceArea.trim()],
      });
      setNewServiceArea("");
    }
  };

  const removeServiceArea = (index) => {
    setFormData({
      ...formData,
      serviceAreas: formData.serviceAreas.filter((_, i) => i !== index),
    });
  };

  const addCertification = () => {
    if (newCertification.trim()) {
      setFormData({
        ...formData,
        certifications: [...formData.certifications, newCertification.trim()],
      });
      setNewCertification("");
    }
  };

  const removeCertification = (index) => {
    setFormData({
      ...formData,
      certifications: formData.certifications.filter((_, i) => i !== index),
    });
  };

  const addTerm = () => {
    if (newTerm.trim()) {
      setFormData({
        ...formData,
        terms: [...formData.terms, newTerm.trim()],
      });
      setNewTerm("");
    }
  };

  const removeTerm = (index) => {
    setFormData({
      ...formData,
      terms: formData.terms.filter((_, i) => i !== index),
    });
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

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterCategory]);

  // Pagination logic
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedServices = filteredServices.slice(startIndex, endIndex);

  // Handle Add Service
  const handleAddService = async (isDraft = false) => {
    try {
      if (!formData.title || !formData.location) {
        toast.error("Please fill in Title and Location first.");
        return;
      }

      // Comprehensive validation for non-draft listings
      if (!isDraft) {
        const missingFields = [];

        // Price validation
        if (!formData.basePrice || parseFloat(formData.basePrice) <= 0) {
          missingFields.push("Base Price (must be greater than 0)");
        }

        // Duration validation
        if (!formData.duration || parseFloat(formData.duration) <= 0) {
          missingFields.push("Duration (must be greater than 0 hours)");
        }

        // Category validation
        if (!formData.category) {
          missingFields.push("Category");
        }

        // Description validation
        if (!formData.description || formData.description.trim().length < 20) {
          missingFields.push("Description (must be at least 20 characters)");
        }

        // Response time validation
        if (!formData.responseTime || formData.responseTime.trim().length === 0) {
          missingFields.push("Response Time");
        }

        // Experience years validation
        if (!formData.experienceYears || parseInt(formData.experienceYears) < 0) {
          missingFields.push("Years of Experience (must be 0 or greater)");
        }

        // Completed jobs validation
        if (!formData.completedJobs || parseInt(formData.completedJobs) < 0) {
          missingFields.push("Completed Jobs (must be 0 or greater)");
        }

        // Available dates validation
        if (!formData.availableDates || formData.availableDates.length === 0) {
          missingFields.push("Available Dates (add at least one date range)");
        }

        // Service types validation
        if (!formData.serviceTypes || formData.serviceTypes.length === 0) {
          missingFields.push("Service Types (add at least one service type)");
        }

        // Highlights validation
        if (!formData.highlights || formData.highlights.length === 0) {
          missingFields.push("Highlights (add at least one highlight)");
        }

        // Service areas validation
        if (!formData.serviceAreas || formData.serviceAreas.length === 0) {
          missingFields.push("Service Areas (add at least one service area)");
        }

        // Photos validation
        if (!imageFiles || imageFiles.length === 0) {
          missingFields.push("Photos (upload at least one photo)");
        }

        // If there are missing fields, show error
        if (missingFields.length > 0) {
          toast.error(
            `Please complete the following required fields:\n${missingFields.join(", ")}`,
            { autoClose: 8000 }
          );
          return;
        }
      }

      const loadingToast = toast.loading(
        "Uploading images and creating service..."
      );

      // Upload images to Cloudinary
      let imageUrls = [];
      if (imageFiles.length > 0) {
        try {
          const uploadPromises = imageFiles.map((file) =>
            uploadToCloudinary(file)
          );
          imageUrls = await Promise.all(uploadPromises);
        } catch {
          toast.dismiss(loadingToast);
          toast.error("Failed to upload images. Please try again.");
          return;
        }
      }

      // Prepare data
      const newService = {
        title: formData.title || "",
        description: formData.description || "",
        location: formData.location || "",
        price: Number(formData.basePrice) || 0,
        duration: Number(formData.duration) || 0,
        category: formData.category || "Home Services",
        availableDates: Array.isArray(formData.availableDates)
          ? formData.availableDates
          : [],
        responseTime: formData.responseTime || "",
        photos: imageUrls && imageUrls.length > 0 ? imageUrls : [],
        serviceTypes: Array.isArray(formData.serviceTypes)
          ? formData.serviceTypes
          : [],
        highlights: Array.isArray(formData.highlights)
          ? formData.highlights
          : [],
        serviceAreas: Array.isArray(formData.serviceAreas)
          ? formData.serviceAreas
          : [],
        certifications: Array.isArray(formData.certifications)
          ? formData.certifications
          : [],
        terms: Array.isArray(formData.terms) ? formData.terms : [],
        experienceYears: Number(formData.experienceYears) || 0,
        completedJobs: Number(formData.completedJobs) || 0,
        discount: {
          type: formData.discount?.type || "percentage",
          value: Number(formData.discount?.value) || 0,
        },
        promoCode: formData.promoCode || null,
        isVerified: isVerified,
        isDraft: !!isDraft,
        status: "active",
        type: "services",
        hostId: userData.id || "unknown",
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };

      // Sanitize data
      const sanitizeData = (obj) =>
        Object.entries(obj).reduce((acc, [key, value]) => {
          if (value !== undefined) acc[key] = value;
          return acc;
        }, {});

      const cleanService = sanitizeData(newService);

      // Add to Firestore
      const docRef = await addDoc(collection(db, "listings"), cleanService);

      // Add to local state ONLY if not a draft
      if (!isDraft) {
        setServices((prev) => [{ id: docRef.id, ...cleanService }, ...prev]);
      }

      toast.dismiss(loadingToast);
      toast.success(
        isDraft ? "Draft saved successfully!" : "Service added successfully!"
      );

      resetForm();
      setShowAddModal(false);
      setPreviewImages([]);
      setImageFiles([]);
      setMarker(null);
    } catch (error) {
      console.error("Error adding service:", error);
      toast.dismiss();
      toast.error("Failed to add service. Please try again.");
    }
  };

  // Handle Edit Service
  const handleEditService = async () => {
    try {
      if (!formData.title || !formData.location) {
        toast.error("Please fill in required fields.");
        return;
      }

      const loadingToast = toast.loading("Saving changes...");

      // Separate existing URLs from new File objects
      const existingUrls = previewImages.filter(
        (img) => typeof img === "string" && img.startsWith("http")
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
        } catch {
          toast.dismiss(loadingToast);
          toast.error("Failed to upload images. Please try again.");
          return;
        }
      }

      // Combine existing URLs with newly uploaded URLs
      const allPhotos = [...existingUrls, ...newImageUrls];

      // Prepare data
      const updatedService = {
        title: formData.title || "",
        description: formData.description || "",
        location: formData.location || "",
        price: Number(formData.basePrice) || 0,
        duration: Number(formData.duration) || 0,
        category: formData.category || "Home Services",
        availableDates: Array.isArray(formData.availableDates)
          ? formData.availableDates
          : [],
        responseTime: formData.responseTime || "",
        photos: allPhotos.length > 0 ? allPhotos : selectedService.photos,
        serviceTypes: Array.isArray(formData.serviceTypes)
          ? formData.serviceTypes
          : [],
        highlights: Array.isArray(formData.highlights)
          ? formData.highlights
          : [],
        serviceAreas: Array.isArray(formData.serviceAreas)
          ? formData.serviceAreas
          : [],
        certifications: Array.isArray(formData.certifications)
          ? formData.certifications
          : [],
        terms: Array.isArray(formData.terms) ? formData.terms : [],
        experienceYears: Number(formData.experienceYears) || 0,
        completedJobs: Number(formData.completedJobs) || 0,
        discount: {
          type: formData.discount?.type || "percentage",
          value: Number(formData.discount?.value) || 0,
        },
        promoCode: formData.promoCode || null,
        isVerified: isVerified,
        isDraft: false,
        status: "active",
        type: "services",
        updated_at: serverTimestamp(),
      };

      // Sanitize data
      const sanitizeData = (obj) =>
        Object.entries(obj).reduce((acc, [key, value]) => {
          if (value !== undefined) acc[key] = value;
          return acc;
        }, {});

      const cleanService = sanitizeData(updatedService);

      const selectedId = selectedService.id;
      const serviceRef = doc(db, "listings", selectedId);
      await updateDoc(serviceRef, cleanService);

      // Update local state
      setServices((prev) =>
        prev.map((service) =>
          service.id === selectedId
            ? { id: selectedId, ...cleanService }
            : service
        )
      );

      toast.dismiss(loadingToast);
      toast.success("Service edited successfully!");

      resetForm();
      setShowEditModal(false);
      setPreviewImages([]);
      setImageFiles([]);
      setMarker(null);
    } catch (error) {
      console.error("Error editing service:", error);
      toast.dismiss();
      toast.error("Failed to edit service. Please try again.");
    }
  };

  // Handle Delete Service
  const handleDeleteService = async () => {
    try {
      const toastId = toast.loading("Deleting your service...", {
        position: "top-center",
      });

      const id = selectedService.id;
      await deleteDoc(doc(db, "listings", id));
      setServices((prev) => prev.filter((s) => s.id !== id));
      toast.update(toastId, {
        render: "Service deleted successfully.",
        type: "success",
        isLoading: false,
        autoClose: 2000,
        closeOnClick: true,
        draggable: true,
      });
      setShowDeleteModal(false);
    } catch (error) {
      toast.error("Failed to delete service. Please try again.", {
        position: "top-center",
      });
      console.error(error);
    }
  };

  // Toggle Service Status
  const toggleStatus = async (id) => {
    try {
      const service = services.find((s) => s.id === id);
      const newStatus = service.status === "active" ? "inactive" : "active";

      await updateDoc(doc(db, "listings", id), {
        status: newStatus,
        updated_at: serverTimestamp(),
      });

      setServices(
        services.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
      );
      toast.success(
        `Service ${
          newStatus === "active" ? "activated" : "deactivated"
        } successfully!`
      );
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Failed to update status");
    }
  };

  // Open Edit Modal
  const openEditModal = (service) => {
    setSelectedService(service);

    setFormData({
      title: service.title || "",
      location: service.location || "",
      basePrice: service.price || "",
      duration: service.duration || "",
      category: service.category || "Home Services",
      description: service.description || "",
      availableDates: Array.isArray(service.availableDates)
        ? service.availableDates
        : [],
      responseTime: service.responseTime || "",
      photos: service.photos || [],
      serviceTypes: Array.isArray(service.serviceTypes)
        ? service.serviceTypes
        : [],
      highlights: Array.isArray(service.highlights) ? service.highlights : [],
      serviceAreas: Array.isArray(service.serviceAreas)
        ? service.serviceAreas
        : [],
      certifications: Array.isArray(service.certifications)
        ? service.certifications
        : [],
      terms: Array.isArray(service.terms) ? service.terms : [],
      experienceYears: service.experienceYears || "",
      completedJobs: service.completedJobs || "",
      discount: service.discount || { type: "percentage", value: "" },
      promoCode: service.promoCode || "",
    });

    if (service.photos && service.photos.length > 0) {
      setPreviewImages(service.photos);
      setImageFiles(service.photos);
    } else {
      setPreviewImages([]);
      setImageFiles([]);
    }
    setShowEditModal(true);
  };

  // Open Delete Modal
  const openDeleteModal = (service) => {
    setSelectedService(service);
    setShowDeleteModal(true);
  };

  // Reset Form
  const addAvailableDate = () => {
    if (!newDateRangeStart || !newDateRangeEnd) {
      toast.error("Please select both start and end dates");
      return;
    }

    const startDate = new Date(newDateRangeStart);
    const endDate = new Date(newDateRangeEnd);

    if (startDate >= endDate) {
      toast.error("End date must be after start date");
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

  const removeAvailableDate = (index) => {
    setFormData({
      ...formData,
      availableDates: formData.availableDates.filter((_, i) => i !== index),
    });
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

  const resetForm = () => {
    setFormData({
      title: "",
      location: "",
      basePrice: "",
      duration: "",
      category: "Home Services",
      description: "",
      availableDates: [],
      responseTime: "",
      photos: [],
      serviceTypes: [],
      highlights: [],
      serviceAreas: [],
      certifications: [],
      terms: [],
      experienceYears: "",
      completedJobs: "",
      isVerified: false,
      discount: { type: "percentage", value: "" },
      promoCode: "",
    });
    setPreviewImages([]);
    setImageFiles([]);
    setMarker(null);
    setNewServiceType("");
    setNewHighlight("");
    setNewServiceArea("");
    setNewCertification("");
    setNewTerm("");
    setNewDateRangeStart("");
    setNewDateRangeEnd("");
    setShowDateRangeModal(false);
    setDateRangeState([
      {
        startDate: new Date(),
        endDate: new Date(),
        key: "selection",
      },
    ]);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 pb-12 overflow-hidden">
      {/* Interactive Mouse-Following Gradient Background */}
      <div
        className="absolute inset-0 transition-all duration-100 ease-out"
        style={{
          background: `radial-gradient(
            circle at ${mousePosition.x}% ${mousePosition.y}%,
            rgba(99, 102, 241, 0.15) 0%,
            rgba(168, 85, 247, 0.10) 25%,
            rgba(59, 130, 246, 0.05) 50%,
            rgba(15, 23, 42, 0) 100%
          ),
          linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)`,
        }}
      ></div>

      {/* Static gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-slate-900/30"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 lg:pt-40">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4 animate-fadeIn">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              My Services
            </h1>
            <p className="text-slate-400 mt-2 text-sm sm:text-base">
              Manage your professional services
            </p>
          </div>
          <button
            onClick={() =>
              handleActionWithVerification(() => setShowAddModal(true))
            }
            className="w-full md:w-auto mt-4 md:mt-0 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-all duration-500 transform hover:scale-105 flex items-center justify-center gap-2 font-bold shadow-lg shadow-indigo-500/30 border border-indigo-400/30"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Add New Service</span>
            <span className="sm:hidden">Add Service</span>
          </button>
        </div>

        {/* Stats Cards - Enhanced with Glassmorphism and Animations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div
            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-700 p-5 sm:p-6 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-slate-600 transition-all duration-300 animate-fadeIn"
            style={{ animationDelay: '0s' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Services</p>
                <h3 className="text-2xl font-bold text-white mt-1">
                  {services.length}
                </h3>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/40 backdrop-blur-sm">
                <Briefcase className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-400" />
              </div>
            </div>
          </div>

          <div
            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-700 p-5 sm:p-6 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-slate-600 transition-all duration-300 animate-fadeIn"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Active Services</p>
                <h3 className="text-2xl font-bold text-white mt-1">
                  {services.filter((s) => s.status === "active").length}
                </h3>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-500/20 rounded-xl flex items-center justify-center border border-green-500/40 backdrop-blur-sm">
                <Eye className="w-6 h-6 sm:w-7 sm:h-7 text-green-400" />
              </div>
            </div>
          </div>

          <div
            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-700 p-5 sm:p-6 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-slate-600 transition-all duration-300 animate-fadeIn"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Bookings</p>
                <h3 className="text-2xl font-bold text-white mt-1">
                  {services.reduce(
                    (sum, service) => sum + (service.bookingCount || 0),
                    0
                  )}
                </h3>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange-500/20 rounded-xl flex items-center justify-center border border-orange-500/40 backdrop-blur-sm">
                <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-orange-400" />
              </div>
            </div>
          </div>

          <div
            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-700 p-5 sm:p-6 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-slate-600 transition-all duration-300 animate-fadeIn"
            style={{ animationDelay: '0.3s' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Revenue</p>
                <h3 className="text-2xl font-bold text-white mt-1">
                  ₱
                  {services
                    .reduce((sum, service) => sum + (service.revenue || 0), 0)
                    .toLocaleString()}
                </h3>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-pink-500/20 rounded-xl flex items-center justify-center border border-pink-500/40 backdrop-blur-sm">
                <DollarSign className="w-6 h-6 sm:w-7 sm:h-7 text-pink-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter - Enhanced with Glassmorphism */}
        <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl rounded-2xl shadow-xl shadow-indigo-500/10 p-4 sm:p-6 border border-indigo-500/30 mb-6 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-300/50" />
              <input
                type="text"
                placeholder="Search services by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-indigo-300" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40"
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
                className="px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl shadow-lg shadow-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm p-12 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
            <h3 className="text-xl font-semibold text-indigo-100 mb-2">
              Loading your services...
            </h3>
            <p className="text-indigo-300/60">
              Please wait while we fetch your listings
            </p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl shadow-lg shadow-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm p-12 text-center">
            <Briefcase className="w-16 h-16 text-indigo-300/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-indigo-100 mb-2">
              No services found
            </h3>
            <p className="text-indigo-300/60 mb-6">
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
                  className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 shadow-lg shadow-indigo-500/20 text-white px-6 py-3 rounded-lg transition inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Your First Service
                </button>
              )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {paginatedServices.map((service) => (
                <div
                  key={service.id}
                  className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-lg shadow-lg shadow-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm overflow-hidden hover:shadow-indigo-500/20 transition"
                >
                  {/* Image */}
                  <div className="relative h-40 overflow-hidden bg-slate-700">
                    {service.photos?.length > 0 ||
                    service.images?.length > 0 ? (
                      <img
                        src={service.photos?.[0] || service.images?.[0]}
                        alt={service.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Briefcase className="w-12 h-12 text-indigo-400/30" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                        {service.category}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          service.status === "active"
                            ? "bg-green-500/20 text-green-300 border border-green-500/30"
                            : "bg-slate-500/20 text-slate-300 border border-slate-500/30"
                        }`}
                      >
                        {service.status}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-indigo-100 mb-1">
                      {service.title}
                    </h3>
                    <p className="text-sm text-indigo-300/70 flex items-center gap-1 mb-3">
                      <MapPin className="w-4 h-4" />
                      {service.location}
                    </p>

                    {/* Details */}
                    <div className="flex items-center gap-4 text-sm text-indigo-300/70 mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {service.duration || "N/A"}h
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {typeof service.availability === "string"
                          ? service.availability
                          : service.availability
                          ? "Custom Hours"
                          : "Flexible"}
                      </span>
                    </div>

                    {/* Price & Experience */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-indigo-500/20">
                      <div className="flex items-center gap-1">
                        <Award className="w-4 h-4 text-blue-400" />
                        <span className="font-semibold text-indigo-100 text-sm">
                          {service.experienceYears} yrs exp
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-indigo-100">
                          ₱{(service.price || 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-indigo-300/60">
                          per service
                        </p>
                      </div>
                    </div>

                    {/* Performance */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-slate-700/50 border border-indigo-500/20 rounded-lg p-2">
                        <p className="text-xs text-indigo-300/60">Bookings</p>
                        <p className="font-semibold text-blue-400">
                          {service.bookingCount || 0}
                        </p>
                      </div>
                      <div className="bg-slate-700/50 border border-indigo-500/20 rounded-lg p-2">
                        <p className="text-xs text-indigo-300/60">Revenue</p>
                        <p className="font-semibold text-green-400">
                          ₱{Number(service.revenue || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Response Time Badge */}
                    <div className="mb-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-medium rounded-full">
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
                            ? "bg-slate-700/50 text-slate-300 hover:bg-slate-700/70 border border-slate-500/30"
                            : "bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/30"
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
                        className="px-4 py-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(service)}
                        className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition"
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
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
                    )
                  )}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
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

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-indigo-500/30 shadow-2xl shadow-indigo-500/20">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-indigo-500/30 p-6 flex items-center justify-between z-[1000]">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-indigo-200 bg-clip-text text-transparent">
                Add New Service
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
                  Service Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Professional House Cleaning"
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

              {/* Category & Price & Duration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 transition"
                  >
                    {categories.map((cat) => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">
                    Base Price (₱) *
                  </label>
                  <input
                    type="number"
                    value={formData.basePrice}
                    onChange={(e) =>
                      setFormData({ ...formData, basePrice: e.target.value })
                    }
                    placeholder="120"
                    className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                  />
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
                    className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                  />
                </div>
              </div>

              {/* Response Time & Experience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">
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
                    className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">
                    Experience (years)
                  </label>
                  <input
                    type="number"
                    value={formData.experienceYears}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        experienceYears: e.target.value,
                      })
                    }
                    placeholder="5"
                    className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                  />
                </div>
              </div>

              {/* Available Dates */}
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

              {/* Completed Jobs */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  Completed Jobs
                </label>
                <input
                  type="number"
                  value={formData.completedJobs}
                  onChange={(e) =>
                    setFormData({ ...formData, completedJobs: e.target.value })
                  }
                  placeholder="100"
                  className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                />
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
                  placeholder="Describe your service..."
                  rows="4"
                  className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition resize-none"
                ></textarea>
              </div>

              {/* Service Types */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-3">
                  Service Types Offered
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newServiceType}
                    onChange={(e) => setNewServiceType(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addServiceType()}
                    placeholder="e.g., Deep Cleaning"
                    className="flex-1 px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                  />
                  <button
                    type="button"
                    onClick={addServiceType}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formData.serviceTypes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.serviceTypes.map((type, i) => (
                      <div
                        key={i}
                        className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                      >
                        {type}
                        <button
                          type="button"
                          onClick={() => removeServiceType(i)}
                          className="hover:text-indigo-900"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Highlights */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-3">
                  Highlights
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newHighlight}
                    onChange={(e) => setNewHighlight(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addHighlight()}
                    placeholder="e.g., Eco-friendly products"
                    className="flex-1 px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                  />
                  <button
                    type="button"
                    onClick={addHighlight}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formData.highlights.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.highlights.map((highlight, i) => (
                      <div
                        key={i}
                        className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                      >
                        <Check className="w-4 h-4" />
                        {highlight}
                        <button
                          type="button"
                          onClick={() => removeHighlight(i)}
                          className="hover:text-indigo-900"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Service Areas */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-3">
                  Service Areas
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newServiceArea}
                    onChange={(e) => setNewServiceArea(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addServiceArea()}
                    placeholder="e.g., Manila, Makati"
                    className="flex-1 px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                  />
                  <button
                    type="button"
                    onClick={addServiceArea}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formData.serviceAreas.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.serviceAreas.map((area, i) => (
                      <div
                        key={i}
                        className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                      >
                        <MapPin className="w-4 h-4" />
                        {area}
                        <button
                          type="button"
                          onClick={() => removeServiceArea(i)}
                          className="hover:text-indigo-900"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Certifications */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-3">
                  Certifications & Licenses
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newCertification}
                    onChange={(e) => setNewCertification(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addCertification()}
                    placeholder="e.g., Certified Professional"
                    className="flex-1 px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                  />
                  <button
                    type="button"
                    onClick={addCertification}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formData.certifications.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.certifications.map((cert, i) => (
                      <div
                        key={i}
                        className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                      >
                        <Award className="w-4 h-4" />
                        {cert}
                        <button
                          type="button"
                          onClick={() => removeCertification(i)}
                          className="hover:text-indigo-900"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Terms & Conditions */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-3">
                  Terms & Conditions
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newTerm}
                    onChange={(e) => setNewTerm(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addTerm()}
                    placeholder="e.g., Cancellation policy"
                    className="flex-1 px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                  />
                  <button
                    type="button"
                    onClick={addTerm}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formData.terms.length > 0 && (
                  <div className="space-y-2">
                    {formData.terms.map((term, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 bg-slate-700/50 border border-indigo-500/20 rounded-lg px-4 py-2 text-sm text-indigo-200"
                      >
                        <Info className="w-4 h-4" />
                        {term}
                        <button
                          type="button"
                          onClick={() => removeTerm(i)}
                          className="ml-auto hover:text-rose-400"
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

            {/* Footer - Mobile Responsive */}
            <div className="sticky bottom-0 z-[999] bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-xl border-t border-indigo-500/30 p-3 sm:p-4 md:p-6 flex flex-col sm:flex-row gap-2 sm:gap-3 animate-slideUp">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border border-indigo-500/30 text-indigo-300 rounded-xl hover:bg-slate-700/50 hover:border-indigo-500/50 transition-all duration-300 font-bold text-sm sm:text-base transform hover:scale-105"
              >
                Cancel
              </button>

              <button
                onClick={() => handleAddService(true)}
                className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border border-indigo-500/30 text-indigo-300 rounded-xl hover:bg-slate-700/50 hover:border-indigo-500/50 transition-all duration-300 font-bold text-sm sm:text-base transform hover:scale-105"
              >
                <span className="hidden sm:inline">Save Draft</span>
                <span className="sm:hidden">Draft</span>
              </button>

              <button
                onClick={() => handleAddService(false)}
                className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-all duration-300 flex items-center justify-center gap-2 font-bold shadow-lg shadow-indigo-500/30 border border-indigo-400/30 text-sm sm:text-base transform hover:scale-105"
              >
                <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Add Service</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-indigo-500/30 shadow-2xl shadow-indigo-500/20">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-indigo-500/30 p-6 flex items-center justify-between z-[1000]">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-indigo-200 bg-clip-text text-transparent">
                Edit Service
              </h2>
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
                  Service Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Professional House Cleaning"
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

              {/* Category & Price & Duration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 transition"
                  >
                    {categories.map((cat) => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">
                    Base Price (₱) *
                  </label>
                  <input
                    type="number"
                    value={formData.basePrice}
                    onChange={(e) =>
                      setFormData({ ...formData, basePrice: e.target.value })
                    }
                    placeholder="120"
                    className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                  />
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
                    className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                  />
                </div>
              </div>

              {/* Response Time & Experience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">
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
                    className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">
                    Experience (years)
                  </label>
                  <input
                    type="number"
                    value={formData.experienceYears}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        experienceYears: e.target.value,
                      })
                    }
                    placeholder="5"
                    className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                  />
                </div>
              </div>

              {/* Available Dates */}
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

              {/* Completed Jobs */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  Completed Jobs
                </label>
                <input
                  type="number"
                  value={formData.completedJobs}
                  onChange={(e) =>
                    setFormData({ ...formData, completedJobs: e.target.value })
                  }
                  placeholder="100"
                  className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                />
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
                  placeholder="Describe your service..."
                  rows="4"
                  className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition resize-none"
                ></textarea>
              </div>

              {/* Service Types */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-3">
                  Service Types Offered
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newServiceType}
                    onChange={(e) => setNewServiceType(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addServiceType()}
                    placeholder="e.g., Deep Cleaning"
                    className="flex-1 px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                  />
                  <button
                    type="button"
                    onClick={addServiceType}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formData.serviceTypes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.serviceTypes.map((type, i) => (
                      <div
                        key={i}
                        className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                      >
                        {type}
                        <button
                          type="button"
                          onClick={() => removeServiceType(i)}
                          className="hover:text-indigo-900"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Highlights */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-3">
                  Highlights
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newHighlight}
                    onChange={(e) => setNewHighlight(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addHighlight()}
                    placeholder="e.g., Eco-friendly products"
                    className="flex-1 px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                  />
                  <button
                    type="button"
                    onClick={addHighlight}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formData.highlights.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.highlights.map((highlight, i) => (
                      <div
                        key={i}
                        className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                      >
                        <Check className="w-4 h-4" />
                        {highlight}
                        <button
                          type="button"
                          onClick={() => removeHighlight(i)}
                          className="hover:text-indigo-900"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Service Areas */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-3">
                  Service Areas
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newServiceArea}
                    onChange={(e) => setNewServiceArea(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addServiceArea()}
                    placeholder="e.g., Manila, Makati"
                    className="flex-1 px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                  />
                  <button
                    type="button"
                    onClick={addServiceArea}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formData.serviceAreas.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.serviceAreas.map((area, i) => (
                      <div
                        key={i}
                        className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                      >
                        <MapPin className="w-4 h-4" />
                        {area}
                        <button
                          type="button"
                          onClick={() => removeServiceArea(i)}
                          className="hover:text-indigo-900"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Certifications */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-3">
                  Certifications & Licenses
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newCertification}
                    onChange={(e) => setNewCertification(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addCertification()}
                    placeholder="e.g., Certified Professional"
                    className="flex-1 px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                  />
                  <button
                    type="button"
                    onClick={addCertification}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formData.certifications.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.certifications.map((cert, i) => (
                      <div
                        key={i}
                        className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                      >
                        <Award className="w-4 h-4" />
                        {cert}
                        <button
                          type="button"
                          onClick={() => removeCertification(i)}
                          className="hover:text-indigo-900"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Terms & Conditions */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-3">
                  Terms & Conditions
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newTerm}
                    onChange={(e) => setNewTerm(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addTerm()}
                    placeholder="e.g., Cancellation policy"
                    className="flex-1 px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                  />
                  <button
                    type="button"
                    onClick={addTerm}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formData.terms.length > 0 && (
                  <div className="space-y-2">
                    {formData.terms.map((term, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 bg-slate-700/50 border border-indigo-500/20 rounded-lg px-4 py-2 text-sm text-indigo-200"
                      >
                        <Info className="w-4 h-4" />
                        {term}
                        <button
                          type="button"
                          onClick={() => removeTerm(i)}
                          className="ml-auto hover:text-rose-400"
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

            {/* Footer - Mobile Responsive */}
            <div className="sticky bottom-0 z-[999] bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-xl border-t border-indigo-500/30 p-3 sm:p-4 md:p-6 flex flex-col sm:flex-row gap-2 sm:gap-3 animate-slideUp">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border border-indigo-500/30 text-indigo-300 rounded-xl hover:bg-slate-700/50 hover:border-indigo-500/50 transition-all duration-300 font-bold text-sm sm:text-base transform hover:scale-105"
              >
                Cancel
              </button>

              <button
                onClick={handleEditService}
                className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-all duration-300 flex items-center justify-center gap-2 font-bold shadow-lg shadow-indigo-500/30 border border-indigo-400/30 text-sm sm:text-base transform hover:scale-105"
              >
                <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Save Changes</span>
                <span className="sm:hidden">Save</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date Range Modal */}
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
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-indigo-500/30 rounded-2xl max-w-md w-full p-6 text-center">
            <Trash2 className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-indigo-100 mb-2">
              Delete Service
            </h2>
            <p className="text-indigo-300/70 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-indigo-200">
                {selectedService?.title}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center animate-slideUp">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border border-indigo-500/30 text-indigo-300 rounded-xl hover:bg-slate-700/50 hover:border-indigo-500/50 transition-all duration-300 font-bold text-sm sm:text-base transform hover:scale-105"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteService}
                className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-rose-600 to-rose-500 text-white rounded-xl hover:from-rose-700 hover:to-rose-600 transition-all duration-300 font-bold shadow-lg shadow-rose-500/30 border border-rose-400/30 text-sm sm:text-base transform hover:scale-105"
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
