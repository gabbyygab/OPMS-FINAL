# Quick Email Setup Checklist

Complete these steps to ensure booking confirmation emails are working correctly.

## Pre-Flight Checklist (5 minutes)

### 1. Environment Variables ✓
Check `.env` file contains:
```
VITE_EMAIL_JS_PUBLIC_KEY=h-LXRKQeIAgmBYCY7
VITE_EMAIL_JS_SERVICE_ID=service_10yga3t
VITE_BOOKING_EMAIL_JS_TEMPLATE_ID=template_2b7tcky
```
- [ ] All three variables present
- [ ] No extra spaces around equals signs
- [ ] Values match exactly

### 2. Restart Development Server
```bash
# In terminal where dev server is running:
Ctrl+C  # Stop server
npm run dev  # Restart server
```
This ensures .env changes are loaded

- [ ] Server restarted after .env check
- [ ] No "env variable not found" errors in console

### 3. Verify EmailJS Account
Go to https://dashboard.emailjs.com and check:
- [ ] You are logged in to your EmailJS account
- [ ] Service `service_10yga3t` exists in Services section
- [ ] Template `template_2b7tcky` exists in Templates section
- [ ] Template has a valid "From Email" configured
- [ ] Template parameters are defined in the template editor

**If template doesn't exist:**
1. Go to Templates section
2. Create new template
3. Copy the ID into VITE_BOOKING_EMAIL_JS_TEMPLATE_ID
4. Add these parameters to template:
   - {{to_email}}
   - {{guestName}}
   - {{listingTitle}}
   - {{bookingType}}
   - {{bookingDetailsHtml}}
   - {{totalAmount}}

### 4. Test with Test Panel (Development Only)
1. Load app in browser: http://localhost:5173
2. Look for **"EmailJS Test"** button in bottom-right corner
3. Click button to open test panel
4. Click **"Test Configuration"** button
5. Should see: ✓ EmailJS configuration is valid

- [ ] Test Configuration button shows success

## Email Testing (10 minutes)

### Test 1: Send Test Email
1. In EmailJS Test Panel, enter your test email address
2. Click **"Send Test Email"** button
3. Wait 5-10 seconds
4. Check your inbox AND spam/junk folder

- [ ] Email received in inbox or spam folder
- [ ] Email subject visible
- [ ] Email appears to be from your domain

### Test 2: Real Booking Confirmation
1. Sign in as **GUEST** account
2. Browse to a listing (Stays, Experience, or Service)
3. Click on a listing to view details
4. Click **"Reserve"** or **"Book Now"**
5. Fill in dates/times and number of guests
6. Complete booking (payment from wallet)
7. Sign out

- [ ] Booking created successfully with status "pending"

### Test 3: Host Confirms Booking
1. Sign in as **HOST** account
2. Go to **"My Bookings"** page
3. Look for pending booking from guest
4. Click **"Confirm"** button
5. Check browser console (F12 → Console tab)

- [ ] See message: "✓ Booking confirmation email sent successfully"
- [ ] Guest email shown in console logs
- [ ] No red error messages

### Test 4: Guest Receives Email
1. Check **guest's email inbox** (same address used in guest registration)
2. Wait up to 2 minutes for delivery
3. Look in **Spam/Junk folder** if not in inbox
4. Open email to verify

- [ ] Email received from noreply@mailserver.emailjs.com (or similar)
- [ ] Email contains booking details
- [ ] Email has correct guest name
- [ ] Email shows correct booking dates/times
- [ ] Email shows correct price information
- [ ] Links in email are clickable

## Troubleshooting (If Tests Fail)

### Email Not Received

**Problem**: "✓ Booking confirmation email sent successfully" shows but no email arrives

**Solution 1**: Check Spam Folder
- [ ] Search for "BookingNest" in spam folder
- [ ] Mark as "Not Spam" if found
- [ ] Add sender to contacts

**Solution 2**: Verify EmailJS Account Status
- [ ] Go to https://dashboard.emailjs.com
- [ ] Check Account → Plan & Billing
- [ ] Verify you have sending quota remaining
- [ ] Free plan: 200 emails/month
- [ ] Check no failed deliveries in Activity

**Solution 3**: Check Template Configuration
- [ ] Go to EmailJS Templates
- [ ] Open template `template_2b7tcky`
- [ ] Verify "To Email" field contains {{to_email}}
- [ ] Verify "From Email" is valid
- [ ] Save template

**Solution 4**: Create New Template
If template has issues:
1. Go to EmailJS Dashboard → Templates
2. Create new template
3. Copy new template ID
4. Update `.env`: `VITE_BOOKING_EMAIL_JS_TEMPLATE_ID=new_template_id`
5. Restart dev server
6. Re-test

### Configuration Errors

**Error**: "EmailJS public key not found"
- [ ] Check `.env` file has VITE_EMAIL_JS_PUBLIC_KEY
- [ ] No spaces around equals sign
- [ ] Restart dev server
- [ ] Hard refresh browser (Ctrl+F5)

**Error**: "Service or template ID not configured"
- [ ] Check VITE_EMAIL_JS_SERVICE_ID in .env
- [ ] Check VITE_BOOKING_EMAIL_JS_TEMPLATE_ID in .env
- [ ] Values match EmailJS dashboard exactly
- [ ] Restart dev server

### Manual Testing in Console

If tests don't work, try console test:
```javascript
// In browser console (F12):

// Test 1: Check environment
console.log(import.meta.env.VITE_EMAIL_JS_PUBLIC_KEY)
console.log(import.meta.env.VITE_EMAIL_JS_SERVICE_ID)
console.log(import.meta.env.VITE_BOOKING_EMAIL_JS_TEMPLATE_ID)

// Should see your keys (no undefined)
```

## Success Indicators

✅ You'll see these messages when everything works:

```
[In Browser Console]
✓ EmailJS initialized successfully
Sending booking confirmation email to: guest@example.com
Email params: { ... }
✓ Booking confirmation email sent successfully
```

```
[In Host's Toast Notification]
"Booking confirmed successfully!"
```

```
[In Guest's Email]
Subject: Booking Confirmed!
From: noreply@[emailjs].com
To: guest@example.com

Hi [Guest Name], your reservation has been confirmed!

Booking Details:
- Listing: [Property Name]
- Location: [Address]
- Booking ID: [ID]
- Total: ₱[Amount]

[Dashboard Link]
```

## After Everything Works

### Monitor Email Status
1. Check EmailJS Dashboard → Activity regularly
2. Review failed/bounced deliveries
3. Check monthly usage vs plan quota

### Optional Enhancements
1. Set up booking cancellation emails (when ready)
2. Add email reminders before stay dates
3. Add payment confirmation emails
4. Customize email styling per host

## Need Help?

1. **Check Logs**: Browser Console (F12) → Console tab
2. **Test Configuration**: Use EmailJS Test Panel
3. **Review Guide**: Read `EMAILJS_DEBUG_GUIDE.md`
4. **Summary**: Read `BOOKING_EMAIL_INTEGRATION_SUMMARY.md`

---

## Summary of What Should Happen

1. **Guest makes booking** → Booking created with status "pending"
2. **Host confirms booking** → Booking status changes to "confirmed"
3. **Email sent** → Guest receives email with booking details
4. **Email appears in inbox** → Guest can view confirmation

**Timeline**: Email should arrive within 30 seconds of host confirming booking.

---

**Last Updated**: 2025-10-29
