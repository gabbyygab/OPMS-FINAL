# Booking Cancellation Email Flow Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Guest User Interface                          │
│                        (My Bookings Page)                            │
└────────────┬────────────────────────────────────────────────────────┘
             │
             ├─────────────────────────────────┬──────────────────────┐
             │                                 │                      │
             ▼                                 ▼                      ▼
    ┌─────────────────┐          ┌─────────────────┐     ┌──────────────┐
    │  Pending Status │          │ Confirmed Status│     │  Cancelled   │
    │  (Can Cancel)   │          │  (Can Refund)   │     │   Already    │
    │                 │          │                 │     │              │
    └────────┬────────┘          └────────┬────────┘     └──────────────┘
             │                           │
             │ Click "Cancel Booking"    │ Click "Request Refund"
             │                           │
             ▼                           ▼
    ┌────────────────────────┐  ┌────────────────────────┐
    │ Confirmation Modal     │  │ Confirmation Modal     │
    │ (Pending Cancellation) │  │ (Refund Request)       │
    │                        │  │                        │
    │ "Confirm Cancel"  ──┐  │  │ Refund: ₱X.XX    ──┐  │
    └─────────┬──────────┬─┘  │  └────────┬──────────┬─┘  │
              │          │    │           │          │    │
              │ Cancel   │ Keep          │ Cancel   │ Keep
              │ Booking  │ Booking       │ Refund   │ Booking
              │          │               │          │
              ▼          │               ▼          │
    ┌─────────────────────────────────────────────────────┐
    │  handleCancelBooking() / handleRefund()             │
    │  (src/components/MyBookings.jsx)                    │
    └──────────────────┬────────────────────────────────┘
                       │
         ┌─────────────┼──────────────┬──────────────┐
         │             │              │              │
         ▼             ▼              ▼              ▼
    ┌─────────┐  ┌──────────┐   ┌──────────┐   ┌─────────────┐
    │ Delete  │  │ Update   │   │ Update   │   │   Create    │
    │ Booking │  │ Guest    │   │  Host    │   │ Transactions│
    │ Firestore   │Wallet   │   │ Wallet   │   │             │
    └─────────┘  └──────────┘   └──────────┘   └─────────────┘
         │             │              │              │
         └─────────────┼──────────────┴──────────────┘
                       │
         ┌─────────────▼──────────────┐
         │                            │
         │  sendBookingCancellation   │
         │  Email()                   │
         │                            │
         │  (src/utils/)              │
         └────────┬───────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
    ┌──────────────┐   ┌──────────────┐
    │   Primary    │   │   Fallback   │
    │  EmailJS     │──▶│   EmailJS    │
    │  Service     │   │  Service     │
    └──────┬───────┘   └──────┬───────┘
           │                  │
           └──────────┬───────┘
                      │
        ┌─────────────▼──────────────┐
        │                            │
        │    Email Template Render   │
        │    (EmailJS Service)       │
        │                            │
        │  Uses Variables:           │
        │  - guestName               │
        │  - listingTitle            │
        │  - basePrice               │
        │  - refundAmount            │
        │  - cancellationReason      │
        │  ... + 20 more             │
        │                            │
        └─────────────┬──────────────┘
                      │
        ┌─────────────▼──────────────┐
        │                            │
        │  HTML Email Template       │
        │  (public/booking-          │
        │   cancellation-email.html) │
        │                            │
        │  Renders:                  │
        │  - Cancellation Header     │
        │  - Booking Details         │
        │  - Refund Info (if any)    │
        │  - Timeline                │
        │  - Next Steps              │
        │  - Footer                  │
        │                            │
        └─────────────┬──────────────┘
                      │
                      ▼
        ┌──────────────────────────┐
        │   SMTP Server            │
        │   (EmailJS/Brevo)        │
        └──────────────┬───────────┘
                       │
                       ▼
        ┌──────────────────────────┐
        │   Guest Email Inbox      │
        │   (guest@email.com)      │
        └──────────────────────────┘

```

---

## Detailed Flow: Pending Booking Cancellation

```
GUEST INITIATES CANCELLATION
        │
        ▼
