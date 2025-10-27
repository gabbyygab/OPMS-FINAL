# BookingNest Project Documentation

## Project Overview
BookingNest is a booking and reservation platform built with React and Firebase, supporting multiple service types including stays, experiences, and services.

## Tech Stack

### Frontend
- **Framework**: React 19.1.1
- **Build Tool**: Vite 7.1.7
- **Language**: JavaScript (no TypeScript)
- **Styling**: Tailwind CSS 3.4.17 with animations
- **UI Components**: Shadcn UI, Lucide React icons
- **Routing**: React Router DOM 7.9.3
- **Animations**: Framer Motion 12.23.22
- **State Management**: React Context API

### Backend & Services
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (includes Google OAuth)
- **Storage**: Firebase Storage
- **Payment Processing**: Separate Node.js/Express server for PayPal integration only
- **Email Service**: EmailJS
- **File Uploads**: UploadThing

### Maps & Location
- Google Maps API (@react-google-maps/api)
- React Leaflet for map visualization

## Project Structure

```
bookingNest/
├── src/
│   ├── firebase/           # Firebase configuration and initialization
│   ├── pages/              # Page components
│   │   ├── auth/           # Authentication pages (SignIn, SignUp, OTP, ForgotPassword)
│   │   ├── guest/          # Guest user pages (Bookings, Favorites, Viewing pages)
│   │   ├── host/           # Host pages (MyStays, MyExperience, MyService)
│   │   └── profile/        # User profile pages
│   ├── components/         # Reusable UI components
│   ├── host/               # Host-specific components (Stays, Experience, Services, Dashboard)
│   ├── context/            # React Context for state management
│   ├── routing/            # Route protection and navigation
│   ├── messages/           # Messaging system
│   ├── notifications/      # Notification system
│   ├── e-wallet/           # Wallet functionality
│   ├── paypal/             # PayPal integration components
│   ├── cloudinary/         # Image upload utilities
│   ├── animation/          # Animation components
│   ├── loading/            # Loading states
│   ├── error/              # Error pages (404)
│   ├── utils/              # Utility functions
│   ├── App.jsx             # Main application component
│   ├── main.jsx            # Application entry point
│   └── index.css           # Global styles
├── server/                 # Separate Node.js server (PayPal only)
│   ├── index.js            # Express server setup
│   ├── paypal.js           # PayPal API routes
│   └── package.json        # Server dependencies
├── public/                 # Static assets
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── .env                    # Environment variables
└── package.json            # Project dependencies
```

## Firebase Configuration

### Location
`src/firebase/firebase.js`

### Services Initialized
- **Firestore**: Database with offline persistence enabled
- **Auth**: Authentication with Google OAuth provider
- **Storage**: File storage for images and documents

### Environment Variables (Vite format)
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

## PayPal Server

### Purpose
Separate Node.js/Express server handling PayPal payment processing exclusively.

### Location
`/server` directory

### Configuration
- **Port**: 5000 (default)
- **API Routes**: `/api/paypal/*`
- **CORS**: Enabled for cross-origin requests
- **Proxy**: Configured in server/package.json

### Environment Variables
PayPal credentials stored in root `.env` file

## Path Aliases

The project uses Vite path aliases:
- `@/` → `./src/`

Example: `import { auth } from '@/src/firebase'`

## Key Features

### User Roles
- **Guest**: Book stays, experiences, and services
- **Host**: List and manage stays, experiences, and services

### Core Functionality
- User authentication (email/password and Google)
- Booking management
- Favorites/wishlists
- Messaging system
- Notifications
- E-wallet for payments
- PayPal integration for funding wallet
- Profile management
- Image uploads (Cloudinary and UploadThing)
- Interactive maps for location selection

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
  availableTimes: string[],            // Available time slots
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

### Common Fields Across All Types
- **type**: "stays" | "experiences" | "services"
- **title**: Name of the listing
- **description**: Detailed information about the listing
- **location**: Physical address or service area
- **latitude/longitude**: Geographic coordinates for map integration
- **images**: Array of image URLs stored in Firebase Storage
- **availableDates**: Array of date ranges when the listing is available
- **hostId**: User ID of the host who created the listing
- **rating**: Average rating (0-5)
- **reviews**: Number of reviews received
- **createdAt/updatedAt**: Firestore timestamps

### Searching & Filtering
Listings are filtered based on:
- **Location**: String search/matching
- **Check-in/Check-out dates**: Date range overlap with availableDates
- **Guests**: Minimum guest requirement (stays: numberOfGuests, experiences: maxParticipants)
- **Service Type**: Available serviceTypes array (services only)

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Server Commands

```bash
cd server
node index.js    # Start PayPal server on port 5000
```

## Important Notes

1. **No TypeScript**: This project uses JavaScript exclusively
2. **Firebase for Everything**: Database, auth, and storage all through Firebase except PayPal
3. **Separate PayPal Server**: Payment processing runs on independent Node.js server
4. **Offline Persistence**: Firestore cache is cleared and re-enabled on app initialization
5. **Module Type**: Both main project and server use ES modules (`"type": "module"`)
6. **React 19**: Latest React version with new features and patterns

## State Management

Uses React Context API located in `src/context/`:
- AuthContext for user authentication state

## Protected Routes

Route protection implemented in `src/routing/ProtectedRoute.jsx` to guard authenticated pages.

## Field Naming Convention

### Listing Host Reference
The database uses `hostId` (camelCase) for storing the host/seller's user ID in listing documents:

```javascript
{
  hostId: "WMdkYEhTTrYUsHw9XpeH3xw1T9s2",  // Firestore user ID of the host
  // ... other listing fields
}
```

All host-side CRUD operations in `src/host/` pages use `hostId` for:
- Querying listings: `where("hostId", "==", userData.id)`
- Creating new listings: `hostId: userData.id`
- Updating listings

### Files Updated (host_id → hostId)
- `src/host/Dashboard.jsx` - Dashboard fetch queries
- `src/host/Stays.jsx` - Create/Update stays, fetch stays listings
- `src/host/Experience.jsx` - Create/Update experiences, fetch experiences listings
- `src/host/Services.jsx` - Create/Update services, fetch services listings

## Recent Development Activity

Based on git history:
- Messaging system completed
- Profile functionality completed
- Search functionality enhanced with filters
- Admin logout functionality added
- Sample data seeding tool created
- Field naming standardization (host_id → hostId)
- Active development on main branch
