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
  return (
    <>
      <NavigationBar user={user} userData={userData} />
      <section>
        <BookingsSection userData={userData} isFavoritePage={false} />
      </section>
      <Footer />
    </>
  );
}
