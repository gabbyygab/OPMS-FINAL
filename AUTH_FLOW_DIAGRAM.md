# BookingNest Authentication Flow Diagrams

## Signup Flow (4 Steps with Progress Bar)

```
┌─────────────────────────────────────────────────────────────────┐
│                    SIGNUP FLOW DIAGRAM                          │
└─────────────────────────────────────────────────────────────────┘

User clicks "Sign Up" button
    ↓
┌──────────────────────────────────────────────────────────────────┐
│ STEP 1: Choose Role (1/4)                                        │
│ ┌─────────────────┐  ┌─────────────────┐                        │
│ │  🏠 GUEST       │  │  💼 HOST        │                        │
│ │ Browse & Book   │  │ List & Earn     │                        │
│ └─────────────────┘  └─────────────────┘                        │
└──────────────────────────────────────────────────────────────────┘
    ↓ (User selects role)
┌──────────────────────────────────────────────────────────────────┐
│ STEP 2: Enter Details (2/4)                                      │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Full Name:        [___________________]                    │ │
│ │ Email:            [___________________]                    │ │
│ │ Password:         [___________________]                    │ │
│ │ Confirm Password: [___________________]                    │ │
│ │                                                             │ │
│ │  [Cancel]  [Next]                                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
    ↓ (User enters form data & clicks Next)
┌──────────────────────────────────────────────────────────────────┐
│ STEP 3: Accept Policies (3/4)                                    │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [GUEST/HOST TERMS & POLICIES]                              │ │
│ │                                                             │ │
│ │ Privacy Policy & Terms                                      │ │
│ │ ─────────────────────────────────                           │ │
│ │ • Data Collection & Privacy                                │ │
│ │ • Booking Policy                                            │ │
│ │ • Cancellation & Refund Policy                             │ │
│ │ • Payment & Wallet                                          │ │
│ │ • Rights & Responsibilities                                │ │
│ │ • Data Retention & Deletion                                │ │
│ │                                                             │ │
│ │ [must scroll to read all content]                          │ │
│ │                                                             │ │
│ │ 📜 Scroll down to read all policies ↓                       │ │
│ │                                                             │ │
│ │  [Decline]  [I Accept & Continue] (disabled until scroll)   │ │
│ └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
    ↓ (User scrolls to bottom & clicks Accept)
┌──────────────────────────────────────────────────────────────────┐
│ STEP 4: Verify Email (4/4)                                       │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Verification Code sent to your email                        │ │
│ │                                                             │ │
│ │ Enter 6-digit code:  [__ __ __ __ __ __]                   │ │
│ │                                                             │ │
│ │ Didn't receive code? [Resend]                              │ │
│ │                                                             │ │
│ │  [Verify Email]                                            │ │
│ └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
    ↓ (User enters OTP & clicks Verify)
┌──────────────────────────────────────────────────────────────────┐
│ ✅ Account Created Successfully!                                │
│ Welcome to BookingNest [Username]                               │
└──────────────────────────────────────────────────────────────────┘
    ↓
   Auto-redirect to Dashboard

```

---

## Signin Flow (2 Steps with Policy Acceptance)

```
┌─────────────────────────────────────────────────────────────────┐
│                    SIGNIN FLOW DIAGRAM                          │
└─────────────────────────────────────────────────────────────────┘

User clicks "Sign In" button
    ↓
┌──────────────────────────────────────────────────────────────────┐
│ STEP 1: Sign In Form                                             │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Sign In to BookingNest                                      │ │
│ │                                                             │ │
│ │ Email:    [___________________]                            │ │
│ │ Password: [___________________]                            │ │
│ │                                                             │ │
│ │ [Sign in with Google]                                      │ │
│ │                                                             │ │
│ │ Forgot password? [Reset]                                   │ │
│ │                                                             │ │
│ │  [Cancel]  [Next]                                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
    ↓ (User enters credentials & clicks Next)
    ↓ (Firebase validates email & password)
    ↓ (Email exists and password correct)
┌──────────────────────────────────────────────────────────────────┐
│ STEP 2: Accept Updated Policies                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [GUEST/HOST TERMS & POLICIES]                              │ │
│ │                                                             │ │
│ │ Before we sign you in, please review                       │ │
│ │ our updated policies...                                    │ │
│ │                                                             │ │
│ │ [Policy content - same as signup]                          │ │
│ │                                                             │ │
│ │ 📜 Scroll down to read all policies ↓                       │ │
│ │                                                             │ │
│ │  [Decline]  [I Accept & Sign In] (disabled until scroll)    │ │
│ └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
    ↓ (User scrolls to bottom & clicks Accept)
┌──────────────────────────────────────────────────────────────────┐
│ ✅ Welcome Back!                                                 │
│ You've signed in successfully                                    │
└──────────────────────────────────────────────────────────────────┘
    ↓
   Auto-redirect to Dashboard

```

