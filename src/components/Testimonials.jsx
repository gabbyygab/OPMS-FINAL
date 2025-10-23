import { useEffect, useState, useRef } from "react";
import { Star } from "lucide-react";
import { db } from "../firebase/firebase";
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const sectionRef = useRef(null);

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

  // Track mouse position for interactive background
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  if (loading) {
    return (
      <section className="py-20 px-4 bg-slate-800/30">
        {" "}
        <div className="max-w-7xl mx-auto text-center">
          {" "}
          <p className="text-slate-300">Loading testimonials...</p>{" "}
        </div>{" "}
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="relative py-20 px-4 bg-gradient-to-b from-transparent via-slate-900/50 to-transparent overflow-hidden"
    >
      {/* Interactive mouse cursor glow */}
      <div
        className="pointer-events-none fixed w-96 h-96 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-full blur-3xl opacity-40 transition-opacity duration-300"
        style={{
          left: `${mousePosition.x - 192}px`,
          top: `${mousePosition.y - 192}px`,
        }}
      />
      ```
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
              What Our Users Say
            </span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-200">
            Read experiences from our community of satisfied guests and hosts
          </p>
        </div>

        {/* Testimonials Grid */}
        {testimonials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="group relative rounded-2xl p-8 transition-all duration-300 cursor-pointer"
              >
                {/* Gradient border glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-400 opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity duration-500 blur-xl pointer-events-none -z-10"></div>

                <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 hover:border-yellow-500/50 transition-all duration-300 group-hover:shadow-lg shadow-slate-900/30 h-full">
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
                  <p className="text-slate-300 text-base mb-6 leading-relaxed group-hover:text-slate-200 transition-colors duration-300">
                    "{testimonial.comment}"
                  </p>

                  {/* User Info */}
                  <div className="flex items-center gap-4 pt-6 border-t border-slate-700/50">
                    {testimonial.userPhotoURL ? (
                      <img
                        src={testimonial.userPhotoURL}
                        alt={testimonial.userName}
                        className="w-12 h-12 rounded-full object-cover border border-yellow-400/30"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center">
                        <span className="text-slate-900 font-bold text-lg">
                          {testimonial.userName?.charAt(0)?.toUpperCase() ||
                            "U"}
                        </span>
                      </div>
                    )}

                    <div className="flex-1">
                      <p className="text-white font-semibold">
                        {testimonial.userName}
                      </p>
                      <p className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors duration-300">
                        {testimonial.userRole || "Guest"}
                      </p>
                    </div>
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
