import { NextRequest, NextResponse } from "next/server";
import { RepositoryMetadata } from "@/lib/types";
import { db } from "@/lib/firebase/mock-db";
import { getAuthenticatedSession } from "@/lib/auth/server-session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 1. Resolve initiating user UID strictly via server session
    const session = getAuthenticatedSession(req);
    const uid = session?.uid;

    if (!uid) {
      return NextResponse.json(
        { connected: false, username: null, count: 0, repos: [] },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
    }

    // 2. Look up user-specific GitHub record from server database strictly by UID
    const userGh = db.getUserGithub(uid);
    const token = userGh?.accessToken || null;
    const username = userGh?.username || null;

    const search = req.nextUrl.searchParams.get("q")?.toLowerCase() || "";

    // 3. If real GitHub token is present for this UID, retrieve authenticated user's real repositories
    if (token && token.trim().length > 10) {
      try {
        const ghRes = await fetch("https://api.github.com/user/repos?sort=updated&per_page=50&affiliation=owner,collaborator", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "TruthLens-Repository-Fetcher",
          },
          cache: "no-store",
        });

        if (ghRes.ok) {
          const ghData = await ghRes.json();
          if (Array.isArray(ghData)) {
            const realRepos: RepositoryMetadata[] = ghData.map((r: any) => ({
              id: `gh-${r.id}`,
              name: r.name,
              owner: r.owner?.login || "user",
              fullName: r.full_name,
              description: r.description || "No repository description provided.",
              language: r.language || "TypeScript",
              stars: r.stargazers_count || 0,
              forks: r.forks_count || 0,
              isPrivate: r.private || false,
              defaultBranch: r.default_branch || "main",
              lastUpdated: r.updated_at || new Date().toISOString(),
              url: r.html_url,
              topics: r.topics || [],
            }));

            const filtered = search
              ? realRepos.filter(
                  (r) =>
                    r.name.toLowerCase().includes(search) ||
                    (r.description && r.description.toLowerCase().includes(search)) ||
                    (r.language && r.language.toLowerCase().includes(search))
                )
              : realRepos;

            return NextResponse.json(
              {
                connected: true,
                username: username || (ghData[0]?.owner?.login ?? "connected-user"),
                count: filtered.length,
                repos: filtered,
              },
              {
                headers: {
                  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
                  Pragma: "no-cache",
                  Expires: "0",
                },
              }
            );
          }
        } else if (ghRes.status === 401 && uid) {
          db.deleteUserGithub(uid);
          return NextResponse.json(
            { connected: false, username: null, count: 0, repos: [], error: "token_expired" },
            {
              headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
                Pragma: "no-cache",
                Expires: "0",
              },
            }
          );
        }
      } catch (ghErr: any) {
        console.error("[TruthLens GitHub Repos] Error communicating with GitHub API:", ghErr);
      }
    }

    // 4. If not connected for this UID, return connected: false with empty list (zero cross-user leakage)
    return NextResponse.json(
      {
        connected: false,
        username: null,
        count: 0,
        repos: [],
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
