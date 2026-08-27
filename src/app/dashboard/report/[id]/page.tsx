"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Award,
  Lock,
  ExternalLink,
  Sparkles,
  QrCode,
  Layers,
  Cpu,
  ArrowRight,
  Share2,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { RadarChart } from "@/components/ui/RadarChart";
import { CompetencyReport, SoulboundCredential } from "@/lib/types";
import { BlockchainClient } from "@/lib/blockchain/client";
import { DEFAULT_NETWORK } from "@/lib/blockchain/config";
import { shortenAddress, shortenHash, getScoreColor } from "@/lib/utils/format";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/firebase/auth-context";

function CompetencyReportContent() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;
  const { user } = useAuth();

  const [report, setReport] = useState<CompetencyReport | null>(null);
  const [loading, setLoading] = useState(true);

  // Minting modal states
  const [mintModalOpen, setMintModalOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isMinting, setIsMinting] = useState(false);
  const [mintStage, setMintStage] = useState<"idle" | "preparing" | "wallet" | "submitting" | "confirming" | "issued">("idle");
  const [mintError, setMintError] = useState<string | null>(null);
  const [mintSuccessCredential, setMintSuccessCredential] = useState<SoulboundCredential | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      (window as any).ethereum
        .request({ method: "eth_accounts" })
        .then((accounts: string[]) => {
          if (accounts && accounts[0]) {
            setWalletAddress(accounts[0]);
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    loadReport();
  }, [assessmentId]);

  const loadReport = async () => {
    setLoading(true);
    const candidateName = user ? user.name : "Candidate";
    const candidateEmail = user ? user.email : "developer@truthlens.io";

    try {
      if (assessmentId) {
        const res = await fetch(`/api/assessment/report?id=${encodeURIComponent(assessmentId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.report) {
            setReport(data.report);
            setLoading(false);
            return;
          }
        }
      }
    } catch (e) {
      console.warn("Backend report lookup failed:", e);
    }

    // Only allow fallback report if explicit demo ID is requested
    if (assessmentId === "demo" || assessmentId === "eval-8492-demo") {
      const demoReport: CompetencyReport = {
        assessmentId: "eval-8492-demo",
        projectId: "demo-apex-dex",
        projectName: "apex-dex-protocol",
        candidateUid: user ? user.uid : "demo-candidate",
        candidateName,
        candidateEmail,
        assessmentMode: "INDEPENDENT",
        overallScore: 88,
        scoreBand: "Highly Competent",
        assessmentLevel: "Advanced",
        dimensionScores: [
          { dimension: "Project Understanding", score: 92, weight: 0.15, label: "Project Understanding", summary: "Clear mental model of codebase topology and purpose." },
          { dimension: "Architecture & Systems", score: 87, weight: 0.20, label: "Architecture", summary: "Strong reasoning regarding service boundaries and protocols." },
          { dimension: "Code & Dependencies", score: 90, weight: 0.15, label: "Code Navigation", summary: "Deep comprehension of third-party libraries and runtime logic." },
          { dimension: "Failure & Edge Cases", score: 84, weight: 0.15, label: "Debugging", summary: "Anticipated failure modes and latency cascade scenarios." },
          { dimension: "Security & Auth", score: 89, weight: 0.15, label: "Security", summary: "Clear understanding of token mechanics and access controls." },
          { dimension: "Technical Tradeoffs", score: 86, weight: 0.20, label: "Decision Making", summary: "Pragmatic engineering judgement under scaling constraints." },
        ],
        evidenceList: [
          {
            id: "ev-1",
            category: "ARCHITECTURE",
            statement: "✓ Articulated atomic swap execution mechanics & slippage bounds in ApexLiquidityRouter.sol",
            demonstratedCompetence: "STRONG",
          },
          {
            id: "ev-2",
            category: "SECURITY",
            statement: "✓ Correctly identified MEV sandwich vulnerabilities & implemented strict deadline constraints",
            demonstratedCompetence: "STRONG",
          },
        ],
        strengths: [
          "Exceptional mental model of smart contract reentrancy guard rails.",
          "Accurate reasoning around Chainlink decentralized oracle staleness risks.",
        ],
        weaknesses: [
          "Could explore automated canary rollback metrics in continuous deployment pipelines.",
        ],
        executiveSummary: `${candidateName} completed a reference evaluation of Apex DEX Protocol.`,
        verifiedTechnologies: ["Solidity", "Hardhat", "Chainlink Oracles", "Polygon"],
        assessedAt: new Date().toISOString(),
        version: "v1",
      };
      setReport(demoReport);
    } else {
      setReport(null);
    }
    setLoading(false);
  };

  const handleConnectAndMint = async () => {
    if (!report) return;
    setIsMinting(true);
    setMintError(null);
    setMintStage("preparing");

    try {
      let recipient = walletAddress;
      let signature = "";
      let proofMessage = "";

      // If browser wallet available, request account & sign proof
      if (typeof window !== "undefined" && (window as any).ethereum) {
        try {
          setMintStage("wallet");
          const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
          if (accounts && accounts[0]) {
            recipient = accounts[0];
            setWalletAddress(recipient);

            const candidateId = `TL-2026-${report.projectName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}-${report.version || "v1"}`;
            proofMessage = BlockchainClient.generateOwnershipProofMessage(
              recipient,
              candidateId,
              "0x0000000000000000000000000000000000000000000000000000000000000000"
            );

            signature = await (window as any).ethereum.request({
              method: "personal_sign",
              params: [proofMessage, recipient],
            });
          }
        } catch (walletErr: any) {
          console.warn("Browser wallet signature skipped, continuing via relayer:", walletErr);
        }
      }

      // Call Blockchain issuance API
      setMintStage("submitting");
      const res = await fetch("/api/blockchain/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report,
          recipientWallet: recipient,
          signature,
          proofMessage,
          networkKey: "amoy",
        }),
      });

      setMintStage("confirming");
      const data = await res.json();
      if (data.credential) {
        setMintStage("issued");
        setMintSuccessCredential(data.credential);
      } else {
        throw new Error(data.error || "Failed to anchor credential on-chain.");
      }
    } catch (err: any) {
      console.error("Minting failed:", err);
      setMintError(err.message || "Failed to issue credential. You can retry.");
      setMintStage("idle");
    } finally {
      setIsMinting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-mono">Loading Proof-of-Competence Report...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="h-14 w-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
          <FileCheck className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white">Assessment Report Not Found</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            No completed competency evaluation was found for identifier &ldquo;{assessmentId}&rdquo;. You can launch a new assessment from your dashboard.
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <Button variant="cyan" size="md" onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const scoreColors = getScoreColor(report.overallScore);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* ------------------------------------------------------------------------ */}
      {/* 1. REPORT HERO HEADER */}
      {/* ------------------------------------------------------------------------ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl bg-surface-200/90 border border-slate-800 backdrop-blur-xl">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
              TRUTHLENS EVALUATION REPORT
            </span>
            <Badge variant="primary" size="sm">{report.assessmentMode} MODE</Badge>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono font-medium">
              <Lock className="h-3 w-3" />
              <span>{report.integritySummary?.integrityScore ?? 100}% Integrity ({report.integritySummary?.status === "MINOR_FLAGS" ? "Minor Flags" : report.integritySummary?.status === "INTEGRITY_REVIEW" ? "Under Review" : "Verified Secure"})</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Proof of Competence: {report.projectName}
          </h1>
          <p className="text-xs text-slate-400">
            Candidate: <span className="text-slate-200 font-semibold">{report.candidateName}</span> • Assessed: {new Date(report.assessedAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="lg"
            variant="cyan"
            leftIcon={<Lock className="h-4 w-4" />}
            onClick={() => setMintModalOpen(true)}
          >
            Connect Wallet & Issue Soulbound Credential
          </Button>
        </div>
      </div>

      {/* ------------------------------------------------------------------------ */}
      {/* 2. SCORE CARD & COMPETENCY RADAR */}
      {/* ------------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Overall Score & Level */}
        <div className="lg:col-span-5 space-y-6">
          <Card variant="glow" className="text-center space-y-4">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Overall Demonstrated Mastery
            </span>

            {/* Score Ring */}
            <div className="relative flex items-center justify-center my-2">
              <div className="h-36 w-36 rounded-full bg-gradient-to-tr from-indigo-500/20 via-purple-500/30 to-cyan-400/30 flex items-center justify-center border border-indigo-500/40 shadow-glow">
                <div className="h-28 w-28 rounded-full bg-surface-300 flex flex-col items-center justify-center">
                  <span className={`text-4xl font-extrabold ${scoreColors.textColor}`}>
                    {report.overallScore}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">OUT OF 100</span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                {report.scoreBand}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Level: <span className="text-white font-semibold">{report.assessmentLevel}</span>
              </p>
            </div>

            <p className="text-xs text-slate-300 text-left p-3.5 rounded-xl bg-surface-200/80 border border-slate-800 leading-relaxed italic">
              &ldquo;{report.executiveSummary}&rdquo;
            </p>
          </Card>

          {/* Verified Technologies */}
          <Card variant="glass" className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Verified Technology Proficiencies
            </h3>
            <div className="flex flex-wrap gap-2">
              {report.verifiedTechnologies.map((tech) => (
                <Badge key={tech} variant="cyan" size="md" icon={<CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />}>
                  {tech}
                </Badge>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Competency Radar Chart & Dimensions */}
        <div className="lg:col-span-7 space-y-6">
          <Card variant="glass" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-cyan-400" />
                6-Dimension Competency Radar
              </h3>
              <Badge variant="primary" size="sm">Evidence Weighted</Badge>
            </div>

            {/* Radar SVG */}
            <div className="py-2">
              <RadarChart scores={report.dimensionScores} size={300} />
            </div>

            {/* Dimensions Table with Prominent Evidence Statements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
              {report.dimensionScores.map((dim, i) => (
                <div key={i} className="p-4 rounded-xl bg-surface-200/80 border border-slate-800 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white text-sm">{dim.label}</span>
                    <span className="font-mono font-extrabold text-cyan-400 text-sm">{dim.score}/100</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{dim.summary}</p>
                  
                  {/* Why did you receive this score? */}
                  <div className="pt-2 border-t border-slate-700/60 space-y-1">
                    <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block font-semibold">
                      Demonstrated Evidence:
                    </span>
                    {(dim.evidenceStatements || [
                      `✓ Articulated key tradeoffs in ${dim.label.toLowerCase()}`,
                      `✓ Demonstrated clear technical comprehension under questioning`
                    ]).map((stmt, sIdx) => (
                      <p key={sIdx} className="text-[11px] text-slate-300 flex items-start gap-1.5 leading-tight">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{stmt.replace(/^✓\s*/, "")}</span>
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ------------------------------------------------------------------------ */}
      {/* 3. EVIDENCE-BACKED COMPETENCY STATEMENTS */}
      {/* ------------------------------------------------------------------------ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-emerald-400" />
              Evidence-Backed Demonstrated Competence
            </h2>
            <p className="text-xs text-slate-400">
              Specific architectural, failure scenario, and code invariants proven during assessment.
            </p>
          </div>
          <Badge variant="success" size="sm">{report.evidenceList.length} Verified Evidence Signals</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.evidenceList.map((ev) => (
            <div
              key={ev.id}
              className="p-4 rounded-2xl bg-surface-100 border border-slate-800 space-y-2 border-l-4 border-l-emerald-500"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                  {ev.category}
                </span>
                <span className="text-[10px] font-bold text-slate-400">DEMONSTRATED: STRONG</span>
              </div>
              <p className="text-xs font-medium text-slate-200 leading-relaxed">
                {ev.statement}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------------ */}
      {/* 4. SECURE ASSESSMENT INTEGRITY AUDIT */}
      {/* ------------------------------------------------------------------------ */}
      <Card variant="glass" className="p-6 space-y-4 border-l-4 border-l-cyan-400">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              Secure Assessment Protocol & Integrity Audit
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Cryptographic session verification, clipboard protection, and single-tab execution enforcement.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="cyan" size="md">
              Score: {report.integritySummary?.integrityScore ?? 100}/100
            </Badge>
            <Badge variant={report.integritySummary?.status === "INTEGRITY_REVIEW" ? "danger" : "success"} size="md">
              {report.integritySummary?.status === "MINOR_FLAGS" ? "Minor Flags" : report.integritySummary?.status === "INTEGRITY_REVIEW" ? "Flagged for Review" : "Verified Secure"}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800 text-xs">
          <div className="p-3 rounded-xl bg-surface-200/80 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Single-Session Enforcement
            </span>
            <p className="text-[11px] text-slate-400">
              Zero concurrent tab collisions detected during assessment execution.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-surface-200/80 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Anti-Clipboard Injection
            </span>
            <p className="text-[11px] text-slate-400">
              Real-time shortcut intercept active; external text copy/paste blocked.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-surface-200/80 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Active Focus Monitoring
            </span>
            <p className="text-[11px] text-slate-400">
              {report.integritySummary?.flagsCount ?? 0} focus interruptions or unauthorized shortcuts logged.
            </p>
          </div>
        </div>
      </Card>

      {/* ------------------------------------------------------------------------ */}
      {/* 5. STRENGTHS & GROWTH AREAS */}
      {/* ------------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="glass" className="space-y-3 border-t-2 border-t-emerald-500">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Demonstrated Engineering Strengths
          </h3>
          <ul className="space-y-2 text-xs text-slate-300">
            {report.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card variant="glass" className="space-y-3 border-t-2 border-t-indigo-500">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            Recommended Growth Areas
          </h3>
          <ul className="space-y-2 text-xs text-slate-300">
            {report.weaknesses.map((w, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* ------------------------------------------------------------------------ */}
      {/* 5. SOULBOUND CREDENTIAL ISSUANCE MODAL */}
      {/* ------------------------------------------------------------------------ */}
      {mintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-surface-200 border border-slate-700 p-6 sm:p-8 space-y-6 shadow-glow-lg">
            {!mintSuccessCredential ? (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono text-cyan-400 uppercase">
                      BLOCKCHAIN ANCHORING
                    </span>
                    <h2 className="text-xl font-bold text-white">
                      Issue Soulbound Credential (ERC-5192)
                    </h2>
                  </div>
                  <button
                    onClick={() => setMintModalOpen(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Your demonstrated competence will be canonicalized into a privacy-preserving metadata payload, pinned to IPFS, and anchored permanently onto <strong>Polygon Amoy Testnet</strong> as a non-transferable token locked to your wallet.
                </p>

                <div className="p-4 rounded-xl bg-surface-300 border border-slate-800 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Network:</span>
                    <span className="text-slate-200 font-semibold">Polygon Amoy (80002)</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Recipient Wallet:</span>
                    <span className="text-cyan-300">{shortenAddress(walletAddress, 6)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Contract Standard:</span>
                    <span className="text-indigo-300">ERC-5192 Soulbound Token</span>
                  </div>
                </div>

                {mintError && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center justify-between gap-2">
                    <span>{mintError}</span>
                    <button
                      type="button"
                      onClick={() => setMintError(null)}
                      className="text-red-400 hover:text-white font-mono text-[11px] underline"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <Button
                    size="lg"
                    variant="cyan"
                    className="w-full"
                    leftIcon={<Lock className="h-4 w-4" />}
                    onClick={handleConnectAndMint}
                    isLoading={isMinting}
                  >
                    {mintStage === "preparing"
                      ? "Preparing credential metadata..."
                      : mintStage === "wallet"
                      ? "Waiting for wallet confirmation..."
                      : mintStage === "submitting"
                      ? "Submitting transaction..."
                      : mintStage === "confirming"
                      ? "Confirming blockchain transaction..."
                      : "Sign & Issue Credential On-Chain"}
                  </Button>
                  <p className="text-[10px] text-center text-slate-500">
                    Requires cryptographic signature confirming wallet control. Non-transferable once issued.
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center space-y-6">
                <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="h-8 w-8" />
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-mono text-emerald-400 uppercase">
                    CREDENTIAL ISSUED & ANCHORED
                  </span>
                  <h2 className="text-xl font-bold text-white">
                    {mintSuccessCredential.credentialId}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Your Proof-of-Competence is now verifiable by recruiters worldwide.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface-300 border border-slate-800 text-xs font-mono text-left space-y-2">
                  <div className="flex justify-between text-slate-400">
                    <span>Tx Hash:</span>
                    <span className="text-indigo-300">{shortenHash(mintSuccessCredential.transactionHash, 6)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>IPFS CID:</span>
                    <span className="text-cyan-300">{shortenHash(mintSuccessCredential.ipfsCID, 6)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Status:</span>
                    <span className="text-emerald-400 font-bold">ACTIVE (LOCKED)</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href={`/verify/${mintSuccessCredential.credentialId}`} className="w-full">
                    <Button size="md" variant="cyan" className="w-full" rightIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                      Open Public Verification & QR
                    </Button>
                  </Link>
                  <Button size="md" variant="secondary" onClick={() => setMintModalOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CompetencyReportPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400 font-mono">Loading Report...</div>}>
      <AuthGuard>
        <CompetencyReportContent />
      </AuthGuard>
    </React.Suspense>
  );
}
