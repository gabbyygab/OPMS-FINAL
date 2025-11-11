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
      name: "Payment Methods",
      icon: CreditCard,
      path: "/admin/payments",
      description: "Payment Processing",
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
                className="w-10 h-10 object-contain"
              />
              <div>
                <h1 className="text-lg font-bold text-white">BookingNest</h1>
                <p className="text-xs text-slate-400">Admin Panel</p>
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
        className={`hidden lg:block fixed left-0 top-16 bottom-0 bg-slate-900 border-r border-slate-800 transition-all duration-300 ${
          isSidebarOpen ? "w-72" : "w-20"
        } overflow-hidden`}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto py-6 px-3">
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      active
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0`} />
                    {isSidebarOpen && (
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${
                            active ? "text-white" : "text-slate-300"
                          }`}
                        >
                          {item.name}
                        </p>
                        <p
                          className={`text-xs truncate ${
                            active ? "text-indigo-200" : "text-slate-500"
                          }`}
                        >
                          {item.description}
                        </p>
                      </div>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="border-t border-slate-800 p-4">
            <button
              onClick={handleLogout}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all w-full ${
                !isSidebarOpen && "justify-center"
              }`}
            >
              <LogOut className="w-5 h-5" />
              {isSidebarOpen && (
                <span className="text-sm font-medium">Logout</span>
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
          <aside className="lg:hidden fixed left-0 top-16 bottom-0 w-72 bg-slate-900 border-r border-slate-800 z-50 overflow-y-auto">
            <div className="flex flex-col h-full">
              <div className="flex-1 py-6 px-3">
                <nav className="space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          active
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.name}</p>
                          <p
                            className={`text-xs ${
                              active ? "text-indigo-200" : "text-slate-500"
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

              <div className="border-t border-slate-800 p-4">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all w-full"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Main Content Area */}
      <main
        className={`pt-16 transition-all duration-300 ${
          isSidebarOpen ? "lg:pl-72" : "lg:pl-20"
        }`}
      >
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
