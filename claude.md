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

## Recent Development Activity

Based on git history:
- Messaging system completed
- Profile functionality completed
- Minor fixes and improvements ongoing
- Active development on main branch
