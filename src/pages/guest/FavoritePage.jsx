import NavigationBar from "../../components/NavigationBar";
import Footer from "../../components/Footer";
import BookingsSection from "../../components/BookingSection";

export default function FavoritesPage({ user, userData }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navbar always on top */}
      <NavigationBar user={user} userData={userData} />

      {/* Main content grows and adapts */}
      <main>
        <BookingsSection userData={userData} isFavoritePage={true} />
      </main>

      {/* Footer pinned at bottom */}
      <Footer />
    </div>
  );
}
