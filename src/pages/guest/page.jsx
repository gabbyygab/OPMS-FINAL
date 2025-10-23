import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase/firebase";
import { signOut } from "firebase/auth";
import BookingsSection from "../../components/BookingSection";
import Footer from "../../components/Footer";
import { useAuth } from "../../context/AuthContext";
import VerificationBanner from "../../components/Verification";
import { useState } from "react";
import { sendOtpToUser } from "../../utils/sendOtpToUser";
import LoadingSpinner from "../../loading/Loading";
import NavigationBar from "../../components/NavigationBar";
export default function GuestPage({ userData, user }) {
  // Calculate top padding for fixed navbar with tabs and search bar
  // Top row (logo + tabs + profile): ~54px (py-2.5)
  // Search bar row: ~50px (py-2.5)
  // Total when not scrolled: ~104px
  // When scrolled: ~54px (only top row)
  // Using 104px to account for both rows
  return (
    <>
      <NavigationBar user={user} userData={userData} />
      <section style={{ paddingTop: user && userData?.role === "guest" ? "104px" : "0px" }}>
        <BookingsSection userData={userData} isFavoritePage={false} />
      </section>
      <Footer />
    </>
  );
}
