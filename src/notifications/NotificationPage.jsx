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
      <NavigationBar
        user={user}
        userData={userData}
        forceSimpleNavBar={true}
      />
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-[96px] pb-16 space-y-10">
          <section className="bg-slate-900/80 border border-slate-800/80 rounded-3xl shadow-2xl backdrop-blur-xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.35rem] text-indigo-300/70 mb-2">
                  Notification Center
                </p>
                <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                  Notifications
                </h1>
                <p className="text-sm text-slate-400 mt-2">
                  You have{" "}
                  <span className="font-semibold text-indigo-300">
                    {unreadCount}
                  </span>{" "}
                  unread notification{unreadCount !== 1 ? "s" : ""}. Stay up to
                  date with booking changes, guest messages, and platform
                  updates.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl border border-indigo-500/40 text-indigo-200 hover:bg-indigo-500/10 transition"
                  >
                    <Check className="w-4 h-4" />
                    Mark all as read
                  </button>
                )}

                {selectedNotifications.length > 0 && (
                  <button
                    onClick={deleteSelected}
                    className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl bg-red-600/80 text-white hover:bg-red-600 transition shadow-lg shadow-red-600/25"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete selected
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-300 bg-slate-900/60 border border-slate-700/60 rounded-2xl px-4 py-3 w-full sm:w-auto">
                  <input
                    type="checkbox"
                    checked={
                      filteredNotifications.length > 0 &&
                      selectedNotifications.length ===
                        filteredNotifications.length
                    }
                    onChange={toggleSelectAll}
                    className="w-5 h-5 rounded cursor-pointer accent-indigo-500"
                  />
                  <span>
                    {selectedNotifications.length} selected
                  </span>
                </label>

                <div className="flex flex-wrap gap-2 -mx-1 sm:ml-auto overflow-x-auto">
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
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap border ${
                        filterType === type
                          ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/25"
                          : "bg-slate-900/60 text-slate-300 border-slate-700 hover:bg-slate-800"
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
              </div>
            </div>
          </section>

          <section className="bg-slate-900/60 border border-slate-800/80 rounded-3xl shadow-xl overflow-hidden">
            {filteredNotifications.length === 0 ? (
              <div className="px-8 py-16 text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800/70">
                  <Bell className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">
                  No notifications
                </h3>
                <p className="text-slate-400 max-w-sm mx-auto">
                  {filterType === "all"
                    ? "You're all caught up! We'll let you know when something new arrives."
                    : `No ${filterType.replace("_", " ")} notifications right now.`}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {filteredNotifications.map((notification) => (
                  <article
                    key={notification.id}
                    className={`px-5 sm:px-6 py-5 transition bg-gradient-to-r from-slate-900/40 to-transparent hover:from-slate-900/60 ${
                      !notification.isRead
                        ? "bg-slate-900/70"
                        : ""
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={() => toggleSelect(notification.id)}
                        className="w-5 h-5 mt-1 sm:mt-2 rounded cursor-pointer accent-indigo-500"
                      />

                      <div className="flex items-start gap-4 sm:gap-5 flex-1">
                        <div className="flex-shrink-0">
                          {notification.avatar ? (
                            <img
                              src={notification.avatar}
                              alt="User"
                              className="w-12 h-12 rounded-full object-cover border border-slate-700/60"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700/60">
                              {getNotificationIcon(notification.type)}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            if (typeof notification.onClick === "function") {
                              notification.onClick();
                            } else if (notification.actionUrl) {
                              navigate(notification.actionUrl);
                            }
                            markAsRead(notification.id);
                          }}
                          className="flex-1 text-left"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h3 className="text-base sm:text-lg font-semibold text-white">
                              {notification.title}
                            </h3>
                            <span className="text-xs text-slate-500">
                              {notification.timestamp}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                            {notification.message}
                          </p>
                          {!notification.isRead && (
                            <span className="inline-flex items-center gap-2 mt-3 text-xs font-medium uppercase tracking-wide text-indigo-300">
                              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                              New
                            </span>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {!notification.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/60 text-slate-300 hover:text-white hover:border-indigo-500 transition"
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
                          className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/60 text-slate-400 hover:text-red-300 hover:border-red-400 transition"
                          title="Delete notification"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
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
