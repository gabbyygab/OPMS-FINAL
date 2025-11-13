import { Navigate, Outlet } from "react-router-dom";

/**
 * ProtectedRoute - Wrapper for routes that require authentication and role-based access
 * @param {Object} user - Current authenticated user
 * @param {Object} userData - User data including role
 * @param {string} allowedRole - Required role to access the route
 * @param {string} redirectTo - Path to redirect if access is denied
 */
export function ProtectedRoute({ user, userData, allowedRole, redirectTo = "/" }) {
  // Redirect to home if not authenticated
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Redirect to home if user is deactivated
  if (userData?.status === "deactivated") {
    return <Navigate to="/" replace />;
  }

  // Redirect to appropriate page if role doesn't match
  if (userData?.role !== allowedRole) {
    return <Navigate to={redirectTo || `/${userData?.role || ""}`} replace />;
  }

  // Render child routes
  return <Outlet />;
}

/**
 * PublicRoute - Wrapper for routes that should only be accessible when NOT authenticated
 * @param {Object} user - Current authenticated user
 * @param {Object} userData - User data including role
 */
export function PublicRoute({ user, userData }) {
  // Redirect authenticated users to their role-specific page
  if (user && userData?.role) {
    const redirectPath = userData.role === "admin"
      ? "/admin/dashboard"
      : `/${userData.role}`;
    return <Navigate to={redirectPath} replace />;
  }

  // Render child routes for non-authenticated users
  return <Outlet />;
}

/**
 * RoleBasedRedirect - Component that redirects based on user role
 * Used for root paths like "/" or role home pages
 * @param {Object} user - Current authenticated user
 * @param {Object} userData - User data including role
 * @param {ReactNode} children - Component to render if not authenticated
 */
export function RoleBasedRedirect({ user, userData, children }) {
  // Don't redirect deactivated users, let them see landing page
  if (user && userData?.role && userData?.status !== "deactivated") {
    const redirectPath = userData.role === "admin"
      ? "/admin/dashboard"
      : `/${userData.role}`;
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}

export default ProtectedRoute;
