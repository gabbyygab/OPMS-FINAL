import { useEffect, useState } from "react";
import {
  FileEdit,
  X,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Star,
  Home,
  Briefcase,
  Search,
  Filter,
  Edit,
  Trash2,
  CheckCircle,
  Save,
  Upload,
} from "lucide-react";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { useAuth } from "../../context/AuthContext";
import NavigationBar from "../../components/NavigationBar";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants/routes";
import { uploadToCloudinary } from "../../cloudinary/uploadFunction";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

export default function DraftsPage() {
  const [drafts, setDrafts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: "",
    location: "",
    price: "",
    guests: "",
    bedrooms: "",
    beds: "",
    bathrooms: "",
    discount: { type: "percentage", value: "" },
    promoCode: "",
    amenities: [],
    description: "",
    houseRules: [],
    photos: [],
    availableDates: [],
    maxGuests: "",
    duration: "",
    availableTimes: [],
    language: "",
    thingsToKnow: [],
    activities: [],
    ageMin: "",
    category: "Adventure",
    basePrice: "",
    responseTime: "",
    experienceYears: "",
    completedJobs: "",
    serviceTypes: [],
    highlights: [],
    serviceAreas: [],
    certifications: [],
    terms: [],
  });
  const [newEditRule, setNewEditRule] = useState("");
  const [newEditActivity, setNewEditActivity] = useState("");
  const [newEditThing, setNewEditThing] = useState("");
  const [newEditTime, setNewEditTime] = useState("");
  const [newEditServiceType, setNewEditServiceType] = useState("");
  const [newEditHighlight, setNewEditHighlight] = useState("");
  const [newEditServiceArea, setNewEditServiceArea] = useState("");
  const [newEditCertification, setNewEditCertification] = useState("");
  const [newEditTerm, setNewEditTerm] = useState("");
  const [newDateRangeStart, setNewDateRangeStart] = useState("");
  const [newDateRangeEnd, setNewDateRangeEnd] = useState("");
  const [previewImages, setPreviewImages] = useState([]);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [dateRangeState, setDateRangeState] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const itemsPerPage = 6;

  // Fetch all draft listings
  const fetchDrafts = async () => {
    try {
      const listingRef = collection(db, "listings");
      const q = query(
        listingRef,
        where("hostId", "==", userData.id),
        where("isDraft", "==", true)
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDrafts(data);
    } catch (error) {
      console.error("Error fetching drafts:", error);
    }
  };

  useEffect(() => {
    if (userData?.id) {
      fetchDrafts();
    }
  }, [userData]);

  // Filter drafts by category and search
  const filteredDrafts = drafts.filter((draft) => {
    const matchesCategory =
      selectedCategory === "all" || draft.type === selectedCategory;
    const matchesSearch =
      draft.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      draft.location?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredDrafts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDrafts = filteredDrafts.slice(startIndex, endIndex);

  // Handle card click
  const handleCardClick = (draft) => {
    setSelectedDraft(draft);
    setShowDetailModal(true);
  };

  // Handle Publish Draft
  const handlePublishDraft = async () => {
    if (!selectedDraft) return;

    const loadingToast = toast.loading("Publishing draft...");
    try {
      const draftRef = doc(db, "listings", selectedDraft.id);
      await updateDoc(draftRef, {
        isDraft: false,
        status: "active",
      });

      // Remove from local drafts state
      setDrafts((prev) => prev.filter((d) => d.id !== selectedDraft.id));

      toast.dismiss(loadingToast);
      toast.success("Draft published successfully!");
      setShowDetailModal(false);
      setSelectedDraft(null);
    } catch (error) {
      console.error("Error publishing draft:", error);
      toast.dismiss(loadingToast);
      toast.error("Failed to publish draft.");
    }
  };

  // Handle Open Edit Modal
  const openEditModal = (draft) => {
    setSelectedDraft(draft);
    setPreviewImages([]);

    // Pre-fill form data based on draft type
    if (draft.type === "stays") {
      setEditFormData({
        title: draft.title || "",
        location: draft.location || "",
        price: draft.price || "",
        guests: draft.numberOfGuests || "",
        bedrooms: draft.bedrooms || "",
        beds: draft.beds || "",
        bathrooms: draft.bathrooms || "",
        discount: draft.discount || { type: "percentage", value: "" },
        promoCode: draft.promoCode || "",
        amenities: draft.amenities || [],
        description: draft.description || "",
        houseRules: draft.houseRules || [],
        photos: draft.photos || [],
        availableDates: Array.isArray(draft.availableDates)
          ? draft.availableDates
          : [],
        maxGuests: "",
        duration: "",
        availableTimes: [],
        language: "",
        thingsToKnow: [],
        activities: [],
        ageMin: "",
        category: "Adventure",
        basePrice: "",
        responseTime: "",
        experienceYears: "",
        completedJobs: "",
        serviceTypes: [],
        highlights: [],
        serviceAreas: [],
        certifications: [],
        terms: [],
      });
    } else if (draft.type === "experiences") {
      setEditFormData({
        title: draft.title || "",
        location: draft.location || "",
        price: draft.price || "",
        guests: "",
        bedrooms: "",
        beds: "",
        bathrooms: "",
        discount: draft.discount || { type: "percentage", value: "" },
        promoCode: draft.promoCode || "",
        amenities: [],
        description: draft.description || "",
        houseRules: [],
        photos: draft.photos || [],
        availableDates: Array.isArray(draft.availableDates)
          ? draft.availableDates
          : [],
        maxGuests: draft.maxGuests || "",
        duration: draft.duration || "",
        availableTimes: draft.availableTimes || [],
        language: draft.language || "",
        thingsToKnow: draft.thingsToKnow || [],
        activities: Array.isArray(draft.activities) ? draft.activities : [],
        ageMin: draft.ageMin || "",
        category: draft.category || "Adventure",
        basePrice: "",
        responseTime: "",
        experienceYears: "",
        completedJobs: "",
        serviceTypes: [],
        highlights: [],
        serviceAreas: [],
        certifications: [],
        terms: [],
      });
    } else if (draft.type === "services") {
      setEditFormData({
        title: draft.title || "",
        location: draft.location || "",
        price: draft.price || "",
        guests: "",
        bedrooms: "",
        beds: "",
        bathrooms: "",
        discount: draft.discount || { type: "percentage", value: "" },
        promoCode: draft.promoCode || "",
        amenities: [],
        description: draft.description || "",
        houseRules: [],
        photos: draft.photos || [],
        availableDates: Array.isArray(draft.availableDates)
          ? draft.availableDates
          : [],
        maxGuests: "",
        duration: draft.duration || "",
        availableTimes: [],
        language: "",
        thingsToKnow: [],
        activities: [],
        ageMin: "",
        category: draft.category || "Home Services",
        basePrice: draft.price || "",
        responseTime: draft.responseTime || "",
        experienceYears: draft.experienceYears || "",
        completedJobs: draft.completedJobs || "",
        serviceTypes: Array.isArray(draft.serviceTypes)
          ? draft.serviceTypes
          : [],
        highlights: Array.isArray(draft.highlights) ? draft.highlights : [],
        serviceAreas: Array.isArray(draft.serviceAreas)
          ? draft.serviceAreas
          : [],
        certifications: Array.isArray(draft.certifications)
          ? draft.certifications
          : [],
        terms: Array.isArray(draft.terms) ? draft.terms : [],
      });
    }

    setShowDetailModal(false);
    setShowEditModal(true);
  };

  // Handle Image Change
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newPreviews = files.map((file) => URL.createObjectURL(file));

    setPreviewImages((prev) => [...prev, ...newPreviews]);

    // Keep both new and existing photo data
    setEditFormData((prev) => ({
      ...prev,
      photos: [...(prev.photos || []), ...files],
    }));
  };

  // Remove Image
  const removeImage = (index) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
    setEditFormData((prev) => ({
      ...prev,
      photos: (prev.photos || []).filter((_, i) => i !== index),
    }));
  };

  // Handle Add Date Range from Modal
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

    setEditFormData({
      ...editFormData,
      availableDates: [...editFormData.availableDates, dateRangeObj],
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

  // Remove Available Date
  const removeAvailableDate = (index) => {
    setEditFormData({
      ...editFormData,
      availableDates: editFormData.availableDates.filter((_, i) => i !== index),
    });
  };

  // Add Activity
  const addActivity = () => {
    if (newEditActivity.trim()) {
      setEditFormData({
        ...editFormData,
        activities: [
          ...(editFormData.activities || []),
          newEditActivity.trim(),
        ],
      });
      setNewEditActivity("");
    }
  };

  // Remove Activity
  const removeActivity = (index) => {
    setEditFormData({
      ...editFormData,
      activities: editFormData.activities.filter((_, i) => i !== index),
    });
  };

  // Add Thing to Know
  const addThingToKnow = () => {
    if (newEditThing.trim()) {
      setEditFormData({
        ...editFormData,
        thingsToKnow: [
          ...(editFormData.thingsToKnow || []),
          newEditThing.trim(),
        ],
      });
      setNewEditThing("");
    }
  };

  // Remove Thing to Know
  const removeThingToKnow = (index) => {
    setEditFormData({
      ...editFormData,
      thingsToKnow: editFormData.thingsToKnow.filter((_, i) => i !== index),
    });
  };

  // Add Available Time
  const addAvailableTime = () => {
    if (newEditTime.trim()) {
      setEditFormData({
        ...editFormData,
        availableTimes: [
          ...(editFormData.availableTimes || []),
          newEditTime.trim(),
        ],
      });
      setNewEditTime("");
    }
  };

  // Remove Available Time
  const removeAvailableTime = (index) => {
    setEditFormData({
      ...editFormData,
      availableTimes: editFormData.availableTimes.filter((_, i) => i !== index),
    });
  };

  // Add Service Type
  const addServiceType = () => {
    if (newEditServiceType.trim()) {
      setEditFormData({
        ...editFormData,
        serviceTypes: [
          ...(editFormData.serviceTypes || []),
          newEditServiceType.trim(),
        ],
      });
      setNewEditServiceType("");
    }
  };

  // Remove Service Type
  const removeServiceType = (index) => {
    setEditFormData({
      ...editFormData,
      serviceTypes: editFormData.serviceTypes.filter((_, i) => i !== index),
    });
  };

  // Add Highlight
  const addHighlight = () => {
    if (newEditHighlight.trim()) {
      setEditFormData({
        ...editFormData,
        highlights: [
          ...(editFormData.highlights || []),
          newEditHighlight.trim(),
        ],
      });
      setNewEditHighlight("");
    }
  };

  // Remove Highlight
  const removeHighlight = (index) => {
    setEditFormData({
      ...editFormData,
      highlights: editFormData.highlights.filter((_, i) => i !== index),
    });
  };

  // Add Service Area
  const addServiceArea = () => {
    if (newEditServiceArea.trim()) {
      setEditFormData({
        ...editFormData,
        serviceAreas: [
          ...(editFormData.serviceAreas || []),
          newEditServiceArea.trim(),
        ],
      });
      setNewEditServiceArea("");
    }
  };

  // Remove Service Area
  const removeServiceArea = (index) => {
    setEditFormData({
      ...editFormData,
      serviceAreas: editFormData.serviceAreas.filter((_, i) => i !== index),
    });
  };

  // Add Certification
  const addCertification = () => {
    if (newEditCertification.trim()) {
      setEditFormData({
        ...editFormData,
        certifications: [
          ...(editFormData.certifications || []),
          newEditCertification.trim(),
        ],
      });
      setNewEditCertification("");
    }
  };

  // Remove Certification
  const removeCertification = (index) => {
    setEditFormData({
      ...editFormData,
      certifications: editFormData.certifications.filter((_, i) => i !== index),
    });
  };

  // Add Term
  const addTerm = () => {
    if (newEditTerm.trim()) {
      setEditFormData({
        ...editFormData,
        terms: [...(editFormData.terms || []), newEditTerm.trim()],
      });
      setNewEditTerm("");
    }
  };

  // Remove Term
  const removeTerm = (index) => {
    setEditFormData({
      ...editFormData,
      terms: editFormData.terms.filter((_, i) => i !== index),
    });
  };

  // Add Available Date Range for Services
  const addAvailableDateRange = () => {
    if (!newDateRangeStart || !newDateRangeEnd) {
      toast.warning("Please select both start and end dates");
      return;
    }

    if (new Date(newDateRangeStart) > new Date(newDateRangeEnd)) {
      toast.warning("Start date must be before end date");
      return;
    }

    const dateRangeObj = {
      startDate: newDateRangeStart,
      endDate: newDateRangeEnd,
    };

    setEditFormData({
      ...editFormData,
      availableDates: [...editFormData.availableDates, dateRangeObj],
    });

    setNewDateRangeStart("");
    setNewDateRangeEnd("");
    toast.success("Date range added");
  };

  // Handle Save Edited Draft
  const handleSaveEditedDraft = async (publish = false) => {
    if (!selectedDraft) return;

    const loadingToast = toast.loading(
      publish ? "Publishing draft..." : "Saving draft..."
    );
    try {
      const draftRef = doc(db, "listings", selectedDraft.id);

      // Separate existing URLs from new File objects
      const existingPhotos = editFormData.photos.filter(
        (img) => typeof img === "string" && img.startsWith("http")
      );
      const newFiles = editFormData.photos.filter(
        (img) =>
          img instanceof File ||
          (typeof img === "string" && img.startsWith("blob:"))
      );

      // Find corresponding File objects for new images
      const filesToUpload =
        editFormData.photos?.filter((photo) => photo instanceof File) || [];

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
      const allPhotos = [...existingPhotos, ...newImageUrls];

      const updateData = {
        title: editFormData.title || "",
        location: editFormData.location || "",
        price: Number(editFormData.price) || 0,
        description: editFormData.description || "",
        amenities: editFormData.amenities || [],
        houseRules: editFormData.houseRules || [],
        photos: allPhotos,
        updated_at: serverTimestamp(),
      };

      if (selectedDraft.type === "stays") {
        updateData.numberOfGuests = Number(editFormData.guests) || 0;
        updateData.bedrooms = Number(editFormData.bedrooms) || 0;
        updateData.beds = Number(editFormData.beds) || 0;
        updateData.bathrooms = Number(editFormData.bathrooms) || 0;
        updateData.discount = {
          type: editFormData.discount?.type || "percentage",
          value: Number(editFormData.discount?.value) || 0,
        };
        updateData.promoCode = editFormData.promoCode || null;
        updateData.availableDates = Array.isArray(editFormData.availableDates)
          ? editFormData.availableDates
          : [];
      } else if (selectedDraft.type === "experiences") {
        updateData.maxGuests = Number(editFormData.maxGuests) || 0;
        updateData.duration = Number(editFormData.duration) || 0;
        updateData.availableTimes = editFormData.availableTimes || [];
        updateData.language = editFormData.language || "";
        updateData.thingsToKnow = editFormData.thingsToKnow || [];
        updateData.activities = editFormData.activities || [];
        updateData.ageMin = Number(editFormData.ageMin) || 0;
        updateData.category = editFormData.category || "Adventure";
        updateData.availableDates = Array.isArray(editFormData.availableDates)
          ? editFormData.availableDates
          : [];
        updateData.discount = {
          type: editFormData.discount?.type || "percentage",
          value: Number(editFormData.discount?.value) || 0,
        };
        updateData.promoCode = editFormData.promoCode || null;
      } else if (selectedDraft.type === "services") {
        updateData.price = Number(editFormData.basePrice) || 0;
        updateData.duration = Number(editFormData.duration) || 0;
        updateData.category = editFormData.category || "Home Services";
        updateData.responseTime = editFormData.responseTime || "";
        updateData.experienceYears = Number(editFormData.experienceYears) || 0;
        updateData.completedJobs = Number(editFormData.completedJobs) || 0;
        updateData.serviceTypes = Array.isArray(editFormData.serviceTypes)
          ? editFormData.serviceTypes
          : [];
        updateData.highlights = Array.isArray(editFormData.highlights)
          ? editFormData.highlights
          : [];
        updateData.serviceAreas = Array.isArray(editFormData.serviceAreas)
          ? editFormData.serviceAreas
          : [];
        updateData.certifications = Array.isArray(editFormData.certifications)
          ? editFormData.certifications
          : [];
        updateData.terms = Array.isArray(editFormData.terms)
          ? editFormData.terms
          : [];
        updateData.availableDates = Array.isArray(editFormData.availableDates)
          ? editFormData.availableDates
          : [];
        updateData.discount = {
          type: editFormData.discount?.type || "percentage",
          value: Number(editFormData.discount?.value) || 0,
        };
        updateData.promoCode = editFormData.promoCode || null;
      }

      if (publish) {
        updateData.isDraft = false;
        updateData.status = "active";
      }

      await updateDoc(draftRef, updateData);

      // Update local state
      setDrafts((prev) =>
        prev.map((d) =>
          d.id === selectedDraft.id ? { ...d, ...updateData } : d
        )
      );

      if (publish) {
        setDrafts((prev) => prev.filter((d) => d.id !== selectedDraft.id));
      }

      toast.dismiss(loadingToast);
      toast.success(
        publish ? "Draft published successfully!" : "Draft saved successfully!"
      );
      setShowEditModal(false);
      setSelectedDraft(null);
      setNewEditRule("");
      setNewEditActivity("");
      setNewEditThing("");
      setNewEditTime("");
      setPreviewImages([]);
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.dismiss(loadingToast);
      toast.error("Failed to save draft.");
    }
  };

  // Handle Delete Draft
  const handleDeleteDraft = async () => {
    if (!selectedDraft) return;

    const loadingToast = toast.loading("Deleting draft...");
    try {
      await deleteDoc(doc(db, "listings", selectedDraft.id));

      // Remove from local state
      setDrafts((prev) => prev.filter((d) => d.id !== selectedDraft.id));

      toast.dismiss(loadingToast);
      toast.success("Draft deleted successfully!");
      setShowDeleteModal(false);
      setShowDetailModal(false);
      setSelectedDraft(null);
    } catch (error) {
      console.error("Error deleting draft:", error);
      toast.dismiss(loadingToast);
      toast.error("Failed to delete draft.");
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (draft) => {
    setSelectedDraft(draft);
    setShowDetailModal(false);
    setShowDeleteModal(true);
  };

  // Get category icon
  const getCategoryIcon = (type) => {
    switch (type) {
      case "stays":
        return <Home className="w-4 h-4" />;
      case "experiences":
        return <Calendar className="w-4 h-4" />;
      case "services":
        return <Briefcase className="w-4 h-4" />;
      default:
        return <FileEdit className="w-4 h-4" />;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 pb-12">
        <NavigationBar user={user} userData={userData} />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 lg:pt-40">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-indigo-200 bg-clip-text text-transparent">
                My Drafts
              </h1>
              <p className="text-indigo-300/60 mt-1">
                Manage your unpublished listings
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl shadow-lg shadow-indigo-500/10 p-6 border border-indigo-500/20 backdrop-blur-sm hover:border-indigo-500/40 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-300/70 text-sm font-medium">
                    Total Drafts
                  </p>
                  <h3 className="text-2xl font-bold text-indigo-100 mt-1">
                    {drafts.length}
                  </h3>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600/30 to-indigo-500/20 rounded-lg flex items-center justify-center border border-indigo-500/30">
                  <FileEdit className="w-6 h-6 text-indigo-400" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl shadow-lg shadow-indigo-500/10 p-6 border border-indigo-500/20 backdrop-blur-sm hover:border-indigo-500/40 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-300/70 text-sm font-medium">
                    Stays
                  </p>
                  <h3 className="text-2xl font-bold text-indigo-100 mt-1">
                    {drafts.filter((d) => d.type === "stays").length}
                  </h3>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600/30 to-indigo-500/20 rounded-lg flex items-center justify-center border border-indigo-500/30">
                  <Home className="w-6 h-6 text-indigo-400" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl shadow-lg shadow-indigo-500/10 p-6 border border-indigo-500/20 backdrop-blur-sm hover:border-indigo-500/40 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-300/70 text-sm font-medium">
                    Experiences
                  </p>
                  <h3 className="text-2xl font-bold text-indigo-100 mt-1">
                    {drafts.filter((d) => d.type === "experiences").length}
                  </h3>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-orange-600/30 to-orange-500/20 rounded-lg flex items-center justify-center border border-orange-500/30">
                  <Calendar className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl shadow-lg shadow-indigo-500/10 p-6 border border-indigo-500/20 backdrop-blur-sm hover:border-indigo-500/40 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-300/70 text-sm font-medium">
                    Services
                  </p>
                  <h3 className="text-2xl font-bold text-indigo-100 mt-1">
                    {drafts.filter((d) => d.type === "services").length}
                  </h3>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-600/30 to-emerald-500/20 rounded-lg flex items-center justify-center border border-emerald-500/30">
                  <Briefcase className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Category Pills & Search */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl shadow-lg shadow-indigo-500/10 p-6 border border-indigo-500/20 backdrop-blur-sm mb-6">
            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-full font-medium transition ${
                  selectedCategory === "all"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/50"
                    : "bg-slate-700/50 text-indigo-200 border border-indigo-500/30 hover:border-indigo-500/60"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedCategory("stays")}
                className={`px-4 py-2 rounded-full font-medium transition flex items-center gap-2 ${
                  selectedCategory === "stays"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/50"
                    : "bg-slate-700/50 text-indigo-200 border border-indigo-500/30 hover:border-indigo-500/60"
                }`}
              >
                <Home className="w-4 h-4" />
                Stays
              </button>
              <button
                onClick={() => setSelectedCategory("experiences")}
                className={`px-4 py-2 rounded-full font-medium transition flex items-center gap-2 ${
                  selectedCategory === "experiences"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/50"
                    : "bg-slate-700/50 text-indigo-200 border border-indigo-500/30 hover:border-indigo-500/60"
                }`}
              >
                <Calendar className="w-4 h-4" />
                Experiences
              </button>
              <button
                onClick={() => setSelectedCategory("services")}
                className={`px-4 py-2 rounded-full font-medium transition flex items-center gap-2 ${
                  selectedCategory === "services"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/50"
                    : "bg-slate-700/50 text-indigo-200 border border-indigo-500/30 hover:border-indigo-500/60"
                }`}
              >
                <Briefcase className="w-4 h-4" />
                Services
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-400/50" />
              <input
                type="text"
                placeholder="Search drafts by name or location..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
              />
            </div>
          </div>

          {/* Drafts Grid */}
          {currentDrafts.length === 0 ? (
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl shadow-lg shadow-indigo-500/10 p-12 border border-indigo-500/20 backdrop-blur-sm text-center">
              <FileEdit className="w-16 h-16 text-indigo-400/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-indigo-100 mb-2">
                No drafts found
              </h3>
              <p className="text-indigo-300/60">
                {searchTerm || selectedCategory !== "all"
                  ? "Try adjusting your search or filters"
                  : "You don't have any draft listings yet"}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                {currentDrafts.map((draft) => (
                  <div
                    key={draft.id}
                    onClick={() => handleCardClick(draft)}
                    className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl shadow-lg shadow-indigo-500/10 border border-indigo-500/20 overflow-hidden hover:border-indigo-500/40 hover:shadow-indigo-500/20 transition cursor-pointer flex flex-col backdrop-blur-sm"
                  >
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden bg-slate-700">
                      {draft.photos && draft.photos.length > 0 ? (
                        <img
                          src={draft.photos[0]}
                          alt={draft.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-indigo-300/40">
                          No Image
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-600/80 text-indigo-100 backdrop-blur-sm border border-indigo-500/50 flex items-center gap-1">
                          {getCategoryIcon(draft.type)}
                          {draft.type}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-lg font-bold text-indigo-100 mb-1">
                        {draft.title || "Untitled Draft"}
                      </h3>
                      <p className="text-sm text-indigo-300/60 flex items-center gap-1 mb-3">
                        <MapPin className="w-4 h-4" />
                        {draft.location || "No location"}
                      </p>

                      {/* Type-specific details */}
                      {draft.type === "stays" && (
                        <div className="flex items-center gap-4 text-sm text-indigo-300/70 mb-4">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {draft.numberOfGuests || 0} guests
                          </span>
                        </div>
                      )}

                      {draft.type === "experiences" && (
                        <div className="flex items-center gap-4 text-sm text-indigo-300/70 mb-4">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {draft.maxGuests || 0} max guests
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {draft.duration || 0}h
                          </span>
                        </div>
                      )}

                      {/* Price */}
                      <div className="mt-auto pt-4 border-t border-indigo-500/20">
                        <div className="flex items-center justify-between">
                          <p className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-indigo-200 bg-clip-text text-transparent">
                            ₱{draft.price?.toFixed(2) || "0.00"}
                          </p>
                          <span className="text-xs text-indigo-300/50">
                            Click to view
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg bg-slate-700/50 border border-indigo-500/30 text-indigo-200 hover:border-indigo-500/60 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Previous
                  </button>

                  {[...Array(totalPages)].map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(idx + 1)}
                      className={`px-4 py-2 rounded-lg transition ${
                        currentPage === idx + 1
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/50"
                          : "bg-slate-700/50 border border-indigo-500/30 text-indigo-200 hover:border-indigo-500/60"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg bg-slate-700/50 border border-indigo-500/30 text-indigo-200 hover:border-indigo-500/60 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedDraft && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-indigo-500/30 shadow-2xl shadow-indigo-500/20">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-indigo-500/30 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-indigo-200 bg-clip-text text-transparent">
                  {selectedDraft.title || "Untitled Draft"}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${
                    selectedDraft.type === "stays"
                      ? "bg-indigo-600/30 text-indigo-200 border-indigo-500/50"
                      : selectedDraft.type === "experiences"
                      ? "bg-orange-600/30 text-orange-200 border-orange-500/50"
                      : "bg-emerald-600/30 text-emerald-200 border-emerald-500/50"
                  }`}
                >
                  {getCategoryIcon(selectedDraft.type)}
                  {selectedDraft.type}
                </span>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-indigo-400/60 hover:text-indigo-400 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Images */}
              {selectedDraft.photos && selectedDraft.photos.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-3">
                    Photos
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedDraft.photos.map((photo, idx) => (
                      <img
                        key={idx}
                        src={photo}
                        alt={`Photo ${idx + 1}`}
                        className="rounded-lg object-cover w-full h-32"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-indigo-300 mb-1">
                    Location
                  </p>
                  <p className="text-indigo-100 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {selectedDraft.location || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-indigo-300 mb-1">
                    Price
                  </p>
                  <p className="text-indigo-100 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />₱
                    {selectedDraft.price?.toFixed(2) || "0.00"}
                  </p>
                </div>
              </div>

              {/* Type-specific details for Stays */}
              {selectedDraft.type === "stays" && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium text-indigo-300 mb-1">
                        Guests
                      </p>
                      <p className="text-indigo-100">
                        {selectedDraft.numberOfGuests || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-indigo-300 mb-1">
                        Bedrooms
                      </p>
                      <p className="text-indigo-100">
                        {selectedDraft.bedrooms || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-indigo-300 mb-1">
                        Beds
                      </p>
                      <p className="text-indigo-100">
                        {selectedDraft.beds || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-indigo-300 mb-1">
                        Bathrooms
                      </p>
                      <p className="text-indigo-100">
                        {selectedDraft.bathrooms || 0}
                      </p>
                    </div>
                  </div>

                  {/* Amenities */}
                  {selectedDraft.amenities &&
                    selectedDraft.amenities.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-indigo-300 mb-2">
                          Amenities
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedDraft.amenities.map((amenity, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-slate-700/50 text-indigo-200 border border-indigo-500/30 rounded-full text-sm"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* House Rules */}
                  {selectedDraft.houseRules &&
                    selectedDraft.houseRules.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-indigo-300 mb-2">
                          House Rules
                        </p>
                        <ul className="space-y-1">
                          {selectedDraft.houseRules.map((rule, idx) => (
                            <li key={idx} className="text-indigo-200 text-sm">
                              • {rule}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {/* Available Dates */}
                  {selectedDraft.availableDate && (
                    <div>
                      <p className="text-sm font-medium text-indigo-300 mb-2">
                        Available Dates
                      </p>
                      <p className="text-indigo-200 text-sm">
                        From: {selectedDraft.availableDate.from || "N/A"} - To:{" "}
                        {selectedDraft.availableDate.to || "N/A"}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Type-specific details for Experiences */}
              {selectedDraft.type === "experiences" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-indigo-300 mb-1">
                        Max Guests
                      </p>
                      <p className="text-indigo-100">
                        {selectedDraft.maxGuests || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-indigo-300 mb-1">
                        Duration (hours)
                      </p>
                      <p className="text-indigo-100">
                        {selectedDraft.duration || 0}
                      </p>
                    </div>
                  </div>

                  {/* Available Times */}
                  {selectedDraft.availableTimes &&
                    selectedDraft.availableTimes.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-indigo-300 mb-2">
                          Available Times
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedDraft.availableTimes.map((time, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-slate-700/50 text-indigo-200 border border-indigo-500/30 rounded-full text-sm"
                            >
                              {time}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Language */}
                  {selectedDraft.language && (
                    <div>
                      <p className="text-sm font-medium text-indigo-300 mb-1">
                        Language
                      </p>
                      <p className="text-indigo-100">
                        {selectedDraft.language}
                      </p>
                    </div>
                  )}

                  {/* Things to Know */}
                  {selectedDraft.thingsToKnow &&
                    selectedDraft.thingsToKnow.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-indigo-300 mb-2">
                          Things to Know
                        </p>
                        <ul className="space-y-1">
                          {selectedDraft.thingsToKnow.map((item, idx) => (
                            <li key={idx} className="text-indigo-200 text-sm">
                              • {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </>
              )}

              {/* Description */}
              {selectedDraft.description && (
                <div>
                  <p className="text-sm font-medium text-indigo-300 mb-2">
                    Description
                  </p>
                  <p className="text-indigo-200 text-sm leading-relaxed">
                    {selectedDraft.description}
                  </p>
                </div>
              )}

              {/* Discount */}
              {selectedDraft.discount && selectedDraft.discount.value > 0 && (
                <div>
                  <p className="text-sm font-medium text-indigo-300 mb-1">
                    Discount
                  </p>
                  <p className="text-indigo-100">
                    {selectedDraft.discount.type === "percentage"
                      ? `${selectedDraft.discount.value}%`
                      : `₱${selectedDraft.discount.value}`}
                  </p>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-indigo-500/20">
                <div>
                  <p className="text-sm font-medium text-indigo-300 mb-1">
                    Created At
                  </p>
                  <p className="text-indigo-300/70 text-sm">
                    {selectedDraft.created_at
                      ? new Date(
                          selectedDraft.created_at?.toDate?.()
                            ? selectedDraft.created_at.toDate()
                            : selectedDraft.created_at
                        ).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-indigo-300 mb-1">
                    Updated At
                  </p>
                  <p className="text-indigo-300/70 text-sm">
                    {selectedDraft.updated_at
                      ? new Date(
                          selectedDraft.updated_at?.toDate?.()
                            ? selectedDraft.updated_at.toDate()
                            : selectedDraft.updated_at
                        ).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gradient-to-r from-slate-800 to-slate-900 border-t border-indigo-500/30 p-6 backdrop-blur-sm">
              <div className="flex gap-3">
                <button
                  onClick={() => openDeleteModal(selectedDraft)}
                  className="flex-1 px-6 py-3 bg-rose-600/30 text-rose-200 rounded-lg hover:bg-rose-600/50 transition font-medium flex items-center justify-center gap-2 border border-rose-500/50"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete
                </button>
                <button
                  onClick={() => openEditModal(selectedDraft)}
                  className="flex-1 px-6 py-3 border border-indigo-500/50 text-indigo-200 rounded-lg hover:bg-indigo-600/30 transition font-medium flex items-center justify-center gap-2"
                >
                  <Edit className="w-5 h-5" />
                  Edit
                </button>
                <button
                  onClick={handlePublishDraft}
                  className="flex-1 px-6 py-3 bg-emerald-600/50 text-emerald-200 rounded-lg hover:bg-emerald-600/70 transition font-medium flex items-center justify-center gap-2 border border-emerald-500/50"
                >
                  <CheckCircle className="w-5 h-5" />
                  Publish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Draft Modal */}
      {showEditModal && selectedDraft && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-indigo-500/30 shadow-2xl shadow-indigo-500/20">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-indigo-500/30 p-6 flex items-center justify-between z-[1000]">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-indigo-200 bg-clip-text text-transparent">
                Edit{" "}
                {selectedDraft.type === "stays"
                  ? "Stay"
                  : selectedDraft.type === "experiences"
                  ? "Experience"
                  : "Service"}
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedDraft(null);
                  setNewEditRule("");
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
                  value={editFormData.title}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, title: e.target.value })
                  }
                  placeholder="e.g., Beachfront Villa"
                  className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={editFormData.location}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      location: e.target.value,
                    })
                  }
                  placeholder="Type a location"
                  className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  Price (₱)
                </label>
                <input
                  type="number"
                  value={editFormData.price}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, price: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  Description
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      description: e.target.value,
                    })
                  }
                  rows="4"
                  className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition resize-none"
                />
              </div>

              {/* Photos */}
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-3">
                  Photos
                </label>

                {/* Existing Photos */}
                {editFormData.photos &&
                  editFormData.photos.some((p) => typeof p === "string") && (
                    <div>
                      <p className="text-xs text-indigo-300/60 mb-2">
                        Current Photos
                      </p>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        {editFormData.photos.map(
                          (photo, idx) =>
                            typeof photo === "string" && (
                              <div key={idx} className="relative">
                                <img
                                  src={photo}
                                  alt={`Photo ${idx}`}
                                  className="rounded-lg object-cover w-full h-32"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(idx)}
                                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow"
                                >
                                  <X className="w-4 h-4 text-slate-600" />
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
                    document.getElementById("editDraftPhotoInput").click()
                  }
                  className="border-2 border-dashed border-indigo-500/30 rounded-lg p-8 text-center hover:border-indigo-500 transition cursor-pointer"
                >
                  <Upload className="w-12 h-12 text-indigo-300/50 mx-auto mb-3" />
                  <p className="text-indigo-300/60 text-sm">
                    Click to add new photos
                  </p>
                  <input
                    id="editDraftPhotoInput"
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

              {/* Stays-specific fields */}
              {selectedDraft.type === "stays" && (
                <>
                  {/* Guests & Rooms */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-indigo-300 mb-2">
                        Max Guests
                      </label>
                      <input
                        type="number"
                        value={editFormData.guests}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            guests: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-indigo-300 mb-2">
                        Price (₱)
                      </label>
                      <input
                        type="number"
                        value={editFormData.price}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            price: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100"
                      />
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
                    {editFormData.availableDates &&
                    editFormData.availableDates.length > 0 ? (
                      <div className="space-y-2">
                        {editFormData.availableDates.map((range, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-slate-700/50 border border-indigo-500/20 rounded-lg px-4 py-2"
                          >
                            <span className="text-indigo-200 text-sm">
                              {new Date(range.startDate).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}{" "}
                              -{" "}
                              {new Date(range.endDate).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
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
                      <p className="text-sm text-indigo-300/50">
                        No date ranges added yet
                      </p>
                    )}
                  </div>

                  {/* Bedrooms, Bathrooms & Beds */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-indigo-300 mb-2">
                        Bedrooms
                      </label>
                      <input
                        type="number"
                        value={editFormData.bedrooms || ""}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            bedrooms: e.target.value,
                          })
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
                        value={editFormData.bathrooms || ""}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            bathrooms: e.target.value,
                          })
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
                        value={editFormData.beds || ""}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            beds: e.target.value,
                          })
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
                        value={editFormData.discount?.type || "percentage"}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            discount: {
                              ...editFormData.discount,
                              type: e.target.value,
                            },
                          })
                        }
                        className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 transition"
                      >
                        <option
                          value="percentage"
                          className="bg-slate-800 text-indigo-100"
                        >
                          Percentage
                        </option>
                        <option
                          value="fixed"
                          className="bg-slate-800 text-indigo-100"
                        >
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
                        value={editFormData.discount?.value || ""}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            discount: {
                              ...editFormData.discount,
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
                      value={editFormData.promoCode || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
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
                            checked={editFormData.amenities.includes(item)}
                            onChange={() => {
                              const exists =
                                editFormData.amenities.includes(item);
                              setEditFormData({
                                ...editFormData,
                                amenities: exists
                                  ? editFormData.amenities.filter(
                                      (a) => a !== item
                                    )
                                  : [...editFormData.amenities, item],
                              });
                            }}
                            className="w-4 h-4 accent-indigo-500"
                          />
                          <span className="text-indigo-200">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* House Rules */}
                  <div>
                    <label className="block text-sm font-medium text-indigo-300 mb-3">
                      House Rules
                    </label>

                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newEditRule || ""}
                        onChange={(e) => setNewEditRule(e.target.value)}
                        placeholder="Enter a rule (e.g., No smoking)"
                        className="flex-1 px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newEditRule.trim()) {
                            setEditFormData({
                              ...editFormData,
                              houseRules: [
                                ...(editFormData.houseRules || []),
                                newEditRule.trim(),
                              ],
                            });
                            setNewEditRule("");
                          }
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition font-medium"
                      >
                        Add
                      </button>
                    </div>

                    {editFormData.houseRules &&
                    editFormData.houseRules.length > 0 ? (
                      <ul className="space-y-2">
                        {editFormData.houseRules.map((rule, index) => (
                          <li
                            key={index}
                            className="flex items-center justify-between bg-slate-700/50 border border-indigo-500/20 rounded-lg px-4 py-2 hover:border-indigo-500/40 transition"
                          >
                            <span className="text-indigo-200 text-sm">
                              {rule}
                            </span>
                            <button
                              onClick={() => {
                                const updated = editFormData.houseRules.filter(
                                  (_, i) => i !== index
                                );
                                setEditFormData({
                                  ...editFormData,
                                  houseRules: updated,
                                });
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
                </>
              )}

              {/* Experiences-specific fields */}
              {selectedDraft.type === "experiences" && (
                <>
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-indigo-300 mb-2">
                      Category *
                    </label>
                    <select
                      value={editFormData.category}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          category: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100"
                    >
                      <option value="Adventure">Adventure</option>
                      <option value="Food & Drink">Food & Drink</option>
                      <option value="Arts & Culture">Arts & Culture</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Wellness">Wellness</option>
                      <option value="Sports">Sports</option>
                    </select>
                  </div>

                  {/* Max Guests & Duration */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-indigo-300 mb-2">
                        Max Guests *
                      </label>
                      <input
                        type="number"
                        value={editFormData.maxGuests}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            maxGuests: e.target.value,
                          })
                        }
                        placeholder="12"
                        className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-indigo-300 mb-2">
                        Duration (hours) *
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={editFormData.duration}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            duration: e.target.value,
                          })
                        }
                        placeholder="3"
                        className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100"
                      />
                    </div>
                  </div>

                  {/* Minimum Age & Language */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-indigo-300 mb-2">
                        Minimum Age *
                      </label>
                      <input
                        type="number"
                        value={editFormData.ageMin}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            ageMin: e.target.value,
                          })
                        }
                        placeholder="12"
                        className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-indigo-300 mb-2">
                        Languages Offered *
                      </label>
                      <input
                        type="text"
                        value={editFormData.language}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            language: e.target.value,
                          })
                        }
                        placeholder="e.g., English, Spanish"
                        className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40"
                      />
                    </div>
                  </div>

                  {/* Activities */}
                  <div>
                    <label className="block text-sm font-medium text-indigo-300 mb-2">
                      Activities
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newEditActivity}
                        onChange={(e) => setNewEditActivity(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addActivity()}
                        placeholder="e.g., Swimming, Hiking"
                        className="flex-1 px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                      />
                      <button
                        type="button"
                        onClick={addActivity}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition font-medium"
                      >
                        Add
                      </button>
                    </div>
                    {editFormData.activities &&
                    editFormData.activities.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {editFormData.activities.map((activity, index) => (
                          <div
                            key={index}
                            className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                          >
                            {activity}
                            <button
                              type="button"
                              onClick={() => removeActivity(index)}
                              className="hover:text-indigo-900"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-indigo-300/50 mb-3">
                        No activities added yet.
                      </p>
                    )}
                  </div>

                  {/* Available Times */}
                  <div>
                    <label className="block text-sm font-medium text-indigo-300 mb-2">
                      Available Times
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="time"
                        value={newEditTime}
                        onChange={(e) => setNewEditTime(e.target.value)}
                        className="flex-1 px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100"
                      />
                      <button
                        type="button"
                        onClick={addAvailableTime}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition font-medium"
                      >
                        Add
                      </button>
                    </div>
                    {editFormData.availableTimes &&
                    editFormData.availableTimes.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {editFormData.availableTimes.map((time, index) => (
                          <div
                            key={index}
                            className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                          >
                            {time}
                            <button
                              type="button"
                              onClick={() => removeAvailableTime(index)}
                              className="hover:text-indigo-900"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-indigo-300/50 mb-3">
                        No times added yet.
                      </p>
                    )}
                  </div>

                  {/* Discount */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-indigo-300 mb-2">
                        Discount Type
                      </label>
                      <select
                        value={editFormData.discount?.type || "percentage"}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            discount: {
                              ...editFormData.discount,
                              type: e.target.value,
                            },
                          })
                        }
                        className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 transition"
                      >
                        <option
                          value="percentage"
                          className="bg-slate-800 text-indigo-100"
                        >
                          Percentage
                        </option>
                        <option
                          value="fixed"
                          className="bg-slate-800 text-indigo-100"
                        >
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
                        value={editFormData.discount?.value || ""}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            discount: {
                              ...editFormData.discount,
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
                      value={editFormData.promoCode || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          promoCode: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="e.g., SUMMER20"
                      className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                    />
                  </div>

                  {/* Things to Know */}
                  <div>
                    <label className="block text-sm font-medium text-indigo-300 mb-3">
                      Things to Know
                    </label>

                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newEditThing}
                        onChange={(e) => setNewEditThing(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && addThingToKnow()
                        }
                        placeholder="e.g., Bring sunscreen, Wear comfortable shoes"
                        className="flex-1 px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                      />
                      <button
                        type="button"
                        onClick={addThingToKnow}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition font-medium"
                      >
                        Add
                      </button>
                    </div>

                    {editFormData.thingsToKnow &&
                    editFormData.thingsToKnow.length > 0 ? (
                      <ul className="space-y-2">
                        {editFormData.thingsToKnow.map((item, index) => (
                          <li
                            key={index}
                            className="flex items-center justify-between bg-slate-700/50 border border-indigo-500/20 rounded-lg px-4 py-2 hover:border-indigo-500/40 transition"
                          >
                            <span className="text-indigo-200 text-sm">
                              {item}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeThingToKnow(index)}
                              className="text-indigo-400/50 hover:text-rose-400 transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-indigo-300/50">
                        No items added yet.
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Services-specific fields */}
              {selectedDraft.type === "services" && (
                <>
                  {/* Category, Base Price, Duration */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-indigo-300 mb-2">
                        Category *
                      </label>
                      <select
                        value={editFormData.category}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            category: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100"
                      >
                        <option value="Home Services">Home Services</option>
                        <option value="Automotive">Automotive</option>
                        <option value="Tech Support">Tech Support</option>
                        <option value="Beauty & Spa">Beauty & Spa</option>
                        <option value="Health & Wellness">
                          Health & Wellness
                        </option>
                        <option value="Photography">Photography</option>
                        <option value="Tutoring">Tutoring</option>
                        <option value="Repair & Maintenance">
                          Repair & Maintenance
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-indigo-300 mb-2">
                        Base Price (₱) *
                      </label>
                      <input
                        type="number"
                        value={editFormData.basePrice}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            basePrice: e.target.value,
                          })
                        }
                        placeholder="500"
                        className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-indigo-300 mb-2">
                        Duration (hours) *
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={editFormData.duration}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            duration: e.target.value,
                          })
                        }
                        placeholder="2"
                        className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100"
                      />
                    </div>
                  </div>

                  {/* Response Time & Experience Years */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-indigo-300 mb-2">
                        Response Time
                      </label>
                      <input
                        type="text"
                        value={editFormData.responseTime}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            responseTime: e.target.value,
                          })
                        }
                        placeholder="e.g., Within 24 hours"
                        className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-indigo-300 mb-2">
                        Experience Years
                      </label>
                      <input
                        type="number"
                        value={editFormData.experienceYears}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            experienceYears: e.target.value,
                          })
                        }
                        placeholder="5"
                        className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100"
                      />
                    </div>
                  </div>

                  {/* Available Date Ranges */}
                  <div>
                    <label className="block text-sm font-medium text-indigo-300 mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Available Date Ranges
                    </label>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs text-indigo-300/60 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={newDateRangeStart}
                          onChange={(e) => setNewDateRangeStart(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-indigo-300/60 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={newDateRangeEnd}
                          onChange={(e) => setNewDateRangeEnd(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={addAvailableDateRange}
                      className="w-full mb-4 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white rounded-lg transition font-medium flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      Add Date Range
                    </button>

                    {editFormData.availableDates &&
                    editFormData.availableDates.length > 0 ? (
                      <div className="space-y-2">
                        {editFormData.availableDates.map((range, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-slate-700/50 border border-indigo-500/20 rounded-lg px-4 py-2"
                          >
                            <span className="text-indigo-200 text-sm">
                              {new Date(range.startDate).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}{" "}
                              -{" "}
                              {new Date(range.endDate).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
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
                      <p className="text-sm text-indigo-300/50">
                        No date ranges added yet
                      </p>
                    )}
                  </div>

                  {/* Completed Jobs */}
                  <div>
                    <label className="block text-sm font-medium text-indigo-300 mb-2">
                      Completed Jobs
                    </label>
                    <input
                      type="number"
                      value={editFormData.completedJobs}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          completedJobs: e.target.value,
                        })
                      }
                      placeholder="50"
                      className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100"
                    />
                  </div>

                  {/* Service Types */}
                  <div>
                    <label className="block text-sm font-medium text-indigo-300 mb-2">
                      Service Types
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newEditServiceType}
                        onChange={(e) => setNewEditServiceType(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && addServiceType()
                        }
                        placeholder="e.g., Installation, Repair"
                        className="flex-1 px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                      />
                      <button
                        type="button"
                        onClick={addServiceType}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition font-medium"
                      >
                        Add
                      </button>
                    </div>
                    {editFormData.serviceTypes &&
                    editFormData.serviceTypes.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {editFormData.serviceTypes.map((type, index) => (
                          <div
                            key={index}
                            className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                          >
                            {type}
                            <button
                              type="button"
                              onClick={() => removeServiceType(index)}
                              className="hover:text-indigo-900"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-indigo-300/50 mb-3">
                        No service types added yet.
                      </p>
                    )}
                  </div>

                  {/* Highlights */}
                  <div>
                    <label className="block text-sm font-medium text-indigo-300 mb-2">
                      Highlights
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newEditHighlight}
                        onChange={(e) => setNewEditHighlight(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addHighlight()}
                        placeholder="e.g., 24/7 Service, Licensed Professional"
                        className="flex-1 px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                      />
                      <button
                        type="button"
                        onClick={addHighlight}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition font-medium"
                      >
                        Add
                      </button>
                    </div>
                    {editFormData.highlights &&
                    editFormData.highlights.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {editFormData.highlights.map((highlight, index) => (
                          <div
                            key={index}
                            className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                          >
                            {highlight}
                            <button
                              type="button"
                              onClick={() => removeHighlight(index)}
                              className="hover:text-indigo-900"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-indigo-300/50 mb-3">
                        No highlights added yet.
                      </p>
                    )}
                  </div>

                  {/* Service Areas */}
                  <div>
                    <label className="block text-sm font-medium text-indigo-300 mb-2">
                      Service Areas
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newEditServiceArea}
                        onChange={(e) => setNewEditServiceArea(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && addServiceArea()
                        }
                        placeholder="e.g., Manila, Quezon City"
                        className="flex-1 px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                      />
                      <button
                        type="button"
                        onClick={addServiceArea}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition font-medium"
                      >
                        Add
                      </button>
                    </div>
                    {editFormData.serviceAreas &&
                    editFormData.serviceAreas.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {editFormData.serviceAreas.map((area, index) => (
                          <div
                            key={index}
                            className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                          >
                            {area}
                            <button
                              type="button"
                              onClick={() => removeServiceArea(index)}
                              className="hover:text-indigo-900"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-indigo-300/50 mb-3">
                        No service areas added yet.
                      </p>
                    )}
                  </div>

                  {/* Certifications & Licenses */}
                  <div>
                    <label className="block text-sm font-medium text-indigo-300 mb-2">
                      Certifications & Licenses
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newEditCertification}
                        onChange={(e) =>
                          setNewEditCertification(e.target.value)
                        }
                        onKeyPress={(e) =>
                          e.key === "Enter" && addCertification()
                        }
                        placeholder="e.g., Licensed Electrician, Certified Technician"
                        className="flex-1 px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                      />
                      <button
                        type="button"
                        onClick={addCertification}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition font-medium"
                      >
                        Add
                      </button>
                    </div>
                    {editFormData.certifications &&
                    editFormData.certifications.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {editFormData.certifications.map((cert, index) => (
                          <div
                            key={index}
                            className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                          >
                            {cert}
                            <button
                              type="button"
                              onClick={() => removeCertification(index)}
                              className="hover:text-indigo-900"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-indigo-300/50 mb-3">
                        No certifications added yet.
                      </p>
                    )}
                  </div>

                  {/* Terms & Conditions */}
                  <div>
                    <label className="block text-sm font-medium text-indigo-300 mb-2">
                      Terms & Conditions
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newEditTerm}
                        onChange={(e) => setNewEditTerm(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addTerm()}
                        placeholder="e.g., Payment upon completion, Cancellation policy"
                        className="flex-1 px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                      />
                      <button
                        type="button"
                        onClick={addTerm}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition font-medium"
                      >
                        Add
                      </button>
                    </div>
                    {editFormData.terms && editFormData.terms.length > 0 ? (
                      <ul className="space-y-2">
                        {editFormData.terms.map((term, index) => (
                          <li
                            key={index}
                            className="flex items-center justify-between bg-slate-700/50 border border-indigo-500/20 rounded-lg px-4 py-2 hover:border-indigo-500/40 transition"
                          >
                            <span className="text-indigo-200 text-sm">
                              {term}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeTerm(index)}
                              className="text-indigo-400/50 hover:text-rose-400 transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-indigo-300/50">
                        No terms added yet.
                      </p>
                    )}
                  </div>

                  {/* Discount */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-indigo-300 mb-2">
                        Discount Type
                      </label>
                      <select
                        value={editFormData.discount?.type || "percentage"}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            discount: {
                              ...editFormData.discount,
                              type: e.target.value,
                            },
                          })
                        }
                        className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 transition"
                      >
                        <option
                          value="percentage"
                          className="bg-slate-800 text-indigo-100"
                        >
                          Percentage
                        </option>
                        <option
                          value="fixed"
                          className="bg-slate-800 text-indigo-100"
                        >
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
                        value={editFormData.discount?.value || ""}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            discount: {
                              ...editFormData.discount,
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
                      value={editFormData.promoCode || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          promoCode: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="e.g., SUMMER20"
                      className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gradient-to-r from-slate-800 to-slate-900 border-t border-indigo-500/30 p-6 flex gap-3 z-[999] backdrop-blur-sm">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedDraft(null);
                  setNewEditRule("");
                  setPreviewImages([]);
                }}
                className="flex-1 px-6 py-3 border border-indigo-500/30 text-indigo-300 rounded-lg hover:bg-slate-700/50 hover:border-indigo-500/50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveEditedDraft(false)}
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
                  border: 1px solid rgba(99, 102, 241, 0.2);
                  border-radius: 0.75rem;
                }
                .rdrMonth {
                  width: 100%;
                  padding: 1rem;
                }
                .rdrMonthAndYearPickers {
                  background-color: rgba(51, 65, 85, 0.5);
                  border-radius: 0.5rem;
                  padding: 0.5rem;
                  margin-bottom: 1rem;
                }
                .rdrDayNumber,
                .rdrMonthYearLabel {
                  color: #e0e7ff;
                }
                .rdrDayNumber span {
                  color: #e0e7ff;
                }
                .rdrDays {
                  display: flex;
                  flex-wrap: wrap;
                  gap: 0.25rem;
                }
                .rdrDay {
                  width: calc((100% - 1.5rem) / 7);
                }
                .rdrDayDisabled {
                  background-color: transparent;
                }
                .rdrDayStartPreview,
                .rdrDayInPreview,
                .rdrDayEndPreview {
                  background-color: rgba(99, 102, 241, 0.2);
                  border-color: rgba(99, 102, 241, 0.3);
                }
                .rdrDayStartOfMonth,
                .rdrDayEndOfMonth {
                  background-color: transparent;
                }
                .rdrDayStartOfWeek,
                .rdrDayEndOfWeek {
                  border: none;
                }
                .rdrDayToday .rdrDayNumber span::after {
                  background-color: #6366f1;
                }
                .rdrDaySelected,
                .rdrDayStartOfMonth,
                .rdrDayEndOfMonth {
                  background-color: #6366f1 !important;
                  border-color: #4f46e5 !important;
                }
                .rdrStartEdge {
                  border-radius: 0.5rem 0 0 0.5rem;
                  background-color: #6366f1;
                }
                .rdrEndEdge {
                  border-radius: 0 0.5rem 0.5rem 0;
                  background-color: #6366f1;
                }
              `}</style>
              <DateRange
                ranges={dateRangeState}
                onChange={(item) => setDateRangeState([item.selection])}
                months={1}
                direction="vertical"
                showMonthAndYearPickers={true}
              />
            </div>

            {/* Footer */}
            <div className="flex gap-3 pt-4 border-t border-indigo-500/20">
              <button
                onClick={() => setShowDateRangeModal(false)}
                className="flex-1 px-4 py-2 border border-indigo-500/30 text-indigo-300 rounded-lg hover:bg-slate-700/50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={addDateRangeFromModal}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition font-medium"
              >
                Add Date Range
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedDraft && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl max-w-md w-full p-6 border border-indigo-500/30 shadow-2xl shadow-indigo-500/20">
            <div className="w-12 h-12 bg-rose-600/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/50">
              <Trash2 className="w-6 h-6 text-rose-400" />
            </div>
            <h3 className="text-xl font-bold text-indigo-100 text-center mb-2">
              Delete Draft
            </h3>
            <p className="text-indigo-300/70 text-center mb-6">
              Are you sure you want to delete "
              {selectedDraft.title || "this draft"}"? This action cannot be
              undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedDraft(null);
                }}
                className="flex-1 px-6 py-3 border border-indigo-500/30 text-indigo-200 rounded-lg hover:bg-slate-700/50 hover:border-indigo-500/60 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDraft}
                className="flex-1 px-6 py-3 bg-rose-600/30 text-rose-200 rounded-lg hover:bg-rose-600/50 transition font-medium border border-rose-500/50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
