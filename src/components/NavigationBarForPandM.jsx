import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  User,
  Heart,
  MessageSquare,
  LogOut,
  LucideWallet,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { ROUTES } from "../constants/routes";
export default function NavBar2() {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  // const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to logout?")) return;
    setProfileDropdownOpen(false);
    await signOut(auth);
    navigate(ROUTES.HOME);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900 shadow-md text-white px-4 sm:px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link
          to={ROUTES.HOME}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="white"
            className="w-7 h-7 sm:w-8 sm:h-8"
          >
            <path d="M7 2v2H5a2 2 0 0 0-2 2v2h18V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm13 8H4v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10zm-4 4h-4v4h4v-4z" />
          </svg>
          <span className="text-lg sm:text-xl font-bold">BookingNest</span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            to={ROUTES.GUEST.MY_BOOKINGS}
            className="hidden sm:block hover:text-gray-300 transition-colors font-medium"
          >
            My Bookings
          </Link>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 text-slate-200 hover:text-white transition-colors"
              >
                {/* Profile Circle */}
                {userData?.photoURL ? (
                  <img
                    src={userData.photoURL}
                    alt="Profile"
                    className="w-12 h-12 rounded-full object-cover border border-slate-600"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center text-white text-sm font-semibold">
                    {user?.fullName
                      ? user.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()
                      : "G"}
                  </div>
                )}

                <span className="text-sm">Profile</span>
                {profileDropdownOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {/* Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-800 text-slate-200 rounded-xl shadow-lg border border-slate-700 overflow-hidden z-50">
                  <Link
                    to={ROUTES.GUEST.PROFILE}
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-700 transition-colors"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <User className="w-4 h-4" /> My Profile
                  </Link>

                  <Link
                    to={ROUTES.GUEST.MY_BOOKINGS}
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-700 transition-colors sm:hidden"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <User className="w-4 h-4" /> My Bookings
                  </Link>

                  <Link
                    to={ROUTES.GUEST.FAVORITES}
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-700 transition-colors"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <Heart className="w-4 h-4" /> Favorites
                  </Link>

                  <Link
                    to={ROUTES.GUEST.MESSAGES}
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-700 transition-colors"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <MessageSquare className="w-4 h-4" /> Messages
                  </Link>

                  <Link
                    to={ROUTES.GUEST.E_WALLET}
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-700 transition-colors"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <LucideWallet className="w-4 h-4" /> E-Wallet
                  </Link>

                  <button
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-700 transition-colors text-left"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
