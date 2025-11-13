import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  UserX,
  Trash2,
  RotateCcw,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Mail,
  Calendar,
  DollarSign,
  Home,
  Bell,
  Activity,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  getAllUsers,
  deactivateUser,
  reactivateUser,
  deleteUser,
} from "../../utils/userManagementUtils";
import { verifyAdminPassword } from "../../utils/authVerification";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all"); // "all", "guest", "host"
  const [filterStatus, setFilterStatus] = useState("all"); // "all", "active", "deactivated"
  const [actionLoading, setActionLoading] = useState(null); // userId when action in progress
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    deactivatedUsers: 0,
    guests: 0,
    hosts: 0,
  });

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users when search or filters change
  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterRole, filterStatus, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await getAllUsers("admin");
      setUsers(usersData);
      calculateStats(usersData);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (usersData) => {
    const totalUsers = usersData.length;
    const activeUsers = usersData.filter(
      (u) => u.status !== "deactivated"
    ).length;
    const deactivatedUsers = usersData.filter(
      (u) => u.status === "deactivated"
    ).length;
    const guests = usersData.filter((u) => u.role === "guest").length;
    const hosts = usersData.filter((u) => u.role === "host").length;

    setStats({
      totalUsers,
      activeUsers,
      deactivatedUsers,
      guests,
      hosts,
    });
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (filterRole !== "all") {
      filtered = filtered.filter((user) => user.role === filterRole);
    }

    // Status filter
    if (filterStatus !== "all") {
      if (filterStatus === "active") {
        filtered = filtered.filter((user) => user.status !== "deactivated");
      } else {
        filtered = filtered.filter((user) => user.status === "deactivated");
      }
    }

    setFilteredUsers(filtered);
  };

  const handleDeactivate = async (userId, userName) => {
    setConfirmAction({
      type: "deactivate",
      userId,
      userName,
      message: `Are you sure you want to deactivate ${userName}'s account? Their listings will be hidden but data will be preserved.`,
    });
    setAdminPassword("");
    setShowPassword(false);
    setShowPasswordModal(true);
  };

  const handleReactivate = async (userId, userName) => {
    // Reactivation doesn't require password verification
    setConfirmAction({
      type: "reactivate",
      userId,
      userName,
      message: `Are you sure you want to reactivate ${userName}'s account? Their listings will become visible again.`,
    });
    setShowConfirmModal(true);
  };

  const handleDelete = async (userId, userName) => {
    setConfirmAction({
      type: "delete",
      userId,
      userName,
      message: `⚠️ DANGER: This will permanently delete ${userName}'s account and ALL related data (bookings, listings, wallet, notifications, messages). This action CANNOT be undone!`,
    });
    setAdminPassword("");
    setShowPassword(false);
    setShowPasswordModal(true);
  };

  const handlePasswordVerification = async () => {
    if (!adminPassword.trim()) {
      toast.error("Please enter your password");
      return;
    }

    setVerifyingPassword(true);

    try {
      const result = await verifyAdminPassword(adminPassword);

      if (result.success) {
        // Password verified, close password modal and show confirmation modal
        setShowPasswordModal(false);
        setShowConfirmModal(true);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error verifying password:", error);
      toast.error("Failed to verify password");
    } finally {
      setVerifyingPassword(false);
    }
  };

  const handleCancelPasswordModal = () => {
    setShowPasswordModal(false);
    setAdminPassword("");
    setShowPassword(false);
    setConfirmAction(null);
  };

  const executeAction = async () => {
    if (!confirmAction) return;

    const { type, userId, userName } = confirmAction;
    setActionLoading(userId);
    setShowConfirmModal(false);

    try {
      let result;

      if (type === "deactivate") {
        result = await deactivateUser(userId);
      } else if (type === "reactivate") {
        result = await reactivateUser(userId);
      } else if (type === "delete") {
        result = await deleteUser(userId);
      }

      if (result.success) {
        toast.success(result.message);
        await loadUsers(); // Reload users
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error(`Error executing ${type}:`, error);
      toast.error(`Failed to ${type} user`);
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
      setAdminPassword("");
      setShowPassword(false);
    }
  };

  const getUserStatusBadge = (user) => {
    if (user.status === "deactivated") {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Deactivated
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        Active
      </span>
    );
  };

  const getRoleBadge = (role) => {
    if (role === "host") {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-400">
          Host
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
        Guest
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
        <p className="text-slate-400">
          Manage user accounts, deactivate or delete users
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-400 text-sm font-medium">Total Users</p>
            <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-400 text-sm font-medium">Active</p>
            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{stats.activeUsers}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-400 text-sm font-medium">Deactivated</p>
            <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">
            {stats.deactivatedUsers}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-400 text-sm font-medium">Guests</p>
            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{stats.guests}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-400 text-sm font-medium">Hosts</p>
            <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
              <Home className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{stats.hosts}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Roles</option>
              <option value="guest">Guests</option>
              <option value="host">Hosts</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="deactivated">Deactivated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50 border-b border-slate-800">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">
                  User
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">
                  Role
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">
                  Status
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">
                  Statistics
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">
                  Joined
                </th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    {/* User Info */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.fullName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                            {user.fullName
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase() || "U"}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-white">
                            {user.fullName || "Unknown User"}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-4 px-6">{getRoleBadge(user.role)}</td>

                    {/* Status */}
                    <td className="py-4 px-6">{getUserStatusBadge(user)}</td>

                    {/* Statistics */}
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1 text-xs text-slate-400">
                        {user.role === "host" && (
                          <div className="flex items-center gap-1">
                            <Home className="w-3 h-3" />
                            {user.stats.listings} listing(s)
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {user.stats.bookings} booking(s)
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />₱
                          {user.stats.walletBalance.toFixed(2)}
                        </div>
                      </div>
                    </td>

                    {/* Joined Date */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1 text-sm text-slate-400">
                        <Calendar className="w-4 h-4" />
                        {user.createdAt?.toDate
                          ? new Date(
                              user.createdAt.toDate()
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "Unknown"}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        {user.status === "deactivated" ? (
                          <button
                            onClick={() =>
                              handleReactivate(user.id, user.fullName)
                            }
                            disabled={actionLoading === user.id}
                            className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Reactivate User"
                          >
                            {actionLoading === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RotateCcw className="w-4 h-4" />
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleDeactivate(user.id, user.fullName)
                            }
                            disabled={actionLoading === user.id}
                            className="p-2 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Deactivate User"
                          >
                            {actionLoading === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <UserX className="w-4 h-4" />
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(user.id, user.fullName)}
                          disabled={actionLoading === user.id}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete User"
                        >
                          {actionLoading === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center">
                    <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No users found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Verification Modal */}
      {showPasswordModal && confirmAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <Lock className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Verify Identity</h3>
            </div>

            <p className="text-slate-300 mb-4">
              Please enter your admin password to confirm this action.
            </p>

            {/* Password Input */}
            <div className="relative mb-6">
              <input
                type={showPassword ? "text" : "password"}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handlePasswordVerification();
                  }
                }}
                placeholder="Enter your password"
                className="w-full px-4 py-3 pr-12 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                autoFocus
                disabled={verifyingPassword}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                disabled={verifyingPassword}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelPasswordModal}
                disabled={verifyingPassword}
                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordVerification}
                disabled={verifyingPassword || !adminPassword.trim()}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {verifyingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  confirmAction.type === "delete"
                    ? "bg-red-500/20"
                    : "bg-amber-500/20"
                }`}
              >
                <AlertTriangle
                  className={`w-6 h-6 ${
                    confirmAction.type === "delete"
                      ? "text-red-400"
                      : "text-amber-400"
                  }`}
                />
              </div>
              <h3 className="text-xl font-bold text-white">Confirm Action</h3>
            </div>

            <p className="text-slate-300 mb-6">{confirmAction.message}</p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmAction(null);
                }}
                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                className={`flex-1 px-4 py-2.5 rounded-lg transition-colors text-white ${
                  confirmAction.type === "delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {confirmAction.type === "delete"
                  ? "Delete Permanently"
                  : confirmAction.type === "deactivate"
                  ? "Deactivate"
                  : "Reactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
