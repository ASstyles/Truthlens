"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, ShieldCheck, QrCode, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function VerifyLookupPage() {
  const router = useRouter();
  const [credentialId, setCredentialId] = useState("");

  const sampleCredentials = [
    {
      id: "TL-2026-8492-v1",
      project: "Apex DEX Protocol",
      candidate: "Sample Candidate",
      score: 88,
      status: "ACTIVE",
    },
    {
      id: "TL-2026-NEUR-9021-v1",
      project: "NeuroMed AI Orchestrator",
      candidate: "Sample Candidate",
      score: 91,
      status: "ACTIVE",
    },
    {
      id: "TL-2026-SENT-4812-v1",
      project: "Sentinel Event Mesh",
      candidate: "Sample Candidate",
      score: 86,
      status: "ACTIVE",
    },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (credentialId.trim()) {
      router.push(`/verify/${encodeURIComponent(credentialId.trim())}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck className="h-3.5 w-3.5" />
          Public Verification Portal
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Verify Proof-of-Competence Credential
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Enter any TruthLens Credential ID to execute real-time independent 7-point cryptographic verification against Polygon Amoy Testnet and canonical IPFS metadata.
        </p>
      </div>

      {/* Search Input Card */}
      <Card variant="glow" className="p-8 space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. TL-2026-8492-v1"
              value={credentialId}
              onChange={(e) => setCredentialId(e.target.value)}
              className="w-full bg-surface-100 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>
          <Button size="lg" variant="cyan" type="submit" rightIcon={<ArrowRight className="h-4 w-4" />}>
            Verify Credential
          </Button>
        </form>
        <p className="text-[11px] text-slate-500 text-center">
          Decentralized verification does not require account creation or login.
        </p>
      </Card>

      {/* Sample Verified Credentials */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Quick Verification Demo Credentials
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {sampleCredentials.map((c) => (
            <div
              key={c.id}
              onClick={() => router.push(`/verify/${c.id}`)}
              className="p-4 rounded-2xl bg-surface-100 border border-slate-800 hover:border-indigo-500/50 hover:shadow-glow cursor-pointer transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-cyan-400 font-bold">{c.id}</span>
                <Badge variant="success" size="sm">Score: {c.score}%</Badge>
              </div>
              <h3 className="text-xs font-bold text-white">{c.project}</h3>
              <p className="text-[11px] text-slate-400">Candidate: {c.candidate}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
