import { useState, useEffect } from "react";
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
import { db } from "../firebase/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import NavigationBar from "../components/NavigationBar";
import LoadingSpinner from "../loading/Loading";
import ReviewModal from "../components/ReviewModal";

export default function NotificationsPage() {
  const { user, userData } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] =
    useState(null);

  // Fetch notifications from Firestore
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user || !userData) return;

      try {
        setLoading(true);
        const notificationsRef = collection(db, "notifications");

        // Fetch notifications where userId matches current user (new format)
        // userId field stores who should receive the notification
        const q = query(
          notificationsRef,
          where("userId", "==", userData.id),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);

        // Also fetch old notifications with host_id/guest_id for backwards compatibility
        let oldNotificationsSnapshot = null;
        try {
          const oldWhereField =
            userData.role === "host" ? "host_id" : "guest_id";
          const qOld = query(
            notificationsRef,
            where(oldWhereField, "==", userData.id),
            orderBy("createdAt", "desc")
          );
          oldNotificationsSnapshot = await getDocs(qOld);
        } catch (error) {
          // If query fails, it means index doesn't exist or field doesn't exist
          console.log("Old notification format not available");
        }

        // Combine both results, avoiding duplicates
        const allDocs = new Map();
        querySnapshot.docs.forEach((doc) => {
          allDocs.set(doc.id, doc);
        });

        if (oldNotificationsSnapshot) {
          oldNotificationsSnapshot.docs.forEach((doc) => {
            if (!allDocs.has(doc.id)) {
              allDocs.set(doc.id, doc);
            }
          });
        }

        // Convert map back to array and sort by date
        const sortedDocs = Array.from(allDocs.values()).sort((a, b) => {
          const aTime = a.data().createdAt?.toDate?.() || new Date(0);
          const bTime = b.data().createdAt?.toDate?.() || new Date(0);
          return bTime - aTime;
        });

        const notificationsData = await Promise.all(
          sortedDocs.map(async (docSnapshot) => {
            const data = docSnapshot.data();
            let relatedUserData = null;

            // Handle both new (guestId) and old (guest_id) field formats
            const relatedUserId = data.guestId || data.guest_id;

            if (relatedUserId) {
              try {
                const userRef = doc(db, "users", relatedUserId);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                  relatedUserData = userSnap.data();
                }
              } catch (error) {
                console.error("Error fetching related user data:", error);
              }
            }

            // Handle both new and old field names for booking/listing IDs
            const bookingId = data.bookingId || data.booking_id;
            const listingId = data.listingId || data.listing_id;
            const guestAvatar = data.guestAvatar || data.guest_avatar;

            const notificationPayload = {
              id: docSnapshot.id,
              ...data,
              avatar:
                guestAvatar ||
                relatedUserData?.photoURL ||
                "/public/profile-placeholder.png",
              timestamp:
                data.createdAt && typeof data.createdAt.toDate === "function"
                  ? new Date(data.createdAt.toDate()).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )
                  : "Recently",
            };

            // Special handler for completed bookings to open review modal
            if (data.type === "booking_completed") {
              notificationPayload.onClick = () =>
                handleOpenReviewModal(bookingId);
            } else {
              notificationPayload.actionUrl =
                userData.role === "host"
                  ? data.type === "booking"
                    ? `/host/my-bookings`
                    : `/host/messages/${relatedUserId}`
                  : data.type === "booking_confirmed" ||
                    data.type === "booking_rejected"
                  ? `/guest/my-bookings`
                  : `/guest/messages/${relatedUserId}`;
            }

            return notificationPayload;
          })
        );

        setNotifications(notificationsData);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user, userData]);

  const filteredNotifications =
    filterType === "all"
      ? notifications
      : notifications.filter((notif) => notif.type === filterType);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = async (id) => {
    try {
      const notificationRef = doc(db, "notifications", id);
      await updateDoc(notificationRef, { isRead: true });
      setNotifications(
        notifications.map((notif) =>
          notif.id === id ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifs = notifications.filter((n) => !n.isRead);
      await Promise.all(
        unreadNotifs.map((notif) =>
          updateDoc(doc(db, "notifications", notif.id), { isRead: true })
        )
      );
      setNotifications(
        notifications.map((notif) => ({ ...notif, isRead: true }))
      );
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const notificationRef = doc(db, "notifications", id);
      await deleteDoc(notificationRef);
      setNotifications(notifications.filter((notif) => notif.id !== id));
      setSelectedNotifications(
        selectedNotifications.filter((id_) => id_ !== id)
      );
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const deleteSelected = async () => {
    try {
      await Promise.all(
        selectedNotifications.map((id) =>
          deleteDoc(doc(db, "notifications", id))
        )
      );
      setNotifications(
        notifications.filter(
          (notif) => !selectedNotifications.includes(notif.id)
        )
      );
      setSelectedNotifications([]);
    } catch (error) {
      console.error("Error deleting selected notifications:", error);
    }
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
      case "booking_confirmed":
        return <Calendar className="w-5 h-5 text-indigo-400" />;
      case "booking_rejected":
        return <X className="w-5 h-5 text-red-400" />;
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

  const handleOpenReviewModal = async (bookingId) => {
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      const bookingSnap = await getDoc(bookingRef);

      if (bookingSnap.exists()) {
        const bookingData = bookingSnap.data();

        // Also fetch listing data to pass to the modal
        const listingRef = doc(db, "listings", bookingData.listing_id);
        const listingSnap = await getDoc(listingRef);

        if (listingSnap.exists()) {
          bookingData.listing = listingSnap.data();
        }

        setSelectedBookingForReview({ id: bookingSnap.id, ...bookingData });
        setShowReviewModal(true);
      } else {
        toast.error("Booking details not found.");
      }
    } catch (error) {
      console.error("Error fetching booking details:", error);
      toast.error("Failed to open review modal.");
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <NavigationBar user={user} userData={userData} />
      <div className="min-h-screen bg-slate-900 pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Notifications
            </h1>
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
            {[
              "all",
              "booking",
              "booking_confirmed",
              "booking_rejected",
              "review",
              "message",
              "payment",
              "alert",
            ].map((type) => (
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
                {type === "booking_confirmed"
                  ? "Confirmed"
                  : type === "booking_rejected"
                  ? "Rejected"
                  : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
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
                    !notification.isRead
                      ? "border-indigo-500 bg-slate-800/50"
                      : ""
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

                    {/* Content - Clickable area */}
                    <div
                      onClick={() => {
                        if (typeof notification.onClick === "function") {
                          notification.onClick();
                        } else if (notification.actionUrl) {
                          navigate(notification.actionUrl);
                        }
                        markAsRead(notification.id);
                      }}
                      className="flex-1 min-w-0 cursor-pointer hover:opacity-80 transition"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-white">
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
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
                      {!notification.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="p-2 rounded-lg hover:bg-slate-700 transition text-slate-400 hover:text-slate-200"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
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
      {showReviewModal && (
        <ReviewModal
          showModal={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          booking={selectedBookingForReview}
          user={user}
        />
      )}
    </>
  );
}
