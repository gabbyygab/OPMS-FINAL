# BookingNest Project Documentation

**Last Updated:** October 31, 2025
**Project Status:** Active Development
**Maintained By:** Development Team

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Firebase Configuration](#firebase-configuration)
5. [PayPal Server](#paypal-server)
6. [Key Features](#key-features)
7. [Listing Data Structure](#listing-data-structure)
8. [Bookings Data Structure](#bookings-data-structure)
9. [Notifications Data Structure](#notifications-data-structure)
10. [Points & Rewards System](#points--rewards-system)
11. [Refund System](#refund-system)
12. [Firestore Collections Reference](#firestore-collections-reference)
13. [Privacy Policy & Terms of Service](#privacy-policy--terms-of-service)
14. [Development Commands](#development-commands)
15. [Recent Updates & Implementation](#recent-updates--implementation)

---

## Project Overview

**BookingNest** is a comprehensive multi-role booking and reservation platform built with modern web technologies. It enables users to:

- **Guests**: Browse, search, and book accommodations (stays, experiences, services)
- **Hosts**: List and manage properties with earnings tracking and guest communication
- **Administrators**: Manage platform content and users

The platform features real-time messaging, favorites management, payment processing (PayPal integration), notifications, E-wallet functionality, points & rewards system, and refund management.

---

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
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Auth (Email/Password & Google OAuth)
- **Storage**: Firebase Storage
- **Payment Processing**: Separate Node.js/Express server (PayPal only)
- **Email Service**: EmailJS
- **File Uploads**: UploadThing
- **Image Upload**: Cloudinary

### Maps & Location
- Google Maps API (@react-google-maps/api)
- React Leaflet for map visualization

---

## Project Structure

```
bookingNest/
├── src/
│   ├── firebase/           # Firebase configuration
│   ├── pages/              # Page components
│   │   ├── auth/           # Auth pages (SignIn, SignUp, OTP, ForgotPassword)
│   │   ├── guest/          # Guest pages (Bookings, Favorites, Viewing)
│   │   ├── host/           # Host pages (MyBookings, Profile)
│   │   └── profile/        # Shared profile pages
│   ├── components/         # Reusable UI components
│   ├── host/               # Host components (Stays, Experience, Services, Dashboard)
│   ├── context/            # React Context (AuthContext, AuthModalContext)
│   ├── routing/            # Route protection (ProtectedRoute.jsx)
│   ├── messages/           # Messaging system
│   ├── notifications/      # Notification system
│   ├── e-wallet/           # Wallet & Points/Rewards functionality
│   ├── paypal/             # PayPal integration
│   ├── cloudinary/         # Image upload utilities
│   ├── animation/          # Animation components
│   ├── loading/            # Loading states
│   ├── error/              # Error pages (404)
│   ├── utils/              # Utility functions
│   │   ├── rewardsUtils.js  # Points & Rewards functions
│   │   ├── refundUtils.js   # Refund management functions
│   │   └── ...
│   ├── App.jsx             # Main app component
│   ├── main.jsx            # React entry point
│   └── index.css           # Global styles
├── server/                 # Separate Node.js server
│   ├── index.js            # Express setup
│   ├── paypal.js           # PayPal API routes
│   └── package.json        # Server dependencies
├── public/                 # Static assets
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS config
├── .env                    # Environment variables
└── package.json            # Project dependencies
```

---

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
VITE_EMAIL_JS_PUBLIC_KEY
VITE_EMAIL_JS_SERVICE_ID
VITE_BOOKING_EMAIL_JS_TEMPLATE_ID
```

---

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

---

## Key Features

### User Roles
- **Guest**: Browse and book listings
- **Host**: Create and manage listings
- **Admin**: Platform management

### Core Functionality
- ✅ Multi-role authentication (email/password & Google OAuth)
- ✅ Booking management with confirmation workflow
- ✅ Favorites/wishlists system
- ✅ Real-time messaging
- ✅ Notifications system
- ✅ E-wallet for payments
- ✅ PayPal integration for funding wallet
- ✅ Points & Rewards gamification
- ✅ Refund management system
- ✅ Profile management
- ✅ Image uploads (Cloudinary & UploadThing)
- ✅ Interactive maps for location selection
- ✅ OTP email verification

---

## Listing Data Structure

The application supports three listing types with specific fields:

### Stays Listing Fields
```javascript
{
  type: "stays",
  title: string,                       // Property name
  description: string,                 // Property description
  location: string,                    // Full address
  price: number,                       // Price per night
  numberOfGuests: number,              // Total capacity
  bedrooms: number,                    // Number of bedrooms
  bathrooms: number,                   // Number of bathrooms
  beds: number,                        // Total number of beds
  amenities: string[],                 // e.g., ["WiFi", "Pool", "Kitchen"]
  houseRules: string[],                // e.g., ["No Smoking", "No Pets"]
  photos: string[],                    // Image URLs from Cloudinary
  availableDates: [{                   // Availability ranges
    startDate: string,                 // "YYYY-MM-DD"
    endDate: string                    // "YYYY-MM-DD"
  }],
  bookedDates: string[],               // Already booked dates
  promoCode: string | null,            // Promotional code
  discount: {                          // Discount information
    type: string,                      // "percentage" or "fixed"
    value: number                      // Discount amount
  },
  ratings: number,                     // Average rating (0-5)
  isDraft: boolean,                    // Draft status
  status: string,                      // "active" or "inactive"
  hostId: string,                      // Host user ID
  created_at: timestamp,               // Creation timestamp
  updated_at: timestamp                // Last update timestamp
}
```

### Experiences Listing Fields
```javascript
{
  type: "experiences",
  title: string,                       // Experience name
  description: string,                 // Description
  location: string,                    // Location/address
  price: number,                       // Price per person
  duration: number,                    // Duration in hours
  maxGuests: number,                   // Maximum participants
  category: string,                    // e.g., "Adventure", "Culture"
  language: string,                    // Language spoken
  ageMin: number,                      // Minimum age requirement
  availableTimes: [{                   // Available dates with times
    date: string,                      // "YYYY-MM-DD"
    time: string                       // "HH:MM" (e.g., "09:00")
  }],
  availableDates: [{                   // Availability ranges
    startDate: string,
    endDate: string
  }],
  activities: string[],                // Activities included
  thingsToKnow: string[],              // Important information
  included: string[],                  // What's included
  toBring: string[],                   // What to bring
  photos: string[],                    // Image URLs
  discount: { type: string, value: number },
  promoCode: string | null,
  rating: number,
  isDraft: boolean,
  status: string,
  hostId: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Services Listing Fields
```javascript
{
  type: "services",
  title: string,                       // Service name
  description: string,                 // Description
  location: string,                    // Service location/area
  price: number,                       // Price per hour
  duration: number,                    // Duration in hours
  category: string,                    // Service category
  responseTime: string,                // Response time (e.g., "within 1 hour")
  photos: string[],                    // Image URLs
  serviceTypes: string[],              // e.g., ["Deep Cleaning"]
  highlights: string[],                // Key features
  serviceAreas: string[],              // Geographic areas served
  certifications: string[],            // Professional certifications
  terms: string[],                     // Terms and conditions
  experienceYears: number,             // Years of experience
  completedJobs: number,               // Completed jobs count
  availableDates: [{                   // Availability ranges
    startDate: string,
    endDate: string
  }],
  discount: { type: string, value: number },
  promoCode: string | null,
  isVerified: boolean,
  isDraft: boolean,
  status: string,
  hostId: string,
  created_at: timestamp,
  updated_at: timestamp
}
```

### Field Naming Convention
The database uses `hostId` (camelCase) for storing the host/seller's user ID in listing documents.

---

## Bookings Data Structure

Bookings are stored in the `bookings` collection with the following fields:

```javascript
{
  type: string,                        // "stays" | "experiences" | "services"
  listing_id: string,                  // Reference to listing
  hostId: string,                      // Host user ID
  guest_id: string,                    // Guest user ID
  guestName: string,                   // Guest's full name
  checkIn: string,                     // "YYYY-MM-DD" (stays only)
  checkOut: string,                    // "YYYY-MM-DD" (stays only)
  selectedDateTime: {                  // (experiences/services)
    date: string,                      // "YYYY-MM-DD"
    time: string                       // "HH:MM"
  },
  totalGuests: number,                 // Number of guests/participants
  numberOfGuests: number,              // Number of guests (stays only)
  numberOfAdults: number,              // Number of adults
  numberOfChildren: number,            // Number of children
  numberOfInfants: number,             // Number of infants
  totalAmount: number,                 // Total booking amount
  pointsUsed: number,                  // Points used for discount (if any)
  status: string,                      // "pending" | "confirmed" | "rejected" | "refund_requested" | "refunded"
  createdAt: timestamp,                // Booking creation time
  confirmedAt: timestamp,              // When host confirmed
  rejectionReason: string,             // Reason for rejection
  rejectedAt: timestamp,               // When rejected
  refund_requested_at: timestamp,      // When guest requested refund
  refund_request_reason: string,       // Guest's reason for refund
  refund_approved_at: timestamp,       // When refund was approved
  refund_denied_at: timestamp,         // When refund was denied
  refund_denial_reason: string,        // Why refund was denied
  listing: {                           // Embedded listing data
    title: string,
    type: string,
    price: number
  }
}
```

### Booking Status Flow
1. **pending** - Guest creates booking, awaits host confirmation
2. **confirmed** - Host accepts booking, payment deducted
3. **rejected** - Host rejects booking
4. **refund_requested** - Guest requests refund
5. **refunded** - Refund approved by host

---

## Notifications Data Structure

Notifications are stored in the `notifications` collection:

```javascript
{
  userId: string,                      // Recipient user ID
  guestId: string,                     // Guest involved in notification
  guestName: string,                   // Guest name (optional)
  guestAvatar: string | null,          // Guest avatar URL (optional)
  type: string,                        // Notification type
  title: string,                       // Short title
  message: string,                     // Detailed message
  listingId: string,                   // Related listing ID
  bookingId: string,                   // Related booking ID
  isRead: boolean,                     // Whether read
  createdAt: timestamp                 // Creation timestamp
}
```

### Notification Types
| Type | Recipient | Trigger |
|------|-----------|---------|
| `booking` | Host | Guest creates booking |
| `booking_confirmed` | Guest | Host confirms booking |
| `booking_rejected` | Guest | Host rejects booking |
| `refund_requested` | Host | Guest requests refund |
| `refund_approved` | Guest | Host approves refund |
| `refund_denied` | Guest | Host denies refund |
| `payment` | Guest | Payment deducted |
| `message` | Either party | New message |
| `review` | Host | Guest leaves review |
| `alert` | Either party | System alerts |

---

## Points & Rewards System

### Overview
Gamification and monetization feature that incentivizes bookings while allowing hosts to unlock additional listing capabilities.

### Configuration
```javascript
POINTS_CONFIG = {
  POINTS_PER_BOOKING: 10,              // Points earned per confirmed booking
  POINT_TO_PESO_RATIO: 1,              // 1 point = 1 peso
  INITIAL_LISTING_LIMIT_PER_CATEGORY: 3,  // Starting limit per category
  LISTING_LIMIT_INCREASE: 5,           // Increase per upgrade
  LISTING_LIMIT_UPGRADE_COST: 500,     // ₱500 per upgrade
}
```

### Rewards Collection Structure
```javascript
{
  userId: string,                      // User ID
  role: string,                        // "guest" or "host"
  totalPoints: number,                 // Cumulative points earned
  availablePoints: number,             // Points available to redeem
  redeemedPoints: number,              // Total points redeemed
  pointsHistory: [
    {
      bookingId: string,               // Reference to booking
      pointsEarned: number,            // Points awarded
      listingType: string,             // "stays", "experiences", "services"
      source: string,                  // "booking_completion"
      createdAt: timestamp
    }
  ],
  listingLimits: {
    stays: number,                     // Current limit for stays
    experiences: number,               // Current limit for experiences
    services: number                   // Current limit for services
  },
  listingUpgrades: {
    stays: number,                     // Times upgraded
    experiences: number,
    services: number
  },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Key Features
- ✅ Automatic point awarding on booking confirmation (host + guest)
- ✅ Listing limits per category (starts at 3)
- ✅ Point redemption for listing limit upgrades
- ✅ Hybrid payment (points + wallet) for upgrades
- ✅ Points history tracking
- ✅ New host initialization

### Utility Functions (src/utils/rewardsUtils.js)

**`initializeUserRewards(userId, role)`**
- Initializes rewards document for new user

**`getUserRewards(userId)`**
- Fetches user's rewards data by querying `where("userId", "==", userId)`
- Returns object with document ID: `{ id: docId, ...data }`

**`addPointsToUser(userId, bookingId, listingType, pointsAmount)`**
- Awards points for completed booking
- Properly uses DocumentReference: `doc(db, "rewards", userRewards.id)`

**`redeemPointsForListingUpgrade(userId, listingType, pointsToRedeem)`**
- Redeems points for listing limit upgrade
- Validates sufficient points available
- Updates listing limits and points history

**`canCreateListing(userId, listingType)`**
- Checks if user can create new listing
- Returns: `{ canCreate, currentCount, limit, remainingSlots }`

**`formatPoints(points)`**
- Formats points for display with commas

---

## Refund System

### Overview
Two-tier approval process where guests request refunds and hosts approve/deny them. Points earned from bookings are deducted on approval.

### Booking Status Flow for Refunds
```
confirmed
   ↓
refund_requested (guest initiates)
   ├→ approved → refunded (points deducted)
   └→ denied → confirmed (booking continues)
```

### Features
- **Guest-Initiated**: Can request refund on confirmed bookings before check-in
- **Host Approval/Denial**: Hosts approve or deny with optional reason
- **Money Flow**: Full refund (including 5% service fee) returned to guest wallet
- **Points Deduction**: Both guest and host lose 10 points on approval
- **Notifications**: Guests and hosts notified at each stage

### Utility Functions (src/utils/refundUtils.js)

**`requestRefund(bookingId, guestId, reason)`**
- Submits refund request from guest
- Validates: confirmed status, future check-in date
- Creates host notification

**`approveRefund(bookingId, hostId)`**
- Host approves refund request
- Returns money to guest wallet
- Deducts points from both users
- Frees up booked dates
- Creates guest notification

**`denyRefund(bookingId, hostId, reason)`**
- Host denies refund request
- Reverts booking to confirmed
- No money returned, no points deducted
- Creates guest notification with reason

---

## Firestore Collections Reference

### Collections Overview
1. **bookings** - Guest booking records
2. **conversations** - User messaging conversations
3. **coupons** - Discount coupons
4. **favorites** - User favorite listings
5. **listings** - Property/service listings
6. **messages** - Messages within conversations
7. **notifications** - User notifications
8. **reviews** - Booking/listing reviews
9. **transactions** - Wallet transactions
10. **users** - User profiles
11. **wallets** - User wallet balances
12. **rewards** - Points & rewards documents
13. **refunds** - Historical refund records

### Key Relationships
| Collection | References |
|------------|-----------|
| bookings | → users (guest_id, hostId), listings (listing_id) |
| conversations | → users (participants array) |
| messages | → users (senderId) |
| favorites | → users (guest_id), listings (listing_id) |
| reviews | → listings, users (guest_id), bookings |
| transactions | → users (user_id), wallets (wallet_id) |
| wallets | → users (user_id) |
| rewards | → users (userId field) |
| notifications | → users (userId) |

---

## Privacy Policy & Terms of Service

### Overview
BookingNest is committed to protecting user privacy and ensuring transparent, fair business practices.

### Service Fee Structure
| Transaction Type | Fee | Payer | When Charged |
|---|---|---|---|
| Guest Booking | 5% | Guest | Upon booking confirmation |
| Host Listing | ₱0 | None | Free unlimited listings |
| Host Withdrawal | 0% | None | No fees |
| Wallet Refund | 0% | None | No processing fee |

### GUEST POLICY HIGHLIGHTS

#### Booking Process
1. Guest creates booking with status: PENDING
2. Host receives notification
3. Payment NOT deducted until host confirms
4. Host confirms → payment deducted + 5% service fee charged

#### Refund Rights
- **Can Request**: Before check-in date
- **Host Approval**: Full refund (including 5% fee) to wallet
- **Host Denial**: No refund, booking continues
- **Timeline**: 24-48 hours processing

#### E-Wallet Features
- Fund using PayPal
- No additional fees for funding (PayPal rates apply)
- Used for all booking payments
- Full transaction history available

### HOST POLICY HIGHLIGHTS

#### Listing Management
- Unlimited listings (stays, experiences, services)
- NO creation fees
- NO subscription fees
- Can edit, deactivate, or delete anytime

#### Commission Structure
- **5% service fee per confirmed booking**
- Fee PAID BY GUEST, not deducted from host
- Example: ₱1,000 booking = Host receives ₱1,000, Guest pays ₱1,050

#### Booking Management
- Respond to requests within 24 hours
- Accept: Confirms booking, processes payment
- Reject: Provides rejection reason, no payment charged

#### Refund Handling
- **Full Control**: Can approve or deny refund requests
- **No Charge**: Host not charged for refunds
- **Timeline**: Respond within 24 hours

### PAYMENT & FINANCIAL TERMS
- **Currency**: Philippine Peso (₱)
- **Payment Methods**: PayPal integration only
- **Host Payouts**: Bank transfer (via PayPal)
- **Frequency**: Weekly or monthly (configurable)
- **Processing**: 3-5 business days

### DATA RETENTION
- Active bookings: Indefinitely
- Cancelled bookings: 7 years (legal requirement)
- Messages: 2 years after account closure
- Financial records: 7 years (tax/legal)

### Last Updated
October 29, 2025

---

## Development Commands

```bash
# Frontend
npm run dev      # Start development server (port 5173)
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint

# Backend Server (PayPal)
cd server
npm install      # Install dependencies
node index.js    # Start PayPal server on port 5000
```

---

## Recent Updates & Implementation

### Points & Rewards System (Oct 2025)
- ✅ **Fixed**: `rewardsUtils.js` - All functions now properly use DocumentReference
- ✅ **initializeUserRewards()**: Now uses `addDoc` for new documents
- ✅ **addPointsToUser()**: Simplified logic, uses `doc(db, "rewards", userRewards.id)`
- ✅ **redeemPointsForListingUpgrade()**: Already correct with proper DocumentReference usage

**Key Fix**: All functions now correctly handle the `userId` as a field (not document ID) in rewards collection

### Refund System (Oct 2025)
- ✅ Guest refund request workflow
- ✅ Host approval/denial with optional reasons
- ✅ Automatic point deduction on approval
- ✅ Wallet management for refunds
- ✅ Notification system integration

### Authentication Modal System
- ✅ Modal-based auth (no page redirects)
- ✅ 4-step signup flow with progress bar
- ✅ Policy acceptance with mandatory scroll
- ✅ Guest/Host role-specific policies
- ✅ Responsive mobile design
- ✅ Smooth animations with Framer Motion

### Recent Features
- Messaging system completed
- Profile functionality completed
- Search with advanced filters
- Real-time notifications
- Mobile sidebar with animations
- Email confirmation (EmailJS integration)
- Receipt printing
- Booking management dashboard

---

## Important Notes

1. **No TypeScript**: JavaScript exclusively
2. **Firebase First**: All database, auth, storage through Firebase
3. **Separate PayPal Server**: Independent Node.js server for payments
4. **Offline Persistence**: Firestore offline cache enabled
5. **ES Modules**: Both frontend and server use `"type": "module"`
6. **React 19**: Latest features and patterns
7. **Path Alias**: `@/` → `./src/`

---

## Field Naming Standards

- **Listing Host Reference**: `hostId` (camelCase)
- **Rewards User Reference**: `userId` (camelCase, as field in rewards document)
- **Booking References**: `listing_id`, `guest_id`, `hostId` (mixed for consistency)
- **Wallet User Reference**: `user_id` (snake_case)

---

## Security Considerations

### Frontend
- Environment variables for sensitive data
- Input validation on all forms
- XSS protection via React escaping
- CSRF protection for submissions

### Backend
- Firebase Auth for secure authentication
- Firestore security rules enforcement
- CORS headers configuration
- Rate limiting on APIs

### Data Protection
- HTTPS only communication
- Firebase Storage security rules
- Encrypted payment processing
- PII handling compliance

---

## Performance Metrics

### Build Performance
- Build time: ~8-9 seconds
- CSS size: 113KB (gzipped: 22KB)
- JS size: 1.9MB (gzipped: 461KB)
- Modules transformed: 2864

### Runtime Targets
- Largest Contentful Paint (LCP): < 2.5s
- First Input Delay (FID): < 100ms
- Cumulative Layout Shift (CLS): < 0.1

---

## Deployment Checklist

- [ ] Build succeeds without errors
- [ ] No console warnings in production
- [ ] Environment variables configured
- [ ] Firebase security rules updated
- [ ] PayPal keys configured
- [ ] EmailJS credentials set
- [ ] Analytics enabled
- [ ] Backup strategy in place

---

## Contact & Support

For issues, questions, or documentation:
- **GitHub Issues**: Report bugs and feature requests
- **Email**: support@bookingnest.com
- **Documentation**: See CLAUDE.md (this file)

**For UI Component Reference**: See Shadcn UI docs at https://ui.shadcn.com/
**For Animations**: See Framer Motion docs at https://www.framer.com/motion/

---

**Document Version**: 2.0
**Last Updated**: October 31, 2025
**Maintained By**: Development Team
