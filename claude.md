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

## Bookings Data Structure

Bookings are stored in the `bookings` collection with the following fields:

```javascript
{
  type: string,                        // "stays" | "experiences" | "services"
  listing_id: string,                  // Reference to the listing (stays/experiences/services)
  hostId: string,                      // Host user ID
  guest_id: string,                    // Guest user ID
  guestName: string,                   // Guest's full name
  checkIn: string,                     // "YYYY-MM-DD" (stays only)
  checkOut: string,                    // "YYYY-MM-DD" (stays only)
  selectedDateTime: {                  // (experiences/services)
    date: string,                      // "YYYY-MM-DD"
    time: string                       // "HH:MM" (e.g., "09:00")
  },
  totalGuests: number,                 // Number of guests/participants
  numberOfGuests: number,              // Number of guests (stays only)
  numberOfAdults: number,              // Number of adults (stays only)
  numberOfChildren: number,            // Number of children (stays only)
  numberOfInfants: number,             // Number of infants (stays only)
  totalAmount: number,                 // Total booking amount (calculated during confirmation)
  status: string,                      // "pending" | "confirmed" | "rejected"
  createdAt: timestamp,                // Booking creation timestamp
  confirmedAt: timestamp,              // When host confirmed the booking
  rejectionReason: string,             // Reason for rejection (if rejected)
  rejectedAt: timestamp,               // When host rejected the booking
  listing: {                           // Embedded listing data for quick access
    title: string,
    type: string,
    price: number
  }
}
```

### Booking Status Flow
1. **pending** - Guest creates booking, awaits host confirmation
2. **confirmed** - Host accepts booking, payment is processed, guest notified
3. **rejected** - Host rejects booking, guest notified with reason

## Notifications Data Structure

Notifications are stored in the `notifications` collection with the following fields:

```javascript
{
  userId: string,                      // User who should receive the notification (host or guest)
  guestId: string,                     // ID of the guest involved in the notification
  guestName: string,                   // Name of the guest (optional, for quick display)
  guestAvatar: string | null,          // Avatar URL of guest (optional)
  type: string,                        // Notification type: "booking" | "booking_confirmed" | "booking_rejected" | "payment" | "message" | "review" | "alert"
  title: string,                       // Short notification title
  message: string,                     // Detailed notification message
  listingId: string,                   // Reference to related listing
  bookingId: string,                   // Reference to related booking
  isRead: boolean,                     // Whether notification has been read
  createdAt: timestamp                 // Creation timestamp
}
```

### Notification Types and Recipients

| Type | Recipient | Trigger | Example |
|------|-----------|---------|---------|
| `booking` | Host | Guest creates a new booking | "Guest has booked your property" |
| `booking_confirmed` | Guest | Host confirms the booking & payment succeeds | "Your booking has been confirmed" |
| `booking_rejected` | Guest | Host rejects the booking | "Your booking was rejected" |
| `payment` | Guest | Payment deducted from wallet during confirmation | "₱5,000 has been deducted from your wallet" |
| `message` | Either party | New message in conversation | User receives message notifications |
| `review` | Host | Guest leaves a review | "Guest left a review on your listing" |
| `alert` | Either party | System alerts | Generic system notifications |

### Key Design Principles

1. **Single userId Field**: Each notification has ONE `userId` field that identifies who should receive it:
   - For booking notifications: `userId` = Host's ID
   - For confirmation/rejection/payment notifications: `userId` = Guest's ID

2. **Guest Information Included**: All notifications include `guestId` and optionally `guestName` and `guestAvatar` for context

3. **Querying**: Notifications are queried using:
   ```javascript
   const q = query(
     collection(db, "notifications"),
     where("userId", "==", userData.id),
     orderBy("createdAt", "desc")
   );
   ```

## Privacy Policy & Terms of Service

### Overview
BookingNest is committed to protecting user privacy and ensuring transparent, fair business practices. This policy outlines how data is collected, used, and protected, along with terms governing bookings, payments, cancellations, and refunds.

---

## GUEST PRIVACY POLICY & TERMS

### 1. Data Collection & Privacy

#### Information We Collect
- **Account Information**: Full name, email address, phone number, profile photo
- **Payment Information**: Wallet balance, transaction history, payment methods (processed through PayPal)
- **Booking Information**: Check-in/check-out dates, number of guests, selected listings, booking preferences
- **Location Data**: Search locations, saved addresses
- **Communication Data**: Messages with hosts, reviews, ratings

#### Data Usage
- To facilitate bookings and payments
- To provide customer support via messages
- To send booking confirmations and notifications
- To improve service recommendations
- To comply with legal obligations

