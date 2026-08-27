import { NextRequest, NextResponse } from "next/server";
import { getLLMProvider } from "@/lib/ai/factory";
import { GeminiProvider } from "@/lib/ai/gemini.provider";
import { db, ActiveAssessmentSession } from "@/lib/firebase/mock-db";
import { DEMO_PROJECTS } from "@/lib/github/demo-projects";
import { AssessmentMode } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { projectId, mode = "INDEPENDENT", candidateName, candidateEmail, candidateUid, isDemo = false } = body;

    if (!candidateUid) {
      const headerUid = req.headers.get("x-user-uid");
      const sessionCookie = req.cookies.get("truthlens_user_session")?.value;
      if (headerUid) {
        candidateUid = headerUid;
      } else if (sessionCookie) {
        try {
          const parsed = JSON.parse(sessionCookie);
          candidateUid = parsed.uid;
          if (!candidateName) candidateName = parsed.name;
          if (!candidateEmail) candidateEmail = parsed.email;
        } catch {}
      }
    }

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId parameter" }, { status: 400 });
    }

    // Lookup project knowledge model
    let project = db.getProject(projectId);
    if (!project) {
      const demo = DEMO_PROJECTS.find(
        (d) => d.knowledgeModel.projectId === projectId || d.metadata.id === projectId
      );
      if (demo) {
        project = demo.knowledgeModel;
        db.saveProject(project);
      }
    }

    if (!project) {
      return NextResponse.json(
        { error: `Project '${projectId}' was not found. Please analyze the repository first.` },
        { status: 404 }
      );
    }

    const assessmentId = `eval-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const sessionId = `sec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const provider = getLLMProvider(isDemo);

    let initialQ;
    if (provider instanceof GeminiProvider) {
      initialQ = await provider.generateInitialQuestion(project, mode as AssessmentMode);
    } else {
      // Demo / Mock Provider
      const questions = await provider.generateAssessmentQuestions(project, 8);
      const first = questions[0];
      initialQ = {
        question: first.question,
        competency: first.category || "Architecture & Systems",
        category: first.category || "ARCHITECTURE",
        order: 1,
        expectedKeyPoints: first.expectedKeyPoints || ["Architecture", "Request flow"],
        contextHint: `Reference your components in ${project.projectName}.`,
      };
    }

    const session: ActiveAssessmentSession = {
      assessmentId,
      sessionId,
      projectId: project.projectId,
      projectName: project.projectName,
      candidateName: candidateName || "Developer",
      candidateEmail: candidateEmail || "developer@truthlens.io",
      candidateUid: candidateUid || `uid-${Date.now().toString(36)}`,
      mode: mode as AssessmentMode,
      isDemo: isDemo || false,
      totalQuestions: 8,
      currentTurn: 1,
      currentQuestion: initialQ,
      turns: [],
      integrityLog: [],
      integrityScore: 100,
      lastHeartbeat: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.createAssessmentSession(session);

    return NextResponse.json({
      success: true,
      assessmentId,
      sessionId,
      projectId: project.projectId,
      projectName: project.projectName,
      questionNumber: 1,
      totalQuestions: 8,
      question: initialQ.question,
      competency: initialQ.competency,
      category: initialQ.category,
      contextHint: initialQ.contextHint,
      mode,
      isDemo,
    });
  } catch (err: any) {
    console.error("Error in /api/assessment/start:", err);
    return NextResponse.json({ error: err.message || "Failed to start assessment" }, { status: 500 });
  }
}
