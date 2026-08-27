import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/mock-db";

export async function POST(req: NextRequest) {
  let uid = req.nextUrl.searchParams.get("uid") || req.headers.get("x-user-uid");
  if (!uid) {
    const sessionCookie = req.cookies.get("truthlens_user_session")?.value;
    if (sessionCookie) {
      try {
        const parsed = JSON.parse(sessionCookie);
        uid = parsed.uid;
      } catch {}
    }
  }

  if (uid) {
    db.deleteUserGithub(uid);
  }

  const response = NextResponse.json({ success: true, message: "GitHub disconnected" });
  response.cookies.delete("github_token");
  response.cookies.delete("github_username");
  response.cookies.delete("github_avatar");
  response.cookies.delete("github_connected");
  response.cookies.delete("github_oauth_state");
  response.cookies.delete("github_oauth_uid");

  return response;
}

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin || "http://localhost:3000";
  let uid = req.nextUrl.searchParams.get("uid");
  if (!uid) {
    const sessionCookie = req.cookies.get("truthlens_user_session")?.value;
    if (sessionCookie) {
      try {
        const parsed = JSON.parse(sessionCookie);
        uid = parsed.uid;
      } catch {}
    }
  }

  if (uid) {
    db.deleteUserGithub(uid);
  }

  const response = NextResponse.redirect(new URL("/dashboard", baseUrl));
  response.cookies.delete("github_token");
  response.cookies.delete("github_username");
  response.cookies.delete("github_avatar");
  response.cookies.delete("github_connected");
  response.cookies.delete("github_oauth_state");
  response.cookies.delete("github_oauth_uid");

  return response;
}
