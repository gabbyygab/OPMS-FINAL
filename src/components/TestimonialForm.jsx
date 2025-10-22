import { useState } from "react";
import { Star } from "lucide-react";
import { db } from "../firebase/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

export default function TestimonialForm({ onSubmit }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    comment: "",
    rating: 5,
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRating = (value) => {
    setFormData((prev) => ({
      ...prev,
      rating: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.comment.trim()) {
      setError("Please write a testimonial");
      return;
    }

    if (formData.comment.trim().length < 10) {
      setError("Testimonial must be at least 10 characters long");
      return;
    }

    try {
      setLoading(true);

      const testimonial = {
        comment: formData.comment,
        rating: formData.rating,
        userName: user?.displayName || "Anonymous",
        userPhotoURL: user?.photoURL || "",
        userRole: user?.role || "Guest",
        userId: user?.uid || "anonymous",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "testimonials"), testimonial);

      setFormData({
        comment: "",
        rating: 5,
      });

      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);

      // Trigger parent refresh
      if (onSubmit) {
        onSubmit();
      }
    } catch (err) {
      console.error("Error submitting testimonial:", err);
      setError("Failed to submit testimonial. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Share Your Experience
          </h2>
          <p className="text-slate-300 text-lg">
            Tell us about your BookingNest experience and help other users discover great properties
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-lg">
          {submitted && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
              <p className="text-green-300 font-semibold">
                ✓ Thank you! Your testimonial has been submitted successfully.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-300 font-semibold">{error}</p>
            </div>
          )}

          {!user ? (
            <div className="text-center py-8">
              <p className="text-slate-400 mb-4">
                Please log in to share your testimonial
              </p>
              <a
                href="/signin"
                className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg transition-all"
              >
                Sign In
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Rating Section */}
              <div className="mb-8">
                <label className="block text-white font-semibold mb-4">
                  Rating
                </label>
                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => handleRating(rating)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          rating <= formData.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-slate-600 hover:text-slate-500"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment Section */}
              <div className="mb-8">
                <label htmlFor="comment" className="block text-white font-semibold mb-4">
                  Your Testimonial
                </label>
                <textarea
                  id="comment"
                  name="comment"
                  value={formData.comment}
                  onChange={handleChange}
                  placeholder="Share your experience with BookingNest. What did you love about it?"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 resize-none"
                  rows="6"
                />
                <p className="text-slate-400 text-sm mt-2">
                  {formData.comment.length} characters
                </p>
              </div>

              {/* User Info Display */}
              <div className="mb-8 flex items-center gap-4 p-4 bg-slate-700/30 rounded-lg border border-slate-700">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {user?.displayName?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-white font-semibold">{user?.displayName || "User"}</p>
                  <p className="text-slate-400 text-sm">{user?.email}</p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all shadow-lg hover:shadow-xl"
              >
                {loading ? "Submitting..." : "Submit Testimonial"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
