import { db } from "../firebase/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const SAMPLE_HOST_ID = "WMdkYEhTTrYUsHw9XpeH3xw1T9s2";

// Function to delete all sample listings created by the sample host
export const deleteSampleListings = async () => {
  try {
    console.log("Starting to delete sample listings...");

    const listingsRef = collection(db, "listings");
    const querySnapshot = await getDocs(listingsRef);

    let successCount = 0;
    let errorCount = 0;

    for (const docSnapshot of querySnapshot.docs) {
      try {
        const listing = docSnapshot.data();
        // Only delete listings created by the sample host ID
        if (listing.hostId === SAMPLE_HOST_ID) {
          await deleteDoc(doc(db, "listings", docSnapshot.id));
          console.log(`Deleted listing:`, docSnapshot.id);
          successCount++;
        }
      } catch (error) {
        console.error(`Error deleting listing:`, error);
        errorCount++;
      }
    }

    console.log(
      `✅ Successfully deleted ${successCount} listings. Errors: ${errorCount}`
    );
    return { success: true, successCount, errorCount };
  } catch (error) {
    console.error("Error deleting sample listings:", error);
    return { success: false, error: error.message };
  }
};
