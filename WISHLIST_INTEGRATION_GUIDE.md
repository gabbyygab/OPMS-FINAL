# Wishlist Feature Integration Guide

## Overview
The wishlist feature allows guests to save listings (stays, experiences, and services) with customizable filters based on their preferences. All wishlist data is stored in Firestore with type-specific filter schemas.

## Features Implemented

### 1. **WishlistModal Component** (`src/components/guest/WishlistModal.jsx`)
Modal interface for adding items to wishlist with type-specific filters:

- **For Stays**: Bedrooms, bathrooms, amenities, guest count
- **For Experiences**: Category, duration, activities, participant count
- **For Services**: Service type, category, max price, duration
- **Common**: Notes/custom remarks

### 2. **useWishlist Hook** (`src/hooks/useWishlist.js`)
Custom React hook for managing wishlist operations:

```javascript
// Usage:
const {
  wishlist,           // Array of wishlist items
  loading,            // Loading state
  error,              // Error state
  addToWishlist,      // Add item with filters
  removeFromWishlist, // Remove item
  isInWishlist,       // Check if item exists
  getWishlistItem,    // Get specific item
  filterByType,       // Filter by type
  groupByType,        // Group items by type
  searchWishlist,     // Search items
  filterWishlist      // Custom filtering
} = useWishlist(userId);
```

### 3. **WishlistButton Component** (`src/components/guest/WishlistButton.jsx`)
Reusable button component for adding/removing items from wishlist:

- Shows filled heart when item is in wishlist
- Opens modal with filters when clicked
- Real-time sync with Firestore
- User authentication check

### 4. **WishlistPage Component** (`src/pages/guest/WishlistPage.jsx`)
Full page to view and manage wishlist items:

- Display all saved items with filters
- Filter by type (stays, experiences, services)
- Search functionality
- Item removal
- Shows saved filter preferences
- Item count statistics

## Firestore Collection Structure

### Collection: `wishlist`

```javascript
{
  // Document ID: Auto-generated

  // User Reference
  userId: string,                    // Guest user ID

  // Item Reference
  itemId: string,                    // Original listing ID
  type: "stays" | "experiences" | "services",

  // Item Details (snapshot for display)
  title: string,                     // Listing title
  price: number,                     // Price
  location: string,                  // Location/address
  image: string,                     // Primary image URL
  hostId: string,                    // Host user ID (for reference)

  // Filters Object (flexible structure for different types)
  filters: {
    // ===== FOR STAYS =====
    bedrooms?: number,               // Number of bedrooms
    bathrooms?: number,              // Number of bathrooms
    beds?: number,                   // Total beds
    amenities?: string[],            // Selected amenities
    guests?: number,                 // Expected guest count

    // ===== FOR EXPERIENCES =====
    category?: string,               // Experience category
    duration?: string | number,      // Duration in hours
    maxGuests?: number,              // Number of participants
    activities?: string[],           // Activities included

    // ===== FOR SERVICES =====
    serviceTypes?: string[],         // Types of services
    maxPrice?: number,               // Maximum price limit

    // ===== COMMON =====
    notes?: string                   // User's custom notes
  },

  // Timestamps
  createdAt: Timestamp,              // When added to wishlist
  updatedAt: Timestamp               // Last updated
}
```

### Example Documents

