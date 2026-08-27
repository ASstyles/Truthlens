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
        { error: "Authentication session required" },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          },
        }
      );
    }

    const user = db.getUser(uid);
    const github = db.getUserGithub(uid);

    return NextResponse.json(
      {
        success: true,
        user: user || {
          uid,
          name: session.user?.name || session.email?.split("@")[0] || "Developer",
          email: session.email || "",
          role: "STUDENT",
        },
        githubConnected: Boolean(github?.accessToken),
        githubUsername: github?.username || user?.githubUsername || null,
        walletAddress: user?.walletAddress || null,
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
