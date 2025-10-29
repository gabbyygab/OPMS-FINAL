import { createContext, useState } from "react";

export const AuthModalContext = createContext();

export function AuthModalProvider({ children }) {
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [signUpRole, setSignUpRole] = useState(null); // "guest" or "host"
  const [signUpStep, setSignUpStep] = useState(1); // 1: Role, 2: Details, 3: Policy, 4: OTP

  const openSignUp = () => {
    setShowSignUpModal(true);
    setSignUpStep(1);
    setSignUpRole(null);
  };

  const closeSignUp = () => {
    setShowSignUpModal(false);
    setSignUpStep(1);
    setSignUpRole(null);
  };

  const openSignIn = () => {
    setShowSignInModal(true);
  };

  const closeSignIn = () => {
    setShowSignInModal(false);
  };

  const moveToSignUpStep = (step) => {
    setSignUpStep(step);
  };

  const selectSignUpRole = (role) => {
    setSignUpRole(role);
    setSignUpStep(2);
  };

  return (
    <AuthModalContext.Provider
      value={{
        showSignUpModal,
        showSignInModal,
        signUpRole,
        signUpStep,
        openSignUp,
        closeSignUp,
        openSignIn,
        closeSignIn,
        moveToSignUpStep,
        selectSignUpRole,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}
