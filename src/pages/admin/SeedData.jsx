import { useState } from "react";
import { Trash2 } from "lucide-react";
import { addSampleListings } from "../../utils/addSampleListings";
import { deleteSampleListings } from "../../utils/deleteSampleListings";
import { toast } from "react-toastify";

export default function SeedData() {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState(null);

  const handleSeedData = async () => {
    setLoading(true);
    try {
      const response = await addSampleListings();
      setResult(response);

      if (response.success) {
        toast.success(
          `Successfully added ${response.successCount} sample listings!`
        );
      } else {
        toast.error("Error adding sample listings");
      }
    } catch (error) {
      toast.error("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteData = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete all sample listings? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const response = await deleteSampleListings();
      setResult(response);

      if (response.success) {
        toast.success(
          `Successfully deleted ${response.successCount} sample listings!`
        );
      } else {
        toast.error("Error deleting sample listings");
      }
    } catch (error) {
      toast.error("Error: " + error.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Seed Database</h1>

        <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
          <p className="text-slate-300 mb-6">
            Manage sample listings in your Firestore database:
          </p>

          <ul className="list-disc list-inside mb-8 text-slate-300 space-y-2">
            <li>10 Stays listings (apartments, villas, cabins, etc.)</li>
            <li>10 Experiences listings (tours, classes, adventures, etc.)</li>
            <li>10 Services listings (cleaning, repairs, fitness, etc.)</li>
          </ul>

          <div className="bg-blue-900/30 border border-blue-700 rounded p-4 mb-8">
            <p className="text-blue-300 text-sm">
              <strong>Note:</strong> All listings are created with:
              <br />
              • Host ID: <code className="bg-slate-900 px-2 py-1 rounded">WMdkYEhTTrYUsHw9XpeH3xw1T9s2</code>
              <br />
              • isDraft: <code className="bg-slate-900 px-2 py-1 rounded">false</code>
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSeedData}
              disabled={loading || deleting}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                loading || deleting
                  ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {loading ? "Adding Listings..." : "Add Sample Listings"}
            </button>

            <button
              onClick={handleDeleteData}
              disabled={deleting || loading}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                deleting || loading
                  ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                  : "bg-red-600 text-white hover:bg-red-700"
              }`}
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? "Deleting..." : "Delete All Listings"}
            </button>
          </div>

          {result && (
            <div className="mt-8 p-4 rounded-lg bg-slate-700/50 border border-slate-600">
              <h3 className="font-bold mb-3 text-green-400">Results:</h3>
              {result.success ? (
                <div className="text-green-300 space-y-2">
                  <p>✅ Successfully added: {result.successCount} listings</p>
                  {result.errorCount > 0 && (
                    <p className="text-yellow-400">
                      ⚠️ Errors occurred: {result.errorCount}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-red-300">
                  ❌ Error: {result.error}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 text-slate-400 text-sm">
          <p>
            To access this page, use the URL: <code className="bg-slate-800 px-2 py-1 rounded">/admin/seed-data</code>
          </p>
        </div>
      </div>
    </div>
  );
}
