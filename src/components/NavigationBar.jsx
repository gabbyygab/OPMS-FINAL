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
const HostNavLinks = () => {
  const navItems = [
    { to: ROUTES.HOST.DASHBOARD, icon: BarChart3, label: "Dashboard" },
    { to: ROUTES.HOST.STAYS, icon: Home, label: "My Stays" },
    { to: ROUTES.HOST.EXPERIENCES, icon: Calendar, label: "My Experiences" },
    { to: ROUTES.HOST.SERVICES, icon: Briefcase, label: "My Services" },
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
      className="relative text-slate-200 hover:text-white transition-colors"
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
        {!profileDropdownOpen ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronUp className="w-4 h-4" />
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
  isMobileSearchOpen,
  setMobileSearchOpen,
  setMobileMenuOpen,
  handleLogout,
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

// ========== MAIN COMPONENT ==========

export default function NavigationBar({ userData, user }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);

  const navigate = useNavigate();

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
    if (user) return "bg-slate-900 shadow-md";
    return isScrolled
      ? "bg-slate-900/95 backdrop-blur-md shadow-lg"
      : "bg-transparent";
  };

  const isGuest = userData?.role === "guest";
  const isHost = userData?.role === "host";

  return (
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
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <MobileMenu
          user={user}
          isMobileSearchOpen={isMobileSearchOpen}
          setMobileSearchOpen={setMobileSearchOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          handleLogout={handleLogout}
        />
      )}
    </nav>
  );
}
