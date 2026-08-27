import { NextRequest, NextResponse } from "next/server";
import { getLLMProvider } from "@/lib/ai/factory";
import { GeminiProvider } from "@/lib/ai/gemini.provider";
import { db } from "@/lib/firebase/mock-db";
import { CompetencyReport, IntegritySummary } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { assessmentId, integrityEvents, integrityScore, multiTabPrevented, totalTimeSpentSeconds } = body;

    if (!assessmentId) {
      return NextResponse.json({ error: "Missing assessmentId parameter" }, { status: 400 });
    }

    const session = db.getAssessmentSession(assessmentId);
    if (!session) {
      return NextResponse.json({ error: "Assessment session not found" }, { status: 404 });
    }

    // Build final integrity summary
    const finalEvents = Array.isArray(integrityEvents) ? integrityEvents : session.integrityLog || [];
    const finalScore = typeof integrityScore === "number" ? integrityScore : session.integrityScore ?? 100;
    const finalStatus =
      finalScore >= 85
        ? "VERIFIED_SECURE"
        : finalScore >= 60
        ? "MINOR_FLAGS"
        : "INTEGRITY_REVIEW";

    const integritySummary: IntegritySummary = {
      integrityScore: finalScore,
      flagsCount: finalEvents.length,
      status: finalStatus,
      events: finalEvents,
      multiTabPrevented: Boolean(multiTabPrevented),
      totalTimeSpentSeconds: totalTimeSpentSeconds || 180,
    };

    if (session.report) {
      session.report.integritySummary = integritySummary;
      db.updateAssessmentSession(assessmentId, session);
      return NextResponse.json({ success: true, report: session.report });
    }

    const project = db.getProject(session.projectId);
    if (!project) {
      return NextResponse.json({ error: "Project model not found" }, { status: 404 });
    }

    const provider = getLLMProvider(session.isDemo);

    let finalReport: CompetencyReport;
    if (provider instanceof GeminiProvider) {
      finalReport = await provider.synthesizeFinalReport(
        project,
        session.turns,
        session.mode,
        session.candidateName,
        session.candidateEmail
      );
    } else {
      // Demo report synthesis
      const scores = session.turns.map((t) => t.score ?? 80);
      const overall = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 85;
      finalReport = {
        assessmentId,
        projectId: project.projectId,
        projectName: project.projectName,
        candidateUid: session.candidateUid,
        candidateName: session.candidateName,
        candidateEmail: session.candidateEmail,
        assessmentMode: session.mode,
        overallScore: overall,
        scoreBand: overall >= 85 ? "Highly Competent" : overall >= 70 ? "Proficient" : "Developing",
        assessmentLevel: overall >= 85 ? "Advanced" : overall >= 70 ? "Intermediate" : "Foundational",
        dimensionScores: [
          { dimension: "Project Understanding", score: overall + 2, weight: 0.15, label: "Project Understanding", summary: "Clear mental model of codebase topology." },
          { dimension: "Architecture & Systems", score: overall, weight: 0.15, label: "Architecture", summary: "Strong reasoning regarding service boundaries." },
          { dimension: "Code & Dependencies", score: overall - 1, weight: 0.15, label: "Code Navigation", summary: "Deep comprehension of third-party libraries." },
          { dimension: "Failure & Edge Cases", score: overall - 3, weight: 0.10, label: "Debugging", summary: "Anticipated failure modes and latency cascades." },
          { dimension: "Security & Auth", score: overall + 1, weight: 0.15, label: "Security", summary: "Clear understanding of access controls." },
          { dimension: "Technical Tradeoffs", score: overall - 2, weight: 0.10, label: "Decision Making", summary: "Pragmatic engineering judgement." },
          { dimension: "Scalability & Performance", score: overall, weight: 0.10, label: "Scalability", summary: "Load distribution and database bottlenecks." },
          { dimension: "Adaptation & Modification", score: overall + 1, weight: 0.10, label: "Adaptation", summary: "Capability to modify codebase for new features." },
        ],
        evidenceList: session.turns.flatMap((t, i) =>
          (t.strengths || []).map((st, j) => ({
            id: `ev-${i + 1}-${j + 1}`,
            category: (t.category as any) || "ARCHITECTURE",
            statement: st.startsWith("✓") ? st : `✓ ${st}`,
            demonstratedCompetence: (t.score && t.score >= 80 ? "STRONG" : t.score && t.score >= 60 ? "SATISFACTORY" : "PARTIAL") as "STRONG" | "SATISFACTORY" | "PARTIAL",
          }))
        ).slice(0, 6),
        strengths: [
          `Clear conceptual understanding of ${project.projectName} core mechanics.`,
          "Formulated viable defensive engineering responses.",
          "Demonstrated practical familiarity with implementation details.",
        ],
        weaknesses: [
          "Could elaborate further on automated deployment and canary validation.",
          "Opportunity to tighten fine-grained rate limiting under distributed loads.",
        ],
        executiveSummary: `${session.candidateName} demonstrated evidence-backed technical mastery of ${project.projectName}, navigating multi-turn architectural questions and failure scenarios with a calculated score of ${overall}%.`,
        verifiedTechnologies: [project.primaryLanguage, ...project.technologies.slice(0, 4)],
        assessedAt: new Date().toISOString(),
        version: "v1",
      };
    }

    finalReport.assessmentId = assessmentId;
    finalReport.candidateUid = session.candidateUid;
    finalReport.candidateName = session.candidateName;
    finalReport.candidateEmail = session.candidateEmail;
    finalReport.integritySummary = integritySummary;

    // Attach to session and database
    session.report = finalReport;
    session.integrityLog = finalEvents;
    session.integrityScore = finalScore;
    db.updateAssessmentSession(assessmentId, session);
    db.saveAssessment(assessmentId, [], [], finalReport);

    return NextResponse.json({
      success: true,
      report: finalReport,
    });
  } catch (err: any) {
    console.error("Error in /api/assessment/complete:", err);
    return NextResponse.json({ error: err.message || "Failed to complete assessment" }, { status: 500 });
  }
}
