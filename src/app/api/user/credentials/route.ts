import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/mock-db";
import { getAuthenticatedSession } from "@/lib/auth/server-session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = getAuthenticatedSession(req);
    const uid = session?.uid;

    if (!uid) {
      return NextResponse.json(
        { success: true, count: 0, credentials: [] },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
    }

    const credentials = db.getUserCredentials(uid);
    return NextResponse.json(
      {
        success: true,
        count: credentials.length,
        credentials,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
