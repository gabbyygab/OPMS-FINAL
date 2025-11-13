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
import { useState, useEffect, useContext } from "react";
import {
  Link,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "../firebase/firebase";
import { AuthModalContext } from "../context/AuthModalContext";
import { signOut } from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { ROUTES } from "../constants/routes";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

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

const getTimestampValue = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === "object") {
    if (typeof value.toMillis === "function") return value.toMillis();
    if (typeof value.seconds === "number") {
      const nanoseconds =
        typeof value.nanoseconds === "number" ? value.nanoseconds : 0;
      return value.seconds * 1000 + nanoseconds / 1e6;
    }
  }
  return null;
};

// ========== SUB-COMPONENTS ==========

// Messages Link with Unread Badge Component
const MessagesLinkWithBadge = ({ to, unreadCount = 0, className, onClick }) => {
  const count = Number(unreadCount) || 0;
  return (
    <Link to={to} className={className} onClick={onClick}>
      <div className="relative">
        <MessageSquare className="w-5 h-5 group-hover/item:scale-110 transition-transform" />
        {count > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </div>
      <span>Messages</span>
    </Link>
  );
};

// Logo Component
const Logo = () => (
  <Link to={ROUTES.HOME} className="flex-shrink-0">
    <div className="flex items-center cursor-pointer">
      <img
        src="/bookingNestLogoFInal.png"
        alt=""
        className="w-16 h-16 sm:w-24 sm:h-24 lg:w-28 lg:h-28 hover:scale-105 transition-transform relative top-1.5 left-4"
      />
      <div className="hidden sm:flex flex-col items-start">
        <div className="text-base sm:text-lg lg:text-2xl font-bold leading-none">
          <span className="text-white">Booking</span>
          <span className="text-indigo-600">Nest</span>
        </div>
      </div>
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
const PublicAuthDropdown = ({ isScrolled, dropdownOpen, setDropdownOpen }) => {
  const { openSignUp, openSignIn, selectSignUpRole } =
    useContext(AuthModalContext);

  const handleBecomeHost = () => {
    selectSignUpRole("host");
    setDropdownOpen(false);
  };

  return (
    <>
      <button
        onClick={handleBecomeHost}
        className={`text-sm font-medium ${
          isScrolled ? "text-slate-300" : "text-slate-200"
        } hover:text-white transition-colors`}
      >
        Become a Host
      </button>

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
            <button
              onClick={() => {
                openSignIn();
                setDropdownOpen(false);
              }}
              className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-700 transition-colors"
            >
              <User className="w-4 h-4" /> Sign In
            </button>
            <button
              onClick={() => {
                openSignUp();
                setDropdownOpen(false);
              }}
              className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-700 transition-colors"
            >
              <PlusSquare className="w-4 h-4" /> Sign Up
            </button>
            <button
              onClick={handleBecomeHost}
              className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-700 transition-colors"
            >
              <Home className="w-4 h-4" /> Become a Host
            </button>
          </div>
        )}
      </div>
    </>
  );
};

