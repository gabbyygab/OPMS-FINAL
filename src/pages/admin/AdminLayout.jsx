import { useState } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/firebase";
import { toast } from "react-toastify";
import { ROUTES } from "../../constants/routes";
import {
  LayoutDashboard,
  DollarSign,
  FileText,
  CreditCard,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  User,
} from "lucide-react";

export default function AdminLayout({ user, userData }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Navigate immediately to prevent showing protected route
      navigate(ROUTES.HOME, { replace: true });
      await signOut(auth);
      navigate("/");
    } catch (error) {
      toast.error("Error logging out: " + error.message);
    }
  };

  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/admin/dashboard",
      description: "Analytics & Overview",
    },
    {
      name: "Service Fees",
      icon: DollarSign,
      path: "/admin/service-fees",
      description: "Host Fees Management",
    },
    {
      name: "Reports",
      icon: FileText,
      path: "/admin/reports",
      description: "Generate Reports",
    },
    {
      name: "Payments",
      icon: CreditCard,
      path: "/admin/payments",
      description: "Revenue & Transactions",
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-800 shadow-lg">
        <div className="flex items-center justify-between px-6 h-16">
          {/* Left Side - Logo & Menu Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden lg:block text-slate-400 hover:text-white transition-colors"
            >
              {isSidebarOpen ? (
                <ChevronLeft className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="lg:hidden text-slate-400 hover:text-white transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3">
              <img
                src="/bookingNestLogoFInal.png"
                alt="BookingNest Logo"
                className=" relative top-1 left-2 w-[80px] m-0  h-auto lg:w-20 lg:h-20 lg:relative lg:top-1.5 lg:left-2 object-contain"
              />
              <div>
                <h1 className="text-lg font-bold text-white relative right-2">
                  BookingNest
                </h1>
                <p className="text-xs text-slate-400 relative right-2">
                  Admin Panel
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - User Profile */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {userData?.photoURL ? (
                <img
                  src={userData.photoURL}
                  alt="Admin"
                  className="w-9 h-9 rounded-full object-cover border-2 border-indigo-600"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                  A
                </div>
              )}
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-white">
                  {userData?.fullName || "Admin"}
                </p>
                <p className="text-xs text-slate-400">Administrator</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar - Desktop */}
      <aside
        className={`hidden lg:block fixed left-0 top-16 bottom-0 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-slate-800 transition-all duration-300 ${
          isSidebarOpen ? "w-80" : "w-24"
        } overflow-hidden`}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto py-8 px-4">
            <nav className="space-y-3">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-200 group relative overflow-hidden ${
                      active
                        ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/40"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                    }`}
                  >
                    {active && (
                      <div className="absolute inset-0 bg-indigo-600/20 blur-xl -z-10"></div>
                    )}
                    <Icon
                      className={`w-6 h-6 flex-shrink-0 ${
                        active ? "text-white" : "group-hover:text-indigo-400"
                      } transition-colors`}
                    />
                    {isSidebarOpen && (
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-semibold truncate ${
                            active
                              ? "text-white"
                              : "text-slate-300 group-hover:text-white"
                          }`}
                        >
                          {item.name}
                        </p>
                        <p
                          className={`text-xs truncate mt-1 ${
                            active
                              ? "text-indigo-100"
                              : "text-slate-500 group-hover:text-slate-400"
                          }`}
                        >
                          {item.description}
                        </p>
                      </div>
                    )}
                    {!isSidebarOpen && (
                      <div className="absolute left-24 top-1/2 -translate-y-1/2 bg-slate-950 text-white text-xs font-medium px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {item.name}
                      </div>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="border-t border-slate-800 p-4 bg-slate-900/50">
            <button
              onClick={handleLogout}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-slate-400 hover:bg-red-500/15 hover:text-red-400 transition-all w-full group relative overflow-hidden ${
                !isSidebarOpen && "justify-center"
              }`}
            >
              <LogOut className="w-6 h-6 flex-shrink-0 transition-colors" />
              {isSidebarOpen && (
                <span className="text-sm font-semibold">Logout</span>
              )}
              {!isSidebarOpen && (
                <div className="absolute left-24 top-1/2 -translate-y-1/2 bg-slate-950 text-white text-xs font-medium px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  Logout
                </div>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {isMobileSidebarOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40 top-16"
            onClick={() => setIsMobileSidebarOpen(false)}
          ></div>
          <aside className="lg:hidden fixed left-0 top-16 bottom-0 w-72 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-slate-800 z-50 overflow-y-auto">
            <div className="flex flex-col h-full">
              <div className="flex-1 py-8 px-4">
                <nav className="space-y-3">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all relative overflow-hidden ${
                          active
                            ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/40"
                            : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                        }`}
                      >
                        {active && (
                          <div className="absolute inset-0 bg-indigo-600/20 blur-xl -z-10"></div>
                        )}
                        <Icon
                          className={`w-6 h-6 flex-shrink-0 ${
                            active
                              ? "text-white"
                              : "group-hover:text-indigo-400"
                          } transition-colors`}
                        />
                        <div className="flex-1">
                          <p
                            className={`text-sm font-semibold ${
                              active ? "text-white" : "text-slate-300"
                            }`}
                          >
                            {item.name}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              active ? "text-indigo-100" : "text-slate-500"
                            }`}
                          >
                            {item.description}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t border-slate-800 p-4 bg-slate-900/50">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-4 px-5 py-4 rounded-2xl text-slate-400 hover:bg-red-500/15 hover:text-red-400 transition-all w-full"
                >
                  <LogOut className="w-6 h-6 flex-shrink-0" />
                  <span className="text-sm font-semibold">Logout</span>
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Main Content Area */}
      <main
        className={`pt-16 transition-all duration-300 ${
          isSidebarOpen ? "lg:pl-80" : "lg:pl-24"
        }`}
      >
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
