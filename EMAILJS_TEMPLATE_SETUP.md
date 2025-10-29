# EmailJS Template Setup Guide

If template `template_2b7tcky` doesn't exist or isn't working, follow these steps to create/configure it.

## Step 1: Access EmailJS Dashboard

1. Go to https://dashboard.emailjs.com
2. Sign in with your EmailJS account
3. Navigate to **Templates** section (left sidebar)

## Step 2: Create New Template (If Needed)

### Option A: Use Existing Template
1. If template `template_2b7tcky` exists, click to edit it
2. Skip to "Step 3: Configure Template"

### Option B: Create New Template
1. Click **"Create New Template"** button
2. Enter template name: "Booking Confirmation"
3. Select service: `service_10yga3t` (or your configured service)
4. Click **"Create"**
5. Copy the new template ID shown at top
6. Update `.env` file:
   ```
   VITE_BOOKING_EMAIL_JS_TEMPLATE_ID=your_new_template_id
   ```
7. Restart dev server

## Step 3: Configure Template Parameters

### Email Headers Section

**Subject Line:**
```
BookingNest - {{bookingType}} Booking Confirmed
```

**To Email:**
```
{{to_email}}
```

**From Email:**
```
your-email@yourdomain.com
(or noreply@yourdomain.com)
```

**From Name:**
```
BookingNest
```

### Email Body Template

Use this template content. Copy and paste into the Email Body field:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BookingNest - Booking Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 30px;">

        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 30px;">
            <img style="height: 50px;" height="50" src="https://res.cloudinary.com/dunltycks/image/upload/v1760626289/1760626264_ojqnrq.png" alt="BookingNest Logo" />
        </div>

        <!-- Welcome Message -->
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0 0 10px 0; color: #1f2937; font-size: 28px; font-weight: 600;">
                Booking Confirmed!
            </h1>
            <p style="margin: 0; color: #6b7280; font-size: 16px;">
                Hi <strong style="color: #4f46e5;">{{guestName}}</strong>, your reservation has been confirmed by the host.
            </p>
        </div>

        <!-- Main Content -->
        <div style="padding: 30px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #4f46e5;">
            <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px;">Booking Details</h2>

            <!-- Listing Information -->
            <div style="background-color: #ffffff; padding: 16px; border-radius: 6px; text-align: center; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px; font-weight: 700;">{{listingTitle}}</h3>
                <div style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">
                    <div>📍 {{listingLocation}}</div>
                    <div>⭐ {{listingRating}} stars</div>
                </div>
                <span style="background-color: #e0e7ff; color: #4f46e5; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block; margin-top: 8px;">{{listingType}}</span>
            </div>

            <!-- Booking Info Box -->
            <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0 0 15px 0; color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                    Confirmation #{{bookingId}}
                </p>

                <!-- Dynamic Booking Details -->
                {{bookingDetailsHtml}}

                <div style="margin-bottom: 12px; display: flex; justify-content: space-between; font-size: 14px;">
                    <span style="color: #6b7280; font-weight: 500;">Number of Guests</span>
                    <span style="color: #1f2937; font-weight: 600;">{{numberOfGuests}}</span>
                </div>
            </div>

            <!-- Pricing Information -->
            <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0 0 15px 0; color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                    Pricing Breakdown
                </p>
                <div style="margin-bottom: 10px; display: flex; justify-content: space-between; font-size: 14px;">
                    <span style="color: #6b7280;">Booking Amount</span>
                    <span style="color: #1f2937; font-weight: 500;">₱{{basePrice}}</span>
                </div>
                <div style="margin-bottom: 10px; display: flex; justify-content: space-between; font-size: 14px;">
                    <span style="color: #6b7280;">Service Fee (5%)</span>
                    <span style="color: #1f2937; font-weight: 500;">₱{{serviceFee}}</span>
                </div>
                <div style="border-top: 1px solid #e5e7eb; margin: 12px 0;"></div>
                <div style="display: flex; justify-content: space-between; margin-top: 12px; padding-top: 12px; border-top: 2px solid #e5e7eb;">
                    <span style="font-size: 16px; font-weight: 700; color: #1f2937;">Total Amount</span>
                    <span style="font-size: 18px; font-weight: 800; color: #4f46e5;">₱{{totalAmount}}</span>
                </div>
            </div>
        </div>

        <!-- CTA Button -->
        <div style="margin-top: 30px; text-align: center;">
            <a href="{{dashboardLink}}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);">
                View My Bookings
            </a>
        </div>

        <!-- Next Steps -->
        <div style="margin-top: 30px;">
            <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 16px; font-weight: 700;">What's Next?</h3>
            <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 0;">
                1. Check in at the specified time<br>
                2. Message the host if you have any questions<br>
                3. Leave a review after your visit
            </p>
        </div>

        <!-- Footer -->
        <div style="margin-top: 30px; text-align: center;">
            <p style="color: #6b7280; font-size: 12px; margin: 10px 0;">
                © 2025 BookingNest. All rights reserved.
            </p>
            <p style="color: #d1d5db; font-size: 11px; margin: 10px 0 0 0;">
                Need help? Contact us at <a href="mailto:support@bookingnest.com" style="color: #4f46e5; text-decoration: none;">support@bookingnest.com</a>
            </p>
        </div>
    </div>
</body>
</html>
```

## Step 4: Test Template Parameters

EmailJS templates require you to **define variables** that will be substituted.

In the template editor, look for a **"Parameters"** or **"Variables"** section:

Add these variables:
```
to_email
email
guestName
listingTitle
listingLocation
listingRating
listingType
bookingId
numberOfGuests
basePrice
serviceFee
totalAmount
bookingType
bookingDetailsHtml
dashboardLink
```

**How to add variables in EmailJS:**
1. Look for {{variable}} placeholders in your template
2. EmailJS usually auto-detects them
3. If not, manually add in Variables/Parameters section
4. Ensure all placeholders have corresponding variables

## Step 5: Save and Test

1. Click **"Save Template"**
2. Copy your template ID (shown at top, e.g., template_2b7tcky)
3. Update `.env` if using new template ID
4. Restart dev server
5. Use EmailJS Test Panel to send test email

## Common Template Issues

### Issue: Variables not substituting
- Make sure {{variable}} format is exact
- No extra spaces: {{guestName}} not {{ guestName }}
- Variable names must match code exactly

### Issue: HTML formatting broken
- Ensure all tags are properly closed
- Inline CSS should be in `style` attributes
- Use `style=` not `class=` for styling (email compatibility)

### Issue: Images not showing
- Use full HTTPS URLs
- Cloudinary images work well
- Avoid relative paths

### Issue: Links not clickable
- Use `<a href="...">` tags
- Include full URL starting with https://
- Test links before deploying

## Alternative: Use Existing Template

If you already have a working booking email template:

1. Go to EmailJS Dashboard → Templates
2. Find your template
3. Copy its ID
4. Update `.env`:
   ```
   VITE_BOOKING_EMAIL_JS_TEMPLATE_ID=your_template_id
   ```
5. Restart dev server

## Verify Everything

After setting up template:

1. Open EmailJS Test Panel (bottom-right)
2. Click "Test Configuration"
3. Should show: ✓ Configuration valid
4. Enter test email
5. Click "Send Test Email"
6. Check inbox for test message

## Get Template ID

When you've created or configured the template:
1. Look at top of template editor page
2. Find "Template ID:"
3. Copy the ID (e.g., template_2b7tcky)
4. Update `.env` if needed
5. It's now ready to use

---

**Note**: Template creation is free with EmailJS. You can create multiple templates for different email types (confirmation, cancellation, reminders, etc.)
