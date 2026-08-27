import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/mock-db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { credentialId, reason } = body;

    if (!credentialId) {
      return NextResponse.json({ error: "Missing credentialId" }, { status: 400 });
    }

    const success = db.revokeCredential(credentialId, reason || "Administrative / Integrity Revocation");
    if (!success) {
      return NextResponse.json({ error: "Credential not found" }, { status: 404 });
    }

    const updated = db.getCredential(credentialId);
    return NextResponse.json({
      success: true,
      credential: updated,
      message: `Credential ${credentialId} marked as REVOKED.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
