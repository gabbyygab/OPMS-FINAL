import HostMyStays from "../../host/Stays";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/Footer";
import NavigationBar from "../../components/NavigationBar";
import VerificationBanner from "../../components/Verification";
import { sendOtpToUser } from "../../utils/sendOtpToUser";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";

export default function StaysPage({ user, userData }) {
  const navigate = useNavigate();
  const { isVerified } = useAuth();
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
      <NavigationBar user={user} userData={userData} />
      <section className="pt-24 sm:pt-28 lg:pt-32">
        {!isVerified && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
            <VerificationBanner handleVerification={handleVerification} />
          </div>
        )}
        <HostMyStays user={user} userData={userData} />
      </section>
      <Footer />
    </>
  );
}