#### Data Security
- All payment data is processed through PayPal's secure servers
- Passwords are encrypted and never stored in plaintext
- Firebase Firestore encryption at rest is enabled
- Access to personal data is restricted to authorized staff

---

### 2. Booking Policy for Guests

#### Creating a Booking
1. Guest browses listings (stays, experiences, or services)
2. Guest selects dates/times and number of guests
3. Guest reviews total amount including service fee (5% of booking amount)
4. Booking is created with status: **PENDING**
5. Host receives notification to confirm or reject booking
6. Payment is **NOT deducted until host confirms** the booking

#### Booking Confirmation Process
1. Host reviews guest information and booking details
2. Host either:
   - **Confirms**: Booking status changes to CONFIRMED, payment is deducted from guest wallet
   - **Rejects**: Booking status changes to REJECTED, guest is notified with reason
3. Once confirmed, guest receives notification with confirmation details

#### Service Fee
- **5% service fee** is charged on every confirmed booking
- Service fee is deducted from the booking amount to the platform (admin)
- Guest pays: `Booking Amount + (Booking Amount × 0.05)`
- Example: ₱1,000 booking = ₱1,050 total (₱50 service fee to admin)

---

### 3. Cancellation & Refund Policy for Guests

#### Cancellation Rights
- **Guest-initiated cancellation is NOT allowed without host approval**
- Guest must contact host or submit cancellation request
- Host can accept or deny cancellation request
- Cancellation requests are visible to hosts through notifications

#### Refund Process
1. Guest initiates cancellation request before booking date
2. Host receives notification of cancellation request
3. Host has right to:
   - **Approve**: Full refund (including service fee) returned to guest wallet
   - **Deny**: Booking remains confirmed, guest loses deposit

#### Refund Timeline
- Refunds are processed within 24-48 hours after host approval
- Refund amount includes full booking cost + 5% service fee
- Refunded amount is credited back to guest e-wallet

#### Non-Refundable Bookings
- Bookings within 24 hours of booking date: Host may deny refund
- No-show bookings: No refund (guest did not cancel)
- Cancelled by guest after checking in: No refund

---

### 4. Payment & Wallet for Guests

#### E-Wallet Features
- Guest can fund wallet using PayPal
- Wallet balance is used for booking payments
- No additional transaction fees for wallet funding (PayPal rates apply)
- Wallet transactions are tracked with full history

#### Payment Processing
1. Guest selects dates and confirms booking
2. Booking status: PENDING (no payment yet)
3. Host confirms booking
4. System deducts: `Booking Amount + (5% Service Fee)` from guest wallet
5. Guest receives confirmation notification

#### Payment Issues
- If insufficient wallet balance: Booking cannot be confirmed by host
- Guest must fund wallet before host can confirm
- Failed transactions are retried automatically

---

### 5. Guest Rights & Responsibilities

#### Guest Rights
- Right to view full booking details before confirmation
- Right to communicate with host via messages
- Right to submit cancellation requests
- Right to leave reviews and ratings
- Right to dispute unfair rejections

#### Guest Responsibilities
- Provide accurate personal information
- Fund wallet before host confirms booking
- Communicate respectfully with hosts
- Comply with host house rules/terms
- Appear for confirmed bookings on time

---

## HOST PRIVACY POLICY & TERMS

### 1. Data Collection & Privacy

#### Information We Collect
- **Account Information**: Full name, email, phone number, profile photo, bank account (for payouts)
- **Listing Information**: Titles, descriptions, photos, pricing, availability
- **Transaction Data**: Booking confirmations, payment received, commission deducted
- **Communication Data**: Messages with guests, support tickets
- **Location Data**: Listing addresses and locations

#### Data Usage
- To manage bookings and guest interactions
- To process payments and commission deductions
- To send booking notifications and confirmations
- To display listings on platform
- To prevent fraud and ensure compliance

#### Data Security
- Banking information encrypted and stored securely
- Payment processing through PayPal (PCI-DSS compliant)
- Access restricted to authorized staff and the host
- Data backups encrypted at rest

---

### 2. Listing & Commission Policy for Hosts

#### Creating Listings
- Hosts can create unlimited listings (stays, experiences, services)
- **NO charges for creating listings**
- **NO monthly subscription fees**
- Listings start as drafts and can be published when ready

#### Commission Structure
- **5% service fee per confirmed booking** (deducted from booking amount)
- Commission is paid by guest, not deducted from host earnings
- Example:
  - Guest books: ₱1,000
  - Service fee: ₱50 (5% to admin)
  - Host receives: ₱1,000 (full amount)
  - Guest pays: ₱1,050 total

#### Listing Management
- Hosts can edit, deactivate, or delete listings anytime
- Hosts can set custom availability windows
- Hosts can set custom pricing per season
- Hosts can add/remove photos and descriptions

