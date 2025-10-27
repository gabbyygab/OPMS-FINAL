import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { useAuth } from "./context/AuthContext";
import { useEffect } from "react";
import {
  ProtectedRoute,
  PublicRoute,
  RoleBasedRedirect,
} from "./routing/ProtectedRoute";
import { ROUTES } from "./constants/routes";

// Pages
import LandingPage from "./pages/LandingPage";
import LoadingScreen from "./loading/Loading";
import NotFoundPage from "./error/404Page";

// Auth Components
import AuthLayout from "./pages/auth/AuthLayout";
import SignInPage from "./pages/auth/SignInPage";
import SignUpPage from "./pages/auth/SignUpPage";
import SignUpPageHost from "./pages/auth/host/SignUpPage";
import ForgotPasswordPage from "./pages/auth/ForgotPassword";
import OTPVerificationPage from "./pages/auth/OtpVerificationPage";

// Guest Components
import GuestLayout from "./pages/guest/GuestLayout";
import GuestPage from "./pages/guest/page";
import FavoritesPage from "./pages/guest/FavoritePage";
import MyBookingPage from "./pages/guest/MyBookingsPage";
import ListingDetailPage from "./pages/guest/ViewingStays";
import ExperienceDetailPage from "./pages/guest/ViewingExperiencePage";
import ServiceDetailPage from "./pages/guest/ViewingService";
import GuestProfilePage from "./pages/host/profile/ProfilePage";

// Host Components
import HostLayout from "./pages/host/HostLayout";
import HostPage from "./pages/host/page";
import StaysPage from "./pages/host/MyStays";
import ExperiencePage from "./pages/host/MyExperience";
import ServicesPage from "./pages/host/MyService";
import HostMyBookings from "./pages/host/MyBookings";
import HostProfilePage from "./pages/host/profile/ProfilePage";

// Shared Components
import MessagesPage from "./messages/page";
import WalletPage from "./e-wallet/page";
import NotificationsPage from "./notifications/NotificationPage";