┌──────────────────────────────────┐
│ My Bookings Page                 │
│ - Display all guest bookings     │
│ - Show booking cards with status │
└────────────────┬─────────────────┘
                 │
                 │ Click booking card
                 ▼
        ┌────────────────────┐
        │ Booking Details    │
        │ Modal              │
        │                    │
        │ Status: PENDING    │
        │ Price: ₱1,000      │
        │                    │
        │ [Cancel Booking]   │◀─── Button
        │ [View Listing]     │
        └────────┬───────────┘
                 │
                 │ Click "Cancel Booking"
                 ▼
        ┌────────────────────────┐
        │ Confirmation Modal      │
        │                         │
        │ "Cancel Booking?"       │
        │                         │
        │ "Are you sure you want  │
        │  to cancel this         │
        │  booking?"              │
        │                         │
        │ Booking: Villa Beachfront
        │ Check-in: Dec 15, 2025  │
        │                         │
        │ [Keep Booking]          │
        │ [Confirm Cancel]◀────── Click to confirm
        └────────┬────────────────┘
                 │
                 │ Confirm Cancel clicked
                 ▼
        ┌────────────────────────┐
        │ handleCancelBooking()  │
        │                        │
        │ 1. Delete booking      │
        │    from Firestore      │
        │ 2. Update local state  │
        │ 3. Send email (async)  │
        │ 4. Show success toast  │
        └────────┬───────────────┘
                 │
                 ├─────────────────────────────────┐
                 │ (Happens in background)         │
                 ▼                                 │
        ┌──────────────────────────────┐          │
        │ sendBookingCancellation      │          │
        │ Email()                      │          │
        │                              │          │
        │ Parameters:                  │          │
        │ - booking                    │          │
        │ - guestData                  │          │
        │ - options:                   │          │
        │   - cancellationReason:      │          │
        │     "Booking cancelled by    │          │
        │      guest"                  │          │
        │   - basePrice: 1000          │          │
        │   - refundAmount: 0          │          │
        │                              │          │
        └────────┬─────────────────────┘          │
                 │                                │
         ┌───────┴────────┐                       │
         │                │                       │
         ▼                ▼                       │
    ┌──────────┐     ┌──────────┐                │
    │ Primary  │     │ Fallback │                │
    │ Service  │     │ Service  │                │
    │ (Success)│     │ (if fail)│                │
    └──────────┘     └──────────┘                │
         │                │                       │
         └────────┬───────┘                       │
                  │                               │
                  ▼                               │
        ┌─────────────────────┐                  │
        │ Email Sent to Guest │◀─────────────────┤
        │                     │                  │
        │ Subject: Booking    │    Toast Success │
        │ Cancelled           │    (shown to UI) │
        │                     │                  │
        │ Content:            │                  │
        │ - Cancellation      │                  │
        │   confirmed         │                  │
        │ - Booking details   │                  │
        │ - No refund         │                  │
        │   (pending status)  │                  │
        │ - Dashboard link    │                  │
        └─────────────────────┘                  │
                                                 │
                                                 ▼
                                        Modal closes
                                        Page refreshes
                                        Booking removed
```

---

## Detailed Flow: Confirmed Booking Refund

```
GUEST INITIATES REFUND
        │
        ▼
