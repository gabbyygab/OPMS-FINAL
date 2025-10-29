# Modal-Based Authentication Implementation Guide

## Overview
This guide explains how to integrate the newly created modal components with your existing authentication pages.

## Components Created

### 1. **PolicyAcceptanceModal.jsx**
- Location: `src/components/auth/PolicyAcceptanceModal.jsx`
- Purpose: Display privacy policies with scroll tracking
- Features:
  - Shows guest or host-specific policies based on userRole prop
  - Accept button only enabled after user scrolls to bottom
  - Displays "Decline" and "I Accept & Continue" buttons
  - Shows loading state while processing

**Usage:**
```jsx
<PolicyAcceptanceModal
  onAccept={() => handleAcceptPolicy()}
  onCancel={() => handleDeclinePolicy()}
  userRole="guest" // or "host"
  isLoading={false}
/>
```

### 2. **ProgressBar.jsx**
- Location: `src/components/auth/ProgressBar.jsx`
- Purpose: Show signup progress across steps
- Features:
  - Displays 4 steps: Choose Role → Enter Details → Accept Policies → Verify Email
  - Visual progress bar with percentage
  - Completed steps show checkmarks
  - Responsive design (labels hidden on mobile)

**Usage:**
```jsx
<ProgressBar
  currentStep={2}
  totalSteps={4}
  steps={defaultSteps}
/>
```

### 3. **RoleSelectionModal.jsx**
- Location: `src/components/auth/RoleSelectionModal.jsx`
- Purpose: Let user choose between Guest and Host
- Features:
  - Two beautiful cards for Guest and Host options
  - Includes progress bar (Step 1 of 4)
  - Shows role features and benefits
  - Hover effects and animations

**Usage:**
```jsx
<RoleSelectionModal
  onSelectRole={(role) => handleSelectRole(role)}
  onCancel={() => closeModal()}
/>
```

### 4. **AuthModalContext.jsx**
- Location: `src/context/AuthModalContext.jsx`
- Purpose: Global state management for modals
- State Variables:
  - `showSignUpModal`: Whether signup modal is visible
  - `showSignInModal`: Whether signin modal is visible
  - `signUpRole`: Current signup role ("guest" or "host")
  - `signUpStep`: Current signup step (1-4)

**Functions:**
- `openSignUp()`: Opens signup modal
- `closeSignUp()`: Closes signup modal
- `selectSignUpRole(role)`: Sets role and moves to step 2
- `moveToSignUpStep(step)`: Navigate to specific step

---

## Implementation Steps

### Step 1: Wrap App with AuthModalProvider
In your `src/main.jsx` or `src/App.jsx`:

```jsx
import { AuthModalProvider } from "./context/AuthModalContext";

function App() {
  return (
    <AuthModalProvider>
      {/* Your existing app code */}
    </AuthModalProvider>
  );
}
```

### Step 2: Update LandingPage.jsx
Replace the Sign In and Sign Up buttons to use modals instead of navigation:

**Current Code (NavigationBar):**
```jsx
<Link to={ROUTES.LOGIN}>Sign In</Link>
<Link to={ROUTES.GUEST.SIGNUP}>Sign Up</Link>
```

**New Code:**
```jsx
import { useContext } from "react";
import { AuthModalContext } from "../context/AuthModalContext";

function NavigationBar() {
  const { openSignUp, openSignIn } = useContext(AuthModalContext);

  return (
    <>
      <button onClick={openSignIn}>Sign In</button>
      <button onClick={openSignUp}>Sign Up</button>

      {/* Rest of navbar */}
    </>
  );
}
```

### Step 3: Create SignUpModal Component
Create `src/components/auth/SignUpModal.jsx`:

```jsx
import { useContext, useState } from "react";
import { AuthModalContext } from "../../context/AuthModalContext";
import RoleSelectionModal from "./RoleSelectionModal";
import ProgressBar from "./ProgressBar";
import PolicyAcceptanceModal from "./PolicyAcceptanceModal";

export default function SignUpModal() {
  const {
    showSignUpModal,
    closeSignUp,
    signUpRole,
    signUpStep,
    selectSignUpRole,
    moveToSignUpStep
  } = useContext(AuthModalContext);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!showSignUpModal) return null;

  const steps = [
    { number: 1, label: "Choose Role" },
    { number: 2, label: "Enter Details" },
    { number: 3, label: "Accept Policies" },
    { number: 4, label: "Verify Email" },
  ];

  // Step 1: Role Selection
  if (signUpStep === 1) {
    return (
      <RoleSelectionModal
        onSelectRole={selectSignUpRole}
        onCancel={closeSignUp}
      />
    );
  }

  // Step 2: Form Details
  if (signUpStep === 2) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col">
        <ProgressBar currentStep={2} totalSteps={4} steps={steps} />

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              Create your {signUpRole === "host" ? "Host" : "Guest"} Account
            </h2>

            <form onSubmit={(e) => {
              e.preventDefault();
              moveToSignUpStep(3);
            }}>
              {/* Your existing form fields */}
              <input
                type="text"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                className="w-full px-4 py-2 mb-4 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-indigo-500 outline-none"
                required
              />

              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-2 mb-4 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-indigo-500 outline-none"
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-2 mb-4 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-indigo-500 outline-none"
                required
              />

              <input
                type="password"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full px-4 py-2 mb-6 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-indigo-500 outline-none"
                required
              />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeSignUp}
                  className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700/50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Next
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Policy Acceptance
  if (signUpStep === 3) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col">
        <ProgressBar currentStep={3} totalSteps={4} steps={steps} />

        <div className="flex-1">
          <PolicyAcceptanceModal
            onAccept={async () => {
              setIsLoading(true);
              // Move to email verification
              moveToSignUpStep(4);
              setIsLoading(false);
            }}
            onCancel={() => moveToSignUpStep(2)}
            userRole={signUpRole}
            isLoading={isLoading}
          />
        </div>
      </div>
    );
  }

  // Step 4: Email Verification (integrate with existing OTP flow)
  if (signUpStep === 4) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col">
        <ProgressBar currentStep={4} totalSteps={4} steps={steps} />

        {/* Embed your existing OTP verification component here */}
        <div className="flex-1 flex items-center justify-center p-4">
          {/* Your OTP verification UI */}
        </div>
      </div>
    );
  }
}
```

