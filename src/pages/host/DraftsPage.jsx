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

  // Handle Edit Draft
  const handleEditDraft = () => {
    if (!selectedDraft) return;

    // Navigate to the appropriate page based on type with draft data
    const routes = {
      stays: ROUTES.HOST.STAYS,
      experiences: ROUTES.HOST.EXPERIENCES,
      services: ROUTES.HOST.SERVICES,
    };

    const targetRoute = routes[selectedDraft.type];
    if (targetRoute) {
      // Store draft data in sessionStorage to pass to edit page
      sessionStorage.setItem("editDraft", JSON.stringify(selectedDraft));
      navigate(targetRoute);
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
      <div className="min-h-screen bg-slate-50">
        <NavigationBar user={user} userData={userData} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32 pb-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">My Drafts</h1>
              <p className="text-slate-600 mt-1">
                Manage your unpublished listings
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm">Total Drafts</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">
                    {drafts.length}
                  </h3>
                </div>
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                  <FileEdit className="w-6 h-6 text-slate-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm">Stays</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">
                    {drafts.filter((d) => d.type === "stays").length}
                  </h3>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Home className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm">Experiences</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">
                    {drafts.filter((d) => d.type === "experiences").length}
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
                  <p className="text-slate-600 text-sm">Services</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">
                    {drafts.filter((d) => d.type === "services").length}
                  </h3>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Category Pills & Search */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 mb-6">
            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-full font-medium transition ${
                  selectedCategory === "all"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedCategory("stays")}
                className={`px-4 py-2 rounded-full font-medium transition flex items-center gap-2 ${
                  selectedCategory === "stays"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Home className="w-4 h-4" />
                Stays
              </button>
              <button
                onClick={() => setSelectedCategory("experiences")}
                className={`px-4 py-2 rounded-full font-medium transition flex items-center gap-2 ${
                  selectedCategory === "experiences"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Calendar className="w-4 h-4" />
                Experiences
              </button>
              <button
                onClick={() => setSelectedCategory("services")}
                className={`px-4 py-2 rounded-full font-medium transition flex items-center gap-2 ${
                  selectedCategory === "services"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Briefcase className="w-4 h-4" />
                Services
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search drafts by name or location..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Drafts Grid */}
          {currentDrafts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 border border-slate-200 text-center">
              <FileEdit className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No drafts found
              </h3>
              <p className="text-slate-600">
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
                    className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition cursor-pointer flex flex-col"
                  >
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden bg-slate-200">
                      {draft.photos && draft.photos.length > 0 ? (
                        <img
                          src={draft.photos[0]}
                          alt={draft.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          No Image
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1">
                          {getCategoryIcon(draft.type)}
                          {draft.type}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-lg font-bold text-slate-900 mb-1">
                        {draft.title || "Untitled Draft"}
                      </h3>
                      <p className="text-sm text-slate-600 flex items-center gap-1 mb-3">
                        <MapPin className="w-4 h-4" />
                        {draft.location || "No location"}
                      </p>

                      {/* Type-specific details */}
                      {draft.type === "stays" && (
                        <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {draft.numberOfGuests || 0} guests
                          </span>
                        </div>
                      )}

                      {draft.type === "experiences" && (
                        <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
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
                      <div className="mt-auto pt-4 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                          <p className="text-2xl font-bold text-slate-900">
                            ₱{draft.price?.toFixed(2) || "0.00"}
                          </p>
                          <span className="text-xs text-slate-500">
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
                    className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Previous
                  </button>

                  {[...Array(totalPages)].map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(idx + 1)}
                      className={`px-4 py-2 rounded-lg transition ${
                        currentPage === idx + 1
                          ? "bg-indigo-600 text-white"
                          : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
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
                    className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {selectedDraft.title || "Untitled Draft"}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                    selectedDraft.type === "stays"
                      ? "bg-indigo-100 text-indigo-700"
                      : selectedDraft.type === "experiences"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {getCategoryIcon(selectedDraft.type)}
                  {selectedDraft.type}
                </span>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-600"
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
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    Location
                  </p>
                  <p className="text-slate-900 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {selectedDraft.location || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    Price
                  </p>
                  <p className="text-slate-900 flex items-center gap-1">
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
                      <p className="text-sm font-medium text-slate-700 mb-1">
                        Guests
                      </p>
                      <p className="text-slate-900">
                        {selectedDraft.numberOfGuests || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-1">
                        Bedrooms
                      </p>
                      <p className="text-slate-900">
                        {selectedDraft.bedrooms || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-1">
                        Beds
                      </p>
                      <p className="text-slate-900">
                        {selectedDraft.beds || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-1">
                        Bathrooms
                      </p>
                      <p className="text-slate-900">
                        {selectedDraft.bathrooms || 0}
                      </p>
                    </div>
                  </div>

                  {/* Amenities */}
                  {selectedDraft.amenities &&
                    selectedDraft.amenities.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">
                          Amenities
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedDraft.amenities.map((amenity, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
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
                        <p className="text-sm font-medium text-slate-700 mb-2">
                          House Rules
                        </p>
                        <ul className="space-y-1">
                          {selectedDraft.houseRules.map((rule, idx) => (
                            <li key={idx} className="text-slate-700 text-sm">
                              • {rule}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {/* Available Dates */}
                  {selectedDraft.availableDate && (
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">
                        Available Dates
                      </p>
                      <p className="text-slate-700 text-sm">
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
                      <p className="text-sm font-medium text-slate-700 mb-1">
                        Max Guests
                      </p>
                      <p className="text-slate-900">
                        {selectedDraft.maxGuests || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-1">
                        Duration (hours)
                      </p>
                      <p className="text-slate-900">
                        {selectedDraft.duration || 0}
                      </p>
                    </div>
                  </div>

                  {/* Available Times */}
                  {selectedDraft.availableTimes &&
                    selectedDraft.availableTimes.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">
                          Available Times
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedDraft.availableTimes.map((time, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
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
                      <p className="text-sm font-medium text-slate-700 mb-1">
                        Language
                      </p>
                      <p className="text-slate-900">{selectedDraft.language}</p>
                    </div>
                  )}

                  {/* Things to Know */}
                  {selectedDraft.thingsToKnow &&
                    selectedDraft.thingsToKnow.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">
                          Things to Know
                        </p>
                        <ul className="space-y-1">
                          {selectedDraft.thingsToKnow.map((item, idx) => (
                            <li key={idx} className="text-slate-700 text-sm">
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
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    Description
                  </p>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    {selectedDraft.description}
                  </p>
                </div>
              )}

              {/* Discount */}
              {selectedDraft.discount && selectedDraft.discount.value > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    Discount
                  </p>
                  <p className="text-slate-900">
                    {selectedDraft.discount.type === "percentage"
                      ? `${selectedDraft.discount.value}%`
                      : `₱${selectedDraft.discount.value}`}
                  </p>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    Created At
                  </p>
                  <p className="text-slate-600 text-sm">
                    {selectedDraft.created_at
                      ? new Date(
                          selectedDraft.created_at.toDate()
                        ).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    Updated At
                  </p>
                  <p className="text-slate-600 text-sm">
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
            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-6">
              <div className="flex gap-3">
                <button
                  onClick={() => openDeleteModal(selectedDraft)}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete
                </button>
                <button
                  onClick={handleEditDraft}
                  className="flex-1 px-6 py-3 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition font-medium flex items-center justify-center gap-2"
                >
                  <Edit className="w-5 h-5" />
                  Edit
                </button>
                <button
                  onClick={handlePublishDraft}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Publish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedDraft && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">
              Delete Draft
            </h3>
            <p className="text-slate-600 text-center mb-6">
              Are you sure you want to delete "{selectedDraft.title || "this draft"}"? This
              action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedDraft(null);
                }}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDraft}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
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
