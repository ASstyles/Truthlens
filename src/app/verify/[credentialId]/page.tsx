"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  ExternalLink,
  QrCode,
  Download,
  Share2,
  Copy,
  Layers,
  Database,
  Cpu,
  ArrowLeft,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SevenLayerVerificationResult, SoulboundCredential } from "@/lib/types";
import { generateQrDataUrl } from "@/lib/utils/qr";
import { shortenAddress, shortenHash, formatDate } from "@/lib/utils/format";
import { DEFAULT_NETWORK } from "@/lib/blockchain/config";

export default function PublicVerifyPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.credentialId as string;
  const credentialId = decodeURIComponent(rawId);

  const [result, setResult] = useState<SevenLayerVerificationResult | null>(null);
  const [credential, setCredential] = useState<SoulboundCredential | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verifyCredential();
  }, [credentialId]);

  const verifyCredential = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/blockchain/verify?id=${encodeURIComponent(credentialId)}`);
      const data = await res.json();
      if (data.verification) {
        setResult(data.verification);
        setCredential(data.credential);

        // Generate QR code for the public URL
        const currentUrl = typeof window !== "undefined" ? window.location.href : `https://truthlens.io/verify/${credentialId}`;
        const qrUrl = await generateQrDataUrl(currentUrl);
        setQrDataUrl(qrUrl);
      }
    } catch (e) {
      console.error("Verification query error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-mono">
          Executing 7-Layer Credential Verification...
        </p>
      </div>
    );
  }

  if (!result || !credential) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="h-16 w-16 mx-auto rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
          <XCircle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-white">Credential Verification Failed</h1>
        <p className="text-sm text-slate-400">
          The credential identifier <span className="font-mono text-slate-300">{credentialId}</span> could not be resolved on the Polygon Amoy blockchain or IPFS registry.
        </p>
        <Link href="/verify">
          <Button variant="secondary" size="md">Try Another Credential ID</Button>
        </Link>
      </div>
    );
  }

  const isRevoked = result.status === "REVOKED";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to TruthLens
        </Link>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            onClick={handleCopyLink}
          >
            {copiedLink ? "Link Copied!" : "Share Verification Link"}
          </Button>
        </div>
      </div>

      {/* REVOCATION ALERT (If revoked) */}
      {isRevoked && (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/40 space-y-2">
          <div className="flex items-center gap-2 text-red-400 font-bold text-base">
            <AlertTriangle className="h-5 w-5" />
            <span>CREDENTIAL REVOKED BY AUTHORIZED ISSUER</span>
          </div>
          <p className="text-xs text-red-300">
            This credential is no longer valid. Revocation Reason: &ldquo;{result.revocationReason || "Integrity violation"}&rdquo;
          </p>
          <p className="text-[11px] font-mono text-red-400">
            Revoked At: {formatDate(result.revokedAt)}
          </p>
        </div>
      )}

      {/* 1. VERIFICATION HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl bg-surface-200/90 border border-slate-800 backdrop-blur-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
              {result.credentialId}
            </span>
            <Badge variant={isRevoked ? "danger" : "success"} size="sm">
              {isRevoked ? "🔴 REVOKED" : "🟢 ACTIVE & AUTHENTIC"}
            </Badge>
            <Badge variant="cyan" size="sm">Polygon Amoy</Badge>
            <Badge variant="primary" size="sm">
              {process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL ? "TESTNET ANCHORED" : "DEMO / PRESENTATION MODE"}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {credential.projectName} — Proof of Competence
          </h1>
          <p className="text-xs text-slate-400">
            Candidate: <span className="text-slate-200 font-semibold">{credential.candidateName}</span> • Non-Transferable Soulbound Token
          </p>
        </div>

        <div className="text-left sm:text-right space-y-1">
          <div className="text-xs text-slate-400 font-mono">Demonstrated Score</div>
          <div className="text-3xl font-extrabold text-cyan-400">{credential.overallScore}/100</div>
          <div className="text-xs text-slate-300 font-medium">{credential.scoreBand}</div>
        </div>
      </div>

      {/* 2. MAIN 7-LAYER CHECKLIST & QR INSPECTOR GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: 7-Layer Credential Verification */}
        <div className="lg:col-span-8 space-y-6">
          <Card variant="glass" className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  7-Layer Credential Verification
                </h2>
                <p className="text-xs text-slate-400">
                  Independent mathematical & blockchain validation against smart contract and canonical IPFS metadata.
                </p>
              </div>
              <Badge variant={result.isAuthentic ? "success" : "danger"} size="sm">
                {result.checks.filter((c) => c.passed).length}/7 Layers Verified
              </Badge>
            </div>

            {/* Checklist Items */}
            <div className="space-y-3 pt-2">
              {result.checks.map((chk) => (
                <div
                  key={chk.id}
                  className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${
                    chk.passed
                      ? "bg-surface-200/70 border-slate-800"
                      : "bg-red-500/10 border-red-500/30"
                  }`}
                >
                  <div className="mt-0.5">
                    {chk.passed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-400" />
                    )}
                  </div>

                  <div className="space-y-1 flex-grow">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-white">{chk.label}</h3>
                      <span className={`text-[10px] font-mono font-bold ${chk.passed ? "text-emerald-400" : "text-red-400"}`}>
                        {chk.passed ? "VERIFIED" : "FAILED"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{chk.description}</p>
                    <p className="text-[11px] font-mono text-cyan-300/90 break-all pt-0.5">
                      {chk.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Evidence Breakdown */}
          <Card variant="glass" className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              Verified Competency Evidence (Anchored In Metadata)
            </h3>
            <div className="space-y-2.5">
              {credential.evidenceList.map((ev) => (
                <div key={ev.id} className="p-3.5 rounded-xl bg-surface-200/80 border border-slate-800 text-xs">
                  <span className="font-medium text-slate-200">{ev.statement}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: QR Code, On-Chain Explorer & Metadata */}
        <div className="lg:col-span-4 space-y-6">
          {/* Dynamic QR Code Card */}
          <Card variant="glow" className="text-center space-y-4">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              RECRUITER SCAN & VERIFY
            </span>

            <div className="flex justify-center my-2">
              <div className="p-3 rounded-2xl bg-white shadow-glow">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Verification for ${credential.credentialId}`}
                    className="h-48 w-48 rounded-lg"
                  />
                ) : (
                  <div className="h-48 w-48 flex items-center justify-center text-slate-400">
                    <QrCode className="h-12 w-12 animate-pulse" />
                  </div>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-tight">
              Scan with any mobile camera to open this decentralized verification proof. No login required.
            </p>

            {qrDataUrl && (
              <a
                href={qrDataUrl}
                download={`truthlens-qr-${credential.credentialId}.png`}
                className="inline-block w-full"
              >
                <Button variant="secondary" size="sm" className="w-full" leftIcon={<Download className="h-3.5 w-3.5" />}>
                  Download QR Code
                </Button>
              </a>
            )}
          </Card>

          {/* On-Chain & IPFS Registry Specs */}
          <Card variant="glass" className="space-y-3.5 text-xs">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Decentralized Anchors
            </h3>

            <div className="p-3 rounded-xl bg-surface-200 border border-slate-800 space-y-2 font-mono text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Contract (ERC-5192):</span>
                <span className="text-indigo-300">{shortenAddress(DEFAULT_NETWORK.contractAddress, 4)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Recipient Wallet:</span>
                <span className="text-cyan-300">{shortenAddress(credential.recipientWallet, 4)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>IPFS CID:</span>
                <span className="text-slate-200">{shortenHash(credential.ipfsCID, 5)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Canonical Hash:</span>
                <span className="text-slate-200">{shortenHash(credential.credentialHash, 5)}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={`${DEFAULT_NETWORK.blockExplorer}/address/${DEFAULT_NETWORK.contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block"
              >
                <Button variant="outline" size="sm" className="w-full" rightIcon={<ExternalLink className="h-3 w-3" />}>
                  PolygonScan Explorer
                </Button>
              </a>

              <a
                href={`https://gateway.pinata.cloud/ipfs/${credential.ipfsCID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block"
              >
                <Button variant="ghost" size="sm" className="w-full" rightIcon={<ExternalLink className="h-3 w-3" />}>
                  Inspect Public IPFS JSON
                </Button>
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