---

## Progress Bar States

```
STEP 1: Choose Role
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
① ──── ② ──── ③ ──── ④
1 of 4

STEP 2: Enter Details
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ ──── ② ──── ③ ──── ④
2 of 4

STEP 3: Accept Policies
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ ──── ✓ ──── ③ ──── ④
3 of 4

STEP 4: Verify Email
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ ──── ✓ ──── ✓ ──── ④
4 of 4

COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ ──── ✓ ──── ✓ ──── ✓
✅ Account Created!

Legend:
① = Current Step
✓ = Completed Step
─ = Progress Line
```

---

## Component Relationship Diagram

```
┌────────────────────────────────────────────────────────┐
│                   LandingPage / App                     │
│  (Contains "Sign Up" and "Sign In" buttons)             │
└────────────────────────┬─────────────────────────────┘
                         │
                         │ (buttons use AuthModalContext)
                         ↓
         ┌───────────────────────────────┐
         │  AuthModalContext Provider    │
         │ (Manages modal state & steps) │
         └───┬───────────────────────┬───┘
             │                       │
             ↓                       ↓
    ┌─────────────────┐    ┌─────────────────┐
    │  SignUpModal    │    │  SignInModal    │
    │ (Multi-step)    │    │ (2-step)        │
    └────┬────────────┘    └────┬────────────┘
         │                      │
    ┌────┼──────────────────────┼────┐
    ↓    ↓                      ↓    ↓
┌──────────────┐        ┌──────────────────┐
│Step1:        │        │SignInForm        │
│Role Select   │        │(Email/Password)  │
│              │        │                  │
│ RoleSelection│        │ [integrated]     │
│ Modal        │        └────────┬─────────┘
└──────┬───────┘                 │
       │ (user selects)          │
       ↓                         │
┌──────────────┐                 │
│Step 2:       │                 │
│Details Form  │                 │
│              │                 │
│ [integrated] │                 │
└──────┬───────┘                 │
       │ (user clicks Next)      │
       ↓                         │
┌──────────────────────────────────────────┐
│Step 3 (both flows):                      │
│Policy Acceptance Modal                   │
│                                          │
│ PolicyAcceptanceModal Component          │
│ - Guest or Host policies                 │
│ - Scroll tracking                        │
│ - Accept disabled until scroll           │
└───────┬─────────────────────────────────┘
        │ (user scrolls & accepts)
        ↓
┌──────────────────────────────┐
│Step 4 (signup only):          │
│Email Verification (OTP)       │
│                               │
│ OtpVerificationPage Component │
│ (existing - integrated)       │
└───────┬──────────────────────┘
        │ (user enters OTP)
        ↓
    ✅ Complete!

```

---

## Policy Scroll Tracking

