import {
  collection,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

/**
 * Deactivate a user account
 * - Sets user status to "deactivated"
 * - Hides all their listings (status = "inactive")
 * - Does NOT delete any data
 * @param {string} userId - The user ID to deactivate
 * @returns {Promise<Object>} Result object with success status and message
 */
export async function deactivateUser(userId) {
  try {
    // Validate userId
    if (!userId) {
      throw new Error("User ID is required");
    }

    // Get user document
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error("User not found");
    }

    const userData = userSnap.data();

    // Prevent deactivating admin accounts
    if (userData.role === "admin") {
      throw new Error("Cannot deactivate admin accounts");
    }

    // Update user status to deactivated
    await updateDoc(userRef, {
      status: "deactivated",
      deactivatedAt: new Date(),
    });

    // If user is a host, hide all their listings
    let listingsCount = 0;
    if (userData.role === "host") {
      const listingsRef = collection(db, "listings");
      const q = query(listingsRef, where("hostId", "==", userId));
      const listingsSnapshot = await getDocs(q);
      listingsCount = listingsSnapshot.size;

      const batch = writeBatch(db);

      listingsSnapshot.docs.forEach((docSnap) => {
        batch.update(docSnap.ref, {
          status: "inactive",
          deactivatedAt: new Date(),
        });
      });

      await batch.commit();
    }

    return {
      success: true,
      message: `User account deactivated successfully. ${
        userData.role === "host"
          ? `${listingsCount} listing(s) hidden.`
          : ""
      }`,
    };
  } catch (error) {
    console.error("Error deactivating user:", error);
    return {
      success: false,
      message: error.message || "Failed to deactivate user",
    };
  }
}

/**
 * Reactivate a deactivated user account
 * - Sets user status to "active"
 * - Reactivates all their listings (status = "active")
 * @param {string} userId - The user ID to reactivate
 * @returns {Promise<Object>} Result object with success status and message
 */
export async function reactivateUser(userId) {
  try {
    // Validate userId
    if (!userId) {
      throw new Error("User ID is required");
    }

    // Get user document
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error("User not found");
    }

    const userData = userSnap.data();

    // Update user status to active
    await updateDoc(userRef, {
      status: "active",
      reactivatedAt: new Date(),
    });

    // If user is a host, reactivate all their listings
    if (userData.role === "host") {
      const listingsRef = collection(db, "listings");
      const q = query(listingsRef, where("hostId", "==", userId));
      const listingsSnapshot = await getDocs(q);

      const batch = writeBatch(db);

      listingsSnapshot.docs.forEach((docSnap) => {
        batch.update(docSnap.ref, {
          status: "active",
          reactivatedAt: new Date(),
        });
      });

      await batch.commit();
    }

    return {
      success: true,
      message: `User account reactivated successfully.`,
    };
  } catch (error) {
    console.error("Error reactivating user:", error);
    return {
      success: false,
      message: error.message || "Failed to reactivate user",
    };
  }
}

/**
 * Delete a user account and all their dependent documents
 * - Deletes user document from users collection
 * - Deletes all bookings (as host or guest)
 * - Deletes all listings
 * - Deletes wallet
 * - Deletes notifications
 * - Deletes rewards
 * - Deletes conversations and messages
 * - Deletes transactions
 * - Does NOT delete from Firebase Auth (admin must do that separately)
 * @param {string} userId - The user ID to delete
 * @returns {Promise<Object>} Result object with success status and message
 */
