"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { ShieldAlert, Lock } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAdmin?: boolean;
}

export function AuthGuard({ children, fallback, requireAdmin }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 border-2 border-indigo-500/30 border-t-cyan-400 rounded-full animate-spin" />
        <p className="text-xs font-mono text-slate-400">Verifying session authority...</p>
      </div>
    );
  }

  if (!user) {
    return (
      fallback || (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <div className="max-w-md w-full p-8 rounded-3xl bg-surface-200 border border-slate-800 text-center space-y-4 shadow-glass">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
              <Lock className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">Authentication Required</h2>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                Redirecting to the TruthLens Sign In portal...
              </p>
            </div>
          </div>
        </div>
      )
    );
  }

  if (requireAdmin && user.role !== "ADMIN" && user.role !== "STUDENT") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-surface-200 border border-red-500/30 text-center space-y-4 shadow-glass">
          <div className="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400 mx-auto">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">Restricted Authority</h2>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              Your account does not have issuer privileges.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
