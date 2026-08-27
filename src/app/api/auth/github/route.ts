import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/firebase/mock-db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId || clientId.trim().length === 0) {
      console.error("[TruthLens GitHub OAuth] GITHUB_CLIENT_ID is not configured in .env.local");
      const errorUrl = new URL("/dashboard?error=github_client_id_missing", req.url);
      return NextResponse.redirect(errorUrl);
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin || "http://localhost:3000").trim().replace(/\/+$/, "");
    const redirectUri = `${appUrl}/api/auth/github/callback`;

    // 1. Extract initiating user UID and optional targetEmail
    let uid = req.nextUrl.searchParams.get("uid");
    let targetEmail = req.nextUrl.searchParams.get("email") || undefined;

    if (!uid) {
      const sessionCookie = req.cookies.get("truthlens_user_session")?.value;
      if (sessionCookie) {
        try {
          const parsed = JSON.parse(sessionCookie);
          uid = parsed.uid;
          if (!targetEmail) targetEmail = parsed.email;
        } catch {}
      }
    }

    if (!uid) {
      console.warn("[TruthLens GitHub OAuth] Unauthorized attempt to initiate GitHub OAuth without TruthLens UID");
      const errorUrl = new URL("/login?error=auth_required_for_github", req.url);
      return NextResponse.redirect(errorUrl);
    }

    // 2. Invalidate previous GitHub connection for this user before reconnecting (Requirement 9)
    db.deleteUserGithub(uid);

    // 3. Generate cryptographically secure anti-CSRF state token
    const state = crypto.randomBytes(32).toString("hex");

    // 4. Register state in server database tied strictly to this TruthLens candidate UID
    db.saveOAuthState(state, {
      uid,
      targetEmail,
    });

    // 5. Build GitHub OAuth URL
    const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
    githubAuthUrl.searchParams.set("client_id", clientId.trim());
    githubAuthUrl.searchParams.set("redirect_uri", redirectUri);
    githubAuthUrl.searchParams.set("scope", "read:user repo");
    githubAuthUrl.searchParams.set("state", state);
    githubAuthUrl.searchParams.set("allow_signup", "true");

    if (process.env.NODE_ENV !== "production") {
      console.log(`[TruthLens GitHub OAuth] Starting OAuth for UID: ${uid} -> ${redirectUri}`);
    }

    const response = NextResponse.redirect(githubAuthUrl.toString());

    // 6. Set temporary OAuth cookies
    response.cookies.set({
      name: "github_oauth_state",
      value: state,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    response.cookies.set({
      name: "github_oauth_uid",
      value: uid,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("[TruthLens GitHub OAuth] Initialization error:", err);
    const errorUrl = new URL(`/dashboard?error=${encodeURIComponent(err.message || "oauth_init_failed")}`, req.url);
    return NextResponse.redirect(errorUrl);
  }
}