┌──────────────────────────────────┐
│ My Bookings Page                 │
│ - Display confirmed bookings     │
│ - Check-in date: FUTURE          │
└────────────────┬─────────────────┘
                 │
                 │ Click booking card
                 ▼
        ┌────────────────────┐
        │ Booking Details    │
        │ Modal              │
        │                    │
        │ Status: CONFIRMED  │
        │ Price: ₱5,000      │
        │ Check-in: Dec 15   │
        │                    │
        │ ⚠️ You can request │
        │ refund             │
        │                    │
        │ [Request Refund]   │◀─── Button (enabled)
        │ [View Listing]     │
        └────────┬───────────┘
                 │
                 │ Click "Request Refund"
                 ▼
        ┌────────────────────────────┐
        │ Refund Confirmation Modal  │
        │                            │
        │ "Request Refund?"          │
        │                            │
        │ Booking: Beachfront Villa  │
        │ Check-in: Dec 15, 2025     │
        │ Refund Amount: ₱5,000      │
        │                            │
        │ "Are you sure you want to  │
        │  cancel this booking and   │
        │  request a refund?"        │
        │                            │
        │ ℹ️ Refund processed        │
        │    immediately to wallet   │
        │                            │
        │ [Keep Booking]             │
        │ [Confirm Refund]◀────────── Click to confirm
        └────────┬────────────────────┘
                 │
                 │ Confirm Refund clicked
                 ▼
        ┌───────────────────────────┐
        │ handleRefund()            │
        │                           │
        │ 1. Check check-in date    │
        │    (must be future)       │
        │ 2. Get guest wallet       │
        │ 3. Get host wallet        │
        │ 4. Update guest wallet    │
        │    (add refund ₱5,000)    │
        │ 5. Update host wallet     │
        │    (deduct ₱5,000)        │
        │ 6. Create transactions    │
        │    (for accounting)       │
        │ 7. Remove booked dates    │
        │    from listing           │
        │ 8. Delete booking         │
        │ 9. Send email (async)     │
        │ 10. Show success toast    │
        └────────┬──────────────────┘
                 │
    Wallet Changes │ (happens first)
                 │
         ┌───────▼───────────┐
         │                   │
         ▼                   ▼
    Guest Wallet       Host Wallet
    ₱X,XXX ────────▶ ₱Y,YYY - ₱5,000
    (increased)      (decreased)
                 │
                 │ Then send email in background
                 ▼
        ┌──────────────────────────────┐
        │ sendBookingCancellation      │
        │ Email()                      │
        │                              │
        │ Parameters:                  │
        │ - booking                    │
        │ - guestData                  │
        │ - options:                   │
        │   - cancellationReason:      │
        │     "Booking cancelled by    │
        │      guest"                  │
        │   - basePrice: 5000          │
        │   - serviceFee: 250 (5%)     │
        │   - refundAmount: 5000       │
        │                              │
        └────────┬─────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
         ▼                ▼
    ┌──────────┐     ┌──────────┐
    │ Primary  │     │ Fallback │
    │ Service  │     │ Service  │
    │ (Success)│     │ (if fail)│
    └──────────┘     └──────────┘
         │                │
         └────────┬───────┘
                  │
                  ▼
        ┌─────────────────────┐
        │ Email Sent to Guest │
        │                     │
        │ Subject: Booking    │
        │ Cancelled - Refund  │
        │ Processed           │
        │                     │
        │ Content:            │
        │ - Cancellation      │
        │   confirmed         │
        │ - Booking details   │
        │ - Refund Amount:    │
        │   ₱5,000            │
        │ - Service Fee:      │
        │   ₱250 (incl.)      │
        │ - Timeline:         │
        │   24-48 hours       │
        │ - e-wallet info     │
        │ - Dashboard link    │
        └─────────────────────┘

                 ▼
        Modal closes
        Page refreshes
        Booking removed
        Wallet updated
