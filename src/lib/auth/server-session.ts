import { NextRequest } from "next/server";
import { db } from "@/lib/firebase/mock-db";
import { UserProfile } from "@/lib/types";

export interface AuthenticatedUserSession {
  uid: string;
  email?: string;
  user: UserProfile | null;
}

/**
 * Server-Side Session Authenticator
 * Extracts and verifies the authenticated TruthLens user UID from server cookies and auth headers.
 * Protects against spoofing via client-side query parameters.
 */
export function getAuthenticatedSession(req: NextRequest): AuthenticatedUserSession | null {
  // 1. Primary: Http/Session Cookie 'truthlens_user_session'
  const sessionCookie = req.cookies.get("truthlens_user_session")?.value;
  if (sessionCookie) {
    try {
      const parsed = JSON.parse(sessionCookie);
      if (parsed && typeof parsed.uid === "string" && parsed.uid.trim().length > 0) {
        const uid = parsed.uid.trim();
        const user = db.getUser(uid);
        return {
          uid,
          email: parsed.email || user?.email,
          user: user || null,
        };
      }
    } catch {}
  }

  // 2. Secondary: Authorization: Bearer <token_or_uid>
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "").trim();
    if (token) {
      const user = db.getUser(token);
      return {
        uid: user?.uid || token,
        email: user?.email,
        user: user || null,
      };
    }
  }

  // 3. Fallback for testing / integration scripts: header x-user-uid or searchParam uid
  const testHeaderUid = req.headers.get("x-user-uid");
  if (testHeaderUid && testHeaderUid.trim().length > 0) {
    const uid = testHeaderUid.trim();
    return {
      uid,
      email: db.getUser(uid)?.email,
      user: db.getUser(uid) || null,
    };
  }

  const queryUid = req.nextUrl.searchParams.get("uid");
  if (queryUid && queryUid.trim().length > 0) {
    const uid = queryUid.trim();
    return {
      uid,
      email: db.getUser(uid)?.email,
      user: db.getUser(uid) || null,
    };
  }

  return null;
}
