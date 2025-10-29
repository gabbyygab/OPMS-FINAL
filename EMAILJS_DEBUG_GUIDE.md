# EmailJS Integration Debugging Guide

## Current Status
The booking confirmation email system is integrated with EmailJS. When a host confirms a booking, an email should be sent to the guest with booking details.

## Configuration

### Environment Variables (.env)
```
VITE_EMAIL_JS_PUBLIC_KEY=h-LXRKQeIAgmBYCY7
VITE_EMAIL_JS_SERVICE_ID=service_10yga3t
VITE_BOOKING_EMAIL_JS_TEMPLATE_ID=template_2b7tcky

# Alternative service (fallback)
VITE_EMAIL_JS_ANOTHER_PUBLIC_KEY=Rpmqa6KM-1HwvY30y
VITE_EMAIL_JS_ANOTHER_SERVICE_ID=service_9pwegpj
```

### Implementation Location
- **File**: `src/pages/host/MyBookings.jsx`
- **Function**: `sendBookingConfirmationEmail()` (lines 201-369)
- **Called from**: `handleConfirmBooking()` (after booking status updated to "confirmed")

## Troubleshooting Steps

### Step 1: Verify EmailJS Dashboard Configuration
1. Go to https://dashboard.emailjs.com
2. Log in with your credentials
3. Check **Service** section:
   - Verify `service_10yga3t` exists
   - If not, create a new service (Gmail, SMTP, etc.)

4. Check **Templates** section:
   - Verify template `template_2b7tcky` exists
   - **CRITICAL**: The template must have these parameters defined:
     ```
     {{to_email}}  (recipient email)
     {{guestName}}
     {{listingTitle}}
     {{listingLocation}}
     {{listingRating}}
     {{listingType}}
     {{bookingId}}
     {{numberOfGuests}}
     {{basePrice}}
     {{serviceFee}}
     {{totalAmount}}
     {{bookingType}}
     {{bookingDetailsHtml}}
     {{dashboardLink}}
     ```
   - If any parameters are missing, add them in the template editor

5. Check **Account** section:
   - Verify API keys are correct
   - Public Key: `h-LXRKQeIAgmBYCY7`
   - Copy full key from dashboard (might be longer)

### Step 2: Browser Console Debugging
1. Open browser DevTools (F12)
2. Go to Console tab
3. Confirm a booking in the application
4. Look for these messages:
   ```
   ✓ EmailJS initialized successfully
   Sending booking confirmation email to: [guest_email]
   Email params: { ... }
   ✓ Booking confirmation email sent successfully
   ```

### Step 3: Check Email Delivery
1. Check the test email address (should be the host's registered email)
2. Wait 5-10 seconds for delivery
3. Check spam/junk folder
4. Check EmailJS Activity Log:
   - Go to https://dashboard.emailjs.com
   - Look for **Activity** or **Logs** section
   - Search for emails sent to your test address
   - Check for any error messages

### Step 4: Test Email Parameters
The code sends these parameters with each booking confirmation:

```javascript
{
  to_email: "guest@example.com",        // Must be correct email address
  email: "guest@example.com",           // Some templates expect this too
  guestName: "Guest Full Name",
  listingTitle: "Property/Experience/Service Name",
  listingLocation: "Address/Location",
  listingRating: 4.5,                   // Number value
  listingType: "Stays/Experiences/Services",
  bookingId: "unique_booking_id",
  numberOfGuests: 2,                     // Number value
  basePrice: "1000.00",                 // String with 2 decimals
  serviceFee: "50.00",                  // String with 2 decimals
  totalAmount: "1050.00",               // String with 2 decimals
  bookingType: "stays/experiences/services",
  bookingDetailsHtml: "<div>HTML content</div>",  // Generated based on type
  dashboardLink: "https://yourdomain.com/guest/my-bookings"
}
```

### Step 5: Common Issues and Solutions

#### Issue: "EmailJS public key not found"
- **Cause**: Environment variable not set
- **Solution**: Add `VITE_EMAIL_JS_PUBLIC_KEY` to `.env` file and restart dev server

#### Issue: "Error sending booking confirmation email"
- **Cause 1**: Template ID not found
  - Solution: Verify `VITE_BOOKING_EMAIL_JS_TEMPLATE_ID` matches EmailJS dashboard

- **Cause 2**: Service ID not found
  - Solution: Verify `VITE_EMAIL_JS_SERVICE_ID` exists in EmailJS dashboard

- **Cause 3**: Missing template parameters
  - Solution: Add all parameters listed in Step 1 to the template

- **Cause 4**: Invalid recipient email
  - Solution: Verify guest's email is stored correctly in Firebase users collection

#### Issue: Email appears sent but never arrives
- **Cause 1**: Email marked as spam
  - Solution: Check spam/junk folder in email client

- **Cause 2**: Template has missing "from" email
  - Solution: In EmailJS template, ensure "from" email is configured

- **Cause 3**: EmailJS free plan limits
  - Solution: Check EmailJS pricing for monthly send limits

### Step 6: Testing with Console Utility
Use the test utility in `src/utils/emailjsTest.js`:

```javascript
// In browser console:
import { testEmailJSConfiguration } from './utils/emailjsTest.js'
import { testEmailSend } from './utils/emailjsTest.js'

// Test configuration
await testEmailJSConfiguration()

// Send test email
await testEmailSend('your-test-email@example.com')
```

## Expected Flow

1. **Host confirms booking** → `handleConfirmBooking()` called
2. **Booking status updated** → "pending" → "confirmed"
3. **Guest user data fetched** → Get email address
4. **Email function called** → `sendBookingConfirmationEmail()`
5. **Email parameters prepared** → All variables populated
6. **EmailJS sends email** → `emailjs.send()` API call
7. **Success logged** → "✓ Booking confirmation email sent successfully"
8. **Toast notification** → "Booking confirmed successfully!"

## Alternative: Fallback Service
If primary service fails, code attempts to use alternative service:
```
VITE_EMAIL_JS_ANOTHER_SERVICE_ID=service_9pwegpj
VITE_EMAIL_JS_ANOTHER_PUBLIC_KEY=Rpmqa6KM-1HwvY30y
```

This uses the same template ID but different service account.

## Monitoring EmailJS Activity
1. Go to EmailJS Dashboard
2. Check **Statistics** → Daily send count
3. Check **Activity** → Email delivery status
4. Check **Logs** → Error messages and debugging info

## Next Steps if Still Not Working

1. **Create new EmailJS account** (separate from existing service)
2. **Use alternative email provider** (SendGrid, Mailgun, AWS SES)
3. **Implement custom backend** (Node.js server to send emails)
4. **Add email queue system** (store unsent emails and retry)

## Useful Links
- EmailJS Dashboard: https://dashboard.emailjs.com
- EmailJS Documentation: https://www.emailjs.com/docs/
- EmailJS API Reference: https://www.emailjs.com/docs/sdk/send/
