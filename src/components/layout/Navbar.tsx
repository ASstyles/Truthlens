"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  Github,
  Wallet,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Lock,
  User,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/lib/firebase/auth-context";

export function Navbar() {
  const pathname = usePathname();
  const { user, githubConnected, githubUsername, connectGithub, linkWallet, signOut } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Derived strictly from authenticated user profile
  const walletAddress = user?.walletAddress || null;

  // Listen to accountsChanged in browser wallet
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum && user?.uid) {
      const ethereum = (window as any).ethereum;

      const handleAccounts = (accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          linkWallet(accounts[0]);
        } else {
          linkWallet(null);
        }
      };

      ethereum.on?.("accountsChanged", handleAccounts);
      return () => {
        ethereum.removeListener?.("accountsChanged", handleAccounts);
      };
    }
  }, [user?.uid]);

  const connectWallet = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      alert("No Web3 wallet detected. Please install MetaMask or a compatible EVM wallet.");
      return;
    }

    setWalletConnecting(true);
    setNetworkError(null);
    try {
      const ethereum = (window as any).ethereum;
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      if (accounts && accounts[0]) {
        await linkWallet(accounts[0]);
      }

      // Check Polygon Amoy chainId (0x13882 = 80002)
      try {
        const chainId = await ethereum.request({ method: "eth_chainId" });
        if (chainId !== "0x13882") {
          await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x13882" }],
          });
        }
      } catch (switchErr: any) {
        if (switchErr.code === 4902) {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x13882",
                chainName: "Polygon Amoy Testnet",
                nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
                rpcUrls: ["https://rpc-amoy.polygon.technology/"],
                blockExplorerUrls: ["https://amoy.polygonscan.com/"],
              },
            ],
          });
        }
      }
    } catch (err: any) {
      console.warn("Wallet connection failed:", err);
      setNetworkError(err.message || "Failed to connect wallet");
    } finally {
      setWalletConnecting(false);
    }
  };

  const navLinks = [
    { name: "Product", href: "/#product" },
    { name: "How It Works", href: "/#how-it-works" },
    { name: "Verification", href: "/verify/TL-2026-8492-v1" },
    { name: "For Recruiters", href: "/recruiter" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-background/85 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 p-0.5 shadow-glow group-hover:scale-105 transition-transform">
                <div className="h-full w-full rounded-xl bg-surface-300 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-cyan-400" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-mono font-extrabold text-base tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                  TRUTHLENS
                </span>
                <span className="text-[10px] font-mono text-slate-400 hidden sm:block">
                  Proof of Competence
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`text-xs font-semibold tracking-wide transition-colors ${
                      isActive ? "text-cyan-400" : "text-slate-300 hover:text-white"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action Controls */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {/* Connected GitHub Pill */}
                {githubConnected ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono">
                    <Github className="h-3.5 w-3.5" />
                    <span>@{githubUsername || "connected"}</span>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Github className="h-3.5 w-3.5" />}
                    onClick={connectGithub}
                  >
                    Connect GitHub
                  </Button>
                )}

                {/* Web3 Wallet Connection */}
                <Button
                  size="sm"
                  variant={walletAddress ? "outline" : "secondary"}
                  leftIcon={<Wallet className="h-3.5 w-3.5 text-cyan-400" />}
                  onClick={connectWallet}
                  isLoading={walletConnecting}
                >
                  {walletAddress
                    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                    : "Connect Wallet"}
                </Button>

                {/* Authenticated Dashboard Link */}
                <Link href="/dashboard">
                  <Button size="sm" variant="cyan">
                    Dashboard
                  </Button>
                </Link>

                {/* User Profile / Sign Out */}
                <button
                  onClick={signOut}
                  title="Sign Out"
                  className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-surface-100 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <Link href="/login">
                <Button size="sm" variant="cyan" rightIcon={<ChevronRight className="h-3.5 w-3.5" />}>
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-surface-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-surface-300/95 backdrop-blur-2xl px-4 py-6 space-y-4">
          <nav className="space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-semibold text-slate-300 hover:text-white py-1"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="pt-4 border-t border-slate-800 space-y-3">
            {user ? (
              <>
                <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
                  <span>{user.email}</span>
                  {githubConnected && <span>@{githubUsername}</span>}
                </div>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block w-full">
                  <Button size="sm" variant="cyan" className="w-full">
                    Go to Dashboard
                  </Button>
                </Link>
                <Button size="sm" variant="outline" className="w-full" onClick={signOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block w-full">
                <Button size="sm" variant="cyan" className="w-full">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
