// Route constants for consistent navigation
export const ROUTES = {
  // Public routes
  HOME: "/",
  LOGIN: "/login",
  FORGOT_PASSWORD: "/forgot-password",
  VERIFY_ACCOUNT: "/verify-account",
  ACCOUNT_VERIFICATION: "/account-verification",

  // Guest routes
  GUEST: {
    SIGNUP: "/guest/signup",
    HOME: "/guest",
    PROFILE: "/guest/profile",
    FAVORITES: "/guest/favorites",
    MY_BOOKINGS: "/guest/my-bookings",
    MESSAGES: "/guest/messages",
    MESSAGES_WITH_HOST: (userId, hostId) => `/guest/messages/${userId}/${hostId}`,
    NOTIFICATIONS: "/guest/notifications",
    E_WALLET: "/guest/e-wallet",
    LISTING_DETAILS: {
      STAYS: (listingId) => `/guest/listing-details/stays/${listingId}`,
      EXPERIENCES: (listingId) => `/guest/listing-details/experiences/${listingId}`,
      SERVICES: (listingId) => `/guest/listing-details/services/${listingId}`,
    },
  },

  // Host routes
  HOST: {
    SIGNUP: "/host/signup",
    HOME: "/host",
    DASHBOARD: "/host/dashboard",
    PROFILE: "/host/profile",
    STAYS: "/host/stays",
    EXPERIENCES: "/host/experiences",
    SERVICES: "/host/services",
    MY_BOOKINGS: "/host/my-bookings",
    MESSAGES: "/host/messages",
    NOTIFICATIONS: "/host/notifications",
    SETTINGS: "/host/settings",
    E_WALLET: "/host/e-wallet",
    CALENDAR: "/host/calendar",
    DRAFTS: "/host/drafts",
  },

  // Admin routes
  ADMIN: {
    BASE: "/admin",
    DASHBOARD: "/admin/dashboard",
    SERVICE_FEES: "/admin/service-fees",
    POLICY: "/admin/policy",
    REPORTS: "/admin/reports",
    PAYMENTS: "/admin/payments",
  },
};
