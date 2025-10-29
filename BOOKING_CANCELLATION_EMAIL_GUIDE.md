# Booking Cancellation Email Implementation Guide

## Overview
This guide documents the implementation of guest booking cancellation emails in BookingNest. When guests cancel their bookings (pending or confirmed), they automatically receive a cancellation confirmation email with details about their cancellation and refund status.

---

## Files Created/Modified

### 1. **New Utility: `src/utils/sendBookingCancellationEmail.js`**
**Purpose**: Main function for sending booking cancellation emails to guests

**Key Features**:
- Supports all booking types: stays, experiences, services
- Handles both pending cancellations (no refund) and confirmed cancellations (with refund)
- Fallback email service support
- Type-specific date/time formatting
- Automatic calculation of refund amounts

**Function Signature**:
```javascript
async function sendBookingCancellationEmail(booking, guestData, options = {})
```

**Parameters**:
- `booking` (Object): Booking document with:
  - `id`: Booking ID
  - `type`: "stays", "experiences", or "services"
  - `listing`: Object with title, location, rating
  - `checkIn`/`checkOut`: For stays
  - `selectedDateTime`: For experiences/services
  - `totalAmount`: Booking amount
  - `totalGuests`/`numberOfGuests`: Number of guests

- `guestData` (Object):
  - `email`: Guest email address
  - `fullName`: Guest name

- `options` (Object) - Optional:
  - `cancellationReason`: Reason for cancellation
  - `basePrice`: Original booking amount
  - `serviceFee`: 5% fee amount
  - `refundAmount`: Amount being refunded
  - `cancellationFee`: Any additional fees (optional)

**Email Template Variables Passed**:
```javascript
{
  to_email,              // Recipient email
  guestName,             // Guest name
  listingTitle,          // Listing/booking title
  listingLocation,       // Location/address
  listingRating,         // Rating (numeric)
  listingType,           // "Stays", "Experiences", "Services"
  bookingId,             // Booking document ID
  numberOfGuests,        // Guest count
  basePrice,             // Original amount (string format)
  serviceFee,            // 5% fee (string format)
  refundAmount,          // Refund total (string format)
  cancellationFee,       // Additional fee if any (string format)
  cancellationDate,      // Date of cancellation
  cancellationReason,    // Reason provided
  bookingType,           // "stays", "experiences", "services"
  dashboardLink,         // Link to guest bookings
  // Type-specific fields
  checkInDate,           // For stays
  checkOutDate,          // For stays
  numberOfNights,        // For stays
  experienceDate,        // For experiences
  experienceTime,        // For experiences
  serviceDate,           // For services
  serviceTime,           // For services
  duration               // Duration in hours/nights
}
```

---

## 2. **Modified: `src/components/MyBookings.jsx`**

### Changes Made:

#### Import Added:
```javascript
import { sendBookingCancellationEmail } from "../utils/sendBookingCancellationEmail";
```

#### Updated `handleCancelBooking()` Function:
- Calls `sendBookingCancellationEmail()` after deleting booking
- Passes cancellation reason: "Booking cancelled by guest"
- Sets `refundAmount: 0` (no refund for pending bookings)
- Email failures don't block the cancellation

```javascript
// Send cancellation email to guest
try {
  await sendBookingCancellationEmail(
    selectedBooking,
    {
      email: user.email,
      fullName: user.displayName || "Guest",
    },
    {
      cancellationReason: "Booking cancelled by guest",
      basePrice: selectedBooking.totalAmount || selectedBooking.price,
      refundAmount: 0, // No refund for pending bookings
    }
  );
} catch (emailError) {
  console.error("Error sending cancellation email:", emailError);
  // Don't fail the cancellation if email fails
}
```

#### Updated `handleRefund()` Function:
- Calls `sendBookingCancellationEmail()` after processing refund
- Calculates and passes service fee (5% of base price)
- Sets `refundAmount` to full booking amount
- Email failures don't block the refund processing

```javascript
// Send cancellation/refund email to guest
try {
  const basePriceAmount = selectedBooking.totalAmount || selectedBooking.price;
  const serviceFeeAmount = Math.round(basePriceAmount * 0.05 * 100) / 100;

  await sendBookingCancellationEmail(
    selectedBooking,
    {
      email: user.email,
      fullName: user.displayName || "Guest",
    },
    {
      cancellationReason: "Booking cancelled by guest",
      basePrice: basePriceAmount,
      serviceFee: serviceFeeAmount,
      refundAmount: selectedBooking.totalAmount,
    }
  );
} catch (emailError) {
  console.error("Error sending refund email:", emailError);
  // Don't fail the refund if email fails
}
```

---

## 3. **Test Utility: `src/utils/testCancellationEmail.js`**

**Purpose**: Test cancellation email functionality with sample data

**Functions**:
- `testCancellationEmail(testEmail)` - Tests all booking types
- `testPendingBookingCancellation(testEmail)` - Tests pending cancellations

**Usage in Browser Console**:
```javascript
// Import and test
import { testCancellationEmail } from './src/utils/testCancellationEmail.js';
await testCancellationEmail('your-email@example.com');
```

**Features**:
- Creates realistic booking data for stays, experiences, services
- Tests type-specific email formatting
- Validates email sending success
- Provides detailed console logging

---

## Email Template Configuration

### Template Location
- **HTML**: `public/booking-cancellation-email.html`
- **EmailJS Template ID**: `VITE_CANCELED_EMAIL_JS_TEMPLATE_ID`
- **Service ID**: `VITE_EMAIL_JS_SERVICE_ID`

### Template Sections

1. **Header**
   - BookingNest logo
   - "Booking Cancelled" title
   - Guest greeting

