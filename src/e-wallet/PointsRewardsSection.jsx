import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { db } from "../firebase/firebase";
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import {
  POINTS_CONFIG,
  getUserRewards,
  redeemPointsForListingUpgrade,
  formatPoints,
  calculateUpgradeCost,
} from "../utils/rewardsUtils";
import { Award, Zap, TrendingUp, Gift } from "lucide-react";

export default function PointsRewardsSection({ userData, userRole = "guest" }) {
  const [rewards, setRewards] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("stays");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch rewards data
  useEffect(() => {
    const fetchRewards = async () => {
      try {
        if (!userData?.id) return;
        let rewardsData = await getUserRewards(userData.id);

        // If rewards don't exist, initialize them (for users who signed up before this feature)
        if (!rewardsData) {
          console.warn("Rewards not found for user, initializing...");
          const initRewards = await import("../utils/rewardsUtils");
          await initRewards.initializeUserRewards(userData.id, userRole);
          rewardsData = await getUserRewards(userData.id);
        }

        setRewards(rewardsData);
      } catch (error) {
        console.error("Error fetching rewards:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, [userData?.id, userRole]);

  const handleUpgradeListingLimit = async () => {
    try {
      setIsProcessing(true);

      const upgradeCost = calculateUpgradeCost(pointsToUse);
      const currentWalletBalance = await getWalletBalance();

      // Check if user has enough wallet balance for remaining cost
      if (currentWalletBalance < upgradeCost.pesoNeeded) {
        toast.error(
          `Insufficient balance. Need ₱${upgradeCost.pesoNeeded} more in wallet.`
        );
        setIsProcessing(false);
        return;
      }

      // Redeem points
      const result = await redeemPointsForListingUpgrade(
        userData.id,
        selectedCategory,
        pointsToUse
      );

      if (result.success) {
        // Deduct wallet balance for remaining cost
        if (upgradeCost.pesoNeeded > 0) {
          await deductWalletBalance(upgradeCost.pesoNeeded, selectedCategory);
        }

        // Refresh rewards data
        const updatedRewards = await getUserRewards(userData.id);
        setRewards(updatedRewards);

        toast.success(
          `✨ ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} listing limit increased to ${result.newLimit}!`
        );

        setShowUpgradeModal(false);
        setPointsToUse(0);
      }
    } catch (error) {
      console.error("Error upgrading listing limit:", error);
      toast.error(error.message || "Failed to upgrade listing limit");
    } finally {
      setIsProcessing(false);
    }
  };

  const getWalletBalance = async () => {
    try {
      const walletRef = doc(db, "wallets", userData.id);
      const walletSnap = await getDoc(walletRef);
      if (walletSnap.exists()) {
        return walletSnap.data().balance || 0;
      }
      return 0;
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      return 0;
    }
  };

  const deductWalletBalance = async (amount, listingType) => {
    try {
      const walletRef = doc(db, "wallets", userData.id);
      const walletSnap = await getDoc(walletRef);

      if (!walletSnap.exists()) {
        throw new Error("Wallet not found");
      }

      const currentBalance = walletSnap.data().balance || 0;
      const newBalance = currentBalance - amount;

      // Update wallet balance
      await updateDoc(walletRef, {
        balance: newBalance,
        updated_at: serverTimestamp(),
      });

      // Create transaction for listing limit upgrade (deduction from user)
      await addDoc(collection(db, "transactions"), {
        amount: -amount,
        created_at: serverTimestamp(),
        type: "listing_limit_upgrade",
        status: "completed",
        user_id: userData.id,
        wallet_id: walletSnap.id,
        description: `Listing limit upgrade for ${listingType} (+${POINTS_CONFIG.LISTING_LIMIT_INCREASE} listings)`,
        listingType: listingType,
      });

      // Create platform revenue transaction for admin tracking
      await addDoc(collection(db, "platformRevenue"), {
        amount: amount,
        created_at: serverTimestamp(),
        type: "listing_limit_upgrade",
        listingType: listingType,
        userId: userData.id,
      });

      console.log(`✓ Wallet deducted ₱${amount} for ${listingType} listing upgrade`);
    } catch (error) {
      console.error("Error deducting wallet balance:", error);
      throw error;
    }
  };

  const currentLimit = rewards?.listingLimits?.[selectedCategory] || 3;
  const upgradeCost = calculateUpgradeCost(pointsToUse);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-40 bg-slate-700/50 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Points Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Points Card */}
        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl p-6 border border-purple-500/30">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-2">
                Total Points Earned
              </p>
              <h3 className="text-3xl font-bold text-white">
                {formatPoints(rewards?.totalPoints || 0)}
              </h3>
            </div>
            <div className="w-12 h-12 bg-purple-600/30 rounded-full flex items-center justify-center">
              <Award className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <p className="text-slate-400 text-xs">
            Earned from completed bookings
          </p>
        </div>

        {/* Available Points Card */}
        <div className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 rounded-2xl p-6 border border-cyan-500/30">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-2">
                Available Points
              </p>
              <h3 className="text-3xl font-bold text-white">
                {formatPoints(rewards?.availablePoints || 0)}
              </h3>
            </div>
            <div className="w-12 h-12 bg-cyan-600/30 rounded-full flex items-center justify-center">
              <Zap className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <p className="text-slate-400 text-xs">Ready to redeem</p>
        </div>

        {/* Redeemed Points Card */}
        <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 rounded-2xl p-6 border border-orange-500/30">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-2">
                Points Redeemed
              </p>
              <h3 className="text-3xl font-bold text-white">
                {formatPoints(rewards?.redeemedPoints || 0)}
              </h3>
            </div>
            <div className="w-12 h-12 bg-orange-600/30 rounded-full flex items-center justify-center">
              <Gift className="w-6 h-6 text-orange-400" />
            </div>
          </div>
          <p className="text-slate-400 text-xs">Used for upgrades</p>
        </div>
      </div>

      {/* Listing Limit Management - Hosts Only */}
      {userRole === "host" && (
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          <h3 className="text-xl font-bold text-white">
            Listing Limits & Upgrades
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {["stays", "experiences", "services"].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedCategory === category
                  ? "border-indigo-500 bg-indigo-600/20"
                  : "border-slate-600 bg-slate-700/50 hover:border-slate-500"
              }`}
            >
              <p className="text-sm text-slate-400 mb-2 capitalize">{category}</p>
              <p className="text-2xl font-bold text-white">
                {rewards?.listingLimits?.[category] || 3}
              </p>
              <p className="text-xs text-slate-500 mt-1">listings allowed</p>
            </button>
          ))}
        </div>

        {/* Upgrade Information */}
        <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-indigo-600/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-indigo-400 text-sm font-bold">i</span>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2">How Upgrades Work</h4>
              <ul className="text-slate-400 text-sm space-y-1">
                <li>
                  • Initial limit: {POINTS_CONFIG.INITIAL_LISTING_LIMIT_PER_CATEGORY}{" "}
                  {selectedCategory} per category
                </li>
                <li>
                  • Each upgrade adds: +{POINTS_CONFIG.LISTING_LIMIT_INCREASE} more
                  listings
                </li>
                <li>
                  • Cost: ₱{POINTS_CONFIG.LISTING_LIMIT_UPGRADE_COST} or equivalent
                  points
                </li>
                <li>
                  • Points Value: 1 point = ₱{POINTS_CONFIG.POINT_TO_PESO_RATIO}
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Current Selection Details */}
        <div className="bg-slate-700/30 rounded-xl p-4 mb-6">
          <h4 className="text-white font-semibold mb-3 capitalize">
            {selectedCategory} Listing Details
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-sm">Current Limit</p>
              <p className="text-2xl font-bold text-white">
                {rewards?.listingLimits?.[selectedCategory] || 3}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Times Upgraded</p>
              <p className="text-2xl font-bold text-white">
                {rewards?.listingUpgrades?.[selectedCategory] || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Upgrade Button */}
        <button
          onClick={() => setShowUpgradeModal(true)}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <TrendingUp className="w-4 h-4" />
          Upgrade Listing Limit
        </button>

      {/* Upgrade Modal - Hosts Only */}
      {showUpgradeModal && userRole === "host" && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl shadow-lg p-8 border border-slate-700 max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-2">
              Upgrade Listing Limit
            </h3>
            <p className="text-slate-400 text-sm mb-6 capitalize">
              Increase your {selectedCategory} listing limit
            </p>

            {/* Current and New Limit */}
            <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Current Limit</p>
                  <p className="text-2xl font-bold text-white">
                    {currentLimit}
                  </p>
                </div>
                <div className="text-slate-500">→</div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">New Limit</p>
                  <p className="text-2xl font-bold text-indigo-400">
                    {currentLimit + POINTS_CONFIG.LISTING_LIMIT_INCREASE}
                  </p>
                </div>
              </div>
            </div>

            {/* Points Slider */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-200 mb-3">
                Points to Use
              </label>
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="range"
                  min="0"
                  max={rewards?.availablePoints || 0}
                  value={pointsToUse}
                  onChange={(e) => setPointsToUse(Number(e.target.value))}
                  className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <input
                  type="number"
                  min="0"
                  max={rewards?.availablePoints || 0}
                  value={pointsToUse}
                  onChange={(e) =>
                    setPointsToUse(
                      Math.min(
                        Number(e.target.value),
                        rewards?.availablePoints || 0
                      )
                    )
                  }
                  className="w-16 px-2 py-1 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <p className="text-slate-400 text-xs">
                Available: {formatPoints(rewards?.availablePoints || 0)} points
              </p>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-slate-700/30 rounded-xl p-4 mb-6">
              <h4 className="text-white font-semibold mb-3 text-sm">
                Cost Breakdown
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Base Cost</span>
                  <span className="text-white font-semibold">
                    ₱{upgradeCost.baseCost}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Points Used</span>
                  <span className="text-indigo-400 font-semibold">
                    -{formatPoints(pointsToUse)} pts
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Points Value</span>
                  <span className="text-indigo-400 font-semibold">
                    -₱{upgradeCost.pointsValue}
                  </span>
                </div>
                <div className="border-t border-slate-600 pt-2 flex justify-between text-sm">
                  <span className="text-white font-semibold">
                    Wallet Payment Required
                  </span>
                  <span className="text-white font-bold">
                    ₱{upgradeCost.pesoNeeded}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  setPointsToUse(0);
                }}
                disabled={isProcessing}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpgradeListingLimit}
                disabled={isProcessing || upgradeCost.pesoNeeded < 0}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <span className="animate-spin">⚙</span>
                    Processing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    Upgrade Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      )}

      {/* Guest Info - When Not Host */}
      {userRole === "guest" && (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
          <div className="text-center">
            <p className="text-slate-400 text-sm">
              Points are tracked for your bookings and can be deducted if a refund is approved. Keep track of your points in the overview cards above!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
