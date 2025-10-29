import { useState, useRef, useEffect } from "react";
import { CheckCircle, X } from "lucide-react";

export default function PolicyAcceptanceModal({
  onAccept,
  onCancel,
  userRole, // "guest" or "host"
  isLoading = false,
}) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const scrollContainerRef = useRef(null);

  // Guest Privacy Policy
  const guestPolicy = `
## GUEST PRIVACY POLICY & TERMS

### 1. Data Collection & Privacy

**Information We Collect:**
- Account Information: Full name, email address, phone number, profile photo
- Payment Information: Wallet balance, transaction history, payment methods (processed through PayPal)
- Booking Information: Check-in/check-out dates, number of guests, selected listings, booking preferences
- Location Data: Search locations, saved addresses
- Communication Data: Messages with hosts, reviews, ratings

**Data Usage:**
- To facilitate bookings and payments
- To provide customer support via messages
- To send booking confirmations and notifications
- To improve service recommendations
- To comply with legal obligations

**Data Security:**
- All payment data is processed through PayPal's secure servers
- Passwords are encrypted and never stored in plaintext
- Firebase Firestore encryption at rest is enabled
- Access to personal data is restricted to authorized staff

### 2. Booking Policy

**Creating a Booking:**
1. You browse listings (stays, experiences, or services)
2. You select dates/times and number of guests
3. You review total amount including service fee (5% of booking amount)
4. Booking is created with status: PENDING
5. Host receives notification to confirm or reject booking
6. Payment is NOT deducted until host confirms the booking

**Service Fee:**
- 5% service fee is charged on every confirmed booking
- Service fee is deducted from the booking amount to the platform (admin)
- You pay: Booking Amount + (Booking Amount × 0.05)
- Example: ₱1,000 booking = ₱1,050 total (₱50 service fee to admin)

### 3. Cancellation & Refund Policy

**Cancellation Rights:**
- Guest-initiated cancellation is NOT allowed without host approval
- You must contact host or submit cancellation request
- Host can accept or deny cancellation request
- Cancellation requests are visible to hosts through notifications

**Refund Process:**
1. You initiate cancellation request before booking date
2. Host receives notification of cancellation request
3. Host has right to:
   - Approve: Full refund (including service fee) returned to your wallet
   - Deny: Booking remains confirmed, you lose deposit

**Refund Timeline:**
- Refunds are processed within 24-48 hours after host approval
- Refund amount includes full booking cost + 5% service fee
- Refunded amount is credited back to your e-wallet

### 4. Payment & Wallet

**E-Wallet Features:**
- You can fund wallet using PayPal
- Wallet balance is used for booking payments
- No additional transaction fees for wallet funding (PayPal rates apply)
- Wallet transactions are tracked with full history

**Payment Processing:**
1. You select dates and confirm booking
2. Booking status: PENDING (no payment yet)
3. Host confirms booking
4. System deducts: Booking Amount + (5% Service Fee) from your wallet
5. You receive confirmation notification

### 5. Your Rights & Responsibilities

**Your Rights:**
- Right to view full booking details before confirmation
- Right to communicate with host via messages
- Right to submit cancellation requests
- Right to leave reviews and ratings
- Right to dispute unfair rejections

**Your Responsibilities:**
- Provide accurate personal information
- Fund wallet before host confirms booking
- Communicate respectfully with hosts
- Comply with host house rules/terms
- Appear for confirmed bookings on time

### 6. Data Retention & Deletion

**Data Retention:**
- Active booking data: Retained indefinitely
- Cancelled booking data: Retained for 7 years (compliance)
- Your messages: Retained for 2 years after account closure
- Financial records: Retained for 7 years (tax/legal)

**Right to Deletion:**
- You can request data deletion
- Non-financial data deleted within 30 days
- Financial records retained per legal requirements
- Account deletion is permanent and irreversible

By accepting this policy, you acknowledge that you have read and understand all terms and conditions.
`;

  // Host Privacy Policy
  const hostPolicy = `
## HOST PRIVACY POLICY & TERMS

### 1. Data Collection & Privacy

**Information We Collect:**
- Account Information: Full name, email, phone number, profile photo, bank account (for payouts)
- Listing Information: Titles, descriptions, photos, pricing, availability
- Transaction Data: Booking confirmations, payment received, commission deducted
- Communication Data: Messages with guests, support tickets
- Location Data: Listing addresses and locations

**Data Usage:**
- To manage bookings and guest interactions
- To process payments and commission deductions
- To send booking notifications and confirmations
- To display listings on platform
- To prevent fraud and ensure compliance

**Data Security:**
- Banking information encrypted and stored securely
- Payment processing through PayPal (PCI-DSS compliant)
- Access restricted to authorized staff and you
- Data backups encrypted at rest

### 2. Listing & Commission Policy

**Creating Listings:**
- You can create unlimited listings (stays, experiences, services)
- NO charges for creating listings
- NO monthly subscription fees
- Listings start as drafts and can be published when ready

**Commission Structure:**
- 5% service fee per confirmed booking (deducted from booking amount)
- Commission is paid by guest, not deducted from your earnings
- Example:
  - Guest books: ₱1,000
  - Service fee: ₱50 (5% to admin)
  - You receive: ₱1,000 (full amount)
  - Guest pays: ₱1,050 total

**Listing Management:**
- You can edit, deactivate, or delete listings anytime
- You can set custom availability windows
- You can set custom pricing per season
- You can add/remove photos and descriptions

### 3. Booking Management

**Incoming Bookings:**
- You receive real-time notifications for new booking requests
- Booking includes:
  - Guest information and contact details
  - Check-in/check-out dates
  - Number of guests
  - Total booking amount

**Confirmation Process:**
1. Review: You review guest profile and booking details
2. Accept/Reject:
   - Accept: Booking status = CONFIRMED
     - Payment is immediately deducted from guest wallet
     - You receive full booking amount (5% already deducted by guest)
   - Reject: Booking status = REJECTED
     - You must provide rejection reason
     - No payment is charged to guest

**Your Responsibilities:**
- Respond to booking requests within 24 hours
- Verify guest is legitimate before confirming
- Ensure listing availability matches booking dates
- Communicate any changes to confirmed guests

### 4. Cancellation & Refund Policy

**Your Authority:**
- You control all cancellation decisions
- Guests cannot cancel without your approval
- You receive cancellation requests with guest reason

**Handling Cancellation Requests:**
1. Guest submits cancellation request
2. You are notified and can:
   - Approve: Refund full amount (including 5% service fee) to guest
   - Deny: Booking remains confirmed, no refund issued

**Refund from Your Perspective:**
- You are NOT charged for refunds
- Refund amount includes the 5% service fee already deducted from guest
- Platform covers the service fee from admin account
- You lose potential revenue from cancelled booking

### 5. Payment & Payouts

**Earning Money:**
- You earn ₱X per booking (where X = full booking amount)
- 5% service fee is NOT deducted from your earnings
- Service fee is paid by guest, you receive 100%

**Payout Process:**
- You can view earnings in dashboard
- Payouts transferred to your bank account (via PayPal)
- Frequency: Weekly or monthly (configurable)
- Processing time: 3-5 business days after withdrawal request

**Withdrawal Requirements:**
- Minimum balance: ₱500 (configurable)
- Valid bank account linked to your account
- No pending disputes or chargebacks

### 6. Your Rights & Responsibilities

**Your Rights:**
- Right to reject any booking without reason
- Right to set custom cancellation policies
- Right to control listing availability
- Right to receive full booking amount (no commission deduction)
- Right to block problematic guests

**Your Responsibilities:**
- Maintain clean, accurate listing descriptions
- Respond to booking requests promptly
- Honor confirmed bookings (unless guest cancels)
- Treat guests fairly and respectfully
- Comply with local laws and regulations
- Maintain property/service quality standards

### 7. Data Retention & Deletion

**Data Retention:**
- Active listing data: Retained indefinitely
- Cancelled booking data: Retained for 7 years (compliance)
- Your messages: Retained for 2 years after account closure
- Financial records: Retained for 7 years (tax/legal)

**Right to Deletion:**
- You can request data deletion
- Non-financial data deleted within 30 days
- Financial records retained per legal requirements
- Account deletion is permanent and irreversible

By accepting this policy, you acknowledge that you have read and understand all terms and conditions.
`;

  const policy = userRole === "host" ? hostPolicy : guestPolicy;

  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollHeight, scrollTop, clientHeight } =
          scrollContainerRef.current;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
        setHasScrolledToBottom(isAtBottom);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex-shrink-0 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {userRole === "host"
                  ? "Host Terms & Policies"
                  : "Guest Terms & Policies"}
              </h2>
              <p className="text-slate-400 text-sm">
                Please read and accept the terms to continue
              </p>
            </div>
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="text-slate-400 hover:text-slate-200 transition disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Policy Content */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-6 text-slate-300 text-sm leading-relaxed"
        >
          <div className="prose prose-invert max-w-none prose-headings:text-white prose-headings:mb-3 prose-headings:mt-4 prose-p:mb-2 prose-strong:text-slate-100">
            {policy.split("\n").map((line, idx) => {
              if (line.startsWith("##")) {
                return (
                  <h2 key={idx} className="text-xl font-bold text-white mt-6 mb-3">
                    {line.replace("##", "").trim()}
                  </h2>
                );
              }
              if (line.startsWith("###")) {
                return (
                  <h3 key={idx} className="text-lg font-semibold text-indigo-300 mt-4 mb-2">
                    {line.replace("###", "").trim()}
                  </h3>
                );
              }
              if (line.startsWith("**") && line.endsWith(":**")) {
                return (
                  <h4 key={idx} className="font-semibold text-slate-200 mt-3 mb-2">
                    {line.replace(/\*\*/g, "").trim()}
                  </h4>
                );
              }
              if (line.startsWith("- ")) {
                return (
                  <li key={idx} className="ml-4 mb-1">
                    {line.replace("- ", "")}
                  </li>
                );
              }
              if (line.trim().match(/^\d+\./)) {
                return (
                  <li key={idx} className="ml-4 mb-2 font-medium text-slate-200">
                    {line}
                  </li>
                );
              }
              return (
                line.trim() && (
                  <p key={idx} className="mb-2">
                    {line}
                  </p>
                )
              );
            })}
          </div>
        </div>

        {/* Scroll Indicator */}
        {!hasScrolledToBottom && (
          <div className="px-6 py-3 border-t border-slate-700 bg-slate-900/50">
            <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-2">
              <span className="inline-block w-1 h-1 bg-amber-400 rounded-full animate-pulse"></span>
              Scroll down to read all policies and accept
            </p>
          </div>
        )}

        {/* Footer / Action Buttons */}
        <div className="p-6 border-t border-slate-700 flex-shrink-0 bg-gradient-to-r from-slate-900/50 to-slate-800/50 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-3 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700/50 hover:border-slate-500 transition disabled:opacity-50 font-medium"
          >
            Decline
          </button>
          <button
            onClick={onAccept}
            disabled={!hasScrolledToBottom || isLoading}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
              hasScrolledToBottom && !isLoading
                ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-700 hover:to-indigo-600 shadow-lg shadow-indigo-500/20"
                : "bg-slate-700 text-slate-500 cursor-not-allowed"
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                I Accept & Continue
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