### Step 4: Create SignInModal Component
Create `src/components/auth/SignInModal.jsx`:

```jsx
import { useContext, useState } from "react";
import { AuthModalContext } from "../../context/AuthModalContext";
import PolicyAcceptanceModal from "./PolicyAcceptanceModal";

export default function SignInModal() {
  const { showSignInModal, closeSignIn } = useContext(AuthModalContext);
  const [step, setStep] = useState("form"); // "form" or "policy"
  const [isLoading, setIsLoading] = useState(false);

  if (!showSignInModal) return null;

  // Step 1: Sign In Form
  if (step === "form") {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Sign In</h2>

          <form onSubmit={(e) => {
            e.preventDefault();
            setStep("policy");
          }}>
            {/* Your existing signin form */}
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-2 mb-4 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-indigo-500 outline-none"
              required
            />

            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-2 mb-6 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-indigo-500 outline-none"
              required
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeSignIn}
                className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700/50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Next
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Step 2: Policy Acceptance
  if (step === "policy") {
    return (
      <PolicyAcceptanceModal
        onAccept={async () => {
          setIsLoading(true);
          // Complete signin process
          closeSignIn();
          setIsLoading(false);
        }}
        onCancel={() => setStep("form")}
        userRole="guest" // or determine from user data
        isLoading={isLoading}
      />
    );
  }
}
```

### Step 5: Add Modals to App Root
In your main App component:

```jsx
import SignUpModal from "./components/auth/SignUpModal";
import SignInModal from "./components/auth/SignInModal";

function App() {
  return (
    <>
      {/* Your existing content */}

      {/* Auth Modals */}
      <SignUpModal />
      <SignInModal />
    </>
  );
}
```

---

## Integration Checklist

- [ ] Add `AuthModalProvider` to App wrapper
- [ ] Create `SignUpModal.jsx` component
- [ ] Create `SignInModal.jsx` component
- [ ] Update `NavigationBar.jsx` to use context instead of Links
- [ ] Update `LandingPage.jsx` buttons
- [ ] Integrate existing form validation logic
- [ ] Integrate existing OTP verification logic
- [ ] Test signup flow (all 4 steps)
- [ ] Test signin flow (with policy acceptance)
- [ ] Test policy scroll tracking
- [ ] Verify progress bar updates correctly
- [ ] Test role selection and form reset

---

## Key Features Implemented

✅ Modal-based authentication (no page redirects)
✅ Progress bar showing signup steps
✅ Policy acceptance with scroll tracking
✅ Guest vs Host role selection
✅ Role-specific policies displayed
✅ Accept button disabled until policies read
✅ Responsive design
✅ Loading states
✅ Smooth transitions and animations
✅ Context-based state management

---

## Testing Guide

### Test Signup Flow:
1. Click "Sign Up" button
2. Select "Guest" role → Verify step 1→2 transition
3. Enter form data → Click "Next"
4. Policy modal appears → Try to click accept (disabled)
5. Scroll to bottom → Accept button enabled
6. Click "I Accept & Continue" → Move to OTP step
7. Complete OTP verification

### Test Signin Flow:
1. Click "Sign In" button
2. Enter email/password
3. Click next
4. Policy modal appears
5. Scroll and accept
6. Signin completes

### Test Progress Bar:
- Step 1: Choose Role (1/4)
- Step 2: Enter Details (2/4)
- Step 3: Accept Policies (3/4)
- Step 4: Verify Email (4/4)

---

## Notes

- All modals have backdrop blur effect
- Progress bar is sticky at top during signup
- Policy text is formatted with headings and lists
- Accept button styling changes based on scroll state
- Loading states prevent double submission
- Mobile responsive design maintained
- Animations are smooth and performant

---

## Future Enhancements

- Add email verification step visual
- Add phone number verification option
- Add terms of service as separate modal
- Add cookie consent modal
- Add two-factor authentication flow
- Remember "stay signed in" option
