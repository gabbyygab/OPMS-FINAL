import NavigationBar from "../components/NavigationBar";
import Footer from "../components/Footer";
import { useState, useContext } from "react";
import HeroSection from "../components/HeroSection";
import FeaturesSection from "../components/FeaturesSection";
import PopularListings from "../components/PopularListings";
import NewListings from "../components/NewListings";
import Testimonials from "../components/Testimonials";
import TestimonialForm from "../components/TestimonialForm";
import { AuthModalContext } from "../context/AuthModalContext";

export default function LandingPage() {
  const [activeCategory, setActiveCategory] = useState("homes");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [testimonialRefresh, setTestimonialRefresh] = useState(0);
  const { openSignUp, openSignIn } = useContext(AuthModalContext);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navbar */}
      <NavigationBar
        onCategoryChange={setActiveCategory}
        isLoggedIn={false}
        role=""
        page="LandingPage"
      />

      <HeroSection />
      <FeaturesSection />
      <PopularListings />
      <NewListings />
      <Testimonials key={testimonialRefresh} />
      <TestimonialForm
        onSubmit={() => setTestimonialRefresh((prev) => prev + 1)}
      />

      <Footer />
    </div>
  );
}