```
Policy Modal Content:

┌─────────────────────────────────────┐
│ Host Terms & Policies               │  ← Header
├─────────────────────────────────────┤
│                                     │
│ 1. Data Collection & Privacy        │
│    ✓ Information We Collect         │
│    ✓ Data Usage                     │
│    ✓ Data Security                  │
│                                     │
│ 2. Listing & Commission Policy      │
│    • Creating Listings              │
│    • Commission Structure            │
│    • Listing Management             │
│                                     │
│ 3. Booking Management               │
│    • Incoming Bookings              │
│    • Confirmation Process           │
│    • Host Responsibilities          │
│                                     │
│    [User is here] ← scrollbar       │
│                                     │
│ 4. Cancellation & Refund Policy     │
│    • Host Authority                 │
│    • Handling Requests              │
│    • Refund from Host Perspective   │
│                                     │
│ 5. Payment & Payouts                │
│    • Earning Money                  │
│    • Payout Process                 │
│                                     │
│ 6. Host Rights & Responsibilities   │
│    • Your Rights                    │
│    • Your Responsibilities          │
│                                     │
│ 7. Data Retention & Deletion        │
│                                     │
│ [User needs to scroll here] ↓ ↓ ↓  │
│                                     │
├─────────────────────────────────────┤
│ [Decline] [Accept - DISABLED] ⬅    │  ← Footer
│                                     │  (Accept button disabled
│ Scroll to read all content          │   until user reaches bottom)
└─────────────────────────────────────┘


SCROLL STATES:

NOT FULLY SCROLLED:
╔═════════════════════════════════════╗
║ Decline Button    │  DISABLED Accept ║ ← Cannot click
║                   │  (greyed out)   ║
╚═════════════════════════════════════╝

📜 Scroll indicator showing user needs to scroll

FULLY SCROLLED (Bottom Reached):
╔═════════════════════════════════════╗
║ Decline Button    │  ✅ ENABLED     ║ ← Can click now
║                   │  I Accept & Cont║
╚═════════════════════════════════════╝

✅ Accept button is now active and clickable

```

---

## Notification Flow

```
USER ACTIONS                     NOTIFICATIONS CREATED
═════════════════════════════════════════════════════════════════

Guest Creates Booking
  ↓
  Creates: userId={HOST_ID}, guestId={GUEST_ID}
           type="booking"
           isRead=false
  ↓
  Host receives REAL-TIME notification
  ↓
  Host Confirms/Rejects
  ├─→ CONFIRMS:
  │   Creates: userId={GUEST_ID}, guestId={GUEST_ID}
  │            type="booking_confirmed"
  │   Deducts payment from guest wallet
  │   Creates: type="payment"
  │
  └─→ REJECTS:
      Creates: userId={GUEST_ID}, guestId={GUEST_ID}
               type="booking_rejected"
               reason={REASON}


NOTIFICATION BADGE DISPLAY:
═════════════════════════════════════════════════════════════════

GUEST VIEW:
  🔔 [3] ← 3 unread notifications
  (Shows in navbar, real-time updates)

HOST VIEW:
  🔔 [9+] ← 9 or more unread notifications
  (Shows in navbar, real-time updates)

CLICKING BADGE:
  Guest → Goes to /guest/notifications
  Host  → Goes to /host/notifications

```

---

## Service Fee Flow

```
BOOKING PAYMENT FLOW:
═════════════════════════════════════════════════════════════════

STEP 1: Guest Creates Booking
┌─────────────────────────┐
│ Booking Amount: ₱1,000  │
│ Service Fee (5%): ₱50   │
│ Total to Pay: ₱1,050    │
└─────────────────────────┘
Status: PENDING
Payment: NOT DEDUCTED YET

↓

STEP 2: Host Reviews & Confirms
┌─────────────────────────┐
│ Host approves booking   │
└─────────────────────────┘

↓

STEP 3: Payment Deducted
Wallet:
  ₱1,050 deducted from guest wallet
  │
  ├─→ ₱1,000 goes to Host
  └─→ ₱50 goes to Platform (Admin)

Status: CONFIRMED
Payment: SUCCESSFULLY DEDUCTED

↓

STEP 4: Notifications Sent
  Guest → "Booking Confirmed! ₱1,050 charged"
  Host  → "Booking Confirmed! You earned ₱1,000"

```

---

## Modal State Management

