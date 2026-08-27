import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/mock-db";
import { UserProfile } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin || "http://localhost:3000").trim().replace(/\/+$/, "");
  const redirectUri = `${appUrl}/api/auth/github/callback`;

  // 1. Handle cancellation or OAuth error from GitHub
  if (error) {
    console.warn("[TruthLens GitHub OAuth] GitHub returned authorization error:", error, errorDescription);
    const redirectUrl = new URL(`/dashboard?error=${encodeURIComponent(errorDescription || error)}`, appUrl);
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Validate authorization code presence
  if (!code) {
    console.error("[TruthLens GitHub OAuth] Missing authorization code in callback");
    const redirectUrl = new URL("/dashboard?error=missing_oauth_code", appUrl);
    return NextResponse.redirect(redirectUrl);
  }

  // 3. Verify anti-CSRF state token and resolve initiating user UID
  if (!state) {
    console.error("[TruthLens GitHub OAuth] Missing state parameter in callback");
    const redirectUrl = new URL("/dashboard?error=missing_oauth_state", appUrl);
    return NextResponse.redirect(redirectUrl);
  }

  const stateRecord = db.getOAuthState(state);
  const cookieState = req.cookies.get("github_oauth_state")?.value;
  const cookieUid = req.cookies.get("github_oauth_uid")?.value;

  let targetUid = stateRecord?.uid || cookieUid;

  if (!stateRecord && (!cookieState || cookieState !== state)) {
    console.error("[TruthLens GitHub OAuth] Invalid or expired OAuth state token");
    const redirectUrl = new URL("/dashboard?error=invalid_or_expired_oauth_state", appUrl);
    return NextResponse.redirect(redirectUrl);
  }

  if (!targetUid) {
    console.error("[TruthLens GitHub OAuth] No initiating user found for OAuth state");
    const redirectUrl = new URL("/dashboard?error=oauth_initiator_not_found", appUrl);
    return NextResponse.redirect(redirectUrl);
  }

  // 4. Verify client credentials
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("[TruthLens GitHub OAuth] Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET on server");
    const redirectUrl = new URL("/dashboard?error=github_credentials_not_configured", appUrl);
    return NextResponse.redirect(redirectUrl);
  }

  try {
    // 5. Server-side authorization code exchange for GitHub access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "TruthLens-OAuth",
      },
      body: JSON.stringify({
        client_id: clientId.trim(),
        client_secret: clientSecret.trim(),
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error(`[TruthLens GitHub OAuth] Token exchange HTTP error (${tokenRes.status}):`, errText);
      const redirectUrl = new URL(`/dashboard?error=token_exchange_http_${tokenRes.status}`, appUrl);
      return NextResponse.redirect(redirectUrl);
    }

    const tokenData = await tokenRes.json();

    if (tokenData.error || !tokenData.access_token) {
      console.error("[TruthLens GitHub OAuth] Token exchange returned error:", tokenData);
      const redirectUrl = new URL(
        `/dashboard?error=${encodeURIComponent(tokenData.error_description || tokenData.error || "token_exchange_failed")}`,
        appUrl
      );
      return NextResponse.redirect(redirectUrl);
    }

    const accessToken = tokenData.access_token;

    // 6. Retrieve authenticated GitHub user profile using the fresh token
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "TruthLens-OAuth",
      },
    });

    let githubUsername = "github-user";
    let githubAvatar = "";
    let githubName = "";
    let githubEmail = "";

    if (userRes.ok) {
      const userData = await userRes.json();
      githubUsername = userData.login || githubUsername;
      githubAvatar = userData.avatar_url || "";
      githubName = userData.name || githubUsername;
      githubEmail = userData.email || `${githubUsername}@users.noreply.github.com`;
    }

    // 7. Check if GitHub account is already linked to another TruthLens user (Requirement 7)
    const existingOwnerUid = db.findUserByGithubUsername(githubUsername);
    if (existingOwnerUid && existingOwnerUid !== targetUid) {
      db.deleteOAuthState(state);
      const conflictMsg = `The GitHub account @${githubUsername} is already linked to another TruthLens account. Please authorize with your own GitHub account.`;
      console.warn(`[TruthLens GitHub OAuth] Conflict: GitHub @${githubUsername} already owned by ${existingOwnerUid}`);
      const redirectUrl = new URL(`/dashboard?error=${encodeURIComponent(conflictMsg)}`, appUrl);
      return NextResponse.redirect(redirectUrl);
    }

    // 8. Associate GitHub account strictly with target TruthLens UID in server database
    db.saveUserGithub(targetUid, {
      accessToken,
      username: githubUsername,
      avatarUrl: githubAvatar,
    });

    let userProfile = db.getUser(targetUid);
    if (!userProfile) {
      userProfile = {
        uid: targetUid,
        name: githubName || githubUsername,
        email: githubEmail,
        photoURL: githubAvatar,
        githubUsername: githubUsername,
        role: "STUDENT",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.saveUser(userProfile);
    } else {
      userProfile.githubUsername = githubUsername;
      if (githubAvatar && !userProfile.photoURL) {
        userProfile.photoURL = githubAvatar;
      }
      db.saveUser(userProfile);
    }

    // 9. Clean up used state
    db.deleteOAuthState(state);

    if (process.env.NODE_ENV !== "production") {
      console.log(`[TruthLens GitHub OAuth] Successfully bound GitHub @${githubUsername} to TruthLens UID: ${targetUid}`);
    }

    // 10. Redirect to dashboard with success notification
    const successUrl = new URL(`/dashboard?github_connected=true&username=${encodeURIComponent(githubUsername)}`, appUrl);
    const response = NextResponse.redirect(successUrl);

    // Clean up temporary OAuth cookies
    response.cookies.delete("github_oauth_state");
    response.cookies.delete("github_oauth_uid");

    return response;
  } catch (err: any) {
    console.error("[TruthLens GitHub OAuth] Callback processing exception:", err);
    const redirectUrl = new URL(`/dashboard?error=${encodeURIComponent(err.message || "callback_exception")}`, appUrl);
    return NextResponse.redirect(redirectUrl);
  }
}
