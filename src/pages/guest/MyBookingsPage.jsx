import Footer from "../../components/Footer";
import MyBookingsSection from "../../components/MyBookings";
import NavigationBar from "../../components/NavigationBar";
import VerificationBanner from "../../components/Verification";
import { sendOtpToUser } from "../../utils/sendOtpToUser";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function MyBookingPage({ userData, user }) {
  const { isVerified } = useAuth();
  const navigate = useNavigate();
  const [isLoadingVerification, setIsLoadingVerification] = useState(false);

  const handleVerification = async () => {
    try {
      setIsLoadingVerification(true);
      await sendOtpToUser(user);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingVerification(false);
      navigate("/account-verification");
    }
  };

  return (
    <>
      <NavigationBar userData={userData} user={user} />
      <div className="">
        {!isVerified && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
            <VerificationBanner handleVerification={handleVerification} />
          </div>
        )}
        <MyBookingsSection userData={userData} />
      </div>
      <Footer />
    </>
  );
}
