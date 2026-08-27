"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Layers,
  Cpu,
  ShieldAlert,
  Code2,
  Database,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Activity,
  GitBranch,
  Terminal,
  FileCode,
  Check,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DEMO_PROJECTS } from "@/lib/github/demo-projects";
import { ProjectKnowledgeModel } from "@/lib/types";

function ProjectAnalyzeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("id") || "demo-apex-dex";

  const [project, setProject] = useState<ProjectKnowledgeModel | null>(null);
  const [selectedTab, setSelectedTab] = useState<"architecture" | "dependencies" | "apis" | "risks">("architecture");
  const [loadingStage, setLoadingStage] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const analysisStages = [
    "Fetching repository manifest & file tree...",
    "Inspecting directory topology & file hierarchy...",
    "Detecting frameworks, languages & runtimes...",
    "Mapping dependency graphs & third-party packages...",
    "Extracting API routes, handlers & data models...",
    "Synthesizing system architecture DAG...",
    "Formulating adaptive assessment scenarios...",
  ];

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    // 1. Check local demo registry immediately
    const foundDemo = DEMO_PROJECTS.find(
      (d) => d.knowledgeModel.projectId === projectId || d.metadata.id === projectId
    );

    if (foundDemo) {
      setProject(foundDemo.knowledgeModel);
      setLoading(false);
      return;
    }

    // 2. Fetch from backend analyzer cache if it was custom
    try {
      const res = await fetch("/api/github/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoId: projectId }),
      });
      const data = await res.json();
      if (data.knowledgeModel) {
        setProject(data.knowledgeModel);
      } else {
        setProject(DEMO_PROJECTS[0].knowledgeModel);
      }
    } catch {
      setProject(DEMO_PROJECTS[0].knowledgeModel);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !project) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-8 max-w-lg mx-auto">
        <div className="relative">
          <div className="h-16 w-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <Cpu className="h-7 w-7 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="w-full space-y-3">
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>Analyzing Repository Topology</span>
            <span>{Math.min(100, Math.round(((loadingStage + 1) / analysisStages.length) * 100))}%</span>
          </div>
          <div className="h-2 w-full bg-surface-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 transition-all duration-300"
              style={{ width: `${((loadingStage + 1) / analysisStages.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="w-full space-y-2 text-xs font-mono">
          {analysisStages.map((stage, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-2 transition-opacity ${
                idx === loadingStage
                  ? "text-cyan-300 font-semibold"
                  : idx < loadingStage
                  ? "text-slate-500 line-through"
                  : "text-slate-600 opacity-40"
              }`}
            >
              {idx < loadingStage ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : idx === loadingStage ? (
                <div className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              ) : (
                <div className="h-2 w-2 rounded-full bg-slate-700" />
              )}
              <span>{stage}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-3xl bg-surface-200/90 border border-slate-800 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-cyan-400 uppercase">PROJECT KNOWLEDGE MODEL</span>
            <Badge variant="primary" size="sm">{project.primaryLanguage}</Badge>
            <Badge variant="cyan" size="sm">Detected from Repository</Badge>
          </div>
          <h1 className="text-2xl font-extrabold text-white">{project.projectName}</h1>
          <p className="text-xs text-slate-400 mt-1">
            Synthesized from {project.importantFiles.length} key source files • {project.apiEndpoints.length} registered routes • {project.dependencies.length} parsed packages
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="lg"
            variant="cyan"
            leftIcon={<Sparkles className="h-4 w-4 fill-current" />}
            rightIcon={<ArrowRight className="h-4 w-4" />}
            onClick={() => router.push(`/dashboard/assessment?projectId=${project.projectId}`)}
          >
            Launch Adaptive Assessment
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto">
        <button
          onClick={() => setSelectedTab("architecture")}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-colors whitespace-nowrap ${
            selectedTab === "architecture"
              ? "bg-surface-100 text-cyan-400 border-t-2 border-cyan-400 border-x border-slate-800"
              : "text-slate-400 hover:text-white"
          }`}
        >
          System Architecture DAG
        </button>
        <button
          onClick={() => setSelectedTab("dependencies")}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-colors whitespace-nowrap ${
            selectedTab === "dependencies"
              ? "bg-surface-100 text-cyan-400 border-t-2 border-cyan-400 border-x border-slate-800"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Tech Stack & Dependencies ({project.dependencies.length})
        </button>
        <button
          onClick={() => setSelectedTab("apis")}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-colors whitespace-nowrap ${
            selectedTab === "apis"
              ? "bg-surface-100 text-cyan-400 border-t-2 border-cyan-400 border-x border-slate-800"
              : "text-slate-400 hover:text-white"
          }`}
        >
          API Endpoints & Functions
        </button>
        <button
          onClick={() => setSelectedTab("risks")}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-colors whitespace-nowrap ${
            selectedTab === "risks"
              ? "bg-surface-100 text-cyan-400 border-t-2 border-cyan-400 border-x border-slate-800"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Risk Radar & Failure Scenarios ({project.risks.length})
        </button>
      </div>

      {/* Tab Content 1: Architecture DAG */}
      {selectedTab === "architecture" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {project.architectureNodes.map((node, index) => (
              <Card key={node.id} variant="glass" className="space-y-3 border-l-4 border-l-indigo-500">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">
                    NODE 0{index + 1} • {node.type}
                  </span>
                  <Badge variant="cyan" size="sm">{node.technologies[0] || "Core"}</Badge>
                </div>
                <h3 className="text-sm font-bold text-white">{node.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{node.description}</p>
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                  {node.technologies.map((t) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-surface-200 text-slate-300 border border-slate-700">
                      {t}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <div className="p-6 rounded-2xl bg-surface-100 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              Inferred Data Flow & Security Boundaries (Detected from Source)
            </h3>
            <div className="p-4 rounded-xl bg-surface-200 font-mono text-xs text-slate-300 space-y-2">
              <p className="text-cyan-300">
                [Client UI] ➔ Authenticated via [{project.authMethod.split("(")[0].trim()}] ➔ [{project.frameworks[0] || "API Gateway"}]
              </p>
              <p className="text-indigo-300">
                ➔ Persistent Storage: [{project.databaseType}] with {project.databaseSchemaSummary}
              </p>
              {project.smartContracts && project.smartContracts.length > 0 && (
                <p className="text-emerald-300">
                  ➔ Smart Contract Execution: [{project.smartContracts.join(", ")}] on Polygon Amoy
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Dependencies */}
      {selectedTab === "dependencies" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {project.dependencies.map((dep, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-surface-100 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">{dep.name}</p>
                <p className="text-[10px] font-mono text-slate-400">{dep.version}</p>
              </div>
              <Badge variant="neutral" size="sm">{dep.category}</Badge>
            </div>
          ))}
        </div>
      )}

      {/* Tab Content 3: APIs & Important Functions */}
      {selectedTab === "apis" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-surface-100 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Code2 className="h-4 w-4 text-indigo-400" />
              Identified API Endpoints
            </h3>
            <div className="space-y-2">
              {project.apiEndpoints.map((ep, i) => (
                <div key={i} className="p-3 rounded-xl bg-surface-200 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {ep.method}
                    </span>
                    <span className="font-mono text-slate-200">{ep.path}</span>
                  </div>
                  <span className="text-slate-400">{ep.handler}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-surface-100 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="h-4 w-4 text-cyan-400" />
              Critical Business Functions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.importantFunctions.map((fn, i) => (
                <div key={i} className="p-4 rounded-xl bg-surface-200 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-cyan-300">{fn.name}()</span>
                    <Badge variant={fn.complexity === "HIGH" ? "warning" : "neutral"} size="sm">
                      {fn.complexity} Complexity
                    </Badge>
                  </div>
                  <p className="text-slate-400">{fn.purpose}</p>
                  <p className="text-[11px] font-mono text-slate-500">{fn.file}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 4: Risks */}
      {selectedTab === "risks" && (
        <div className="space-y-4">
          {project.risks.map((risk, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-surface-100 border border-slate-800 space-y-2 border-l-4 border-l-amber-500"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{risk.title}</span>
                <Badge variant={risk.severity === "HIGH" ? "danger" : "warning"} size="sm">
                  {risk.severity} SEVERITY
                </Badge>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{risk.description}</p>
              <p className="text-[11px] font-mono text-indigo-300">
                Target Component: {risk.affectedComponent}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectAnalyzePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400 font-mono">Loading Project Model...</div>}>
      <AuthGuard>
        <ProjectAnalyzeContent />
      </AuthGuard>
    </Suspense>
  );
}
