import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getWorkspaceByUser, initUserWorkspace } from "@/lib/workspace";

export async function GET() {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let workspace = await getWorkspaceByUser(session.user.id);

    // Auto-create workspace for users registered before this feature was added
    if (!workspace) {
      await initUserWorkspace(session.user.id, session.user.email);
      workspace = await getWorkspaceByUser(session.user.id);
    }

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    return NextResponse.json({ workspace });
  } catch (error) {
    console.error("GET /api/workspaces error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