```

---

## Email Template Rendering

```
┌────────────────────────────────────────────┐
│     sendBookingCancellationEmail()          │
│     Prepares Parameters                    │
└────────────────┬───────────────────────────┘
                 │
    ┌────────────▼──────────────┐
    │ Email Parameters Object:  │
    │                           │
    │ to_email:                 │
    │  "guest@example.com"      │
    │ guestName:                │
    │  "John Doe"               │
    │ listingTitle:             │
    │  "Beachfront Villa"       │
    │ listingLocation:          │
    │  "Boracay, Philippines"   │
    │ listingType:              │
    │  "Stays"                  │
    │ basePrice:                │
    │  "5000.00"                │
    │ serviceFee:               │
    │  "250.00"                 │
    │ refundAmount:             │
    │  "5000.00"                │
    │ cancellationDate:         │
    │  "Oct 29, 2025"           │
    │ bookingType:              │
    │  "stays"                  │
    │ checkInDate:              │
    │  "Dec 15, 2025"           │
    │ checkOutDate:             │
    │  "Dec 20, 2025"           │
    │ numberOfNights:           │
    │  "5"                      │
    │ ... (and more)            │
    │                           │
    └────────────┬──────────────┘
                 │
    ┌────────────▼──────────────────┐
    │ EmailJS sends to template     │
    │ Template ID:                  │
    │ VITE_CANCELED_EMAIL_JS_       │
    │ TEMPLATE_ID                   │
    │ Service ID:                   │
    │ VITE_EMAIL_JS_SERVICE_ID      │
    │                               │
    └────────────┬──────────────────┘
                 │
    ┌────────────▼──────────────────────┐
    │ Template Engine renders HTML:     │
    │ (Handlebars template processing)  │
    │                                   │
    │ {{{guestName}}} → John Doe       │
    │ {{{listingTitle}}} → Beachfront  │
    │  Villa                           │
    │ {{{refundAmount}}} → ₱5000.00    │
    │ {{#if bookingType==='stays'}}   │
    │   → Shows check-in/out dates    │
    │ {{/if}}                         │
    │                                   │
    └────────────┬──────────────────────┘
                 │
    ┌────────────▼──────────────────────┐
    │ Final HTML Email Output:          │
    │                                   │
    │ ┌──────────────────────────────┐  │
    │ │ [BookingNest Logo]           │  │
    │ │                              │  │
    │ │ Booking Cancelled            │  │
    │ │                              │  │
    │ │ Hi John Doe,                 │  │
    │ │                              │  │
    │ │ Cancellation Details         │  │
    │ │                              │  │
    │ │ ┌──────────────────────────┐ │  │
    │ │ │ Beachfront Villa         │ │  │
    │ │ │ 📍 Boracay, Philippines  │ │  │
    │ │ │ ⭐ 4.8 stars             │ │  │
    │ │ │ [Stays]                  │ │  │
    │ │ └──────────────────────────┘ │  │
    │ │                              │  │
    │ │ Booking Details             │  │
    │ │ Check-in: Dec 15, 2025      │  │
    │ │ Check-out: Dec 20, 2025     │  │
    │ │ Nights: 5                    │  │
    │ │ Guests: 2                    │  │
    │ │ Date: Oct 29, 2025           │  │
    │ │                              │  │
    │ │ Refund Information           │  │
    │ │ Amount: ₱5,000               │  │
    │ │ Fee: ₱250                    │  │
    │ │ TOTAL: ₱5,000                │  │
    │ │                              │  │
    │ │ Timeline                     │  │
    │ │ ✓ Processed                  │  │
    │ │ ⏱️ 24-48 hours pending       │  │
    │ │ 💰 Check wallet              │  │
    │ │                              │  │
    │ │ [View Booking History]       │  │
    │ │                              │  │
    │ │ Footer                       │  │
    │ │ © 2025 BookingNest           │  │
    │ │                              │  │
    │ └──────────────────────────────┘  │
    │                                   │
    └────────────┬──────────────────────┘
                 │
    ┌────────────▼──────────────────────┐
    │ Send via SMTP                     │
    │ (EmailJS Provider)                │
    │ To: guest@example.com             │
    │                                   │
    └────────────┬──────────────────────┘
                 │
    ┌────────────▼──────────────────────┐
    │ Guest Inbox                       │
    │                                   │
    │ From: noreply@bookingnest.com     │
    │ Subject: Booking Cancelled        │
    │ Received: Oct 29, 2025 10:30 AM   │
    │                                   │
    │ ✓ Read                            │
    │                                   │
    └───────────────────────────────────┘
```

---

## Error Handling Flow

```
┌──────────────────────────────────────┐
│ sendBookingCancellationEmail()        │
│ Execute email sending                │
└────────────┬───────────────────────────┘
             │
             ▼
    ┌────────────────────┐
    │ EmailJS Primary    │
    │ Service Send       │
    └────────┬───────────┘
             │
        ┌────┴────┐
        │          │
        ▼          ▼
    SUCCESS   FAILURE
        │          │
        │          ▼
        │      ┌─────────────────────┐
        │      │ Log Error ❌        │
        │      │ Try Fallback        │
        │      │ Service             │
        │      └────────┬────────────┘
        │               │
        │               ▼
        │      ┌─────────────────────┐
        │      │ EmailJS Fallback    │
        │      │ Service Send        │
        │      └────────┬────────────┘
        │               │
        │          ┌────┴────┐
        │          │          │
        │          ▼          ▼
        │      SUCCESS   FAILURE
        │          │          │
        │          │          ▼
        │          │      ┌──────────────┐
        │          │      │ Log Error ❌ │
        │          │      │ Continue     │
        │          │      │ without email│
        │          │      └──────┬───────┘
        │          │             │
        └──────────┴─────────────┘
                   │
                   ▼
    ┌─────────────────────────────┐
    │ Email Success ✅            │
    │ (either service)            │
    │                             │
    │ Return to calling function: │
    │ - handleCancelBooking()     │
    │ - handleRefund()            │
    │                             │
    │ Booking/Refund is complete  │
    │ Email sent successfully     │
    │ Show success toast          │
    │                             │
    └─────────────────────────────┘

OR

    ┌─────────────────────────────┐
    │ Email Failed ❌             │
    │ (both services)             │
    │                             │
    │ Return to calling function: │
    │ - handleCancelBooking()     │
    │ - handleRefund()            │
    │                             │
    │ Booking/Refund IS STILL    │
    │ COMPLETED!                  │
    │ Email failed gracefully     │
    │ Show success toast anyway   │
    │ (wallet already updated)    │
    │                             │
    │ User can check email later  │
    │ or contact support          │
    │                             │
    └─────────────────────────────┘
```

---

## Key Points

1. **Asynchronous**: Email sending happens in background (doesn't block UI)
2. **Graceful Degradation**: Email failures don't affect core functionality
3. **Type-Aware**: Email content adapts based on booking type
4. **Comprehensive**: Full refund details in email
5. **Logged**: All actions logged to console for debugging
6. **Professional**: HTML template with branding and styling
7. **Tested**: Test utilities available for verification

