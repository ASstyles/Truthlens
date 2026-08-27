"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  GitBranch,
  ShieldCheck,
  ArrowRight,
  Cpu,
  Layers,
  Search,
  ExternalLink,
  Plus,
  Lock,
  CheckCircle,
  FolderGit2,
  Github,
  User,
  AlertCircle,
  Check,
  XCircle,
  Unlink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/firebase/auth-context";
import { DEMO_PROJECTS } from "@/lib/github/demo-projects";
import { RepositoryMetadata, SoulboundCredential } from "@/lib/types";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");
  const justConnected = searchParams.get("github_connected") === "true";

  const {
    user,
    githubConnected,
    githubUsername,
    connectGithub,
    disconnectGithub,
  } = useAuth();

  const [repos, setRepos] = useState<RepositoryMetadata[]>([]);
  const [userCredentials, setUserCredentials] = useState<SoulboundCredential[]>([]);
  const [loadingCredentials, setLoadingCredentials] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customRepoUrl, setCustomRepoUrl] = useState("");
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  // Fetch repos whenever user or github connection changes
  useEffect(() => {
    setRepos([]);
    setUserCredentials([]);
    if (user?.uid) {
      fetchRepos();
      fetchUserCredentials();
    }
  }, [user?.uid, githubConnected]);

  const fetchUserCredentials = async () => {
    if (!user?.uid) return;
    setLoadingCredentials(true);
    try {
      const res = await fetch(`/api/user/credentials`);
      if (res.ok) {
        const data = await res.json();
        setUserCredentials(Array.isArray(data.credentials) ? data.credentials : []);
      }
    } catch (e) {
      console.warn("Failed to fetch user credentials:", e);
      setUserCredentials([]);
    } finally {
      setLoadingCredentials(false);
    }
  };

  const fetchRepos = async () => {
    if (!user?.uid) {
      setRepos([]);
      return;
    }
    setLoadingRepos(true);
    try {
      const res = await fetch(`/api/github/repos`);
      const data = await res.json();
      if (data.connected && Array.isArray(data.repos)) {
        setRepos(data.repos);
      } else {
        setRepos([]);
      }
    } catch (e) {
      console.warn("Failed to fetch repos:", e);
      setRepos([]);
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleSelectRepo = async (repo: RepositoryMetadata) => {
    setAnalyzingId(repo.id);
    try {
      const res = await fetch("/api/github/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoId: repo.id,
          repoName: repo.name,
          repoUrl: repo.url,
          uid: user?.uid,
        }),
      });

      const data = await res.json();
      if (data.knowledgeModel) {
        router.push(`/dashboard/analyze?id=${data.knowledgeModel.projectId}`);
      }
    } catch (err) {
      console.error("Analysis failed:", err);
      router.push(`/dashboard/analyze?id=${repo.id}`);
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleCustomRepoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRepoUrl.trim()) return;

    setAnalyzingId("custom");
    const name = customRepoUrl.split("/").pop() || "custom-repo";
    try {
      const res = await fetch("/api/github/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoName: name,
          repoUrl: customRepoUrl,
          uid: user?.uid,
        }),
      });
      const data = await res.json();
      if (data.knowledgeModel) {
        router.push(`/dashboard/analyze?id=${data.knowledgeModel.projectId}`);
      }
    } catch {
      router.push(`/dashboard`);
    } finally {
      setAnalyzingId(null);
    }
  };

  const filteredRepos = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return repos;
    return repos.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.language.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q))
    );
  }, [repos, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* OAUTH ERROR ALERT */}
      {oauthError && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-3 text-red-300 text-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-400 shrink-0" />
            <span>
              <strong>GitHub OAuth Notice:</strong> {oauthError}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-red-500/40 text-red-300 hover:bg-red-500/20"
            onClick={() => router.replace("/dashboard")}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* OAUTH SUCCESS BANNER */}
      {justConnected && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-emerald-300 text-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              <strong>GitHub Connected:</strong> Successfully connected @{githubUsername || "account"}! Your personal repositories are now imported.
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20"
            onClick={() => router.replace("/dashboard")}
          >
            Got it
          </Button>
        </div>
      )}

      {/* 1. CANDIDATE PROFILE BAR */}
      <div className="p-6 rounded-3xl bg-surface-200/90 border border-slate-800 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-glass">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 p-0.5 shrink-0 shadow-glow">
            <div className="h-full w-full rounded-2xl bg-surface-300 flex items-center justify-center text-white font-bold text-lg">
              {user ? (
                user.photoURL ? (
                  <img src={user.photoURL} alt={user.name} className="h-full w-full rounded-2xl object-cover" />
                ) : (
                  user.name.slice(0, 2).toUpperCase()
                )
              ) : (
                <User className="h-6 w-6 text-indigo-400" />
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">
                {user ? user.name : "Authenticated Developer"}
              </h1>
              <Badge variant="cyan" size="sm">Verified Session</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Email: <span className="text-slate-200 font-medium">{user?.email || "N/A"}</span>
              {user?.uid && (
                <span className="text-slate-500 text-[10px] ml-2">UID: {user.uid.slice(0, 10)}...</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {githubConnected ? (
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-medium">
                <Github className="h-3.5 w-3.5" />
                @{githubUsername || "connected"}
              </div>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Unlink className="h-3.5 w-3.5 text-red-400" />}
                className="text-xs text-slate-300 hover:text-red-400 border-slate-700 hover:border-red-500/30"
                onClick={disconnectGithub}
              >
                Disconnect GitHub
              </Button>
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

          <Link href="/verify">
            <Button size="sm" variant="secondary" rightIcon={<ExternalLink className="h-3.5 w-3.5" />}>
              Public Verification
            </Button>
          </Link>
        </div>
      </div>

      {/* GITHUB OAUTH CONNECTION PROMPT (If GitHub not connected) */}
      {!githubConnected && (
        <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
              <Github className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Connect Your GitHub Account</h3>
              <p className="text-xs text-slate-300">
                Grant TruthLens read-only access to import and evaluate your personal repositories.
              </p>
            </div>
          </div>
          <Button
            variant="cyan"
            size="sm"
            leftIcon={<Github className="h-4 w-4" />}
            onClick={connectGithub}
          >
            Authorize GitHub OAuth
          </Button>
        </div>
      )}

      {/* 2. REPOSITORY SELECTOR */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FolderGit2 className="h-5 w-5 text-indigo-400" />
              {githubConnected ? `Repositories for @${githubUsername || "user"}` : "Select Repository for Competence Audit"}
            </h2>
            <p className="text-xs text-slate-400">
              {githubConnected
                ? `Connected to GitHub account @${githubUsername}. Select a codebase to synthesize the knowledge model.`
                : "Select an active codebase or input a public repository URL to begin."}
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search repository or tech..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-100 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
        </div>

        {loadingRepos ? (
          <div className="p-12 text-center space-y-3">
            <div className="h-8 w-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-slate-400">Fetching repositories from GitHub API...</p>
          </div>
        ) : filteredRepos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredRepos.map((repo) => {
              const isAnalyzing = analyzingId === repo.id;
              return (
                <Card key={repo.id} variant="glass" className="flex flex-col justify-between space-y-4 hover:border-indigo-500/40">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {repo.name}
                      </h3>
                      <Badge variant="cyan" size="sm">{repo.language}</Badge>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {repo.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>⭐ {repo.stars} stars</span>
                      <span>🌿 {repo.defaultBranch}</span>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      leftIcon={<Cpu className="h-3.5 w-3.5" />}
                      onClick={() => handleSelectRepo(repo)}
                      isLoading={isAnalyzing}
                    >
                      Analyze & Launch Assessment
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-surface-100 border border-slate-800 text-center space-y-3">
            <div className="h-10 w-10 rounded-full bg-surface-200 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
              <FolderGit2 className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">No Repositories Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Connect your GitHub account or input a public repository URL below to start.
            </p>
            {!githubConnected && (
              <Button size="sm" variant="cyan" leftIcon={<Github className="h-3.5 w-3.5" />} onClick={connectGithub}>
                Connect GitHub
              </Button>
            )}
          </div>
        )}

        <div className="p-4 rounded-2xl bg-surface-100/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Plus className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-medium text-slate-300">
              Audit custom public GitHub repository URL:
            </span>
          </div>
          <form onSubmit={handleCustomRepoSubmit} className="flex gap-2 w-full sm:w-auto">
            <input
              type="url"
              placeholder="https://github.com/username/project"
              value={customRepoUrl}
              onChange={(e) => setCustomRepoUrl(e.target.value)}
              className="bg-surface-200 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-full sm:w-72 font-mono"
            />
            <Button size="sm" variant="secondary" type="submit" isLoading={analyzingId === "custom"}>
              Analyze
            </Button>
          </form>
        </div>
      </div>

      {/* 3. ACTIVE SOULBOUND CREDENTIALS HUB (ISOLATED PER USER) */}
      <div className="space-y-4 pt-6 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            Verifiable Soulbound Credentials
          </h2>
          <Badge variant="cyan" size="sm">Polygon Amoy Testnet</Badge>
        </div>

        {loadingCredentials ? (
          <div className="p-8 text-center space-y-2">
            <div className="h-6 w-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-slate-400">Loading your credentials...</p>
          </div>
        ) : userCredentials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userCredentials.map((cred) => (
              <Card key={cred.credentialId} variant="glow" className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                      CREDENTIAL: {cred.credentialId}
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      {cred.projectName}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {cred.verifiedTechnologies.join(" • ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-extrabold text-emerald-400">{cred.overallScore}%</span>
                    <p className="text-[10px] text-slate-400">{cred.scoreBand}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface-200/80 border border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Status:</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> ACTIVE (Non-Transferable)
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400 font-mono text-[11px]">
                    <span>Anchor Standard:</span>
                    <span className="text-indigo-300">ERC-5192 Minimal Soulbound Token</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-500 font-mono">{cred.credentialId}</span>
                  <Link href={`/verify/${cred.credentialId}`}>
                    <Button size="sm" variant="cyan" rightIcon={<ExternalLink className="h-3 w-3" />}>
                      View Public 7-Layer Verification
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card variant="glass" className="flex flex-col items-center justify-center text-center p-8 border-dashed border-slate-700/80 space-y-3">
            <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">No assessment completed yet</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              You haven&apos;t completed any project evaluations on this account yet. Select a repository above to begin your Proof-of-Competence interrogation.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400 font-mono">Loading Dashboard...</div>}>
      <AuthGuard>
        <DashboardContent />
      </AuthGuard>
    </Suspense>
  );
}