```
AuthModalContext State Machine:
═════════════════════════════════════════════════════════════════

INITIAL STATE:
├─ showSignUpModal: false
├─ showSignInModal: false
├─ signUpRole: null
└─ signUpStep: 1

USER CLICKS "SIGN UP":
├─ showSignUpModal: true
├─ signUpStep: 1 (Role Selection)
└─ Opens: RoleSelectionModal

USER SELECTS ROLE:
├─ signUpRole: "guest" | "host"
├─ signUpStep: 2 (Enter Details)
└─ Opens: SignUpModal with form

USER ENTERS DETAILS & CLICKS NEXT:
├─ signUpStep: 3 (Accept Policies)
└─ Opens: PolicyAcceptanceModal

USER ACCEPTS POLICIES:
├─ signUpStep: 4 (Verify Email)
└─ Opens: OTP Verification

USER ENTERS OTP:
├─ showSignUpModal: false (closes)
├─ signUpStep: 1 (resets)
├─ signUpRole: null (resets)
└─ Redirects to Dashboard

USER CLICKS "CANCEL" (any step):
├─ showSignUpModal: false
├─ signUpStep: 1
├─ signUpRole: null
└─ Closes all modals

```

---

## Desktop vs Mobile Layout

```
DESKTOP (1024px+):
┌─────────────────────────────────────────┐
│ ProgressBar (sticky at top)             │
├─────────────────────────────────────────┤
│ ① Choose Role  ② Enter Details         │
│ ③ Accept Policies  ④ Verify Email      │
│                                         │
│ Full-width modals with padding          │
│ All labels visible                      │
└─────────────────────────────────────────┘

TABLET (768px - 1023px):
┌─────────────────────────────────────────┐
│ ProgressBar (sticky at top)             │
├─────────────────────────────────────────┤
│ ① ─── ② ─── ③ ─── ④                  │
│                                         │
│ Modal width: 90% max                    │
│ Some labels hidden on mobile            │
└─────────────────────────────────────────┘

MOBILE (<768px):
┌──────────────────────────┐
│ ProgressBar (full-width) │
├──────────────────────────┤
│ ① ─ ② ─ ③ ─ ④         │
│ Step {current} of 4      │
│                          │
│ Modal: 100% width,       │
│ max 95vh height          │
│ Labels: Hidden           │
│ Numbers only visible     │
└──────────────────────────┘

```

---

## Error Handling Flow

```
VALIDATION ERRORS:
═════════════════════════════════════════════════════════════════

FORM VALIDATION:
Step 2 Form → Validate all fields
  ├─ Email invalid?
  │   → Show toast: "Invalid email format"
  │   → Stay on step 2
  │
  ├─ Password < 8 chars?
  │   → Show toast: "Password must be 8+ characters"
  │   → Stay on step 2
  │
  ├─ Passwords don't match?
  │   → Show toast: "Passwords do not match"
  │   → Stay on step 2
  │
  ├─ Email already exists?
  │   → Show toast: "Email already registered"
  │   → Stay on step 2
  │
  └─ All valid?
      → Proceed to Step 3

POLICY ACCEPTANCE:
Step 3 Modal → User must scroll to bottom
  ├─ Not scrolled enough?
  │   → Accept button DISABLED
  │   → Show: "Scroll down to read all policies"
  │
  └─ Scrolled to bottom?
      → Accept button ENABLED
      → User can click "I Accept & Continue"

OTP VERIFICATION:
Step 4 OTP → User enters 6-digit code
  ├─ Invalid code?
  │   → Show toast: "Invalid code. Try again"
  │   → Show: "Resend code" button
  │
  ├─ Code expired?
  │   → Show toast: "Code expired. Request new one"
  │   → Allow resend
  │
  └─ Valid code?
      → Proceed to account creation
      → Close modal
      → Redirect to dashboard

```

---

## Summary

This comprehensive visual guide shows:
1. ✅ Step-by-step signup and signin flows
2. ✅ Progress bar states at each step
3. ✅ Policy scroll tracking mechanism
4. ✅ Component relationships
5. ✅ Notification creation and display
6. ✅ Service fee calculation flow
7. ✅ Modal state management
8. ✅ Responsive design breakpoints
9. ✅ Error handling procedures

All flows are designed to be intuitive, user-friendly, and secure!
