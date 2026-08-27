"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Cpu,
  GitBranch,
  Lock,
  ArrowRight,
  CheckCircle2,
  Code2,
  Database,
  Search,
  ExternalLink,
  Layers,
  Terminal,
  Zap,
  Activity,
  Award,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function LandingPage() {
  const architectureSteps = [
    {
      step: "01",
      title: "GitHub Repository",
      desc: "Connect your GitHub account and select any public or private codebase you built.",
      icon: GitBranch,
      color: "from-blue-500 to-indigo-600",
    },
    {
      step: "02",
      title: "Project Intelligence",
      desc: "Static analyzer maps dependencies, API routes, database schemas, and failure points.",
      icon: Cpu,
      color: "from-indigo-500 to-purple-600",
    },
    {
      step: "03",
      title: "Personalized Assessment",
      desc: "Google Gemini formulates questions strictly anchored in your real code and architecture.",
      icon: Terminal,
      color: "from-purple-500 to-pink-600",
    },
    {
      step: "04",
      title: "Competency Evaluation",
      desc: "Multi-turn adaptive dialogue drills into your mental model, tradeoffs, and debugging logic.",
      icon: Activity,
      color: "from-pink-500 to-rose-600",
    },
    {
      step: "05",
      title: "Proof-of-Competence",
      desc: "Generates an evidence-backed score report across 8 core engineering dimensions.",
      icon: Award,
      color: "from-rose-500 to-amber-600",
    },
    {
      step: "06",
      title: "IPFS + Blockchain",
      desc: "Canonical report metadata is pinned to IPFS and hashed with Keccak256.",
      icon: Database,
      color: "from-amber-500 to-emerald-600",
    },
    {
      step: "07",
      title: "Soulbound Credential",
      desc: "Minted to your crypto wallet as a non-transferable ERC-5192 token on Polygon.",
      icon: Lock,
      color: "from-emerald-500 to-cyan-600",
    },
    {
      step: "08",
      title: "Independent Verification",
      desc: "Recruiters and institutions verify cryptographic integrity in milliseconds without login.",
      icon: ShieldCheck,
      color: "from-cyan-500 to-blue-600",
    },
  ];

  const dimensions = [
    { name: "Project Understanding", desc: "Clarity of high-level purpose, user journeys, and component boundaries." },
    { name: "Architecture Reasoning", desc: "Design tradeoffs, microservice boundaries, protocols, and state management." },
    { name: "Code Understanding", desc: "Comprehension of functions, types, async lifecycles, and internal dependencies." },
    { name: "Debugging Ability", desc: "Diagnosis of failure stack traces, race conditions, and runtime anomalies." },
    { name: "Security Awareness", desc: "Authentication mechanics, authorization checks, injection defense, and key safety." },
    { name: "Failure & Edge-Case Reasoning", desc: "Mitigation of network partitions, cascade timeouts, and stale external APIs." },
    { name: "Scalability & System Design", desc: "Load distribution, database caching, query indexing, and resource bounds." },
    { name: "Adaptation & Modification", desc: "Ability to refactor, introduce new feature requirements, and evolve the codebase." },
  ];

  const verificationLayers = [
    { num: 1, title: "IPFS Canonical JSON Payload", desc: "Immutable decentralized storage of assessment evidence and scores." },
    { num: 2, title: "Keccak-256 Hash Verification", desc: "Cryptographic hash match ensuring metadata was never modified." },
    { num: 3, title: "Polygon Blockchain Token Anchor", desc: "Immutable ERC-5192 Soulbound token record on Polygon Amoy." },
    { num: 4, title: "Recipient Wallet Binding", desc: "Non-transferable token bound strictly to the evaluated developer's wallet." },
    { num: 5, title: "Authorized Issuer Signature", desc: "Verified signature of the TruthLens smart contract issuing authority." },
    { num: 6, title: "Smart Contract Revocation Check", desc: "Real-time query ensuring the credential has not been revoked." },
    { num: 7, title: "Evidence Trail Audit", desc: "Granular evidence statements backing every awarded dimension score." },
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 sm:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-medium shadow-glow">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>Proof of Competence for the AI Era</span>
        </div>

        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Don&apos;t just claim you built it. <br />
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Prove that you understand it.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            TruthLens analyzes your software project and evaluates your ability to understand, explain, debug, and adapt it — creating independently verifiable proof of technical competence.
          </p>
        </div>

        {/* Primary CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link href="/login">
            <Button size="lg" variant="cyan" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Sign In
            </Button>
          </Link>
          <a href="#how-it-works">
            <Button size="lg" variant="secondary" rightIcon={<ChevronRight className="h-4 w-4" />}>
              See How It Works
            </Button>
          </a>
        </div>

        {/* Hero Preview Card */}
        <div className="pt-8 max-w-4xl mx-auto">
          <Card variant="glow" className="p-6 sm:p-8 text-left space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">TruthLens Proof-of-Competence Credential</h3>
                  <p className="text-xs text-slate-400 font-mono">TL-2026-8492-v1 • Polygon Amoy ERC-5192</p>
                </div>
              </div>
              <Badge variant="cyan" size="sm">7-Layer Cryptographically Verified</Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-surface-200">
                <span className="text-slate-500">Overall Score</span>
                <p className="text-emerald-400 font-bold text-base mt-0.5">88/100</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-200">
                <span className="text-slate-500">Score Band</span>
                <p className="text-white font-bold text-sm mt-0.5">Highly Competent</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-200">
                <span className="text-slate-500">IPFS CID</span>
                <p className="text-cyan-300 font-bold text-[11px] mt-0.5 truncate">bafkreihdwdc...</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-200">
                <span className="text-slate-500">Blockchain</span>
                <p className="text-indigo-300 font-bold text-sm mt-0.5">Polygon Amoy</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <span className="text-xs text-slate-400">
                Verified Skills: Solidity • Hardhat • Chainlink Oracles • Ethers.js • Polygon
              </span>
              <Link href="/verify/TL-2026-8492-v1">
                <Button size="sm" variant="outline" rightIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                  Inspect Public Verification Proof
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* 2. THE PROBLEM & PHILOSOPHY */}
      <section id="product" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="primary" size="sm">The Core Problem</Badge>
          <h2 className="text-3xl font-extrabold text-white">
            AI can generate code in seconds. <br />
            Resumes and repositories are no longer proof of ability.
          </h2>
          <p className="text-xs text-slate-400">
            TruthLens is NOT an AI detector. We don&apos;t care if AI helped you write the code. We verify if YOU understand how it works and can defend its architecture.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="glass" className="p-6 space-y-3 border-red-500/20">
            <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
              <Code2 className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">The AI Code Illusion</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Anyone can prompt an LLM to generate complex full-stack repositories. Traditional hiring quizzes test trivia; resumes trust claims. Neither tests real understanding.
            </p>
          </Card>

          <Card variant="glass" className="p-6 space-y-3 border-indigo-500/30">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Project-Grounded Interrogation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              TruthLens analyzes your actual repository and formulates deep architectural and failure-mode questions specifically about your files, APIs, databases, and dependencies.
            </p>
          </Card>

          <Card variant="glass" className="p-6 space-y-3 border-cyan-500/30">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Soulbound Blockchain Proof</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Evaluated competencies are anchored as immutable, non-transferable ERC-5192 tokens on Polygon Amoy with IPFS evidence trails that recruiters can verify instantly.
            </p>
          </Card>
        </div>
      </section>

      {/* 3. VISUAL ARCHITECTURE PIPELINE */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="cyan" size="sm">End-to-End Workflow</Badge>
          <h2 className="text-3xl font-extrabold text-white">
            From Source Code to On-Chain Proof of Competence
          </h2>
          <p className="text-xs text-slate-400">
            A cohesive 8-stage verification pipeline transforming claimed projects into cryptographic trust.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {architectureSteps.map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.step} variant="glass" className="p-6 space-y-4 hover:border-cyan-500/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400">STAGE {step.step}</span>
                  <div className="h-8 w-8 rounded-lg bg-surface-200 flex items-center justify-center text-slate-300">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-white">{step.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 4. 8 COMPETENCY DIMENSIONS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="primary" size="sm">Evaluation Framework</Badge>
          <h2 className="text-3xl font-extrabold text-white">
            8 Dimensions of Engineering Competence
          </h2>
          <p className="text-xs text-slate-400">
            TruthLens evaluates whether a developer can defend, debug, and scale their architecture.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {dimensions.map((dim, i) => (
            <Card key={i} variant="glass" className="p-5 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">{dim.name}</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{dim.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* 5. 7-LAYER CRYPTOGRAPHIC VERIFICATION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="cyan" size="sm">Cryptographic Rigor</Badge>
          <h2 className="text-3xl font-extrabold text-white">
            7-Layer Independent Verification
          </h2>
          <p className="text-xs text-slate-400">
            Recruiters, hackathons, and companies can independently audit any credential without trusting a central database.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {verificationLayers.map((layer) => (
            <Card key={layer.num} variant="glass" className="p-6 space-y-2 border-l-2 border-l-indigo-500">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-cyan-400 font-bold">LAYER {layer.num}</span>
              </div>
              <h3 className="text-sm font-bold text-white">{layer.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{layer.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* 6. BOTTOM CALL TO ACTION */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card variant="glow" className="p-8 sm:p-12 text-center space-y-6">
          <div className="space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Ready to verify your software competence?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Sign in with your email to connect your GitHub repositories, complete your project-grounded assessment, and mint your verifiable Soulbound Credential.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/login">
              <Button size="lg" variant="cyan" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Sign In to TruthLens
              </Button>
            </Link>
            <Link href="/verify/TL-2026-8492-v1">
              <Button size="lg" variant="secondary">
                View Sample Credential Verification
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
