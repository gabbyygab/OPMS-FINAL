// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { toast } from "react-toastify";

const AuthContext = createContext();

// Custom hook so you can just call useAuth()
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Firebase Auth user
  const [userData, setUserData] = useState(null); // Firestore user doc
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(true);

      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);

        // 👇 Real-time listener for this user's Firestore doc
        const unsubscribeUser = onSnapshot(userRef, async (userSnap) => {
          if (userSnap.exists()) {
            const data = userSnap.data();

            // Check if user has been deactivated
            if (data.status === "deactivated") {
              // Sign out the user immediately
              toast.error("Your account has been deactivated by an administrator. Please contact support for more information.");

              try {
                await signOut(auth);
                // User will be redirected to landing page by the auth state change
                setUserData(null);
                setIsVerified(false);
                setLoading(false);
              } catch (error) {
                console.error("Error signing out deactivated user:", error);
              }
              return;
            }

            setUserData(data);
            setIsVerified(data.isVerified ?? false);
          } else {
            setUserData(null);
            setIsVerified(false);
          }
          setLoading(false);
        });

        return () => unsubscribeUser(); // stop listener when user logs out
      } else {
        setUserData(null);
        setIsVerified(false);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, isVerified }}>
      {children}
    </AuthContext.Provider>
  );
};