// Admin Components
import {
  AdminLayout,
  Dashboard,
  ServiceFees,
  PolicyCompliance,
  Reports,
  PaymentMethods,
} from "./pages/admin";
import DraftsPage from "./pages/host/DraftsPage";
import SeedData from "./pages/admin/SeedData";

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  const { user, userData, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <div>
      <ScrollToTop />
      <Routes>
        {/* ========== ROOT / LANDING ========== */}
        <Route
          path={ROUTES.HOME}
          element={
            <RoleBasedRedirect user={user} userData={userData}>
              <LandingPage />
            </RoleBasedRedirect>
          }
        />

        {/* ========== PUBLIC AUTH ROUTES ========== */}
        <Route element={<PublicRoute user={user} userData={userData} />}>
          <Route element={<AuthLayout />}>
            <Route path={ROUTES.LOGIN} element={<SignInPage />} />
            <Route path={ROUTES.GUEST.SIGNUP} element={<SignUpPage />} />
            <Route
              path={ROUTES.FORGOT_PASSWORD}
              element={<ForgotPasswordPage />}
            />
          </Route>
        </Route>

        {/* Host Signup - Special case, allows access even when logged in */}
        <Route path={ROUTES.HOST.SIGNUP} element={<SignUpPageHost />} />

        {/* ========== PUBLIC LISTING DETAILS ROUTES ========== */}
        {/* Available to all users (logged in or not) */}
        <Route
          path="/guest/listing-details/stays/:listing_id"
          element={<ListingDetailPage />}
        />
        <Route
          path="/guest/listing-details/experiences/:listing_id"
          element={<ExperienceDetailPage />}
        />
        <Route
          path="/guest/listing-details/services/:listing_id"
          element={<ServiceDetailPage />}
        />

        {/* ========== VERIFICATION ROUTES ========== */}
        <Route
          path={ROUTES.VERIFY_ACCOUNT}
          element={
            user && userData?.role ? (
              <Navigate to={`/${userData.role}`} replace />
            ) : (
              <OTPVerificationPage user={user} userData={userData} />
            )
          }
        />
        <Route
          path={ROUTES.ACCOUNT_VERIFICATION}
          element={<OTPVerificationPage user={user} userData={userData} />}
        />

        {/* ========== GUEST ROUTES ========== */}
        <Route
          element={
            <ProtectedRoute
              user={user}
              userData={userData}
              allowedRole="guest"
              redirectTo={ROUTES.HOST.HOME}
            />
          }
        >
          <Route element={<GuestLayout user={user} userData={userData} />}>
            {/* Guest Home */}
            <Route
              path={ROUTES.GUEST.HOME}
              element={<GuestPage userData={userData} user={user} />}
            />

            {/* Guest Profile & Settings */}
            <Route
              path={ROUTES.GUEST.PROFILE}
              element={<GuestProfilePage user={user} userData={userData} />}
            />
            <Route
              path={ROUTES.GUEST.FAVORITES}
              element={<FavoritesPage userData={userData} user={user} />}
            />
            <Route
              path={ROUTES.GUEST.MY_BOOKINGS}
              element={<MyBookingPage userData={userData} user={user} />}
            />

            {/* Guest Messaging */}
            <Route
              path={ROUTES.GUEST.MESSAGES}
              element={<MessagesPage userData={userData} user={user} />}
            />
            <Route
              path="/guest/messages/:user_id/:host_id"
              element={<MessagesPage userData={userData} user={user} />}
            />

            {/* Guest Notifications */}
            <Route
              path={ROUTES.GUEST.NOTIFICATIONS}
              element={<NotificationsPage />}
            />

            {/* Guest Wallet */}
            <Route
              path={ROUTES.GUEST.E_WALLET}
              element={<WalletPage user={user} userData={userData} />}
            />
          </Route>
        </Route>

        {/* ========== HOST ROUTES ========== */}
        <Route
          element={
            <ProtectedRoute
              user={user}
              userData={userData}
              allowedRole="host"
              redirectTo={ROUTES.GUEST.HOME}
            />
          }
        >
          <Route element={<HostLayout user={user} userData={userData} />}>
            {/* Host Home & Dashboard */}
            <Route
              path={ROUTES.HOST.HOME}
              element={
                <HostPage userData={userData} user={user} loading={loading} />
              }
            />
            <Route path={ROUTES.HOST.DASHBOARD} element={<HostPage />} />

            {/* Host Profile */}
            <Route
              path={ROUTES.HOST.PROFILE}
              element={<HostProfilePage user={user} userData={userData} />}
            />

            {/* Host Listings Management */}
            <Route
              path={ROUTES.HOST.STAYS}
              element={<StaysPage userData={userData} user={user} />}
            />
            <Route
              path={ROUTES.HOST.EXPERIENCES}
              element={<ExperiencePage userData={userData} user={user} />}
            />
            <Route
              path={ROUTES.HOST.SERVICES}
              element={<ServicesPage userData={userData} user={user} />}
            />

            {/* Host Bookings Management */}
            <Route
              path={ROUTES.HOST.MY_BOOKINGS}
              element={<HostMyBookings userData={userData} user={user} />}
            />

            {/* Host Communication */}
            <Route
              path={ROUTES.HOST.MESSAGES}
              element={<MessagesPage userData={userData} user={user} />}
            />

            {/* Host Wallet */}
            <Route
              path={ROUTES.HOST.E_WALLET}
              element={<WalletPage user={user} userData={userData} />}
            />

            {/* Host Settings (placeholder routes) */}
            <Route
              path={ROUTES.HOST.SETTINGS}
              element={<div>Settings Page - Coming Soon</div>}
            />
            <Route
              path={ROUTES.HOST.CALENDAR}
              element={<div>Calendar Page - Coming Soon</div>}
            />
            <Route path={ROUTES.HOST.DRAFTS} element={<DraftsPage />} />
            <Route
              path={ROUTES.HOST.NOTIFICATIONS}
              element={<NotificationsPage />}
            />
          </Route>
        </Route>

        {/* ========== ADMIN ROUTES ========== */}
        <Route
          element={
            <ProtectedRoute
              user={user}
              userData={userData}
              allowedRole="admin"
            />
          }
        >
          <Route
            path="/admin/*"
            element={<AdminLayout user={user} userData={userData} />}
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="service-fees" element={<ServiceFees />} />
            <Route path="policy" element={<PolicyCompliance />} />
            <Route path="reports" element={<Reports />} />
            <Route path="payments" element={<PaymentMethods />} />
            <Route path="seed-data" element={<SeedData />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>
        </Route>

        {/* ========== 404 NOT FOUND ========== */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <ToastContainer />
    </div>
  );
}

export default App;
