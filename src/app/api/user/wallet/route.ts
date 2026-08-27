import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/mock-db";
import { getAuthenticatedSession } from "@/lib/auth/server-session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = getAuthenticatedSession(req);
    const body = await req.json().catch(() => ({}));
    const uid = session?.uid || body.uid;

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

    const walletAddress = body.walletAddress || null;
    const updatedUser = db.updateUserWallet(uid, walletAddress);

    return NextResponse.json(
      {
        success: true,
        walletAddress: updatedUser?.walletAddress || null,
        user: updatedUser,
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
