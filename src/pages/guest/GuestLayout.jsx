import { Outlet } from "react-router-dom";
import NavigationBar from "../../components/NavigationBar";

export default function GuestLayout({ user, userData }) {
  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  );
}
