import { NextRequest, NextResponse } from "next/server";
import { getLLMProvider } from "@/lib/ai/factory";
import { db } from "@/lib/firebase/mock-db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, responses, mode, candidateName, candidateEmail } = body;

    const project = db.getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const provider = getLLMProvider();
    const report = await provider.evaluateCompetency(
      project,
      responses || [],
      mode || "INDEPENDENT",
      candidateName || "Verified Developer",
      candidateEmail || "developer@truthlens.io"
    );

    // Persist assessment record in database
    db.saveAssessment(report.assessmentId, [], responses || [], report);

    return NextResponse.json({
      success: true,
      provider: provider.name,
      report,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
