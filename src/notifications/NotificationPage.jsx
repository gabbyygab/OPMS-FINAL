import { useState } from "react";
import {
  Bell,
  Check,
  X,
  MessageCircle,
  Calendar,
  Star,
  Home,
  DollarSign,
  AlertCircle,
  Trash2,
  Archive,
  ChevronLeft,
} from "lucide-react";
import NavBar2 from "../components/NavigationBarForPandM";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "booking",
      title: "New Booking",
      message: "Sarah Johnson has booked your Beachfront Villa for Oct 15-18",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
      timestamp: "2 hours ago",
      read: false,
      actionUrl: "/host/bookings/1",
    },
    {
      id: 2,
      type: "review",
      title: "New Review",
      message:
        "Emma Wilson left a 5-star review on your Mountain Cabin property",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
      timestamp: "5 hours ago",
      read: false,
      actionUrl: "/host/reviews/2",
    },
    {
      id: 3,
      type: "message",
      title: "New Message",
      message: "Michael Chen: Is late check-in available for this weekend?",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100",
      timestamp: "8 hours ago",
      read: true,
      actionUrl: "/host/messages/3",
    },
    {
      id: 4,
      type: "payment",
      title: "Payment Received",
      message: "You've received ₱4,500 from your recent bookings",
      avatar: null,
      timestamp: "1 day ago",
      read: true,
      actionUrl: "/host/earnings",
    },
    {
      id: 5,
      type: "booking",
      title: "Booking Confirmed",
      message: "John Doe has confirmed the booking for Downtown Loft",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
      timestamp: "1 day ago",
      read: true,
      actionUrl: "/host/bookings/5",
    },
    {
      id: 6,
      type: "alert",
      title: "Price Update Required",
      message: "Your Beachfront Villa pricing hasn't been updated in 30 days",
      avatar: null,
      timestamp: "2 days ago",
      read: true,
      actionUrl: "/host/stays/1",
    },
    {
      id: 7,
      type: "review",
      title: "Reservation Cancelled",
      message: "Guest cancelled booking for Cozy Mountain Cabin (Oct 20-22)",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
      timestamp: "2 days ago",
      read: true,
      actionUrl: "/host/bookings",
    },
    {
      id: 8,
      type: "message",
      title: "Message from Support",
      message: "Our team is here to help. Have questions about your listings?",
      avatar: null,
      timestamp: "3 days ago",
      read: true,
      actionUrl: "/help",
    },
  ]);

  const [filterType, setFilterType] = useState("all");
  const [selectedNotifications, setSelectedNotifications] = useState([]);

  const filteredNotifications =
    filterType === "all"
      ? notifications
      : notifications.filter((notif) => notif.type === filterType);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id) => {
    setNotifications(
      notifications.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((notif) => ({ ...notif, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter((notif) => notif.id !== id));
    setSelectedNotifications(selectedNotifications.filter((id_) => id_ !== id));
  };

  const deleteSelected = () => {
    setNotifications(
      notifications.filter((notif) => !selectedNotifications.includes(notif.id))
    );
    setSelectedNotifications([]);
  };

  const toggleSelect = (id) => {
    setSelectedNotifications((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map((n) => n.id));
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "booking":
        return <Calendar className="w-5 h-5 text-indigo-400" />;
      case "review":
        return <Star className="w-5 h-5 text-yellow-400" />;
      case "message":
        return <MessageCircle className="w-5 h-5 text-blue-400" />;
      case "payment":
        return <DollarSign className="w-5 h-5 text-green-400" />;
      case "alert":
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <>
      <NavBar2 />
      <div className="min-h-screen bg-slate-900 pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Notifications</h1>
          <p className="text-slate-400">
            You have {unreadCount} unread notification
            {unreadCount !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Actions Bar */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <input
              type="checkbox"
              checked={
                filteredNotifications.length > 0 &&
                selectedNotifications.length === filteredNotifications.length
              }
              onChange={toggleSelectAll}
              className="w-5 h-5 rounded cursor-pointer"
            />
            <span className="text-sm text-slate-300">
              {selectedNotifications.length} selected
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition whitespace-nowrap"
              >
                Mark all as read
              </button>
            )}

            {selectedNotifications.length > 0 && (
              <button
                onClick={deleteSelected}
                className="text-sm px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition flex items-center gap-2 whitespace-nowrap"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {["all", "booking", "review", "message", "payment", "alert"].map(
            (type) => (
              <button
                key={type}
                onClick={() => {
                  setFilterType(type);
                  setSelectedNotifications([]);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                  filterType === type
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            )
          )}
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-12 text-center">
            <Bell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No notifications
            </h3>
            <p className="text-slate-400">
              {filterType === "all"
                ? "You're all caught up!"
                : `No ${filterType} notifications`}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-slate-800 rounded-lg border border-slate-700 p-4 transition hover:border-slate-600 ${
                  !notification.read ? "border-indigo-500 bg-slate-800/50" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification.id)}
                    onChange={() => toggleSelect(notification.id)}
                    className="w-5 h-5 rounded cursor-pointer mt-1 flex-shrink-0"
                  />

                  {/* Avatar or Icon */}
                  <div className="flex-shrink-0">
                    {notification.avatar ? (
                      <img
                        src={notification.avatar}
                        alt="User"
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-white">
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-2"></span>
                      )}
                    </div>
                    <p className="text-slate-300 text-sm mb-2">
                      {notification.message}
                    </p>
                    <span className="text-xs text-slate-500">
                      {notification.timestamp}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-2 rounded-lg hover:bg-slate-700 transition text-slate-400 hover:text-slate-200"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-2 rounded-lg hover:bg-red-600/20 transition text-slate-400 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </>
  );
}
