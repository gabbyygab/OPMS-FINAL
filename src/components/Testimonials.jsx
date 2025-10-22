import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { db } from "../firebase/firebase";
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setLoading(true);
        const testimonialsCollection = collection(db, "testimonials");
        const q = query(
          testimonialsCollection,
          orderBy("createdAt", "desc"),
          limit(6)
        );

        const snapshot = await getDocs(q);
        const fetchedTestimonials = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setTestimonials(fetchedTestimonials);
      } catch (error) {
        console.error("Error fetching testimonials:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  if (loading) {
    return (
      <section className="py-20 px-4 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className="text-slate-300">Loading testimonials...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4 bg-slate-800/30">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            What Our Users Say
          </h2>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Read experiences from our community of satisfied guests and hosts
          </p>
        </div>

        {/* Testimonials Grid */}
        {testimonials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-slate-800 rounded-2xl p-8 border border-slate-700 hover:border-indigo-600 transition-all duration-300 hover:shadow-lg shadow-slate-900/30"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < (testimonial.rating || 5)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-slate-600"
                      }`}
                    />
                  ))}
                </div>

                {/* Testimonial Text */}
                <p className="text-slate-300 text-base mb-6 leading-relaxed">
                  "{testimonial.comment}"
                </p>

                {/* User Info */}
                <div className="flex items-center gap-4 pt-6 border-t border-slate-700">
                  {testimonial.userPhotoURL ? (
                    <img
                      src={testimonial.userPhotoURL}
                      alt={testimonial.userName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {testimonial.userName?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                  )}

                  <div className="flex-1">
                    <p className="text-white font-semibold">
                      {testimonial.userName}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {testimonial.userRole || "Guest"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">
              No testimonials yet. Be the first to share your experience!
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
