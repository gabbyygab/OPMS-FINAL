import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase/firebase";
import { useAuth } from "../../context/AuthContext";
import HostDashboard from "../../host/Dashboard";
import Footer from "../../components/Footer";
import LoadingSpinner from "../../loading/Loading";
import NavigationBar from "../../components/NavigationBar";

export default function HostPage() {
  const { user, userData, isVerified, loading } = useAuth();
  const navigate = useNavigate();
  console.log("HostPage log:" + isVerified);

  if (loading) {
    return <LoadingSpinner />;
  }
  return (
    <>
      <NavigationBar user={user} userData={userData} />
      <section className="pt-24 sm:pt-28 lg:pt-32">
        <HostDashboard isVerified={isVerified} user={user} />
      </section>
      <Footer />
    </>
  );
}