---

### 3. Booking Management for Hosts

#### Incoming Bookings
- Hosts receive real-time notifications for new booking requests
- Booking includes:
  - Guest information and contact details
  - Check-in/check-out dates
  - Number of guests
  - Total booking amount

#### Confirmation Process
1. **Review**: Host reviews guest profile and booking details
2. **Accept/Reject**:
   - **Accept**: Booking status = CONFIRMED
     - Payment is immediately deducted from guest wallet
     - Host receives full booking amount (5% already deducted by guest)
   - **Reject**: Booking status = REJECTED
     - Host must provide rejection reason
     - No payment is charged to guest

#### Host Responsibilities
- Respond to booking requests within 24 hours
- Verify guest is legitimate before confirming
- Ensure listing availability matches booking dates
- Communicate any changes to confirmed guests

---

### 4. Cancellation & Refund Policy for Hosts

#### Host Authority
- **Hosts control all cancellation decisions**
- Guests cannot cancel without host approval
- Hosts receive cancellation requests with guest reason

#### Handling Cancellation Requests
1. Guest submits cancellation request
2. Host is notified and can:
   - **Approve**: Refund full amount (including 5% service fee) to guest
   - **Deny**: Booking remains confirmed, no refund issued

#### Refund from Host Perspective
- Host is **NOT** charged for refunds
- Refund amount includes the 5% service fee already deducted from guest
- Platform covers the service fee from admin account
- Host loses potential revenue from cancelled booking

#### Cancellation Timeline
- Host should respond to cancellation requests within 24 hours
- Refunds processed within 24-48 hours of approval
- Refund returned to guest wallet

---

### 5. Payment & Payouts for Hosts

#### Earning Money
- Host earns ₱X per booking (where X = full booking amount)
- 5% service fee is NOT deducted from host earnings
- Service fee is paid by guest, host receives 100%

#### Payout Process
- Host can view earnings in dashboard
- Payouts transferred to host bank account (via PayPal)
- **Frequency**: Weekly or monthly (configurable)
- **Processing time**: 3-5 business days after withdrawal request

#### Withdrawal Requirements
- Minimum balance: ₱500 (configurable)
- Valid bank account linked to account
- No pending disputes or chargebacks

#### Transaction History
- Hosts can view all transactions in e-wallet section
- Full breakdown of bookings and commissions
- Filters by date range, status, amount

---

### 6. Host Rights & Responsibilities

#### Host Rights
- Right to reject any booking without reason
- Right to set custom cancellation policies
- Right to control listing availability
- Right to receive full booking amount (no commission deduction)
- Right to block problematic guests

#### Host Responsibilities
- Maintain clean, accurate listing descriptions
- Respond to booking requests promptly
- Honor confirmed bookings (unless guest cancels)
- Treat guests fairly and respectfully
- Comply with local laws and regulations
- Maintain property/service quality standards

---

## PAYMENT & FINANCIAL TERMS

### Service Fee Structure
| Transaction Type | Fee | Payer | When Charged |
|---|---|---|---|
| Guest Booking | 5% | Guest | Upon booking confirmation by host |
| Host Listing | ₱0 | None | Free unlimited listings |
| Host Withdrawal | 0% | None | No withdrawal fees |
| Wallet Refund | 0% | None | No refund processing fee |

### Payment Methods
- **Guest Funding**: PayPal (via PayPal integration)
- **Payment Processing**: Automated via PayPal API
- **Host Payouts**: Direct bank transfer (PayPal)
- **Wallet Currency**: Philippine Peso (₱)

### Financial Security
- PCI-DSS compliant payment processing
- No sensitive data stored on BookingNest servers
- All transactions encrypted in transit
- Monthly reconciliation of accounts

---

## DISPUTE RESOLUTION

### Guest vs Host Disputes
1. **Mediation**: Platform team attempts to resolve amicably
2. **Evidence Review**: Both parties provide booking details, messages, evidence
3. **Decision**: Platform makes binding decision based on ToS
4. **Enforcement**: Refunds issued or bookings confirmed based on decision

### Chargeback Policy
- Guests disputing PayPal charges will result in investigation
- If found fraudulent, guest account will be banned
- Host receives full protection against chargebacks
- All transaction evidence preserved for disputes

---

## DATA RETENTION & DELETION

### Data Retention
- Active booking data: Retained indefinitely
- Cancelled booking data: Retained for 7 years (compliance)
- User messages: Retained for 2 years after account closure
- Financial records: Retained for 7 years (tax/legal)

### Right to Deletion
- Users can request data deletion
- Non-financial data deleted within 30 days
- Financial records retained per legal requirements
- Account deletion is permanent and irreversible

---

## POLICY UPDATES

