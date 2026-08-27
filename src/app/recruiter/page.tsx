"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UserCheck,
  Search,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Building,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function RecruiterPortalPage() {
  const router = useRouter();
  const [candidateQuery, setCandidateQuery] = useState("");

  const candidates = [
    {
      name: "Verified Developer #104",
      role: "Full-Stack & Web3 Engineer",
      avatar: "VD",
      credentials: [
        { id: "TL-2026-8492-v1", project: "Apex DEX Protocol", score: 88, level: "Advanced", date: "Aug 2026" },
        { id: "TL-2026-NEUR-9021-v1", project: "NeuroMed AI Orchestrator", score: 91, level: "Expert", date: "Aug 2026" },
      ],
      skills: ["Solidity", "FastAPI", "Next.js", "LangChain", "Chainlink Oracles"],
    },
    {
      name: "Verified Developer #208",
      role: "Distributed Systems & Cloud Engineer",
      avatar: "VD",
      credentials: [
        { id: "TL-2026-SENT-4812-v1", project: "Sentinel Event Mesh", score: 86, level: "Advanced", date: "Aug 2026" },
      ],
      skills: ["Go", "Apache Kafka", "Redis Cluster", "PostgreSQL", "Docker"],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl bg-surface-200/90 border border-slate-800 backdrop-blur-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
              RECRUITER & INSTITUTION PORTAL
            </span>
            <Badge variant="cyan" size="sm">Hiring Intelligence</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Evidence-Backed Candidate Verification
          </h1>
          <p className="text-xs text-slate-400">
            Verify technical competency without relying on unverified resumes or easily copied GitHub repositories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/verify">
            <Button size="md" variant="cyan" leftIcon={<QrCode className="h-4 w-4" />}>
              Scan Candidate QR
            </Button>
          </Link>
        </div>
      </div>

      {/* Candidate Benchmark Directory */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-indigo-400" />
            Verified Candidate Benchmarks
          </h2>
          <span className="text-xs text-slate-400 font-mono">Showing {candidates.length} Audited Candidates</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {candidates.map((c, i) => (
            <Card key={i} variant="glass" className="space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-[2px]">
                    <div className="h-full w-full rounded-[10px] bg-surface-300 flex items-center justify-center font-bold text-white">
                      {c.avatar}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{c.name}</h3>
                    <p className="text-xs text-slate-400">{c.role}</p>
                  </div>
                </div>
                <Badge variant="success" size="sm">✓ Verified</Badge>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1.5">
                {c.skills.map((s) => (
                  <span key={s} className="text-[11px] px-2.5 py-0.5 rounded-full bg-surface-200 text-slate-300 border border-slate-700">
                    {s}
                  </span>
                ))}
              </div>

              {/* Issued Credentials List */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Verified Soulbound Credentials:
                </span>
                {c.credentials.map((cred) => (
                  <div
                    key={cred.id}
                    className="p-3 rounded-xl bg-surface-200/80 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white">{cred.project}</span>
                      <p className="text-[10px] font-mono text-cyan-400">{cred.id}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className="font-bold text-emerald-400">{cred.score}%</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            🔒 98% Integrity
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">{cred.level} • Verified Secure</p>
                      </div>
                      <Link href={`/verify/${cred.id}`}>
                        <Button size="sm" variant="outline" rightIcon={<ExternalLink className="h-3 w-3" />}>
                          Audit
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
