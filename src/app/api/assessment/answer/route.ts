import { NextRequest, NextResponse } from "next/server";
import { getLLMProvider } from "@/lib/ai/factory";
import { GeminiProvider } from "@/lib/ai/gemini.provider";
import { db } from "@/lib/firebase/mock-db";
import { IntegrityEvent } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { assessmentId, answer, questionNumber, integrityEvents, integrityScore } = body;

    if (!assessmentId) {
      return NextResponse.json({ error: "Missing assessmentId parameter" }, { status: 400 });
    }

    if (!answer || answer.trim().length === 0) {
      return NextResponse.json({ error: "Answer cannot be empty" }, { status: 400 });
    }

    const session = db.getAssessmentSession(assessmentId);
    if (!session) {
      return NextResponse.json({ error: "Assessment session not found" }, { status: 404 });
    }

    const project = db.getProject(session.projectId);
    if (!project) {
      return NextResponse.json({ error: "Project model not found" }, { status: 404 });
    }

    // Sync client integrity events into server session log
    if (Array.isArray(integrityEvents)) {
      session.integrityLog = integrityEvents;
    }
    if (typeof integrityScore === "number") {
      session.integrityScore = integrityScore;
    }
    session.lastHeartbeat = new Date().toISOString();

    const provider = getLLMProvider(session.isDemo);
    const currentQ = session.currentQuestion;

    let evalResult;
    if (provider instanceof GeminiProvider) {
      evalResult = await provider.evaluateAnswerAndGenerateFollowUp(
        project,
        {
          question: currentQ.question,
          competency: currentQ.competency,
          category: currentQ.category,
          order: currentQ.order,
        },
        answer,
        session.turns,
        session.mode,
        session.totalQuestions
      );
    } else {
      // Demo evaluation calculation
      const wordCount = answer.split(/\s+/).length;
      const score = Math.min(95, Math.max(55, 60 + Math.round(wordCount * 0.35)));
      const isComplete = currentQ.order >= session.totalQuestions;
      const internalDifficulty: "EASY" | "MEDIUM" | "HARD" = score >= 80 ? "HARD" : score >= 60 ? "MEDIUM" : "EASY";

      let nextQ = "";
      if (!isComplete) {
        if (internalDifficulty === "HARD") {
          nextQ = `If ${session.projectName} suddenly got 20 times more requests, what would break first and how would you fix it?`;
        } else if (internalDifficulty === "MEDIUM") {
          nextQ = `If this database query or API endpoint became slow, how would you investigate it?`;
        } else {
          nextQ = `Why did you choose this approach in ${session.projectName}, and what is the main benefit?`;
        }
      }

      evalResult = {
        score,
        competency: currentQ.competency,
        strengths: [`✓ Articulated key implementation details for ${currentQ.competency}`],
        weaknesses: ["Could provide deeper architectural tradeoffs under scaling loads."],
        reasoning: "Answer aligned with codebase conventions.",
        nextQuestion: nextQ,
        nextCompetency: "Failure & Edge Cases",
        internalDifficulty,
        isComplete,
      };
    }

    // Record turn in session (with internal difficulty tracking)
    session.turns.push({
      questionNumber: currentQ.order,
      question: currentQ.question,
      competency: currentQ.competency,
      category: currentQ.category,
      answer,
      score: evalResult.score,
      strengths: evalResult.strengths,
      weaknesses: evalResult.weaknesses,
      reasoning: evalResult.reasoning,
      internalDifficulty: evalResult.internalDifficulty,
    });

    const nextOrder = currentQ.order + 1;
    const isComplete = evalResult.isComplete || nextOrder > session.totalQuestions;

    if (!isComplete) {
      session.currentTurn = nextOrder;
      session.currentQuestion = {
        question: evalResult.nextQuestion,
        competency: evalResult.nextCompetency,
        category: "ADAPTIVE",
        order: nextOrder,
        contextHint: `Adaptive follow-up derived from your previous response regarding ${currentQ.competency}.`,
      };
    }

    db.updateAssessmentSession(assessmentId, session);

    return NextResponse.json({
      success: true,
      evaluation: {
        score: evalResult.score,
        competency: evalResult.competency,
        strengths: evalResult.strengths,
        weaknesses: evalResult.weaknesses,
        reasoning: evalResult.reasoning,
      },
      nextQuestion: evalResult.nextQuestion,
      nextCompetency: evalResult.nextCompetency,
      questionNumber: nextOrder,
      totalQuestions: session.totalQuestions,
      isComplete,
    });
  } catch (err: any) {
    console.error("Error in /api/assessment/answer:", err);
    return NextResponse.json({ error: err.message || "Failed to evaluate answer" }, { status: 500 });
  }
}
