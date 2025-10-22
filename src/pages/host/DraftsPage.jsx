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
} from "lucide-react";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import Footer from "../../components/Footer";
import { useAuth } from "../../context/AuthContext";
import NavigationBar from "../../components/NavigationBar";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants/routes";

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
    amenities: [],
    description: "",
    houseRules: [],
    photos: [],
    maxGuests: "",
    duration: "",
    availableTimes: [],
    language: "",
    thingsToKnow: [],
  });
  const [newEditRule, setNewEditRule] = useState("");
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const itemsPerPage = 6;

  // Fetch all draft listings
  const fetchDrafts = async () => {
    try {
      const listingRef = collection(db, "listings");
      const q = query(
        listingRef,
        where("host_id", "==", userData.id),
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
        amenities: draft.amenities || [],
        description: draft.description || "",
        houseRules: draft.houseRules || [],
        photos: draft.photos || [],
        maxGuests: "",
        duration: "",
        availableTimes: [],
        language: "",
        thingsToKnow: [],
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
        amenities: [],
        description: draft.description || "",
        houseRules: [],
        photos: draft.photos || [],
        maxGuests: draft.maxGuests || "",
        duration: draft.duration || "",
        availableTimes: draft.availableTimes || [],
        language: draft.language || "",
        thingsToKnow: draft.thingsToKnow || [],
      });
    }

    setShowDetailModal(false);
    setShowEditModal(true);
  };

  // Handle Save Edited Draft
  const handleSaveEditedDraft = async () => {
    if (!selectedDraft) return;

    const loadingToast = toast.loading("Saving draft...");
    try {
      const draftRef = doc(db, "listings", selectedDraft.id);

      const updateData = {
        title: editFormData.title || "",
        location: editFormData.location || "",
        price: Number(editFormData.price) || 0,
        description: editFormData.description || "",
        amenities: editFormData.amenities || [],
        houseRules: editFormData.houseRules || [],
        updated_at: serverTimestamp(),
      };

      if (selectedDraft.type === "stays") {
        updateData.numberOfGuests = Number(editFormData.guests) || 0;
        updateData.bedrooms = Number(editFormData.bedrooms) || 0;
        updateData.beds = Number(editFormData.beds) || 0;
        updateData.bathrooms = Number(editFormData.bathrooms) || 0;
      } else if (selectedDraft.type === "experiences") {
        updateData.maxGuests = Number(editFormData.maxGuests) || 0;
        updateData.duration = Number(editFormData.duration) || 0;
        updateData.availableTimes = editFormData.availableTimes || [];
        updateData.language = editFormData.language || "";
        updateData.thingsToKnow = editFormData.thingsToKnow || [];
      }

      await updateDoc(draftRef, updateData);

      // Update local state
      setDrafts((prev) =>
        prev.map((d) =>
          d.id === selectedDraft.id ? { ...d, ...updateData } : d
        )
      );

      toast.dismiss(loadingToast);
      toast.success("Draft saved successfully!");
      setShowEditModal(false);
      setSelectedDraft(null);
      setNewEditRule("");
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
                          selectedDraft.created_at.toDate()
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
                          selectedDraft.updated_at.toDate()
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
                Edit {selectedDraft.type === "stays" ? "Stay" : "Experience"}
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

              {/* Stays-specific fields */}
              {selectedDraft.type === "stays" && (
                <>
                  {/* Guests, Bedrooms, Bathrooms, Beds */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                        Bedrooms
                      </label>
                      <input
                        type="number"
                        value={editFormData.bedrooms}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            bedrooms: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-indigo-300 mb-2">
                        Beds
                      </label>
                      <input
                        type="number"
                        value={editFormData.beds}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            beds: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-indigo-300 mb-2">
                        Bathrooms
                      </label>
                      <input
                        type="number"
                        value={editFormData.bathrooms}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            bathrooms: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100"
                      />
                    </div>
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
                  {/* Max Guests & Duration */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-indigo-300 mb-2">
                        Max Guests
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
                        className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-indigo-300 mb-2">
                        Duration (hours)
                      </label>
                      <input
                        type="number"
                        value={editFormData.duration}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            duration: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100"
                      />
                    </div>
                  </div>

                  {/* Language */}
                  <div>
                    <label className="block text-sm font-medium text-indigo-300 mb-2">
                      Language
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
                      placeholder="e.g., English"
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
                        value={newEditRule || ""}
                        onChange={(e) => setNewEditRule(e.target.value)}
                        placeholder="Enter something to know"
                        className="flex-1 px-4 py-2 bg-slate-700/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 outline-none text-indigo-100 placeholder-indigo-300/40 transition"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newEditRule.trim()) {
                            setEditFormData({
                              ...editFormData,
                              thingsToKnow: [
                                ...(editFormData.thingsToKnow || []),
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
                              onClick={() => {
                                const updated =
                                  editFormData.thingsToKnow.filter(
                                    (_, i) => i !== index
                                  );
                                setEditFormData({
                                  ...editFormData,
                                  thingsToKnow: updated,
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
                        No items added yet.
                      </p>
                    )}
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
                }}
                className="flex-1 px-6 py-3 border border-indigo-500/30 text-indigo-300 rounded-lg hover:bg-slate-700/50 hover:border-indigo-500/50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditedDraft}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition flex items-center justify-center gap-2 font-medium shadow-lg shadow-indigo-500/20"
              >
                <Save className="w-5 h-5" />
                Save Changes
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

      <Footer />
    </>
  );
}
