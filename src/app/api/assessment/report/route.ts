import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/mock-db";
import { getAuthenticatedSession } from "@/lib/auth/server-session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing assessment id parameter" }, { status: 400 });
    }

    const sessionUser = getAuthenticatedSession(req);
    const session = db.getAssessmentSession(id);

    if (session && session.report) {
      // IDOR Protection: Verify caller is the assessment owner
      if (session.candidateUid && sessionUser && sessionUser.uid !== session.candidateUid) {
        return NextResponse.json(
          { error: "Access denied: this assessment belongs to another candidate" },
          {
            status: 403,
            headers: {
              "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
            },
          }
        );
      }

      return NextResponse.json(
        { success: true, report: session.report },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          },
        }
      );
    }

    const legacy = db.getAssessment(id);
    if (legacy && legacy.report) {
      if (legacy.report.candidateUid && sessionUser && sessionUser.uid !== legacy.report.candidateUid) {
        return NextResponse.json(
          { error: "Access denied: this assessment belongs to another candidate" },
          { status: 403 }
        );
      }
      return NextResponse.json({ success: true, report: legacy.report });
    }

    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
