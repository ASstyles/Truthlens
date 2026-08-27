"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Cpu,
  Sparkles,
  ArrowRight,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  ShieldCheck,
  Code2,
  Terminal,
  Bot,
  Zap,
  Check,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  BookOpen,
  Lock,
  ShieldAlert,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DEMO_PROJECTS } from "@/lib/github/demo-projects";
import { useAuth } from "@/lib/firebase/auth-context";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AssessmentMode } from "@/lib/types";
import { useSecureAssessment } from "@/lib/assessment/secure-mode";

interface TurnHistoryItem {
  questionNumber: number;
  question: string;
  competency: string;
  answer: string;
  score?: number;
  strengths?: string[];
  weaknesses?: string[];
  reasoning?: string;
}

function AssessmentWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || "demo-apex-dex";

  const { user } = useAuth();

  const [mode, setMode] = useState<AssessmentMode>("INDEPENDENT");
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>("Project Assessment");
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(8);

  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [currentCompetency, setCurrentCompetency] = useState<string>("Architecture & Systems");
  const [contextHint, setContextHint] = useState<string>("");

  const [currentAnswer, setCurrentAnswer] = useState("");
  const [turnHistory, setTurnHistory] = useState<TurnHistoryItem[]>([]);
  const [latestEvaluation, setLatestEvaluation] = useState<any | null>(null);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Timer State
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // 1. Secure Assessment Mode Engine
  const {
    integrityScore,
    integrityEvents,
    isMultiTabLocked,
    lastWarning,
    clearWarning,
    recordIntegrityEvent,
  } = useSecureAssessment({
    isActive: !loadingInitial && !completing && Boolean(assessmentId),
    assessmentId,
    turnNumber: questionNumber,
  });

  // Elapsed timer tick
  useEffect(() => {
    if (loadingInitial || completing) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [loadingInitial, completing]);

  // Auto-dismiss security warning toast after 4 seconds
  useEffect(() => {
    if (lastWarning) {
      const timer = setTimeout(() => {
        clearWarning();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [lastWarning, clearWarning]);

  // Auto-save draft answer in localStorage
  useEffect(() => {
    if (!assessmentId || !currentAnswer) return;
    const saveKey = `truthlens_draft_${assessmentId}_${questionNumber}`;
    localStorage.setItem(saveKey, currentAnswer);
    setLastSavedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
  }, [currentAnswer, assessmentId, questionNumber]);

  // Restore draft if available
  useEffect(() => {
    if (assessmentId) {
      const saveKey = `truthlens_draft_${assessmentId}_${questionNumber}`;
      const saved = localStorage.getItem(saveKey);
      if (saved && !currentAnswer) {
        setCurrentAnswer(saved);
      }
    }
  }, [assessmentId, questionNumber]);

  useEffect(() => {
    startAssessmentSession();
  }, [projectId]);

  const startAssessmentSession = async () => {
    setLoadingInitial(true);
    setApiError(null);

    try {
      const res = await fetch("/api/assessment/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          mode,
          candidateName: user ? user.name : "Candidate",
          candidateEmail: user ? user.email : "developer@truthlens.io",
          candidateUid: user ? user.uid : undefined,
          isDemo: false,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to start assessment session");
      }

      setAssessmentId(data.assessmentId);
      setProjectName(data.projectName || "Project Assessment");
      setQuestionNumber(data.questionNumber || 1);
      setTotalQuestions(data.totalQuestions || 8);
      setCurrentQuestion(data.question);
      setCurrentCompetency(data.competency || "Architecture & Systems");
      setContextHint(data.contextHint || "");
    } catch (err: any) {
      console.error("Failed to start assessment:", err);
      setApiError(err.message || "Failed to connect to Gemini AI. Please check your API key.");
    } finally {
      setLoadingInitial(false);
    }
  };

  const handleAnswerSubmit = async () => {
    const trimmed = currentAnswer.trim();
    if (!trimmed || !assessmentId || evaluating || completing) return;

    setEvaluating(true);
    setApiError(null);

    try {
      const res = await fetch("/api/assessment/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId,
          answer: trimmed,
          questionNumber,
          integrityEvents,
          integrityScore,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to evaluate answer. You can retry.");
      }

      // Clear draft for completed turn
      if (typeof window !== "undefined") {
        localStorage.removeItem(`truthlens_draft_${assessmentId}_${questionNumber}`);
      }

      // Record in local history
      setTurnHistory((prev) => [
        ...prev,
        {
          questionNumber,
          question: currentQuestion,
          competency: currentCompetency,
          answer: trimmed,
          score: data.evaluation?.score,
          strengths: data.evaluation?.strengths,
          weaknesses: data.evaluation?.weaknesses,
          reasoning: data.evaluation?.reasoning,
        },
      ]);

      setLatestEvaluation(data.evaluation);

      // Check if assessment complete
      if (data.isComplete) {
        completeAssessment();
        return;
      }

      // Advance to next question
      setQuestionNumber(data.questionNumber);
      setCurrentQuestion(data.nextQuestion);
      setCurrentCompetency(data.nextCompetency || "Technical Reasoning");
      setContextHint(`Adaptive follow-up targeting ${data.nextCompetency || "Technical Reasoning"}.`);
      setCurrentAnswer("");
    } catch (err: any) {
      console.error("Answer submission failed:", err);
      setApiError(err.message || "Taking longer than expected. You can retry your submission.");
    } finally {
      setEvaluating(false);
    }
  };

  const completeAssessment = async () => {
    if (!assessmentId) return;
    setCompleting(true);

    try {
      const res = await fetch("/api/assessment/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId,
          integrityEvents,
          integrityScore,
          multiTabPrevented: isMultiTabLocked,
          totalTimeSpentSeconds: elapsedSeconds,
        }),
      });

      const data = await res.json();
      if (data.report) {
        router.push(`/dashboard/report/${data.report.assessmentId}`);
      } else {
        router.push(`/dashboard/report/${assessmentId}`);
      }
    } catch (err) {
      console.error("Failed to complete assessment:", err);
      router.push(`/dashboard/report/${assessmentId}`);
    }
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loadingInitial) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-6 max-w-lg mx-auto text-center px-4">
        <div className="relative">
          <div className="h-16 w-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <Bot className="h-7 w-7 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="space-y-2">
          <h2 className="text-base font-bold text-white">Gemini AI Formulating Project Assessment</h2>
          <p className="text-xs text-slate-400 font-mono">
            Grounding questions in repository architecture, dependencies, and failure modes...
          </p>
        </div>
      </div>
    );
  }

  // Multi-Tab Collision Lock Screen
  if (isMultiTabLocked) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="h-16 w-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-glass">
          <Lock className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white">Assessment Session Locked</h1>
          <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
            This assessment is already active in another browser tab or window. To maintain strict evaluation integrity, simultaneous multi-tab sessions are prohibited.
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-surface-100 border border-slate-800 text-xs font-mono text-slate-400 max-w-md mx-auto">
          Please close duplicate tabs and continue in your original active assessment window.
        </div>
      </div>
    );
  }

  if (apiError && !currentQuestion) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="h-14 w-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
          <AlertCircle className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white">Assessment Engine Notice</h1>
          <p className="text-xs text-slate-400 leading-relaxed">{apiError}</p>
        </div>
        <div className="flex justify-center gap-3">
          <Button variant="cyan" size="md" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={startAssessmentSession}>
            Retry Assessment
          </Button>
          <Button variant="secondary" size="md" onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(((questionNumber - 1) / totalQuestions) * 100);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 select-none">
      {/* Floating Security Alert Toast */}
      {lastWarning && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-sm p-4 rounded-2xl bg-surface-200/95 border border-amber-500/50 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-4 flex items-start gap-3">
          <div className="h-8 w-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div className="flex-1 space-y-0.5">
            <h4 className="text-xs font-bold text-white">Security Event Logged</h4>
            <p className="text-[11px] text-slate-300 leading-tight">{lastWarning.details}</p>
            <p className="text-[10px] font-mono text-amber-400/80 pt-0.5">Integrity Score: {integrityScore}%</p>
          </div>
          <button onClick={clearWarning} className="text-slate-400 hover:text-white p-1">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Top Session Status Bar */}
      <div className="p-6 rounded-3xl bg-surface-200/90 border border-slate-800 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-glass">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">TRUTHLENS ASSESSMENT</span>
            <Badge variant="cyan" size="sm">{projectName}</Badge>
            <Badge variant="primary" size="sm">
              {mode === "INDEPENDENT" ? "Independent Mode" : "AI-Assisted Mode"}
            </Badge>

            {/* Secure Mode Active Indicator */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono font-medium">
              <Lock className="h-3 w-3" />
              <span>Secure Assessment Active</span>
            </div>

            {/* Integrity Status Badge */}
            <div
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold border ${
                integrityScore >= 85
                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                  : integrityScore >= 60
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                  : "bg-red-500/10 border-red-500/30 text-red-300"
              }`}
            >
              <ShieldCheck className="h-3 w-3" />
              <span>{integrityScore}% Integrity</span>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            Proof-of-Competence Interrogation
          </h1>
          <p className="text-xs text-slate-400">
            Target Dimension: <span className="text-indigo-300 font-semibold">{currentCompetency}</span>
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1 text-slate-300">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span>{formatTimer(elapsedSeconds)}</span>
            </div>
            <span>•</span>
            <div>
              Question <span className="text-cyan-400 font-bold">{questionNumber}</span> of {totalQuestions}
            </div>
          </div>
          <div className="w-48 h-2 bg-surface-100 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${Math.max(5, progressPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Mode Switcher Banner */}
      <div className="p-3.5 rounded-2xl bg-surface-100/70 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Zap className="h-4 w-4 text-cyan-400" />
          <span>
            <strong>Evaluation Mode:</strong>{" "}
            {mode === "INDEPENDENT"
              ? "Independent Mode — Evaluates self-contained reasoning without external AI tooling."
              : "AI-Assisted Mode — Evaluates effective oversight, validation, and debugging of AI-assisted code."}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMode("INDEPENDENT")}
            className={`px-3 py-1 rounded-lg font-mono text-[11px] transition-colors ${
              mode === "INDEPENDENT"
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Independent
          </button>
          <button
            onClick={() => setMode("AI_ASSISTED")}
            className={`px-3 py-1 rounded-lg font-mono text-[11px] transition-colors ${
              mode === "AI_ASSISTED"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            AI-Assisted
          </button>
        </div>
      </div>

      {/* API Error Notification (if non-fatal) */}
      {apiError && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <span>{apiError}</span>
          </div>
          <Button size="sm" variant="outline" className="border-red-500/30 text-red-300" onClick={() => setApiError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Main Question Terminal Card */}
      <Card variant="glow" className="space-y-6 p-6 sm:p-8 relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-mono text-slate-300 uppercase tracking-wider font-bold">
              QUESTION {questionNumber} • {currentCompetency}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {lastSavedTime && (
              <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                <Save className="h-3 w-3" /> Autosaved {lastSavedTime}
              </span>
            )}
            <Badge variant="primary" size="sm">Gemini Adaptive Engine</Badge>
          </div>
        </div>

        {/* Question Prompt (Copy-Protected) */}
        <div
          className="space-y-3 select-none"
          onCopy={(e) => {
            e.preventDefault();
            recordIntegrityEvent("COPY_ATTEMPT", "Attempted to copy question prompt text", "LOW");
          }}
        >
          <div className="text-base sm:text-lg font-medium text-white leading-relaxed font-sans">
            {currentQuestion}
          </div>
          {contextHint && (
            <p className="text-xs font-mono text-indigo-300/90 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              {contextHint}
            </p>
          )}
        </div>

        {/* Answer Textarea (Paste-Protected & Alphanumeric Permitted) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Your Technical Explanation / Architecture Reasoning:</span>
            <span className="font-mono text-[11px]">{currentAnswer.length} characters</span>
          </div>
          <textarea
            rows={7}
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            onPaste={(e) => {
              e.preventDefault();
              recordIntegrityEvent("PASTE_ATTEMPT", "Attempted to paste external code/text into answer field", "MEDIUM");
            }}
            onCopy={(e) => {
              e.preventDefault();
              recordIntegrityEvent("COPY_ATTEMPT", "Attempted to copy assessment text", "LOW");
            }}
            placeholder="Explain your implementation, service boundaries, edge case mitigations, or trade-offs..."
            disabled={evaluating || completing}
            className="w-full bg-surface-100 border border-slate-700/80 rounded-2xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono leading-relaxed select-text"
          />
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className="text-[11px] text-slate-500 font-mono">
            Responses are dynamically scored against repository topology, test cases, and failure constraints.
          </p>

          <Button
            size="lg"
            variant="cyan"
            rightIcon={evaluating || completing ? undefined : <Send className="h-4 w-4" />}
            isLoading={evaluating || completing}
            disabled={!currentAnswer.trim() || evaluating || completing}
            onClick={handleAnswerSubmit}
          >
            {evaluating
              ? "Gemini Evaluating Answer..."
              : completing
              ? "Synthesizing Proof-of-Competence Report..."
              : questionNumber >= totalQuestions
              ? "Submit & Complete Assessment"
              : "Submit Answer →"}
          </Button>
        </div>
      </Card>

      {/* Latest Evaluation Feedback Card */}
      {latestEvaluation && (
        <Card variant="glass" className="p-6 space-y-3 border-l-4 border-l-cyan-400">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-cyan-300 font-bold uppercase">
              Previous Turn Evaluation ({latestEvaluation.competency})
            </span>
            <Badge variant="success" size="sm">Awarded Score: {latestEvaluation.score}/100</Badge>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed italic">
            &ldquo;{latestEvaluation.reasoning}&rdquo;
          </p>
          {latestEvaluation.strengths && latestEvaluation.strengths.length > 0 && (
            <div className="space-y-1 pt-1">
              {latestEvaluation.strengths.map((st: string, idx: number) => (
                <p key={idx} className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 shrink-0" /> {st}
                </p>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Turn History Accordion */}
      {turnHistory.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setHistoryOpen(!historyOpen)}
            className="w-full p-4 rounded-2xl bg-surface-100/60 border border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <span>Assessment Interaction History ({turnHistory.length} turns evaluated)</span>
            {historyOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {historyOpen && (
            <div className="space-y-4">
              {turnHistory.map((turn, i) => (
                <Card key={i} variant="glass" className="p-5 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-indigo-400 font-bold">
                      Turn {turn.questionNumber} • {turn.competency}
                    </span>
                    {turn.score !== undefined && (
                      <Badge variant="success" size="sm">Score: {turn.score}%</Badge>
                    )}
                  </div>
                  <p className="font-medium text-white">{turn.question}</p>
                  <div className="p-3 rounded-xl bg-surface-200 font-mono text-slate-300 text-[11px] leading-relaxed">
                    {turn.answer}
                  </div>
                  {turn.reasoning && (
                    <p className="text-[11px] text-slate-400 italic">Evaluator: {turn.reasoning}</p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AssessmentWizardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400 font-mono">Loading Assessment Engine...</div>}>
      <AuthGuard>
        <AssessmentWizardContent />
      </AuthGuard>
    </Suspense>
  );
}
