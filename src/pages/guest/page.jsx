import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase/firebase";
import { signOut } from "firebase/auth";
import BookingsSection from "../../components/BookingSection";
import Footer from "../../components/Footer";
import { toast } from "react-toastify";
import NavigationBar from "../../components/NavigationBar";
import AnimatedPageWrapper from "../../components/AnimatedPageWrapper";

export default function GuestPage({ userData, user }) {
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

  // Calculate top padding for fixed navbar with tabs and search bar
  // Top row (logo + tabs + profile): ~54px (py-2.5)
  // Search bar row: ~50px (py-2.5)
  // Total when not scrolled: ~104px
  // When scrolled: ~54px (only top row)
  // Using 104px to account for both rows
  return (
    <AnimatedPageWrapper>
      <NavigationBar user={user} userData={userData} handleLogout={handleLogout} />
      <section style={{ paddingTop: user && userData?.role === "guest" ? "104px" : "0px" }}>
        <BookingsSection userData={userData} isFavoritePage={false} />
      </section>
      <Footer />
    </AnimatedPageWrapper>
  );
}
