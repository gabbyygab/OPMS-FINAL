import NavigationBar from "../../components/NavigationBar";
import Footer from "../../components/Footer";
import BookingsSection from "../../components/BookingSection";
import AnimatedPageWrapper from "../../components/AnimatedPageWrapper";

export default function FavoritesPage({ user, userData }) {
  return (
    <AnimatedPageWrapper className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      {/* Navbar always on top */}
      <NavigationBar user={user} userData={userData} />

      {/* Main content grows and adapts */}
      <main>
        <BookingsSection userData={userData} isFavoritePage={true} />
      </main>

      {/* Footer pinned at bottom */}
      <Footer />
    </AnimatedPageWrapper>
  );
}
