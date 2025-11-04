import React, { useState, useEffect, useContext } from "react";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { AuthModalContext } from "../context/AuthModalContext";

export default function Footer() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { selectSignUpRole } = useContext(AuthModalContext);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <footer className="bg-gradient-to-b from-slate-900 to-slate-950 border-t border-slate-700">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {/* Brand Section */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="flex flex-col items-center sm:items-start mb-6">
              <img
                src="/bookingNestLogoFInal.png"
                alt="BookingNest Logo"
                className="w-32 h-32 sm:w-36 sm:h-36 mb-3"
              />
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                BookingNest
              </h2>
              <p className="text-indigo-400 text-xs sm:text-sm font-medium mt-1">
                Your Journey Begins Here
              </p>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 text-center sm:text-left">
              Your trusted platform for discovering exceptional stays,
              experiences, and services worldwide.
            </p>
            {/* Social Media Icons */}
            <div className="flex gap-3 justify-center sm:justify-start">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 flex items-center justify-center transition-all"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4 text-slate-300 hover:text-white" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 flex items-center justify-center transition-all"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4 text-slate-300 hover:text-white" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 flex items-center justify-center transition-all"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4 text-slate-300 hover:text-white" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 flex items-center justify-center transition-all"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4 text-slate-300 hover:text-white" />
              </a>
            </div>
          </div>

          {/* For Guests */}
          <div className="col-span-1">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6">
              For Guests
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <a
                  href="#"
                  className="text-slate-400 hover:text-indigo-400 transition-colors text-sm block"
                >
                  Browse Stays
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-400 hover:text-indigo-400 transition-colors text-sm block"
                >
                  Experiences
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-400 hover:text-indigo-400 transition-colors text-sm block"
                >
                  Services
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-400 hover:text-indigo-400 transition-colors text-sm block"
                >
                  My Bookings
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-400 hover:text-indigo-400 transition-colors text-sm block"
                >
                  Favorites
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-400 hover:text-indigo-400 transition-colors text-sm block"
                >
                  Reviews & Ratings
                </a>
              </li>
            </ul>
          </div>

          {/* For Hosts */}
          <div className="col-span-1">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6">For Hosts</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <button
                  onClick={() => selectSignUpRole("host")}
                  className="text-slate-400 hover:text-indigo-400 transition-colors text-sm cursor-pointer text-left w-full"
                >
                  Become a Host
                </button>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-400 hover:text-indigo-400 transition-colors text-sm block"
                >
                  Host Dashboard
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-400 hover:text-indigo-400 transition-colors text-sm block"
                >
                  Manage Listings
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-400 hover:text-indigo-400 transition-colors text-sm block"
                >
                  Pricing & Payments
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-400 hover:text-indigo-400 transition-colors text-sm block"
                >
                  Host Support
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-400 hover:text-indigo-400 transition-colors text-sm block"
                >
                  Resources
                </a>
              </li>
            </ul>
          </div>

          {/* Contact & Company */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6">Company</h3>
            <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
              <li>
                <a
                  href="#"
                  className="text-slate-400 hover:text-indigo-400 transition-colors text-sm block"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-400 hover:text-indigo-400 transition-colors text-sm block"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-400 hover:text-indigo-400 transition-colors text-sm block"
                >
                  Terms & Conditions
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-400 hover:text-indigo-400 transition-colors text-sm block"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-400 hover:text-indigo-400 transition-colors text-sm block"
                >
                  Blog
                </a>
              </li>
            </ul>

            {/* Contact Info */}
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-start sm:items-center gap-3">
                <Mail className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                <a
                  href="mailto:support@bookingnest.com"
                  className="text-slate-400 hover:text-indigo-400 text-sm break-all"
                >
                  support@bookingnest.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <a
                  href="tel:+1234567890"
                  className="text-slate-400 hover:text-indigo-400 text-sm"
                >
                  +1 (234) 567-890
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700 my-6 sm:my-8"></div>

        {/* Bottom Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
          <div className="text-center sm:text-left">
            <p className="text-slate-400 text-sm">
              © {currentYear}{" "}
              <span className="text-white font-bold">BookingNest</span>. All
              rights reserved.
            </p>
            <p className="text-slate-500 text-xs mt-1">
              Connecting travelers with unforgettable experiences worldwide.
            </p>
          </div>

          {/* Payment Methods or Trust Badges */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="text-center">
              <p className="text-slate-500 text-xs mb-2">Secure Payments</p>
              <div className="flex gap-2 sm:gap-3">
                <div className="w-10 h-6 bg-slate-800 border border-slate-700 rounded flex items-center justify-center">
                  <span className="text-slate-400 text-xs font-semibold">SSL</span>
                </div>
                <div className="w-16 h-6 bg-slate-800 border border-indigo-600/30 rounded flex items-center justify-center">
                  <span className="text-indigo-400 text-[10px] font-bold">PayPal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Scroll Button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-8 w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all z-40"
          aria-label="Scroll to top"
        >
          <svg
            className="w-5 h-5 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
      )}
    </footer>
  );
}