export async function deleteUser(userId) {
  try {
    // Validate userId
    if (!userId) {
      throw new Error("User ID is required");
    }

    // Get user document
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error("User not found");
    }

    const userData = userSnap.data();

    // Prevent deleting admin accounts
    if (userData.role === "admin") {
      throw new Error("Cannot delete admin accounts");
    }

    let deletionStats = {
      bookings: 0,
      listings: 0,
      notifications: 0,
      transactions: 0,
      conversations: 0,
      messages: 0,
      wallet: 0,
      rewards: 0,
    };

    // Create a batch for deletion
    const batch = writeBatch(db);

    // 1. Delete all bookings where user is guest
    const guestBookingsRef = collection(db, "bookings");
    const guestBookingsQuery = query(
      guestBookingsRef,
      where("guest_id", "==", userId)
    );
    const guestBookingsSnapshot = await getDocs(guestBookingsQuery);
    guestBookingsSnapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
      deletionStats.bookings++;
    });

    // 2. Delete all bookings where user is host
    const hostBookingsQuery = query(
      guestBookingsRef,
      where("hostId", "==", userId)
    );
    const hostBookingsSnapshot = await getDocs(hostBookingsQuery);
    hostBookingsSnapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
      deletionStats.bookings++;
    });

    // 3. Delete all listings (if host)
    if (userData.role === "host") {
      const listingsRef = collection(db, "listings");
      const listingsQuery = query(listingsRef, where("hostId", "==", userId));
      const listingsSnapshot = await getDocs(listingsQuery);
      listingsSnapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
        deletionStats.listings++;
      });
    }

    // 4. Delete wallet
    const walletsRef = collection(db, "wallets");
    const walletQuery = query(walletsRef, where("user_id", "==", userId));
    const walletSnapshot = await getDocs(walletQuery);
    walletSnapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
      deletionStats.wallet++;
    });

    // 5. Delete notifications
    const notificationsRef = collection(db, "notifications");
    const notificationsQuery = query(
      notificationsRef,
      where("userId", "==", userId)
    );
    const notificationsSnapshot = await getDocs(notificationsQuery);
    notificationsSnapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
      deletionStats.notifications++;
    });

    // 6. Delete rewards
    const rewardsRef = collection(db, "rewards");
    const rewardsQuery = query(rewardsRef, where("userId", "==", userId));
    const rewardsSnapshot = await getDocs(rewardsQuery);
    rewardsSnapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
      deletionStats.rewards++;
    });

    // 7. Delete transactions
    const transactionsRef = collection(db, "transactions");
    const transactionsQuery = query(
      transactionsRef,
      where("user_id", "==", userId)
    );
    const transactionsSnapshot = await getDocs(transactionsQuery);
    transactionsSnapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
      deletionStats.transactions++;
    });

    // Commit the batch
    await batch.commit();

    // 8. Delete conversations (requires separate batches due to Firestore limitations)
    const conversationsRef = collection(db, "conversations");
    const conversationsQuery = query(
      conversationsRef,
      where("participants", "array-contains", userId)
    );
    const conversationsSnapshot = await getDocs(conversationsQuery);

    for (const convDoc of conversationsSnapshot.docs) {
      deletionStats.conversations++;

      // Delete all messages in this conversation
      const messagesRef = collection(db, "messages");
      const messagesQuery = query(
        messagesRef,
        where("conversationId", "==", convDoc.id)
      );
      const messagesSnapshot = await getDocs(messagesQuery);

      const messageBatch = writeBatch(db);
      messagesSnapshot.docs.forEach((msgDoc) => {
        messageBatch.delete(msgDoc.ref);
        deletionStats.messages++;
      });
      await messageBatch.commit();

      // Delete conversation
      await deleteDoc(convDoc.ref);
    }

    // 9. Finally, delete the user document
    await deleteDoc(userRef);

    return {
      success: true,
      message: `User account deleted successfully. Deleted: ${deletionStats.bookings} booking(s), ${deletionStats.listings} listing(s), ${deletionStats.notifications} notification(s), ${deletionStats.conversations} conversation(s), ${deletionStats.messages} message(s), ${deletionStats.transactions} transaction(s), ${deletionStats.wallet} wallet(s), ${deletionStats.rewards} reward record(s).`,
      stats: deletionStats,
    };
  } catch (error) {
    console.error("Error deleting user:", error);
    return {
      success: false,
      message: error.message || "Failed to delete user",
    };
  }
}

/**
 * Get all users with their statistics
 * @param {string} excludeRole - Role to exclude (e.g., "admin")
 * @returns {Promise<Array>} Array of user objects with statistics
 */
export async function getAllUsers(excludeRole = "admin") {
  try {
    const usersRef = collection(db, "users");
    let q;

    if (excludeRole) {
      q = query(usersRef, where("role", "!=", excludeRole));
    } else {
      q = query(usersRef);
    }

    const usersSnapshot = await getDocs(q);

    const users = await Promise.all(
      usersSnapshot.docs.map(async (docSnap) => {
        const userData = docSnap.data();
        const userId = docSnap.id;

        // Get statistics for each user
        const stats = await getUserStatistics(userId, userData.role);

        return {
          id: userId,
          ...userData,
          stats,
        };
      })
    );

    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

/**
 * Get statistics for a specific user
 * @param {string} userId - The user ID
 * @param {string} role - The user's role
 * @returns {Promise<Object>} Statistics object
 */
async function getUserStatistics(userId, role) {
  try {
    const stats = {
      bookings: 0,
      listings: 0,
      walletBalance: 0,
      notifications: 0,
    };

    // Count bookings
    if (role === "guest") {
      const bookingsRef = collection(db, "bookings");
      const bookingsQuery = query(
        bookingsRef,
        where("guest_id", "==", userId)
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);
      stats.bookings = bookingsSnapshot.size;
    } else if (role === "host") {
      // Count bookings as host
      const bookingsRef = collection(db, "bookings");
      const bookingsQuery = query(bookingsRef, where("hostId", "==", userId));
      const bookingsSnapshot = await getDocs(bookingsQuery);
      stats.bookings = bookingsSnapshot.size;

      // Count listings
      const listingsRef = collection(db, "listings");
      const listingsQuery = query(listingsRef, where("hostId", "==", userId));
      const listingsSnapshot = await getDocs(listingsQuery);
      stats.listings = listingsSnapshot.size;
    }

    // Get wallet balance
    const walletsRef = collection(db, "wallets");
    const walletQuery = query(walletsRef, where("user_id", "==", userId));
    const walletSnapshot = await getDocs(walletQuery);
    if (!walletSnapshot.empty) {
      const walletData = walletSnapshot.docs[0].data();
      stats.walletBalance = walletData.balance || 0;
    }

    // Count notifications
    const notificationsRef = collection(db, "notifications");
    const notificationsQuery = query(
      notificationsRef,
      where("userId", "==", userId)
    );
    const notificationsSnapshot = await getDocs(notificationsQuery);
    stats.notifications = notificationsSnapshot.size;

    return stats;
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    return {
      bookings: 0,
      listings: 0,
      walletBalance: 0,
      notifications: 0,
    };
  }
}
