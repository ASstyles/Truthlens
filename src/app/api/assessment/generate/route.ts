import { NextRequest, NextResponse } from "next/server";
import { getLLMProvider } from "@/lib/ai/factory";
import { db } from "@/lib/firebase/mock-db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, count } = body;

    const project = db.getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found in database" }, { status: 404 });
    }

    const provider = getLLMProvider();
    const questions = await provider.generateAssessmentQuestions(project, count || 4);

    return NextResponse.json({
      success: true,
      provider: provider.name,
      questions,
      projectId: project.projectId,
      projectName: project.projectName,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
