# Project Overview

BookingNest is a comprehensive multi-role booking and reservation platform built with modern web technologies. It enables users to:

*   **Guests**: Browse, search, and book accommodations (stays, experiences, services)
*   **Hosts**: List and manage properties with earnings tracking and guest communication
*   **Administrators**: Manage platform content and users

The platform features real-time messaging, favorites management, payment processing (PayPal integration), notifications, and E-wallet functionality.

# Main Technologies

*   **Frontend:** React, Vite, Tailwind CSS, Shadcn UI, Framer Motion
*   **Backend:** Firebase (Authentication, Firestore, Storage), Node.js with Express (for PayPal)
*   **Routing:** React Router
*   **Payments:** PayPal
*   **Image Storage:** Cloudinary, UploadThing
*   **Email:** EmailJS
*   **Maps:** Google Maps API, React Leaflet

# Building and Running

## Development

To run the application in development mode, use the following command:

```bash
npm run dev
```

This will start the Vite development server on port 5173.

There is also a separate Node.js server for PayPal integration that runs on port 5000.

```bash
cd server
npm install
node index.js
```

## Build

To build the application for production, use the following command:

```bash
npm run build
```

This will create a `dist` directory with the production-ready files.

## Linting

To lint the code, use the following command:

```bash
npm run lint
```

# Development Conventions

*   The project uses ESLint for code linting.
*   The project follows a role-based access control system with "guest", "host", and "admin" roles.
*   The application uses a context-based authentication system with Firebase.
*   The project uses a `src` directory for all the source code.
*   The project uses a `components` directory for reusable components.
*   The project uses a `pages` directory for different pages of the application.
*   The project uses a `constants` directory for constants like routes.
*   The project uses a `firebase` directory for Firebase-related code.
*   The project uses a `context` directory for React context.
*   The project uses a `utils` directory for utility functions.

# Database Schema

The database is structured using Firebase Firestore. The main collections are:

*   `bookings`: Guest booking records
*   `conversations`: User messaging conversations
*   `coupons`: Discount coupons
*   `favorites`: User favorite listings
*   `listings`: Property/service listings
*   `messages`: Messages within conversations
*   `notifications`: User notifications
*   `reviews`: Booking/listing reviews
*   `transactions`: Wallet transactions
*   `users`: User profiles
*   `wallets`: User wallet balances

For a detailed schema, please refer to the `FIREBASE_COLLECTIONS.md` file.

## Listing Data Structure

The application supports three listing types, each with specific fields stored in Firestore:

### Stays Listing Fields
```javascript
{
  type: "stays",
  title: string,                       // Property name
  description: string,                 // Property description
  location: string,                    // Full address
  price: number,                       // Price per night
  numberOfGuests: number,              // Total capacity (from formData.guests)
  bedrooms: number,                    // Number of bedrooms
  bathrooms: number,                   // Number of bathrooms
  beds: number,                        // Total number of beds
  amenities: string[],                 // e.g., ["WiFi", "Pool", "Kitchen"]
  houseRules: string[],                // e.g., ["No Smoking", "No Pets"]
  photos: string[],                    // Array of image URLs from Cloudinary
  availableDates: [{                   // Array of availability ranges
    startDate: string,                 // "YYYY-MM-DD"
    endDate: string                    // "YYYY-MM-DD"
  }],
  bookedDates: string[],               // Dates that are already booked
  promoCode: string | null,            // Promotional code if applicable
  discount: {                          // Discount information
    type: string,                      // "percentage" or "fixed"
    value: number                      // Discount amount
  },
  ratings: number,                     // Average rating
  isDraft: boolean,                    // Whether listing is in draft mode
  status: string,                      // "active" or "inactive"
  hostId: string,                      // Reference to host user ID
  created_at: timestamp,               // Creation timestamp
  updated_at: timestamp                // Last update timestamp
}
```

### Experiences Listing Fields
```javascript
{
  type: "experiences",
  title: string,                       // Experience name
  description: string,                 // Experience description
  location: string,                    // Location/address
  price: number,                       // Price per person
  duration: number,                    // Duration in hours
  maxGuests: number,                   // Maximum number of participants
  category: string,                    // e.g., "Adventure", "Culture", "Food", "Wellness"
  language: string,                    // Language spoken during experience
  ageMin: number,                      // Minimum age requirement
  availableTimes: [{                   // Array of available dates with time slots
    date: string,                      // "YYYY-MM-DD"
    time: string                       // "HH:MM" (e.g., "09:00", "14:30")
  }],
  availableDates: [{                   // Array of availability ranges
    startDate: string,                 // "YYYY-MM-DD"
    endDate: string                    // "YYYY-MM-DD"
  }],
  activities: string[],                // Activities included (e.g., "Hiking", "Photography")
  thingsToKnow: string[],              // Important information for participants
  included: string[],                  // What's included in the experience
  toBring: string[],                   // What participants should bring
  photos: string[],                    // Array of image URLs from Cloudinary
  discount: {                          // Discount information
    type: string,                      // "percentage" or "fixed"
    value: number                      // Discount amount
  },
  promoCode: string | null,            // Promotional code if applicable
  rating: number,                      // Average rating
  isDraft: boolean,                    // Whether listing is in draft mode
  status: string,                      // "active" or "inactive"
  hostId: string,                      // Reference to host user ID
  createdAt: timestamp,                // Creation timestamp
  updatedAt: timestamp                 // Last update timestamp
}
```

