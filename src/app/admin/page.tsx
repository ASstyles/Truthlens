"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Lock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { shortenAddress, shortenHash } from "@/lib/utils/format";
import { DEFAULT_NETWORK } from "@/lib/blockchain/config";
import { AuthGuard } from "@/components/auth/AuthGuard";

interface AdminCred {
  credentialId: string;
  projectName: string;
  candidateName: string;
  recipientWallet: string;
  status: "ACTIVE" | "REVOKED";
  score: number;
  issuedAt: string;
}

function AdminConsoleContent() {
  const [credentials, setCredentials] = useState<AdminCred[]>([
    {
      credentialId: "TL-2026-8492-v1",
      projectName: "apex-dex-protocol",
      candidateName: "Verified Developer #104",
      recipientWallet: "0x71C8416620593520F3124190c107147A5F456B72",
      status: "ACTIVE",
      score: 88,
      issuedAt: "2026-08-26T18:00:00Z",
    },
    {
      credentialId: "TL-2026-NEUR-9021-v1",
      projectName: "neuromed-agent-orchestrator",
      candidateName: "Verified Developer #104",
      recipientWallet: "0x71C8416620593520F3124190c107147A5F456B72",
      status: "ACTIVE",
      score: 91,
      issuedAt: "2026-08-26T19:00:00Z",
    },
    {
      credentialId: "TL-2026-FRAUD-0012-v1",
      projectName: "unverified-defi-fork",
      candidateName: "Unverified Account",
      recipientWallet: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      status: "REVOKED",
      score: 42,
      issuedAt: "2026-08-20T10:00:00Z",
    },
  ]);

  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revocationReason, setRevocationReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRevokeSubmit = async (credentialId: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/blockchain/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credentialId,
          reason: revocationReason || "Assessment Integrity Violation / Admin Revocation",
        }),
      });

      if (res.ok) {
        setCredentials((prev) =>
          prev.map((c) => (c.credentialId === credentialId ? { ...c, status: "REVOKED" } : c))
        );
        setRevokingId(null);
        setRevocationReason("");
      }
    } catch (e) {
      console.error("Revocation error:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl bg-surface-200/90 border border-slate-800 backdrop-blur-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
              AUTHORITY & ISSUER CONSOLE
            </span>
            <Badge variant="primary" size="sm">Admin Role Active</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Smart Contract Credential Governance
          </h1>
          <p className="text-xs text-slate-400">
            Monitor on-chain Soulbound tokens, review cryptographic anchors, and execute authorized revocations.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 space-y-1">
          <div>Issuer: <span className="text-indigo-300">0x3C44...93BC</span></div>
          <div>Contract: <span className="text-cyan-300">{shortenAddress(DEFAULT_NETWORK.contractAddress, 4)}</span></div>
        </div>
      </div>

      {/* Credentials Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Lock className="h-5 w-5 text-cyan-400" />
          On-Chain Credential Registry
        </h2>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-surface-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-200 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-4">Credential ID</th>
                <th className="p-4">Project</th>
                <th className="p-4">Candidate & Wallet</th>
                <th className="p-4">Score</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {credentials.map((c) => (
                <tr key={c.credentialId} className="hover:bg-surface-200/50 transition-colors">
                  <td className="p-4 font-mono font-bold text-cyan-300">
                    {c.credentialId}
                  </td>
                  <td className="p-4 font-medium text-white">{c.projectName}</td>
                  <td className="p-4">
                    <div className="text-slate-200">{c.candidateName}</div>
                    <div className="font-mono text-[11px] text-slate-400">{shortenAddress(c.recipientWallet, 4)}</div>
                  </td>
                  <td className="p-4 font-mono font-bold text-emerald-400">{c.score}%</td>
                  <td className="p-4">
                    <Badge variant={c.status === "ACTIVE" ? "success" : "danger"} size="sm">
                      {c.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <Link href={`/verify/${c.credentialId}`}>
                      <Button size="sm" variant="outline">
                        Verify
                      </Button>
                    </Link>

                    {c.status === "ACTIVE" ? (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setRevokingId(c.credentialId)}
                      >
                        Revoke
                      </Button>
                    ) : (
                      <span className="text-[11px] font-mono text-red-400">Revoked</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revocation Modal */}
      {revokingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-surface-200 border border-red-500/40 p-6 space-y-5 shadow-glow">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-bold text-white">Revoke Soulbound Credential</h3>
            </div>

            <p className="text-xs text-slate-300">
              You are revoking credential <span className="font-mono text-cyan-300">{revokingId}</span> on Polygon Amoy. This sets the status to <strong>REVOKED</strong> while maintaining on-chain audit history.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Revocation Reason:</label>
              <textarea
                rows={3}
                value={revocationReason}
                onChange={(e) => setRevocationReason(e.target.value)}
                placeholder="e.g. Assessment integrity violation or administrative error..."
                className="w-full bg-surface-100 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="secondary" onClick={() => setRevokingId(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleRevokeSubmit(revokingId)}
                isLoading={isSubmitting}
              >
                Confirm Revocation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminConsolePage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400 font-mono">Loading Admin...</div>}>
      <AuthGuard requireAdmin={true}>
        <AdminConsoleContent />
      </AuthGuard>
    </React.Suspense>
  );
}
