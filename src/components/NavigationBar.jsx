import {
  Menu,
  X,
  User,
  PlusSquare,
  Home,
  Search,
  Calendar,
  MapPin,
  Users,
  Heart,
  LogOut,
  BarChart3,
  Briefcase,
  MessageSquare,
  FileEdit,
  Bell,
  ChevronDown,
  Settings,
  ChevronUp,
  Wallet,
  LucideWallet,
  ArrowLeft,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { auth, db } from "../firebase/firebase";
import { signOut } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { ROUTES } from "../constants/routes";

// Flag to switch between layouts: 'classic' or 'streamlined'
// Use 'streamlined' for authenticated users only (focused, header-heavy navigation)
// Use 'classic' for all users (default, traditional horizontal navigation)
const NAVBAR_LAYOUT = "classic";

// Animated border style
const animatedBorderStyle = `
  @keyframes slideIn {
    from {
      width: 0;
      left: 50%;
    }
    to {
      width: 100%;
      left: 0;
    }
  }
  .nav-link-border {
    position: relative;
    display: inline-block;
  }
  .nav-link-border::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 0;
    height: 3px;
    background: linear-gradient(90deg, #06b6d4, #8b5cf6, #ec4899);
    border-radius: 2px;
    transition: width 0.4s ease;
  }
  /* Only show animated border on hover when not active */
  .nav-link-border:not(.nav-link-active):hover::after {
    width: 100%;
    animation: slideIn 0.4s ease;
  }
`;

// ========== SUB-COMPONENTS ==========

// Logo Component
const Logo = () => (
  <Link to={ROUTES.HOME} className="flex-shrink-0">
    <div className="flex items-center cursor-pointer">
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
      <span className="ml-2 text-lg sm:text-xl font-bold text-white">
        BookingNest
      </span>
    </div>
  </Link>
);

// Guest Search Bar Component
const GuestSearchBar = () => (
  <div className="flex-1 flex justify-center relative">
    <div className="hidden xl:flex items-center bg-white rounded-full px-4 py-2 text-gray-700 shadow-md w-full max-w-3xl justify-between transition-all duration-300">
      {/* Location */}
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Where?"
          className="outline-none bg-transparent text-sm w-24"
        />
      </div>

      <div className="border-l h-5 border-gray-300 mx-2"></div>

      {/* Date Range */}
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="When?"
          className="outline-none bg-transparent text-sm w-24"
        />
      </div>

      <div className="border-l h-5 border-gray-300 mx-2"></div>

      {/* Number of Guests */}
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-gray-500" />
        <input
          type="number"
          placeholder="Who?"
          min="1"
          className="outline-none bg-transparent text-sm w-16"
        />
      </div>

      {/* Search Button */}
      <button className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition">
        <Search className="w-4 h-4" />
      </button>
    </div>
  </div>
);

// Host Navigation Links Component
const HostNavLinks = ({ location }) => {
  const isRouteActive = (route) => {
    return location.pathname === route || location.pathname.startsWith(route);
  };

  const navItems = [
    {
      to: ROUTES.HOST.DASHBOARD,
      icon: BarChart3,
      label: "Dashboard",
      color: "from-indigo-400 to-blue-400",
    },
    {
      to: ROUTES.HOST.STAYS,
      icon: Home,
      label: "My Stays",
      color: "from-cyan-400 to-blue-400",
    },
    {
      to: ROUTES.HOST.EXPERIENCES,
      icon: Calendar,
      label: "Experiences",
      color: "from-purple-400 to-pink-400",
    },
    {
      to: ROUTES.HOST.SERVICES,
      icon: Briefcase,
      label: "Services",
      color: "from-green-400 to-emerald-400",
    },
  ];

  return (
    <div className="hidden lg:flex items-center gap-2">
      {navItems.map(({ to, icon: IconComponent, label, color }) => {
        const Icon = IconComponent;
        return (
          <Link
            key={to}
            to={to}
            className={`nav-link-border group relative px-4 py-2.5 rounded-xl transition-all duration-300 ${
              isRouteActive(to)
                ? `nav-link-active bg-gradient-to-r ${color} text-white shadow-lg`
                : "text-slate-300 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon
                className={`w-5 h-5 transition-transform ${
                  isRouteActive(to) ? "scale-110" : "group-hover:scale-110"
                }`}
              />
              <span className="font-medium text-sm">{label}</span>
            </div>
            {isRouteActive(to) && (
              <div
                className={`absolute inset-0 bg-gradient-to-r ${color} rounded-xl blur-xl opacity-30 -z-10`}
              ></div>
            )}
          </Link>
        );
      })}
    </div>
  );
};

// Public Auth Dropdown Component
const PublicAuthDropdown = ({ isScrolled, dropdownOpen, setDropdownOpen }) => (
  <>
    <Link
      to={ROUTES.HOST.SIGNUP}
      className={`text-sm font-medium ${
        isScrolled ? "text-slate-300" : "text-slate-200"
      } hover:text-white transition-colors`}
    >
      Become a Host
    </Link>

    <div className="relative">
      <button
        className={`text-sm font-medium ${
          isScrolled ? "text-slate-300" : "text-slate-200"
        } hover:text-white transition-colors flex items-center gap-1`}
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        <User className="w-6 h-6" />
        Sign In
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-slate-800 text-slate-200 rounded-lg shadow-lg border border-slate-700 overflow-hidden z-50">
          <Link
            to={ROUTES.LOGIN}
            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-700 transition-colors"
            onClick={() => setDropdownOpen(false)}
          >
            <User className="w-4 h-4" /> Sign In
          </Link>
          <Link
            to={ROUTES.GUEST.SIGNUP}
            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-700 transition-colors"
            onClick={() => setDropdownOpen(false)}
          >
            <PlusSquare className="w-4 h-4" /> Sign Up
          </Link>
          <Link
            to={ROUTES.HOST.SIGNUP}
            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-700 transition-colors"
            onClick={() => setDropdownOpen(false)}
          >
            <Home className="w-4 h-4" /> Become a Host
          </Link>
        </div>
      )}
    </div>
  </>
);

// Guest User Actions Component
const GuestUserActions = ({
  notificationDropdownOpen,
  setNotificationDropdownOpen,
  profileDropdownOpen,
  setProfileDropdownOpen,
  userData,
  user,
  handleLogout,
}) => (
  <>
    {/* My Bookings link */}
    <Link
      to={ROUTES.GUEST.MY_BOOKINGS}
      className="flex items-center gap-1 text-slate-200 hover:text-white transition-colors"
    >
      <Calendar className="w-5 h-5" />
      <span className="hidden lg:inline">My Bookings</span>
    </Link>

    {/* Notifications Icon */}
    <div className="relative group">
      <button
        type="button"
        onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
        className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-700 transition"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-slate-200 group-hover:text-white transition" />
        {/* Unread badge (optional, can be dynamic) */}
        <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full"></span>
      </button>

      {notificationDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-slate-800 text-slate-200 rounded-lg shadow-lg border border-slate-700 p-3">
          <p className="text-sm text-slate-400">No new notifications</p>
        </div>
      )}
    </div>

    {/* Profile Dropdown */}
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
            className="w-10 h-10 lg:w-12 lg:h-12 rounded-full object-cover border border-slate-600"
          />
        ) : (
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-slate-600 flex items-center justify-center text-white text-sm font-semibold">
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

        <span className="text-sm hidden lg:inline">Profile</span>
        {profileDropdownOpen ? (
          <ChevronUp className="w-4 h-4 hidden lg:inline" />
        ) : (
          <ChevronDown className="w-4 h-4 hidden lg:inline" />
        )}
      </button>

      {/* Dropdown Menu */}
      {profileDropdownOpen && (
        <div className="absolute right-0 mt-3 w-72 bg-slate-800 backdrop-blur-xl text-slate-200 rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden z-50">
          {/* User Info Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border-b border-slate-700/50">
            <p className="text-sm font-semibold text-white truncate">
              {user?.fullName || "Guest"}
            </p>
            <p className="text-xs text-slate-400 truncate">{user?.email || ""}</p>
          </div>

          {/* Profile Section */}
          <div className="border-b border-slate-700/50 my-1">
            <Link
              to={ROUTES.GUEST.PROFILE}
              className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-blue-500/20 hover:text-blue-300"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <User className="w-5 h-5 group-hover/item:scale-110 transition-transform" /> My Profile
            </Link>

            <Link
              to={ROUTES.GUEST.FAVORITES}
              className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-pink-500/20 hover:to-pink-500/20 hover:text-pink-300"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <Heart className="w-5 h-5 group-hover/item:scale-110 transition-transform" /> Favorites
            </Link>
          </div>

          {/* Communication Section */}
          <div className="border-b border-slate-700/50 my-1">
            <Link
              to={ROUTES.GUEST.MESSAGES}
              className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-purple-500/20 hover:text-purple-300"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <MessageSquare className="w-5 h-5 group-hover/item:scale-110 transition-transform" /> Messages
            </Link>
          </div>

          {/* Wallet & Logout Section */}
          <div className="border-b border-slate-700/50 my-1">
            <Link
              to={ROUTES.GUEST.E_WALLET}
              className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-yellow-500/20 hover:to-yellow-500/20 hover:text-yellow-300"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <LucideWallet className="w-5 h-5 group-hover/item:scale-110 transition-transform" /> E-Wallet
            </Link>
          </div>

          <button
            className="w-full flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item text-left hover:bg-gradient-to-r hover:from-red-500/20 hover:to-red-500/20 hover:text-red-300"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 group-hover/item:scale-110 transition-transform" /> Logout
          </button>
        </div>
      )}
    </div>
  </>
);

// Host User Actions Component
const HostUserActions = ({
  profileDropdownOpen,
  setProfileDropdownOpen,
  userData,
  handleLogout,
  unreadNotificationsCount,
}) => (
  <div className="hidden lg:flex items-center gap-4">
    <Link
      to={ROUTES.HOST.MESSAGES}
      className="flex items-center gap-2 text-slate-200 hover:text-white transition-colors"
    >
      <MessageSquare className="w-5 h-5" />
      <span className="hidden xl:inline text-sm font-medium">Messages</span>
    </Link>

    <Link
      to={ROUTES.HOST.NOTIFICATIONS}
      className="relative text-slate-200 hover:text-white transition-colors flex items-center gap-2"
    >
      <Bell className="w-5 h-5" />
      {unreadNotificationsCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold w-5 h-5 rounded-full flex items-center justify-center">
          {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
        </span>
      )}
    </Link>

    <div className="relative">
      <button
        type="button"
        onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
        className="flex items-center gap-2 text-slate-200 hover:text-white transition-colors"
      >
        {userData?.photoURL ? (
          <img
            src={userData.photoURL}
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover border-2 border-slate-600"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
            {userData?.fullName
              ? userData.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()
              : "H"}
          </div>
        )}
        <span className="hidden xl:inline text-sm font-medium">Profile</span>
        {!profileDropdownOpen ? (
          <ChevronDown className="w-4 h-4 hidden xl:inline" />
        ) : (
          <ChevronUp className="w-4 h-4 hidden xl:inline" />
        )}
      </button>

      {profileDropdownOpen && (
        <div className="absolute right-0 mt-3 w-72 bg-slate-800 backdrop-blur-xl text-slate-200 rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden z-50">
          {/* User Info Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border-b border-slate-700/50">
            <p className="text-sm font-semibold text-white truncate">
              {userData?.fullName || "Host"}
            </p>
            <p className="text-xs text-slate-400 truncate">{userData?.email || ""}</p>
          </div>

          {/* Profile Section */}
          <div className="border-b border-slate-700/50 my-1">
            <Link
              to={ROUTES.HOST.PROFILE}
              className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-blue-500/20 hover:text-blue-300"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <User className="w-5 h-5 group-hover/item:scale-110 transition-transform" /> My Profile
            </Link>
          </div>

          {/* Host Listings Section */}
          <div className="border-b border-slate-700/50 my-1">
            <Link
              to={ROUTES.HOST.DASHBOARD}
              className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-indigo-500/20 hover:to-indigo-500/20 hover:text-indigo-300"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <BarChart3 className="w-5 h-5 group-hover/item:scale-110 transition-transform" /> Dashboard
            </Link>

            <Link
              to={ROUTES.HOST.STAYS}
              className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-cyan-500/20 hover:text-cyan-300"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <Home className="w-5 h-5 group-hover/item:scale-110 transition-transform" /> My Stays
            </Link>

            <Link
              to={ROUTES.HOST.EXPERIENCES}
              className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-purple-500/20 hover:text-purple-300"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <Calendar className="w-5 h-5 group-hover/item:scale-110 transition-transform" /> My Experiences
            </Link>

            <Link
              to={ROUTES.HOST.SERVICES}
              className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-green-500/20 hover:to-green-500/20 hover:text-green-300"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <Briefcase className="w-5 h-5 group-hover/item:scale-110 transition-transform" /> My Services
            </Link>
          </div>

          {/* Account Section */}
          <div className="border-b border-slate-700/50 my-1">
            <Link
              to={ROUTES.HOST.SETTINGS}
              className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-green-500/20 hover:to-green-500/20 hover:text-green-300"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <Settings className="w-5 h-5 group-hover/item:scale-110 transition-transform" /> Account Settings
            </Link>

            <Link
              to={ROUTES.HOST.E_WALLET}
              className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-yellow-500/20 hover:to-yellow-500/20 hover:text-yellow-300"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <Wallet className="w-5 h-5 group-hover/item:scale-110 transition-transform" /> E-wallet
            </Link>

            <Link
              to={ROUTES.HOST.CALENDAR}
              className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-blue-500/20 hover:text-blue-300"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <Calendar className="w-5 h-5 group-hover/item:scale-110 transition-transform" /> Calendar
            </Link>

            <Link
              to={ROUTES.HOST.DRAFTS}
              className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-orange-500/20 hover:to-orange-500/20 hover:text-orange-300"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <FileEdit className="w-5 h-5 group-hover/item:scale-110 transition-transform" /> Drafts
            </Link>
          </div>

          {/* Logout Section */}
          <button
            className="w-full flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item text-left hover:bg-gradient-to-r hover:from-red-500/20 hover:to-red-500/20 hover:text-red-300"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 group-hover/item:scale-110 transition-transform" />
            Logout
          </button>
        </div>
      )}
    </div>
  </div>
);

// Mobile Menu Component - Classic Layout
const MobileMenu = ({
  user,
  isMobileSearchOpen,
  setMobileSearchOpen,
  setMobileMenuOpen,
  handleLogout,
  userData,
}) => (
  <div className="xl:hidden bg-slate-900/95 backdrop-blur-md shadow-lg border-t border-slate-700">
    <div className="flex flex-col p-4 space-y-3 text-slate-200">
      {!user ? (
        <>
          <Link
            to={ROUTES.LOGIN}
            className="flex items-center gap-2 hover:text-white transition"
            onClick={() => setMobileMenuOpen(false)}
          >
            <User className="w-5 h-5" /> Sign In
          </Link>
          <Link
            to={ROUTES.GUEST.SIGNUP}
            className="flex items-center gap-2 hover:text-white transition"
            onClick={() => setMobileMenuOpen(false)}
          >
            <PlusSquare className="w-5 h-5" /> Sign Up
          </Link>
          <Link
            to={ROUTES.HOST.SIGNUP}
            className="flex items-center gap-2 hover:text-white transition"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Home className="w-5 h-5" /> Become a Host
          </Link>
        </>
      ) : (
        <>
          {userData?.role === "guest" && (
            <>
              <button
                className="flex items-center gap-2 hover:text-white transition"
                onClick={() => setMobileSearchOpen(!isMobileSearchOpen)}
              >
                <Search className="w-5 h-5" /> Search
              </button>
              {isMobileSearchOpen && (
                <div className="flex flex-col gap-3 bg-white text-gray-700 rounded-2xl shadow-md p-4">
                  {/* Where */}
                  <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Where?"
                      className="outline-none bg-transparent text-sm w-full"
                    />
                  </div>

                  {/* When */}
                  <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="When?"
                      className="outline-none bg-transparent text-sm w-full"
                    />
                  </div>

                  {/* Who */}
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Who?"
                      className="outline-none bg-transparent text-sm w-full"
                    />
                  </div>

                  {/* Search button */}
                  <button className="bg-indigo-600 text-white flex items-center justify-center gap-2 py-2 rounded-full hover:bg-indigo-700 transition">
                    <Search className="w-4 h-4" />
                    <span className="text-sm font-medium">Search</span>
                  </button>
                </div>
              )}

              <Link
                to={ROUTES.GUEST.HOME}
                className="flex items-center gap-2 hover:text-white transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Calendar className="w-5 h-5" /> My Bookings
              </Link>
              <Link
                to={ROUTES.GUEST.PROFILE}
                className="flex items-center gap-2 hover:text-white transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="w-5 h-5" /> My Profile
              </Link>

              <Link
                to={ROUTES.GUEST.FAVORITES}
                className="flex items-center gap-2 hover:text-white transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Heart className="w-5 h-5" /> Favorites
              </Link>
            </>
          )}

          <button
            className="flex items-center gap-2 hover:text-white transition text-left"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </>
      )}
    </div>
  </div>
);

// Streamlined Mobile Menu Component (for authenticated users)
const StreamlinedMobileMenu = ({
  mobileMenuOpen,
  userData,
  user,
  setMobileMenuOpen,
  unreadNotificationsCount,
  handleLogout,
}) => {
  const hostNavItems = [
    { to: ROUTES.HOST.DASHBOARD, icon: BarChart3, label: "Dashboard" },
    { to: ROUTES.HOST.STAYS, icon: Home, label: "My Stays" },
    { to: ROUTES.HOST.EXPERIENCES, icon: Calendar, label: "Experiences" },
    { to: ROUTES.HOST.SERVICES, icon: Briefcase, label: "Services" },
  ];

  const location = useLocation();

  const isRouteActive = (route) => {
    return location.pathname === route || location.pathname.startsWith(route);
  };

  return mobileMenuOpen ? (
    <div className="lg:hidden bg-slate-900/98 backdrop-blur-xl border-t border-slate-700/50 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
        {/* Profile Header - Mobile */}
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/50 rounded-xl mb-3">
          {userData?.photoURL ? (
            <img
              src={userData.photoURL}
              alt="Profile"
              className="w-12 h-12 rounded-full object-cover border-2 border-slate-600"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-semibold">
              {user?.fullName
                ? user.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()
                : "U"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {user?.fullName || "User"}
            </p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Host Navigation - Mobile */}
        {userData?.role === "host" && (
          <>
            {hostNavItems.map(({ to, icon: IconComponent, label }) => {
              const IconElement = IconComponent;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isRouteActive(to)
                      ? `nav-link-active bg-gradient-to-r from-cyan-400 to-purple-400 text-white shadow-lg`
                      : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <IconElement className="w-5 h-5" />
                  <span className="font-medium">{label}</span>
                </Link>
              );
            })}
            <div className="border-t border-slate-700/50 my-2"></div>
          </>
        )}

        {/* Common Menu Items */}
        <Link
          to={userData?.role === "host" ? ROUTES.HOST.PROFILE : ROUTES.GUEST.PROFILE}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            isRouteActive(userData?.role === "host" ? ROUTES.HOST.PROFILE : ROUTES.GUEST.PROFILE)
              ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300"
              : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
          }`}
          onClick={() => setMobileMenuOpen(false)}
        >
          <User className="w-5 h-5" />
          <span className="font-medium">My Profile</span>
        </Link>

        {userData?.role === "guest" && (
          <>
            <Link
              to={ROUTES.GUEST.FAVORITES}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isRouteActive(ROUTES.GUEST.FAVORITES)
                  ? "bg-gradient-to-r from-pink-500/20 to-red-500/20 text-pink-300"
                  : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Heart className="w-5 h-5" />
              <span className="font-medium">Favorites</span>
            </Link>

            <Link
              to={ROUTES.GUEST.MESSAGES}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isRouteActive(ROUTES.GUEST.MESSAGES)
                  ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300"
                  : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="font-medium">Messages</span>
            </Link>
          </>
        )}

        {userData?.role === "host" && (
          <>
            <Link
              to={ROUTES.HOST.MESSAGES}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isRouteActive(ROUTES.HOST.MESSAGES)
                  ? "bg-gradient-to-r from-pink-500/20 to-red-500/20 text-pink-300"
                  : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="font-medium">Messages</span>
            </Link>

            <Link
              to={ROUTES.HOST.NOTIFICATIONS}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isRouteActive(ROUTES.HOST.NOTIFICATIONS)
                  ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300"
                  : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="relative">
                <Bell className="w-5 h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                    {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
                  </span>
                )}
              </div>
              <span className="font-medium">Notifications</span>
            </Link>

            <Link
              to={ROUTES.HOST.SETTINGS}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isRouteActive(ROUTES.HOST.SETTINGS)
                  ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300"
                  : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </Link>
          </>
        )}

        <Link
          to={userData?.role === "host" ? ROUTES.HOST.E_WALLET : ROUTES.GUEST.E_WALLET}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            isRouteActive(userData?.role === "host" ? ROUTES.HOST.E_WALLET : ROUTES.GUEST.E_WALLET)
              ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300"
              : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
          }`}
          onClick={() => setMobileMenuOpen(false)}
        >
          <LucideWallet className="w-5 h-5" />
          <span className="font-medium">E-Wallet</span>
        </Link>

        {userData?.role === "host" && (
          <Link
            to={ROUTES.HOST.CALENDAR}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              isRouteActive(ROUTES.HOST.CALENDAR)
                ? "bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-300"
                : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Calendar className="w-5 h-5" />
            <span className="font-medium">Calendar</span>
          </Link>
        )}

        <div className="border-t border-slate-700/50 my-2"></div>

        <button
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 text-left"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  ) : null;
};

// Guest Tab Navigation Component - Airbnb Style
const GuestTabNavigation = ({ user, userData, handleLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState(searchParams.get("type") || "stays");
  const [searchData, setSearchData] = useState({
    location: searchParams.get("location") || "",
    checkIn: searchParams.get("checkIn") || "",
    checkOut: searchParams.get("checkOut") || "",
    guests: searchParams.get("guests") || "1",
  });

  // Tabs for guest navigation
  const guestTabs = [
    { id: "stays", label: "Homes", icon: Home, color: "from-cyan-400 to-blue-400" },
    { id: "experiences", label: "Experiences", icon: Calendar, color: "from-purple-400 to-pink-400" },
    { id: "services", label: "Services", icon: Briefcase, color: "from-green-400 to-emerald-400" },
  ];

  // Sync activeFilter with URL params
  useEffect(() => {
    const typeParam = searchParams.get("type") || "stays";
    setActiveFilter(typeParam);
  }, [searchParams]);

  // Handle scroll to show/hide tabs
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 50;
      setIsScrolled(scrolled);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle tab click - navigate and set URL param
  const handleTabClick = (tabId) => {
    setActiveFilter(tabId);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("type", tabId);
    setSearchParams(newParams);
  };

  // Handle search expand when search bar clicked
  const handleSearchClick = () => {
    setIsSearchExpanded(true);
    setIsMobileMenuOpen(false); // Close mobile menu when search expands
  };

  // Handle search collapse
  const handleSearchClose = () => {
    setIsSearchExpanded(false);
  };

  // Handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams();
    if (searchData.location) newParams.set("location", searchData.location);
    if (searchData.checkIn) newParams.set("checkIn", searchData.checkIn);
    if (searchData.checkOut) newParams.set("checkOut", searchData.checkOut);
    if (searchData.guests) newParams.set("guests", searchData.guests);
    newParams.set("type", activeFilter);

    setSearchParams(newParams);
    setIsSearchExpanded(false);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <style>{animatedBorderStyle}</style>
      {/* Main Navbar Container */}
      <nav className={`transition-all duration-300 text-white bg-slate-900/95 backdrop-blur-sm shadow-md border-b border-white/10 ${
        isScrolled ? "py-1.5" : "py-2.5"
      }`}>
        {/* Top Row - Logo, Tabs, Profile */}
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex items-center justify-between gap-2 sm:gap-3 lg:gap-6">
            {/* Logo - Left */}
            <Link to={ROUTES.GUEST.HOME} className="flex-shrink-0">
              <div className="flex items-center cursor-pointer">
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
                <span className="ml-2 text-lg sm:text-xl font-bold text-white whitespace-nowrap hidden sm:inline">
                  BookingNest
                </span>
              </div>
            </Link>

            {/* Center - Tabs (hidden when scrolled) - Hidden on mobile */}
            <div
              className={`hidden md:flex lg:flex flex-1 items-center justify-center gap-1 lg:gap-3 transition-all duration-500 ease-out ${
                isScrolled
                  ? "opacity-0 w-0 pointer-events-none"
                  : "opacity-100 w-auto pointer-events-auto"
              }`}
            >
              {guestTabs.map(({ id, label, icon: Icon, color }) => (
                <button
                  key={id}
                  onClick={() => handleTabClick(id)}
                  className={`nav-link-border group relative px-2 lg:px-4 py-2 lg:py-2.5 rounded-lg lg:rounded-xl transition-all duration-300 text-xs lg:text-sm ${
                    activeFilter === id
                      ? `nav-link-active bg-gradient-to-r ${color} text-white shadow-lg`
                      : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-1 lg:gap-2">
                    <Icon
                      className={`w-4 lg:w-5 h-4 lg:h-5 transition-transform ${
                        activeFilter === id ? "scale-110" : "group-hover:scale-110"
                      }`}
                    />
                    <span className="hidden lg:inline font-medium">{label}</span>
                    <span className="lg:hidden font-medium text-xs">{label.split('')[0]}</span>
                  </div>
                  {activeFilter === id && (
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${color} rounded-lg lg:rounded-xl blur-xl opacity-30 -z-10`}
                    ></div>
                  )}
                </button>
              ))}
            </div>

            {/* Right Section - Profile */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Mobile Search */}
              <button
                onClick={handleSearchClick}
                className="lg:hidden p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-all duration-200 hover:scale-110"
              >
                <Search className="w-5 h-5 text-slate-300" />
              </button>

              {/* Mobile Menu Hamburger */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-all duration-200 hover:scale-110"
              >
                <Menu className="w-5 h-5 text-slate-300" />
              </button>

              {/* Profile Menu */}
              <div className="relative group">
                <button className="hidden lg:flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-all duration-200">
                  {userData?.photoURL ? (
                    <img
                      src={userData.photoURL}
                      alt="Profile"
                      className="w-9 h-9 rounded-full object-cover border-2 border-slate-600 group-hover:border-indigo-500 transition-colors"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
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
                  <span className="text-sm font-medium text-slate-200 group-hover:text-white whitespace-nowrap">
                    Profile
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {/* Profile Dropdown */}
                <div className="absolute right-0 mt-3 w-72 bg-slate-800 backdrop-blur-xl text-slate-200 rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  {/* User Info Header */}
                  <div className="px-5 py-4 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border-b border-slate-700/50">
                    <p className="text-sm font-semibold text-white truncate">
                      {user?.fullName || "Guest"}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{user?.email || ""}</p>
                  </div>

                  {/* Profile Section */}
                  <div className="border-b border-slate-700/50 my-1">
                    <Link
                      to={ROUTES.GUEST.PROFILE}
                      className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-blue-500/20 hover:text-blue-300"
                      onClick={() => {}}
                    >
                      <User className="w-5 h-5 group-hover/item:scale-110 transition-transform" /> My Profile
                    </Link>

                    <Link
                      to={ROUTES.GUEST.FAVORITES}
                      className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-pink-500/20 hover:to-pink-500/20 hover:text-pink-300"
                      onClick={() => {}}
                    >
                      <Heart className="w-5 h-5 group-hover/item:scale-110 transition-transform" /> Favorites
                    </Link>
                  </div>

                  {/* Bookings & Messages */}
                  <div className="border-b border-slate-700/50 my-1">
                    <Link
                      to={ROUTES.GUEST.MY_BOOKINGS}
                      className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-cyan-500/20 hover:text-cyan-300"
                      onClick={() => {}}
                    >
                      <Calendar className="w-5 h-5 group-hover/item:scale-110 transition-transform" /> My Bookings
                    </Link>

                    <Link
                      to={ROUTES.GUEST.MESSAGES}
                      className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-purple-500/20 hover:text-purple-300"
                      onClick={() => {}}
                    >
                      <MessageSquare className="w-5 h-5 group-hover/item:scale-110 transition-transform" /> Messages
                    </Link>
                  </div>

                  {/* Wallet */}
                  <div className="border-b border-slate-700/50 my-1">
                    <Link
                      to={ROUTES.GUEST.E_WALLET}
                      className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-yellow-500/20 hover:to-yellow-500/20 hover:text-yellow-300"
                      onClick={() => {}}
                    >
                      <LucideWallet className="w-5 h-5 group-hover/item:scale-110 transition-transform" /> E-Wallet
                    </Link>
                  </div>

                  <button
                    className="w-full flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item text-left hover:bg-gradient-to-r hover:from-red-500/20 hover:to-red-500/20 hover:text-red-300"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-5 h-5 group-hover/item:scale-110 transition-transform" /> Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar Row - Below tabs (smooth animation) */}
        <div className={`max-w-full mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-500 ease-out overflow-hidden ${
          isScrolled
            ? "opacity-0 max-h-0 py-0"
            : "opacity-100 max-h-20 py-2.5"
        }`}>
          <button
            onClick={handleSearchClick}
            className="w-full max-w-3xl lg:mx-auto lg:flex lg:justify-center flex items-center bg-white rounded-full px-3 lg:px-4 py-1.5 lg:py-2 text-gray-700 shadow-md gap-2 lg:gap-3 transition-all hover:shadow-lg"
          >
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <MapPin className="w-3.5 lg:w-4 h-3.5 lg:h-4 text-gray-500 flex-shrink-0" />
              <input
                type="text"
                placeholder="Where?"
                readOnly
                className="outline-none bg-transparent text-xs lg:text-sm flex-1 min-w-0"
              />
            </div>

            <div className="hidden md:block border-l h-5 border-gray-300"></div>

            <div className="hidden md:flex flex-1 items-center gap-2 min-w-0">
              <Calendar className="w-3.5 lg:w-4 h-3.5 lg:h-4 text-gray-500 flex-shrink-0" />
              <input
                type="text"
                placeholder="When?"
                readOnly
                className="outline-none bg-transparent text-xs lg:text-sm flex-1 min-w-0"
              />
            </div>

            <div className="hidden lg:block border-l h-5 border-gray-300"></div>

            <div className="hidden lg:flex flex-1 items-center gap-2 min-w-0">
              <Users className="w-3.5 lg:w-4 h-3.5 lg:h-4 text-gray-500 flex-shrink-0" />
              <input
                type="text"
                placeholder="Who?"
                readOnly
                className="outline-none bg-transparent text-xs lg:text-sm flex-1 min-w-0"
              />
            </div>

            <button type="button" className="bg-indigo-600 text-white p-1.5 lg:p-2 rounded-full hover:bg-indigo-700 transition flex-shrink-0">
              <Search className="w-3.5 lg:w-4 h-3.5 lg:h-4" />
            </button>
          </button>
        </div>

        {/* Search Bar Row When Scrolled - In top row */}
        <div className={`hidden md:flex lg:flex flex-1 items-center justify-center px-4 sm:px-6 lg:px-8 transition-all duration-500 ease-out absolute inset-0 ${
          isScrolled
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}>
          <button
            onClick={handleSearchClick}
            className="flex-1 max-w-lg flex items-center bg-white rounded-full px-3 lg:px-4 py-1.5 lg:py-2 text-gray-700 shadow-md gap-1.5 lg:gap-2.5 transition-all hover:shadow-lg"
          >
            <MapPin className="w-3.5 lg:w-4 h-3.5 lg:h-4 text-gray-500 flex-shrink-0" />
            <input
              type="text"
              placeholder="Where?"
              readOnly
              className="outline-none bg-transparent text-xs lg:text-sm flex-1 min-w-0"
            />

            <div className="hidden md:block border-l h-5 border-gray-300"></div>

            <Calendar className="hidden md:block w-3.5 lg:w-4 h-3.5 lg:h-4 text-gray-500 flex-shrink-0" />
            <input
              type="text"
              placeholder="When?"
              readOnly
              className="hidden md:block outline-none bg-transparent text-xs lg:text-sm flex-1 min-w-0"
            />

            <div className="hidden lg:block border-l h-5 border-gray-300"></div>

            <Users className="hidden lg:block w-3.5 lg:w-4 h-3.5 lg:h-4 text-gray-500 flex-shrink-0" />
            <input
              type="text"
              placeholder="Who?"
              readOnly
              className="hidden lg:block outline-none bg-transparent text-xs lg:text-sm flex-1 min-w-0"
            />

            <button type="button" className="bg-indigo-600 text-white p-1.5 lg:p-2 rounded-full hover:bg-indigo-700 transition flex-shrink-0">
              <Search className="w-3.5 lg:w-4 h-3.5 lg:h-4" />
            </button>
          </button>
        </div>

      </nav>

      {/* Expanded Search View - Full Navbar with Search Form */}
      {isSearchExpanded && (
        <div className={`fixed top-14 sm:top-16 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-sm border-t border-white/10 transition-all duration-300 ease-in-out transform ${isSearchExpanded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full"}`}>
          <div className="max-w-full mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
            {/* Close Button */}
            <button
              onClick={handleSearchClose}
              className="absolute top-4 right-4 p-2 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Expanded Content */}
            <form onSubmit={handleSearchSubmit} className="space-y-4 sm:space-y-6 w-full">
              {/* Where */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">
                  Where?
                </label>
                <input
                  type="text"
                  placeholder="Search destinations..."
                  value={searchData.location}
                  onChange={(e) => setSearchData({ ...searchData, location: e.target.value })}
                  autoFocus
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm sm:text-base"
                />
              </div>

              {/* Check-in & Check-out & Guests */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">
                    Check in
                  </label>
                  <input
                    type="date"
                    value={searchData.checkIn}
                    onChange={(e) => setSearchData({ ...searchData, checkIn: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">
                    Check out
                  </label>
                  <input
                    type="date"
                    value={searchData.checkOut}
                    onChange={(e) => setSearchData({ ...searchData, checkOut: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">
                    Guests
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={searchData.guests}
                    onChange={(e) => setSearchData({ ...searchData, guests: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Search Button */}
              <button
                type="submit"
                className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all duration-200 text-sm sm:text-base min-h-[44px] sm:min-h-[48px]"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Expanded View Backdrop */}
      {isSearchExpanded && (
        <div
          className="fixed inset-0 bg-black/40 z-30 top-0 transition-all duration-300 opacity-100"
          onClick={handleSearchClose}
        ></div>
      )}

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 top-0 transition-all duration-300 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="fixed right-0 top-0 h-screen w-80 max-w-[90vw] bg-slate-800 backdrop-blur-xl border-l border-slate-700/50 z-50 overflow-y-auto transition-all duration-300 transform lg:hidden">
            {/* Menu Header */}
            <div className="sticky top-0 px-6 py-4 border-b border-slate-700/50 bg-slate-900/95 backdrop-blur flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Menu</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-300" />
              </button>
            </div>

            {/* User Info */}
            <div className="px-6 py-4 border-b border-slate-700/50">
              <div className="flex items-center gap-3 mb-3">
                {userData?.photoURL ? (
                  <img
                    src={userData.photoURL}
                    alt="Profile"
                    className="w-12 h-12 rounded-full object-cover border-2 border-slate-600"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
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
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {user?.fullName || "Guest"}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{user?.email || ""}</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-1 px-3 py-4">
              {/* Profile */}
              <Link
                to={ROUTES.GUEST.PROFILE}
                className="flex items-center gap-3 px-3 py-3 text-slate-200 hover:text-white hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-blue-500/20 rounded-lg transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <User className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">My Profile</span>
              </Link>

              {/* Favorites */}
              <Link
                to={ROUTES.GUEST.FAVORITES}
                className="flex items-center gap-3 px-3 py-3 text-slate-200 hover:text-white hover:bg-gradient-to-r hover:from-pink-500/20 hover:to-pink-500/20 rounded-lg transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Heart className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">Favorites</span>
              </Link>

              {/* My Bookings */}
              <Link
                to={ROUTES.GUEST.MY_BOOKINGS}
                className="flex items-center gap-3 px-3 py-3 text-slate-200 hover:text-white hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-cyan-500/20 rounded-lg transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Calendar className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">My Bookings</span>
              </Link>

              {/* Messages */}
              <Link
                to={ROUTES.GUEST.MESSAGES}
                className="flex items-center gap-3 px-3 py-3 text-slate-200 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-purple-500/20 rounded-lg transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <MessageSquare className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">Messages</span>
              </Link>

              {/* E-Wallet */}
              <Link
                to={ROUTES.GUEST.E_WALLET}
                className="flex items-center gap-3 px-3 py-3 text-slate-200 hover:text-white hover:bg-gradient-to-r hover:from-yellow-500/20 hover:to-yellow-500/20 rounded-lg transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <LucideWallet className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">E-Wallet</span>
              </Link>
            </div>

            {/* Logout Button */}
            <div className="border-t border-slate-700/50 px-3 py-4 mt-auto">
              <button
                className="w-full flex items-center gap-3 px-3 py-3 text-slate-200 hover:text-red-300 hover:bg-gradient-to-r hover:from-red-500/20 hover:to-red-500/20 rounded-lg transition-all duration-200 text-sm font-medium"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Guest Simple Navigation Component - For non-home pages (Messages, Bookings, Favorites, etc.)
const GuestSimpleNavBar = ({ user, userData, handleLogout }) => {
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 text-white bg-slate-900/95 backdrop-blur-sm shadow-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between h-14">
          {/* Left - Back Button and Logo */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <button
              onClick={() => navigate(ROUTES.GUEST.HOME)}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-all duration-200"
              title="Back to home"
            >
              <ArrowLeft className="w-5 h-5 text-slate-300 hover:text-white" />
            </button>
            <Link
              to={ROUTES.GUEST.HOME}
              className="flex items-center cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="white"
                className="w-6 h-6 hidden sm:block"
              >
                <path d="M7 2v2H5a2 2 0 0 0-2 2v2h18V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm13 8H4v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10zm-4 4h-4v4h4v-4z" />
              </svg>
            </Link>
          </div>

          {/* Right - Profile Menu */}
          <div className="relative group">
            <button className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-all duration-200">
              {userData?.photoURL ? (
                <img
                  src={userData.photoURL}
                  alt="Profile"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-slate-600 group-hover:border-indigo-500 transition-colors"
                />
              ) : (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs sm:text-sm font-semibold">
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
              <span className="text-xs sm:text-sm font-medium text-slate-200 group-hover:text-white whitespace-nowrap hidden sm:inline">
                Profile
              </span>
            </button>

            {/* Profile Dropdown */}
            <div className="absolute right-0 mt-3 w-72 bg-slate-800 backdrop-blur-xl text-slate-200 rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              {/* User Info Header */}
              <div className="px-5 py-4 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border-b border-slate-700/50">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.fullName || "Guest"}
                </p>
                <p className="text-xs text-slate-400 truncate">{user?.email || ""}</p>
              </div>

              {/* Menu Items */}
              <div className="border-b border-slate-700/50 my-1">
                <Link
                  to={ROUTES.GUEST.PROFILE}
                  className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-blue-500/20 hover:text-blue-300"
                >
                  <User className="w-5 h-5 group-hover/item:scale-110 transition-transform" /> My Profile
                </Link>

                <Link
                  to={ROUTES.GUEST.FAVORITES}
                  className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-pink-500/20 hover:to-pink-500/20 hover:text-pink-300"
                >
                  <Heart className="w-5 h-5 group-hover/item:scale-110 transition-transform" /> Favorites
                </Link>
              </div>

              <div className="border-b border-slate-700/50 my-1">
                <Link
                  to={ROUTES.GUEST.MY_BOOKINGS}
                  className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-cyan-500/20 hover:text-cyan-300"
                >
                  <Calendar className="w-5 h-5 group-hover/item:scale-110 transition-transform" /> My Bookings
                </Link>

                <Link
                  to={ROUTES.GUEST.MESSAGES}
                  className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-purple-500/20 hover:text-purple-300"
                >
                  <MessageSquare className="w-5 h-5 group-hover/item:scale-110 transition-transform" /> Messages
                </Link>
              </div>

              <div className="border-b border-slate-700/50 my-1">
                <Link
                  to={ROUTES.GUEST.E_WALLET}
                  className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-yellow-500/20 hover:to-yellow-500/20 hover:text-yellow-300"
                >
                  <LucideWallet className="w-5 h-5 group-hover/item:scale-110 transition-transform" /> E-Wallet
                </Link>
              </div>

              <button
                className="w-full flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item text-left hover:bg-gradient-to-r hover:from-red-500/20 hover:to-red-500/20 hover:text-red-300"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5 group-hover/item:scale-110 transition-transform" /> Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

// ========== MAIN COMPONENT ==========

export default function NavigationBar({ userData, user, forceSimpleNavBar = false }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] =
    useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  const isGuest = userData?.role === "guest" || forceSimpleNavBar;
  const isHost = userData?.role === "host";

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to logout?")) return;
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
    await signOut(auth);
    navigate(ROUTES.HOME);
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 110;
      if (scrolled !== isScrolled) setIsScrolled(scrolled);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isScrolled]);

  // Set up real-time listener for unread notifications (host only)
  useEffect(() => {
    if (!isHost || !userData?.id) {
      setUnreadNotificationsCount(0);
      return;
    }

    const q = query(
      collection(db, "notifications"),
      where("host_id", "==", userData.id),
      where("isRead", "==", false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadNotificationsCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [userData?.id, isHost]);

  const getNavbarBg = () => {
    if (user) return "bg-slate-900 shadow-md";
    return isScrolled
      ? "bg-slate-900/95 backdrop-blur-md shadow-lg"
      : "bg-transparent";
  };

  // Use streamlined layout only for authenticated users with NAVBAR_LAYOUT set to 'streamlined'
  const useStreamlinedLayout = NAVBAR_LAYOUT === "streamlined" && user;

  // ========== STREAMLINED LAYOUT (for authenticated users only) ==========
  if (useStreamlinedLayout) {
    return (
      <>
        <style>{animatedBorderStyle}</style>
        <nav
          className={`fixed top-0 left-0 right-0 z-50 text-white transition-all duration-300 ${
            isScrolled
              ? "bg-slate-900/90 backdrop-blur-xl shadow-2xl border-b border-slate-700/50 py-3"
              : "bg-slate-900/95 backdrop-blur-sm shadow-md py-4"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              {/* Logo */}
              <Link
                to={ROUTES.HOME}
                className="flex items-center gap-2 group flex-shrink-0"
              >
                <div className="relative">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="white"
                    className="w-8 h-8 sm:w-9 sm:h-9 transition-transform group-hover:scale-110"
                  >
                    <path d="M7 2v2H5a2 2 0 0 0-2 2v2h18V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm13 8H4v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10zm-4 4h-4v4h4v-4z" />
                  </svg>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full blur-lg opacity-0 group-hover:opacity-50 transition-opacity"></div>
                </div>
                <span className="hidden sm:inline text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  BookingNest
                </span>
              </Link>

              {/* Center Navigation - Desktop for Hosts */}
              {isHost && (
                <div className="hidden lg:flex items-center gap-2">
                  {[
                    { to: ROUTES.HOST.DASHBOARD, icon: BarChart3, label: "Dashboard", color: "from-indigo-400 to-blue-400" },
                    { to: ROUTES.HOST.STAYS, icon: Home, label: "My Stays", color: "from-cyan-400 to-blue-400" },
                    { to: ROUTES.HOST.EXPERIENCES, icon: Calendar, label: "Experiences", color: "from-purple-400 to-pink-400" },
                    { to: ROUTES.HOST.SERVICES, icon: Briefcase, label: "Services", color: "from-green-400 to-emerald-400" },
                  ].map(({ to, icon: IconComponent, label, color }) => {
                    const IconElement = IconComponent;
                    const isActive = location.pathname === to || location.pathname.startsWith(to);
                    return (
                      <Link
                        key={to}
                        to={to}
                        className={`nav-link-border group relative px-4 py-2.5 rounded-xl transition-all duration-300 ${
                          isActive
                            ? `nav-link-active bg-gradient-to-r ${color} text-white shadow-lg`
                            : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <IconElement
                            className={`w-5 h-5 transition-transform ${
                              isActive ? "scale-110" : "group-hover:scale-110"
                            }`}
                          />
                          <span className="font-medium text-sm">{label}</span>
                        </div>
                        {isActive && (
                          <div
                            className={`absolute inset-0 bg-gradient-to-r ${color} rounded-xl blur-xl opacity-30 -z-10`}
                          ></div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Guest Bookings Link - Desktop */}
              {isGuest && (
                <div className="hidden lg:flex items-center flex-1 justify-center">
                  <Link
                    to={ROUTES.GUEST.MY_BOOKINGS}
                    className={`nav-link-border group relative px-6 py-2.5 rounded-xl transition-all duration-300 ${
                      location.pathname === ROUTES.GUEST.MY_BOOKINGS || location.pathname.startsWith(ROUTES.GUEST.MY_BOOKINGS)
                        ? "nav-link-active bg-gradient-to-r from-cyan-400 to-purple-400 text-white shadow-lg"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar
                        className={`w-5 h-5 transition-transform ${
                          location.pathname === ROUTES.GUEST.MY_BOOKINGS || location.pathname.startsWith(ROUTES.GUEST.MY_BOOKINGS)
                            ? "scale-110"
                            : "group-hover:scale-110"
                        }`}
                      />
                      <span className="font-medium">My Bookings</span>
                    </div>
                    {(location.pathname === ROUTES.GUEST.MY_BOOKINGS || location.pathname.startsWith(ROUTES.GUEST.MY_BOOKINGS)) && (
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-xl blur-xl opacity-30 -z-10"></div>
                    )}
                  </Link>
                </div>
              )}

              {/* Right Section */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Mobile Menu Toggle */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-all duration-200 hover:scale-110"
                >
                  {mobileMenuOpen ? (
                    <X className="w-5 h-5 text-slate-300" />
                  ) : (
                    <Menu className="w-5 h-5 text-slate-300" />
                  )}
                </button>

                {/* Profile Dropdown - Desktop */}
                <div className="hidden lg:block relative">
                  <button
                    type="button"
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-all duration-200 group"
                  >
                    {userData?.photoURL ? (
                      <img
                        src={userData.photoURL}
                        alt="Profile"
                        className="w-9 h-9 rounded-full object-cover border-2 border-slate-600 group-hover:border-purple-500 transition-colors"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                        {user?.fullName
                          ? user.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .substring(0, 2)
                              .toUpperCase()
                          : "U"}
                      </div>
                    )}
                    <span className="text-sm font-medium text-slate-200 group-hover:text-white">
                      Profile
                    </span>
                    {profileDropdownOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {/* Dropdown Menu - Desktop */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-72 bg-slate-800 backdrop-blur-xl text-slate-200 rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden z-50">
                      {/* User Info Header */}
                      <div className="px-5 py-4 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border-b border-slate-700/50">
                        <p className="text-sm font-semibold text-white truncate">
                          {user?.fullName || "User"}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {user?.email}
                        </p>
                      </div>

                      {/* Profile Link */}
                      <Link
                        to={
                          isHost
                            ? ROUTES.HOST.PROFILE
                            : ROUTES.GUEST.PROFILE
                        }
                        className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-slate-700/50 hover:text-purple-300"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <User className="w-5 h-5 group-hover/item:scale-110 transition-transform" />
                        <span className="font-medium">My Profile</span>
                      </Link>

                      {/* Guest Menu Items */}
                      {isGuest && (
                        <>
                          <div className="border-t border-slate-700/50 my-1"></div>
                          <Link
                            to={ROUTES.GUEST.FAVORITES}
                            className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-slate-700/50 hover:text-pink-300"
                            onClick={() => setProfileDropdownOpen(false)}
                          >
                            <Heart className="w-5 h-5 group-hover/item:scale-110 transition-transform" />
                            <span className="font-medium">Favorites</span>
                          </Link>

                          <Link
                            to={ROUTES.GUEST.MESSAGES}
                            className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-slate-700/50 hover:text-blue-300"
                            onClick={() => setProfileDropdownOpen(false)}
                          >
                            <MessageSquare className="w-5 h-5 group-hover/item:scale-110 transition-transform" />
                            <span className="font-medium">Messages</span>
                          </Link>

                          <Link
                            to={ROUTES.GUEST.E_WALLET}
                            className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-slate-700/50 hover:text-yellow-300"
                            onClick={() => setProfileDropdownOpen(false)}
                          >
                            <LucideWallet className="w-5 h-5 group-hover/item:scale-110 transition-transform" />
                            <span className="font-medium">E-Wallet</span>
                          </Link>
                        </>
                      )}

                      {/* Host Menu Items */}
                      {isHost && (
                        <>
                          <div className="border-t border-slate-700/50 my-1"></div>
                          <Link
                            to={ROUTES.HOST.MESSAGES}
                            className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-slate-700/50 hover:text-pink-300"
                            onClick={() => setProfileDropdownOpen(false)}
                          >
                            <MessageSquare className="w-5 h-5 group-hover/item:scale-110 transition-transform" />
                            <span className="font-medium">Messages</span>
                          </Link>

                          <Link
                            to={ROUTES.HOST.NOTIFICATIONS}
                            className="relative flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-slate-700/50 hover:text-yellow-300"
                            onClick={() => setProfileDropdownOpen(false)}
                          >
                            <div className="relative">
                              <Bell className="w-5 h-5 group-hover/item:scale-110 transition-transform" />
                              {unreadNotificationsCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                                  {unreadNotificationsCount > 9
                                    ? "9+"
                                    : unreadNotificationsCount}
                                </span>
                              )}
                            </div>
                            <span className="font-medium">Notifications</span>
                          </Link>

                          <div className="border-t border-slate-700/50 my-1"></div>

                          <Link
                            to={ROUTES.HOST.SETTINGS}
                            className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-slate-700/50 hover:text-green-300"
                            onClick={() => setProfileDropdownOpen(false)}
                          >
                            <Settings className="w-5 h-5 group-hover/item:scale-110 transition-transform" />
                            <span className="font-medium">Settings</span>
                          </Link>

                          <Link
                            to={ROUTES.HOST.E_WALLET}
                            className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-slate-700/50 hover:text-yellow-300"
                            onClick={() => setProfileDropdownOpen(false)}
                          >
                            <LucideWallet className="w-5 h-5 group-hover/item:scale-110 transition-transform" />
                            <span className="font-medium">E-Wallet</span>
                          </Link>

                          <Link
                            to={ROUTES.HOST.CALENDAR}
                            className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-slate-700/50 hover:text-orange-300"
                            onClick={() => setProfileDropdownOpen(false)}
                          >
                            <Calendar className="w-5 h-5 group-hover/item:scale-110 transition-transform" />
                            <span className="font-medium">Calendar</span>
                          </Link>
                        </>
                      )}

                      {/* Logout */}
                      <div className="border-t border-slate-700/50 my-1"></div>
                      <button
                        className="w-full flex items-center gap-3 px-5 py-3.5 text-sm hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 text-left group/item"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-5 h-5 group-hover/item:scale-110 transition-transform" />
                        <span className="font-medium">Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Streamlined Mobile Menu */}
          <StreamlinedMobileMenu
            mobileMenuOpen={mobileMenuOpen}
            userData={userData}
            user={user}
            setMobileMenuOpen={setMobileMenuOpen}
            unreadNotificationsCount={unreadNotificationsCount}
            handleLogout={handleLogout}
          />
        </nav>
      </>
    );
  }

  // ========== GUEST TAB NAVIGATION (for guest users on home page only) ==========
  if (isGuest && user && location.pathname === ROUTES.GUEST.HOME) {
    return <GuestTabNavigation user={user} userData={userData} handleLogout={handleLogout} />;
  }

  // ========== SIMPLE NAVBAR (for profile and messages pages, or guest non-home pages) ==========
  if (user && (location.pathname.includes("/profile") || location.pathname.includes("/messages")) || forceSimpleNavBar) {
    return <GuestSimpleNavBar user={user} userData={userData} handleLogout={handleLogout} />;
  }

  // ========== CLASSIC LAYOUT (default, for all user types) ==========
  return (
    <>
      <style>{animatedBorderStyle}</style>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-3 lg:py-4 ${getNavbarBg()}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 lg:h-20 gap-x-4 lg:gap-x-12">
            {/* Logo */}
            <Logo />

            {/* Center: Guest Search or Host Nav */}
            {user ? (
              isGuest ? (
                <GuestSearchBar />
              ) : isHost ? (
                <HostNavLinks location={location} />
              ) : null
            ) : null}

            {/* Right: Auth / Profile (Desktop) */}
            <div className="hidden xl:flex items-center gap-4 lg:gap-6">
              {!user ? (
                <PublicAuthDropdown
                  isScrolled={isScrolled}
                  dropdownOpen={dropdownOpen}
                  setDropdownOpen={setDropdownOpen}
                />
              ) : isGuest ? (
                <GuestUserActions
                  notificationDropdownOpen={notificationDropdownOpen}
                  setNotificationDropdownOpen={setNotificationDropdownOpen}
                  profileDropdownOpen={profileDropdownOpen}
                  setProfileDropdownOpen={setProfileDropdownOpen}
                  userData={userData}
                  user={user}
                  handleLogout={handleLogout}
                />
              ) : isHost ? (
                <HostUserActions
                  profileDropdownOpen={profileDropdownOpen}
                  setProfileDropdownOpen={setProfileDropdownOpen}
                  userData={userData}
                  handleLogout={handleLogout}
                  unreadNotificationsCount={unreadNotificationsCount}
                />
              ) : null}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden text-white"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <MobileMenu
            user={user}
            userData={userData}
            isMobileSearchOpen={isMobileSearchOpen}
            setMobileSearchOpen={setMobileSearchOpen}
            setMobileMenuOpen={setMobileMenuOpen}
            handleLogout={handleLogout}
          />
        )}
      </nav>
    </>
  );
}