### Services Listing Fields
```javascript
{
  type: "services",
  title: string,                       // Service name
  description: string,                 // Service description
  location: string,                    // Service location or area
  price: number,                       // Price per hour (from formData.basePrice)
  duration: number,                    // Duration in hours
  category: string,                    // Service category (e.g., "Home Services")
  responseTime: string,                // Response time (e.g., "within 1 hour")
  photos: string[],                    // Array of image URLs from Cloudinary
  serviceTypes: string[],              // e.g., ["Deep Cleaning", "Window Cleaning"]
  highlights: string[],                // Key features/highlights of the service
  serviceAreas: string[],              // Geographic areas served
  certifications: string[],            // Professional certifications
  terms: string[],                     // Terms and conditions
  experienceYears: number,             // Years of experience
  completedJobs: number,               // Number of completed jobs
  availableDates: [{                   // Array of availability ranges
    startDate: string,                 // "YYYY-MM-DD"
    endDate: string                    // "YYYY-MM-DD"
  }],
  discount: {                          // Discount information
    type: string,                      // "percentage" or "fixed"
    value: number                      // Discount amount
  },
  promoCode: string | null,            // Promotional code if applicable
  isVerified: boolean,                 // Whether provider is verified
  isDraft: boolean,                    // Whether listing is in draft mode
  status: string,                      // "active" or "inactive"
  hostId: string,                      // Reference to host user ID
  created_at: timestamp,               // Creation timestamp
  updated_at: timestamp                // Last update timestamp
}
```

# Key Features

*   **Multi-Role System**: Guest, Host, and Admin roles with role-based navigation.
*   **Authentication**: Email/password, Google OAuth, OTP verification, and password reset.
*   **Guest Features**: Explore, search, filter, book, favorites, messaging, reviews, E-Wallet, and notifications.
*   **Host Features**: Dashboard, listing management, booking management, calendar, messaging, notifications, analytics, coupons, and E-Wallet.
*   **Real-Time Features**: Real-time messaging, notifications, favorites sync, and booking status updates.
*   **Payment & E-Wallet**: PayPal integration and E-Wallet balance tracking.

# User Roles & Flows

## Guest User Flow

```
Sign Up/Login -> Email Verification (OTP) -> Browse Listings -> View Details & Reviews -> Add to Favorites -> Fund E-Wallet (optional) -> Book Listing -> Message Host -> Receive Confirmation & Updates
```

## Host User Flow

```
Sign Up/Login -> Email Verification (OTP) -> Create Listings -> Set Pricing & Availability -> Upload Images -> Receive Bookings -> Communicate with Guests -> Track Earnings -> Manage Dashboard & Analytics
```

# Authentication Flow

## Sign Up Process

1.  User enters email, password, full name.
2.  Firebase Auth creates an account.
3.  User document created in Firestore with a role.
4.  OTP sent via EmailJS to the user's email.
5.  User enters OTP for verification.
6.  The account is marked as verified.

## Sign In Process

1.  User enters email and password.
2.  Firebase Auth validates credentials.
3.  Auth context loads user data from Firestore.
4.  User redirected based on role and verification status.
5.  Session persists via Firebase Auth.

## OAuth (Google Sign In)

1.  User clicks "Sign in with Google".
2.  Google OAuth popup opens.
3.  Firebase Auth handles the OAuth flow.
4.  User document created/updated in Firestore.
5.  User redirected to the appropriate dashboard.

# State Management

## Context API (React Context)

`AuthContext.jsx` manages global authentication and user state.

## Local State Management

Individual components use `useState` for local state.

## Real-Time Listeners (Firestore)

`onSnapshot` is used for real-time updates for favorites, bookings, and messages.

# Routing Structure

## Public Routes

*   `/`
*   `/auth/signin`
*   `/auth/signup`
*   `/auth/otp`
*   `/auth/forgot-password`

## Guest Protected Routes

*   `/guest`
*   `/guest/favorites`
*   `/guest/bookings`
*   `/guest/profile`
*   `/guest/messages`
*   `/guest/e-wallet`
*   `/guest/listing-details/:type/:id`

## Host Protected Routes

*   `/host/dashboard`
*   `/host/stays`
*   `/host/experiences`
*   `/host/services`
*   `/host/profile`
*   `/host/messages`
*   `/host/notifications`
*   `/host/settings`
*   `/host/e-wallet`
*   `/host/calendar`
*   `/host/drafts`