2. **Cancellation Details**
   - Listing information (title, location, rating, type)
   - Booking ID
   - Type-specific information:
     - **Stays**: Check-in, check-out, nights
     - **Experiences**: Date, time, duration
     - **Services**: Date, time, duration
   - Number of guests
   - Cancellation date and reason

3. **Refund Information**
   - Booking amount
   - Service fee (5%)
   - Cancellation fee (if applicable)
   - **Total refund amount** (highlighted in green)
   - Note about e-wallet credit

4. **Refund Timeline**
   - Cancellation processed ✓
   - Refund pending (24-48 hours)
   - Check wallet balance

5. **Next Steps**
   - Encouragement to explore other listings
   - Link to dashboard

---

## Email Sending Flow

### When Guest Cancels Pending Booking:
1. Guest clicks "Cancel Booking" in My Bookings modal
2. Guest confirms cancellation in modal
3. `handleCancelBooking()` executes:
   - Deletes booking document
   - Updates local state
   - Calls `sendBookingCancellationEmail()`
4. Email sent with:
   - Refund amount: ₱0 (no refund for pending)
   - Reason: "Booking cancelled by guest"
5. Toast notification shows success
6. Modal closes

### When Guest Requests Refund (Confirmed Booking):
1. Guest clicks "Request Refund" in My Bookings modal
2. Guest confirms refund in modal
3. `handleRefund()` executes:
   - Updates guest wallet (adds refund)
   - Updates host wallet (deducts refund)
   - Creates transaction records
   - Removes booked dates from listing
   - Deletes booking document
   - Calls `sendBookingCancellationEmail()`
4. Email sent with:
   - Refund amount: Full booking amount
   - Service fee breakdown included
   - Reason: "Booking cancelled by guest"
5. Toast notification shows success
6. Modal closes

---

## Environment Variables Required

```env
# Primary EmailJS Service
VITE_EMAIL_JS_PUBLIC_KEY=your_key
VITE_EMAIL_JS_SERVICE_ID=service_xxxxx
VITE_CANCELED_EMAIL_JS_TEMPLATE_ID=template_xxxxx

# Fallback Service (optional)
VITE_EMAIL_JS_ANOTHER_PUBLIC_KEY=fallback_key
VITE_EMAIL_JS_ANOTHER_SERVICE_ID=fallback_service_id
```

---

## Error Handling

### Primary Service Failure:
1. Error logged to console
2. Fallback service attempted
3. If fallback succeeds: Email sent, no UI impact
4. If both fail: Error logged, booking cancellation/refund continues

### Why Graceful Degradation?
- Booking cancellation/refund should not fail if email fails
- Guest's wallet changes are more important than email notification
- Guest can always check their email history later

---

## Testing

### Manual Testing Steps:

1. **Pending Booking Cancellation**:
   - Create a booking (status: pending)
   - Open My Bookings
   - Click on pending booking
   - Click "Cancel Booking"
   - Confirm cancellation
   - Check email for cancellation confirmation
   - Verify no refund amount shown

2. **Confirmed Booking Refund**:
   - Create a confirmed booking with check-in > today
   - Open My Bookings
   - Click on confirmed booking
   - Click "Request Refund"
   - Confirm refund
   - Check email for refund confirmation
   - Verify refund amount and breakdown

3. **Automated Testing**:
   ```javascript
   // In browser console
   import { testCancellationEmail } from './src/utils/testCancellationEmail.js';

   // Test all types
   await testCancellationEmail('your-email@example.com');

   // Test pending cancellation
   await testPendingBookingCancellation('your-email@example.com');
   ```

---

## Integration Checklist

- ✅ `sendBookingCancellationEmail.js` utility created
- ✅ `handleCancelBooking()` updated with email integration
- ✅ `handleRefund()` updated with email integration
- ✅ Email template variables documented
- ✅ Error handling implemented
- ✅ Test utilities created
- ✅ Console logging added for debugging
- ✅ Graceful degradation on email failures

---

## Troubleshooting

### Email Not Sending?

1. **Check environment variables**:
   - Verify `VITE_CANCELED_EMAIL_JS_TEMPLATE_ID` is set
   - Verify `VITE_EMAIL_JS_SERVICE_ID` is set
   - Verify `VITE_EMAIL_JS_PUBLIC_KEY` is set

2. **Check browser console**:
   - Look for error messages starting with "❌"
   - Check if fallback service was attempted

3. **Test with utility**:
   ```javascript
   await testCancellationEmail('test@example.com');
   ```

4. **EmailJS Issues**:
   - Verify template exists in EmailJS dashboard
   - Check template variables match email parameters
   - Verify service credentials are correct

### Email Template Issues?

1. **Variables not populating**:
   - Check template uses correct variable names: `{{variableName}}`
   - Verify variable case matches (case-sensitive)

2. **Conditional content not showing**:
   - Check template uses Handlebars syntax: `{{#if condition}}`
   - Verify booking type is correct

---

## Future Enhancements

1. **Email History**: Add guest email receipt tracking
2. **Cancellation Policies**: Show specific policy details in email
3. **Chat with Host**: Add link to message host about cancellation
4. **Invoice**: Include detailed invoice in email
5. **Reschedule Option**: Add button to reschedule booking
6. **Automated Reminders**: Send pre-cancellation reminders

---

## Summary

The booking cancellation email system is now fully integrated with BookingNest's guest cancellation flows. Guests automatically receive:

- **Pending cancellations**: Confirmation that booking was cancelled
- **Refund requests**: Full refund breakdown with timeline
- **Type-specific details**: Tailored information based on booking type
- **Dashboard access**: Direct link back to bookings page

All emails are sent asynchronously to avoid blocking the cancellation/refund process, and failures are gracefully handled without affecting the core functionality.