- Last Updated: **October 29, 2025**
- Policies may be updated at any time
- Users are notified of major changes via email
- Continued use of platform = acceptance of updated policies
- Effective date: Updates take effect 7 days after notice

---

## Contact for Privacy Concerns

For privacy inquiries, disputes, or concerns:
- **Email**: support@bookingnest.com
- **Support Portal**: Access via account settings
- **Response Time**: Within 5 business days

---

## Authentication Modal System

### Overview
Modal-based authentication system with policy acceptance and progress tracking for both guest and host signups.

### New Components Created

#### 1. **PolicyAcceptanceModal.jsx**
- Location: `src/components/auth/PolicyAcceptanceModal.jsx`
- Features:
  - Displays guest or host-specific privacy policies
  - Scroll tracking - accept button only enabled after user reads all content
  - Shows role-specific terms and conditions
  - "Decline" and "I Accept & Continue" buttons
  - Loading state support
  - Beautiful gradient design with animations

#### 2. **ProgressBar.jsx**
- Location: `src/components/auth/ProgressBar.jsx`
- Features:
  - Shows 4-step signup progress (Choose Role → Enter Details → Accept Policies → Verify Email)
  - Visual progress bar with percentage
  - Completed steps show checkmarks
  - Current step highlighted in indigo
  - Responsive design (hides labels on mobile)
  - Step counter at bottom

#### 3. **RoleSelectionModal.jsx**
- Location: `src/components/auth/RoleSelectionModal.jsx`
- Features:
  - Guest vs Host role selection cards
  - Includes integrated progress bar (Step 1 of 4)
  - Shows role-specific benefits and features
  - Hover effects and smooth transitions
  - Cancel button to close without selecting
  - Beautiful gradient backgrounds

#### 4. **AuthModalContext.jsx**
- Location: `src/context/AuthModalContext.jsx`
- Purpose: Global state management for authentication modals
- State:
  - `showSignUpModal`: Signup modal visibility
  - `showSignInModal`: Signin modal visibility
  - `signUpRole`: Selected role ("guest" or "host")
  - `signUpStep`: Current signup step (1-4)
- Functions:
  - `openSignUp()`: Opens signup flow
  - `closeSignUp()`: Closes signup flow
  - `openSignIn()`: Opens signin flow
  - `closeSignIn()`: Closes signin flow
  - `selectSignUpRole(role)`: Sets role and moves to step 2
  - `moveToSignUpStep(step)`: Navigate to specific step

### Signup Flow (4 Steps)

1. **Step 1: Choose Role**
   - Display RoleSelectionModal
   - Show progress bar (1/4)
   - Guest vs Host selection
   - Cancel option available

2. **Step 2: Enter Details**
   - Full name, email, password, confirm password
   - Form validation
   - Show progress bar (2/4)
   - Next and Cancel buttons

3. **Step 3: Accept Policies**
   - Display PolicyAcceptanceModal
   - Show progress bar (3/4)
   - Role-specific policies
   - Scroll required to enable accept
   - Cannot proceed without acceptance

4. **Step 4: Verify Email**
   - OTP verification (integrates with existing flow)
   - Show progress bar (4/4)
   - Email confirmation code
   - Account creation completes

### Signin Flow (2 Steps)

1. **Step 1: Sign In Form**
   - Email and password input
   - Google OAuth option
   - Forgot password link
   - Cancel option

2. **Step 2: Accept Policies**
   - PolicyAcceptanceModal appears after successful signin
   - User must accept before full login
   - Scroll required to enable accept
   - Cannot proceed without acceptance

### Implementation Guide
See `AUTH_MODAL_IMPLEMENTATION_GUIDE.md` for detailed implementation instructions including:
- How to integrate with existing auth pages
- Creating SignUpModal and SignInModal wrappers
- Updating NavigationBar to use modals
- Adding AuthModalProvider to App
- Integration checklist
- Testing guide

### Key Features
✅ Modal-based authentication (no page redirects)
✅ Progress bar with visual feedback
✅ Policy acceptance with mandatory scroll
✅ Guest vs Host role-specific policies
✅ Accept button disabled until policies read
✅ Responsive mobile design
✅ Loading states and error handling
✅ Smooth animations and transitions
✅ Context-based state management
✅ Email OTP verification integration ready

---

## Recent Development Activity

Based on git history:
- Messaging system completed
- Profile functionality completed
- Search functionality enhanced with filters
- Admin logout functionality added
- Sample data seeding tool created
- Field naming standardization (host_id → hostId in listings)
- Notification system refactored to use single userId field
- Privacy policy and terms of service documented
- Notification badges implemented for guests and hosts
- Modal-based authentication system with policy acceptance
- Progress bar for signup steps implemented
- Active development on main branch
