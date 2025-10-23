import { useState } from "react";
import {
  Calendar,
  MapPin,
  Clock,
  Bell,
  Shield,
  User,
  Home,
  ChevronRight,
  Plus,
  Ticket,
  Tag,
  Percent,
  Trash2,
  DollarSign,
  X,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { db } from "../../../firebase/firebase";
import { updateDoc, doc } from "firebase/firestore";
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
import NavBar2 from "../../../components/NavigationBar";

export default function ProfilePage() {
  //coupons
  const [couponFormData, setCouponFormData] = useState({
    code: "",
    discount: "",
    type: "percentage",
    expiryDate: "",
    active: false,
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [coupons, setCoupons] = useState([
    {
      id: 1,
      code: "SUMMER20",
      discount: 20,
      type: "percentage",
      active: true,
      expiryDate: "2025-12-31",
    },
    {
      id: 2,
      code: "SAVE50",
      discount: 50,
      type: "fixed",
      active: true,
      expiryDate: "2025-11-15",
    },
    {
      id: 3,
      code: "WELCOME10",
      discount: 10,
      type: "percentage",
      active: false,
      expiryDate: "2025-10-30",
    },
  ]);
  const handleAddCoupon = () => {
    if (formData.code && formData.discount && formData.expiryDate) {
      setCoupons([
        ...coupons,
        {
          id: Date.now(),
          code: formData.code.toUpperCase(),
          discount: parseFloat(formData.discount),
          type: formData.type,
          active: true,
          expiryDate: formData.expiryDate,
        },
      ]);
      setFormData({
        code: "",
        discount: "",
        type: "percentage",
        expiryDate: "",
      });
      setShowAddModal(false);
    }
  };

  const toggleCouponStatus = (id) => {
    setCoupons(
      coupons.map((coupon) =>
        coupon.id === id ? { ...coupon, active: !coupon.active } : coupon
      )
    );
  };

  const deleteCoupon = (id) => {
    setCoupons(coupons.filter((coupon) => coupon.id !== id));
  };
  const activeCoupons = coupons.filter((c) => c.active);
  const inactiveCoupons = coupons.filter((c) => !c.active);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const { user, userData } = useAuth();
  const [formData, setFormData] = useState({
    fullName: userData.fullName,
    email: userData.email,
    phone: userData.phone || "N/A",
    address: userData.address || "N/A",
    photoURL: userData.photoURL || "",
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // console.log(user.photoURL);
  const bookings = [
    {
      id: 1,
      property: "Cozy Beach House",
      location: "Malibu, CA",
      checkIn: "Dec 15, 2024",
      checkOut: "Dec 20, 2024",
      status: "Upcoming",
      image:
        "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=400&h=300&fit=crop",
    },
    {
      id: 2,
      property: "Downtown Loft",
      location: "New York, NY",
      checkIn: "Oct 1, 2024",
      checkOut: "Oct 5, 2024",
      status: "Completed",
      image:
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop",
    },
    {
      id: 3,
      property: "Mountain Cabin",
      location: "Aspen, CO",
      checkIn: "Jan 10, 2025",
      checkOut: "Jan 15, 2025",
      status: "Upcoming",
      image:
        "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&h=300&fit=crop",
    },
  ];
  //deletionand deactivation
  const navigate = useNavigate();
  const handleDeleteAccount = async () => {
    if (!user) return toast.error("No user logged in");
    const confirmDelete = window.confirm(
      "Are you sure? This action is permanent."
    );
    if (!confirmDelete) return;

    try {
      // 1. Delete user document in Firestore
      await deleteDoc(doc(db, "users", user.uid));

      // 2. Delete user from Firebase Auth
      await deleteUser(user);

      toast.success("Your account has been deleted.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete account.");
    }
  };
  //logic password
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
      // 🔑 Reauthenticate first
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // 🔄 Then update the password
      await updatePassword(user, newPassword);

      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      document.getElementById("password").value = "";
      document.getElementById("confirmPassword").value = "";
      document.getElementById("newPassword").value = "";
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
  //logic profile
  const [isSaving, setIsSaving] = useState(false);

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
      // 🧩 In the future, replace with Firestore update:
      await updateDoc(doc(db, "users", user.uid), formData);

      toast.success("Changes saved successfully!");
    } catch (error) {
      console.error("Error saving changes:", error);
      toast.error("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}

      <NavBar2 user={user} userData={userData} />
      {/* Header */}
      <div className="bg-white border-b border-gray-200 mt-[70px]">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <h1 className="text-4xl font-bold text-gray-900">Account</h1>
          <p className="text-gray-600 mt-2 text-lg">
            <span className="font-semibold">{userData.fullName}</span> ·
            {userData.email}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-2 bg-white rounded-xl p-2 shadow-sm">
              <button
                onClick={() => setActiveTab("personal")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                  activeTab === "personal"
                    ? "bg-slate-900 text-white shadow-md"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <User className="w-5 h-5" />
                <span className="font-semibold">Personal info</span>
              </button>

              <button
                onClick={() => setActiveTab("security")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                  activeTab === "security"
                    ? "bg-slate-900 text-white shadow-md"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <Shield className="w-5 h-5" />
                <span className="font-semibold">Login & security</span>
              </button>

              {userData.role === "guest" ? (
                <button
                  onClick={() => setActiveTab("bookings")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                    activeTab === "bookings"
                      ? "bg-slate-900 text-white shadow-md"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <Calendar className="w-5 h-5" />
                  <span className="font-semibold">Bookings & trips</span>
                </button>
              ) : (
                <button
                  onClick={() => setActiveTab("coupons")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                    activeTab === "bookings"
                      ? "bg-slate-900 text-white shadow-md"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <Ticket className="w-5 h-5" />
                  <span className="font-semibold">Coupons</span>
                </button>
              )}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === "personal" && (
              <div className="bg-white rounded-xl shadow-sm p-8 relative">
                {/* Profile Picture Section */}
                <div className="flex flex-col items-center mb-8">
                  <div className="relative">
                    <img
                      src={formData.photoURL || "/default-avatar.png"}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-indigo-500 shadow-md"
                    />
                    <label
                      htmlFor="profileImageUpload"
                      className="absolute bottom-0 right-0 bg-indigo-600 text-white rounded-full p-2 cursor-pointer hover:bg-indigo-700 transition"
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
                          const imageUrls = await Promise.all([
                            uploadToCloudinary(file),
                          ]);
                          setFormData({
                            ...formData,
                            photoURL: imageUrls[0],
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
                  <p className="text-sm text-gray-600 mt-3">
                    Click the edit icon to change your photo
                  </p>
                </div>

                {/* Personal Info Form */}
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Personal info
                  </h2>
                  <p className="text-gray-600">Update your personal details</p>
                </div>

                <form className="space-y-5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Legal name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Email address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Phone number
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Save Button */}
                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                      className={`flex items-center gap-2 bg-indigo-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-indigo-700 transition ${
                        isSaving ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "security" && (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Login & security
                  </h2>
                  <p className="text-gray-600">
                    Update your password and secure your account
                  </p>
                </div>

                <div className="space-y-6">
                  {!isGoogleUser && (
                    <div className="border border-gray-200 rounded-xl p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-6">
                        Password
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Current password
                          </label>
                          <input
                            type="password"
                            id="password"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                            placeholder="Enter current password"
                            onChange={(e) => setCurrentPassword(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            New password
                          </label>
                          <input
                            type="password"
                            id="newPassword"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                            placeholder="Enter new password"
                            onChange={(e) => setNewPassword(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Confirm new password
                          </label>
                          <input
                            type="password"
                            id="confirmPassword"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                            placeholder="Confirm new password"
                            onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                        </div>
                        <button
                          onClick={handlePasswordUpdate}
                          className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all font-semibold shadow-md hover:shadow-lg"
                        >
                          Update password
                        </button>
                      </div>
                    </div>
                  )}

                  {isGoogleUser && (
                    <div className="border border-gray-200 rounded-xl p-6 bg-gray-50 text-gray-600">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Password
                      </h3>
                      <p>
                        You signed in using <strong>Google</strong>. Password
                        changes are managed through your Google account
                        settings.
                      </p>
                      <a
                        href="https://myaccount.google.com/security"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-3 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all font-semibold shadow-md hover:shadow-lg"
                      >
                        Manage in Google Account
                      </a>
                    </div>
                  )}
                  <div className="border border-gray-200 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      Account management
                    </h3>
                    <div className="space-y-3">
                      <button
                        onClick={handleDeleteAccount}
                        className="text-red-600 hover:underline font-semibold"
                      >
                        Delete your account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "bookings" && userData.role === "guest" && (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Trips
                  </h2>
                  <p className="text-gray-600">View and manage your bookings</p>
                </div>

                <div className="space-y-6">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all"
                    >
                      <div className="flex flex-col md:flex-row gap-6 p-6">
                        <img
                          src={booking.image}
                          alt={booking.property}
                          className="w-full md:w-48 h-48 md:h-36 object-cover rounded-lg flex-shrink-0"
                        />

                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                              <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                                  {booking.property}
                                </h3>
                                <p className="text-gray-600 flex items-center gap-1.5">
                                  <MapPin className="w-4 h-4" />
                                  {booking.location}
                                </p>
                              </div>
                              <span
                                className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                                  booking.status === "Upcoming"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {booking.status}
                              </span>
                            </div>

                            <div className="flex items-center gap-6 text-gray-600 mb-4">
                              <span className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                  {booking.checkIn}
                                </span>
                              </span>
                              <span className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                  {booking.checkOut}
                                </span>
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-3 flex-wrap">
                            <button className="px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all font-semibold shadow-md hover:shadow-lg">
                              View reservation
                            </button>
                            <button className="px-6 py-2.5 border-2 border-slate-900 text-slate-900 rounded-lg hover:bg-slate-900 hover:text-white transition-all font-semibold">
                              Get help
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "coupons" && userData.role === "host" && (
              <div className="bg-white rounded-xl shadow-sm p-8 max-h-[500px] overflow-y-auto">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Coupons & Discounts
                  </h2>
                  <p className="text-gray-600">
                    Manage your active coupons and promotions
                  </p>
                </div>

                {/* Add Coupon Button */}
                <div className="mb-8">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all font-semibold shadow-md hover:shadow-lg"
                  >
                    <Plus className="w-5 h-5" />
                    Add Coupon
                  </button>
                </div>

                {/* Active Coupons Section */}
                <div className="mb-10">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-green-600" />
                    Active Coupons ({activeCoupons.length})
                  </h3>

                  {activeCoupons.length > 0 ? (
                    <div className="space-y-3">
                      {activeCoupons.map((coupon) => (
                        <div
                          key={coupon.id}
                          className="border border-green-200 bg-green-50 rounded-lg p-5 flex items-center justify-between hover:shadow-md transition-all"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-lg font-bold text-slate-900 bg-white px-4 py-2 rounded-lg border-2 border-slate-900">
                                {coupon.code}
                              </span>
                              <div className="flex items-center gap-2">
                                {coupon.type === "percentage" ? (
                                  <>
                                    <Percent className="w-5 h-5 text-green-600" />
                                    <span className="text-2xl font-bold text-green-600">
                                      {coupon.discount}%
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <DollarSign className="w-5 h-5 text-green-600" />
                                    <span className="text-2xl font-bold text-green-600">
                                      ${coupon.discount}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600">
                              Expires: {coupon.expiryDate}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleCouponStatus(coupon.id)}
                              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
                            >
                              Deactivate
                            </button>
                            <button
                              onClick={() => deleteCoupon(coupon.id)}
                              className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
                      <p className="text-gray-500">
                        No active coupons. Add one to get started!
                      </p>
                    </div>
                  )}
                </div>

                {/* Inactive Coupons Section */}
                {inactiveCoupons.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Tag className="w-5 h-5 text-gray-400" />
                      Inactive Coupons ({inactiveCoupons.length})
                    </h3>

                    <div className="space-y-3">
                      {inactiveCoupons.map((coupon) => (
                        <div
                          key={coupon.id}
                          className="border border-gray-200 bg-gray-50 rounded-lg p-5 flex items-center justify-between hover:shadow-md transition-all opacity-75"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-lg font-bold text-gray-500 bg-white px-4 py-2 rounded-lg border-2 border-gray-300">
                                {coupon.code}
                              </span>
                              <div className="flex items-center gap-2">
                                {coupon.type === "percentage" ? (
                                  <>
                                    <Percent className="w-5 h-5 text-gray-400" />
                                    <span className="text-2xl font-bold text-gray-400">
                                      {coupon.discount}%
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <DollarSign className="w-5 h-5 text-gray-400" />
                                    <span className="text-2xl font-bold text-gray-400">
                                      ${coupon.discount}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-500">
                              Expires: {coupon.expiryDate}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleCouponStatus(coupon.id)}
                              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all font-medium"
                            >
                              Activate
                            </button>
                            <button
                              onClick={() => deleteCoupon(coupon.id)}
                              className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Coupon Modal */}
                {showAddModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-gray-900">
                          Add Coupon
                        </h3>
                        <button
                          onClick={() => setShowAddModal(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Coupon Code
                          </label>
                          <input
                            type="text"
                            value={formData.code}
                            onChange={(e) =>
                              setFormData({ ...formData, code: e.target.value })
                            }
                            placeholder="e.g., SUMMER20"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Discount Value
                            </label>
                            <input
                              type="number"
                              value={formData.discount}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  discount: e.target.value,
                                })
                              }
                              placeholder="e.g., 20"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Type
                            </label>
                            <select
                              value={formData.type}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  type: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                            >
                              <option value="percentage">Percentage</option>
                              <option value="fixed">Fixed</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Expiry Date
                          </label>
                          <input
                            type="date"
                            value={formData.expiryDate}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                expiryDate: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={() => setShowAddModal(false)}
                          className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddCoupon}
                          className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all font-semibold"
                        >
                          Add Coupon
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
