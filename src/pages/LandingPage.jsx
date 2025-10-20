import NavigationBar from "../components/NavigationBar";

import Footer from "../components/Footer";
import { useState } from "react";
import HeroSection from "../components/HeroSection";
import FeaturesSection from "../components/FeaturesSection";
import PopularDestinations from "../components/PopularDest";
import Pricing from "../components/Pricing";

export default function LandingPage() {
  const [activeCategory, setActiveCategory] = useState("homes");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  return (
    <div className="min-h-screen bg-cream">
      {/* Navbar */}
      <NavigationBar
        onCategoryChange={setActiveCategory}
        isLoggedIn={false}
        role=""
        page="LandingPage"
      />

      <HeroSection />
      <FeaturesSection />
      <PopularDestinations />
      <Pricing />

      <Footer />
      {/* <section className="pt-[166px]">
        <LandingPageBody activeCategory={activeCategory} />
      </section> */}
      {/* Hero Section */}
      {/* <HeroSection /> */}
      {/* Features Section */}
      {/* <FeaturesSection /> */}
      {/* Testimonials Section */}
      {/* <Testimonials /> */}
      {/* Pricing Section */}
      {/* <Pricing /> */}
      {/* Footer */}
      {/* <Footer /> */}
    </div>
  );
}
