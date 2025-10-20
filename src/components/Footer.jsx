import React from "react";
import { Facebook, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#1a1d29] border-t border-[#2d3142]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Brand and Description */}
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl font-bold text-[#9ba4ff] mb-3">
              BookingNest
            </h3>
            <p className="text-[#b8bcc8] max-w-md leading-relaxed">
              Discover your perfect getaway with BookingNest. We bring comfort,
              convenience, and unforgettable experiences to every stay. Your
              journey to exceptional accommodations starts here.
            </p>
          </div>

          {/* Social Media */}
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-[#8a8f9d] font-medium">
              Connect with us
            </p>
            <div className="flex gap-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-[#2d3142] border border-[#3d4152] flex items-center justify-center hover:bg-[#9ba4ff]/20 hover:border-[#9ba4ff] hover:scale-110 transition-all"
              >
                <Facebook className="w-5 h-5 text-[#9ba4ff]" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-[#2d3142] border border-[#3d4152] flex items-center justify-center hover:bg-[#9ba4ff]/20 hover:border-[#9ba4ff] hover:scale-110 transition-all"
              >
                <Instagram className="w-5 h-5 text-[#9ba4ff]" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-[#2d3142] text-center">
          <p className="text-sm text-[#8a8f9d]">
            © 2025 BookingNest. Established with passion for extraordinary
            stays.
          </p>
        </div>
      </div>
    </footer>
  );
}
