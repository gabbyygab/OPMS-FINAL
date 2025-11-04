import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase/firebase";
import { useAuth } from "../../context/AuthContext";
import HostDashboard from "../../host/Dashboard";
import Footer from "../../components/Footer";
import LoadingSpinner from "../../loading/Loading";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";
import NavigationBar from "../../components/NavigationBar";
import AnimatedPageWrapper from "../../components/AnimatedPageWrapper";

export default function HostPage() {
  const { user, userData, isVerified, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Navigate immediately to prevent showing protected route
      navigate("/", { replace: true });
      await signOut(auth);
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Error logging out: " + error.message);
    }
  };

  console.log("HostPage log:" + isVerified);

  if (loading) {
    return <LoadingSpinner />;
  }
  return (
    <AnimatedPageWrapper>
      <NavigationBar user={user} userData={userData} handleLogout={handleLogout} />
      <section className="">
        <HostDashboard isVerified={isVerified} user={user} />
      </section>
      <Footer />
    </AnimatedPageWrapper>
  );
}
