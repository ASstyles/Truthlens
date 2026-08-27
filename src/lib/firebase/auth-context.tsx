"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  GithubAuthProvider,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, firestore as db, googleProvider, githubProvider } from "./client";
import { UserProfile } from "../types";

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  githubConnected: boolean;
  githubUsername: string | null;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  connectGithub: () => Promise<void>;
  disconnectGithub: () => Promise<void>;
  linkWallet: (walletAddress: string | null) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to read client-side cookie values by name
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

// Helper to delete client cookie
function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubUsername, setGithubUsername] = useState<string | null>(null);

  // Listen to live Firebase Auth state changes
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        try {
          const token = await fbUser.getIdToken();

          // 1. Fetch user profile from Firestore users/{uid}
          let userProfile: UserProfile | null = null;
          if (db) {
            try {
              const userDoc = await getDoc(doc(db, "users", fbUser.uid));
              if (userDoc.exists()) {
                userProfile = userDoc.data() as UserProfile;
              } else {
                const newProfile: UserProfile = {
                  uid: fbUser.uid,
                  name: fbUser.displayName || fbUser.email?.split("@")[0] || "Developer",
                  email: fbUser.email || "",
                  photoURL: fbUser.photoURL || undefined,
                  role: "STUDENT",
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                await setDoc(doc(db, "users", fbUser.uid), newProfile, { merge: true });
                userProfile = newProfile;
              }
            } catch (firestoreErr) {
              console.warn("[TruthLens Auth] Firestore profile fetch note:", firestoreErr);
            }
          }

          if (!userProfile) {
            userProfile = {
              uid: fbUser.uid,
              name: fbUser.displayName || fbUser.email?.split("@")[0] || "Developer",
              email: fbUser.email || "",
              photoURL: fbUser.photoURL || undefined,
              role: "STUDENT",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          }

          // 2. Fetch server-side isolated profile and GitHub connection for this specific UID
          try {
            const profileRes = await fetch(`/api/user/profile?uid=${encodeURIComponent(fbUser.uid)}`);
            if (profileRes.ok) {
              const profileData = await profileRes.json();
              if (profileData.user) {
                userProfile = {
                  ...userProfile,
                  ...profileData.user,
                  walletAddress: profileData.walletAddress ?? userProfile.walletAddress,
                };
              }
              setGithubConnected(Boolean(profileData.githubConnected));
              setGithubUsername(profileData.githubUsername || null);
            } else {
              setGithubConnected(false);
              setGithubUsername(null);
            }
          } catch (profileApiErr) {
            console.warn("[TruthLens Auth] User profile endpoint sync note:", profileApiErr);
            setGithubConnected(false);
            setGithubUsername(null);
          }

          const activeProfile: UserProfile = userProfile || {
            uid: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split("@")[0] || "Developer",
            email: fbUser.email || "",
            photoURL: fbUser.photoURL || undefined,
            role: "STUDENT",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // 3. Sync server session for this UID
          try {
            await fetch("/api/auth/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                uid: activeProfile.uid,
                name: activeProfile.name,
                email: activeProfile.email,
                photoURL: activeProfile.photoURL,
                walletAddress: activeProfile.walletAddress,
                githubUsername: activeProfile.githubUsername,
                idToken: token,
              }),
            });
          } catch (sessionErr) {
            console.warn("[TruthLens Auth] Server session sync warning:", sessionErr);
          }

          setUser(activeProfile);
          if (typeof window !== "undefined") {
            localStorage.setItem(`truthlens:${fbUser.uid}:auth_user`, JSON.stringify(activeProfile));
          }
        } catch (error) {
          console.warn("[TruthLens Auth] Auth state resolution exception:", error);
          const fallbackProfile: UserProfile = {
            uid: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split("@")[0] || "Developer",
            email: fbUser.email || "",
            photoURL: fbUser.photoURL || undefined,
            role: "STUDENT",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setUser(fallbackProfile);
          setGithubConnected(false);
          setGithubUsername(null);
        }
      } else {
        // Logged out in Firebase: completely reset in-memory state
        setUser(null);
        setGithubConnected(false);
        setGithubUsername(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Real Email & Password Sign In
   */
  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    const cleanEmail = email.trim();
    const cleanPass = pass.trim();

    if (!cleanEmail || !cleanPass) {
      setLoading(false);
      throw new Error("Please enter both email address and password.");
    }

    if (!auth) {
      setLoading(false);
      throw new Error("Firebase Authentication is not initialized. Please verify configuration in .env.local.");
    }

    try {
      const res = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
      const token = await res.user.getIdToken();

      const profile: UserProfile = {
        uid: res.user.uid,
        name: res.user.displayName || cleanEmail.split("@")[0],
        email: cleanEmail,
        photoURL: res.user.photoURL || undefined,
        role: "STUDENT",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: profile.uid,
          name: profile.name,
          email: profile.email,
          photoURL: profile.photoURL,
          idToken: token,
        }),
      });

      setUser(profile);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Real Email & Password Sign Up
   */
  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    setLoading(true);
    const cleanEmail = email.trim();
    const cleanPass = pass.trim();
    const cleanName = name.trim();

    if (!cleanEmail || !cleanPass || !cleanName) {
      setLoading(false);
      throw new Error("Please fill in all fields (Full Name, Email Address, and Password).");
    }

    if (cleanPass.length < 6) {
      setLoading(false);
      throw new Error("Password must be at least 6 characters in length.");
    }

    if (!auth) {
      setLoading(false);
      throw new Error("Firebase Authentication is not initialized. Please verify configuration in .env.local.");
    }

    try {
      const res = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
      if (res.user) {
        await updateProfile(res.user, { displayName: cleanName });
      }
      const token = await res.user.getIdToken();

      const profile: UserProfile = {
        uid: res.user.uid,
        name: cleanName,
        email: cleanEmail,
        role: "STUDENT",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (db) {
        try {
          await setDoc(doc(db, "users", res.user.uid), profile, { merge: true });
        } catch (dbErr) {
          console.warn("[TruthLens Auth] Could not write user profile to Firestore:", dbErr);
        }
      }

      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: profile.uid,
          name: profile.name,
          email: profile.email,
          idToken: token,
        }),
      });

      setUser(profile);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Real Google Authentication via Firebase
   */
  const signInWithGoogle = async () => {
    setLoading(true);
    if (!auth) {
      setLoading(false);
      throw new Error("Firebase Authentication is not configured. Check NEXT_PUBLIC_FIREBASE_API_KEY.");
    }

    try {
      const res = await signInWithPopup(auth, googleProvider);
      const token = await res.user.getIdToken();

      const profile: UserProfile = {
        uid: res.user.uid,
        name: res.user.displayName || res.user.email?.split("@")[0] || "Developer",
        email: res.user.email || "",
        photoURL: res.user.photoURL || undefined,
        role: "STUDENT",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (db) {
        try {
          await setDoc(doc(db, "users", res.user.uid), profile, { merge: true });
        } catch (dbErr) {
          console.warn("[TruthLens Auth] Could not save Google user profile to Firestore:", dbErr);
        }
      }

      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: profile.uid,
          name: profile.name,
          email: profile.email,
          photoURL: profile.photoURL,
          idToken: token,
        }),
      });

      setUser(profile);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Real GitHub Authentication via Firebase
   */
  const signInWithGithub = async () => {
    setLoading(true);
    if (!auth) {
      setLoading(false);
      throw new Error("Firebase Authentication is not configured. Check NEXT_PUBLIC_FIREBASE_API_KEY.");
    }

    try {
      const res = await signInWithPopup(auth, githubProvider);
      const credential = GithubAuthProvider.credentialFromResult(res);
      const githubAccessToken = credential?.accessToken;
      const ghUsername = (res as any)._tokenResponse?.screenName || res.user.displayName || res.user.email?.split("@")[0] || "github-user";
      const token = await res.user.getIdToken();

      const profile: UserProfile = {
        uid: res.user.uid,
        name: res.user.displayName || ghUsername,
        email: res.user.email || `${ghUsername}@users.noreply.github.com`,
        photoURL: res.user.photoURL || undefined,
        githubUsername: ghUsername,
        role: "STUDENT",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (db) {
        try {
          await setDoc(doc(db, "users", res.user.uid), profile, { merge: true });
        } catch (dbErr) {
          console.warn("[TruthLens Auth] Could not save GitHub profile to Firestore:", dbErr);
        }
      }

      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: profile.uid,
          name: profile.name,
          email: profile.email,
          photoURL: profile.photoURL,
          githubUsername: ghUsername,
          githubToken: githubAccessToken,
          idToken: token,
        }),
      });

      if (githubAccessToken) {
        setGithubConnected(true);
        setGithubUsername(ghUsername);
      }

      setUser(profile);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Password Reset Flow
   */
  const resetPassword = async (email: string) => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      throw new Error("Please enter your email address to receive a password reset link.");
    }
    if (!auth) {
      throw new Error("Firebase Authentication is not configured.");
    }
    await sendPasswordResetEmail(auth, cleanEmail);
  };

  /**
   * GitHub OAuth authorization for repository access
   */
  const connectGithub = async () => {
    if (typeof window !== "undefined") {
      const uidParam = user?.uid ? `?uid=${encodeURIComponent(user.uid)}` : "";
      const emailParam = user?.email ? `&email=${encodeURIComponent(user.email)}` : "";
      window.location.href = `/api/auth/github${uidParam}${emailParam}`;
    }
  };

  /**
   * Disconnect GitHub repository authorization for this user
   */
  const disconnectGithub = async () => {
    if (user?.uid) {
      try {
        await fetch(`/api/auth/github/disconnect?uid=${encodeURIComponent(user.uid)}`, { method: "POST" });
      } catch (e) {
        console.warn("Failed to call disconnect endpoint:", e);
      }
    }
    setGithubConnected(false);
    setGithubUsername(null);
    if (user) {
      setUser({ ...user, githubUsername: undefined });
    }
    deleteCookie("github_token");
    deleteCookie("github_username");
    deleteCookie("github_avatar");
    deleteCookie("github_connected");
  };

  /**
   * Link or unlink Web3 wallet for the authenticated user
   */
  const linkWallet = async (walletAddress: string | null) => {
    if (!user?.uid) return;
    try {
      const res = await fetch("/api/user/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          walletAddress,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser((prev) => (prev ? { ...prev, walletAddress: data.walletAddress || undefined } : null));
      }
    } catch (err) {
      console.warn("Failed to link wallet on server:", err);
      setUser((prev) => (prev ? { ...prev, walletAddress: walletAddress || undefined } : null));
    }
  };

  /**
   * Complete Sign Out & Session Purge
   */
  const signOut = async () => {
    try {
      if (auth) {
        await firebaseSignOut(auth);
      }
      await fetch("/api/auth/session", { method: "DELETE" });
    } catch (e) {
      console.warn("Error during sign out:", e);
    } finally {
      // Purge in-memory state
      setUser(null);
      setFirebaseUser(null);
      setGithubConnected(false);
      setGithubUsername(null);

      // Clean storage and cookies
      if (typeof window !== "undefined") {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith("truthlens")) {
            localStorage.removeItem(key);
          }
        }
        sessionStorage.clear();
        deleteCookie("truthlens_user_session");
        deleteCookie("github_token");
        deleteCookie("github_username");
        deleteCookie("github_avatar");
        deleteCookie("github_connected");
        deleteCookie("github_oauth_state");
        deleteCookie("github_oauth_uid");
        window.location.href = "/login";
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        githubConnected,
        githubUsername,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInWithGithub,
        resetPassword,
        connectGithub,
        disconnectGithub,
        linkWallet,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
