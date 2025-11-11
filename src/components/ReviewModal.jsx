import { useState } from "react";
import { X, Star } from "lucide-react";
import { db } from "../firebase/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "react-toastify";

export default function ReviewModal({ showModal, onClose, booking, user }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.error("Please select a rating.");
      return;
    }
    if (!comment.trim()) {
      toast.error("Please write a review.");
      return;
    }

    try {
      setIsSubmitting(true);
      await addDoc(collection(db, "reviews"), {
        bookingId: booking.id,
        listingId: booking.listing_id,
        guestId: user.uid,
        hostId: booking.hostId,
        rating: rating,
        comment: comment,
        createdAt: serverTimestamp(),
      });

      toast.success("Review submitted successfully!");
      onClose();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-md p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Leave a Review</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-slate-300 mb-2">How was your experience at <span className="font-semibold text-white">{booking.listing?.title}</span>?</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onClick={() => setRating(star)}>
                <Star
                  className={`w-8 h-8 transition-colors ${
                    star <= rating
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-slate-600 hover:text-yellow-400"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
            rows={5}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none p-3"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-slate-600 text-slate-300 py-3 rounded-lg hover:bg-slate-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitReview}
            disabled={isSubmitting}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}
