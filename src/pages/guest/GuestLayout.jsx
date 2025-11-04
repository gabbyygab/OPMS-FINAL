import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

export default function GuestLayout({ user, userData }) {
  const location = useLocation();

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        <Outlet key={location.pathname} />
      </AnimatePresence>
    </div>
  );
}
