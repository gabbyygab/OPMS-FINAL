// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

import { onSnapshot } from "firebase/firestore";

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
        const unsubscribeUser = onSnapshot(userRef, (userSnap) => {
          if (userSnap.exists()) {
            const data = userSnap.data();
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
