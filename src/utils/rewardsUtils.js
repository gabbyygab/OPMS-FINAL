import { db } from "../firebase/firebase";
import {
  doc,
  updateDoc,
  addDoc,
  setDoc,
  collection,
  getDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

// Points configuration
export const POINTS_CONFIG = {
  // Points earned per booking completion
  POINTS_PER_BOOKING: 10,

  // 1 point = 1 peso
  POINT_TO_PESO_RATIO: 1,

  // Listing limits per category
  INITIAL_LISTING_LIMIT_PER_CATEGORY: 3,
  LISTING_LIMIT_INCREASE: 5,
  LISTING_LIMIT_UPGRADE_COST: 500, // pesos
};

// Initialize rewards document for a user
export const initializeUserRewards = async (userId, role) => {
  try {
    const rewardsData = {
      userId,
      role,
      totalPoints: 0,
      availablePoints: 0,
      redeemedPoints: 0,
      pointsHistory: [],
      listingLimits: {
        stays: POINTS_CONFIG.INITIAL_LISTING_LIMIT_PER_CATEGORY,
        experiences: POINTS_CONFIG.INITIAL_LISTING_LIMIT_PER_CATEGORY,
        services: POINTS_CONFIG.INITIAL_LISTING_LIMIT_PER_CATEGORY,
      },
      listingUpgrades: {
        stays: 0,
        experiences: 0,
        services: 0,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // First check if rewards document already exists
    const existingRewards = await getUserRewards(userId);
    if (existingRewards) {
      console.log("Rewards already exist for user:", userId);
      return existingRewards;
    }

    // Create new rewards document with auto-generated ID
    const docRef = await addDoc(collection(db, "rewards"), rewardsData);

    return {
      id: docRef.id,
      ...rewardsData,
    };
  } catch (error) {
    console.error("Error initializing user rewards:", error);
    throw error;
  }
};

// Get user's rewards data
export const getUserRewards = async (userId) => {
  try {
    const rewardsRef = collection(db, "rewards");
    const q = query(rewardsRef, where("userId", "==", userId));
    const rewardsSnap = await getDocs(q);

    if (!rewardsSnap.empty) {
      const doc = rewardsSnap.docs[0];
      return { id: doc.id, ...doc.data() };
    }

    return null;
  } catch (error) {
    console.error("Error fetching user rewards:", error);
    throw error;
  }
};

// Add points to user (on booking completion)
export const addPointsToUser = async (
  userId,
  bookingId,
  listingType,
  pointsAmount = POINTS_CONFIG.POINTS_PER_BOOKING
) => {
  try {
    const userRewards = await getUserRewards(userId);

    if (!userRewards) {
      console.error("User rewards not found for userId:", userId);
      return false;
    }

    // Create new history entry with timestamp
    const newHistoryEntry = {
      bookingId,
      pointsEarned: pointsAmount,
      listingType,
      source: "booking_completion",
      createdAt: new Date().toISOString(),
    };

    // Get current points history and add new entry
    const pointsHistory = userRewards.pointsHistory || [];
    pointsHistory.push(newHistoryEntry);

    // Use the document ID from userRewards (returned by getUserRewards)
    const rewardDocRef = doc(db, "rewards", userRewards.id);

    await updateDoc(rewardDocRef, {
      totalPoints: (userRewards.totalPoints || 0) + pointsAmount,
      availablePoints: (userRewards.availablePoints || 0) + pointsAmount,
      pointsHistory,
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("Error adding points to user:", error);
    throw error;
  }
};

// Redeem points for listing limit upgrade
export const redeemPointsForListingUpgrade = async (
  userId,
  listingType,
  pointsToRedeem
) => {
  try {
    const userRewards = await getUserRewards(userId);

    if (!userRewards) {
      throw new Error("User rewards not found");
    }

    if (userRewards.availablePoints < pointsToRedeem) {
      throw new Error("Insufficient points to redeem");
    }

    // Update listing limit
    const updatedLimits = {
      ...userRewards.listingLimits,
      [listingType]:
        userRewards.listingLimits[listingType] +
        POINTS_CONFIG.LISTING_LIMIT_INCREASE,
    };

    const updatedUpgrades = {
      ...userRewards.listingUpgrades,
      [listingType]: (userRewards.listingUpgrades[listingType] || 0) + 1,
    };

    const pointsHistory = userRewards.pointsHistory || [];
    pointsHistory.push({
      action: "listing_limit_upgrade",
      listingType,
      pointsRedeemed: pointsToRedeem,
      newLimit: updatedLimits[listingType],
      createdAt: new Date().toISOString(),
    });

    const rewardsRef = doc(db, "rewards", userRewards.id);
    await updateDoc(rewardsRef, {
      availablePoints: userRewards.availablePoints - pointsToRedeem,
      redeemedPoints: (userRewards.redeemedPoints || 0) + pointsToRedeem,
      listingLimits: updatedLimits,
      listingUpgrades: updatedUpgrades,
      pointsHistory,
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
      newLimit: updatedLimits[listingType],
      remainingPoints: userRewards.availablePoints - pointsToRedeem,
    };
  } catch (error) {
    console.error("Error redeeming points for listing upgrade:", error);
    throw error;
  }
};

// Get current listing count for a user in a category
export const getUserListingCount = async (userId, listingType) => {
  try {
    const q = query(
      collection(db, "listings"),
      where("hostId", "==", userId),
      where("type", "==", listingType)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error("Error getting user listing count:", error);
    throw error;
  }
};

// Check if user can create a new listing
export const canCreateListing = async (
  userId,
  listingType,
  userRole = "host"
) => {
  try {
    let userRewards = await getUserRewards(userId);

    // If rewards don't exist, initialize them (for users who signed up before this feature)
    if (!userRewards) {
      console.warn("Rewards not found for user, initializing...");
      await initializeUserRewards(userId, userRole);
      userRewards = await getUserRewards(userId);
    }

    if (!userRewards) {
      throw new Error("Failed to initialize user rewards");
    }

    const currentCount = await getUserListingCount(userId, listingType);
    const limit =
      userRewards.listingLimits[listingType] ||
      POINTS_CONFIG.INITIAL_LISTING_LIMIT_PER_CATEGORY;

    return {
      canCreate: currentCount < limit,
      currentCount,
      limit,
      remainingSlots: Math.max(0, limit - currentCount),
    };
  } catch (error) {
    console.error("Error checking listing creation eligibility:", error);
    throw error;
  }
};

// Calculate cost to upgrade listing limit (considering point redemption)
export const calculateUpgradeCost = (pointsToUse = 0) => {
  const baseCost = POINTS_CONFIG.LISTING_LIMIT_UPGRADE_COST;
  const pointsValue = pointsToUse * POINTS_CONFIG.POINT_TO_PESO_RATIO;
  const pesoNeeded = Math.max(0, baseCost - pointsValue);

  return {
    baseCost,
    pointsToUse,
    pointsValue,
    pesoNeeded,
    totalCost: baseCost,
  };
};

// Format points display
export const formatPoints = (points) => {
  return Math.floor(points).toLocaleString();
};
