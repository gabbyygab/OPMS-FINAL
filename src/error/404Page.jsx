import React, { useState, useEffect } from "react";
import { Home, Search, MapPin, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [floatOffset, setFloatOffset] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    const interval = setInterval(() => {
      setFloatOffset((prev) => (prev + 0.5) % 360);
    }, 50);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(interval);
    };
  }, []);

  const destinations = [
    { name: "Paris", icon: "🗼", delay: 0 },
    { name: "Tokyo", icon: "🗾", delay: 0.5 },
    { name: "New York", icon: "🗽", delay: 1 },
    { name: "Bali", icon: "🏝️", delay: 1.5 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden flex items-center justify-center px-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-purple-500/10"
            style={{
              width: `${Math.random() * 300 + 50}px`,
              height: `${Math.random() * 300 + 50}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${
                Math.random() * 10 + 10
              }s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Animated 404 */}
        <div
          className="mb-8"
          style={{
            transform: `translate(${mousePosition.x}px, ${
              mousePosition.y + Math.sin((floatOffset * Math.PI) / 180) * 10
            }px)`,
          }}
        >
          <h1 className="text-9xl md:text-[200px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 mb-4 animate-pulse">
            404
          </h1>
        </div>

        {/* Floating Icon */}
        <div className="mb-8 flex justify-center">
          <div
            className="relative"
            style={{
              transform: `translateY(${
                Math.sin((floatOffset * Math.PI) / 180) * 15
              }px)`,
              transition: "transform 0.1s ease-out",
            }}
          >
            <div className="absolute inset-0 bg-purple-500/30 blur-2xl rounded-full"></div>
            <MapPin
              className="w-20 h-20 text-purple-400 relative animate-bounce"
              style={{ animationDuration: "3s" }}
            />
          </div>
        </div>

        {/* Text Content */}
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
          Oops! Lost in Transit
        </h2>
        <p className="text-purple-200 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
          Looks like this destination doesn't exist. Let's get you back on track
          to your perfect getaway.
        </p>

        {/* Floating Destinations */}
        <div className="flex justify-center gap-4 mb-12 flex-wrap">
          {destinations.map((dest, index) => (
            <div
              key={dest.name}
              className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-purple-400/30 hover:bg-white/20 transition-all cursor-pointer"
              style={{
                animation: `float ${3 + index}s ease-in-out infinite`,
                animationDelay: `${dest.delay}s`,
              }}
            >
              <span className="text-2xl mr-2">{dest.icon}</span>
              <span className="text-white font-semibold">{dest.name}</span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => window.history.back()}
            className="group flex items-center gap-3 px-8 py-4 bg-white text-purple-700 rounded-xl font-semibold hover:bg-purple-100 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Go Back
          </button>
        </div>

        {/* Help Text */}
        <p className="mt-12 text-purple-300 text-sm">
          Need help? Contact our{" "}
          <a
            href="#"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            24/7 support team
          </a>
        </p>
      </div>

      <style>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }
      `}</style>
    </div>
  );
}
