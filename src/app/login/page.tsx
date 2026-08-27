"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowRight,
  Lock,
  Mail,
  User,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  Github,
  KeyRound,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/firebase/auth-context";

export default function AuthenticationPage() {
  const router = useRouter();
  const {
    user,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithGithub,
    resetPassword,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");

  // Sign In State (Strictly empty defaults)
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign Up State (Strictly empty defaults)
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // Forgot Password State
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  // Status & Feedback
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "github" | null>(null);

  // Force empty fields on initial render to prevent browser autofill injection
  useEffect(() => {
    setSignInEmail("");
    setSignInPassword("");
    setSignUpName("");
    setSignUpEmail("");
    setSignUpPassword("");
    setSignUpConfirmPassword("");
    setForgotPasswordEmail("");
  }, [activeTab]);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = signInEmail.trim();
    const cleanPassword = signInPassword.trim();

    if (!cleanEmail || !cleanPassword) {
      setError("Please enter both your email address and password.");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmail(cleanEmail, cleanPassword);
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Sign-in failed:", err);
      let friendly = err.message || "Failed to sign in. Please verify your credentials.";
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        friendly = "Invalid email or password. Please check your credentials.";
      } else if (err.code === "auth/invalid-email") {
        friendly = "Please enter a valid email address format.";
      } else if (err.code === "auth/too-many-requests") {
        friendly = "Access temporarily disabled due to multiple failed attempts. Please try again later.";
      }
      setError(friendly);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanName = signUpName.trim();
    const cleanEmail = signUpEmail.trim();
    const cleanPassword = signUpPassword.trim();
    const cleanConfirm = signUpConfirmPassword.trim();

    if (!cleanName || !cleanEmail || !cleanPassword || !cleanConfirm) {
      setError("Please fill in all registration fields.");
      return;
    }

    if (cleanPassword !== cleanConfirm) {
      setError("Passwords do not match. Please verify your password confirmation.");
      return;
    }

    if (cleanPassword.length < 6) {
      setError("Password must be at least 6 characters in length.");
      return;
    }

    setLoading(true);
    try {
      await signUpWithEmail(cleanEmail, cleanPassword, cleanName);
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Sign-up failed:", err);
      let friendly = err.message || "Failed to create account.";
      if (err.code === "auth/email-already-in-use") {
        friendly = "An account with this email already exists. Please sign in instead.";
      } else if (err.code === "auth/weak-password") {
        friendly = "Password is too weak. Please use at least 6 characters.";
      } else if (err.code === "auth/invalid-email") {
        friendly = "Please enter a valid email address.";
      }
      setError(friendly);
    } finally {
      setLoading(false);
    }
  };

  const mapAuthError = (err: any, provider: string) => {
    if (!err) return `${provider} authentication failed.`;
    const code = err.code || "";
    const msg = err.message || "";

    if (code === "auth/popup-closed-by-user") {
      return `${provider} sign-in was cancelled (popup closed).`;
    }
    if (code === "auth/popup-blocked") {
      return `Your browser blocked the authentication popup. Please allow popups for localhost:3000 and try again.`;
    }
    if (code === "auth/unauthorized-domain") {
      return `Domain 'localhost' is not authorized in Firebase. Please add 'localhost' to Firebase Console -> Authentication -> Settings -> Authorized domains.`;
    }
    if (code === "auth/operation-not-allowed") {
      return `${provider} sign-in is not enabled in Firebase. Please enable ${provider} in Firebase Console -> Authentication -> Sign-in method.`;
    }
    if (code === "auth/account-exists-with-different-credential") {
      return `An account already exists with this email address using another sign-in method. Please sign in with that method.`;
    }
    if (code === "auth/network-request-failed") {
      return `Network connection failed. Please check your internet connection.`;
    }
    if (code === "auth/invalid-api-key") {
      return `Firebase API key is invalid. Please check NEXT_PUBLIC_FIREBASE_API_KEY in .env.local.`;
    }
    return msg || `${provider} authentication could not be completed. Please try again.`;
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setSocialLoading("google");
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Google auth failed:", err);
      setError(mapAuthError(err, "Google"));
    } finally {
      setSocialLoading(null);
    }
  };

  const handleGithubAuth = async () => {
    setError(null);
    setSocialLoading("github");
    try {
      await signInWithGithub();
      router.push("/dashboard");
    } catch (err: any) {
      console.error("GitHub auth failed:", err);
      setError(mapAuthError(err, "GitHub"));
    } finally {
      setSocialLoading(null);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail.trim()) {
      setError("Please enter your email address to reset your password.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await resetPassword(forgotPasswordEmail.trim());
      setResetSent(true);
      setSuccessMsg("Password reset email sent! Check your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to send password reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[88vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-7 p-8 sm:p-10 rounded-3xl bg-surface-200/90 border border-slate-800 backdrop-blur-xl shadow-glass">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 p-0.5 shadow-glow mx-auto">
            <div className="h-full w-full rounded-2xl bg-surface-300 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-cyan-400" />
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono uppercase">
              TRUTHLENS
            </h1>
            <p className="text-xs font-medium text-slate-400 font-mono">
              Proof of Competence for the AI Era
            </p>
          </div>
        </div>

        {/* Tab Switcher: [ Sign In ] [ Sign Up ] */}
        {!forgotPasswordOpen && (
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-surface-100 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab("signin");
                setError(null);
                setSuccessMsg(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === "signin"
                  ? "bg-indigo-600/30 text-cyan-300 border border-indigo-500/40 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("signup");
                setError(null);
                setSuccessMsg(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === "signup"
                  ? "bg-indigo-600/30 text-cyan-300 border border-indigo-500/40 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-300 text-xs">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Success Notification */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-emerald-300 text-xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMsg}</span>
          </div>
        )}

        {/* 1. FORGOT PASSWORD VIEW */}
        {forgotPasswordOpen ? (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4" autoComplete="off">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-white">Reset Your Password</h2>
              <p className="text-xs text-slate-400">
                Enter your email address and we&apos;ll send you a password reset link.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  name="truthlens_reset_email"
                  autoComplete="off"
                  required
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  placeholder="Enter your email address"
                  disabled={loading || resetSent}
                  className="w-full bg-surface-100 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              variant="cyan"
              className="w-full"
              isLoading={loading}
              disabled={resetSent}
            >
              {resetSent ? "Reset Link Sent" : "Send Reset Link"}
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setForgotPasswordOpen(false);
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-xs text-slate-400 hover:text-cyan-300 transition-colors font-mono"
              >
                ← Back to Sign In
              </button>
            </div>
          </form>
        ) : activeTab === "signin" ? (
          /* 2. SIGN IN TAB */
          <form onSubmit={handleSignInSubmit} className="space-y-4" autoComplete="off">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  name="truthlens_signin_email"
                  autoComplete="off"
                  required
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  placeholder="Enter your email address"
                  disabled={loading}
                  className="w-full bg-surface-100 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordEmail(signInEmail);
                    setForgotPasswordOpen(true);
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-[11px] text-cyan-400 hover:underline font-mono"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showSignInPassword ? "text" : "password"}
                  name="truthlens_signin_password"
                  autoComplete="new-password"
                  required
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={loading}
                  className="w-full bg-surface-100 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowSignInPassword(!showSignInPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              variant="cyan"
              className="w-full mt-2"
              isLoading={loading && !socialLoading}
              rightIcon={!loading ? <ArrowRight className="h-4 w-4" /> : undefined}
            >
              {loading && !socialLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        ) : (
          /* 3. SIGN UP TAB */
          <form onSubmit={handleSignUpSubmit} className="space-y-4" autoComplete="off">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  name="truthlens_signup_name"
                  autoComplete="off"
                  required
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  placeholder="Enter your full name"
                  disabled={loading}
                  className="w-full bg-surface-100 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  name="truthlens_signup_email"
                  autoComplete="off"
                  required
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  placeholder="Enter your email address"
                  disabled={loading}
                  className="w-full bg-surface-100 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showSignUpPassword ? "text" : "password"}
                  name="truthlens_signup_password"
                  autoComplete="new-password"
                  required
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  placeholder="Create a password"
                  disabled={loading}
                  className="w-full bg-surface-100 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showSignUpPassword ? "text" : "password"}
                  name="truthlens_signup_confirm_password"
                  autoComplete="new-password"
                  required
                  value={signUpConfirmPassword}
                  onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  disabled={loading}
                  className="w-full bg-surface-100 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              variant="cyan"
              className="w-full mt-2"
              isLoading={loading && !socialLoading}
              rightIcon={!loading ? <ArrowRight className="h-4 w-4" /> : undefined}
            >
              {loading && !socialLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
        )}

        {/* ──────── OR ──────── Social Authentication */}
        {!forgotPasswordOpen && (
          <div className="space-y-4 pt-1">
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-surface-200 px-3 text-[11px] font-mono text-slate-400 uppercase tracking-wider relative">
                OR
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading || socialLoading !== null}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-surface-100 border border-slate-700/80 hover:border-slate-600 text-sm font-semibold text-white transition-all hover:bg-surface-300 disabled:opacity-50 shadow-sm"
              >
                {socialLoading === "google" ? (
                  <div className="h-4 w-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>{socialLoading === "google" ? "Connecting with Google..." : "Continue with Google"}</span>
              </button>

              {/* GitHub Sign In */}
              <button
                type="button"
                onClick={handleGithubAuth}
                disabled={loading || socialLoading !== null}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-surface-100 border border-slate-700/80 hover:border-slate-600 text-sm font-semibold text-white transition-all hover:bg-surface-300 disabled:opacity-50 shadow-sm"
              >
                {socialLoading === "github" ? (
                  <div className="h-4 w-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Github className="h-4 w-4 text-white shrink-0" />
                )}
                <span>{socialLoading === "github" ? "Connecting with GitHub..." : "Continue with GitHub"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Supporting Footer */}
        <div className="pt-2 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500 font-mono">
            Secured by Firebase Authentication & Polygon Blockchain Anchor
          </p>
        </div>
      </div>
    </div>
  );
}