#### Stays Example:
```javascript
{
  userId: "abc123",
  itemId: "listing_001",
  type: "stays",
  title: "Luxury Beach House",
  price: 5000,
  location: "Boracay, Philippines",
  image: "https://...",
  hostId: "host_001",
  filters: {
    bedrooms: 4,
    bathrooms: 3,
    amenities: ["WiFi", "Pool", "Kitchen"],
    guests: 8,
    notes: "Perfect for family vacation"
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### Experiences Example:
```javascript
{
  userId: "abc123",
  itemId: "listing_002",
  type: "experiences",
  title: "Mountain Hiking Adventure",
  price: 2000,
  location: "Batangas",
  image: "https://...",
  hostId: "host_002",
  filters: {
    category: "Adventure",
    duration: "4-8",
    activities: ["Hiking", "Photography"],
    maxGuests: 6,
    notes: "Interested in sunset tour"
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### Services Example:
```javascript
{
  userId: "abc123",
  itemId: "listing_003",
  type: "services",
  title: "Home Repair Service",
  price: 1500,
  location: "Metro Manila",
  image: "https://...",
  hostId: "host_003",
  filters: {
    serviceTypes: ["Plumbing", "Electrical"],
    category: "Home Services",
    maxPrice: 3000,
    duration: 2,
    notes: "Need expert in water leakage"
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Integration Steps

### Step 1: Add Wishlist Route
✅ Already added to `src/constants/routes.js`:
```javascript
GUEST: {
  ...
  WISHLIST: "/guest/wishlist",
  ...
}
```

### Step 2: Add Route to App.jsx
Add the following route to your routing configuration:

```javascript
import WishlistPage from "./pages/guest/WishlistPage";

// In your route configuration:
<Route path="/guest/wishlist" element={<WishlistPage />} />
```

### Step 3: Add WishlistButton to Listing Cards
Use the `WishlistButton` component in your listing cards:

```javascript
import WishlistButton from "./components/guest/WishlistButton";

// In your listing card component:
<div className="absolute top-4 right-4">
  <WishlistButton listing={listing} />
</div>
```

### Step 4: Add Wishlist Link to Navigation
Add a link to the wishlist page in guest navigation (NavigationBar.jsx or profile dropdown):

```javascript
<Link
  to={ROUTES.GUEST.WISHLIST}
  className="flex items-center gap-2 text-slate-300 hover:text-white"
>
  <Heart className="w-5 h-5" />
  My Wishlist
</Link>
```

## Usage Examples

### Adding to Wishlist
```javascript
import { useWishlist } from "../hooks/useWishlist";

function ListingCard({ listing, userData }) {
  const { addToWishlist } = useWishlist(userData.id);

  const handleAddWishlist = async (filters) => {
    try {
      await addToWishlist(listing, filters);
      // Success - modal will show and close
    } catch (error) {
      console.error("Error:", error);
    }
  };
}
```

### Checking if Item is in Wishlist
```javascript
function ListingCard({ listing, userData }) {
  const { isInWishlist } = useWishlist(userData.id);

  return (
    <div>
      {isInWishlist(listing.id) && (
        <span className="text-red-500">Already in wishlist!</span>
      )}
    </div>
  );
}
```

### Filtering Wishlist by Type
```javascript
function WishlistSummary({ userData }) {
  const { filterByType } = useWishlist(userData.id);

  const stays = filterByType("stays");
  const experiences = filterByType("experiences");
  const services = filterByType("services");

  return (
    <div>
      <p>Stays: {stays.length}</p>
      <p>Experiences: {experiences.length}</p>
      <p>Services: {services.length}</p>
    </div>
  );
}
```

## Firestore Indexes (if needed)

The following indexes might be required for optimal query performance:

### Index 1: User Wishlist Query
- Collection: `wishlist`
- Fields: `userId` (Ascending), `createdAt` (Descending)

### Index 2: User + Type Query
- Collection: `wishlist`
- Fields: `userId` (Ascending), `type` (Ascending), `createdAt` (Descending)

## File Structure

```
src/
├── components/
│   └── guest/
│       ├── WishlistModal.jsx       # Modal with type-specific filters
│       └── WishlistButton.jsx      # Reusable heart button
├── hooks/
│   └── useWishlist.js             # Firestore operations hook
├── pages/
│   └── guest/
│       └── WishlistPage.jsx        # Wishlist display page
└── constants/
    └── routes.js                   # Updated with WISHLIST route
```

## Features Available

### Wishlist Operations
- ✅ Add to wishlist with custom filters
- ✅ Remove from wishlist
- ✅ Check if item is in wishlist
- ✅ Real-time sync with Firestore

### Display & Filter
- ✅ Filter by type (stays/experiences/services)
- ✅ Search by title or location
- ✅ Group by type
- ✅ Custom filtering

### User Interface
- ✅ Modal for adding with filters
- ✅ Heart button for quick add/remove
- ✅ Full page view with statistics
- ✅ Filter visualization on cards

## Security Rules (Firestore)

Add these rules to your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /wishlist/{document=**} {
      // Only authenticated users can read their own wishlist
      allow read: if request.auth.uid == resource.data.userId;

      // Only authenticated users can create their own wishlist items
      allow create: if request.auth.uid == request.resource.data.userId;

      // Only users can delete their own items
      allow delete: if request.auth.uid == resource.data.userId;

      // No updates allowed (use delete + create pattern)
      allow update: if false;
    }
  }
}
```

## Performance Considerations

1. **Real-time Updates**: `useWishlist` uses `onSnapshot` for real-time sync
2. **Index Usage**: Queries use indexed fields for fast retrieval
3. **Pagination**: Not implemented (consider adding for large wishlists)
4. **Lazy Loading**: Consider implementing for wishlist page with many items

## Future Enhancements

- [ ] Export wishlist to PDF
- [ ] Share wishlist with friends
- [ ] Wishlist categories/folders
- [ ] Price alerts for wishlist items
- [ ] Wishlist recommendations
- [ ] Wishlist statistics and insights

## Troubleshooting

### Modal not appearing
- Check `WishlistModal` import in your listing component
- Verify `listing` prop structure matches schema

### Firestore queries failing
- Ensure user is authenticated
- Check Firestore security rules
- Verify collection name is exactly `wishlist` (lowercase)

### Real-time updates not working
- Check network connection
- Verify Firestore persistence enabled
- Check browser console for errors

### Filters not saving
- Ensure `filters` object structure matches type
- Verify `addToWishlist` is called with correct params

## Support

For issues or questions:
1. Check the collection structure in Firestore console
2. Review Firestore security rules
3. Check browser console for errors
4. Verify all imports are correct

---

**Last Updated**: October 29, 2025
**Status**: ✅ Complete and Ready for Integration
