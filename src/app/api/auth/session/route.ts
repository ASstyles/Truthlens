import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/mock-db";
import { UserProfile } from "@/lib/types";

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid");
  if (!uid) {
    return NextResponse.json({ error: "Missing user identifier parameter (uid)" }, { status: 400 });
  }

  const user = db.getUser(uid);
  if (!user) {
    return NextResponse.json({ error: "User profile not found" }, { status: 404 });
  }
  return NextResponse.json({ user });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.uid && !body.email && !body.idToken) {
      return NextResponse.json({ error: "Missing required user identity fields" }, { status: 400 });
    }

    const uid = body.uid || `usr-${Date.now().toString(36)}`;
    const existing = db.getUser(uid);

    const user: UserProfile = {
      uid,
      name: body.name || existing?.name || (body.email ? body.email.split("@")[0] : "Developer"),
      email: body.email || existing?.email || "",
      photoURL: body.photoURL || existing?.photoURL,
      githubUsername: body.githubUsername || existing?.githubUsername,
      walletAddress: body.walletAddress !== undefined ? body.walletAddress : existing?.walletAddress,
      role: body.role || existing?.role || "STUDENT",
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.saveUser(user);

    if (body.githubToken && body.githubUsername) {
      db.saveUserGithub(uid, {
        accessToken: body.githubToken,
        username: body.githubUsername,
        avatarUrl: body.photoURL,
      });
    }

    const response = NextResponse.json({ success: true, user });

    // Set server session cookie
    response.cookies.set({
      name: "truthlens_user_session",
      value: JSON.stringify(user),
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "Session cleared" });
  response.cookies.delete("truthlens_user_session");
  response.cookies.delete("github_token");
  response.cookies.delete("github_username");
  response.cookies.delete("github_connected");
  response.cookies.delete("github_oauth_state");
  response.cookies.delete("github_oauth_uid");
  return response;
}
