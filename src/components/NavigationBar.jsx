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
  ClipboardList,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase/firebase";
import { signOut } from "firebase/auth";
import { ROUTES } from "../constants/routes";

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
const GuestSearchBar = ({ onSearch }) => {
  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = () => {
    onSearch({ location, checkIn, checkOut, guests });
    setIsOpen(false);
  };

  const handleClear = () => {
    setLocation("");
    setCheckIn("");
    setCheckOut("");
    setGuests(1);
    onSearch({ location: "", checkIn: "", checkOut: "", guests: 1 });
    setIsOpen(false);
  };

  const hasFilters = location || checkIn || checkOut || guests > 1;

  return (
    <div className="flex-1 flex justify-center relative px-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hidden lg:flex items-center bg-white text-gray-700 hover:shadow-lg rounded-full px-3 py-2 shadow-md w-full max-w-xl justify-between transition-all duration-300 cursor-pointer"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <div className="flex items-center gap-1 text-xs text-gray-600 truncate">
            <span className="truncate">{location || "Where"}</span>
            <span className="text-gray-400">•</span>
            <span className="truncate">
              {checkIn && checkOut
                ? `${new Date(checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                : checkIn
                ? new Date(checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : "When"
              }
            </span>
            <span className="text-gray-400">•</span>
            <span className="flex-shrink-0">{guests > 1 ? `${guests} Guests` : "Who"}</span>
          </div>
        </div>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="absolute top-full mt-3 bg-white rounded-2xl shadow-2xl p-6 w-full sm:w-96 z-50 left-1/2 transform -translate-x-1/2 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Search listings</h3>

          {/* Location */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">WHERE?</label>
            <input
              type="text"
              placeholder="Search location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Check-in Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">CHECK-IN</label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Check-out Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">CHECK-OUT</label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Number of Guests */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">GUESTS</label>
            <div className="flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2.5">
              <button
                onClick={() => setGuests(Math.max(1, guests - 1))}
                className="text-indigo-600 hover:text-indigo-700 font-bold text-lg"
              >
                −
              </button>
              <span className="text-gray-900 font-semibold">{guests}</span>
              <button
                onClick={() => setGuests(guests + 1)}
                className="text-indigo-600 hover:text-indigo-700 font-bold text-lg"
              >
                +
              </button>
            </div>
          </div>

          {/* Search Buttons */}
          <div className="flex gap-2">
            {hasFilters && (
              <button
                onClick={handleClear}
                className="flex-1 px-3 py-2.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
              >
                Clear
              </button>
            )}
            <button
              onClick={handleSearch}
              className={`${hasFilters ? 'flex-1' : 'w-full'} px-3 py-2.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold flex items-center justify-center gap-2`}
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Host Navigation Links Component
const HostNavLinks = () => {
  const navItems = [
    { to: ROUTES.HOST.DASHBOARD, icon: BarChart3, label: "Dashboard" },
    { to: ROUTES.HOST.STAYS, icon: Home, label: "My Stays" },
    { to: ROUTES.HOST.EXPERIENCES, icon: Calendar, label: "My Experiences" },
    { to: ROUTES.HOST.SERVICES, icon: Briefcase, label: "My Services" },
    { to: ROUTES.HOST.MY_BOOKINGS, icon: ClipboardList, label: "My Bookings" },
  ];

  return (
    <div className="hidden lg:flex items-center gap-6 xl:gap-8">
      {navItems.map(({ to, icon: IconComponent, label }) => {
        const Icon = IconComponent;
        return (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-2 text-slate-200 hover:text-white transition-colors"
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{label}</span>
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
    <div className="relative">
      <button
        type="button"
        onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
        className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-700 transition"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-slate-200 hover:text-white transition" />
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
        <div className="absolute right-0 mt-2 w-56 bg-slate-800 text-slate-200 rounded-xl shadow-lg border border-slate-700 overflow-hidden z-50">
          <Link
            to={ROUTES.GUEST.PROFILE}
            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-700 transition-colors"
            onClick={() => setProfileDropdownOpen(false)}
          >
            <User className="w-4 h-4" /> My Profile
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
  </>
);

// Host User Actions Component
const HostUserActions = ({
  profileDropdownOpen,
  setProfileDropdownOpen,
  userData,
  handleLogout,
}) => (
  <div className="hidden lg:flex items-center gap-4">
    <Link
      to={ROUTES.HOST.MESSAGES}
      className="flex items-center gap-2 text-slate-200 hover:text-white transition-colors"
    >
      <MessageSquare className="w-5 h-5" />
    </Link>

    <Link
      to={ROUTES.HOST.NOTIFICATIONS}
      className="relative text-slate-200 hover:text-white transition-colors flex items-center"
    >
      <Bell className="w-5 h-5" />
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
        3
      </span>
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
        <div className="absolute right-0 mt-2 w-56 bg-slate-800 text-slate-200 rounded-lg shadow-lg border border-slate-700 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-slate-700">
            <p className="text-sm font-semibold text-white">
              {userData?.fullName || "Host"}
            </p>
            <p className="text-xs text-slate-400">{userData?.email || ""}</p>
          </div>

          <Link
            to={ROUTES.HOST.PROFILE}
            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-700 transition-colors"
            onClick={() => setProfileDropdownOpen(false)}
          >
            <User className="w-4 h-4" /> My Profile
          </Link>

          <div className="border-t border-slate-700">
            <Link
              to={ROUTES.HOST.DASHBOARD}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-700 transition-colors"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <BarChart3 className="w-4 h-4" /> Dashboard
            </Link>

            <Link
              to={ROUTES.HOST.STAYS}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-700 transition-colors"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <Home className="w-4 h-4" /> My Stays
            </Link>

            <Link
              to={ROUTES.HOST.EXPERIENCES}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-700 transition-colors"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <Calendar className="w-4 h-4" /> My Experiences
            </Link>

            <Link
              to={ROUTES.HOST.SERVICES}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-700 transition-colors"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <Briefcase className="w-4 h-4" /> My Services
            </Link>

            <Link
              to={ROUTES.HOST.MY_BOOKINGS}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-700 transition-colors"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <ClipboardList className="w-4 h-4" /> My Bookings
            </Link>
          </div>

          <div className="border-t border-slate-700">
            <Link
              to={ROUTES.HOST.SETTINGS}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-700 transition-colors"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <Settings className="w-4 h-4" /> Account Settings
            </Link>

            <Link
              to={ROUTES.HOST.E_WALLET}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-700 transition-colors"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <Wallet className="w-4 h-4" /> E-wallet
            </Link>

            <Link
              to={ROUTES.HOST.CALENDAR}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-700 transition-colors"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <Calendar className="w-4 h-4" /> Calendar
            </Link>

            <Link
              to={ROUTES.HOST.DRAFTS}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-700 transition-colors"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <FileEdit className="w-4 h-4" /> Drafts
            </Link>
          </div>

          <div className="border-t border-slate-700">
            <button
              className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-700 transition-colors text-left"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
);

// Mobile Menu Component
const MobileMenu = ({
  user,
  userData,
  isMobileSearchOpen,
  setMobileSearchOpen,
  setMobileMenuOpen,
  handleLogout,
  onSearch,
}) => {
  const [mobileLocation, setMobileLocation] = useState("");
  const [mobileCheckIn, setMobileCheckIn] = useState("");
  const [mobileCheckOut, setMobileCheckOut] = useState("");
  const [mobileGuests, setMobileGuests] = useState(1);
  const navigate = useNavigate();

  const isGuest = userData?.role === "guest";
  const isHost = userData?.role === "host";

  const handleMobileSearch = () => {
    onSearch({ location: mobileLocation, checkIn: mobileCheckIn, checkOut: mobileCheckOut, guests: mobileGuests });
    setMobileSearchOpen(false);
    setMobileMenuOpen(false);
  };

  const handleMobileClear = () => {
    setMobileLocation("");
    setMobileCheckIn("");
    setMobileCheckOut("");
    setMobileGuests(1);
    onSearch({ location: "", checkIn: "", checkOut: "", guests: 1 });
    setMobileSearchOpen(false);
    setMobileMenuOpen(false);
  };

  const hasMobileFilters = mobileLocation || mobileCheckIn || mobileCheckOut || mobileGuests > 1;

  return (
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
        ) : isGuest ? (
          <>
            <button
              className="flex items-center gap-2 hover:text-white transition font-medium text-slate-200"
              onClick={() => setMobileSearchOpen(!isMobileSearchOpen)}
            >
              <Search className="w-5 h-5" /> Search Listings
            </button>
            {isMobileSearchOpen && (
              <div className="flex flex-col gap-3 bg-slate-800 border border-slate-700 text-gray-200 rounded-2xl p-4">
                <h4 className="text-sm font-semibold text-white mb-2">Search Listings</h4>

                {/* Where */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">WHERE?</label>
                  <input
                    type="text"
                    placeholder="Enter location"
                    value={mobileLocation}
                    onChange={(e) => setMobileLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Check-in */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">CHECK-IN</label>
                  <input
                    type="date"
                    value={mobileCheckIn}
                    onChange={(e) => setMobileCheckIn(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Check-out */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">CHECK-OUT</label>
                  <input
                    type="date"
                    value={mobileCheckOut}
                    onChange={(e) => setMobileCheckOut(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Guests */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">GUESTS</label>
                  <div className="flex items-center justify-between bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2">
                    <button
                      onClick={() => setMobileGuests(Math.max(1, mobileGuests - 1))}
                      className="text-indigo-400 hover:text-indigo-300 font-bold text-lg"
                    >
                      −
                    </button>
                    <span className="text-slate-200 font-semibold">{mobileGuests}</span>
                    <button
                      onClick={() => setMobileGuests(mobileGuests + 1)}
                      className="text-indigo-400 hover:text-indigo-300 font-bold text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 mt-4">
                  {hasMobileFilters && (
                    <button
                      onClick={handleMobileClear}
                      className="flex-1 px-3 py-2.5 text-sm border border-slate-600 text-slate-300 hover:bg-slate-700 rounded-lg transition font-semibold"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={handleMobileSearch}
                    className={`${hasMobileFilters ? 'flex-1' : 'w-full'} px-3 py-2.5 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition font-semibold flex items-center justify-center gap-2`}
                  >
                    <Search className="w-4 h-4" />
                    Search
                  </button>
                </div>
              </div>
            )}

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

            <Link
              to={ROUTES.GUEST.MESSAGES}
              className="flex items-center gap-2 hover:text-white transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              <MessageSquare className="w-5 h-5" /> Messages
            </Link>

            <Link
              to={ROUTES.GUEST.E_WALLET}
              className="flex items-center gap-2 hover:text-white transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              <LucideWallet className="w-5 h-5" /> E-Wallet
            </Link>
          </>
        ) : isHost ? (
          <>
            <Link
              to={ROUTES.HOST.DASHBOARD}
              className="flex items-center gap-2 hover:text-white transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              <BarChart3 className="w-5 h-5" /> Dashboard
            </Link>

            <Link
              to={ROUTES.HOST.STAYS}
              className="flex items-center gap-2 hover:text-white transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Home className="w-5 h-5" /> My Stays
            </Link>

            <Link
              to={ROUTES.HOST.EXPERIENCES}
              className="flex items-center gap-2 hover:text-white transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Calendar className="w-5 h-5" /> My Experiences
            </Link>

            <Link
              to={ROUTES.HOST.SERVICES}
              className="flex items-center gap-2 hover:text-white transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Briefcase className="w-5 h-5" /> My Services
            </Link>

            <Link
              to={ROUTES.HOST.MY_BOOKINGS}
              className="flex items-center gap-2 hover:text-white transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              <ClipboardList className="w-5 h-5" /> My Bookings
            </Link>

            <Link
              to={ROUTES.HOST.MESSAGES}
              className="flex items-center gap-2 hover:text-white transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              <MessageSquare className="w-5 h-5" /> Messages
            </Link>

            <Link
              to={ROUTES.HOST.NOTIFICATIONS}
              className="flex items-center gap-2 hover:text-white transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Bell className="w-5 h-5" /> Notifications
            </Link>

            <Link
              to={ROUTES.HOST.PROFILE}
              className="flex items-center gap-2 hover:text-white transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              <User className="w-5 h-5" /> My Profile
            </Link>

            <Link
              to={ROUTES.HOST.E_WALLET}
              className="flex items-center gap-2 hover:text-white transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              <LucideWallet className="w-5 h-5" /> E-Wallet
            </Link>
          </>
        ) : null}

        <div className="border-t border-slate-700 pt-3">
          <button
            className="flex items-center gap-2 hover:text-white transition text-left"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

// ========== MAIN COMPONENT ==========

export default function NavigationBar({ userData, user }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] =
    useState(false);
  const [searchFilters, setSearchFilters] = useState({
    location: "",
    checkIn: "",
    checkOut: "",
    guests: 1,
  });

  const navigate = useNavigate();

  const handleSearch = (filters) => {
    setSearchFilters(filters);
    // Scroll to listings or navigate with filter params
    const params = new URLSearchParams();
    if (filters.location) params.append("location", filters.location);
    if (filters.checkIn) params.append("checkIn", filters.checkIn);
    if (filters.checkOut) params.append("checkOut", filters.checkOut);
    if (filters.guests) params.append("guests", filters.guests);

    navigate(`/guest?${params.toString()}`);
  };

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

  const getNavbarBg = () => {
    if (user) {
      return isScrolled
        ? "bg-slate-900/80 backdrop-blur-lg shadow-lg rounded-2xl border border-slate-700/50 mx-2 sm:mx-4 top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4"
        : "bg-slate-900 shadow-md";
    }
    return isScrolled
      ? "bg-slate-900/80 backdrop-blur-lg shadow-lg rounded-2xl border border-slate-700/50 mx-2 sm:mx-4 top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4"
      : "bg-transparent";
  };

  const isGuest = userData?.role === "guest";
  const isHost = userData?.role === "host";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "py-2 lg:py-3 px-2 sm:px-4 lg:px-8" : "py-3 lg:py-4 px-4 sm:px-6 lg:px-8"
      } ${getNavbarBg()}`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-14 lg:h-20 gap-x-4 lg:gap-x-12">
          {/* Logo */}
          <Logo />

          {/* Center: Guest Search or Host Nav */}
          {user ? (
            isGuest ? (
              <GuestSearchBar onSearch={handleSearch} />
            ) : isHost ? (
              <HostNavLinks />
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
          onSearch={handleSearch}
        />
      )}
    </nav>
  );
}
