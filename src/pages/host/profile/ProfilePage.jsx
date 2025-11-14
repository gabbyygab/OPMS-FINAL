import { useState, useEffect } from "react";
import {
  Calendar,
  MapPin,
  Clock,
  Shield,
  User,
  ChevronRight,
  Plus,
  Ticket,
  Tag,
  Trash2,
  X,
  Heart,
  Loader,
} from "lucide-react";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { useAuth } from "../../../context/AuthContext";
import { db } from "../../../firebase/firebase";
import {
  updateDoc,
  doc,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { uploadToCloudinary } from "../../../cloudinary/uploadFunction";
import {
  getAuth,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../constants/routes";
import NavigationBar from "../../../components/NavigationBar";

export default function ProfilePage() {
  // Navigation and auth
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [activeTab, setActiveTab] = useState("personal");

  // Personal Info State
  const [formData, setFormData] = useState({
    fullName: userData?.fullName || "",
    email: userData?.email || "",
    phone: userData?.phone || "",
    address: userData?.address || "",
    photoURL: userData?.photoURL || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Bookings State
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bookingsPage, setBookingsPage] = useState(1);
  const bookingsPerPage = 3;

  // Wishlist State
  const [wishlistItem, setWishlistItem] = useState("");
  const [wishlistDescription, setWishlistDescription] = useState("");
  const [wishlists, setWishlists] = useState([]);
  const [loadingWishlists, setLoadingWishlists] = useState(true);
  const [showWishlistModal, setShowWishlistModal] = useState(false);

  // Coupons State (for hosts)
  const [couponFormData, setCouponFormData] = useState({
    code: "",
    discount: "",
    type: "percentage",
    startDate: "",
    expiryDate: "",
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [addingCoupon, setAddingCoupon] = useState(false);
  const [togglingCouponId, setTogglingCouponId] = useState(null);
  const [deletingCouponId, setDeletingCouponId] = useState(null);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 30);
    return [
      {
        startDate: today,
        endDate: futureDate,
        key: "selection",
      },
    ];
  });
  const [couponToDelete, setCouponToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const activeCoupons = coupons.filter((c) => c.active);
  const inactiveCoupons = coupons.filter((c) => !c.active);

  // Fetch bookings from Firestore
  useEffect(() => {
    const fetchBookings = async () => {
      if (!userData?.id) return;

      try {
        setLoadingBookings(true);
        const bookingsRef = collection(db, "bookings");
        const bookingsQuery = query(
          bookingsRef,
          where("guest_id", "==", userData.id)
        );
        const bookingsSnapshot = await getDocs(bookingsQuery);

        const bookingsWithListings = await Promise.all(
          bookingsSnapshot.docs.map(async (bookingDoc) => {
            const bookingData = bookingDoc.data();
            const listingRef = doc(db, "listings", bookingData.listing_id);
            const listingSnap = await getDoc(listingRef);
            const listingData = listingSnap.exists() ? listingSnap.data() : {};

            const checkInDate = bookingData.checkIn?.toDate
              ? bookingData.checkIn.toDate()
              : new Date(bookingData.checkIn);
            const checkOutDate = bookingData.checkOut?.toDate
              ? bookingData.checkOut.toDate()
              : new Date(bookingData.checkOut);

            const today = new Date();
            const status = checkOutDate < today ? "Completed" : "Upcoming";

            return {
              id: bookingDoc.id,
              property: listingData.title || "Unknown Property",
              location: listingData.location || "Unknown Location",
              checkIn: checkInDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              checkOut: checkOutDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              status,
              bookingStatus: bookingData.status || "pending",
              image: listingData.photos?.[0] || "/default-image.png",
              totalAmount: bookingData.grandTotal || 0,
            };
          })
        );

        setBookings(bookingsWithListings);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        toast.error("Failed to load bookings.");
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchBookings();
  }, [userData?.id]);

  // Fetch wishlists from Firestore
  useEffect(() => {
    const fetchWishlists = async () => {
      if (!userData?.id || userData?.role !== "guest") return;

      try {
        setLoadingWishlists(true);
        const wishlistRef = collection(db, "wishlists");
        const wishlistQuery = query(
          wishlistRef,
          where("userId", "==", userData.id)
        );
        const wishlistSnapshot = await getDocs(wishlistQuery);

        const wishlistData = wishlistSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setWishlists(wishlistData);
      } catch (error) {
        console.error("Error fetching wishlists:", error);
      } finally {
        setLoadingWishlists(false);
      }
    };

    fetchWishlists();
  }, [userData?.id, userData?.role]);

  // Fetch coupons from Firestore (hosts only)
  useEffect(() => {
    const fetchCoupons = async () => {
      if (!userData?.id || userData?.role !== "host") return;

      try {
        setLoadingCoupons(true);
        const couponsRef = collection(db, "coupons");
        const couponsQuery = query(
          couponsRef,
          where("hostId", "==", userData.id)
        );
        const couponsSnapshot = await getDocs(couponsQuery);

        const couponsData = couponsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setCoupons(couponsData);
      } catch (error) {
        console.error("Error fetching coupons:", error);
        toast.error("Failed to load coupons.");
      } finally {
        setLoadingCoupons(false);
      }
    };

    fetchCoupons();
  }, [userData?.id, userData?.role]);

  // Wishlist handlers
  const handleAddWishlistItem = async () => {
    if (!wishlistItem.trim()) {
      toast.error("Please enter a wishlist item");
      return;
    }

    try {
      // Determine priority based on whether guest has bookings
      const priority = bookings.length > 0 ? "high" : "medium";

      const wishlistRef = collection(db, "wishlists");
      await addDoc(wishlistRef, {
        userId: userData.id,
        userName: userData.fullName,
        userEmail: userData.email,
        item: wishlistItem.trim(),
        description: wishlistDescription.trim(),
        createdAt: new Date(),
        priority: priority,
      });

      toast.success("Wishlist item added!");
      setWishlistItem("");
      setWishlistDescription("");

      // Refresh wishlists
      const wishlistQuery = query(
        collection(db, "wishlists"),
        where("userId", "==", userData.id)
      );
      const wishlistSnapshot = await getDocs(wishlistQuery);
      const wishlistData = wishlistSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setWishlists(wishlistData);
      setShowWishlistModal(false);
    } catch (error) {
      console.error("Error adding wishlist item:", error);
      toast.error("Failed to add wishlist item");
    }
  };

  const handleDeleteWishlistItem = async (id) => {
    try {
      await deleteDoc(doc(db, "wishlists", id));
      setWishlists(wishlists.filter((item) => item.id !== id));
      toast.success("Wishlist item deleted!");
    } catch (error) {
      console.error("Error deleting wishlist item:", error);
      toast.error("Failed to delete wishlist item");
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return toast.error("No user logged in");
    const confirmDelete = window.confirm(
      "Are you sure? This action is permanent."
    );
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);
      toast.success("Your account has been deleted.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete account.");
    }
  };

  const handlePasswordUpdate = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) return toast.error("No user is currently logged in.");
    if (!currentPassword || !newPassword || !confirmPassword)
      return toast.error("Please fill in all fields.");
    if (newPassword !== confirmPassword)
      return toast.error("New passwords do not match.");
    if (newPassword.length < 6)
      return toast.error("Password must be at least 6 characters long.");

    setLoading(true);

    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error updating password:", error);
      if (error.code === "auth/wrong-password") {
        toast.error("Current password is incorrect.");
      } else if (error.code === "auth/weak-password") {
        toast.error("Password should be at least 6 characters.");
      } else {
        toast.error("Failed to update password. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isGoogleUser = user?.providerData?.some(
    (provider) => provider.providerId === "google.com"
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), formData);
      toast.success("Changes saved successfully!");
    } catch (error) {
      console.error("Error saving changes:", error);
      toast.error("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCoupon = async () => {
    // Validation
    if (!couponFormData.code.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }
    if (!couponFormData.discount || parseFloat(couponFormData.discount) <= 0) {
      toast.error("Please enter a valid discount value");
      return;
    }
    if (!couponFormData.startDate) {
      toast.error("Please select a start date");
      return;
    }
    if (!couponFormData.expiryDate) {
      toast.error("Please select an expiry date");
      return;
    }

    // Validate dates
    const startDate = new Date(couponFormData.startDate);
    const expiryDate = new Date(couponFormData.expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (startDate < today) {
      toast.error("Start date must be today or in the future");
      return;
    }
    
    if (expiryDate <= startDate) {
      toast.error("Expiry date must be after start date");
      return;
    }

    // Check if code already exists
    const codeExists = coupons.some(
      (c) => c.code.toUpperCase() === couponFormData.code.toUpperCase()
    );
    if (codeExists) {
      toast.error("Coupon code already exists");
      return;
    }

    setAddingCoupon(true);
    try {
      const couponsRef = collection(db, "coupons");
      const newCoupon = {
        hostId: userData.id,
        code: couponFormData.code.toUpperCase(),
        discount: parseFloat(couponFormData.discount),
        type: couponFormData.type, // "percentage" or "fixed"
        startDate: couponFormData.startDate,
        expiryDate: couponFormData.expiryDate,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(couponsRef, newCoupon);

      // Add to local state
      setCoupons([
        ...coupons,
        {
          id: docRef.id,
          ...newCoupon,
        },
      ]);

      // Reset form
      setCouponFormData({
        code: "",
        discount: "",
        type: "percentage",
        startDate: "",
        expiryDate: "",
      });
      setShowAddModal(false);
      toast.success("Coupon added successfully!");
    } catch (error) {
      console.error("Error adding coupon:", error);
      toast.error("Failed to add coupon. Please try again.");
    } finally {
      setAddingCoupon(false);
    }
  };

  const toggleCouponStatus = async (id) => {
    setTogglingCouponId(id);
    try {
      const couponToToggle = coupons.find((c) => c.id === id);
      if (!couponToToggle) return;

      const newStatus = !couponToToggle.active;

      // Update in Firestore
      await updateDoc(doc(db, "coupons", id), {
        active: newStatus,
        updatedAt: new Date(),
      });

      // Update local state
      setCoupons(
        coupons.map((coupon) =>
          coupon.id === id ? { ...coupon, active: newStatus } : coupon
        )
      );

      toast.success(
        `Coupon ${newStatus ? "activated" : "deactivated"} successfully!`
      );
    } catch (error) {
      console.error("Error toggling coupon status:", error);
      toast.error("Failed to update coupon status.");
    } finally {
      setTogglingCouponId(null);
    }
  };

  const deleteCoupon = async () => {
    if (!couponToDelete) return;

    setDeletingCouponId(couponToDelete);
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, "coupons", couponToDelete));

      // Update local state
      setCoupons(coupons.filter((coupon) => coupon.id !== couponToDelete));
      toast.success("Coupon deleted successfully!");
      setShowDeleteModal(false);
      setCouponToDelete(null);
    } catch (error) {
      console.error("Error deleting coupon:", error);
      toast.error("Failed to delete coupon.");
    } finally {
      setDeletingCouponId(null);
    }
  };

  const handleDeleteCouponClick = (id) => {
    setCouponToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDateRangeChange = (ranges) => {
    setDateRange([ranges.selection]);
  };

  const handleOpenDatePicker = () => {
    // If there are already dates, initialize the date range with them
    if (couponFormData.startDate && couponFormData.expiryDate) {
      setDateRange([
        {
          startDate: new Date(couponFormData.startDate),
          endDate: new Date(couponFormData.expiryDate),
          key: "selection",
        },
      ]);
    } else if (couponFormData.startDate) {
      // Only start date exists
      const start = new Date(couponFormData.startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + 30);
      setDateRange([
        {
          startDate: start,
          endDate: end,
          key: "selection",
        },
      ]);
    } else {
      // Reset to default (today and 30 days from now)
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 30);
      setDateRange([
        {
          startDate: today,
          endDate: futureDate,
          key: "selection",
        },
      ]);
    }
    setShowDatePickerModal(true);
  };

  const handleApplyDates = () => {
    const startDate = dateRange[0].startDate;
    const endDate = dateRange[0].endDate;
    const formattedStartDate = startDate.toISOString().split("T")[0];
    const formattedEndDate = endDate.toISOString().split("T")[0];
    setCouponFormData({
      ...couponFormData,
      startDate: formattedStartDate,
      expiryDate: formattedEndDate,
    });
    setShowDatePickerModal(false);
  };

  const formatDateForDisplay = (dateString, placeholder = "Select date") => {
    if (!dateString) return placeholder;
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <NavigationBar user={user} userData={userData} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 pt-[90px]">
        {/* Mobile Tabs - Horizontal Scroll */}
        <div className="lg:hidden mb-6 flex gap-2 overflow-x-auto pb-4">
          {[
            { id: "personal", label: "Personal", icon: User },
            { id: "security", label: "Security", icon: Shield },
            ...(userData?.role === "guest"
              ? [
                  { id: "bookings", label: "Bookings", icon: Calendar },
                  { id: "wishlists", label: "Wishlist", icon: Heart },
                ]
              : [{ id: "coupons", label: "Coupons", icon: Ticket }]),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all font-medium text-sm ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg"
                  : "bg-slate-800/50 text-indigo-200 hover:bg-indigo-500/20"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Hidden on mobile */}
          <div className="hidden lg:block">
            <nav className="sticky top-24 space-y-2 bg-slate-800 rounded-xl p-3 shadow-lg border border-indigo-500/20">
              {[
                { id: "personal", label: "Personal info", icon: User },
                { id: "security", label: "Login & security", icon: Shield },
                ...(userData?.role === "guest"
                  ? [
                      { id: "bookings", label: "Bookings", icon: Calendar },
                      { id: "wishlists", label: "Wishlist", icon: Heart },
                    ]
                  : [{ id: "coupons", label: "Coupons", icon: Ticket }]),
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all font-medium ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg"
                      : "hover:bg-indigo-500/10 text-indigo-200 hover:text-white"
                  }`}
                >
                  <tab.icon className="w-5 h-5 flex-shrink-0" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Personal Info Tab */}
            {activeTab === "personal" && (
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-xl shadow-2xl p-6 md:p-8 border border-indigo-500/20">
                <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text mb-2">
                  Personal Information
                </h2>
                <p className="text-indigo-200/70 mb-8">
                  Update your profile details and picture
                </p>

                {/* Profile Picture */}
                <div className="mb-8">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <div className="relative flex-shrink-0">
                      <img
                        src={formData.photoURL || "/default-avatar.png"}
                        alt="Profile"
                        className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-indigo-500 shadow-lg"
                      />
                      <label
                        htmlFor="profileImageUpload"
                        className="absolute bottom-0 right-0 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-full p-2 cursor-pointer hover:from-indigo-700 hover:to-indigo-600 transition shadow-lg"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 112.828 2.828L11.828 15.828A2 2 0 019 17.657V13z"
                          />
                        </svg>
                      </label>
                      <input
                        id="profileImageUpload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;

                          toast.info("Uploading image...");
                          try {
                            const imageUrl = await uploadToCloudinary(file);
                            setFormData({
                              ...formData,
                              photoURL: imageUrl,
                            });
                            toast.success("Profile picture updated!");
                          } catch (uploadError) {
                            toast.error(
                              "Failed to upload image. Please try again."
                            );
                          }
                        }}
                      />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <p className="text-sm text-indigo-300/70">
                        Click the edit icon to change your photo
                      </p>
                      <p className="text-xs text-indigo-200/50 mt-2">
                        Supported formats: JPG, PNG (Max 5MB)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <form className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-medium text-indigo-200 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="w-full bg-[#1e293b] border border-indigo-500/20 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:border-indigo-500/40 transition"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-indigo-200 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full bg-[#1e293b] border border-indigo-500/20 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:border-indigo-500/40 transition"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-indigo-200 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full bg-[#1e293b] border border-indigo-500/20 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:border-indigo-500/40 transition"
                      />
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-sm font-medium text-indigo-200 mb-2">
                        Address
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full bg-[#1e293b] border border-indigo-500/20 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:border-indigo-500/40 transition"
                      />
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                      className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold px-6 py-2.5 rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          Save Changes
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-xl shadow-2xl p-6 md:p-8 border border-indigo-500/20">
                <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text mb-2">
                  Login & Security
                </h2>
                <p className="text-indigo-200/70 mb-8">
                  Manage your password and account security
                </p>

                <div className="space-y-6">
                  {!isGoogleUser && (
                    <div className="border border-indigo-500/30 rounded-xl p-6 bg-slate-700/30">
                      <h3 className="text-lg md:text-xl font-bold text-indigo-300 mb-6">
                        Password
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-indigo-200 mb-2">
                            Current Password
                          </label>
                          <input
                            type="password"
                            id="password"
                            className="w-full px-4 py-3 bg-[#1e293b] border border-indigo-500/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500/40 transition"
                            placeholder="Enter current password"
                            onChange={(e) => setCurrentPassword(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-indigo-200 mb-2">
                            New Password
                          </label>
                          <input
                            type="password"
                            id="newPassword"
                            className="w-full px-4 py-3 bg-[#1e293b] border border-indigo-500/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500/40 transition"
                            placeholder="Enter new password"
                            onChange={(e) => setNewPassword(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-indigo-200 mb-2">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            id="confirmPassword"
                            className="w-full px-4 py-3 bg-[#1e293b] border border-indigo-500/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500/40 transition"
                            placeholder="Confirm new password"
                            onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                        </div>
                        <button
                          onClick={handlePasswordUpdate}
                          disabled={loading}
                          className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition-all font-semibold shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {loading ? "Updating..." : "Update Password"}
                        </button>
                      </div>
                    </div>
                  )}

                  {isGoogleUser && (
                    <div className="border border-indigo-500/30 rounded-xl p-6 bg-slate-700/30">
                      <h3 className="text-lg font-bold text-indigo-300 mb-2">
                        Password
                      </h3>
                      <p className="text-indigo-200/70 mb-4">
                        You signed in using <strong>Google</strong>. Password
                        changes are managed through your Google account
                        settings.
                      </p>
                      <a
                        href="https://myaccount.google.com/security"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition-all font-semibold shadow-lg"
                      >
                        Manage in Google Account
                      </a>
                    </div>
                  )}

                  <div className="border border-red-500/30 rounded-xl p-6 bg-red-500/10">
                    <h3 className="text-lg font-bold text-red-300 mb-4">
                      Account Management
                    </h3>
                    <button
                      onClick={handleDeleteAccount}
                      className="text-red-400 hover:text-red-300 hover:underline font-semibold transition"
                    >
                      Delete your account permanently
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === "bookings" && userData?.role === "guest" && (
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-xl shadow-2xl p-6 md:p-8 border border-indigo-500/20">
                <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text mb-2">
                  My Bookings
                </h2>
                <p className="text-indigo-200/70 mb-8">
                  View and manage your reservations
                </p>

                {loadingBookings ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
                      <p className="text-indigo-200">Loading bookings...</p>
                    </div>
                  </div>
                ) : bookings.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      {bookings
                        .slice(
                          (bookingsPage - 1) * bookingsPerPage,
                          bookingsPage * bookingsPerPage
                        )
                        .map((booking) => (
                      <div
                        key={booking.id}
                        className="border border-indigo-500/30 rounded-xl overflow-hidden hover:shadow-2xl hover:border-indigo-500/50 transition-all bg-slate-700/20 backdrop-blur-sm"
                      >
                        <div className="flex flex-col sm:flex-row gap-6 p-4 md:p-6">
                          <img
                            src={booking.image}
                            alt={booking.property}
                            className="w-full sm:w-40 h-40 sm:h-32 object-cover rounded-lg flex-shrink-0"
                          />

                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-3">
                                <div>
                                  <h3 className="text-lg md:text-xl font-bold text-indigo-100">
                                    {booking.property}
                                  </h3>
                                  <p className="text-indigo-200/70 flex items-center gap-1 text-sm">
                                    <MapPin className="w-4 h-4" />
                                    {booking.location}
                                  </p>
                                </div>
                                <span
                                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border ${
                                    booking.bookingStatus === "confirmed"
                                      ? "bg-green-500/20 text-green-300 border-green-500/30"
                                      : booking.bookingStatus === "pending"
                                      ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                                      : booking.bookingStatus === "rejected"
                                      ? "bg-red-500/20 text-red-300 border-red-500/30"
                                      : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                  }`}
                                >
                                  {booking.bookingStatus?.charAt(0).toUpperCase() +
                                    booking.bookingStatus?.slice(1) || "Unknown"}
                                </span>
                              </div>

                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-indigo-200/70 mb-4 text-sm">
                                <span className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  {booking.checkIn}
                                </span>
                                <span className="flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  {booking.checkOut}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                              <button
                                onClick={() =>
                                  navigate(
                                    `${ROUTES.GUEST.MY_BOOKINGS}?booking=${booking.id}`
                                  )
                                }
                                className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition-all font-semibold shadow-lg text-sm"
                              >
                                View Details
                              </button>
                              <button className="w-full sm:w-auto px-6 py-2 border-2 border-indigo-500/50 text-indigo-200 rounded-lg hover:bg-indigo-500/20 transition-all font-semibold text-sm">
                                Get Help
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {bookings.length > bookingsPerPage && (
                      <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-indigo-500/20">
                        <button
                          onClick={() => setBookingsPage(Math.max(1, bookingsPage - 1))}
                          disabled={bookingsPage === 1}
                          className="px-4 py-2 border border-indigo-500/30 text-indigo-200 rounded-lg hover:bg-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                          Previous
                        </button>

                        <div className="flex gap-1">
                          {Array.from({
                            length: Math.ceil(bookings.length / bookingsPerPage),
                          }).map((_, index) => (
                            <button
                              key={index + 1}
                              onClick={() => setBookingsPage(index + 1)}
                              className={`w-10 h-10 rounded-lg font-medium transition-all ${
                                bookingsPage === index + 1
                                  ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg"
                                  : "border border-indigo-500/30 text-indigo-200 hover:bg-indigo-500/20"
                              }`}
                            >
                              {index + 1}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() =>
                            setBookingsPage(
                              Math.min(
                                Math.ceil(bookings.length / bookingsPerPage),
                                bookingsPage + 1
                              )
                            )
                          }
                          disabled={
                            bookingsPage ===
                            Math.ceil(bookings.length / bookingsPerPage)
                          }
                          className="px-4 py-2 border border-indigo-500/30 text-indigo-200 rounded-lg hover:bg-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="border border-dashed border-indigo-500/30 rounded-lg p-12 text-center bg-slate-700/20">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-indigo-400/50" />
                    <p className="text-indigo-200/70">No bookings yet</p>
                    <p className="text-indigo-200/50 mt-2">
                      Start exploring and book your first trip!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Wishlist Tab */}
            {activeTab === "wishlists" && userData?.role === "guest" && (
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-xl shadow-2xl p-6 md:p-8 border border-indigo-500/20">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text">
                      My Wishlist
                    </h2>
                    <p className="text-indigo-200/70 mt-1">
                      Share what you're looking for with hosts
                    </p>
                  </div>
                  <button
                    onClick={() => setShowWishlistModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition-all font-semibold shadow-lg text-sm whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>

                {loadingWishlists ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
                      <p className="text-indigo-200">Loading wishlists...</p>
                    </div>
                  </div>
                ) : wishlists.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {wishlists.map((wishlistItem) => (
                      <div
                        key={wishlistItem.id}
                        className="border border-indigo-500/30 rounded-xl p-4 md:p-5 bg-slate-700/20 hover:shadow-lg hover:border-indigo-500/50 transition-all backdrop-blur-sm group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h4 className="text-base md:text-lg font-bold text-indigo-100 mb-1">
                              {wishlistItem.item}
                            </h4>
                            {wishlistItem.description && (
                              <p className="text-sm text-indigo-200/70">
                                {wishlistItem.description}
                              </p>
                            )}
                            <p className="text-xs text-indigo-200/50 mt-2">
                              Added{" "}
                              {wishlistItem.createdAt
                                ? new Date(
                                    wishlistItem.createdAt.toDate?.() ||
                                      wishlistItem.createdAt
                                  ).toLocaleDateString()
                                : "recently"}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              handleDeleteWishlistItem(wishlistItem.id)
                            }
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-indigo-500/30 rounded-lg p-12 text-center bg-slate-700/20">
                    <Heart className="w-12 h-12 mx-auto mb-4 text-indigo-400/50" />
                    <p className="text-indigo-200/70">No wishlist items yet</p>
                    <p className="text-indigo-200/50 mt-2">
                      Add items to help hosts understand what you're looking
                      for!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Coupons Tab */}
            {activeTab === "coupons" && userData?.role === "host" && (
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-xl shadow-2xl p-6 md:p-8 border border-indigo-500/20">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text">
                      Coupons & Discounts
                    </h2>
                    <p className="text-indigo-200/70 mt-1">
                      Manage your promotional codes
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition-all font-semibold shadow-lg text-sm whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    Add Coupon
                  </button>
                </div>

                {loadingCoupons ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
                      <p className="text-indigo-200">Loading coupons...</p>
                    </div>
                  </div>
                ) : (
                  <>
                {/* Active Coupons */}
                <div className="mb-10">
                  <h3 className="text-lg font-bold text-indigo-300 mb-4 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-green-400" />
                    Active Coupons ({activeCoupons.length})
                  </h3>

                  {activeCoupons.length > 0 ? (
                    <div className="space-y-3">
                      {activeCoupons.map((coupon) => (
                        <div
                          key={coupon.id}
                          className="border border-green-500/30 bg-green-500/10 rounded-lg p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-lg transition-all"
                        >
                          <div className="flex-1 w-full">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-2">
                              <span className="text-lg font-bold text-indigo-200 bg-slate-700/50 px-4 py-2 rounded-lg border-2 border-indigo-500/50">
                                {coupon.code}
                              </span>
                              <div className="flex items-center gap-2">
                                {coupon.type === "percentage" ? (
                                  <>
                                    <span className="text-xl font-bold text-green-400">
                                      {coupon.discount}%
                                    </span>
                                    <span className="text-sm text-green-400/70">OFF</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-xl font-bold text-green-400">
                                      ${coupon.discount}
                                    </span>
                                    <span className="text-sm text-green-400/70">OFF</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-indigo-200/70">
                              {coupon.startDate && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  Starts: {formatDateForDisplay(coupon.startDate, "N/A")}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                Expires: {formatDateForDisplay(coupon.expiryDate, "N/A")}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => toggleCouponStatus(coupon.id)}
                              disabled={togglingCouponId === coupon.id}
                              className="flex-1 sm:flex-none px-3 py-2 bg-slate-700/50 border border-indigo-500/30 text-indigo-200 rounded-lg hover:bg-slate-700 hover:border-indigo-500/50 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {togglingCouponId === coupon.id ? (
                                <>
                                  <Loader className="w-4 h-4 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                "Deactivate"
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteCouponClick(coupon.id)}
                              disabled={deletingCouponId === coupon.id}
                              className="flex-1 sm:flex-none px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                              {deletingCouponId === coupon.id ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-dashed border-indigo-500/30 rounded-lg p-8 text-center bg-slate-700/20">
                      <p className="text-indigo-200/70">
                        No active coupons. Add one to get started!
                      </p>
                    </div>
                  )}
                </div>

                {/* Inactive Coupons */}
                {inactiveCoupons.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-indigo-300 mb-4 flex items-center gap-2">
                      <Tag className="w-5 h-5 text-slate-400" />
                      Inactive Coupons ({inactiveCoupons.length})
                    </h3>

                    <div className="space-y-3">
                      {inactiveCoupons.map((coupon) => (
                        <div
                          key={coupon.id}
                          className="border border-slate-500/20 bg-slate-700/10 rounded-lg p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 opacity-75 hover:shadow-lg transition-all"
                        >
                          <div className="flex-1 w-full">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-2">
                              <span className="text-lg font-bold text-slate-400 bg-slate-700/50 px-4 py-2 rounded-lg border-2 border-slate-500/30">
                                {coupon.code}
                              </span>
                              <div className="flex items-center gap-2">
                                {coupon.type === "percentage" ? (
                                  <>
                                    <span className="text-xl font-bold text-slate-400">
                                      {coupon.discount}%
                                    </span>
                                    <span className="text-sm text-slate-400/70">OFF</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-xl font-bold text-slate-400">
                                      ${coupon.discount}
                                    </span>
                                    <span className="text-sm text-slate-400/70">OFF</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                              {coupon.startDate && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  Starts: {formatDateForDisplay(coupon.startDate, "N/A")}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                Expires: {formatDateForDisplay(coupon.expiryDate, "N/A")}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => toggleCouponStatus(coupon.id)}
                              disabled={togglingCouponId === coupon.id}
                              className="flex-1 sm:flex-none px-3 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {togglingCouponId === coupon.id ? (
                                <>
                                  <Loader className="w-4 h-4 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                "Activate"
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteCouponClick(coupon.id)}
                              disabled={deletingCouponId === coupon.id}
                              className="flex-1 sm:flex-none px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                              {deletingCouponId === coupon.id ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Wishlist Modal - Rendered at root level */}
      {showWishlistModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm" style={{ height: '100vh' }}>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-indigo-500/30 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                Add Wishlist Item
              </h3>
              <button
                onClick={() => setShowWishlistModal(false)}
                className="text-indigo-300/70 hover:text-indigo-300 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-indigo-200 mb-2">
                  What are you looking for?
                </label>
                <input
                  type="text"
                  value={wishlistItem}
                  onChange={(e) => setWishlistItem(e.target.value)}
                  placeholder="e.g., 3 bedroom apartment"
                  className="w-full px-4 py-3 bg-[#1e293b] border border-indigo-500/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500/40 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-indigo-200 mb-2">
                  Additional Details (Optional)
                </label>
                <textarea
                  value={wishlistDescription}
                  onChange={(e) =>
                    setWishlistDescription(e.target.value)
                  }
                  placeholder="e.g., Near public transport, WiFi required..."
                  rows={3}
                  className="w-full px-4 py-3 bg-[#1e293b] border border-indigo-500/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500/40 transition resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowWishlistModal(false)}
                className="flex-1 px-4 py-2.5 border-2 border-indigo-500/30 text-indigo-200 rounded-lg hover:bg-indigo-500/10 hover:border-indigo-500/50 transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddWishlistItem}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition-all font-semibold shadow-lg"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Coupon Modal - Rendered at root level */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm" style={{ height: '100vh' }}>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-indigo-500/30 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                Add Coupon
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-indigo-300/70 hover:text-indigo-300 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-indigo-200 mb-2">
                  Coupon Code
                </label>
                <input
                  type="text"
                  value={couponFormData.code}
                  onChange={(e) =>
                    setCouponFormData({
                      ...couponFormData,
                      code: e.target.value,
                    })
                  }
                  placeholder="e.g., SUMMER20"
                  className="w-full px-4 py-2.5 bg-[#1e293b] border border-indigo-500/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500/40 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-indigo-200 mb-2">
                    Discount Value
                  </label>
                  <input
                    type="number"
                    value={couponFormData.discount}
                    onChange={(e) =>
                      setCouponFormData({
                        ...couponFormData,
                        discount: e.target.value,
                      })
                    }
                    placeholder="e.g., 20"
                    className="w-full px-4 py-2.5 bg-[#1e293b] border border-indigo-500/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500/40 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-indigo-200 mb-2">
                    Type
                  </label>
                  <select
                    value={couponFormData.type}
                    onChange={(e) =>
                      setCouponFormData({
                        ...couponFormData,
                        type: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-[#1e293b] border border-indigo-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500/40 transition"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-indigo-200 mb-2">
                  Promo Period
                </label>
                <button
                  type="button"
                  onClick={handleOpenDatePicker}
                  className="w-full px-4 py-3 bg-[#1e293b] border-2 border-indigo-500/20 rounded-lg text-white hover:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500/40 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {couponFormData.startDate && couponFormData.expiryDate ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-slate-400 mb-1">Start Date</div>
                            <div className="text-sm font-semibold text-white">
                              {formatDateForDisplay(couponFormData.startDate, "Select date")}
                            </div>
                          </div>
                          <div className="text-slate-400 mx-3">→</div>
                          <div className="text-right">
                            <div className="text-xs text-slate-400 mb-1">End Date</div>
                            <div className="text-sm font-semibold text-white">
                              {formatDateForDisplay(couponFormData.expiryDate, "Select date")}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-400 text-sm">Select promo period</div>
                      )}
                    </div>
                    <Calendar className="w-5 h-5 text-indigo-400 ml-3" />
                  </div>
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                disabled={addingCoupon}
                className="flex-1 px-4 py-2.5 border-2 border-indigo-500/30 text-indigo-200 rounded-lg hover:bg-indigo-500/10 hover:border-indigo-500/50 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCoupon}
                disabled={addingCoupon}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {addingCoupon ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Coupon"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date Range Picker Modal for Expiry Date */}
      {showDatePickerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl w-full max-w-xl max-h-[80vh] overflow-hidden flex flex-col border border-indigo-500/30 shadow-2xl shadow-indigo-500/20">
            <div className="overflow-y-auto flex-1 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-indigo-200 bg-clip-text text-transparent flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                  Select Promo Period
                </h3>
                <button
                  onClick={() => setShowDatePickerModal(false)}
                  className="text-indigo-400/60 hover:text-indigo-400 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

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
                    background-color: transparent !important;
                    cursor: not-allowed !important;
                    opacity: 0.3 !important;
                  }
                  .rdrDayDisabled .rdrDayNumber span {
                    color: #475569 !important;
                    text-decoration: line-through !important;
                  }
                  .rdrDayPassive {
                    opacity: 0.3 !important;
                    pointer-events: none !important;
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
                  /* Scrollbar Styling */
                  div:has(> .DateRange)::-webkit-scrollbar {
                    width: 8px;
                  }
                  div:has(> .DateRange)::-webkit-scrollbar-track {
                    background-color: rgba(30, 41, 59, 0.5);
                    border-radius: 10px;
                  }
                  div:has(> .DateRange)::-webkit-scrollbar-thumb {
                    background: linear-gradient(180deg, #6366f1 0%, #818cf8 100%);
                    border-radius: 10px;
                    border: 2px solid rgba(30, 41, 59, 0.5);
                  }
                  div:has(> .DateRange)::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(180deg, #818cf8 0%, #a5b4fc 100%);
                  }
                `}</style>
                <DateRange
                  editableDateInputs={false}
                  onChange={handleDateRangeChange}
                  moveRangeOnFirstSelection={false}
                  ranges={dateRange}
                  months={2}
                  direction="horizontal"
                  showMonthAndYearPickers={false}
                  minDate={new Date()}
                />
              </div>

              <div className="mb-4 p-4 bg-slate-900/50 rounded-lg border border-indigo-500/20">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Start Date</div>
                    <div className="text-sm font-semibold text-white">
                      {dateRange[0].startDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                  <div className="text-slate-500">→</div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400 mb-1">Expiry Date</div>
                    <div className="text-sm font-semibold text-white">
                      {dateRange[0].endDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-400 text-center mt-3">
                  Promo valid for {Math.ceil(
                    (dateRange[0].endDate - dateRange[0].startDate) /
                      (1000 * 60 * 60 * 24)
                  )}{" "}
                  day(s)
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gradient-to-br from-slate-800 to-slate-900 border-t border-slate-700/50 p-5 rounded-b-2xl">
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDatePickerModal(false)}
                  className="flex-1 px-4 py-2 border border-indigo-500/30 text-indigo-300 rounded-lg hover:bg-slate-700/50 hover:border-indigo-500/50 transition font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyDates}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition flex items-center justify-center gap-2 font-medium text-sm shadow-lg shadow-indigo-500/20"
                >
                  <Calendar className="w-4 h-4" />
                  Apply Dates
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[10000] p-4 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-red-500/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-red-400 flex items-center gap-2">
                <Trash2 className="w-6 h-6" />
                Delete Coupon
              </h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setCouponToDelete(null);
                }}
                className="text-slate-400 hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-300 mb-6">
              Are you sure you want to delete this coupon? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setCouponToDelete(null);
                }}
                disabled={deletingCouponId === couponToDelete}
                className="flex-1 px-4 py-2.5 border-2 border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={deleteCoupon}
                disabled={deletingCouponId === couponToDelete}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:from-red-700 hover:to-red-600 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deletingCouponId === couponToDelete ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
