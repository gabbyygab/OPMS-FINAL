import { Outlet } from "react-router-dom";
import NavigationBar from "../../components/NavigationBar";

export default function HostLayout({ user, userData }) {
  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  );
}
