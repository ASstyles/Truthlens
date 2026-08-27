import { NextRequest, NextResponse } from "next/server";
import { getLLMProvider } from "@/lib/ai/factory";
import { db } from "@/lib/firebase/mock-db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, question, candidateAnswer, threadHistory } = body;

    const project = db.getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const provider = getLLMProvider();
    const followUp = await provider.generateAdaptiveFollowUp(
      project,
      question,
      candidateAnswer,
      threadHistory || []
    );

    return NextResponse.json({
      success: true,
      provider: provider.name,
      followUp,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
