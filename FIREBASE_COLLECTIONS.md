# Firebase Firestore Collections

## Database Structure

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

---

## Collection Details

### 1. **bookings**
Stores booking information for stays and experiences.

**Sample Document: `kRAVfBvcWnHsyIIFTAIY`**
```
checkIn: October 23, 2025 at 8:00:00 AM UTC+8
checkOut: October 24, 2025 at 8:00:00 AM UTC+8
confirmedAt: October 22, 2025 at 11:23:53 AM UTC+8
createdAt: October 22, 2025 at 11:21:58 AM UTC+8
guest_id: "ErRQ65M2kPVnvhroCE5mJyVChK2"
guests: 2
host_id: "zMTaTdy8NNYXt9xUhJuLhHvWBkJ2"
listing_id: "JTtD3Ys7onugA5403iWg"
serviceFee: 200
status: "confirmed"
totalAmount: 2200
```

**Fields:**
- `checkIn` - Check-in date (Timestamp)
- `checkOut` - Check-out date (Timestamp)
- `confirmedAt` - When host confirmed booking (Timestamp)
- `createdAt` - When booking was created (Timestamp)
- `guest_id` - Reference to guest user
- `guests` - Number of guests (Number)
- `host_id` - Reference to host user
- `listing_id` - Reference to listing
- `serviceFee` - Service fee amount (Number)
- `status` - "pending", "confirmed", or "rejected" (String)
- `totalAmount` - Total booking amount (Number)

---

### 2. **conversations**
Stores messaging conversations between users.

**Sample Document: `3rgbdUNFJ1N5HovFA1r4`**
Contains subcollection: `messages`

**Fields:**
- `createdAt` - When conversation started (Timestamp)
- `lastMessage` - Last message text (String)
- `participants` - Array of user IDs (Array)
  - Example: `["zaH1m5bxEQ021cMP2VlTvm5sJuB3", "QkWEQDfdvbcxGGDFJua4CmTvwvi2"]`
- `updatedAt` - Last updated (Timestamp)

**Subcollection: `messages`**
- `createdAt` - Message creation time (Timestamp)
- `senderId` - User who sent message (String)
- `text` - Message content (String)

---

### 3. **coupons**
Discount coupons for bookings.

**Fields:** (To be documented based on usage)

---

### 4. **favorites**
User's favorite listings.

**Fields:**
- `guest_id` - User ID who favorited
- `listing_id` - Listing ID
- `createdAt` - When favorited (Timestamp)

---

### 5. **listings**
All property and service listings created by hosts.

**Fields:** (To be documented - likely includes):
- `title` - Listing title (String)
- `type` - "stays", "experiences", or "services" (String)
- `host_id` - Host user ID (String)
- `location` - Location (String)
- `price` - Price per night/session (Number)
- `photos` - Array of photo URLs (Array)
- `description` - Listing description (String)
- `amenities` - List of amenities (Array)
- `numberOfGuests` - Max guests (Number)
- `isDraft` - Draft status (Boolean)
- `createdAt` - Creation timestamp (Timestamp)
- `rating` - Average rating (Number)
- `availableDate` - Object with `from` and `to` dates (Object with Timestamp)

---

### 6. **messages**
Individual messages (may be organized under conversations).

**Fields:**
- `createdAt` - Message timestamp (Timestamp)
- `senderId` - User ID who sent message (String)
- `text` - Message content (String)

---

### 7. **notifications**
User notifications for bookings, messages, etc.

**Fields:** (Likely includes):
- `user_id` - Recipient user ID (String)
- `type` - "booking_confirmed", "booking_rejected", etc. (String)
- `title` - Notification title (String)
- `message` - Notification message (String)
- `read` - Whether read (Boolean)
- `createdAt` - When created (Timestamp)

---

### 8. **reviews**
Reviews for bookings and listings.

**Fields:** (To be documented):
- `listing_id` - Listing reviewed (String)
- `booking_id` - Booking reference (String)
- `guest_id` - Reviewer user ID (String)
- `rating` - Star rating (Number)
- `comment` - Review text (String)
- `createdAt` - Creation timestamp (Timestamp)

---

### 9. **transactions**
Wallet transaction history.

**Fields:** (Likely includes):
- `user_id` - User who made transaction (String)
- `wallet_id` - Wallet reference (String)
- `type` - "payment", "refund", "topup" (String)
- `amount` - Transaction amount (Number)
- `status` - "completed", "pending" (String)
- `created_at` - Transaction time (Timestamp)

---

### 10. **users**
User profiles and authentication data.

**Fields:** (Likely includes):
- `email` - User email (String)
- `fullName` - User full name (String)
- `photoURL` - Profile photo URL (String)
- `phone` - Phone number (String)
- `role` - "guest" or "host" (String)
- `isVerified` - Email/phone verified (Boolean)
- `createdAt` - Account creation (Timestamp)

---

### 11. **wallets**
User wallet balances and payment info.

**Fields:** (Likely includes):
- `user_id` - User reference (String)
- `balance` - Current balance (Number)
- `total_spent` - Total spent (Number)
- `total_cash_in` - Total funded (Number)
- `createdAt` - When created (Timestamp)

---

## Key Relationships

| Collection | References |
|------------|-----------|
| bookings | → users (guest_id, host_id), listings (listing_id) |
| conversations | → users (participants array) |
| messages | → users (senderId) |
| favorites | → users (guest_id), listings (listing_id) |
| reviews | → listings (listing_id), users (guest_id), bookings (booking_id) |
| transactions | → users (user_id), wallets (wallet_id) |
| wallets | → users (user_id) |

---

## Notes

- All timestamps use Firestore `serverTimestamp()`
- User IDs are Firebase Authentication UIDs
- Listing types are: "stays", "experiences", "services"
- Booking statuses: "pending", "confirmed", "rejected"
- Photos are stored as URLs (Cloudinary/UploadThing)
- Real-time listeners used for notifications and conversations