// Guest User Actions Component
const GuestUserActions = ({
  notificationDropdownOpen,
  setNotificationDropdownOpen,
  profileDropdownOpen,
  setProfileDropdownOpen,
  userData,
  user,
  handleLogout,
  unreadNotificationsCount,
  unreadNotifications,
  unreadMessagesCount,
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
    <div className="relative">
      <button
        type="button"
        onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
        className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-700 transition text-slate-200 hover:text-white"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 transition" />
        {unreadNotificationsCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-semibold w-4 h-4 rounded-full flex items-center justify-center">
            {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
          </span>
        )}
      </button>

      {notificationDropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-800 text-slate-200 rounded-lg shadow-lg border border-slate-700 z-50">
          {unreadNotificationsCount > 0 ? (
            <>
              <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-3 z-10">
                <p className="text-slate-300 font-medium">
                  {unreadNotificationsCount} unread{" "}
                  {unreadNotificationsCount === 1
                    ? "notification"
                    : "notifications"}
                </p>
              </div>
              <div className="p-2">
                {unreadNotifications.slice(0, 3).map((notification) => (
                  <Link
                    key={notification.id}
                    to={ROUTES.GUEST.NOTIFICATIONS}
                    onClick={() => setNotificationDropdownOpen(false)}
                    className="block p-3 mb-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600"
                  >
                    <div className="flex flex-col gap-1">
                      <p className="text-xs font-semibold text-indigo-400">
                        {notification.title}
                      </p>
                      <p className="text-xs text-slate-300 line-clamp-2">
                        {notification.message}
                      </p>
                      {notification.createdAt && (
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(
                            notification.createdAt.toMillis?.() ||
                              notification.createdAt
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              <Link
                to={ROUTES.GUEST.NOTIFICATIONS}
                className="block p-3 text-center border-t border-slate-700 text-indigo-400 hover:text-indigo-300 text-xs font-medium hover:bg-slate-700/30 transition-colors"
                onClick={() => setNotificationDropdownOpen(false)}
              >
                View all notifications →
              </Link>
            </>
          ) : (
            <p className="p-3 text-sm text-slate-400">No new notifications</p>
          )}
        </div>
      )}
    </div>

    {/* Profile Dropdown */}
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setProfileDropdownOpen(!profileDropdownOpen);
          setNotificationDropdownOpen(false);
        }}
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
            <p className="text-xs text-slate-400 truncate">
              {user?.email || ""}
            </p>
          </div>

          {/* Profile Section */}
          <div className="border-b border-slate-700/50 my-1">
            <Link
              to={ROUTES.GUEST.PROFILE}
              className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-blue-500/20 hover:text-blue-300"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <User className="w-5 h-5 group-hover/item:scale-110 transition-transform" />{" "}
              My Profile
            </Link>

            <Link
              to={ROUTES.GUEST.FAVORITES}
              className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-pink-500/20 hover:to-pink-500/20 hover:text-pink-300"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <Heart className="w-5 h-5 group-hover/item:scale-110 transition-transform" />{" "}
              Favorites
            </Link>
          </div>

          {/* Communication Section */}
          <div className="border-b border-slate-700/50 my-1">
            <MessagesLinkWithBadge
              to={ROUTES.GUEST.MESSAGES}
              unreadCount={unreadMessagesCount}
              className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-purple-500/20 hover:text-purple-300"
              onClick={() => setProfileDropdownOpen(false)}
            />
          </div>

          {/* Wallet & Logout Section */}
          <div className="border-b border-slate-700/50 my-1">
            <Link
              to={ROUTES.GUEST.E_WALLET}
              className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-yellow-500/20 hover:to-yellow-500/20 hover:text-yellow-300"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <LucideWallet className="w-5 h-5 group-hover/item:scale-110 transition-transform" />{" "}
              E-Wallet
            </Link>
          </div>

          <button
            className="w-full flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item text-left hover:bg-gradient-to-r hover:from-red-500/20 hover:to-red-500/20 hover:text-red-300"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 group-hover/item:scale-110 transition-transform" />{" "}
            Logout
          </button>
        </div>
      )}
    </div>
  </>
);

// Host User Actions Component
const HostUserActions = ({
  notificationDropdownOpen,
  setNotificationDropdownOpen,
  profileDropdownOpen,
  setProfileDropdownOpen,
  userData,
  handleLogout,
  unreadNotificationsCount,
  unreadNotifications,
  unreadMessagesCount,
}) => (
  <div className="hidden lg:flex items-center gap-4">
    <div className="relative">
      <Link
        to={ROUTES.HOST.MESSAGES}
        className="flex items-center gap-2 text-slate-200 hover:text-white transition-colors"
      >
        <div className="relative">
          <MessageSquare className="w-5 h-5" />
          {unreadMessagesCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
            </span>
          )}
        </div>
      </Link>
    </div>

    <div className="relative">
      <button
        type="button"
        onClick={() => {
          const nextState = !notificationDropdownOpen;
          setNotificationDropdownOpen(nextState);
          if (nextState) {
            setProfileDropdownOpen(false);
          }
        }}
        className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-700 transition text-slate-200 hover:text-white"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 transition" />
        {unreadNotificationsCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-semibold w-4 h-4 rounded-full flex items-center justify-center">
            {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
          </span>
        )}
      </button>

      {notificationDropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-800 text-slate-200 rounded-lg shadow-lg border border-slate-700 z-50">
          {unreadNotificationsCount > 0 ? (
            <>
              <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-3 z-10">
                <p className="text-slate-300 font-medium">
                  {unreadNotificationsCount} unread{" "}
                  {unreadNotificationsCount === 1
                    ? "notification"
                    : "notifications"}
                </p>
              </div>
              <div className="p-2">
                {(unreadNotifications || []).slice(0, 3).map((notification) => {
                  const createdAtValue = getTimestampValue(
                    notification.createdAt
                  );

                  return (
                    <Link
                      key={notification.id}
                      to={ROUTES.HOST.NOTIFICATIONS}
                      onClick={() => setNotificationDropdownOpen(false)}
                      className="block p-3 mb-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600"
                    >
                      <div className="flex flex-col gap-1">
                        <p className="text-xs font-semibold text-yellow-400">
                          {notification.title}
                        </p>
                        <p className="text-xs text-slate-300 line-clamp-2">
                          {notification.message}
                        </p>
                        {createdAtValue !== null && (
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(createdAtValue).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
              <Link
                to={ROUTES.HOST.NOTIFICATIONS}
                className="block p-3 text-center border-t border-slate-700 text-yellow-400 hover:text-yellow-300 text-xs font-medium hover:bg-slate-700/30 transition-colors"
                onClick={() => setNotificationDropdownOpen(false)}
              >
                View all notifications →
              </Link>
            </>
          ) : (
            <p className="p-3 text-sm text-slate-400">No new notifications</p>
          )}
        </div>
      )}
    </div>

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
            <p className="text-xs text-slate-400 truncate">
              {userData?.email || ""}
            </p>
          </div>

          {/* Profile Section */}
          <div className="border-b border-slate-700/50 my-1">
            <Link
              to={ROUTES.HOST.PROFILE}
              className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-blue-500/20 hover:text-blue-300"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <User className="w-5 h-5 group-hover/item:scale-110 transition-transform" />{" "}
              My Profile
            </Link>
          </div>

          {/* Host Listings Section */}
          <div className="border-b border-slate-700/50 my-1">
            <Link
              to={ROUTES.HOST.DASHBOARD}
              className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-indigo-500/20 hover:to-indigo-500/20 hover:text-indigo-300"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <BarChart3 className="w-5 h-5 group-hover/item:scale-110 transition-transform" />{" "}
              Dashboard
            </Link>

            <Link
              to={ROUTES.HOST.STAYS}
              className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-cyan-500/20 hover:text-cyan-300"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <Home className="w-5 h-5 group-hover/item:scale-110 transition-transform" />{" "}
              My Stays
            </Link>

            <Link
              to={ROUTES.HOST.EXPERIENCES}
              className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-purple-500/20 hover:text-purple-300"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <Calendar className="w-5 h-5 group-hover/item:scale-110 transition-transform" />{" "}
              My Experiences
            </Link>

            <Link
              to={ROUTES.HOST.SERVICES}
              className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-green-500/20 hover:to-green-500/20 hover:text-green-300"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <Briefcase className="w-5 h-5 group-hover/item:scale-110 transition-transform" />{" "}
              My Services
            </Link>
          </div>

          {/* Account Section */}
          <div className="border-b border-slate-700/50 my-1">
            <Link
              to={ROUTES.HOST.E_WALLET}
              className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-yellow-500/20 hover:to-yellow-500/20 hover:text-yellow-300"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <Wallet className="w-5 h-5 group-hover/item:scale-110 transition-transform" />{" "}
              E-wallet
            </Link>

            <Link
              to={ROUTES.HOST.MY_BOOKINGS}
              className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-indigo-500/20 hover:to-indigo-500/20 hover:text-indigo-300"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <Calendar className="w-5 h-5 group-hover/item:scale-110 transition-transform" />{" "}
              My Bookings
            </Link>

            <Link
              to={ROUTES.HOST.DRAFTS}
              className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-orange-500/20 hover:to-orange-500/20 hover:text-orange-300"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <FileEdit className="w-5 h-5 group-hover/item:scale-110 transition-transform" />{" "}
              Drafts
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
  activeFilter = null,
  setActiveFilter = null,
  openSignIn = null,
  selectSignUpRole = null,
}) => {
  const navigate = useNavigate();

  return (
    <div className="xl:hidden bg-slate-900/95 backdrop-blur-md shadow-lg border-t border-slate-700">
      <div className="flex flex-col p-4 space-y-3 text-slate-200">
        {!user ? (
          <>
            <button
              onClick={() => {
                if (openSignIn) openSignIn();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 hover:text-white transition text-left w-full"
            >
              <User className="w-5 h-5" /> Sign In
            </button>
            <button
              onClick={() => {
                if (selectSignUpRole) selectSignUpRole("guest");
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 hover:text-white transition text-left w-full"
            >
              <PlusSquare className="w-5 h-5" /> Sign Up
            </button>
            <button
              onClick={() => {
                if (selectSignUpRole) selectSignUpRole("host");
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 hover:text-white transition text-left w-full"
            >
              <Home className="w-5 h-5" /> Become a Host
            </button>
          </>
        ) : (
          <>
            {userData?.role === "guest" &&
              setActiveFilter &&
              activeFilter !== null && (
                <>
                  {/* Category Navigation */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        setActiveFilter("stays");
                        const newParams = new URLSearchParams();
                        newParams.set("type", "stays");
                        navigate(
                          `${ROUTES.GUEST.HOME}?${newParams.toString()}`
                        );
                        setMobileMenuOpen(false);
                      }}
                      className={`flex-1 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                        activeFilter === "stays"
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      Stays
                    </button>
                    <button
                      onClick={() => {
                        setActiveFilter("services");
                        const newParams = new URLSearchParams();
                        newParams.set("type", "services");
                        navigate(
                          `${ROUTES.GUEST.HOME}?${newParams.toString()}`
                        );
                        setMobileMenuOpen(false);
                      }}
                      className={`flex-1 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                        activeFilter === "services"
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      Services
                    </button>
                    <button
                      onClick={() => {
                        setActiveFilter("experiences");
                        const newParams = new URLSearchParams();
                        newParams.set("type", "experiences");
                        navigate(
                          `${ROUTES.GUEST.HOME}?${newParams.toString()}`
                        );
                        setMobileMenuOpen(false);
                      }}
                      className={`flex-1 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                        activeFilter === "experiences"
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      Experiences
                    </button>
                  </div>
                </>
              )}

            {userData?.role === "guest" && (
              <>
                <Link
                  to={ROUTES.GUEST.MY_BOOKINGS}
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
};

// Host Mobile Menu Drawer Component (right-side sidebar for host view)
const HostMobileMenuDrawer = ({
  mobileMenuOpen,
  userData,
  user,
  setMobileMenuOpen,
  unreadNotificationsCount,
  unreadMessagesCount,
  handleLogout,
}) => {
  const location = useLocation();

  const hostNavItems = [
    {
      to: ROUTES.HOST.DASHBOARD,
      icon: BarChart3,
      label: "Dashboard",
      color: "from-indigo-500/20 to-blue-500/20",
    },
    {
      to: ROUTES.HOST.STAYS,
      icon: Home,
      label: "My Stays",
      color: "from-cyan-500/20 to-blue-500/20",
    },
    {
      to: ROUTES.HOST.EXPERIENCES,
      icon: Calendar,
      label: "Experiences",
      color: "from-purple-500/20 to-pink-500/20",
    },
    {
      to: ROUTES.HOST.SERVICES,
      icon: Briefcase,
      label: "Services",
      color: "from-green-500/20 to-emerald-500/20",
    },
  ];

  const isRouteActive = (route) => {
    return location.pathname === route || location.pathname.startsWith(route);
  };

  return (
    <AnimatePresence>
      {mobileMenuOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-40 top-0 transition-all duration-300 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          ></motion.div>
          <motion.div
            className="fixed right-0 top-0 h-screen w-80 max-w-[90vw] bg-slate-800 backdrop-blur-xl border-l border-slate-700/50 z-50 overflow-y-auto lg:hidden"
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {/* Menu Header */}
            <div className="sticky top-0 px-6 py-4 border-b border-slate-700/50 bg-slate-900/95 backdrop-blur flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Host Menu</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
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
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                    {user?.fullName
                      ? user.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()
                      : "H"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {user?.fullName || "Host"}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {user?.email || ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Host Navigation Items */}
            <div className="space-y-1 px-3 py-4">
              {hostNavItems.map(({ to, icon: Icon, label, color }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 px-3 py-3 text-slate-200 rounded-lg transition-all duration-200 ${
                    isRouteActive(to)
                      ? `bg-gradient-to-r ${color} text-white font-medium`
                      : "hover:text-white hover:bg-slate-800/50"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{label}</span>
                </Link>
              ))}
            </div>

            <div className="border-t border-slate-700/50 my-2 mx-3"></div>

            {/* Host Menu Items */}
            <div className="space-y-1 px-3 py-4">
              <Link
                to={ROUTES.HOST.PROFILE}
                className={`flex items-center gap-3 px-3 py-3 text-slate-200 hover:text-white hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-blue-500/20 rounded-lg transition-all duration-200 ${
                  isRouteActive(ROUTES.HOST.PROFILE)
                    ? "bg-gradient-to-r from-blue-500/20 to-blue-500/20 text-blue-300"
                    : ""
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">My Profile</span>
              </Link>

              <Link
                to={ROUTES.HOST.MESSAGES}
                className={`flex items-center gap-3 px-3 py-3 text-slate-200 hover:text-white hover:bg-gradient-to-r hover:from-pink-500/20 hover:to-pink-500/20 rounded-lg transition-all duration-200 ${
                  isRouteActive(ROUTES.HOST.MESSAGES)
                    ? "bg-gradient-to-r from-pink-500/20 to-pink-500/20 text-pink-300"
                    : ""
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="relative">
                  <MessageSquare className="w-5 h-5 flex-shrink-0" />
                  {unreadMessagesCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium">Messages</span>
              </Link>

              <Link
                to={ROUTES.HOST.NOTIFICATIONS}
                className={`relative flex items-center gap-3 px-3 py-3 text-slate-200 hover:text-white hover:bg-gradient-to-r hover:from-yellow-500/20 hover:to-yellow-500/20 rounded-lg transition-all duration-200 ${
                  isRouteActive(ROUTES.HOST.NOTIFICATIONS)
                    ? "bg-gradient-to-r from-yellow-500/20 to-yellow-500/20 text-yellow-300"
                    : ""
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="relative">
                  <Bell className="w-5 h-5 flex-shrink-0" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                      {unreadNotificationsCount > 9
                        ? "9+"
                        : unreadNotificationsCount}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium">Notifications</span>
              </Link>

              <Link
                to={ROUTES.HOST.SETTINGS}
                className={`flex items-center gap-3 px-3 py-3 text-slate-200 hover:text-white hover:bg-gradient-to-r hover:from-green-500/20 hover:to-green-500/20 rounded-lg transition-all duration-200 ${
                  isRouteActive(ROUTES.HOST.SETTINGS)
                    ? "bg-gradient-to-r from-green-500/20 to-green-500/20 text-green-300"
                    : ""
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Settings className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">Settings</span>
              </Link>

              <Link
                to={ROUTES.HOST.E_WALLET}
                className={`flex items-center gap-3 px-3 py-3 text-slate-200 hover:text-white hover:bg-gradient-to-r hover:from-yellow-500/20 hover:to-yellow-500/20 rounded-lg transition-all duration-200 ${
                  isRouteActive(ROUTES.HOST.E_WALLET)
                    ? "bg-gradient-to-r from-yellow-500/20 to-yellow-500/20 text-yellow-300"
                    : ""
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <LucideWallet className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">E-Wallet</span>
              </Link>

              <Link
                to={ROUTES.HOST.MY_BOOKINGS}
                className={`flex items-center gap-3 px-3 py-3 text-slate-200 hover:text-white hover:bg-gradient-to-r hover:from-indigo-500/20 hover:to-indigo-500/20 rounded-lg transition-all duration-200 ${
                  isRouteActive(ROUTES.HOST.MY_BOOKINGS)
                    ? "bg-gradient-to-r from-indigo-500/20 to-indigo-500/20 text-indigo-300"
                    : ""
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Calendar className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">My Bookings</span>
              </Link>
            </div>

            {/* Logout Button */}
            <div className="border-t border-slate-700/50 px-3 py-4 mt-auto">
              <button
                className="w-full flex items-center gap-3 px-3 py-3 text-slate-200 hover:text-red-300 hover:bg-gradient-to-r hover:from-red-500/20 hover:to-red-500/20 rounded-lg transition-all duration-200 text-sm font-medium"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

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

  return (
    <AnimatePresence>
      {mobileMenuOpen && (
        <motion.div
          className="lg:hidden bg-slate-900/98 backdrop-blur-xl border-t border-slate-700/50 shadow-2xl"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
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
              to={
                userData?.role === "host"
                  ? ROUTES.HOST.PROFILE
                  : ROUTES.GUEST.PROFILE
              }
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isRouteActive(
                  userData?.role === "host"
                    ? ROUTES.HOST.PROFILE
                    : ROUTES.GUEST.PROFILE
                )
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
                  <div className="relative">
                    <MessageSquare className="w-5 h-5" />
                    {unreadMessagesCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
                      </span>
                    )}
                  </div>
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
                  <div className="relative">
                    <MessageSquare className="w-5 h-5" />
                    {unreadMessagesCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
                      </span>
                    )}
                  </div>
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
                        {unreadNotificationsCount > 9
                          ? "9+"
                          : unreadNotificationsCount}
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
              to={
                userData?.role === "host"
                  ? ROUTES.HOST.E_WALLET
                  : ROUTES.GUEST.E_WALLET
              }
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isRouteActive(
                  userData?.role === "host"
                    ? ROUTES.HOST.E_WALLET
                    : ROUTES.GUEST.E_WALLET
                )
                  ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300"
                  : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <LucideWallet className="w-5 h-5" />
              <span className="font-medium">E-Wallet</span>
            </Link>

            {userData?.role === "host" && (
              <>
                <Link
                  to={ROUTES.HOST.MY_BOOKINGS}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isRouteActive(ROUTES.HOST.MY_BOOKINGS)
                      ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300"
                      : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Calendar className="w-5 h-5" />
                  <span className="font-medium">My Bookings</span>
                </Link>
              </>
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
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Custom hook for responsive layout
const useResponsiveDatePicker = () => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    months: isMobile ? 1 : 2,
    direction: "horizontal",
  };
};

// Guest Tab Navigation Component - Airbnb Style
const GuestTabNavigation = ({
  user,
  userData,
  handleLogout,
  unreadMessagesCount,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const responsiveConfig = useResponsiveDatePicker();
  const [activeFilter, setActiveFilter] = useState(
    searchParams.get("type") || "stays"
  );
  const [searchData, setSearchData] = useState({
    location: searchParams.get("location") || "",
    checkIn: searchParams.get("checkIn") || "",
    checkOut: searchParams.get("checkOut") || "",
    guests: searchParams.get("guests") || "1",
    serviceType: searchParams.get("serviceType") || "",
  });

  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [serviceTypeSuggestions, setServiceTypeSuggestions] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [notificationDropdownOpen, setNotificationDropdownOpen] =
    useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Get auth modal context functions
  const { openSignIn, selectSignUpRole } = useContext(AuthModalContext);

  // Fetch unread notifications
  useEffect(() => {
    if (!userData?.id) return;

    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", userData.id),
      where("isRead", "==", false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          // Sort by createdAt timestamp, newest first
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });

      setUnreadNotificationsCount(notifications.length);
      setUnreadNotifications(notifications);
    });

    return () => unsubscribe();
  }, [userData?.id]);

  useEffect(() => {
    const fetchServiceTypes = async () => {
      try {
        const listingsRef = collection(db, "listings");
        const q = query(listingsRef, where("type", "==", "services"));
        const querySnapshot = await getDocs(q);
        const allServiceTypes = new Set();
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.serviceTypes && Array.isArray(data.serviceTypes)) {
            data.serviceTypes.forEach((type) => allServiceTypes.add(type));
          }
        });
        setServiceTypeSuggestions(Array.from(allServiceTypes));
      } catch (error) {
        console.error("Error fetching service types:", error);
      }
    };

    fetchServiceTypes();
  }, []);

  // Helper function to parse date string to local date
  const parseLocalDate = (dateString) => {
    if (!dateString) return new Date();
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const [dateRange, setDateRange] = useState([
    {
      startDate: searchParams.get("checkIn")
        ? parseLocalDate(searchParams.get("checkIn"))
        : new Date(),
      endDate: searchParams.get("checkOut")
        ? parseLocalDate(searchParams.get("checkOut"))
        : new Date(),
      key: "selection",
    },
  ]);

  // Tabs for guest navigation
  const guestTabs = [
    {
      id: "stays",
      label: "Stays",
      icon: Home,
      color: "from-cyan-400 to-blue-400",
    },
    {
      id: "experiences",
      label: "Experiences",
      icon: Calendar,
      color: "from-purple-400 to-pink-400",
    },
    {
      id: "services",
      label: "Services",
      icon: Briefcase,
      color: "from-green-400 to-emerald-400",
    },
  ];

  // Sync activeFilter with URL params
  useEffect(() => {
    const typeParam = searchParams.get("type") || "stays";
    setActiveFilter(typeParam);
  }, [searchParams]);

  // Sync searchData and dateRange with URL params (handles filter clearing)
  useEffect(() => {
    const checkInParam = searchParams.get("checkIn");
    const checkOutParam = searchParams.get("checkOut");

    // If both checkIn and checkOut are cleared, reset the date range and searchData
    if (!checkInParam && !checkOutParam) {
      setSearchData((prev) => ({
        ...prev,
        checkIn: "",
        checkOut: "",
      }));
      // Set to a future date to show empty selection (no overlap with today)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      setDateRange([
        {
          startDate: futureDate,
          endDate: futureDate,
          key: "selection",
        },
      ]);
    } else {
      // Update searchData and dateRange based on URL params
      const updateData = {};
      if (checkInParam) updateData.checkIn = checkInParam;
      else updateData.checkIn = "";

      if (checkOutParam) updateData.checkOut = checkOutParam;
      else updateData.checkOut = "";

      if (Object.keys(updateData).length > 0) {
        setSearchData((prev) => ({ ...prev, ...updateData }));
      }

      // Update dateRange if dates are provided
      if (checkInParam && checkOutParam) {
        const startDate = parseLocalDate(checkInParam);
        const endDate = parseLocalDate(checkOutParam);
        setDateRange([
          {
            startDate,
            endDate,
            key: "selection",
          },
        ]);
      }
    }
  }, [searchParams]);

  // Handle scroll to show/hide tabs and close dropdowns
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 50;
      setIsScrolled(scrolled);
      // Close dropdowns when scrolling
      setNotificationDropdownOpen(false);
      setProfileDropdownOpen(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Check if click is outside dropdowns
      const navBar = document.querySelector("nav");
      if (navBar && !navBar.contains(e.target)) {
        setNotificationDropdownOpen(false);
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  // Handle date range selection
  const handleDateRangeChange = (ranges) => {
    setDateRange([ranges.selection]);

    // Format date as YYYY-MM-DD using local time (no UTC conversion)
    const formatLocalDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const checkInDate = formatLocalDate(ranges.selection.startDate);
    const checkOutDate = formatLocalDate(ranges.selection.endDate);

    setSearchData({
      ...searchData,
      checkIn: checkInDate,
      checkOut: checkOutDate,
    });
  };

  // Handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams();
    if (searchData.location) newParams.set("location", searchData.location);
    if (searchData.checkIn) newParams.set("checkIn", searchData.checkIn);
    if (searchData.checkOut) newParams.set("checkOut", searchData.checkOut);
    if (searchData.guests) newParams.set("guests", searchData.guests);
    if (searchData.serviceType)
      newParams.set("serviceType", searchData.serviceType);
    newParams.set("type", activeFilter);

    setSearchParams(newParams);
    setIsSearchExpanded(false);
    setShowDateRangePicker(false);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <style>{animatedBorderStyle}</style>
      {/* Main Navbar Container */}
      <nav
        className={`transition-all duration-500 text-white border-b overflow-visible ${
          isScrolled
            ? "py-1.5 bg-slate-900 shadow-lg border-white/20"
            : "py-2.5 bg-slate-900 shadow-md border-white/10"
        }`}
      >
        {/* Top Row - Logo, Tabs, Profile */}
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex items-center justify-between gap-2 sm:gap-3 lg:gap-6">
            {/* Logo & Brand Name - Left */}
            <Link
              to={ROUTES.GUEST.HOME}
              className="flex-shrink-0 flex items-center gap-2"
            >
              <img
                src="/bookingNestLogoFInal.png"
                alt="BookingNest Logo"
                className="w-16 h-16 sm:w-20 sm:h-20 hover:scale-105 transition-transform"
              />
              <div className="hidden sm:flex flex-col items-start">
                <div className="text-base sm:text-lg lg:text-xl font-bold leading-none">
                  <span className="text-white">Booking</span>
                  <span className="text-indigo-600">Nest</span>
                </div>
              </div>
            </Link>

            {/* Center - Nav Tabs (slide up when scrolled) - Hidden on mobile */}
            <div
              className={`hidden md:flex flex-1 items-center justify-center gap-1 lg:gap-3 transition-all duration-700 ease-in-out ${
                isScrolled
                  ? "-translate-y-24 opacity-0 pointer-events-none"
                  : "translate-y-0 opacity-100 pointer-events-auto"
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
                        activeFilter === id
                          ? "scale-110"
                          : "group-hover:scale-110"
                      }`}
                    />
                    <span className="hidden lg:inline font-medium">
                      {label}
                    </span>
                    <span className="lg:hidden font-medium text-xs">
                      {label.split("")[0]}
                    </span>
                  </div>
                  {activeFilter === id && (
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${color} rounded-lg lg:rounded-xl blur-xl opacity-30 -z-10`}
                    ></div>
                  )}
                </button>
              ))}
            </div>

            {/* Compact Search Bar - Appears in center when scrolled */}
            <div
              onClick={handleSearchClick}
              className={`hidden md:flex flex-1 items-center justify-center transition-all duration-700 ease-in-out cursor-pointer absolute inset-0 ${
                isScrolled
                  ? "translate-y-0 opacity-100 pointer-events-auto"
                  : "-translate-y-24 opacity-0 pointer-events-none"
              }`}
            >
              <div className="flex items-center bg-white rounded-full px-3 lg:px-4 py-1.5 lg:py-2 text-gray-700 shadow-md gap-1.5 lg:gap-2.5 hover:shadow-lg max-w-lg">
                <MapPin className="w-3.5 lg:w-4 h-3.5 lg:h-4 text-gray-500 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Where?"
                  readOnly
                  value={searchData.location}
                  className="outline-none bg-transparent text-xs lg:text-sm w-20 cursor-pointer"
                />
                <div className="hidden md:block border-l h-4 border-gray-300"></div>
                <Calendar className="hidden md:block w-3.5 lg:w-4 h-3.5 lg:h-4 text-gray-500 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="When?"
                  readOnly
                  value={
                    searchData.checkIn && searchData.checkOut
                      ? `${new Date(searchData.checkIn).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )} - ${new Date(searchData.checkOut).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                          }
                        )}`
                      : ""
                  }
                  className="hidden md:block outline-none bg-transparent text-xs lg:text-sm w-20 cursor-pointer"
                />
                <div className="hidden lg:block border-l h-4 border-gray-300"></div>
                {activeFilter === "services" ? (
                  <>
                    <Briefcase className="hidden lg:block w-3.5 lg:w-4 h-3.5 lg:h-4 text-gray-500 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="What type?"
                      readOnly
                      value={searchData.serviceType}
                      className="hidden lg:block outline-none bg-transparent text-xs lg:text-sm w-16 cursor-pointer"
                    />
                  </>
                ) : (
                  <>
                    <Users className="hidden lg:block w-3.5 lg:w-4 h-3.5 lg:h-4 text-gray-500 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Who?"
                      readOnly
                      value={
                        searchData.guests > 1
                          ? `${searchData.guests} guests`
                          : ""
                      }
                      className="hidden lg:block outline-none bg-transparent text-xs lg:text-sm w-16 cursor-pointer"
                    />
                  </>
                )}
                <div className="bg-indigo-600 text-white p-1.5 lg:p-2 rounded-full hover:bg-indigo-700 transition flex-shrink-0">
                  <Search className="w-3.5 lg:w-4 h-3.5 lg:h-4" />
                </div>
              </div>
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

              {/* Notifications Icon */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setNotificationDropdownOpen(!notificationDropdownOpen)
                  }
                  className="relative p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-all duration-200 hover:scale-110 text-slate-300 hover:text-white"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold w-5 h-5 rounded-full flex items-center justify-center">
                      {unreadNotificationsCount > 9
                        ? "9+"
                        : unreadNotificationsCount}
                    </span>
                  )}
                </button>

                {notificationDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-slate-800 text-slate-200 rounded-lg shadow-lg border border-slate-700 z-50">
                    {unreadNotificationsCount > 0 ? (
                      <>
                        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-3 z-10">
                          <p className="text-slate-300 font-medium">
                            {unreadNotificationsCount} unread{" "}
                            {unreadNotificationsCount === 1
                              ? "notification"
                              : "notifications"}
                          </p>
                        </div>
                        <div className="p-2">
                          {unreadNotifications
                            .slice(0, 3)
                            .map((notification) => (
                              <Link
                                key={notification.id}
                                to={ROUTES.GUEST.NOTIFICATIONS}
                                onClick={() =>
                                  setNotificationDropdownOpen(false)
                                }
                                className="block p-3 mb-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600"
                              >
                                <div className="flex flex-col gap-1">
                                  <p className="text-xs font-semibold text-indigo-400">
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-slate-300 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  {notification.createdAt && (
                                    <p className="text-xs text-slate-500 mt-1">
                                      {new Date(
                                        notification.createdAt.toMillis?.() ||
                                          notification.createdAt
                                      ).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </Link>
                            ))}
                        </div>
                        <Link
                          to={ROUTES.GUEST.NOTIFICATIONS}
                          className="block p-3 text-center border-t border-slate-700 text-indigo-400 hover:text-indigo-300 text-xs font-medium hover:bg-slate-700/30 transition-colors"
                          onClick={() => setNotificationDropdownOpen(false)}
                        >
                          View all notifications →
                        </Link>
                      </>
                    ) : (
                      <p className="p-3 text-sm text-slate-400">
                        No new notifications
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Profile Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="hidden lg:flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-all duration-200"
                >
                  {userData?.photoURL ? (
                    <img
                      src={userData.photoURL}
                      alt="Profile"
                      className="w-9 h-9 rounded-full object-cover border-2 border-slate-600 hover:border-indigo-500 transition-colors"
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
                  <span className="text-sm font-medium text-slate-200 hover:text-white whitespace-nowrap">
                    Profile
                  </span>
                  {profileDropdownOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {/* Profile Dropdown */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-72 bg-slate-800 backdrop-blur-xl text-slate-200 rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden z-50 transition-all duration-200">
                    {/* User Info Header */}
                    <div className="px-5 py-4 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border-b border-slate-700/50">
                      <p className="text-sm font-semibold text-white truncate">
                        {user?.fullName || "Guest"}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {user?.email || ""}
                      </p>
                    </div>

                    {/* Profile Section */}
                    <div className="border-b border-slate-700/50 my-1">
                      <Link
                        to={ROUTES.GUEST.PROFILE}
                        className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-blue-500/20 hover:text-blue-300"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <User className="w-5 h-5 group-hover/item:scale-110 transition-transform" />{" "}
                        My Profile
                      </Link>

                      <Link
                        to={ROUTES.GUEST.FAVORITES}
                        className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-pink-500/20 hover:to-pink-500/20 hover:text-pink-300"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <Heart className="w-5 h-5 group-hover/item:scale-110 transition-transform" />{" "}
                        Favorites
                      </Link>
                    </div>

                    {/* Bookings & Messages */}
                    <div className="border-b border-slate-700/50 my-1">
                      <Link
                        to={ROUTES.GUEST.MY_BOOKINGS}
                        className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-cyan-500/20 hover:text-cyan-300"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <Calendar className="w-5 h-5 group-hover/item:scale-110 transition-transform" />{" "}
                        My Bookings
                      </Link>

                      <Link
                        to={ROUTES.GUEST.MESSAGES}
                        className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-purple-500/20 hover:text-purple-300"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <div className="relative">
                          <MessageSquare className="w-5 h-5 group-hover/item:scale-110 transition-transform" />
                          {unreadMessagesCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                              {unreadMessagesCount > 9
                                ? "9+"
                                : unreadMessagesCount}
                            </span>
                          )}
                        </div>
                        Messages
                      </Link>

                      <Link
                        to={ROUTES.GUEST.NOTIFICATIONS}
                        className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-yellow-500/20 hover:to-yellow-500/20 hover:text-yellow-300"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <Bell className="w-5 h-5 group-hover/item:scale-110 transition-transform" />{" "}
                        Notifications
                      </Link>
                    </div>

                    {/* Wallet */}
                    <div className="border-b border-slate-700/50 my-1">
                      <Link
                        to={ROUTES.GUEST.E_WALLET}
                        className="flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item hover:bg-gradient-to-r hover:from-yellow-500/20 hover:to-yellow-500/20 hover:text-yellow-300"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <LucideWallet className="w-5 h-5 group-hover/item:scale-110 transition-transform" />{" "}
                        E-Wallet
                      </Link>
                    </div>

                    <button
                      className="w-full flex items-center gap-3 px-5 py-3.5 text-sm transition-all duration-200 group/item text-left hover:bg-gradient-to-r hover:from-red-500/20 hover:to-red-500/20 hover:text-red-300"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-5 h-5 group-hover/item:scale-110 transition-transform" />{" "}
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Tab Navigation - Only on mobile */}
        <div
          className={`lg:hidden max-w-full mx-auto px-2 sm:px-4 transition-all duration-500 ease-out overflow-hidden ${
            isScrolled ? "opacity-0 max-h-0 py-0" : "opacity-100 max-h-12 py-2"
          }`}
        >
          <div className="flex gap-1 justify-center flex-nowrap">
            {guestTabs.map(({ id, label, icon: Icon, color }) => (
              <button
                key={id}
                onClick={() => handleTabClick(id)}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 flex items-center gap-1 flex-1 justify-center whitespace-nowrap ${
                  activeFilter === id
                    ? `bg-gradient-to-r ${color} text-white shadow-lg`
                    : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                <Icon className="w-3 h-3 flex-shrink-0" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Full-Width Search Bar - Desktop Only - Below nav items when not scrolled */}
        <div
          className={`hidden lg:block max-w-full mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-700 ease-in-out overflow-hidden ${
            isScrolled
              ? "max-h-0 py-0 opacity-0 -translate-y-10"
              : "max-h-24 py-3 opacity-100 translate-y-0"
          }`}
        >
          <div className="flex justify-center">
            <div
              onClick={handleSearchClick}
              className="flex items-center bg-white rounded-full px-4 lg:px-6 py-2.5 lg:py-3 text-gray-700 shadow-md gap-2 lg:gap-3 transition-all hover:shadow-lg max-w-2xl w-full cursor-pointer"
            >
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <MapPin className="w-3.5 lg:w-4 h-3.5 lg:h-4 text-gray-500 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Where?"
                  readOnly
                  value={searchData.location}
                  className="outline-none bg-transparent text-xs lg:text-sm flex-1 min-w-0 cursor-pointer"
                />
              </div>

              <div className="hidden md:block border-l h-5 border-gray-300"></div>

              <div className="hidden md:flex items-center gap-2 flex-1 min-w-0">
                <Calendar className="w-3.5 lg:w-4 h-3.5 lg:h-4 text-gray-500 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="When?"
                  readOnly
                  value={
                    searchData.checkIn && searchData.checkOut
                      ? `${new Date(searchData.checkIn).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )} - ${new Date(searchData.checkOut).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )}`
                      : ""
                  }
                  className="outline-none bg-transparent text-xs lg:text-sm flex-1 min-w-0 cursor-pointer"
                />
              </div>

              <div className="hidden lg:block border-l h-5 border-gray-300"></div>

              <div className="hidden lg:flex items-center gap-2 flex-1 min-w-0">
                {activeFilter === "services" ? (
                  <>
                    <Briefcase className="w-3.5 lg:w-4 h-3.5 lg:h-4 text-gray-500 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="What type?"
                      readOnly
                      value={searchData.serviceType}
                      className="outline-none bg-transparent text-xs lg:text-sm flex-1 min-w-0 cursor-pointer"
                    />
                  </>
                ) : (
                  <>
                    <Users className="w-3.5 lg:w-4 h-3.5 lg:h-4 text-gray-500 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Who?"
                      readOnly
                      value={
                        searchData.guests > 1
                          ? `${searchData.guests} guests`
                          : ""
                      }
                      className="outline-none bg-transparent text-xs lg:text-sm flex-1 min-w-0 cursor-pointer"
                    />
                  </>
                )}
              </div>

              <div className="bg-indigo-600 text-white p-1.5 lg:p-2 rounded-full hover:bg-indigo-700 transition flex-shrink-0 flex items-center justify-center">
                <Search className="w-3.5 lg:w-4 h-3.5 lg:h-4" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Expanded Search View - Redesigned Compact Modal */}
      {isSearchExpanded && (
        <div
          className={`fixed top-14 sm:top-16 left-0 right-0 z-40 bg-gradient-to-br from-slate-900/98 via-slate-900/96 to-indigo-950/95 backdrop-blur-xl border-t border-indigo-500/20 transition-all duration-300 ease-in-out transform shadow-2xl ${
            isSearchExpanded
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-full"
          }`}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Close Button */}
            <button
              onClick={handleSearchClose}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-all duration-200 hover:scale-110 hover:rotate-90 backdrop-blur-sm border border-slate-700/50"
              title="Close search"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Expanded Content */}
            <form onSubmit={handleSearchSubmit} className="space-y-5">
              {/* Compact Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Where */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                    <MapPin className="w-4 h-4 text-indigo-400" />
                    Where to?
                  </label>
                  <input
                    type="text"
                    placeholder="Search destinations..."
                    value={searchData.location}
                    onChange={(e) =>
                      setSearchData({ ...searchData, location: e.target.value })
                    }
                    autoFocus
                    className="w-full px-4 py-2.5 bg-slate-800/70 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 text-sm backdrop-blur-sm transition-all"
                  />
                </div>

                {/* Guests or Service Type */}
                {activeFilter === "services" ? (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                      <Briefcase className="w-4 h-4 text-purple-400" />
                      Service Type
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Cleaning, Repair"
                      value={searchData.serviceType || ""}
                      onChange={(e) =>
                        setSearchData({
                          ...searchData,
                          serviceType: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 bg-slate-800/70 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 text-sm backdrop-blur-sm transition-all"
                    />
                    {serviceTypeSuggestions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {serviceTypeSuggestions.slice(0, 4).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() =>
                              setSearchData({
                                ...searchData,
                                serviceType: type,
                              })
                            }
                            className="px-3 py-1 bg-slate-700/60 text-slate-300 rounded-lg text-xs hover:bg-purple-600 hover:text-white transition-all backdrop-blur-sm border border-slate-600/50"
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                      <Users className="w-4 h-4 text-cyan-400" />
                      Guests
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={searchData.guests}
                      onChange={(e) =>
                        setSearchData({ ...searchData, guests: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-slate-800/70 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 text-sm backdrop-blur-sm transition-all"
                    />
                  </div>
                )}
              </div>

              {/* Date Range Section */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <Calendar className="w-4 h-4 text-pink-400" />
                  Select Dates
                </label>
                <button
                  type="button"
                  onClick={() => setShowDateRangePicker(!showDateRangePicker)}
                  className="w-full px-4 py-2.5 bg-slate-800/70 border border-slate-700/50 rounded-xl text-left text-white hover:border-pink-500/50 transition-all text-sm backdrop-blur-sm flex items-center justify-between group"
                >
                  <span>
                    {searchData.checkIn && searchData.checkOut
                      ? `${new Date(searchData.checkIn).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" }
                        )} - ${new Date(searchData.checkOut).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" }
                        )}`
                      : "Click to select dates"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      showDateRangePicker ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Modern Inline Date Picker */}
                {showDateRangePicker && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-3 p-4 bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-xl overflow-hidden backdrop-blur-sm shadow-xl"
                  >
                    <style>{`
  /* Modern Compact Calendar - Lighter Dark Theme */
                          .rdrCalendarWrapper {
                            background: linear-gradient(135deg, rgba(51, 65, 85, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%) !important;
                            border: 1px solid rgba(99, 102, 241, 0.4) !important;
                            font-family: inherit !important;
                            width: 100% !important;
                            max-width: 100% !important;
                            border-radius: 0.75rem !important;
                            padding: 0.75rem !important;
                            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4) !important;
                          }

                          /* Month Container - Compact */
                          .rdrMonth {
                            width: auto !important;
                            padding: 0 0.25rem !important;
                            margin: 0 !important;
                            flex: 1 !important;
                            min-width: auto !important;
                          }

                          /* Month and Year Selectors - Modern Dark */
                          .rdrMonthAndYearPickers {
                            background: linear-gradient(90deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%) !important;
                            padding: 0.5rem 0.75rem !important;
                            justify-content: center !important;
                            gap: 0.5rem !important;
                            display: flex !important;
                            width: 100% !important;
                            border-radius: 0.5rem !important;
                            margin-bottom: 0.75rem !important;
                            border: 1px solid rgba(99, 102, 241, 0.2) !important;
                          }

                          .rdrMonthPicker,
                          .rdrYearPicker {
                            position: relative !important;
                            display: flex !important;
                            gap: 0.25rem !important;
                            align-items: center !important;
                          }

                          .rdrMonthPicker select,
                          .rdrYearPicker select {
                            background: rgba(30, 41, 59, 0.8) !important;
                            border: 1px solid rgba(148, 163, 184, 0.3) !important;
                            color: #e2e8f0 !important;
                            padding: 0.375rem 0.5rem !important;
                            border-radius: 0.5rem !important;
                            font-size: 0.75rem !important;
                            cursor: pointer !important;
                            font-weight: 600 !important;
                            transition: all 0.2s !important;
                            min-width: 80px !important;
                          }

                          .rdrMonthPicker select:hover,
                          .rdrYearPicker select:hover {
                            border-color: #6366f1 !important;
                            background: rgba(99, 102, 241, 0.2) !important;
                          }

                          .rdrMonthPicker select:focus,
                          .rdrYearPicker select:focus {
                            outline: none !important;
                            border-color: #8b5cf6 !important;
                            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2) !important;
                          }

                          /* Navigation Buttons - Modern Dark */
                          .rdrNextPrevButton {
                            background: rgba(30, 41, 59, 0.8) !important;
                            border: 1px solid rgba(148, 163, 184, 0.3) !important;
                            color: #e2e8f0 !important;
                            border-radius: 0.5rem !important;
                            padding: 0.375rem !important;
                            height: 1.75rem !important;
                            width: 1.75rem !important;
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            transition: all 0.2s !important;
                            cursor: pointer !important;
                            font-size: 0.9rem !important;
                          }

                          .rdrNextPrevButton:hover {
                            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
                            border-color: #8b5cf6 !important;
                            color: #ffffff !important;
                            transform: scale(1.1) !important;
                          }

                          /* Date Display Section - Hidden for cleaner look */
                          .rdrDateDisplayWrapper {
                            display: none !important;
                          }

                          .rdrDateDisplay {
                            display: none !important;
                          }

                          .rdrDateDisplayItem {
                            display: none !important;
                          }

                          .rdrDateDisplayItem input {
                            display: none !important;
                          }

                          .rdrDateDisplayItem input:focus {
                            outline: none !important;
                          }

                          /* Caption - Modern Dark */
                          .rdrCaption {
                            color: #e2e8f0 !important;
                            font-size: 0.8rem !important;
                            font-weight: 700 !important;
                            padding: 0.5rem 0 !important;
                            text-align: center !important;
                          }

                          /* Week Days - Modern with Better Visibility */
                          .rdrWeekDays {
                            display: flex !important;
                            justify-content: center !important;
                            gap: 0 !important;
                            padding: 0.5rem 0 !important;
                            margin-bottom: 0.5rem !important;
                            border-bottom: 1px solid rgba(99, 102, 241, 0.3) !important;
                            visibility: visible !important;
                          }

                          .rdrWeekDay {
                            color: #cbd5e1 !important;
                            font-size: 0.7rem !important;
                            font-weight: 700 !important;
                            width: 2.5rem !important;
                            height: 1.75rem !important;
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            visibility: visible !important;
                            opacity: 1 !important;
                            text-transform: uppercase !important;
                            letter-spacing: 0.5px !important;
                          }

                          /* Days Container */
                          .rdrDays {
                            display: flex !important;
                            flex-wrap: wrap !important;
                            justify-content: center !important;
                            gap: 0 !important;
                            visibility: visible !important;
                          }

                          /* Individual Day - Modern Dark with Better Visibility */
                          .rdrDay {
                            width: 2.5rem !important;
                            height: 2.25rem !important;
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            border-radius: 0.5rem !important;
                            cursor: pointer !important;
                            transition: all 0.2s ease !important;
                            font-size: 0.8rem !important;
                            font-weight: 600 !important;
                            visibility: visible !important;
                            background-color: rgba(51, 65, 85, 0.3) !important;
                            margin: 1px !important;
                            color: #ffffff !important;
                          }

                          .rdrDay:hover:not(.rdrDayPassive) {
                            background: linear-gradient(135deg, rgba(99, 102, 241, 0.4) 0%, rgba(139, 92, 246, 0.4) 100%) !important;
                            transform: scale(1.05) !important;
                          }

                          /* Force white color on ALL day numbers by default */
                          .rdrDayNumber {
                            color: #ffffff !important;
                            font-size: 0.85rem !important;
                            font-weight: 700 !important;
                            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
                          }

                          /* Target span elements inside day cells */
                          .rdrDay span {
                            color: #ffffff !important;
                          }

                          /* Ensure regular selectable days have white text */
                          .rdrDay:not(.rdrDayPassive):not(.rdrInRange):not(.rdrStartEdge):not(.rdrEndEdge) .rdrDayNumber,
                          .rdrDay:not(.rdrDayPassive):not(.rdrInRange):not(.rdrStartEdge):not(.rdrEndEdge) span {
                            color: #ffffff !important;
                          }

                          .rdrDay.rdrDayPassive {
                            background-color: transparent !important;
                            cursor: not-allowed !important;
                          }

                          .rdrDay.rdrDayPassive .rdrDayNumber,
                          .rdrDay.rdrDayPassive span {
                            color: #475569 !important;
                            font-size: 0.75rem !important;
                            font-weight: 400 !important;
                            opacity: 0.5 !important;
                          }

                          /* In Range - Modern Gradient */
                          .rdrDay.rdrInRange {
                            background: linear-gradient(135deg, rgba(99, 102, 241, 0.5) 0%, rgba(139, 92, 246, 0.5) 100%) !important;
                            color: #ffffff !important;
                            border: 1px solid rgba(99, 102, 241, 0.3) !important;
                          }

                          .rdrDay.rdrInRange .rdrDayNumber,
                          .rdrDay.rdrInRange span {
                            color: #ffffff !important;
                            font-weight: 700 !important;
                          }

                          /* Start and End Edges - Bold Gradient */
                          .rdrDay.rdrStartEdge,
                          .rdrDay.rdrEndEdge {
                            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
                            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4) !important;
                            border: 1px solid rgba(139, 92, 246, 0.5) !important;
                            transform: scale(1.05) !important;
                          }

                          .rdrDay.rdrStartEdge .rdrDayNumber,
                          .rdrDay.rdrStartEdge span,
                          .rdrDay.rdrEndEdge .rdrDayNumber,
                          .rdrDay.rdrEndEdge span {
                            color: #ffffff !important;
                            font-weight: 800 !important;
                          }

                          /* Previews */
                          .rdrDayStartPreview,
                          .rdrDayInPreview,
                          .rdrDayEndPreview {
                            background: linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%) !important;
                            opacity: 1 !important;
                          }

                          /* Force White Text and Gradient for Selected Range */
                          .rdrDay.rdrInRange,
                          .rdrDay.rdrStartEdge,
                          .rdrDay.rdrEndEdge {
                            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
                            color: #ffffff !important;
                            position: relative !important;
                            z-index: 1 !important;
                          }

                          .rdrDay.rdrInRange .rdrDayNumber,
                          .rdrDay.rdrInRange span,
                          .rdrDay.rdrStartEdge .rdrDayNumber,
                          .rdrDay.rdrStartEdge span,
                          .rdrDay.rdrEndEdge .rdrDayNumber,
                          .rdrDay.rdrEndEdge span {
                            color: #ffffff !important;
                            font-weight: 700 !important;
                            position: relative !important;
                            z-index: 2 !important;
                          }

                          /* Today's Date Special Styling */
                          .rdrDay.rdrDayToday:not(.rdrInRange) {
                            border: 2px solid rgba(99, 102, 241, 0.5) !important;
                          }

                          .rdrDay.rdrDayToday:not(.rdrInRange) .rdrDayNumber {
                            color: #818cf8 !important;
                            font-weight: 700 !important;
                          }

                          /* Hover feedback for selected days */
                          .rdrDay.rdrInRange:hover,
                          .rdrDay.rdrStartEdge:hover,
                          .rdrDay.rdrEndEdge:hover {
                            background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%) !important;
                            transform: scale(1.1) !important;
                            box-shadow: 0 6px 16px rgba(99, 102, 241, 0.5) !important;
                          }

                          .rdrStartEdge {
                            border-radius: 0.5rem !important;
                          }

                          .rdrEndEdge {
                            border-radius: 0.5rem !important;
                          }

                          /* Hide unnecessary elements */
                          .rdrDefinedRangesWrapper,
                          .rdrPresets {
                            display: none !important;
                          }

                          /* Mobile Responsive */
                          @media (max-width: 768px) {
                            .rdrMonth {
                              padding: 0 0.25rem !important;
                            }

                            .rdrDay {
                              width: 2.25rem !important;
                              height: 1.75rem !important;
                              font-size: 0.7rem !important;
                            }

                            .rdrWeekDay {
                              width: 2.25rem !important;
                              height: 1.4rem !important;
                              font-size: 0.6rem !important;
                            }

                            .rdrCaption {
                              font-size: 0.75rem !important;
                              padding: 0.3rem 0 !important;
                            }

                            .rdrNextPrevButton {
                              height: 1.5rem !important;
                              width: 1.5rem !important;
                              font-size: 0.8rem !important;
                            }

                            .rdrDateDisplayWrapper {
                              padding: 0.5rem !important;
                              margin-bottom: 0.6rem !important;
                            }
                          }

                          @media (max-width: 640px) {
                            .rdrDay {
                              width: 2rem !important;
                              height: 1.6rem !important;
                              font-size: 0.65rem !important;
                            }

                            .rdrWeekDay {
                              width: 2rem !important;
                              height: 1.3rem !important;
                              font-size: 0.55rem !important;
                            }

                            .rdrCaption {
                              font-size: 0.7rem !important;
                            }

                            .rdrMonthAndYearPickers {
                              gap: 0.5rem !important;
                              padding: 0.3rem 0 !important;
                            }

                            .rdrMonthPicker select,
                            .rdrYearPicker select {
                              padding: 0.25rem 0.375rem !important;
                              font-size: 0.65rem !important;
                              min-width: 70px !important;
                            }

                            .rdrDateDisplayItem {
                              padding: 0.25rem 0.5rem !important;
                              font-size: 0.65rem !important;
                            }

                            .rdrDateDisplayItem input {
                              font-size: 0.65rem !important;
                              min-width: 90px !important;
                            }

                            .rdrNextPrevButton {
                              height: 1.4rem !important;
                              width: 1.4rem !important;
                              font-size: 0.75rem !important;
                            }
                          }
                        `}</style>

                    <DateRange
                      ranges={dateRange}
                      onChange={handleDateRangeChange}
                      rangeColors={["#6366f1"]}
                      showMonthAndYearPickers={true}
                      staticRanges={[]}
                      inputRanges={[]}
                      editableDateInputs={true}
                      moveRangeOnFirstSelection={false}
                      months={responsiveConfig.months}
                      direction={responsiveConfig.direction}
                    />
                  </motion.div>
                )}
              </div>

              {/* Modern Search Button */}
              <button
                type="submit"
                className="w-full mt-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
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
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-40 top-0 transition-all duration-300 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            ></motion.div>
            <motion.div
              className="fixed right-0 top-0 h-screen w-80 max-w-[90vw] bg-slate-800 backdrop-blur-xl border-l border-slate-700/50 z-50 overflow-y-auto transition-all duration-300 transform lg:hidden"
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
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
                    <p className="text-xs text-slate-400 truncate">
                      {user?.email || ""}
                    </p>
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
                  <div className="relative">
                    <MessageSquare className="w-5 h-5 flex-shrink-0" />
                    {unreadMessagesCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
                      </span>
                    )}
                  </div>
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Guest Simple Navigation Component - For non-home pages (Messages, Bookings, Favorites, etc.)
// Host Simple NavBar Component
const HostSimpleNavBar = ({
  user,
  userData,
  handleLogout,
  unreadMessagesCount,
}) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 text-white transition-all duration-300 ${
        isScrolled
          ? "py-3 bg-transparent"
          : "shadow-lg border-b border-white/20 bg-slate-900/70 backdrop-blur-[20px]"
      }`}
    >
      <div className="w-full px-6 sm:px-8 lg:px-12">
        {/* Card Wrapper - Mobile and Desktop when scrolled */}
        <div
          className={`transition-all duration-300 w-full ${
            isScrolled
              ? "bg-slate-900/70 backdrop-blur-[20px] shadow-2xl border border-white/20 rounded-2xl px-6 sm:px-8 lg:px-12 py-3"
              : "py-3"
          }`}
        >
          <div className="flex items-center justify-between h-14 w-full">
            {/* Left - Back Button and Logo */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={() => navigate(ROUTES.HOST.DASHBOARD)}
                className="p-2 hover:bg-slate-700/50 rounded-lg transition-all duration-200"
                title="Back to dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-slate-300 hover:text-white" />
              </button>
              {/* <Link
                to={ROUTES.HOST.DASHBOARD}
                className="flex items-center cursor-pointer"
              >
                <img
                  src="/bookingNestLogoFInal.png"
                  alt="BookingNest"
                  className="sm:w-24 sm:h-24 lg:w-22 lg:h-22 hover:scale-105 transition-transform relative top-1.5 left-4"
                />
              </Link> */}
            </div>

            {/* Right - Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-all duration-200"
              >
                {userData?.photoURL ? (
                  <img
                    src={userData.photoURL}
                    alt="Profile"
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-slate-600 hover:border-indigo-500 transition-colors"
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
                      : "H"}
                  </div>
                )}
                <span className="text-xs sm:text-sm font-medium text-slate-200 hover:text-white whitespace-nowrap hidden sm:inline">
                  Profile
                </span>
              </button>

              {/* Profile Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-slate-800 backdrop-blur-xl text-slate-200 rounded-xl shadow-xl border border-slate-700/30 overflow-hidden z-50 transition-all duration-200">
                  {/* User Info Header */}
                  <div className="px-4 py-3 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border-b border-slate-700/30">
                    <p className="text-sm font-semibold text-white truncate">
                      {user?.fullName || "Host"}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {user?.email || ""}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="divide-y divide-slate-700/30">
                    <Link
                      to={ROUTES.HOST.PROFILE}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 group/item hover:bg-blue-500/15 hover:text-blue-300"
                    >
                      <User className="w-4 h-4 group-hover/item:scale-110 transition-transform" />{" "}
                      My Profile
                    </Link>

                    <Link
                      to={ROUTES.HOST.DASHBOARD}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 group/item hover:bg-indigo-500/15 hover:text-indigo-300"
                    >
                      <BarChart3 className="w-4 h-4 group-hover/item:scale-110 transition-transform" />{" "}
                      Dashboard
                    </Link>

                    <Link
                      to={ROUTES.HOST.STAYS}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 group/item hover:bg-cyan-500/15 hover:text-cyan-300"
                    >
                      <Home className="w-4 h-4 group-hover/item:scale-110 transition-transform" />{" "}
                      My Stays
                    </Link>

                    <Link
                      to={ROUTES.HOST.EXPERIENCES}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 group/item hover:bg-purple-500/15 hover:text-purple-300"
                    >
                      <Calendar className="w-4 h-4 group-hover/item:scale-110 transition-transform" />{" "}
                      My Experiences
                    </Link>

                    <Link
                      to={ROUTES.HOST.SERVICES}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 group/item hover:bg-green-500/15 hover:text-green-300"
                    >
                      <Briefcase className="w-4 h-4 group-hover/item:scale-110 transition-transform" />{" "}
                      My Services
                    </Link>

                    <Link
                      to={ROUTES.HOST.E_WALLET}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 group/item hover:bg-yellow-500/15 hover:text-yellow-300"
                    >
                      <Wallet className="w-4 h-4 group-hover/item:scale-110 transition-transform" />{" "}
                      E-wallet
                    </Link>

                    <Link
                      to={ROUTES.HOST.MESSAGES}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 group/item hover:bg-purple-500/15 hover:text-purple-300"
                    >
                      <div className="relative">
                        <MessageSquare className="w-4 h-4 group-hover/item:scale-110 transition-transform" />
                        {unreadMessagesCount > 0 && (
                          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                            {unreadMessagesCount > 9
                              ? "9+"
                              : unreadMessagesCount}
                          </span>
                        )}
                      </div>
                      Messages
                    </Link>

                    <Link
                      to={ROUTES.HOST.DRAFTS}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 group/item hover:bg-orange-500/15 hover:text-orange-300"
                    >
                      <FileEdit className="w-4 h-4 group-hover/item:scale-110 transition-transform" />{" "}
                      Drafts
                    </Link>

                    <button
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 group/item text-left hover:bg-red-500/15 hover:text-red-300"
                      onClick={() => {
                        setDropdownOpen(false);
                        handleLogout();
                      }}
                    >
                      <LogOut className="w-4 h-4 group-hover/item:scale-110 transition-transform" />{" "}
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

const GuestSimpleNavBar = ({
  user,
  userData,
  handleLogout,
  unreadMessagesCount,
}) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 text-white shadow-lg border-b border-slate-700 bg-slate-900">
      <div className="w-full px-6 sm:px-8 lg:px-12 py-3">
        <div className="flex items-center justify-between h-14 w-full">
          {/* Left - Back Button and Logo */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <button
              onClick={() => navigate(ROUTES.GUEST.HOME)}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-all duration-200"
              title="Back to home"
            >
              <ArrowLeft className="w-5 h-5 text-slate-300 hover:text-white" />
            </button>
            {/* <Link
              to={ROUTES.GUEST.HOME}
              className="flex items-center cursor-pointer"
            >
              <img
                src="/bookingNestLogoFInal.png"
                alt="BookingNest"
                className="w-10 h-10 sm:w-12 sm:h-12 hover:scale-105 transition-transform"
              />
            </Link> */}
          </div>

          {/* Right - Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-all duration-200"
            >
              {userData?.photoURL ? (
                <img
                  src={userData.photoURL}
                  alt="Profile"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-slate-600 hover:border-indigo-500 transition-colors"
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
              <span className="text-xs sm:text-sm font-medium text-slate-200 hover:text-white whitespace-nowrap hidden sm:inline">
                Profile
              </span>
            </button>

            {/* Profile Dropdown */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-slate-800 backdrop-blur-xl text-slate-200 rounded-xl shadow-xl border border-slate-700/30 overflow-hidden z-50 transition-all duration-200">
                {/* User Info Header */}
                <div className="px-4 py-3 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border-b border-slate-700/30">
                  <p className="text-sm font-semibold text-white truncate">
                    {user?.fullName || "Guest"}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {user?.email || ""}
                  </p>
                </div>

                {/* Menu Items */}
                <div className="divide-y divide-slate-700/30">
                  <Link
                    to={ROUTES.GUEST.PROFILE}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 group/item hover:bg-blue-500/15 hover:text-blue-300"
                  >
                    <User className="w-4 h-4 group-hover/item:scale-110 transition-transform" />{" "}
                    My Profile
                  </Link>

                  <Link
                    to={ROUTES.GUEST.FAVORITES}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 group/item hover:bg-pink-500/15 hover:text-pink-300"
                  >
                    <Heart className="w-4 h-4 group-hover/item:scale-110 transition-transform" />{" "}
                    Favorites
                  </Link>

                  <Link
                    to={ROUTES.GUEST.MY_BOOKINGS}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 group/item hover:bg-cyan-500/15 hover:text-cyan-300"
                  >
                    <Calendar className="w-4 h-4 group-hover/item:scale-110 transition-transform" />{" "}
                    My Bookings
                  </Link>

                  <Link
                    to={ROUTES.GUEST.MESSAGES}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 group/item hover:bg-purple-500/15 hover:text-purple-300"
                  >
                    <div className="relative">
                      <MessageSquare className="w-4 h-4 group-hover/item:scale-110 transition-transform" />
                      {unreadMessagesCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                          {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
                        </span>
                      )}
                    </div>
                    Messages
                  </Link>

                  <Link
                    to={ROUTES.GUEST.E_WALLET}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 group/item hover:bg-yellow-500/15 hover:text-yellow-300"
                  >
                    <LucideWallet className="w-4 h-4 group-hover/item:scale-110 transition-transform" />{" "}
                    E-Wallet
                  </Link>

                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 group/item text-left hover:bg-red-500/15 hover:text-red-300"
                    onClick={() => {
                      setDropdownOpen(false);
                      handleLogout();
                    }}
                  >
                    <LogOut className="w-4 h-4 group-hover/item:scale-110 transition-transform" />{" "}
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

// ========== MAIN COMPONENT ==========

export default function NavigationBar({
  userData,
  user,
  forceSimpleNavBar = false,
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] =
    useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const { openSignIn, selectSignUpRole } = useContext(AuthModalContext);

  const isGuest = userData?.role === "guest" || forceSimpleNavBar;
  const isHost = userData?.role === "host";

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to logout?")) return;
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
    // Navigate immediately to prevent showing protected route
    navigate(ROUTES.HOME);
    await signOut(auth);
    toast.success("Logged out successfully");
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 110;
      if (scrolled !== isScrolled) setIsScrolled(scrolled);
      // Close dropdowns when scrolling
      setNotificationDropdownOpen(false);
      setProfileDropdownOpen(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isScrolled]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Check if click is outside dropdowns
      const navBar = document.querySelector("nav");
      if (navBar && !navBar.contains(e.target)) {
        setNotificationDropdownOpen(false);
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Set up real-time listener for unread notifications (both hosts and guests)
  useEffect(() => {
    if (!userData?.id) {
      setUnreadNotificationsCount(0);
      setUnreadNotifications([]);
      return;
    }

    setUnreadNotifications([]);
    setUnreadNotificationsCount(0);

    const notificationsCollection = collection(db, "notifications");
    let latestNewNotifications = [];
    let latestLegacyNotifications = [];

    const mergeAndSetNotifications = () => {
      const combinedMap = new Map();
      [...latestNewNotifications, ...latestLegacyNotifications].forEach(
        (notification) => {
          if (notification?.id) {
            combinedMap.set(notification.id, notification);
          }
        }
      );

      const mergedNotifications = Array.from(combinedMap.values()).sort(
        (a, b) =>
          (getTimestampValue(b?.createdAt) ?? 0) -
          (getTimestampValue(a?.createdAt) ?? 0)
      );

      setUnreadNotifications(mergedNotifications);
      setUnreadNotificationsCount(mergedNotifications.length);
    };

    const newQuery = query(
      notificationsCollection,
      where("userId", "==", userData.id),
      where("isRead", "==", false)
    );

    const unsubscribeNew = onSnapshot(newQuery, (snapshot) => {
      latestNewNotifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      mergeAndSetNotifications();
    });

    let unsubscribeLegacy;
    try {
      const legacyField = userData.role === "host" ? "host_id" : "guest_id";
      const legacyQuery = query(
        notificationsCollection,
        where(legacyField, "==", userData.id),
        where("isRead", "==", false)
      );

      unsubscribeLegacy = onSnapshot(legacyQuery, (snapshot) => {
        latestLegacyNotifications = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        mergeAndSetNotifications();
      });
    } catch (error) {
      console.log("Old notification format not available");
    }

    return () => {
      unsubscribeNew();
      if (unsubscribeLegacy) unsubscribeLegacy();
    };
  }, [userData?.id, userData?.role]);

  // Listen to unread message conversations
  useEffect(() => {
    if (!user?.uid) {
      setUnreadMessagesCount(0);
      return;
    }

    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let unreadCount = 0;
      snapshot.docs.forEach((doc) => {
        const convData = doc.data();
        const userUnreadCount = convData.unreadCount?.[user.uid] || 0;
        if (userUnreadCount > 0) {
          unreadCount++;
        }
      });
      setUnreadMessagesCount(unreadCount);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const getNavbarBg = () => {
    // For hosts when scrolled, make background transparent (card will have the background)
    if (isHost && isScrolled) return "bg-transparent";
    // For authenticated users (not scrolled or not host), solid background
    if (user) return "bg-slate-900 shadow-md";
    // For public users
    return isScrolled
      ? "bg-slate-900/70 backdrop-blur-[20px] shadow-lg"
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
              ? "bg-slate-900/70 backdrop-blur-[20px] shadow-2xl border-b border-white/20 py-3"
              : "bg-slate-900/95 backdrop-blur-sm shadow-md border-b border-white/10 py-4"
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
                  ].map(({ to, icon: IconComponent, label, color }) => {
                    const IconElement = IconComponent;
                    const isActive =
                      location.pathname === to ||
                      location.pathname.startsWith(to);
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
                      location.pathname === ROUTES.GUEST.MY_BOOKINGS ||
                      location.pathname.startsWith(ROUTES.GUEST.MY_BOOKINGS)
                        ? "nav-link-active bg-gradient-to-r from-cyan-400 to-purple-400 text-white shadow-lg"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar
                        className={`w-5 h-5 transition-transform ${
                          location.pathname === ROUTES.GUEST.MY_BOOKINGS ||
                          location.pathname.startsWith(ROUTES.GUEST.MY_BOOKINGS)
                            ? "scale-110"
                            : "group-hover:scale-110"
                        }`}
                      />
                      <span className="font-medium">My Bookings</span>
                    </div>
                    {(location.pathname === ROUTES.GUEST.MY_BOOKINGS ||
                      location.pathname.startsWith(
                        ROUTES.GUEST.MY_BOOKINGS
                      )) && (
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
                        to={isHost ? ROUTES.HOST.PROFILE : ROUTES.GUEST.PROFILE}
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
                            <div className="relative">
                              <MessageSquare className="w-5 h-5 group-hover/item:scale-110 transition-transform" />
                              {unreadMessagesCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                  {unreadMessagesCount > 9
                                    ? "9+"
                                    : unreadMessagesCount}
                                </span>
                              )}
                            </div>
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
                            <div className="relative">
                              <MessageSquare className="w-5 h-5 group-hover/item:scale-110 transition-transform" />
                              {unreadMessagesCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                  {unreadMessagesCount > 9
                                    ? "9+"
                                    : unreadMessagesCount}
                                </span>
                              )}
                            </div>
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

          {/* Mobile Menu - Show Host Sidebar for hosts, Streamlined Menu for guests */}
          {isHost ? (
            <HostMobileMenuDrawer
              mobileMenuOpen={mobileMenuOpen}
              userData={userData}
              user={user}
              setMobileMenuOpen={setMobileMenuOpen}
              unreadNotificationsCount={unreadNotificationsCount}
              unreadMessagesCount={unreadMessagesCount}
              handleLogout={handleLogout}
            />
          ) : (
            <StreamlinedMobileMenu
              mobileMenuOpen={mobileMenuOpen}
              userData={userData}
              user={user}
              setMobileMenuOpen={setMobileMenuOpen}
              unreadNotificationsCount={unreadNotificationsCount}
              handleLogout={handleLogout}
            />
          )}
        </nav>
      </>
    );
  }

  // ========== GUEST TAB NAVIGATION (for guest users on home page only) ==========
  if (isGuest && user && location.pathname === ROUTES.GUEST.HOME) {
    return (
      <GuestTabNavigation
        user={user}
        userData={userData}
        handleLogout={handleLogout}
        unreadMessagesCount={unreadMessagesCount}
      />
    );
  }

  // ========== SIMPLE NAVBAR (for profile, messages, notifications, and my-bookings pages, or guest non-home pages) ==========
  if (
    (user &&
      (location.pathname.includes("/profile") ||
        location.pathname.includes("/messages") ||
        location.pathname.includes("/notifications") ||
        location.pathname.includes("/my-bookings") ||
        location.pathname.includes("/favorites"))) ||
    forceSimpleNavBar
  ) {
    return isHost ? (
      <HostSimpleNavBar
        user={user}
        userData={userData}
        handleLogout={handleLogout}
        unreadMessagesCount={unreadMessagesCount}
      />
    ) : (
      <GuestSimpleNavBar
        user={user}
        userData={userData}
        handleLogout={handleLogout}
        unreadMessagesCount={unreadMessagesCount}
      />
    );
  }

  // ========== CLASSIC LAYOUT (default, for all user types) ==========
  return (
    <>
      <style>{animatedBorderStyle}</style>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isHost && isScrolled ? "py-3" : "py-3 lg:py-4"
        } ${getNavbarBg()}`}
      >
        <div
          className={`mx-auto transition-all duration-300 ${
            isHost && isScrolled
              ? "max-w-7xl px-3 sm:px-4"
              : "max-w-7xl px-4 sm:px-6 lg:px-8"
          }`}
        >
          {/* Card Wrapper for Host - Mobile and Desktop when scrolled */}
          <div
            className={`transition-all duration-300 ${
              isHost && isScrolled
                ? "bg-slate-900/70 backdrop-blur-[20px] shadow-2xl border border-white/20 rounded-2xl px-4 sm:px-6 py-3"
                : ""
            }`}
          >
            <div
              className={`flex items-center justify-between h-14 lg:h-20 gap-x-4 lg:gap-x-12 ${
                isHost && isScrolled ? "lg:h-16" : ""
              }`}
            >
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
                    unreadNotificationsCount={unreadNotificationsCount}
                    unreadNotifications={unreadNotifications}
                    unreadMessagesCount={unreadMessagesCount}
                  />
                ) : isHost ? (
                  <HostUserActions
                    notificationDropdownOpen={notificationDropdownOpen}
                    setNotificationDropdownOpen={setNotificationDropdownOpen}
                    profileDropdownOpen={profileDropdownOpen}
                    setProfileDropdownOpen={setProfileDropdownOpen}
                    userData={userData}
                    handleLogout={handleLogout}
                    unreadNotificationsCount={unreadNotificationsCount}
                    unreadNotifications={unreadNotifications}
                    unreadMessagesCount={unreadMessagesCount}
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
        </div>

        {/* Mobile Menu - Show Host Sidebar for hosts, MobileMenu for guests */}
        {userData?.role === "host" ? (
          <HostMobileMenuDrawer
            mobileMenuOpen={mobileMenuOpen}
            userData={userData}
            user={user}
            setMobileMenuOpen={setMobileMenuOpen}
            unreadNotificationsCount={unreadNotificationsCount}
            unreadMessagesCount={unreadMessagesCount}
            handleLogout={handleLogout}
          />
        ) : (
          mobileMenuOpen && (
            <MobileMenu
              user={user}
              userData={userData}
              isMobileSearchOpen={isMobileSearchOpen}
              setMobileSearchOpen={setMobileSearchOpen}
              setMobileMenuOpen={setMobileMenuOpen}
              handleLogout={handleLogout}
              openSignIn={openSignIn}
              selectSignUpRole={selectSignUpRole}
            />
          )
        )}
      </nav>
    </>
  );
}
