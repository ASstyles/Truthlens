import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, Database, Cpu } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-surface-400 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/30 border border-indigo-500/40">
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
              </div>
              <span className="text-base font-bold text-white tracking-wider font-mono">TRUTHLENS</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Proof of Competence for the AI Era. Evaluating demonstrated technical ability and anchoring non-transferable Soulbound credentials on Polygon Amoy.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <span>ERC-5192 Soulbound</span>
              <span>•</span>
              <span>IPFS Pinned</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Developer Dashboard</Link></li>
              <li><Link href="/dashboard/analyze" className="hover:text-white transition-colors">Repository Analyzer</Link></li>
              <li><Link href="/dashboard/assessment" className="hover:text-white transition-colors">Adaptive AI Assessment</Link></li>
              <li><Link href="/verify/TL-2026-8492-v1" className="hover:text-white transition-colors">Public Credential Verification</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Verification & Trust</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/recruiter" className="hover:text-white transition-colors">Recruiter Verification Portal</Link></li>
              <li><Link href="/verify" className="hover:text-white transition-colors">7-Layer Cryptographic Verification</Link></li>
              <li><Link href="/admin" className="hover:text-white transition-colors">Issuer & Revocation Authority</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Sign In Portal</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Infrastructure</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5 text-slate-300">
                <Lock className="h-3.5 w-3.5 text-indigo-400" />
                <span>Polygon Amoy Testnet (80002)</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <Database className="h-3.5 w-3.5 text-cyan-400" />
                <span>Canonical Pinata IPFS Pinning</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <Cpu className="h-3.5 w-3.5 text-purple-400" />
                <span>Google Gemini AI Reasoning</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 TruthLens Protocol. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 font-mono text-[11px]">Decentralized Proof-of-Competence Infrastructure</p>
        </div>
      </div>
    </footer>
  );
}
